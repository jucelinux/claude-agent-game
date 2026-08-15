/**
 * The three arthropod idioms of the frontier probe. Same body, three palettes — everything
 * else that differs lives in `tunables/probe-*.json`, which is the point: an idiom is a
 * budget, not a drawing.
 *
 * Every ramp is hue-shifted, darks cooler and more saturated, lights warmer. That is the
 * one pixel-art rule I am willing to bake in before a verdict, because it is the
 * difference between a ramp and a greyscale wash — and it is **portable**.
 *
 * stack — all three palettes. Disposable by design (`TASTE-LOOP.md` §3.0).
 */
import type { Palette } from '../../core/types.ts'
import { arthropod } from './arthropod.ts'

/** A — the control. Three tones, warm, cohesion over virtuosity. */
const STARDEW: Palette = {
  name: 'probe-a-stardew',
  colors: [
    [0, 0, 0],
    [72, 42, 46],
    [142, 86, 58],
    [216, 154, 96],
    [34, 26, 36],
    [58, 42, 50],
    [86, 64, 72],
  ],
  ramps: [
    { material: 'chitin', indices: [1, 2, 3] },
    { material: 'ink', indices: [4, 5, 6] },
  ],
}

/** B — the target. Four tones, cold shell against a warm rim: value does the work. */
const CHRONO: Palette = {
  name: 'probe-b-chrono',
  colors: [
    [0, 0, 0],
    [28, 44, 62],
    [50, 86, 104],
    [98, 152, 146],
    [198, 232, 200],
    [14, 16, 28],
    [26, 30, 46],
    [42, 48, 68],
    [62, 70, 92],
  ],
  ramps: [
    { material: 'chitin', indices: [1, 2, 3, 4] },
    { material: 'ink', indices: [5, 6, 7, 8] },
  ],
}

/** C — eight tones and a speckle. The direction my bias pulls toward, here to be knocked
 * down by looking rather than by argument (`BACKLOG.md`). */
const BUDGET: Palette = {
  name: 'probe-c-budget',
  colors: [
    [0, 0, 0],
    [24, 22, 42],
    [42, 38, 68],
    [66, 58, 96],
    [96, 84, 122],
    [132, 116, 148],
    [170, 152, 174],
    [206, 192, 206],
    [238, 232, 238],
    [10, 9, 16],
    [16, 14, 24],
    [24, 20, 34],
    [32, 28, 44],
    [42, 36, 56],
    [52, 46, 68],
    [64, 56, 80],
    [78, 70, 96],
  ],
  ramps: [
    { material: 'chitin', indices: [1, 2, 3, 4, 5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12, 13, 14, 15, 16] },
  ],
}

export const probeA = arthropod('probe-a', STARDEW)
export const probeB = arthropod('probe-b', CHRONO)
export const probeC = arthropod('probe-c', BUDGET)
