import { describe, expect, it } from 'vitest'
import {
  AUTOMATIC_SEQUENCE_SECONDS,
  IGNITION_SEQUENCE_SECONDS,
  INITIAL_LAUNCH_STATE,
  LAUNCH_EVIDENCE,
  LAUNCH_PROCEDURES,
  PRELAUNCH_ACCELERATION,
  TOWER_CLEAR_SECONDS,
  activateLaunchControl,
  canVerifyLaunchProcedure,
  formatLaunchClock,
  getArmstrongWindowPose,
  getCurrentLaunchProcedure,
  isLaunchProcedureDue,
  stepLaunch,
  verifyLaunchProcedure,
  type LaunchState,
} from '../src/game/launch/model.ts'

const completeCurrentProcedure = (state: LaunchState): LaunchState => {
  const procedure = getCurrentLaunchProcedure(state)
  if (!procedure || !isLaunchProcedureDue(state)) return state
  const configured = procedure.controls.reduce(activateLaunchControl, state)
  return verifyLaunchProcedure(configured)
}

describe('Apollo 11 launch-day model', () => {
  it('starts at Armstrong ingress with an explicit unresolved acceptance condition', () => {
    expect(formatLaunchClock(INITIAL_LAUNCH_STATE.clockSeconds)).toBe('T−02:38:00')
    expect(getCurrentLaunchProcedure(INITIAL_LAUNCH_STATE)?.id).toBe('ingress-relock')
    expect(isLaunchProcedureDue(INITIAL_LAUNCH_STATE)).toBe(true)
    expect(canVerifyLaunchProcedure(INITIAL_LAUNCH_STATE)).toBe(false)
  })

  it('requires every causal control before accepting a procedure', () => {
    const oneCheck = activateLaunchControl(INITIAL_LAUNCH_STATE, 'inspect-strut')
    expect(canVerifyLaunchProcedure(oneCheck)).toBe(false)
    expect(verifyLaunchProcedure(oneCheck).procedureIndex).toBe(0)

    const complete = completeCurrentProcedure(INITIAL_LAUNCH_STATE)
    expect(complete.completedProcedures).toEqual(['ingress-relock'])
    expect(complete.procedureIndex).toBe(1)
  })

  it('accelerates only completed stable spans and stops at the next procedure', () => {
    const ready = completeCurrentProcedure(INITIAL_LAUNCH_STATE)
    const paused = stepLaunch(ready, { accelerate: false }, 2)
    expect(paused.clockSeconds).toBe(ready.clockSeconds)
    expect(paused.timeRate).toBe(0)

    const advanced = stepLaunch(ready, { accelerate: true }, 60)
    expect(advanced.clockSeconds).toBe(getCurrentLaunchProcedure(advanced)?.dueSeconds)
    expect(advanced.timeRate).toBe(PRELAUNCH_ACCELERATION)
    expect(isLaunchProcedureDue(advanced)).toBe(true)
  })

  it('locks the automatic sequence to real time', () => {
    const terminal: LaunchState = {
      ...INITIAL_LAUNCH_STATE,
      clockSeconds: AUTOMATIC_SEQUENCE_SECONDS,
      procedureIndex: LAUNCH_PROCEDURES.findIndex(({ id }) => id === 'launch-computer'),
      status: 'terminal-count',
    }
    const next = stepLaunch(terminal, { accelerate: true }, 1)
    expect(next.clockSeconds).toBe(AUTOMATIC_SEQUENCE_SECONDS + 1)
    expect(next.timeRate).toBe(1)
  })

  it('moves the Pad 39A exterior through Armstrong\'s fixed window after liftoff', () => {
    const held = getArmstrongWindowPose(-20)
    const released = getArmstrongWindowPose(0)
    const towerClear = getArmstrongWindowPose(TOWER_CLEAR_SECONDS)

    expect([released.x, released.y, released.scale]).toEqual([held.x, held.y, held.scale])
    expect(held.ignitionLight).toBe(0)
    expect(released.ignitionLight).toBe(1)
    expect(towerClear.y).toBeGreaterThan(released.y)
    expect(towerClear.x).toBeLessThan(released.x)
    expect(towerClear.scale).toBeLessThan(released.scale)
    expect(towerClear.ignitionLight).toBe(1)
  })

  it('scrubs at ignition if final launch configuration is unresolved', () => {
    const unsafe: LaunchState = {
      ...INITIAL_LAUNCH_STATE,
      clockSeconds: IGNITION_SEQUENCE_SECONDS - 0.1,
      procedureIndex: LAUNCH_PROCEDURES.findIndex(({ id }) => id === 'gdc-alignment'),
      status: 'terminal-count',
    }
    const next = stepLaunch(unsafe, { accelerate: false }, 1)
    expect(next.clockSeconds).toBe(IGNITION_SEQUENCE_SECONDS)
    expect(next.status).toBe('scrubbed')
  })

  it('completes the flown nominal path only after tower-clear verification', () => {
    let state = INITIAL_LAUNCH_STATE
    let guard = 0

    while (state.status !== 'complete' && guard < 20_000) {
      if (isLaunchProcedureDue(state)) state = completeCurrentProcedure(state)
      state = stepLaunch(state, { accelerate: true }, 0.25)
      guard += 1
    }

    expect(state.status).toBe('complete')
    expect(state.clockSeconds).toBe(TOWER_CLEAR_SECONDS)
    expect(state.completedProcedures).toEqual(LAUNCH_PROCEDURES.map(({ id }) => id))
    expect(state.mistakes).toBe(0)
    expect(formatLaunchClock(state.clockSeconds)).toBe('GET 000:00:00:12')
  })

  it('keeps a material source beside every historical procedure', () => {
    const sourceUrls = new Set<string>(Object.values(LAUNCH_EVIDENCE))
    for (const procedure of LAUNCH_PROCEDURES) {
      expect(procedure.evidenceClass).not.toBe('adaptation')
      expect(sourceUrls.has(procedure.source), procedure.id).toBe(true)
    }
  })
})
