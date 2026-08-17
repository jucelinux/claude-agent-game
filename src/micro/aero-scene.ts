/**
 * **Micro game 6: the dawn patrol.** Transfer test B from the backlog, delivered as the game it
 * has to live in — his 15/08 rule: everything born as an object that belongs to a game.
 *
 * ## What is under test, and what is the control
 *
 * `Bone.roll` shipped on one subject: a plank on an unrotated bone. This game is the roll on a
 * second subject — a whole machine turned about its ROOT, wings, tail, wheels and pilot all
 * carried through the turn — with the street's own structure kept so exactly one thing varies:
 *
 * | press | clip | channel | duty |
 * |---|---|---|---|
 * | space | zoom climb | `Bone.angle`, screen plane | **the control** — the ollie's path |
 * | space, airborne | barrel roll | `Bone.roll`, one whole turn | **the experiment** |
 *
 * ## Where the weave went, measured before it was spent
 *
 * The skate round's result: dither is for surfaces, and a 36 px body has none. This scene is the
 * project's largest surface yet — 112 rows of sky and 38 of the world far below, both ramps woven
 * at full amplitude on the 4×4 lattice, both static so the pattern cannot crawl. The machine
 * itself ships at dither 0, the measured body rule.
 *
 * ## What is new in the engine because this scene needed it
 *
 * A sky game has traffic between the backdrop and the obstacles: clouds that travel slower than
 * the world. `Runner.drift` is the stones' hash at a fraction of the speed — harvested from two
 * mechanisms that already existed (the forest's drifting clouds, the runner's hashed slots), not
 * designed fresh. Two bands, far and near, reusing run 12's cloud grammars unchanged.
 */
import type { Scene } from '../scene/types.ts'

/**
 * **Dawn, from the zenith down: seven stops, indigo to gold.** The widest sky ramp in the
 * project, and deliberately not the skate's dusk read backwards — dusk went violet→orange over a
 * street; dawn opens with the night still overhead and breaks rose before gold at the horizon.
 * Woven through the lattice, every row between two stops is a real two-colour weave.
 */
const DAWNSKY: readonly [number, number, number][] = [
  [30, 30, 66],
  [52, 44, 92],
  [88, 60, 110],
  [134, 78, 112],
  [184, 104, 104],
  [222, 146, 100],
  [248, 200, 128],
]

/**
 * **The world far below, as a floor ramp.** The horizon sits at the plane's own wheels — which
 * is what says "you are high" without a single extra mechanism — and the 38 rows beneath recede
 * from the dark valley directly under the camera out to a warm dawn haze at the far edge. The
 * lightest stop is the far edge, as every floor here; dithered, it is the second surface the
 * weave gets.
 */
const VALLEY: readonly [number, number, number][] = [
  [16, 20, 30],
  [24, 30, 42],
  [36, 44, 56],
  [56, 62, 74],
  [88, 82, 92],
  [134, 106, 108],
]

