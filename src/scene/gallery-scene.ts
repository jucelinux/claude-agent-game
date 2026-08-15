/**
 * **Every drawing this project has made, standing in one place.** His request, 15/08.
 *
 * The point is not the picture. It is the three questions a strip of loops cannot ask:
 * do these belong to one game, how big are they relative to each other, and do their
 * palettes have anything in common. Nothing here is tuned to flatter the answer — the
 * subjects arrive exactly as they were authored, and the merge is exact-match only.
 *
 * **Relative size is a decision made here for the first time.** Every subject was authored
 * to fill its own 64 px cell, so at their rendered sizes a beetle and a gorilla are the
 * same animal. The target heights below are game proportions rather than real ones: a
 * playable tree is two or three times a character, never the twenty it would be outdoors.
 */
import type { Scene } from './compose.ts'

/** Target height in scene pixels ÷ the subject's measured height × the scale it was authored at. */
const fit = (target: number, measured: number, authored: number): number => Math.round((authored * target * 100) / measured) / 100

export const galleryScene: Scene = {
  name: 'everything-so-far',
  w: 248,
  h: 96,
  // 24 frames × 50 ms = 1200 ms. Every subject below plays a whole number of its own cycles
  // inside it, which is what keeps the loop point silent.
  frames: 24,
  msPerFrame: 50,
  scale: 2,
  ground: 80,
  /**
   * **[104, 116, 138], and it was measured rather than picked.** Four candidate skies were
   * tested against every subject's edge contrast: a dark sky loses four of the eight, a
   * light sky loses four as well and by the opposite mechanism, and only a mid value clears
   * all of them — minimum 0.138 against the project's floor of 0.10.
   *
   * That is not luck. **Every subject in this repository was tuned against the viewer's mid
   * grey**, and they collectively occupy the whole value range, so only a mid backdrop gives
   * every one of them contrast at both ends. The finding generalises past this scene: a
   * sprite tuned against one background is not portable to another, so **a palette and its
   * backdrop are one decision and not two**.
   */
  sky: [104, 116, 138],
  // Clearly darker than the sky, so a horizon exists, and dark enough that the light tones
  // on every subject's feet still separate from it.
  groundRamp: [
    [26, 27, 32],
    [36, 38, 45],
    [48, 51, 60],
    [66, 71, 82],
  ],
  placements: [
    // Back row: the tree is the only thing here that is scenery rather than a character.
    { grammar: 'tree', tunables: 'tree', x: 40, footY: 79, scale: fit(72, 58, 0.78) },

    // Middle row: the characters, all on the same floor.
    { grammar: 'probe-d', tunables: 'probe-d', x: 100, footY: 81, scale: fit(29, 44, 1) },
    { grammar: 'gorilla', tunables: 'gorilla', x: 140, footY: 81, scale: fit(31, 42, 1) },
    // 16 frames at 75 ms = 1200 ms, one whole cycle: retimed from its own 1760.
    { grammar: 'gorilla-mech', tunables: 'gorilla-mech', x: 182, footY: 81, scale: fit(33, 46, 1), msPerFrame: 75 },
    // 12 frames at 50 ms = 600 ms, two cycles: retimed from its own 780.
    { grammar: 'gorilla-jump-chrono', tunables: 'gorilla-jump-chrono', x: 222, footY: 81, scale: fit(33, 56, 0.88), msPerFrame: 50 },

    // Front row: the arthropods, lower on screen so the y-sort puts them nearest.
    { grammar: 'beetle', tunables: 'beetle', x: 62, footY: 89, scale: fit(15, 42, 1) },
    { grammar: 'mantis', tunables: 'mantis', x: 122, footY: 91, scale: fit(16, 43, 1) },
    { grammar: 'scorpion', tunables: 'scorpion', x: 196, footY: 90, scale: fit(15, 39, 1) },
  ],
}
