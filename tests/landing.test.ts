import { describe, expect, it } from 'vitest'
import {
  INITIAL_LANDING_STATE,
  P66_TERMINAL_START_STATE,
  classifyLandingSite,
  formatGet,
  getLandingAnnunciators,
  getLandingObjective,
  stepLanding,
  type LandingState,
} from '../src/game/landing/model.ts'

describe('Apollo 11 terminal descent model', () => {
  it('advances deterministically for the same state and control input', () => {
    const input = { rateCommand: 0.25, forwardCommand: -0.5 }
    expect(stepLanding(INITIAL_LANDING_STATE, input, 1 / 60)).toEqual(
      stepLanding(INITIAL_LANDING_STATE, input, 1 / 60),
    )
  })

  it('consumes propellant and advances historical GET while flying', () => {
    const next = stepLanding(INITIAL_LANDING_STATE, { rateCommand: 0, forwardCommand: 0 }, 0.1)
    expect(next.getSeconds).toBeGreaterThan(INITIAL_LANDING_STATE.getSeconds)
    expect(next.fuelSeconds).toBeLessThan(INITIAL_LANDING_STATE.fuelSeconds)
  })

  it('accepts a controlled touchdown on the clear plain', () => {
    const approach: LandingState = {
      ...INITIAL_LANDING_STATE,
      altitudeFt: 0.2,
      verticalSpeedFps: -3,
      forwardPositionFt: 1_500,
      forwardSpeedFps: 2,
    }
    expect(stepLanding(approach, { rateCommand: 0, forwardCommand: 0 }, 0.1).status).toBe('landed')
  })

  it('rejects a fast or hazardous touchdown', () => {
    const fast: LandingState = {
      ...INITIAL_LANDING_STATE,
      altitudeFt: 0.2,
      verticalSpeedFps: -12,
      forwardPositionFt: 1_500,
      forwardSpeedFps: 2,
    }
    const crater = { ...fast, verticalSpeedFps: -3, forwardPositionFt: 700 }
    expect(stepLanding(fast, { rateCommand: 0, forwardCommand: 0 }, 0.1).status).toBe('hard-landing')
    expect(stepLanding(crater, { rateCommand: 0, forwardCommand: 0 }, 0.1).status).toBe('hard-landing')
  })

  it('names the provisional terrain bands and formats GET', () => {
    expect(classifyLandingSite(500)).toBe('crater')
    expect(classifyLandingSite(1_100)).toBe('boulders')
    expect(classifyLandingSite(1_500)).toBe('plain')
    expect(classifyLandingSite(2_500)).toBe('overshoot')
    expect(formatGet(102 * 3_600 + 43 * 60 + 23)).toBe('102:43:23')
  })

  it('turns flight state into an explicit player objective', () => {
    expect(getLandingObjective(INITIAL_LANDING_STATE).id).toBe('clear-crater')
    expect(getLandingObjective({ ...INITIAL_LANDING_STATE, forwardPositionFt: 1_120 }).id).toBe('clear-boulders')
    expect(getLandingObjective({ ...INITIAL_LANDING_STATE, forwardPositionFt: 1_500 }).id).toBe('arrest-forward')
    expect(getLandingObjective({
      ...INITIAL_LANDING_STATE,
      forwardPositionFt: 1_500,
      forwardSpeedFps: 4,
      verticalSpeedFps: -4,
    }).id).toBe('touchdown')
  })

  it('drives the six cockpit annunciators from the landing conditions', () => {
    expect(getLandingAnnunciators(P66_TERMINAL_START_STATE).map(({ label, tone }) =>
      `${label}:${tone}`,
    )).toEqual([
      'CRTR:caution',
      'SITE:caution',
      'FWD:caution',
      'VERT:ready',
      'FUEL:ready',
      'CONT:off',
    ])

    const safeApproach: LandingState = {
      ...P66_TERMINAL_START_STATE,
      forwardPositionFt: 1_500,
      forwardSpeedFps: 2,
      verticalSpeedFps: -3,
      fuelSeconds: 25,
    }
    expect(getLandingAnnunciators(safeApproach).map(({ tone }) => tone)).toEqual([
      'ready', 'ready', 'ready', 'ready', 'caution', 'off',
    ])
    expect(getLandingAnnunciators({ ...safeApproach, status: 'landed' }).at(-1)?.tone).toBe('ready')

    const failed: LandingState = {
      ...P66_TERMINAL_START_STATE,
      altitudeFt: 0,
      verticalSpeedFps: -12,
      forwardSpeedFps: 12,
      fuelSeconds: 0,
      status: 'hard-landing',
    }
    expect(getLandingAnnunciators(failed).map(({ tone }) => tone)).toEqual([
      'danger', 'danger', 'danger', 'danger', 'danger', 'danger',
    ])
  })

  it('allows the playable slice to be completed with the controls described to the player', () => {
    let state = P66_TERMINAL_START_STATE
    const objectives = new Set<string>()

    for (let frame = 0; frame < 6_000 && state.status === 'flying'; frame += 1) {
      objectives.add(getLandingObjective(state).id)
      const forwardCommand = state.forwardPositionFt >= 1_280 && state.forwardSpeedFps > 4 ? -1 : 0
      state = stepLanding(state, { rateCommand: 0, forwardCommand }, 1 / 60)
    }

    expect(state.status).toBe('landed')
    expect(state.fuelSeconds).toBeGreaterThan(0)
    expect(objectives).toEqual(new Set(['clear-crater', 'clear-boulders', 'arrest-forward', 'touchdown']))
  })

  it('requires intervention instead of completing itself', () => {
    let state = P66_TERMINAL_START_STATE
    for (let frame = 0; frame < 6_000 && state.status === 'flying'; frame += 1) {
      state = stepLanding(state, { rateCommand: 0, forwardCommand: 0 }, 1 / 60)
    }
    expect(state.status).toBe('hard-landing')
  })
})