export const aeroScene: Scene = {
  name: 'aero',
  /** 240×150 at ×4 — the runner register, unchanged: three obstacles of warning on screen. */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 112,
  nearRow: 150,
  haze: 0,
  sky: [30, 30, 66],
  groundRamp: VALLEY,
  placements: [
    {
      grammar: 'aero-cruise', tunables: 'aero', x: 58, depth: 0, anchor: 'foot',
      clips: {
        cruise: { grammar: 'aero-cruise', tunables: 'aero' },
        climb: { grammar: 'aero-climb', tunables: 'aero-climb' },
        roll: { grammar: 'aero-roll', tunables: 'aero-roll' },
      },
      runs: { run: 'cruise', leap: 'climb', flip: 'roll' },
    },
  ],
  runner: {
    groundRow: 112,
    // A quarter into the screen, the runner's hold. The machine is 33 px long, so it needs the
    // clearance the board needed, and for the same reason.
    holdX: 58,
    /**
     * **Faster than the street, gaining slightly less.** 132 px/s against the skate's 124,
     * capped at 208 against 196: a machine of air against a machine of pavement. The ramp is
     * the whole difficulty curve, exactly as the street: gaps shrink in time, never in space.
     */
    speed: 132,
    accel: 3,
    maxSpeed: 208,
    gravity: 430,
    /**
     * **Two impulses, and the three obstacle heights were drawn from them — the street's
     * arithmetic, one game up.** 150 px/s against 430 px/s² gives an apex of **26 px**: over
     * the balloon at ~16 and the flock at ~22, under the kite balloon at ~36. The roll adds
     * 160 from wherever it is pressed, taking the apex to **56**. So a fifth of the sky is
     * unreachable without the second press, which is what keeps the roll a differentiator
     * rather than a decoration.
     */
    jump: 150,
    flip: 160,
    /**
     * **52 px per bob cycle, derived from the machine rather than from legs.** A plane has no
     * stride; what cycles is the hull riding its own wave. 52 px is a length and a half of
     * hull, giving 2.5 cycles a second at the opening speed and 4.0 at the cap — and because
     * it advances with distance, the bob can never disagree with the world's speed.
     */
    strideLen: 52,
    stones: [
      { grammar: 'sky-balloon', tunables: 'aloft' },
      { grammar: 'sky-flock', tunables: 'aloft-flock' },
      { grammar: 'sky-balloon', tunables: 'aloft' },
      { grammar: 'sky-kite', tunables: 'aloft' },
      { grammar: 'sky-flock', tunables: 'aloft-flock' },
    ],
    /**
     * **190 apart with 40 of jitter, and the worst case is `spacing − jitterX` = 150 px** —
     * the crypt's lesson, asserted rather than re-derived. At the 208 px/s cap that is 0.72 s
     * between obstacles against a climb that hangs 0.70; it clears, with the margin the street
     * shipped at. 190 rather than 170 because this world runs 6% faster at the cap.
     */
    leadIn: 260,
    spacing: 190,
    jitterX: 40,
    // The machine is 33 px nose to tail; 11 is the FUSELAGE, not the prop disc or the
    // tailplane tip. A propeller that kills you is a propeller a player will hate — the
    // board-tip rule, verbatim.
    bodyHalfW: 11,
    // The kite balloon's envelope is 22 px across; 8 is the mass, not the fin.
    stoneHalfW: 8,
    // 33 px is the machine's own length, so the score counts fuselage lengths.
    pxPerMetre: 33,
    /** No chaser: the sky has nothing chasing you. One collision and you go down — the
     * street's rule, and the reason `Runner.reaper` went optional. */
    overText: 'you went down at ',
    /**
     * **Full amplitude on the 4×4 lattice, sky and valley both** — the largest woven surface
     * on the shelf, and the only places in this game the dither is on. Static backdrop, so
     * the lattice is welded to the world and cannot crawl, by construction.
     */
    dither: { amount: 1, lattice: 4 },
    skyRamp: DAWNSKY,
    /** The last stars of the night, high where the indigo still holds. */
    stars: { count: 26, colors: [[182, 182, 212], [128, 132, 168]], seed: 9, below: 44 },
    /** A morning moon, pale and low-contrast: it is being erased by the dawn, not lighting it. */
    moon: { x: 188, y: 28, r: 7, color: [212, 212, 230], halo: [58, 56, 100] },
    /**
     * **Two cloud bands, far and near, between the backdrop and the traffic.** Run 12's storm
     * clouds unchanged; the far band is the same grammars at 0.55 scale, which is how distance
     * is said twice — smaller, and slower. Parallax 0.16 and 0.42: the far sky barely moves,
     * the near sky visibly travels, the obstacles arrive at full speed. Three rates of motion
     * is what makes a flat picture read as air.
     */
    drift: [
      {
        puffs: [
          { grammar: 'cloud-a', tunables: 'sky', scale: 0.55 },
          { grammar: 'cloud-b', tunables: 'sky', scale: 0.55 },
          { grammar: 'cloud-c', tunables: 'sky', scale: 0.55 },
        ],
        spacing: 150, jitterX: 90, minY: 26, maxY: 54, parallax: 0.16, seed: 41,
      },
      {
        puffs: [
          { grammar: 'cloud-b', tunables: 'sky', scale: 0.9 },
          { grammar: 'cloud-c', tunables: 'sky', scale: 0.9 },
        ],
        spacing: 290, jitterX: 130, minY: 38, maxY: 76, parallax: 0.42, seed: 87,
      },
    ],
    seed: 118,
  },
}
