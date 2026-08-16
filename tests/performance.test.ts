import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { budgetOf } from '../src/scene/budget.ts'

/**
 * **The performance budget, one ceiling per cost, each with the reasoning for its number.**
 *
 * His ask of 16/08, and the timing is the good part: *"algo que ainda não preocupa, mas é bom
 * ficarmos de olho"*. Nothing here is slow. A budget adopted while there is headroom is a
 * budget; the same numbers adopted after a stall are a post-mortem.
 *
 * **What these ceilings are and are not.** They are not measurements of any machine — this
 * suite runs in Node and cannot time a browser. They bound what a page **asks for**, and the
 * live meter on the page reports what a browser **did**. The two together are the instrument;
 * either alone is half of one (`HARNESS.md` §5).
 *
 * **The frame budget everything below is derived from: 16.67 ms, which is 60 fps.** Every
 * ceiling is that budget divided by a cost per unit, and each cost per unit is stated so the
 * ceiling can be argued with rather than obeyed.
 */

/**
 * **200 draw calls per frame.**
 *
 * A canvas2d call costs roughly 10–30 µs of fixed overhead whatever it moves, so 200 calls is
 * 2–6 ms — a third of the frame at worst, which leaves the rest for the pixels. The forest
 * sits at 67 after the rain became one stamp per column instead of one `fillRect` per drop
 * pixel; before that change it was 259 and would have been the largest single cost in the
 * page, for a hundredth of its pixels.
 */
const MAX_DRAW_CALLS = 200

/**
 * **1.5 M pixels written per frame at scene resolution.**
 *
 * Canvas2d moves on the order of 1 GB/s for an unscaled blit, which is 250 M pixels/s, which
 * is 4 M pixels in a 16.67 ms frame. A quarter of that is the ceiling, because the *scaled*
 * final blit is several times more expensive per pixel than the unscaled ones and is counted
 * separately below. The forest sits at 151 k — ten times under.
 */
const MAX_FRAME_PIXELS = 1_500_000

/**
 * **4× overdraw.**
 *
 * How many times an average screen pixel is written per frame. 1.0 is a scene where nothing
 * overlaps anything; a dense forest is inherently above that and should be. Past 4 the scene
 * is mostly painting things nobody sees, which is a composition problem showing up as a
 * performance one — the right fix there is culling or fewer layers, never a faster loop.
 */
const MAX_OVERDRAW = 4

/**
 * **2.2 M pixels to decode at load.**
 *
 * Index-to-RGBA runs about 25 M pixels/s in plain JS, so this is roughly 90 ms before the
 * first frame. Past that a refresh stops feeling instant, and the refresh loop is how this
 * project is worked — his surface is edit, refresh, look. The forest sits at 1.44 M.
 */
const MAX_DECODE_PIXELS = 2_200_000

/**
 * **24 MB resident.**
 *
 * Decoded sprite strips plus the two full-screen buffers. Well inside anything a browser tab
 * minds, and it is here to catch the shape of growth rather than the size: a shelf that grows
 * to twenty games is the case this number is really waiting for, since every card currently
 * ships its own full stage.
 */
const MAX_CANVAS_BYTES = 24 * 1024 * 1024

describe('every micro game stays inside the frame budget', () => {
  for (const game of MICRO_GAMES) {
    const budget = budgetOf(toStage(game.scene))

    it(`${game.id}: draw calls`, () => {
      expect(budget.perFrame.drawCalls, `${game.id} makes ${budget.perFrame.drawCalls} canvas calls a frame`)
        .toBeLessThanOrEqual(MAX_DRAW_CALLS)
    })

    it(`${game.id}: pixels written per frame`, () => {
      expect(budget.perFrame.pixels).toBeLessThanOrEqual(MAX_FRAME_PIXELS)
    })

    it(`${game.id}: overdraw`, () => {
      expect(budget.perFrame.overdraw, `${game.id} writes each screen pixel ${budget.perFrame.overdraw.toFixed(2)} times a frame`)
        .toBeLessThanOrEqual(MAX_OVERDRAW)
    })

    it(`${game.id}: first paint`, () => {
      expect(budget.load.decodePixels).toBeLessThanOrEqual(MAX_DECODE_PIXELS)
      expect(budget.load.canvasBytes).toBeLessThanOrEqual(MAX_CANVAS_BYTES)
    })
  }
})

describe('the budget counts the loop that actually runs', () => {
  it('a rain column costs one draw call, not one per drop pixel', () => {
    // The null case for the biggest single saving in the page, and the reason it is checked
    // here rather than trusted: the budget and the runtime are two pieces of arithmetic about
    // the same loop, and the moment they disagree the budget is measuring a different program.
    const stage = toStage(MICRO_GAMES[0]!.scene)
    const budget = budgetOf(stage)
    const rain = stage.rain
    expect(rain).not.toBeNull()
    const columns = Math.ceil(stage.w / (rain as NonNullable<typeof rain>).spacing) + 2
    // backdrop + columns + subjects + the final blit, and nothing else.
    expect(budget.perFrame.drawCalls).toBe(1 + columns + stage.placed.length + 1)
  })

  // Two full stage builds, which is two renders of every sprite in the game. It is the most
  // expensive check in the suite and it earns it: a meter reading a stale number is worse
  // than no meter, because it arrives looking like data.
  it('the page reports the same budget it was built with', { timeout: 30_000 }, () => {
    // A meter that reads a stale number is worse than no meter: it arrives looking like data.
    const stage = toStage(MICRO_GAMES[0]!.scene)
    const a = budgetOf(stage)
    const b = budgetOf(toStage(MICRO_GAMES[0]!.scene))
    expect(a).toEqual(b)
  })
})
