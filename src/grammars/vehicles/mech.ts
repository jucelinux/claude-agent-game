/**
 * **Run 21 — the mech, and it is the round that closes the 3D ledger.**
 *
 * His commission, 17/08: one microgame that kills every remaining 3D debt, judged by a third
 * person whose memory is *"jogos com a memória gráfica de ps1, com gráficos mais poligonais,
 * com uma mecânica refinada"*. A mech duel was chosen over a dogfight and a racer for one
 * reason the record can defend: **the yaw approximation lives in the GAIT**, and only a body
 * that walks while turning can test it. A rigid craft would have tested the easy half.
 *
 * ## What this subject is under test for
 *
 * | debt | how the mech runs it |
 * |---|---|
 * | yaw has no runtime channel | the body is generated at 12 headings and the band is chosen from `bodyHeading − cameraHeading` every frame — the `/descent` scale-band technique, on rotation |
 * | the yaw gait approximation was never measured | the walk plays at every one of those headings; `tests/arena.test.ts` measures it against matrix truth, as roll got 0.337 px |
 * | the three axes never composed at once | `mech-boost` carries root **angle** AND root **roll**, and the generator then **yaws** the whole thing |
 * | no camera that rotates | the arena's camera orbits the lock — see `Scene.arena` |
 *
 * ## Why a mech is also the right body for the PS1 read
 *
 * Fixed-function hardware shaded one normal per triangle, so a curved hull came out as flat
 * plates with hard creases. `texture.facet` does that to any solid here — but a subject built
 * from **boxes** starts out wanting to be plates, so the idiom and the geometry agree instead
 * of fighting. Every mass below is a `rect` with real depth; the only round things are the
 * joints, which is exactly how the machines of that era were modelled.
 *
 * **Depth is load-bearing, not decoration.** The measured yaw collapse threshold is
 * depth/width ≈ 0.45 (`TASTE.md` §2b): a body thinner than that turns into a line at three
 * quarters. The core is 9 wide by 7 deep (0.78) and every plate is over the threshold, so this
 * body was chosen partly because it survives being turned.
 *
 * ## Part count: 23 in a 56×56 cell
 *
 * Between the skater's 22 and the skeleton's 24, both of which read. Mass is carried by the
 * core and the two leg columns — one heavy shape with furniture on it, the shape §2b says this
 * model draws well.
 */
import type { Grammar, Palette } from '../../core/types.ts'
import { yaw } from '../../core/yaw.ts'

/**
 * **Gunmetal and one hot accent — the palette of the era, and it is not a stylistic guess.**
 *
 * The machines his reference remembers are lit by a hard key against near-black shadow, with a
 * single saturated colour reserved for what is *powered*: the eye and the thrusters. Everything
 * structural stays desaturated, so the accent reads as light rather than as paint.
 *
 * The armour ramp is deliberately the widest in the project after the biplane's wings (36 → 214).
 * Facets shade in steps; a narrow ramp would put two adjacent plates on the same tone and the
 * crease — the whole point — would vanish.
 */
