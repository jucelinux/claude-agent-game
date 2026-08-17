/**
 * **The street furniture, and the three heights are derived from the two impulses rather than
 * chosen.**
 *
 * The ollie reaches 22 px and the kickflip reaches 48. So the kerb at 9 and the cone at 18 are
 * ollie obstacles, and the rail at 30 is **unreachable without the flip**. That is the same
 * arithmetic the crypt used, and it is the difference between a differentiator and a decoration:
 * a third of the street cannot be cleared by the button a player finds first.
 *
 * The runtime reads each obstacle's height from its **own art** — the top row of the crop above
 * the ground line — so a stone's difficulty is a fact about how it was drawn and never a number
 * typed in two places.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * Concrete, steel and a cone, at dusk. The ramps are hue-shifted the same way the rider's are,
 * and they are deliberately **narrower in range** than the rider's: street furniture that carried
 * the palette's bright end would compete with the skater for the eye.
 */
const FURNITURE: Palette = {
  name: 'street',
  colors: [
    [0, 0, 0],
    // concrete — cool, and the light end stops well short of white.
    [30, 30, 40], [50, 52, 64], [74, 76, 90], [102, 104, 118], [134, 136, 150],
    // cone — the one saturated thing on the road, so an obstacle is never missed.
    [58, 24, 16], [104, 42, 22], [156, 66, 28], [200, 100, 44], [236, 148, 82],
    // steel — a rail. Bright at the top edge only, which is what a round bar does under a lamp.
    [26, 28, 38], [44, 48, 62], [70, 76, 94], [110, 118, 140], [172, 180, 200],
    // ink — the same line the rider uses, so the two are drawn by one hand.
    [10, 9, 16], [16, 14, 26], [24, 21, 38], [34, 30, 52], [46, 40, 66],
  ],
  ramps: [
    { material: 'concrete', indices: [1, 2, 3, 4, 5] },
    { material: 'cone', indices: [6, 7, 8, 9, 10] },
    { material: 'steel', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

const STILL = { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] } as const

/** A kerb: 9 px, and the cheapest thing an ollie clears. One block and a lip. */
export const streetKerb: Grammar = {
  name: 'street-kerb',
  palette: FURNITURE,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'block', bone: 'root', material: 'concrete', shape: { kind: 'rect', x: -11, y: -9, w: 22, h: 9, d: 9 } },
    // The lip catches the light and is the only thing that stops a kerb reading as a grey slab.
    { weld: true, name: 'lip', bone: 'root', material: 'concrete', shape: { kind: 'rect', x: -11.6, y: -9.6, w: 23.2, h: 1.8, d: 10 } },
  ],
  gait: STILL,
}

/**
 * A traffic cone: 18 px, the top of the ollie's range.
 *
 * A tapered capsule rather than a triangle, because the vocabulary has no triangle and a cone
 * *is* a swept sphere with a shrinking radius — which is what `capsule.r1` has been since run 6.
 */
export const streetCone: Grammar = {
  name: 'street-cone',
  palette: FURNITURE,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'base', bone: 'root', material: 'cone', shape: { kind: 'rect', x: -5.5, y: -2.2, w: 11, h: 2.2, d: 10 } },
    { weld: true, name: 'body', bone: 'root', material: 'cone', shape: { kind: 'capsule', x0: 0, y0: -2.6, x1: 0.2, y1: -16.6, r: 4, r1: 1.1 } },
    // The reflective band: a marking, which is the right primitive here — it recolours the
    // surface it lies on and adds nothing to the silhouette, which is exactly what a sticker is.
    { name: 'band', bone: 'root', material: 'concrete', z: -2.4, shape: { kind: 'capsule', x0: -2.6, y0: -10.4, x1: 2.6, y1: -10.4, r: 1.5 }, marking: true },
  ],
  gait: STILL,
}

/**
 * A rail: 30 px, and **the ollie cannot clear it.**
 *
 * 22 px of ollie against 30 px of rail is the gate on the second button. It is set from the
 * impulse rather than the impulse from it, so a player who never presses twice has a hard ceiling
 * on how far they get and finds out why within a few seconds.
 */
export const streetRail: Grammar = {
  name: 'street-rail',
  palette: FURNITURE,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'postL', bone: 'root', material: 'steel', shape: { kind: 'capsule', x0: -8, y0: 0, x1: -8, y1: -28, r: 1.6 } },
    { weld: true, name: 'postR', bone: 'root', material: 'steel', shape: { kind: 'capsule', x0: 8, y0: 0, x1: 8, y1: -28, r: 1.6 } },
    // The bar is the top of the silhouette and therefore the thing the runtime reads as height.
    { weld: true, name: 'bar', bone: 'root', material: 'steel', shape: { kind: 'capsule', x0: -10, y0: -28.4, x1: 10, y1: -28.4, r: 1.8 } },
    { weld: true, name: 'footL', bone: 'root', material: 'concrete', shape: { kind: 'rect', x: -10.4, y: -2, w: 4.8, h: 2, d: 7 } },
    { weld: true, name: 'footR', bone: 'root', material: 'concrete', shape: { kind: 'rect', x: 5.6, y: -2, w: 4.8, h: 2, d: 7 } },
  ],
  gait: STILL,
}
