/**
 * **Rain and snowfall: one field, three games.**
 *
 * A column of drops, hashed rather than stored, drawn in groups so a thousand pixels cost a
 * handful of calls. It is shared because the climb, the runner and the descent all weather.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { ctx2d } from './canvas.ts'
import { rgb } from './paint.ts'
import type { Canvas, Ctx2D, Payload, RGB } from './types.ts'

export function makeRain(S: Payload, ox: Ctx2D, cv: (w: number, h: number) => Canvas): (t: number) => void {
  /**
   * **A drop is a sprite, stamped once per column.** It used to be one fillRect per drop
   * pixel — 240 calls a frame against 19 for every subject in the wood put together, and a
   * canvas call costs the same whether it moves one pixel or a thousand. 48 now.
   *
   * The stamp is byte-identical to the per-pixel version because x0 and the row index are
   * both integers: round(x0 + k*slant) equals x0 + round(k*slant) for integer x0, so baking
   * the slant into the stamp changes nothing. It is a cheaper way to say the same thing, not
   * a cheaper-looking rain.
   */
  const drops: { canvas: Canvas; ox: number }[] = []
  if (S.rain) {
    for (var ci = 0; ci < S.rain.colors.length; ci++) {
      var xs = [], lo = 0, hi = 0
      for (var dk = 0; dk < S.rain.length; dk++) {
        // **Named 'lean', and the name is the bug fix.** It was 'off', which is also the name
        // of the offscreen buffer twelve lines up — and 'var' is function-scoped, so building
        // the rain stamps quietly replaced the canvas the whole page draws into with the
        // number -1. Every frame then called drawImage on an integer.
        var lean = Math.round(dk * S.rain.slant); xs.push(lean)
        if (lean < lo) lo = lean
        if (lean > hi) hi = lean
      }
      var stamp = cv(hi - lo + 1, S.rain.length), stx = ctx2d(stamp)
      stx.fillStyle = rgb(S.rain.colors[ci]!)
      for (var dj = 0; dj < S.rain.length; dj++) stx.fillRect(xs[dj]! - lo, dj, 1, 1)
      drops.push({ canvas: stamp, ox: lo })
    }
  }

  function rain(t: number) {
    var R = S.rain; if (!R) return
    var span = S.h + R.length * 2
    var cols = Math.ceil(S.w / R.spacing) + 2
    for (var c = 0; c < cols; c++) {
      // The same integer hash the compositor used, so the sheet is irregular and identical
      // on every machine. What changed is only that its phase now advances in seconds.
      // The trailing >>> 0 is load-bearing: XOR in JS yields a SIGNED 32-bit integer, so
      // without it hsh goes negative and hsh % colors.length returns -1. That indexed one
      // slot before the rain's palette in the compositor and had done since the rain was
      // written — silently, because the wrong entry is a plausible grey.
      var hsh = ((c + R.seed) * 2654435761) >>> 0; hsh = (hsh ^ (hsh >>> 13)) >>> 0
      var ph = (hsh % 1024) / 1024
      var x0 = c * R.spacing + (hsh % R.spacing)
      var d = drops[hsh % drops.length]!
      var fall = (((t * R.speed / span) + ph) % 1) * span - R.length
      ox.drawImage(d.canvas, x0 + d.ox, Math.round(fall))
    }
  }


  return rain
}
