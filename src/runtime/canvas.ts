/**
 * **The two things that touch the browser directly.**
 *
 * A canvas maker and a sprite-sheet decoder. They are separate from `paint.ts` because they are
 * the only functions in the runtime that reach for a global — `document` and `atob` — and a
 * module that reaches for a global should say so in its name and be the only one that does.
 */
import type { Canvas, Layer } from './types.ts'

export function cv(w: number, h: number): Canvas {
  var c = document.createElement('canvas'); c.width = w; c.height = h; return c
}

/** One layer's whole cycle as a vertical strip. Decoded once, drawn from thereafter. */
export function decode(L: Layer): Canvas {
  var c = cv(L.w, L.h * L.n), x = c.getContext('2d')
  var img = x.createImageData(L.w, L.h * L.n), raw = atob(L.indices), per = L.w * L.h * L.n
  for (var i = 0; i < per; i++) {
    var idx = raw.charCodeAt(i), o = i * 4
    if (idx === 0) { img.data[o+3] = 0; continue }
    var p = L.palette[idx]
    img.data[o] = p[0]; img.data[o+1] = p[1]; img.data[o+2] = p[2]; img.data[o+3] = 255
  }
  x.putImageData(img, 0, 0)
  return c
}

