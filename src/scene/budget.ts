/**
 * **What a micro game costs to run, counted rather than felt.**
 *
 * His ask of 16/08: *"temos que garantir que os jogos possuam uma boa performance... é bom
 * adicionarmos a cada microgame métricas que nos permite avaliar a performance geral"*. It
 * arrived before anything is slow, which is the right moment: a budget adopted while there is
 * headroom is a budget; a budget adopted after a stall is a post-mortem.
 *
 * **Two readings, and they are deliberately different in kind.**
 *
 * | | what it is | where it comes from |
 * |---|---|---|
 * | **the budget** | what the page *will* ask the machine to do | counted here, from the stage, deterministic |
 * | **the meter** | what the machine *did* | measured in the browser, live, on the page |
 *
 * The first is a prediction and the second is the measurement, and the project's own null-case
 * rule (`HARNESS.md` §5) says an instrument is not believed until it has been calibrated in
 * both directions. So the page shows both side by side: a budget that says "cheap" next to a
 * meter that says 30 fps is a budget measuring the wrong thing, and that is exactly the
 * failure this pairing is here to make visible.
 *
 * **Nothing here is a threshold on its own.** `tests/performance.test.ts` holds the ceilings
 * and every one of them carries the reasoning for its number, the same as any tunable
 * (`HARNESS.md` §2.7).
 */
import type { Stage } from './layers.ts'

export type Budget = {
  /** What one animation frame asks for. This is the number that decides whether it runs. */
  readonly perFrame: {
    /**
     * Canvas calls: the backdrop copy, one stamp per rain column, one blit per subject, and
     * the final scaled blit. **Call count matters more than pixel count here** — a canvas2d
     * call carries fixed overhead in the tens of microseconds, so a thousand small ones cost
     * more than one large one moving the same pixels.
     */
    readonly drawCalls: number
    /** Pixels written at the scene's own resolution: the backdrop plus every sprite. */
    readonly pixels: number
    /** The single scaled blit to the visible canvas. */
    readonly blitPixels: number
    /** `pixels` over the screen area. 1.0 means nothing overlaps anything. */
    readonly overdraw: number
  }
  /** What the page pays once, before the first frame. */
  readonly load: {
    /** Indexed pixels decoded into RGBA. This is the first-paint cost and it is linear. */
    readonly decodePixels: number
    /** Resident canvas memory after decoding, in bytes. */
    readonly canvasBytes: number
    /** Offscreen canvases held: one strip per layer, plus the buffers. */
    readonly canvases: number
  }
  readonly wire: {
    /** Indexed bytes before base64 and before gzip. */
    readonly indexBytes: number
    /** The whole HTML document, as served. Filled in by whoever serves it. */
    readonly gzipBytes: number
  }
}

/**
 * Count a stage. Pure, and it reads exactly the quantities the runtime will act on — the
 * arithmetic here mirrors `mount()` in `app.ts` call for call, because a budget derived from a
 * different loop than the one that runs is a budget for a different program.
 */
export function budgetOf(stage: Stage, gzipBytes = 0): Budget {
  const screen = stage.w * stage.h

  let sprites = 0
  for (const p of stage.placed) {
    const layer = stage.layers[p.layer]
    if (layer !== undefined) sprites += layer.w * layer.h
  }

  let decodePixels = 0
  for (const layer of stage.layers) decodePixels += layer.w * layer.h * layer.frames

  // One stamp per rain column. It used to be one fillRect per drop pixel — five times as many
  // calls for the same pixels — and the budget is what made that visible.
  const rainCalls =
    stage.rain === null ? 0 : Math.ceil(stage.w / stage.rain.spacing) + 2

  /**
   * **The climb pays for a sky it redraws, a field, a star field and an unbounded tower**, and
   * counting only `placed` would have reported three draw calls for a frame that makes about
   * two hundred. **A budget that does not know about a whole draw path is an instrument
   * reporting cheap because it is blind, which is the flattering direction `HARNESS.md` §5 says
   * instrument defects always come in.**
   *
   * Every term below is a loop in `drawClimb`, counted the same way the rain is:
   *
   * - the sky is quantised into 14 bands, one fillRect each, because a per-row gradient is 300
   * - the star field is baked into a two-screen tile at mount and stamped twice for the wrap.
   *   It was 110 fillRects and that is what pushed this scene over the ceiling
   * - the garden floor is one baked strip, stamped once, and only while it is on screen
   * - the motes are one fillRect each and genuinely move, so they stay counted at full price
   * - the tower is however many bands fit on screen, times the shelves in a band, times up to
   *   two for a shelf straddling the seam
   */
  const c = stage.climb
  const climbCalls =
    c === null
      ? 0
      : 14 + 1 + 2 + c.motes.count +
        (Math.ceil(stage.h / c.bandH) + 2) * c.perBand * 2
  const climbPixels =
    c === null
      ? 0
      : stage.w * stage.h + c.motes.count +
        (Math.ceil(stage.h / c.bandH) + 2) * c.perBand * sprites

  return {
    perFrame: {
      // backdrop + rain + subjects + the climb's own loops + the final blit
      drawCalls: 1 + rainCalls + stage.placed.length + climbCalls + 1,
      pixels: screen + sprites + climbPixels,
      blitPixels: stage.w * stage.scale * stage.h * stage.scale,
      overdraw: (screen + sprites + climbPixels) / screen,
    },
    load: {
      decodePixels,
      canvasBytes: decodePixels * 4 + screen * 4 * 2,
      canvases: stage.layers.length + 3,
    },
    wire: { indexBytes: decodePixels, gzipBytes },
  }
}

/** The budget as the short strings the page prints in its facts row. */
export function budgetFacts(b: Budget): readonly string[] {
  const k = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n))
  return [
    `${b.perFrame.drawCalls} draw calls/frame`,
    `${k(b.perFrame.pixels)} px/frame`,
    `${b.perFrame.overdraw.toFixed(2)}× overdraw`,
    `${k(b.load.decodePixels)} px to decode`,
    `${(b.load.canvasBytes / 1048576).toFixed(1)} MB resident`,
    ...(b.wire.gzipBytes > 0 ? [`${Math.round(b.wire.gzipBytes / 1024)} KB on the wire`] : []),
  ]
}
