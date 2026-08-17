/**
 * **Micro game 7: the rodeo.** His commission, 17/08, and the aesthetic is a him-named
 * reference for the first time:
 *
 * > *"desenvolver a próxima proposta de microjogo (o do snowboarding)… eu quero que a estética
 * > desse seja bem pixel art mesmo. Então nesse jogo pode aplicar a mesma estética e referência
 * > visual do Yoshi Island, do snes."*
 *
 * ## What Yoshi's Island IS, at the scene level — numbers off his reference image
 *
 * - **The sky is a teal ramp woven on a 2×2 lattice** — the SNES checkerboard blend, not the
 *   4×4 Bayer the dusk and the dawn used. The lattice IS the aesthetic statement here.
 * - **Snowfall in front of everything**: white flakes, slow, drifting — a field, in the runner
 *   path for the first time because this is the first runner with weather.
 * - **Outlined clouds** and a treeline: the same crayon draws sky and furniture, so the drift
 *   bands carry piste grammars rather than the aero's soft storm layer.
 * - High key everywhere: the darkest thing on screen is a drawn line, never a fill.
 *
 * ## What is under test — transfer test C, reshaped by his sentence
 *
 * The boarder's root LEANS, and the rodeo composes a full roll with that screen-plane angle —
 * the declared approximation, exercised at a changing angle every frame. The jump is the
 * screen-plane control. Structure is the street's, one variable, third time.
 */
import type { Scene } from '../scene/types.ts'

/** Teal to near-white, the reference's winter sky, zenith down. Woven at 2×2 — the checker. */
const YISKY: readonly [number, number, number][] = [
  [40, 130, 142],
  [66, 156, 162],
  [98, 182, 184],
  [136, 206, 204],
  [178, 228, 222],
  [218, 246, 238],
]

/**
 * The snowfield, receding: brightest at the far edge where it meets the pale horizon, cool
 * blue directly under the camera — snow shadows are blue, never grey, per the reference.
 */
const SNOWFIELD: readonly [number, number, number][] = [
  [148, 168, 202],
  [172, 190, 218],
  [196, 212, 234],
  [218, 232, 246],
  [236, 246, 252],
  [250, 253, 255],
]

export const snowScene: Scene = {
  name: 'snow',
  /** 240×150 at ×4 — the runner register, third game. */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 118,
  nearRow: 150,
  haze: 0,
  sky: [40, 130, 142],
  groundRamp: SNOWFIELD,
  /**
   * **Snowfall, and it is the first field in a runner.** Three flake tones for three depths,
   * 2 px flakes, a light sideways drift, and 0.14 of a pass per cycle — about 38 px/s, which
   * is snow; a whole pass is hail. Drawn in FRONT of the world, as the reference has it.
   */
  fields: [
    {
      kind: 'rain',
      colors: [[178, 198, 224], [214, 228, 244], [250, 252, 255]],
      spacing: 13,
      length: 2,
      slant: 0.35,
      passes: 0.14,
      seed: 51,
    },
  ],
  placements: [
    {
      grammar: 'snow-carve', tunables: 'snow', x: 58, depth: 0, anchor: 'foot',
      clips: {
        carve: { grammar: 'snow-carve', tunables: 'snow' },
        air: { grammar: 'snow-jump', tunables: 'snow-jump' },
        rodeo: { grammar: 'snow-rodeo', tunables: 'snow-rodeo' },
      },
      runs: { run: 'carve', leap: 'air', flip: 'rodeo' },
    },
  ],
  runner: {
    groundRow: 118,
    holdX: 58,
    /** Between the street and the dawn: powder is slower than asphalt, faster than nothing. */
    speed: 130,
    accel: 3,
    maxSpeed: 205,
    gravity: 430,
    /**
     * **Two impulses, the street's arithmetic, third derivation.** 150²/2·430 = 26 px of jump:
     * over the snowman at ~17 and the sapling at ~22, under the tall pine at ~38. The rodeo
     * adds 165, apex 58. A fifth of the piste needs the second press.
     */
    jump: 150,
    flip: 165,
    /** One and a half board lengths per pump — the skate's derivation on a 24 px board. */
    strideLen: 50,
    stones: [
      { grammar: 'piste-snowman', tunables: 'piste' },
      { grammar: 'piste-sapling', tunables: 'piste' },
      { grammar: 'piste-snowman', tunables: 'piste' },
      { grammar: 'piste-pine', tunables: 'piste' },
      { grammar: 'piste-sapling', tunables: 'piste' },
    ],
    /** Worst gap = spacing − jitterX = 150 px = 0.73 s at the 205 cap, against a 0.70 s hang. */
    leadIn: 260,
    spacing: 190,
    jitterX: 40,
    // The body, not the board: 9 covers the suit, and a nose that kills you is a nose a
    // player will hate — the board-tip rule, third statement.
    bodyHalfW: 9,
    stoneHalfW: 8,
    // The boarder's own height, so the score counts body lengths.
    pxPerMetre: 34,
    overText: 'you wiped out at ',
    /**
     * **Lattice 2 at full amplitude — the checker IS Yoshi's Island.** The dusk and the dawn
     * ran the 4×4 Bayer; his reference blends its sky with the coarse 2×2 checkerboard, and
     * that difference is most of what "SNES pixel art" means at a glance. Static backdrop, no
     * crawl, by construction.
     */
    dither: { amount: 1, lattice: 2 },
    skyRamp: YISKY,
    /**
     * Two drift bands, both drawn with the scene's own crayon: outlined puffs high and slow,
     * and a treeline standing ON the horizon at a third of the world's speed — the piste's
     * own pines at 0.55 scale, so distance is said twice, smaller and slower.
     */
    drift: [
      {
        puffs: [{ grammar: 'piste-puff', tunables: 'puff' }],
        spacing: 130, jitterX: 80, minY: 18, maxY: 58, parallax: 0.14, seed: 33,
      },
      {
        puffs: [
          { grammar: 'piste-pine', tunables: 'piste', scale: 0.55 },
          { grammar: 'piste-sapling', tunables: 'piste', scale: 0.55 },
        ],
        spacing: 84, jitterX: 50, minY: 114, maxY: 117, parallax: 0.35, seed: 77,
      },
    ],
    seed: 23,
  },
}
