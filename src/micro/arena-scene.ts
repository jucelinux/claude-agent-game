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
 *
 * ## Cycle 2 — the colleague's miss, 17/08
 *
 * > *"Eu não gostei dos gráficos. Pareceu aquelas tentativas de 3d em jogos 2d (Sonic 3d, Crack
 * > Down). Eu esperava algo mais poligonal mesmo no estilo Armored Core (mechas grandes na tela,
 * > uma tela maior, mais velocidade, dinâmica)."*
 *
 * He named the technique exactly — banded-yaw sprites on a projected floor **are** the Sonic 3D
 * method — and then named the fix without meaning to. Three of his four words are one number:
 * the frame went 240×150 → 288×180, the machine 34 px → 60, the duel 70–130 units → 44–88, and
 * every speed with them. Nothing about the drawing changed. Batch 4 had already measured the
 * same law from the other side ("the cause is scale, not the drawn line").
 *
 * His three concrete defects each turned out to live a layer below where they were reported:
 * the camera was a heading stored in turns and read as radians; the pillar was a prop the
 * simulation had never been told about; and *"flutuando"* was three separate things, the largest
 * of them being that every machine had been stamped by its core rather than its feet since the
 * first build. All four are closed here and in `src/micro/app.ts`.
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
  /**
   * **288×180 at ×4 — the first game on this shelf to leave the 240 register, and the reason is
   * his colleague's own words: *"mechas grandes na tela, uma tela maior, mais velocidade,
   * dinâmica"*. Three of those four are one number, and it is scale. Batch 4 already found this
   * from the other side ("the cause is scale, not the drawn line"); this is the same finding
   * spent deliberately instead of discovered again.
   */
  w: 288,
  h: 180,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 58,
  nearRow: 180,
  haze: 0,
  sky: [10, 12, 24],
  groundRamp: CONCRETE,
  placements: [],
  arena: {
    /** The floor's half-width. Both machines are clamped inside it, so a duel cannot run away. */
    radius: 190,
    /**
     * **The eye line at 58 of 180, so the floor owns two thirds of the frame.** It was 70 and
     * the sky was 39 percent of the picture — a band of nothing above a duel. Dropping it also
     * lifts the machines' heads over the horizon line, which is the composition those games
     * used: the mech is read against the sky, the floor is read against the mech.
     */
    horizonRow: 58,
    /**
     * **44 units up and 78 back — a camera on a boom, which is the era's own rig.** The height
     * is a little above the machines' heads (30 units), so the floor reads as a plane rather
     * than as a wall, and the grid converges instead of stacking.
     */
    camHeight: 44,
    camDist: 78,
    /**
     * **24 units to the right, and the first build proved the offset necessary at all.** With a lock camera the
     * enemy is dead centre by construction; a camera on the player's own axis then puts his back
     * exactly over it, and the two machines overlapped in every frame. Over the shoulder is what
     * the era's own games did, and it is one term.
     */
    camSide: 24,
    /**
     * **2.2 turns a second of easing on the BOOM, and the lag is load-bearing.** A camera welded
     * behind the player would hold him at relative heading 0 for ever and eleven of the twelve
     * yaw bands would never draw. At 2.2 a hard strafe swings him a band or two off centre,
     * which is both what those games looked like and what makes the player's own bands get
     * spent. The AIM is not eased — see `frameHold`.
     */
    camEase: 2.2,
    /**
     * **0.075 turn = 27 degrees, and it is derived rather than tuned.** The frame holds
     * `atan((288/2 × 0.55) / 156) = 27°` either side of the axis before a machine's own width
     * starts leaving it. Clamping the aim to that makes "both machines are in frame" a property
     * of the arithmetic. His third report was exactly its absence: *"a cena vai para um ângulo
     * em que não consigo visualizar nem meu player, nem o inimigo"*.
     */
    frameHold: 0.075,
    /**
     * **0.09 turn = 32 degrees of boom lead.** Measured against the frame rather than chosen:
     * at a duel range of 80 units it puts the enemy about 26 degrees off the boom axis and the
     * player 18 the other way — a spread the aim's bisector halves, so an ordinary strafe never
     * reaches the clamp and the swing is free.
     */
    boomLead: 0.09,
    /**
     * **2.6 turns a second for the body to catch up with its own thrusters.** A dash lasts
     * 400 ms, so the machine reaches a quarter turn of profile inside the dash and settles back
     * on the lock about as fast. Slower and the dash ends before the profile is seen; faster
     * and the body snaps between bands instead of sweeping them.
     */
    faceEase: 2.6,
    /**
     * **156 px per world unit at unit depth.** Derived: a machine stands 30 world units and the
     * boom holds the player at 78, so he draws 30 × 156 / 78 = 60 px — a third of the frame's
     * height, against 34 px and a fifth of it in the first build.
     */
    focal: 156,
    near: 14,
    /**
     * **Twelve headings, thirty degrees apart.** The astronaut's eight served a player choosing
     * from eight inputs; here the camera turns continuously, so the relative heading does too,
     * and 45° steps would show the seam. Same step the kickflip needed between frames.
     */
    bands: 12,
    /**
     * **Six sizes on a 0.79 ladder, and the player always draws at the first.** The boom holds
     * him at exactly `camDist`, so his factor is 1 by construction. The rest is measured rather
     * than guessed: across three long drives the enemy's own factor ran from 0.31 to 1.0, sat
     * mostly between 0.5 and 0.7, and went above 1.0 in one frame in seventy — those are the
     * moments it flies past the camera, and they snap down. The ratio bounds the size error at
     * 11 percent, under a band's own step, which is what made `/descent` read as "crescimento
     * suave". Each is a full crisp render, never a resample.
     */
    scales: [1, 0.79, 0.62, 0.49, 0.38, 0.31],
    /**
     * **The pillars run their own ladder up to 3.2, and its absence was half of his 'floating'
     * report.** A pillar the camera walks past reaches 3.2 of the reference size and the
     * machines never leave 1.0 — sharing one ladder meant a pillar STOPPED GROWING at arm's
     * length. Nothing in the world grows toward you and then gives up, so the eye reads the
     * whole prop as detached, and detached is what "flutuando" describes.
     */
    pillarScales: [3.2, 2.4, 1.8, 1.35, 1, 0.75, 0.56, 0.42, 0.31],
    /**
     * **0.25: a thing keeps its size band until the next one is a quarter better.** Both ladders
     * step by about 0.79, so a boundary sits at roughly the geometric mean of two bands; a
     * quarter of margin either side of it is a dead zone about a tenth of a band wide in `want`,
     * which is far more than any single frame of movement can cross. Below about 0.12 the flicker
     * returns; above about 0.45 a thing carries a visibly wrong size well past the boundary.
     */
    bandHold: 0.25,
    walk: 'mech-walk',
    boost: 'mech-boost',
    /**
     * **World units per second, and every one of these went up.** A machine that stands 30 units
     * now crosses its own height in half a second. The first build was tuned for a 240 px frame
     * and a 34 px machine; the same numbers in a 288 px frame with a 60 px machine read as a
     * heavy thing wading.
     */
    speed: 62,
    strafe: 56,
    /**
     * **The dash: 175 units a second for 400 ms, then 760 ms of nothing.** That is 70 units of
     * ground — most of a duel's width — bought by one press and paid for by three quarters of a
     * second of being a target. Managing that is the refined mechanic his colleague is being
     * asked to feel.
     */
    boostSpeed: 175,
    boostMs: 400,
    boostCoolMs: 760,
    /** 26 world units per stride cycle: the machine's own leg length, so the walk never slides. */
    strideLen: 26,
    /**
     * **A shot crosses the duel in about a second**, which is the number the whole fight is
     * built on: fast enough to punish standing still, slow enough that a strafe, a dash or a
     * pillar can beat it. 9 damage against 100 armour is twelve clean hits.
     */
    shotSpeed: 280,
    shotRange: 340,
    shotHalf: 13,
    damage: 9,
    reloadMs: 260,
    armour: 100,
    /**
     * **The machine holds between 44 and 88 units, and the old 70–130 was the other reason the
     * duel read small.** At 130 units the enemy draws 22 px against the player's 58 — honest
     * perspective and a poor picture. Half that range puts it near 40, which is a machine and
     * not a marker. It also shortens every exchange: at 44 units a shot arrives in a sixth of
     * a second, so the dash stops being a luxury.
     */
    aiClose: 44,
    aiFar: 88,
    aiReloadMs: 620,
    /**
     * **38 units between grid lines.** Just over one machine's width, so a player can read his
     * own speed off the floor — which is what a grid is for, and why it is not decoration.
     */
    grid: { step: 38, color: [52, 60, 88], fade: [22, 26, 44] },
    /**
     * **Nine pillars, placed by the same integer hash every world here uses.** Seven on a rim
     * was cover that existed on the map and never where anyone was; nine across the whole floor
     * is about one every two machine-widths of the duel's own working area.
     */
    pillars: { grammar: 'hangar-pillar', tunables: 'hangar', count: 9, seed: 91 },
    /**
     * **10.5 and 11: what a pillar and a machine occupy on the floor.** The pillar draws 21
     * world units across and the machine 23, so these are the drawn widths and not a generosity
     * — cover that stops a shot the eye saw pass beside it is worse than no cover.
     */
    pillarHalf: 10.5,
    bodyHalf: 11,
    /**
     * **The contact shadow.** Colour is the sky's second stop, so the floor darkens toward the
     * night rather than toward black; 0.34 is enough to read as contact at 60 px and not enough
     * to read as a second object at 15 px.
     */
    contact: { alpha: 0.34, color: [16, 20, 38] },
    skyRamp: NIGHT,
    floorRamp: CONCRETE,
    /** The 2×2 checker at full amplitude, on the only two surfaces big enough to hold it. */
    dither: { amount: 1, lattice: 2 },
    seed: 404,
  },
}
