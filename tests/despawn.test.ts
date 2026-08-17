import { describe, expect, it } from 'vitest'
import { toStage } from '../src/scene/layers.ts'
import type { Stage } from '../src/scene/layers.ts'
import { cryptScene } from '../src/micro/crypt-scene.ts'
import { skateScene } from '../src/micro/skate-scene.ts'
import { aeroScene } from '../src/micro/aero-scene.ts'

/**
 * **His batch-5 note, as a property over every side-scroller at once:** *"o objeto de obstáculo
 * é destruído antes de sair da tela. O mais comum é que ele saia da tela e seja destruído fora
 * dela."*
 *
 * The root was arithmetic, not rendering: slot k lives at world x = leadIn + k·spacing + jitter,
 * and the old draw window divided (dist − 60) by the spacing — no leadIn, no holdX — so its
 * inverse map was off by leadIn + holdX, and every stone was culled at screen
 * x ≈ holdX + leadIn − 60 − spacing + jitter. Mid-screen, in all three runners, since the crypt.
 *
 * The property: **a slot whose crop has any pixel on screen is inside the drawn window.** It is
 * asserted over every runner stage the shelf has, so a fourth runner inherits the lock by being
 * listed, and the old formula is kept in the file as the null case — the lock must FIRE on it,
 * or it could not have caught the defect it exists to prevent.
 */

const stages: readonly [string, Stage][] = [
  ['crypt', toStage(cryptScene)],
  ['skate', toStage(skateScene)],
  ['aero', toStage(aeroScene)],
]

/** stoneAt, reproduced byte for byte — the skate file records why this copy exists. */
const stoneAt = (N: NonNullable<Stage['runner']>, k: number): { x: number; v: number } => {
  let a = ((k + N.seed) * 2654435761) >>> 0
  a = (a ^ (a >>> 13)) >>> 0
  let b = (a * 1597334677) >>> 0
  b = (b ^ (b >>> 15)) >>> 0
  return { x: N.leadIn + k * N.spacing + (a % N.jitterX), v: (b >>> 7) % N.stones.length }
}

/** The runtime's window, reproduced: which slots drawRunner walks at this distance. */
const windowAt = (N: NonNullable<Stage['runner']>, w: number, dist: number): [number, number] => [
  Math.max(0, Math.floor((dist - N.holdX - N.leadIn - 60) / N.spacing)),
  Math.floor((dist - N.holdX - N.leadIn + w + 60) / N.spacing) + 1,
]

describe('nothing on screen is ever undrawn', () => {
  for (const [name, stage] of stages) {
    const N = stage.runner!
    it(`${name}: every slot whose crop touches the screen is inside the drawn window`, () => {
      for (let dist = 0; dist < 9000; dist += 37) {
        const [first, last] = windowAt(N, stage.w, dist)
        const kAround = Math.round(dist / N.spacing)
        for (let k = Math.max(0, kAround - 6); k <= kAround + 6; k++) {
          const st = stoneAt(N, k)
          const L = stage.layers[N.stones[st.v]!]!
          const sx = N.holdX + (st.x - dist) + L.ox
          const visible = sx < stage.w && sx + L.w > 0
          if (!visible) continue
          expect(k, `${name}: slot ${k} visible at dist ${dist} (screen x ${sx.toFixed(0)}) but below window start ${first}`).toBeGreaterThanOrEqual(first)
          expect(k, `${name}: slot ${k} visible at dist ${dist} but past window end ${last}`).toBeLessThanOrEqual(last)
        }
      }
    })
  }

  it('the null case: the pre-17/08 window fails this property, so the lock can catch the defect', () => {
    const stage = stages[0]![1]
    const N = stage.runner!
    let caught = 0
    for (let dist = 0; dist < 9000 && caught === 0; dist += 37) {
      const oldFirst = Math.max(0, Math.floor((dist - 60) / N.spacing))
      for (let k = Math.max(0, Math.round(dist / N.spacing) - 6); k < oldFirst; k++) {
        const st = stoneAt(N, k)
        const L = stage.layers[N.stones[st.v]!]!
        const sx = N.holdX + (st.x - dist) + L.ox
        if (sx < stage.w && sx + L.w > 0) caught++
      }
    }
    expect(caught, 'the old window never dropped a visible stone — then it was not the defect').toBeGreaterThan(0)
  })
})
