/**
 * **The drawing primitives that belong to no game.**
 *
 * Pure functions, every one: same arguments, same result, no state, no canvas of their own and
 * no payload. They were scattered through a 2000-line closure where a reader could not tell
 * them from the game code around them, and where the compiler could not tell them anything at
 * all. `rowOf` alone is called from fourteen places in five different games — it is the one
 * placement rule, and it now looks like one.
 */
import type { Ctx2D, Layer, Payload, RGB } from './types.ts'

/**
 * **A layer by index, with the invariant stated once instead of asserted eighteen times.**
 *
 * Every index the runtime holds was written by `toStage` as the position it pushed the layer to,
 * so the read cannot miss — but nothing in `readonly Layer[]` says that, and eighteen call sites
 * were each carrying the claim silently. It throws rather than returning undefined, so a payload
 * that ever did disagree says so on the boot channel instead of drawing nothing.
 */
export function layerAt(S: Payload, i: number): Layer {
  const L = S.layers[i]
  if (L === undefined) throw new Error('the payload has no layer ' + i + ' — the stage and the page disagree')
  return L
}

/** A colour triple as the string a 2D context wants. */
export function rgb(c: RGB): string { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' }


/**
 * **Where a layer's crop goes, given the row its subject stands on.**
 *
 * 'origin' puts the sprite's own origin on the row — right when the author put the origin
 * at the ground contact, which is every tree. 'foot' puts the lowest painted pixel there —
 * right when the origin is somewhere else, like a person's pelvis.
 *
 * **It is applied per LAYER, and that is the fix.** It used to be resolved once against a
 * subject's main clip, so a photographer who stands with his feet 21 px below his pelvis
 * and lies down with them beside it was drawn lying down at standing height — floating.
 */
export function rowOf(D: { anchor?: string; y: number }, L: Layer): number { return D.anchor === 'foot' ? D.y + L.oy - L.foot : D.y + L.oy }


/**
 * **Which of eight compass points an input vector points at.** The western half is reached
 * by mirroring the eastern half, so only five are ever rendered — and mirroring is correct
 * for a *turn* in a way it is not for lighting, which is why 'layers.ts' re-renders the lamp
 * and this function does not care.
 *
 * 'last' is returned when nothing is pressed, so releasing the keys leaves him facing where
 * he was walking rather than snapping back to a default.
 */
export function compass(dx: number, dy: number, last: string): string {
  if (dx === 0 && dy === 0) return last
  if (dx === 0) return dy < 0 ? 'n' : 's'
  if (dy === 0) return 'e'
  return dy < 0 ? 'ne' : 'se'
}


/**
 * **The ordered weave, shared by every backdrop that has a surface.** It lived inside the
 * runner's block until the descent needed it too — two copies of a quantiser would be two
 * quantisers eventually, the compose/layers lesson.
 */
export const BAY4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
export const BAY2 = [0,2,3,1]
export function bayerAt(x: number, y: number, n: number): number {
  if (n === 2) return (BAY2[(y & 1) * 2 + (x & 1)]! + 0.5) / 4 - 0.5
  return (BAY4[(y & 3) * 4 + (x & 3)]! + 0.5) / 16 - 0.5
}
/** Paint rows y0..y1 as a dithered ramp through 'stops'. At amount 0 it is flat bands. */
export function ramp(ctx: Ctx2D, w: number, stops: readonly RGB[], y0: number, y1: number, dz: { amount: number; lattice: number }): void {
  // The width is a PARAMETER now, and it was a closure read over the payload. That is the whole
  // difference between a helper and a helper that only works inside one scope — and it is why
  // this one could not be tested, moved or reused without carrying the entire runtime with it.
  var span = y1 - y0
  var img = ctx.createImageData(w, span)
  var d = img.data
  for (var yy = 0; yy < span; yy++) {
    // Position along the ramp in STOP units, so the fraction is the thing to dither.
    var u = (stops.length - 1) * (yy / Math.max(1, span - 1))
    for (var xx = 0; xx < w; xx++) {
      var k = Math.floor(u + dz.amount * bayerAt(xx, y0 + yy, dz.lattice))
      if (k < 0) k = 0
      if (k > stops.length - 1) k = stops.length - 1
      // `k` was clamped to the ramp's own bounds four lines up.
      var c = stops[k]!
      var at = (yy * w + xx) * 4
      d[at] = c[0]; d[at + 1] = c[1]; d[at + 2] = c[2]; d[at + 3] = 255
    }
  }
  ctx.putImageData(img, 0, y0)
}


/** Shortest signed difference between two headings, in turns. */
export function turnDelta(a: number, b: number): number {
  var d = a - b
  while (d > 0.5) d -= 1
  while (d < -0.5) d += 1
  return d
}
