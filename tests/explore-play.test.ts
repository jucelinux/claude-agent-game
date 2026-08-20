import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { orreryScene } from '../src/micro/orrery-scene.ts'
import { toStage } from '../src/scene/layers.ts'
import { exploreGame, generatedPlay, validateObservation } from '../bin/explore-play.ts'
import type { Observation } from '../src/observation/types.ts'

describe('seeded play explores outside the authored solution', () => {
  it('is deterministic and balances every held physical key', () => {
    const a = generatedPlay('orrery', 19, 4)
    expect(generatedPlay('orrery', 19, 4)).toEqual(a)
    expect(generatedPlay('orrery', 20, 4)).not.toEqual(a)
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'x']) {
      const events = a.events.filter((e) => e[1] === key)
      expect(events.filter((e) => e[2]).length, `${key} stayed down`).toBe(events.filter((e) => !e[2]).length)
    }
  })

  it('has a null case: a non-finite state and an escaped keeper both fail', () => {
    const stage = toStage(orreryScene)
    const base = {
      at: 0, x: 160, y: 166, vx: 0, vy: 0, face: 1, state: 'idle' as const,
      stateAt: 0, walked: 0, grounded: true, turn: 0, turning: 0, turnFrom: 0,
      turnClock: 0, suns: 0, over: false, won: false, elapsed: 0, best: 0,
    }
    expect(validateObservation({ kind: 'platformer', state: base }, stage)).toEqual([])
    expect(validateObservation({ kind: 'platformer', state: { ...base, x: 80 } }, stage)).toContain('keeper body left the navigable room')
    expect(validateObservation({ kind: 'platformer', state: { ...base, vy: Number.NaN } }, stage).join(' ')).toContain('platformer.state.vy is NaN')
  })

  for (const game of MICRO_GAMES) {
    it(`${game.id}: alternate input stays inside product invariants`, { timeout: 30_000 }, () => {
      expect(exploreGame(game.id, 1, 2), `${game.id} failed seeded exploration`).toBeNull()
    })
  }

  it('pushes the rotated keeper through more than one seed', () => {
    expect(exploreGame('orrery', 16, 5)).toBeNull()
  })

  it('the observation union carries the shape without a cast', () => {
    const observation: Observation = { kind: 'inactive', state: null }
    expect(observation.kind).toBe('inactive')
  })
})