const HANGAR: Palette = {
  name: 'mech-hangar',
  colors: [
    [0, 0, 0],
    // armour — cold steel with a blue cast. The widest ramp here: facets need range to crease.
    [36, 42, 56], [70, 80, 100], [110, 122, 144], [158, 170, 190], [214, 222, 236],
    // gun — dark gunmetal for weapons and joints, so the limbs read as a different material.
    [18, 20, 28], [34, 38, 50], [54, 60, 76], [80, 88, 108], [116, 126, 148],
    // olive — the shoulder blocks and the hip skirt. Military, and it breaks the all-grey.
    [30, 34, 22], [54, 60, 36], [82, 90, 54], [116, 126, 78], [156, 166, 112],
    // accent — the mono-eye and the thruster flame. The only saturated thing on the machine.
    [78, 24, 10], [140, 44, 14], [200, 76, 20], [240, 132, 44], [255, 202, 116],
    // ink — cool near-black. A hangar is lit blue, and a warm line would float off the metal.
    [8, 9, 14], [14, 16, 24], [22, 25, 36], [32, 36, 50], [44, 50, 68],
  ],
  ramps: [
    { material: 'armour', indices: [1, 2, 3, 4, 5] },
    { material: 'gun', indices: [6, 7, 8, 9, 10] },
    { material: 'olive', indices: [11, 12, 13, 14, 15] },
    { material: 'accent', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

/**
 * **Authored facing east, exactly as the astronaut was**, so `yaw` measures its turns from a
 * known zero and the compass arithmetic is the one the record already validated.
 *
 * The root is `core`, and it is the bone the boost pitches and rolls — so a yawed boost is
 * `Ryaw · Rz(angle) · Rx(roll)` on one bone, which is the composition nothing has run before.
 */
const SKELETON = {
  bones: [
    { name: 'core', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    { name: 'hips', parent: 'core', x: 0, y: 4.4, z: 0, angle: 0 },
    { name: 'chest', parent: 'core', x: 0, y: -4.6, z: 0, angle: 0 },
    { name: 'head', parent: 'chest', x: 0.4, y: -5.4, z: 0, angle: 0 },
    // Shoulders sit wide in DEPTH, not in screen x: turned side-on they are what stops the
    // machine reading as a plank. ±6.4 clears the chest's own 5.2 half-depth.
    { name: 'shF', parent: 'chest', x: -0.6, y: -2.6, z: 6.4, angle: 0 },
    { name: 'shN', parent: 'chest', x: -0.6, y: -2.6, z: -6.4, angle: 0 },
    { name: 'armF', parent: 'shF', x: 0, y: 3.4, z: 0, angle: 0 },
    { name: 'armN', parent: 'shN', x: 0, y: 3.4, z: 0, angle: 0 },
    // Legs: hip, knee, ankle. The knee is the joint a heavy walk is read by.
    { name: 'thighF', parent: 'hips', x: 0, y: 1.8, z: 3.4, angle: 0 },
    { name: 'shinF', parent: 'thighF', x: 0, y: 7.6, z: 0, angle: 0 },
    { name: 'thighN', parent: 'hips', x: 0, y: 1.8, z: -3.4, angle: 0 },
    { name: 'shinN', parent: 'thighN', x: 0, y: 7.6, z: 0, angle: 0 },
    // The back rack: thrusters, and they are what a boost lights up.
    { name: 'rack', parent: 'chest', x: -5.6, y: -1, z: 0, angle: 0 },
  ],
} as const

/**
 * **Welds by the seam test, and a machine is the easy case of it**: armour plate against armour
 * plate on one section is one surface; every place two SECTIONS meet is a real seam and keeps
 * its line. So the core welds to its own chest plate, and the arms, legs, head and weapons all
 * keep their edges — which is what makes a mech read as assembled rather than moulded.
 *
 * Far side first, so the near side wins every shared pixel.
 */
const PARTS = [
  // ---- Far side.
  { name: 'thighF', bone: 'thighF', material: 'gun', shape: { kind: 'rect', x: -2.4, y: 0, w: 4.8, h: 7.8, d: 4.6 }, shift: -1 },
  { name: 'shinF', bone: 'shinF', material: 'armour', shape: { kind: 'rect', x: -2.8, y: 0, w: 5.6, h: 8.2, d: 5 }, shift: -1 },
  { name: 'footF', bone: 'shinF', material: 'gun', shape: { kind: 'rect', x: -3.6, y: 8, w: 8.4, h: 2.6, d: 6 }, shift: -1 },
  { name: 'shF', bone: 'shF', material: 'olive', shape: { kind: 'rect', x: -3.6, y: -3.4, w: 7.2, h: 6.4, d: 5.4 }, shift: -1 },
  { name: 'armF', bone: 'armF', material: 'gun', shape: { kind: 'rect', x: -1.9, y: 0, w: 3.8, h: 7.4, d: 3.8 }, shift: -1 },
  /**
   * The shoulder cannon: the silhouette cue that says "mech" before any detail resolves. It
   * sits on the FAR shoulder so the near arm's rifle and it never fight for the same pixels.
   */
  { name: 'cannon', bone: 'shF', material: 'gun', shape: { kind: 'rect', x: -2.4, y: -7.4, w: 9.6, h: 3.4, d: 3.6 }, shift: -1 },

  // ---- The machine's mass.
  { weld: true, name: 'core', bone: 'core', material: 'armour', shape: { kind: 'rect', x: -4.4, y: -5.4, w: 9, h: 10.4, d: 10.4 } },
  { weld: true, name: 'chestPlate', bone: 'chest', material: 'armour', shape: { kind: 'rect', x: -2, y: -3.8, w: 7.4, h: 5.2, d: 8.6 } },
  // The intake vent: a marking, so it paints on the plate and adds nothing to the silhouette.
  { name: 'vent', bone: 'chest', material: 'gun', z: -4.6, shape: { kind: 'rect', x: 0.6, y: -2.6, w: 3.4, h: 2.6, d: 1 }, marking: true },
  { name: 'hips', bone: 'hips', material: 'gun', shape: { kind: 'rect', x: -4, y: -2.2, w: 8, h: 4.6, d: 8.4 } },
  // The skirt armour: olive plates hanging off the hips, the era's favourite mech detail.
  { name: 'skirtF', bone: 'hips', material: 'olive', z: 4.2, shape: { kind: 'rect', x: -3.4, y: 1.6, w: 6.4, h: 4.4, d: 1.8 }, shift: -1 },
  { name: 'skirtN', bone: 'hips', material: 'olive', z: -4.2, shape: { kind: 'rect', x: -3.4, y: 1.6, w: 6.4, h: 4.4, d: 1.8 } },
  /**
   * **The head is small and the eye is a marking** — the mono-eye is the one feature this
   * machine has, and the kitten rule says a face at this scale is not drawn, it is implied.
   * At 5 px the eye IS the face, and a marking disappears round the back on its own when the
   * body yaws, which is exactly what should happen.
   */
  { name: 'head', bone: 'head', material: 'gun', shape: { kind: 'rect', x: -2.6, y: -3.2, w: 5.4, h: 4, d: 5 } },
  { name: 'eye', bone: 'head', material: 'accent', z: -2.8, shape: { kind: 'rect', x: 0.4, y: -2.2, w: 2.2, h: 1.2, d: 1 }, marking: true, shift: 2 },
  // The crest is DEEPER than the head it sits on (5.8 against 5), and the first authoring at
  // 4.4 was swallowed at the side-on bands — the skate-arm arithmetic, sixth occurrence. A
  // fin that only exists at some headings is a fin that flickers as the camera orbits.
  { name: 'crest', bone: 'head', material: 'armour', shape: { kind: 'rect', x: -3.4, y: -5, w: 4.2, h: 1.6, d: 5.8 } },
  // The thruster rack and its two nozzles: dark until a boost lights them.
  { name: 'rack', bone: 'rack', material: 'gun', shape: { kind: 'rect', x: -2.6, y: -2.6, w: 3.4, h: 7.4, d: 7.2 } },
  { name: 'nozF', bone: 'rack', material: 'gun', z: 3, shape: { kind: 'ellipse', cx: -2.8, cy: -1, rx: 1.5, ry: 1.5, rz: 1.4 }, shift: -1 },
  { name: 'nozN', bone: 'rack', material: 'gun', z: -3, shape: { kind: 'ellipse', cx: -2.8, cy: -1, rx: 1.5, ry: 1.5, rz: 1.4 } },

  // ---- Near side, last.
  { name: 'thighN', bone: 'thighN', material: 'gun', shape: { kind: 'rect', x: -2.5, y: 0, w: 5, h: 7.8, d: 4.8 } },
  { name: 'shinN', bone: 'shinN', material: 'armour', shape: { kind: 'rect', x: -2.9, y: 0, w: 5.8, h: 8.2, d: 5.2 } },
  { name: 'footN', bone: 'shinN', material: 'gun', shape: { kind: 'rect', x: -3.7, y: 8, w: 8.6, h: 2.6, d: 6.2 } },
  { name: 'shN', bone: 'shN', material: 'olive', shape: { kind: 'rect', x: -3.6, y: -3.4, w: 7.2, h: 6.4, d: 5.4 } },
  { name: 'armN', bone: 'armN', material: 'gun', shape: { kind: 'rect', x: -2, y: 0, w: 4, h: 7.4, d: 4 } },
  /**
   * **The rifle, and its cross-section is bigger than the arm's ON PURPOSE.**
   *
   * At the heading where the machine faces the camera, a barrel pointing at you is pure
   * foreshortening — and the first authoring gave it the arm's own 2.8 × 2.8, so the arm
   * covered it exactly and the channel reported the rifle absent in all four frames of that
   * band. A player meets the ENEMY at that heading more than any other, and a mech with no
   * visible gun is a mech missing the thing it is recognised by. 4.6 of depth against the
   * arm's 4, pushed outboard, so end-on it still reads as a block.
   */
  { name: 'rifle', bone: 'armN', material: 'gun', z: -1.1, shape: { kind: 'rect', x: -1.4, y: 5.2, w: 11.4, h: 3.2, d: 4.6 } },
  { name: 'muzzle', bone: 'armN', material: 'armour', z: -1.1, shape: { kind: 'rect', x: 9.4, y: 5.4, w: 2, h: 2.8, d: 4.2 } },
] as const

/**
 * **The walk: four frames, and the low count is period-correct rather than a saving.** The
 * machines his reference remembers animated in few, hard poses — a heavy thing steps, plants,
 * and transfers weight; it does not ease. Four phases at the quarters, which is also the
 * smallest legal count for four named phases.
 *
 * **This clip is the yaw instrument.** It is the gait that plays at all twelve headings, so
 * every key here is a key the yaw decomposition has to carry into depth and back.
 */
const WALK = {
  name: 'stride',
  phases: [
    { name: 'plant', at: 0 },
    { name: 'pass', at: 0.25 },
    { name: 'plantOther', at: 0.5 },
    { name: 'passOther', at: 0.75 },
  ],
  tracks: [
    // The body drops on each plant: a mech's walk is felt as impact, not as bounce.
    { bone: 'core', channel: 'y', keys: [0.55, -0.3, 0.55, -0.3] },
    // Legs alternate. Phase is an offset in TIME, never a sign — the mirrored-knee lesson.
    { bone: 'thighF', channel: 'angle', keys: [-0.62, -0.1, 0.55, 0.1] },
    { bone: 'shinF', channel: 'angle', keys: [0.5, 0.2, 0.08, 0.42] },
    { bone: 'thighN', channel: 'angle', keys: [0.55, 0.1, -0.62, -0.1] },
    { bone: 'shinN', channel: 'angle', keys: [0.08, 0.42, 0.5, 0.2] },
    // The torso counter-rotates a little, and the arms hold the weapons steady: a mech aims
    // while it walks, which is the whole reason the lock-on mechanic reads.
    { bone: 'chest', channel: 'angle', keys: [0.08, -0.05, 0.08, -0.05] },
    { bone: 'armN', channel: 'angle', keys: [-0.1, -0.06, -0.1, -0.06] },
    { bone: 'armF', channel: 'angle', keys: [0.12, 0.08, 0.12, 0.08] },
    /**
     * **The shoulder blocks counter-swing, and the pairs lock is what asked for it.**
     *
     * The first authoring held them rigid — a gun platform that keeps its weapons level while
     * the legs work, which sounded right and was reported by `tests/pairs.test.ts` as a mirrored
     * pair that never separates: the paper-doll signature. It is also untrue of the real thing.
     * A walking machine transfers weight through its shoulders, and 22° of counter-swing is what
     * that looks like. Truer, and it needs no exemption.
     */
    { bone: 'shF', channel: 'angle', keys: [0.15, -0.15, 0.15, -0.15] },
    { bone: 'shN', channel: 'angle', keys: [-0.15, 0.15, -0.15, 0.15] },
  ],
} as const

/**
 * **The boost, and it is the three-axis composition in one clip.**
 *
 * The root carries `angle` (the machine pitches into the dash) **and** `roll` (it banks as it
 * slides sideways) — and the band generator then **yaws** the whole grammar. So a boosting mech
 * at heading 7 is `Ryaw · Rz(angle) · Rx(roll)` on one bone, at amplitudes of 14° and 11°.
 * Nothing in this project has composed all three before; `tests/arena.test.ts` measures it.
 *
 * Legs tuck, thrusters flare — the flare is `shift` on the nozzles, which moves them up their
 * own ramp into the accent's bright end without touching their geometry.
 */
const BOOST = {
  name: 'boost',
  wrap: false,
  phases: [
    { name: 'crouch', at: 0 },
    { name: 'light', at: 0.25 },
    { name: 'ride', at: 0.5 },
    { name: 'ease', at: 0.75 },
    { name: 'settle', at: 1 },
  ],
  tracks: [
    /** Pitch into the dash — screen-plane, the channel proven since run 5. */
    { bone: 'core', channel: 'angle', keys: [0.05, -0.28, -0.34, -0.22, -0.04] },
    /** And bank, out of the screen plane, at the same time. The pair. */
    { bone: 'core', channel: 'roll', keys: [0, 0.3, 0.42, 0.28, 0.05] },
    { bone: 'core', channel: 'y', keys: [0.4, -0.5, -0.7, -0.4, 0.2] },
    // Legs trail: a boosting mech is not walking, it is being pushed.
    { bone: 'thighF', channel: 'angle', keys: [-0.3, 0.5, 0.66, 0.5, 0.1] },
    { bone: 'shinF', channel: 'angle', keys: [0.4, -0.3, -0.5, -0.3, 0.1] },
    { bone: 'thighN', channel: 'angle', keys: [-0.2, 0.62, 0.78, 0.6, 0.15] },
    { bone: 'shinN', channel: 'angle', keys: [0.3, -0.35, -0.55, -0.35, 0.05] },
    { bone: 'chest', channel: 'angle', keys: [0.05, 0.16, 0.2, 0.14, 0.04] },
  ],
} as const

/**
 * **Twelve headings, thirty degrees apart, generated from one authored body.**
 *
 * This is `/descent`'s scale-band technique pointed at rotation, and it is the answer to "yaw
 * has no runtime channel" that keeps every rule the project already holds: each band is a full
 * crisp render of the grammar, never a resampled or sheared sprite, and the runtime picks a
 * band from `bodyHeading − cameraHeading` without ever having heard of a yaw.
 *
 * **Twelve rather than eight, and the reason is the camera.** The astronaut's eight served a
 * player who chose from eight inputs. Here the camera orbits continuously, so the relative
 * heading is continuous too, and 45° steps would show the seam. 30° is the same step the
 * kickflip needed between frames of a rotation, for the same reason.
 */
export const MECH_BANDS = 12

const bands = (clip: string, gait: typeof WALK | typeof BOOST): readonly Grammar[] =>
  Array.from({ length: MECH_BANDS }, (_, i) =>
    yaw(
      { name: `mech-${clip}-${i}`, palette: HANGAR, skeleton: SKELETON, parts: PARTS, gait },
      i / MECH_BANDS,
      `mech-${clip}-${i}`,
      // The mech's own swing and depth, not the astronaut's: the decomposition multiplies a
      // rotation by a limb radius to get depth, and this machine's limbs are its own length.
      0.2,
      8,
      // The roll amplitude the decomposition writes its companions in, and the flag that says
      // to use rotations rather than the run-14 depth-offset stand-in. See `yaw()`.
      clip === 'walk' ? 0.2 : 0.14,
      true,
    ),
  )

export const MECH_WALK: readonly Grammar[] = bands('walk', WALK)
export const MECH_BOOST: readonly Grammar[] = bands('boost', BOOST)
export const MECH: readonly Grammar[] = [...MECH_WALK, ...MECH_BOOST]
