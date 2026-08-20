import { describe, expect, it } from 'vitest'
import { describeObservation } from '../src/observation/describe.ts'
import type { Keeps, Observation } from '../src/observation/types.ts'

const keeper: Keeps = {
  at: 0, x: 160, y: 166, vx: 0, vy: 0, face: 1, state: 'idle', stateAt: 0,
  walked: 0, grounded: true, turn: 0, turning: 0, turnFrom: 0, turnClock: 0,
  suns: 0, over: false, won: false, elapsed: 0, best: 0,
}

describe('the running-game text eye', () => {
  it('distinguishes a known semantic change after reducing the state to one line', () => {
    const idle: Observation = { kind: 'platformer', state: keeper }
    const changed: Observation = { kind: 'platformer', state: { ...keeper, turn: 1, state: 'fall', suns: 1 } }
    expect(describeObservation(changed)).not.toBe(describeObservation(idle))
    expect(describeObservation(changed)).toContain('turn 1')
    expect(describeObservation(changed)).toContain('suns 1/3')
  })

  it('does not mistake absence for a running shape', () => {
    expect(describeObservation({ kind: 'inactive', state: null })).toBe('inactive')
    expect(describeObservation({ kind: 'stage', state: null })).toBe('stage · diorama')
  })
})
