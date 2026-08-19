/**
 * **The two things that touch the browser directly.**
 *
 * A canvas maker and a sprite-sheet decoder. They are separate from `paint.ts` because they are
 * the only functions in the runtime that reach for a global — `document` and `atob` — and a
 * module that reaches for a global should say so in its name and be the only one that does.
 */
import type { Canvas, Ctx2D, Layer } from './types.ts'

export function cv(w: number, h: number): Canvas {
  var c = document.createElement('canvas'); c.width = w; c.height = h; return c
}

/**
 * **A 2D context, asserted once instead of guarded everywhere.**
 *
 * `getContext('2d')` is typed nullable because a canvas can already hold a WebGL context or be
 * detached. Neither is reachable here: every canvas this runtime draws on was made two lines
 * above by `cv`. Nineteen call sites were carrying that impossibility; it belongs in one place,
 * with the reason, and it throws rather than returning null so a browser that ever did refuse
 * says so on the boot channel instead of failing silently on the first frame.
 */
export function ctx2d(c: Canvas): Ctx2D {
  const x = c.getContext('2d')
  if (x === null) throw new Error('a canvas this runtime just made refused a 2d context')
  return x
}

/** One layer's whole cycle as a vertical strip. Decoded once, drawn from thereafter. */
export function decode(L: Layer): Canvas {
  const c = cv(L.w, L.h * L.n), x = ctx2d(c)
  var img = x.createImageData(L.w, L.h * L.n), raw = atob(L.indices), per = L.w * L.h * L.n
  for (var i = 0; i < per; i++) {
    var idx = raw.charCodeAt(i), o = i * 4
    if (idx === 0) { img.data[o+3] = 0; continue }
    // Index 0 is transparent and was handled above; every other index came out of the
    // renderer's own palette, so a miss here would mean the payload and the atlas disagree.
    var p = L.palette[idx]!
    img.data[o] = p[0]; img.data[o+1] = p[1]; img.data[o+2] = p[2]; img.data[o+3] = 255
  }
  x.putImageData(img, 0, 0)
  return c
}


