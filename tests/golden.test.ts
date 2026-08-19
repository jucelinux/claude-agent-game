import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { gamePage } from '../src/micro/app.ts'
import { ROOT } from '../src/io/load.ts'
import { run } from './harness.ts'
import { traceOf } from './trace.ts'

/**
 * **What every game DREW, as one number per game.**
 *
 * Built to make a 2000-line refactor safe: the runtime moved out of a template literal and into
 * typed modules, and no lock in this repository asserted "the picture is unchanged" — each one
 * asserts some property of it. This does assert it, at the only level a headless test can: the
 * exact sequence of canvas calls, under a fixed input script and a fixed clock.
 *
 * **What it is not.** It is not the look. It cannot see a palette, and a game that made the
 * right calls with the wrong sprite in the atlas would pass. It is the counting channel one
 * level up — and like the counting channel, its value is that it finds ABSENCE and CHANGE,
 * which sight is bad at across two thousand lines.
 *
 * **When a hash changes.** That is a claim about the product, not about this file. Either the
 * change was intended — in which case regenerate the file and say in the commit which game
 * changed and why — or it was not, and the refactor broke something no other lock could see.
 * Never regenerate to make the suite green.
 */
const golden = JSON.parse(readFileSync(`${ROOT}tests/runtime.golden.json`, 'utf8')) as
  Record<string, { hash: string; calls: number }>

describe('every game draws exactly what it drew before', () => {
  for (const game of MICRO_GAMES) {
    it(`${game.id}: the draw trace is unchanged`, { timeout: 30_000 }, () => {
      const stage = toStage(game.scene)
      const page = gamePage({
        id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage,
        ...(game.keys === undefined ? {} : { keys: game.keys }),
      })
      const t = traceOf(page, run)
      const want = golden[game.id]
      expect(want, `${game.id} has no golden trace — regenerate tests/runtime.golden.json`).toBeDefined()
      expect(t.calls, `${game.id} made ${t.calls} canvas calls, not ${want!.calls}`).toBe(want!.calls)
      expect(t.hash, `${game.id} drew a different picture`).toBe(want!.hash)
    })
  }

  it('the trace is a property of the code and of nothing else', () => {
    // The null case for the instrument itself: two runs of one game must fold identically, or
    // every assertion above is reading noise rather than a difference.
    const game = MICRO_GAMES[0]!
    const stage = toStage(game.scene)
    const page = gamePage({ id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage })
    expect(traceOf(page, run).hash).toBe(traceOf(page, run).hash)
  })

  it('and it would notice a change — the same game played differently draws differently', () => {
    /**
     * The signal case. An instrument that cannot fail is not an instrument.
     *
     * Note what it must NOT assert: the call COUNT. A runner that jumps makes exactly as many
     * calls as one that does not — same sprites, same order, different rows. Counting would
     * have said the two plays were identical, which is the flattering direction, and it is
     * why the trace folds the arguments rather than tallying the calls.
     */
    const game = MICRO_GAMES.find((g) => g.id === 'crypt')!
    const stage = toStage(game.scene)
    const page = gamePage({ id: game.id, title: game.title, blurb: game.blurb, date: game.date, meta: [], stage })
    const played = traceOf(page, run)
    const idle = traceOf(page, run, [])
    expect(played.calls, 'the two plays differ in call count, so this is not testing the fold').toBe(idle.calls)
    expect(played.hash, 'playing the game and not playing it folded to the same number').not.toBe(idle.hash)
  })
})
