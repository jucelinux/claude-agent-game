/**
 * **Micro game 9: the arena — the round that closes the 3D ledger, and the first bench a third
 * person will judge.**
 *
 * His commission, 17/08: one microgame that kills every remaining 3D debt, to be read by a
 * colleague whose memory is *"jogos com a memória gráfica de ps1, com gráficos mais poligonais,
 * com uma mecânica refinada"*. A mech duel was chosen over a dogfight and a racer for a reason
 * the record can defend: **the yaw approximation lives in the gait**, so only a body that walks
 * while it turns can test it, and a rigid craft would have tested the easy half.
 *
 * ## The four debts, and where each one is paid
 *
 * | debt | paid by |
 * |---|---|
 * | yaw has no runtime channel | 12 pre-generated headings; the band is `bodyHeading − cameraHeading`, chosen per frame |
 * | the yaw gait approximation was never measured | the walk plays at all 12; `tests/arena.test.ts` measures it against matrix truth |
 * | the three axes never composed | `mech-boost` pitches AND rolls its root, and the generator yaws the result |
 * | no camera that rotates | this one has a position and a heading on a plane, and both move every frame |
 *
 * ## And the aesthetic, which is a bar rather than a debt
 *
 * `texture.facet` at 2 shades the machines as flat plates with hard creases — one normal per
 * face, which is what fixed-function hardware did and what his colleague's eye remembers. The
 * floor carries a projected **grid**, which is the cue a player of that era read a plane in
 * space from. The palette is hangar: desaturated steel with one hot accent for what is powered.
 */
import type { Scene } from '../scene/types.ts'

/**
 * **Night over an industrial plain: indigo to a sodium glow at the horizon.** Dark, because the
 * machines are the bright things and a facet only reads against a ground that is not competing.
 * Woven on the 2×2 checker, which is the lattice the SNES round measured and the one the era's
 * own blends used.
 */
const NIGHT: readonly [number, number, number][] = [
  [10, 12, 24],
  [16, 20, 38],
  [26, 32, 56],
  [40, 48, 76],
  [62, 68, 96],
  [96, 92, 108],
]

/**
 * **The floor, fogged at the horizon and lit under the camera.** The first stop is the far edge
 * — deliberately close to the sky's last stop, so the plane dissolves into the night instead of
 * ending at a line. Distance fog was the era's own answer to draw distance, and here it is the
 * honest one too: the arena has a radius and the fog is where it stops mattering.
 */
const CONCRETE: readonly [number, number, number][] = [
  [46, 50, 68],
  [58, 62, 82],
  [70, 76, 96],
  [84, 90, 110],
  [98, 104, 124],
  [112, 118, 138],
]

export const arenaScene: Scene = {
  name: 'arena',
  /** 240×150 at ×4, the register every game here uses. */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 58,
  nearRow: 150,
  haze: 0,
  sky: [10, 12, 24],
  groundRamp: CONCRETE,
  placements: [],
  arena: {
    /** The floor's half-width. Both machines are clamped inside it, so a duel cannot run away. */
    radius: 190,
    /** The eye line: 58 of 150, so the floor owns most of the frame and the sky is a band. */
    horizonRow: 58,
    /**
     * **34 units up and 62 back — a camera on a boom, which is the era's own rig.** The height
     * is a little above the machines' heads (30 units), so the floor reads as a plane rather
     * than as a wall, and the grid converges instead of stacking.
     */
    camHeight: 40,
    camDist: 72,
    /**
     * **16 units to the right, and the first build proved it necessary.** With a lock camera the
     * enemy is dead centre by construction; a camera on the player's own axis then puts his back
     * exactly over it, and the two machines overlapped in every frame. Over the shoulder is what
     * the era's own games did, and it is one term.
     */
    camSide: 16,
    /**
     * **2.2 turns a second of easing, and the lag is load-bearing.** A camera welded behind the
     * player would hold him at relative heading 0 for ever and eleven of the twelve yaw bands
     * would never draw. At 2.2 a hard strafe swings him a band or two off centre, which is both
     * what those games looked like and what makes the player's own bands get spent.
     */
    camEase: 2.2,
    /**
     * **80 px per world unit at unit depth.** Derived: a machine stands 30 world units and the
     * camera holds the player at 72, so he draws 30 × 80 / 72 ≈ 33 px — the same on-screen hero
     * height every other game on this shelf uses.
     */
    focal: 80,
    near: 14,
    /**
     * **Twelve headings, thirty degrees apart.** The astronaut's eight served a player choosing
     * from eight inputs; here the camera turns continuously, so the relative heading does too,
     * and 45° steps would show the seam. Same step the kickflip needed between frames.
     */
    bands: 12,
    /**
     * **Four sizes, and the player always draws at the first.** The rig holds him at exactly
     * `camDist`, so his factor is 1 by construction; the enemy lives between 0.3 and 0.6 at
     * duel range. Each is a full crisp render, never a resample — the `/descent` rule.
     */
    scales: [1, 0.58, 0.42, 0.3],
    walk: 'mech-walk',
    boost: 'mech-boost',
    /** World units per second: a heavy machine walks, and the strafe is a shade slower. */
    speed: 46,
    strafe: 40,
    /**
     * **The dash: 120 units a second for 420 ms, then 900 ms of nothing.** That is 50 units of
     * ground — most of a duel's width — bought by one press and paid for by a second of being a
     * target. Managing that is the refined mechanic his colleague is being asked to feel.
     */
    boostSpeed: 120,
    boostMs: 420,
    boostCoolMs: 900,
    /** 26 world units per stride cycle: the machine's own leg length, so the walk never slides. */
    strideLen: 26,
    /**
     * **A shot crosses the duel in about a second**, which is the number the whole fight is
     * built on: fast enough to punish standing still, slow enough that a strafe or a dash can
     * beat it. 9 damage against 100 armour is twelve clean hits.
     */
    shotSpeed: 210,
    shotRange: 300,
    shotHalf: 13,
    damage: 9,
    reloadMs: 300,
    armour: 100,
    /** The machine holds between 70 and 130 units: inside it backs off, outside it closes. */
    aiClose: 70,
    aiFar: 130,
    aiReloadMs: 760,
    /**
     * **38 units between grid lines.** Just over one machine's width, so a player can read his
     * own speed off the floor — which is what a grid is for, and why it is not decoration.
     */
    grid: { step: 38, color: [52, 60, 88], fade: [22, 26, 44] },
    /** Seven pillars, placed by the same integer hash every world here uses. */
    pillars: { grammar: 'hangar-pillar', tunables: 'hangar', count: 7, seed: 91 },
    skyRamp: NIGHT,
    floorRamp: CONCRETE,
    /** The 2×2 checker at full amplitude, on the only two surfaces big enough to hold it. */
    dither: { amount: 1, lattice: 2 },
    seed: 404,
  },
}
