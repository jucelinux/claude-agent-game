/**
 * **The micro games.** His format change, 15/08, and it replaces the sprite shelf.
 *
 * The old surface showed loops: one subject per cell, judged against itself. The new one
 * shows **scenes a thing lives in**. His rule, in his words: *"tudo que eu lhe pedir daqui
 * pra frente nasce como um objeto que pertence a um jogo"* — so a cloud is not delivered as
 * a cloud, it is delivered as a sky a cloud crosses.
 *
 * Two properties this file has and the gallery deliberately does not:
 *
 * - **A micro game is code and renders live.** The gallery keeps frozen output on purpose,
 *   so a refactor shows up as a difference instead of overwriting the past. A micro game is
 *   the opposite: it is the product, so every engine improvement has to flow into every one
 *   ever made. The history remembers; the shelf shows the present.
 * - **Nothing is ever removed.** He revisits these, so the list only grows. An entry that
 *   stops being interesting keeps its slot and says why in its blurb.
 *
 * **The first two entries exist because of his reading of the first scene**, and they are a
 * finding rather than a layout: the arthropods were authored in three-quarter from above and
 * everything else in pure side view. Mixing camera angles is a deeper incoherence than
 * mixing palettes, and the grammar has no notion of camera at all. So they are two games,
 * not one — which shows the defect instead of hiding it behind an arrangement.
 */
import type { Scene } from '../scene/compose.ts'

export type MicroGame = {
  /** Stable, and it never changes: he navigates by it. */
  readonly id: string
  readonly title: string
  /** One sentence on what this iteration added. Not a description of the picture. */
  readonly blurb: string
  readonly date: string
  readonly scene: Scene
}

/**
 * A mid backdrop, measured on 15/08 rather than picked: of four candidate skies only a mid
 * value clears every subject's edge contrast, because they were all tuned against the
 * viewer's grey and collectively span the whole value range.
 */
const SKY: readonly [number, number, number] = [104, 116, 138]
const EARTH: readonly (readonly [number, number, number])[] = [
  [26, 27, 32],
  [36, 38, 45],
  [48, 51, 60],
  [66, 71, 82],
]

/**
 * **Everything drawn in side view, at the size it was authored.**
 *
 * The first scene shrank its subjects to fit a 248 px cell and he saw the cost immediately:
 * *"os objetos perderam resolução"*. Shrinking re-renders at a smaller `body.scale`, so the
 * detail is not scaled down, it is **never drawn**. This one keeps every subject at the
 * scale it was authored for and makes the room instead.
 */
const sideView: Scene = {
  name: 'side-view',
  w: 264,
  h: 112,
  frames: 24,
  msPerFrame: 50,
  scale: 3,
  ground: 96,
  sky: SKY,
  groundRamp: EARTH,
  placements: [
    { grammar: 'tree', tunables: 'tree', x: 42, footY: 95, scale: 1 },
    { grammar: 'probe-d', tunables: 'probe-d', x: 108, footY: 97 },
    { grammar: 'gorilla', tunables: 'gorilla', x: 152, footY: 97 },
    { grammar: 'gorilla-mech', tunables: 'gorilla-mech', x: 200, footY: 97, msPerFrame: 75 },
    { grammar: 'gorilla-jump-chrono', tunables: 'gorilla-jump-chrono', x: 244, footY: 97, msPerFrame: 50 },
  ],
}

/**
 * **The arthropods, in the camera they were actually drawn in.**
 *
 * His finding, and it is the reason this is a second game and not a corner of the first:
 * these three were authored in three-quarter from above. A top-down world has no horizon,
 * so the ground starts at row 0 and there is no sky at all — which is the whole visual
 * difference between the two cameras, expressed as one number.
 */
const topDown: Scene = {
  name: 'top-down',
  w: 176,
  h: 96,
  frames: 24,
  msPerFrame: 50,
  scale: 3,
  ground: 0,
  sky: SKY,
  groundRamp: EARTH,
  placements: [
    { grammar: 'beetle', tunables: 'beetle', x: 40, footY: 58 },
    { grammar: 'mantis', tunables: 'mantis', x: 92, footY: 74 },
    { grammar: 'scorpion', tunables: 'scorpion', x: 140, footY: 90 },
  ],
}

/** Oldest first: the list is a record of iterations and reads in the order they happened. */
export const MICRO_GAMES: readonly MicroGame[] = [
  {
    id: 'side-view',
    title: 'Side view',
    blurb:
      'Every subject drawn from the side, standing on one floor, at the size it was authored. Replaces the first scene, whose subjects were shrunk to fit and lost the detail that shrinking never draws.',
    date: '2026-08-15',
    scene: sideView,
  },
  {
    id: 'top-down',
    title: 'Top down',
    blurb:
      'The arthropods, separated out because they were authored from above and the rest was authored from the side. His reading of the first scene, and it names a capability the grammar does not have: camera is a property of a set, and nothing here declares one.',
    date: '2026-08-15',
    scene: topDown,
  },
]
