export const P66_START_GET_SECONDS = 102 * 60 * 60 + 43 * 60 + 23

export type LandingStatus = 'flying' | 'landed' | 'hard-landing'
export type LandingSite = 'crater' | 'boulders' | 'plain' | 'overshoot'
export type LandingObjective = {
  readonly id: 'clear-crater' | 'clear-boulders' | 'arrest-forward' | 'slow-descent' | 'touchdown' | 'complete' | 'failed'
  readonly instruction: string
  readonly controlHint: string
}

export type LandingState = {
  readonly getSeconds: number
  readonly altitudeFt: number
  readonly verticalSpeedFps: number
  readonly forwardPositionFt: number
  readonly forwardSpeedFps: number
  readonly descentRateCommandFps: number
  readonly fuelSeconds: number
  readonly status: LandingStatus
}

export type LandingInput = {
  /** Positive values reduce the commanded rate of descent. */
  readonly rateCommand: number
  /** Adapted pitch/attitude command; positive values accelerate along the landing track. */
  readonly forwardCommand: number
}

export type LandingAnnunciatorTone = 'off' | 'ready' | 'caution' | 'danger'
export type LandingAnnunciator = {
  readonly id: 'crater' | 'site' | 'forward' | 'vertical' | 'fuel' | 'contact'
  readonly label: 'CRTR' | 'SITE' | 'FWD' | 'VERT' | 'FUEL' | 'CONT'
  readonly tone: LandingAnnunciatorTone
}

export const INITIAL_LANDING_STATE: LandingState = {
  getSeconds: P66_START_GET_SECONDS,
  altitudeFt: 450,
  verticalSpeedFps: -6,
  forwardPositionFt: 0,
  forwardSpeedFps: 22,
  descentRateCommandFps: -6,
  fuelSeconds: 115,
  status: 'flying',
}

/** Authored entry point for the current terminal-descent gameplay slice. */
export const P66_TERMINAL_START_STATE: LandingState = {
  ...INITIAL_LANDING_STATE,
  getSeconds: INITIAL_LANDING_STATE.getSeconds + 37,
  altitudeFt: 200,
  verticalSpeedFps: -4,
  forwardPositionFt: 900,
  forwardSpeedFps: 12,
  descentRateCommandFps: -4,
  fuelSeconds: 75,
}

export const classifyLandingSite = (downrangeFt: number): LandingSite => {
  if (downrangeFt < 1_050) return 'crater'
  if (downrangeFt < 1_280) return 'boulders'
  if (downrangeFt <= 2_200) return 'plain'
  return 'overshoot'
}

export const getLandingObjective = (state: LandingState): LandingObjective => {
  if (state.status === 'landed') {
    return { id: 'complete', instruction: 'EAGLE HAS LANDED', controlHint: 'CONTACT LIGHT · ENGINE STOP' }
  }
  if (state.status === 'hard-landing') {
    return { id: 'failed', instruction: 'LOSS OF MISSION', controlHint: 'PRESS R TO TRY AGAIN' }
  }

  const site = classifyLandingSite(state.forwardPositionFt)
  if (site === 'crater') {
    return { id: 'clear-crater', instruction: 'FLY BEYOND THE CRATER', controlHint: 'KEEP MOVING FORWARD · DO NOT LAND' }
  }
  if (site === 'boulders') {
    return { id: 'clear-boulders', instruction: 'CLEAR THE BOULDER FIELD', controlHint: 'KEEP MOVING FORWARD · FIND OPEN GROUND' }
  }
  if (site === 'overshoot') {
    return { id: 'arrest-forward', instruction: 'YOU PASSED THE LANDING PLAIN', controlHint: 'HOLD A TO RETURN' }
  }
  if (Math.abs(state.forwardSpeedFps) > 8) {
    return {
      id: 'arrest-forward',
      instruction: 'SLOW FORWARD MOTION',
      controlHint: state.forwardSpeedFps > 0 ? 'HOLD A UNTIL FWD IS 8 OR LESS' : 'HOLD D UNTIL FWD IS 8 OR LESS',
    }
  }
  if (Math.abs(state.verticalSpeedFps) > 6) {
    return { id: 'slow-descent', instruction: 'SLOW THE DESCENT', controlHint: 'HOLD W UNTIL VERT IS 6 OR LESS' }
  }
  return { id: 'touchdown', instruction: 'DESCEND ON THE CLEAR PLAIN', controlHint: 'KEEP FWD ≤ 8 · KEEP VERT ≤ 6' }
}

