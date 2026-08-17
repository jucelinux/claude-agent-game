/**
 * **Micro game 8: the descent — the REAL transfer test C, his correction honoured.**
 *
 * > *"Eu me recordo da sugestão desse microgame ter o objetivo de validar a relação da câmera no
 * > jogo, certo?"* — correct, and batch 6 had resolved that away silently. This game is the
 * > camera: the first new view since the moon, looking down the slope from high behind the
 * > rider — who travels INTO the screen, so terrain is born small at the horizon and grows
 * > down the perspective curve toward him (the batch-7 correction, his words compiled).
 *
 * ## What is under test
 *
 * 1. **The camera relation**: a whole game shape (`Scene.descent`) in a view the engine never
 *    had — world scrolling down the fall line, painter's order by slope distance, the rider
 *    spliced into it at his own row.
 * 2. **The composition at carve amplitude**: steering plays the carve, whose root holds a
 *    31–36° bank while the chest and board ROLL under it — the declared approximation, run at
 *    the amplitude batch 6 lacked, measured against matrix ground truth in the locks.
 *
 * The Yoshi's Island winter carries over whole: same palettes, the 2×2 checker, snowfall in
 * front, one crayon.
 */
import type { Scene } from '../scene/types.ts'

/** The run-19 sky, unchanged: one mountain, two cameras. */
const YISKY: readonly [number, number, number][] = [
  [40, 130, 142],
  [66, 156, 162],
  [98, 182, 184],
  [136, 206, 204],
  [178, 228, 222],
  [218, 246, 238],
]

/**
 * **The piste under the camera: near the bottom edge the snow is closest and coolest.** The
 * ramp walks horizon-bright to near-blue, so the slope reads as receding even though the
 * projection never forshortens — rows are the whole of depth here, the moon's own rule.
 */
const PISTE_RAMP: readonly [number, number, number][] = [
  [188, 206, 230],
  [204, 220, 240],
  [220, 234, 248],
  [234, 244, 252],
  [246, 251, 255],
  [252, 254, 255],
]

export const descentScene: Scene = {
  name: 'descent',
  /** 240×150 at ×4, the register. The horizon strip takes the top 34 rows. */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  /** `ground` is the horizon here: the floor ramp fills every row below it. */
  ground: 34,
  nearRow: 150,
  haze: 0,
  sky: [40, 130, 142],
  groundRamp: PISTE_RAMP,
  /** The same snowfall as `/snow`, in front of the world. */
  fields: [
    {
      kind: 'rain',
      colors: [[178, 198, 224], [214, 228, 244], [250, 252, 255]],
      spacing: 13,
      length: 2,
      slant: 0.35,
      passes: 0.14,
      seed: 87,
    },
  ],
  placements: [
    {
      grammar: 'descent-glide', tunables: 'descent', x: 120, depth: 0, anchor: 'origin',
      clips: {
        glide: { grammar: 'descent-glide', tunables: 'descent' },
        carve: { grammar: 'descent-carve', tunables: 'descent-carve' },
        launch: { grammar: 'descent-launch', tunables: 'descent-launch' },
      },
      rides: { glide: 'glide', carve: 'carve', launch: 'launch' },
    },
  ],
  descent: {
    /** The horizon: sky and ridge above, piste below — the scene's own `ground`, restated
     * here because the descent path owns its backdrop. */
    horizonRow: 34,
    /**
     * **Held near the BOTTOM — the batch-7 correction.** The rider travels INTO the screen,
     * so the forward view is everything between him and the horizon: obstacles are born small
     * at the vanishing point and grow down the perspective curve toward his row.
     */
    holdY: 118,
    /**
     * **The divide's three numbers.** A thing A ahead draws at zNear/(A+zNear): half size at
     * 130 px ahead, 0.13 at the 880 px spawn, snapped to a 0.2 floor — the look found the 0.15 band
     * fragmenting into dots (a 1 px tier is not a tree), so the smallest render is 8 px and a
     * thing is born whole. Seven crisp renders per obstacle, never a resample.
     */
    zNear: 130,
    range: 880,
    scales: [1, 0.78, 0.6, 0.45, 0.33, 0.26, 0.2],
    /** Bands at 0.45 and under drop the drawn line — the look's finding, through the grammar. */
    farTunables: 'piste-far',
    farBelow: 0.45,
    /** Flecks cycling down the perspective curve: the treadmill between obstacles. */
    dust: { count: 42, colors: [[204, 220, 238], [178, 196, 222]], seed: 29 },
    minX: 16,
    maxX: 224,
    /** Fast enough to carve between lanes, slow enough that steering is a commitment. */
    steer: 92,
    /** The slope feeds the speed for ever — the runner's ramp, turned downhill. */
    speed: 112,
    accel: 4,
    maxSpeed: 190,
    /** The hop: 0.55 s of air. It is an escape, not a flight — the carve is the verb here. */
    jump: 118,
    gravity: 430,
    /**
     * **20 px of clearance, and the art decides what is jumpable.** The rock (~12) and the
     * snowman (~18) pass under it; the sapling (~24) and the pine (~39) do not. No flags —
     * the crop's own height, the engine's oldest collision rule.
     */
    clearance: 20,
    strideLen: 48,
    stones: [
      { grammar: 'piste-rock', tunables: 'piste' },
      { grammar: 'piste-sapling', tunables: 'piste' },
      { grammar: 'piste-snowman', tunables: 'piste' },
      { grammar: 'piste-pine', tunables: 'piste' },
      { grammar: 'piste-rock', tunables: 'piste' },
    ],
    /**
     * **A slot every 120 slope px with 70 of jitter** — the whole approach is visible from
     * birth at the horizon, ~5 s of warning at the cap, so the game's pressure is lane
     * planning rather than reaction. Asserted in the locks.
     */
    leadIn: 220,
    spacingD: 120,
    jitterD: 70,
    bodyHalfW: 7,
    bodyHalfD: 6,
    stoneHalfW: 7,
    stoneHalfD: 7,
    /** The rider's own height, as every score here. */
    pxPerMetre: 32,
    overText: 'you wiped out at ',
    /** The 2×2 checker at full amplitude — the aesthetic decision, carried whole. */
    dither: { amount: 1, lattice: 2 },
    skyRamp: YISKY,
    /** The far ridge: the piste's own pines at 0.55, baked static on the horizon. */
    ridge: {
      puffs: [
        { grammar: 'piste-pine', tunables: 'piste', scale: 0.55 },
        { grammar: 'piste-sapling', tunables: 'piste', scale: 0.55 },
      ],
      spacing: 26,
      jitterX: 16,
      row: 34,
      seed: 61,
    },
    /** Outlined puffs in the sky strip, baked with the ridge. */
    clouds: { grammar: 'piste-puff', tunables: 'puff', count: 4, minY: 6, maxY: 18, seed: 19 },
    seed: 137,
  },
}
