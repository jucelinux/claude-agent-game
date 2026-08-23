export const LAUNCH_EVIDENCE = {
  missionReport: 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf',
  pressKit: 'https://ntrs.nasa.gov/citations/19690022248',
  prelaunchReport: 'https://www.apollojournals.org/afj/ap11fj/pdf/a11-prelaunch-rep1.pdf',
  launchChecklist: 'https://www.apollojournals.org/afj/ap11fj/a11-locindex.html',
  transcript: 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html',
  debrief: 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html',
  nasaHistory: 'https://www.nasa.gov/history/50-years-ago-the-journey-to-the-moon-begins/',
} as const

export const LAUNCH_START_SECONDS = -(2 * 3_600 + 38 * 60)
export const AUTOMATIC_SEQUENCE_SECONDS = -190
export const IGNITION_SEQUENCE_SECONDS = -8.9
export const ALL_ENGINES_RUNNING_SECONDS = -2
export const LIFTOFF_SECONDS = 0
export const TOWER_CLEAR_SECONDS = 12
// A stable countdown span is presented as a short authored passage after one explicit player
// action. The historical clock remains continuous and still stops at every unresolved procedure.
export const PRELAUNCH_ACCELERATION = 900

export type ArmstrongWindowPose = {
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly ignitionLight: number
}

/**
 * Base motion of the Pad 39A exterior behind Armstrong's fixed window. Nearby structure and the
 * horizon move down as Columbia rises; the image shrinks slightly as the pad recedes. High-rate
 * vibration remains a Phaser camera/optical effect layered over this mission-specific pose.
 */
export const getArmstrongWindowPose = (clockSeconds: number): ArmstrongWindowPose => {
  const liftoffProgress = clamp(clockSeconds / TOWER_CLEAR_SECONDS, 0, 1)
  const ignitionLight = clamp(
    (clockSeconds - IGNITION_SEQUENCE_SECONDS) / Math.abs(IGNITION_SEQUENCE_SECONDS),
    0,
    1,
  )
  return {
    x: 110 - liftoffProgress * 18,
    y: -34 + liftoffProgress * 92,
    scale: 1.25 - liftoffProgress * 0.08,
    ignitionLight,
  }
}

export type LaunchEvidenceClass = 'flown' | 'plan' | 'adaptation'
export type LaunchStation = 'collins-right' | 'crew-forward' | 'armstrong-left'
export type LaunchStatus =
  | 'prelaunch'
  | 'terminal-count'
  | 'ignition'
  | 'liftoff'
  | 'tower-clear'
  | 'complete'
  | 'scrubbed'

export type LaunchControlId =
  | 'inspect-strut'
  | 'request-pad-support'
  | 'verify-relock'
  | 'mcc-command-link'
  | 'eds-test'
  | 'les-indicator'
  | 'eds-auto'
  | 'lv-rates-auto'
  | 'two-eng-out-auto'
  | 'cte-update'
  | 'rhc-direct-a'
  | 'rhc-direct-b'
  | 'fc-react-latch'
  | 'secondary-cooling-off'
  | 'tvc-servo-1'
  | 'tvc-servo-2'
  | 'launch-comm-check'
  | 'dsky-p02'
  | 'v75-no-enter'
  | 'tape-forward'
  | 'glycol-bypass'
  | 'main-bus-tie-a'
  | 'main-bus-tie-b'
  | 'pad-comm-off'
  | 'gdc-align'
  | 'liftoff-light'
  | 'met-running'
  | 'tower-view'

export type LaunchProcedureId =
  | 'ingress-relock'
  | 'command-link'
  | 'eds-verification'
  | 'les-armed'
  | 'boost-safety'
  | 'guidance-reference'
  | 'fuel-cell-reactants'
  | 'secondary-cooling'
  | 'tvc-servo-power'
  | 'final-communications'
  | 'launch-computer'
  | 'glycol-bypass'
  | 'main-bus-ties'
  | 'pad-communications'
  | 'gdc-alignment'
  | 'clock-running'
  | 'tower-clear'