/** Gameplay annunciators for the provisional cockpit, not an LM-5 panel reconstruction. */
export const getLandingAnnunciators = (state: LandingState): readonly LandingAnnunciator[] => {
  const site = classifyLandingSite(state.forwardPositionFt)
  const conditionTone = (ready: boolean): LandingAnnunciatorTone => {
    if (ready) return 'ready'
    return state.status === 'hard-landing' ? 'danger' : 'caution'
  }

  return [
    {
      id: 'crater',
      label: 'CRTR',
      tone: conditionTone(state.forwardPositionFt >= 1_050),
    },
    { id: 'site', label: 'SITE', tone: conditionTone(site === 'plain') },
    {
      id: 'forward',
      label: 'FWD',
      tone: conditionTone(Math.abs(state.forwardSpeedFps) <= 8),
    },
    {
      id: 'vertical',
      label: 'VERT',
      tone: conditionTone(Math.abs(state.verticalSpeedFps) <= 6),
    },
    {
      id: 'fuel',
      label: 'FUEL',
      tone: state.fuelSeconds <= 0 ? 'danger' : state.fuelSeconds <= 30 ? 'caution' : 'ready',
    },
    {
      id: 'contact',
      label: 'CONT',
      tone: state.status === 'landed' ? 'ready' : state.status === 'hard-landing' ? 'danger' : 'off',
    },
  ]
}

export const formatGet = (seconds: number): string => {
  const whole = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(whole / 3_600)
  const minutes = Math.floor((whole % 3_600) / 60)
  const remainder = whole % 60
  return `${String(hours).padStart(3, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value))

/**
 * Game-specific terminal-descent model for Eagle, not a general physics layer.
 *
 * Historical anchor: the crew selected P66 for the final manual landing and continued
 * downrange to avoid the crater and boulder field. The values here are provisional
 * play-model adaptations, not reconstructed LM telemetry. Before fidelity lock they will
 * be calibrated against the Apollo 11 Mission Report and LM Operations Handbook:
 * https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf
 * https://www.nasa.gov/wp-content/uploads/static/history/alsj/lm10handbookvol1.pdf
 */
export const stepLanding = (
  state: LandingState,
  input: LandingInput,
  elapsedSeconds: number,
): LandingState => {
  if (state.status !== 'flying' || elapsedSeconds <= 0) return state

  const dt = Math.min(elapsedSeconds, 0.1)
  const rateCommand = clamp(input.rateCommand, -1, 1)
  const forwardCommand = clamp(input.forwardCommand, -1, 1)
  const descentRateCommandFps = clamp(
    state.descentRateCommandFps + rateCommand * 2.4 * dt,
    -14,
    -2,
  )

  // Positive is upward. The controller holds the selected descent rate while propellant
  // remains; lunar gravity is 5.31 ft/s². Direct throttle authority is intentionally not
  // exposed because P66 gave the commander rate-of-descent control, not an arcade gas pedal.
  const lunarGravityFps2 = 5.31
  const available = state.fuelSeconds > 0
  const verticalThrustFps2 = available
    ? clamp(lunarGravityFps2 + (descentRateCommandFps - state.verticalSpeedFps) * 0.9, 0, 16)
    : 0
  const verticalAccelerationFps2 = verticalThrustFps2 - lunarGravityFps2
  const verticalSpeedFps = state.verticalSpeedFps + verticalAccelerationFps2 * dt

  // The single-axis input compresses Armstrong's attitude control into its consequence for
  // forward velocity. It is not presented as a translational hand-controller simulation.
  const forwardAccelerationFps2 = available ? forwardCommand * 3.2 : 0
  const forwardSpeedFps = clamp(
    state.forwardSpeedFps + forwardAccelerationFps2 * dt,
    -10,
    38,
  )
  const forwardPositionFt = state.forwardPositionFt + forwardSpeedFps * dt
  const altitudeFt = state.altitudeFt + verticalSpeedFps * dt

  const thrustLoad = verticalThrustFps2 / lunarGravityFps2
  const attitudeLoad = Math.abs(forwardCommand) * 0.08
  const fuelSeconds = Math.max(0, state.fuelSeconds - dt * (0.72 + thrustLoad * 0.28 + attitudeLoad))

  if (altitudeFt > 0) {
    return {
      getSeconds: state.getSeconds + dt,
      altitudeFt,
      verticalSpeedFps,
      forwardPositionFt,
      forwardSpeedFps,
      descentRateCommandFps,
      fuelSeconds,
      status: 'flying',
    }
  }

  const site = classifyLandingSite(forwardPositionFt)
  const controlled = Math.abs(verticalSpeedFps) <= 6 && Math.abs(forwardSpeedFps) <= 8
  return {
    getSeconds: state.getSeconds + dt,
    altitudeFt: 0,
    verticalSpeedFps,
    forwardPositionFt,
    forwardSpeedFps,
    descentRateCommandFps,
    fuelSeconds,
    status: controlled && site === 'plain' ? 'landed' : 'hard-landing',
  }
}
