import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { gamePage } from '../src/micro/app.ts'
import { run } from './harness.ts'

/**
 * **A recorded input replays identically, and until 18/08 that was a claim rather than a fact.**
 *
 * `CLAUDE.md` §Architecture has stated it since round zero. The frame loop integrated against
 * the real elapsed frame time, so the same key sequence produced a different game on a 144 Hz
 * screen than on a 60 Hz one — and **no lock could see it**, because `tests/harness.ts` feeds a
 * fixed 16.67 ms tick. The instrument was testing a determinism the product did not have: the
 * fifth occurrence of the flattering-instrument shape `HARNESS.md` §5 names, and the first found
 * by reading the build order rather than by a defect.
 *
 * These drive the same input, by WALL-CLOCK TIME rather than by frame index, at three refresh
 * rates. The simulation now advances in whole 1/120 s steps and nothing else, so the three must
 * agree — not approximately, exactly.
 */

/**
 * **The same play, at arbitrary moments — including ones no refresh rate lands on.**
 *
 * The first version of this file used multiples of 1/6 s, the largest interval that falls on a
 * frame boundary at 60, 90 and 144 Hz alike, because otherwise the three runs disagreed. That
 * was a real finding and the wrong response: a key press at 200 ms is *seen* at 200.0 on a 60 Hz
 * screen and at 201.39 on a 144 Hz one, and a loop that applies it "on the frame that noticed
 * it" has made the refresh rate part of the game.
 *
 * So input is a TIMELINE now. Each event carries its own timestamp and the loop applies it to
 * the simulation step it belongs to. These times are deliberately ragged — 137 ms, 909 ms — and
 * the three rates still agree exactly.
 */
const PLAY: readonly (readonly [number, string, boolean])[] = [
  [0.137, 'ArrowRight', true], [0.909, 'ArrowRight', false],
  [1.013, ' ', true], [1.061, ' ', false],
  [1.302, 'ArrowLeft', true], [2.117, 'ArrowLeft', false],
  [2.204, 'ArrowUp', true], [2.418, 'x', true],
  [3.006, 'ArrowUp', false], [3.223, 'x', false],
  [3.401, ' ', true], [3.449, ' ', false],
]
const SECONDS = 5

/** Drive one page at a given refresh rate and return the state it ends in. */
function playAt(page: string, hz: number): unknown {
  const h = run(page)
  const frames = Math.floor(SECONDS * hz)
  let next = 0
  for (let f = 0; f <= frames; f++) {
    // The last tick of every rate lands on the same millisecond, or the three runs would be
    // compared at three different moments — which is a difference in the QUESTION, not in the
    // answer, and was the first version of this lock.
    const at = f === frames ? SECONDS * 1000 : (f * 1000) / hz
    while (next < PLAY.length && PLAY[next]![0]! * 1000 <= at) {
      // The event carries its OWN moment, exactly as a browser's does — which is the whole
      // point: the loop applies it to the simulation step it belongs to, not to this frame.
      h.key(PLAY[next]![1]!, PLAY[next]![2]!, PLAY[next]![0]! * 1000)
      next++
    }
    h.tick(at)
  }
  return h.state()
}

describe('the simulation is a function of the input, not of the refresh rate', () => {
  for (const game of MICRO_GAMES) {
    it(`${game.id}: 60, 90 and 144 Hz end in the same state`, { timeout: 30_000 }, () => {
      const stage = toStage(game.scene)
      const page = gamePage({
        id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
        ...(game.keys === undefined ? {} : { keys: game.keys }),
      })
      const a = JSON.stringify(playAt(page, 60))
      const b = JSON.stringify(playAt(page, 90))
      const c = JSON.stringify(playAt(page, 144))
      expect(b, `${game.id} plays differently at 90 Hz than at 60`).toBe(a)
      expect(c, `${game.id} plays differently at 144 Hz than at 60`).toBe(a)
    })
  }

  it('and with no input at all, every rate is identical — the simulation alone', () => {
    // The stronger half, free of the polling question entirely: nothing is pressed, so the three
    // runs differ only in how often they were asked to advance.
    for (const game of MICRO_GAMES) {
      const stage = toStage(game.scene)
      const page = gamePage({ id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage })
      const idle = (hz: number): string => {
        const h = run(page)
        const frames = Math.floor(SECONDS * hz)
        for (let f = 0; f <= frames; f++) h.tick(f === frames ? SECONDS * 1000 : (f * 1000) / hz)
        return JSON.stringify(h.state())
      }
      expect(idle(90), `${game.id} idles differently at 90 Hz`).toBe(idle(60))
      expect(idle(144), `${game.id} idles differently at 144 Hz`).toBe(idle(60))
    }
  }, 60_000)

  it('the null case: the state this compares is not empty', () => {
    // A lock that compares two nulls passes for ever. The crypt's runner travels, so its state
    // has to have moved by the end of five seconds or the comparison above is vacuous.
    const game = MICRO_GAMES.find((g) => g.id === 'crypt')!
    const page = gamePage({
      id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [],
      stage: toStage(game.scene),
    })
    const s = playAt(page, 60) as { dist: number }
    expect(s.dist, 'the runner did not move, so the equality above proves nothing').toBeGreaterThan(10)
  })
})