export type LaunchProcedure = {
  readonly id: LaunchProcedureId
  readonly dueSeconds: number
  readonly station: LaunchStation
  readonly title: string
  readonly command: string
  readonly acceptance: string
  readonly callout: string
  readonly controls: readonly LaunchControlId[]
  readonly evidenceClass: LaunchEvidenceClass
  readonly source: string
}

/**
 * Mission-specific launch procedure for Apollo 11. This is game content, not a generic
 * checklist or timeline engine.
 *
 * Planned prelaunch times: Apollo 11 Press Kit, pp. 18–20.
 * Boost configuration and late handwritten changes: flown Launch Operations Checklist,
 * L2-1 through L2-3.
 * Ingress irregularity and tower-clear sensation: Technical Crew Debriefing, §§1.8, 3.1–3.5.
 */
export const LAUNCH_PROCEDURES: readonly LaunchProcedure[] = [
  {
    id: 'ingress-relock',
    dueSeconds: LAUNCH_START_SECONDS,
    station: 'collins-right',
    title: 'SECURE THE LAUNCH POSITION',
    command: 'NUMBER 2 RHC IS FOUL OF THE SHOCK-STRUT RELEASE',
    acceptance: 'RHC CLEAR · STRUT RELEASE RE-LOCKED',
    callout: 'RELEASE RE-LOCKED',
    controls: ['inspect-strut', 'request-pad-support', 'verify-relock'],
    evidenceClass: 'flown',
    source: LAUNCH_EVIDENCE.debrief,
  },
  {
    id: 'command-link',
    dueSeconds: -6_900,
    station: 'crew-forward',
    title: 'VERIFY COMMAND LINK',
    command: 'MCC-HOUSTON / SPACECRAFT COMMAND CHECK',
    acceptance: 'COMMAND LINK RECEIVED AND READ BACK',
    callout: 'HOUSTON COMMAND LINK VERIFIED',
    controls: ['mcc-command-link'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.pressKit,
  },
  {
    id: 'eds-verification',
    dueSeconds: -6_600,
    station: 'crew-forward',
    title: 'VERIFY ABORT ADVISORY',
    command: 'EMERGENCY DETECTION SYSTEM TEST',
    acceptance: 'EDS TEST INDICATIONS NOMINAL',
    callout: 'EDS TEST COMPLETE',
    controls: ['eds-test'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.pressKit,
  },
  {
    id: 'les-armed',
    dueSeconds: -2_520,
    station: 'crew-forward',
    title: 'CONFIRM ESCAPE SYSTEM',
    command: 'ACCESS ARM STANDBY · LAUNCH ESCAPE SYSTEM ARMED',
    acceptance: 'LES ARMED INDICATION AGREES WITH GROUND CALL',
    callout: 'LAUNCH ESCAPE SYSTEM ARMED',
    controls: ['les-indicator'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.pressKit,
  },
  {
    id: 'boost-safety',
    dueSeconds: -1_200,
    station: 'crew-forward',
    title: 'ESTABLISH BOOST SAFETY',
    command: 'EDS AUTO · LV RATES AUTO · 2 ENG OUT AUTO',
    acceptance: 'THREE AUTOMATIC SAFETY FUNCTIONS SET',
    callout: 'BOOST SAFETY CHAIN SET',
    controls: ['eds-auto', 'lv-rates-auto', 'two-eng-out-auto'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'guidance-reference',
    dueSeconds: -900,
    station: 'crew-forward',
    title: 'VERIFY GUIDANCE REFERENCE',
    command: 'CTE UPDATE · DIRECT CONTROLLER POWER',
    acceptance: 'LAUNCH ATTITUDE AND BOTH DIRECT POWER FEEDS VERIFIED',
    callout: 'GUIDANCE REFERENCE VERIFIED',
    controls: ['cte-update', 'rhc-direct-a', 'rhc-direct-b'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'fuel-cell-reactants',
    dueSeconds: -600,
    station: 'crew-forward',
    title: 'LATCH REACTANT VALVES',
    command: 'FC REACT VALVES — LATCH',
    acceptance: 'FUEL-CELL REACTANT VALVES LATCHED',
    callout: 'REACTANT VALVES LATCHED',
    controls: ['fc-react-latch'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'secondary-cooling',
    dueSeconds: -510,
    station: 'crew-forward',
    title: 'CONFIGURE COOLING LOOP',
    command: 'SECONDARY COOLING LOOP PUMP — OFF',
    acceptance: 'SECONDARY LOOP PUMP OFF VERIFIED',
    callout: 'SECONDARY COOLING OFF',
    controls: ['secondary-cooling-off'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'tvc-servo-power',
    dueSeconds: -360,
    station: 'crew-forward',
    title: 'POWER TVC SERVOS',
    command: 'SCS TVC SERVO POWER 1 AND 2',
    acceptance: 'AC1/MNA AND AC2/MNB FEEDS VERIFIED',
    callout: 'TVC SERVO POWER VERIFIED',
    controls: ['tvc-servo-1', 'tvc-servo-2'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'final-communications',
    dueSeconds: -240,
    station: 'crew-forward',
    title: 'FINAL COMM CHECK',
    command: 'ASTRO LAUNCH OPERATIONS COMM CHECK',
    acceptance: 'LAUNCH OPERATIONS LOOP CLEAR',
    callout: 'LAUNCH COMM CLEAR',
    controls: ['launch-comm-check'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'launch-computer',
    dueSeconds: -180,
    station: 'crew-forward',
    title: 'VERIFY LAUNCH COMPUTER',
    command: 'DSKY P02 · V75 NO ENTER · TAPE FORWARD',
    acceptance: 'P02 DISPLAYED · V75 STAGED · RECORDER FORWARD',
    callout: 'LAUNCH PROGRAM VERIFIED',
    controls: ['dsky-p02', 'v75-no-enter', 'tape-forward'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'glycol-bypass',
    dueSeconds: -135,
    station: 'crew-forward',
    title: 'BYPASS PRIMARY RADIATOR',
    command: 'PRIMARY GLYCOL TO RADIATOR — BYPASS',
    acceptance: 'PRIMARY GLYCOL BYPASS INDICATED',
    callout: 'PRIMARY GLYCOL BYPASS',
    controls: ['glycol-bypass'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'main-bus-ties',
    dueSeconds: -75,
    station: 'crew-forward',
    title: 'CLOSE MAIN BUS TIES',
    command: 'MAIN BUS TIE 1 AND 2 — ON',
    acceptance: 'BOTH MAIN BUS TIES ON',
    callout: 'MAIN BUS TIES ON',
    controls: ['main-bus-tie-a', 'main-bus-tie-b'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'pad-communications',
    dueSeconds: -60,
    station: 'crew-forward',
    title: 'LEAVE PAD COMM',
    command: 'PAD COMM 1 AND 2 — OFF',
    acceptance: 'PAD COMM OFF · FLIGHT LOOP RETAINED',
    callout: 'PAD COMM OFF',
    controls: ['pad-comm-off'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'gdc-alignment',
    dueSeconds: -45,
    station: 'crew-forward',
    title: 'FINAL GDC ALIGNMENT',
    command: 'GDC ALIGN · FDAI 2 TOTAL ATTITUDE — NO MOTION',
    acceptance: 'GDC ALIGNED · FDAI 2 STABLE',
    callout: 'GDC ALIGN GOOD',
    controls: ['gdc-align'],
    evidenceClass: 'plan',
    source: LAUNCH_EVIDENCE.launchChecklist,
  },
  {
    id: 'clock-running',
    dueSeconds: 4,
    station: 'armstrong-left',
    title: 'VERIFY LIFTOFF',
    command: 'LIFTOFF LIGHT · MISSION EVENT TIMER',
    acceptance: 'LIFTOFF VERIFIED · CLOCK COUNTING UP',
    callout: 'CLOCK',
    controls: ['liftoff-light', 'met-running'],
    evidenceClass: 'flown',
    source: LAUNCH_EVIDENCE.transcript,
  },
  {
    id: 'tower-clear',
    dueSeconds: TOWER_CLEAR_SECONDS,
    station: 'armstrong-left',
    title: 'CONFIRM TOWER CLEAR',
    command: 'VISUAL CLEARANCE · CONTROL HANDOFF',
    acceptance: 'TOWER CLEAR · HOUSTON HAS THE FLIGHT',
    callout: 'TOWER CLEAR',
    controls: ['tower-view'],
    evidenceClass: 'flown',
    source: LAUNCH_EVIDENCE.debrief,
  },
]

export type LaunchState = {
  readonly clockSeconds: number
  readonly procedureIndex: number
  readonly activeControls: readonly LaunchControlId[]
  readonly completedProcedures: readonly LaunchProcedureId[]
  readonly mistakes: number
  readonly status: LaunchStatus
  readonly timeRate: number
}

export type LaunchInput = {
  readonly accelerate: boolean
}

export const INITIAL_LAUNCH_STATE: LaunchState = {
  clockSeconds: LAUNCH_START_SECONDS,
  procedureIndex: 0,
  activeControls: [],
  completedProcedures: [],
  mistakes: 0,
  status: 'prelaunch',
  timeRate: 0,
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

const derivedStatus = (clockSeconds: number): LaunchStatus => {
  if (clockSeconds >= TOWER_CLEAR_SECONDS) return 'tower-clear'
  if (clockSeconds >= LIFTOFF_SECONDS) return 'liftoff'
  if (clockSeconds >= IGNITION_SEQUENCE_SECONDS) return 'ignition'
  if (clockSeconds >= AUTOMATIC_SEQUENCE_SECONDS) return 'terminal-count'
  return 'prelaunch'
}

export const getCurrentLaunchProcedure = (state: LaunchState): LaunchProcedure | null =>
  LAUNCH_PROCEDURES[state.procedureIndex] ?? null

export const isLaunchProcedureDue = (state: LaunchState): boolean => {
  const procedure = getCurrentLaunchProcedure(state)
  return procedure !== null && state.clockSeconds >= procedure.dueSeconds
}

export const canVerifyLaunchProcedure = (state: LaunchState): boolean => {
  const procedure = getCurrentLaunchProcedure(state)
  return procedure !== null
    && isLaunchProcedureDue(state)
    && procedure.controls.every((control) => state.activeControls.includes(control))
}

export const activateLaunchControl = (
  state: LaunchState,
  control: LaunchControlId,
): LaunchState => {
  if (state.status === 'complete' || state.status === 'scrubbed') return state
  const procedure = getCurrentLaunchProcedure(state)
  if (
    procedure === null
    || !isLaunchProcedureDue(state)
    || !procedure.controls.includes(control)
  ) {
    return { ...state, mistakes: state.mistakes + 1 }
  }
  if (state.activeControls.includes(control)) return state
  return { ...state, activeControls: [...state.activeControls, control] }
}

export const verifyLaunchProcedure = (state: LaunchState): LaunchState => {
  const procedure = getCurrentLaunchProcedure(state)
  if (procedure === null || !canVerifyLaunchProcedure(state)) {
    return state.status === 'complete' || state.status === 'scrubbed'
      ? state
      : { ...state, mistakes: state.mistakes + 1 }
  }

  const completedProcedures = [...state.completedProcedures, procedure.id]
  const procedureIndex = state.procedureIndex + 1
  if (procedureIndex >= LAUNCH_PROCEDURES.length) {
    return {
      ...state,
      procedureIndex,
      activeControls: [],
      completedProcedures,
      status: 'complete',
      timeRate: 0,
    }
  }

  return {
    ...state,
    procedureIndex,
    activeControls: [],
    completedProcedures,
  }
}

/**
 * Advances the Apollo 11 launch-day clock. Phaser supplies delta time; this model only applies
 * campaign-specific gates and the approved compression rule.
 *
 * The automatic firing sequence begins at T−00:03:10 and is locked to 1×. The ignition boundary
 * and cutoff consequence come from the Apollo 11 Press Kit and Prelaunch Mission Operations
 * Report, p. 9. Liftoff at GET 00:00:00 is the player-facing rounded display; the Mission Report
 * retains the as-flown 00:00:00.6 event value.
 */
export const stepLaunch = (
  state: LaunchState,
  input: LaunchInput,
  deltaSeconds: number,
): LaunchState => {
  if (deltaSeconds <= 0 || state.status === 'complete' || state.status === 'scrubbed') return state

  const procedure = getCurrentLaunchProcedure(state)
  let timeRate = 0
  let nextClock = state.clockSeconds

  if (state.clockSeconds < AUTOMATIC_SEQUENCE_SECONDS) {
    if (!isLaunchProcedureDue(state) && input.accelerate) {
      const nextBoundary = Math.min(
        procedure?.dueSeconds ?? AUTOMATIC_SEQUENCE_SECONDS,
        AUTOMATIC_SEQUENCE_SECONDS,
      )
      timeRate = PRELAUNCH_ACCELERATION
      nextClock = Math.min(nextBoundary, state.clockSeconds + deltaSeconds * timeRate)
    }
  } else if (state.clockSeconds < TOWER_CLEAR_SECONDS) {
    timeRate = 1
    nextClock = Math.min(TOWER_CLEAR_SECONDS, state.clockSeconds + deltaSeconds)
  }

  const launchConfigurationComplete = state.completedProcedures.includes('gdc-alignment')
  if (
    state.clockSeconds < IGNITION_SEQUENCE_SECONDS
    && nextClock >= IGNITION_SEQUENCE_SECONDS
    && !launchConfigurationComplete
  ) {
    return {
      ...state,
      clockSeconds: IGNITION_SEQUENCE_SECONDS,
      status: 'scrubbed',
      timeRate: 0,
    }
  }

  const status = state.status === 'tower-clear'
    ? state.status
    : derivedStatus(nextClock)
  return {
    ...state,
    clockSeconds: clamp(nextClock, LAUNCH_START_SECONDS, TOWER_CLEAR_SECONDS),
    status,
    timeRate,
  }
}

export const formatLaunchClock = (clockSeconds: number): string => {
  const prelaunch = clockSeconds < 0
  const magnitude = Math.max(0, prelaunch
    ? Math.ceil(Math.abs(clockSeconds))
    : Math.floor(clockSeconds))
  const hours = Math.floor(magnitude / 3_600)
  const minutes = Math.floor((magnitude % 3_600) / 60)
  const seconds = magnitude % 60
  const body = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return prelaunch ? `T−${body}` : `GET 000:${body}`
}

export const getLaunchEventCallout = (state: LaunchState): string => {
  if (state.status === 'complete') return 'HOUSTON HAS THE FLIGHT'
  if (state.status === 'scrubbed') return 'SEQUENCE CUTOFF · LAUNCH SCRUBBED'
  if (state.clockSeconds >= TOWER_CLEAR_SECONDS) return 'TOWER CLEAR'
  if (state.clockSeconds >= LIFTOFF_SECONDS) return 'LIFTOFF · CLOCK RUNNING'
  if (state.clockSeconds >= ALL_ENGINES_RUNNING_SECONDS) return 'ALL FIVE ENGINES RUNNING'
  if (state.clockSeconds >= IGNITION_SEQUENCE_SECONDS) return 'IGNITION SEQUENCE'
  if (state.clockSeconds >= -50) return 'LAUNCH VEHICLE INTERNAL POWER'
  if (state.clockSeconds >= AUTOMATIC_SEQUENCE_SECONDS) return 'AUTOMATIC SEQUENCE · 1×'
  if (isLaunchProcedureDue(state)) return getCurrentLaunchProcedure(state)?.command ?? ''
  return 'HOLD SPACE TO ADVANCE TO THE NEXT PROCEDURE'
}
