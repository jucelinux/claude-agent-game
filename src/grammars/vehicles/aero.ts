/**
 * **Run 18 — the biplane, and it is transfer test B from the backlog.**
 *
 * `Bone.roll` shipped on 16/08 proven by exactly one subject: a skateboard — a rigid plate on a
 * bone whose parent never rotates, which `BACKLOG.md` calls *"the friendliest possible case for
 * two accumulated scalars"*. `TASTE.md` §2b's standing rule is that dominance transfers along the
 * axis it was proven on and never across it, so the roll needs a second subject before it can be
 * spent freely. The biplane is that subject, chosen over the snowboarder because it needs no new
 * camera: a barrel roll about the axis of travel is, for a body crossing the picture, rotation
 * about screen x — exactly the kickflip's case, on a body twenty times heavier in parts.
 *
 * **The silhouette is the proof, and it is a stronger proof than the deck's.** The deck's roll
 * read as two *faces* trading places — wood then grip. A wing does that too (doped linen above,
 * pale linen below), and it also does something the deck could not: the span. 30 px of wing live
 * entirely in depth at rest, invisible from the side; a quarter turn sweeps them into the screen
 * plane and the sprite grows half again as tall. A plate can fake a face swap with paint; nothing
 * but a rotation in depth can make a body grow mass that was never on screen.
 *
 * **The game keeps the street's shape on purpose — one variable.** Space is a zoom climb authored
 * on `Bone.angle`, the channel that has always worked; space again is the barrel roll, on `roll`.
 * That is the ollie/kickflip pairing re-run on a new subject, which is the structure run 7 used
 * when it pushed run 5's walk through the new depth solver: the control rides in the same game as
 * the experiment, so a bad reading can be attributed.
 *
 * ## Part count, against the recorded ceiling
 *
 * 21 parts in a 64×48 cell. The mass is carried by the fuselage and four wing slabs — one heavy
 * body with furniture hung off it, which is the shape §2b says this model can draw. The pilot is
 * two parts and a scarf; the read of "someone is flying it" comes from the scarf's flutter, not
 * from anatomy at 4 px.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * **Dawn, and the palette is the 15/08 idiom: five tones per material over a wide range, cut
 * into regions, with a drawn line.**
 *
 * Every ramp is hue-shifted — shadows cool, lights warm — because the light in this scene is a
 * sun barely up. The two wing faces are the widest-separated pair after the deck's wood/grip:
 * doped crimson above, raw linen below, so the roll is legible as a change of *value* exactly as
 * the kickflip was, and does not depend on reading a shape at 2 px.
 */
const DAWN: Palette = {
  name: 'aero-dawn',
  colors: [
    [0, 0, 0],
    // linen — the doped fabric, crimson. Shadow end is a cool maroon, light end vermilion.
    [52, 20, 30], [96, 32, 40], [148, 52, 48], [198, 84, 58], [238, 128, 84],
    // cream — the undersides and the rudder. Raw fabric, and the brightest thing on the body.
    [88, 64, 58], [130, 98, 80], [172, 136, 104], [210, 178, 136], [242, 222, 178],
    // metal — cowl, struts, wheels, the prop disc. Cool, so the machine separates from the fabric.
    [18, 20, 32], [34, 40, 56], [58, 68, 88], [94, 108, 130], [142, 158, 178],
    // skin — the pilot. The skate's ramp: mauve in shadow, warm at the light.
    [48, 36, 44], [86, 60, 58], [130, 92, 78], [178, 132, 106], [222, 180, 148],
    // scarf — pale sage, the one cool bright on the subject, so it reads against the crimson.
    [26, 46, 46], [44, 76, 72], [72, 116, 104], [112, 162, 140], [166, 212, 182],
    // ink — the skate's line, kept: near black with a blue cast against a warm sky.
    [10, 9, 16], [16, 14, 26], [24, 21, 38], [34, 30, 52], [46, 40, 66],
  ],
  ramps: [
    { material: 'linen', indices: [1, 2, 3, 4, 5] },
    { material: 'cream', indices: [6, 7, 8, 9, 10] },
    { material: 'metal', indices: [11, 12, 13, 14, 15] },
    { material: 'skin', indices: [16, 17, 18, 19, 20] },
    { material: 'scarf', indices: [21, 22, 23, 24, 25] },
    { material: 'ink', indices: [26, 27, 28, 29, 30] },
  ],
}

/**
 * **The roll lives on the ROOT, and that is the transfer.**
 *
 * The kickflip rolled a leaf bone with three children. Here `hull` is the root: every bone and
 * every part offset in the machine has to come round with it — wings, tail, wheels, the pilot
 * hanging inverted at the top of the turn. Run 17's recorded defect was exactly this class
 * (*"every field that carries a position has to rotate"* — the far wheels painted 0 px through
 * the whole flip until offsets rolled too), so the subject that stresses it hardest is the
 * subject with the most positioned children, which is this one.
 */
const SKELETON = {
  bones: [
    { name: 'hull', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    // The empennage. Fabric continuous with the fuselage, so its parts weld to it.
    { name: 'tail', parent: 'hull', x: -13, y: 0, z: 0, angle: 0 },
    // The propeller: a disc, because at speed a propeller is its own blur. It sits on the roll
    // axis and its plane CONTAINS that axis, so the roll leaves it visually unchanged — which is
    // correct: a spinning disc rolled about its own centre is the same disc.
    { name: 'prop', parent: 'hull', x: 13.6, y: 0, z: 0, angle: 0 },
    { name: 'pilot', parent: 'hull', x: -1.5, y: -3.6, z: 0, angle: 0 },
    { name: 'scarf', parent: 'pilot', x: -1.6, y: 0.6, z: 0, angle: 0 },
  ],
} as const

/**
 * **Welds follow the seam test** (his kitten note, 16/08: an inner line claims two things are two
 * things). Fabric on fabric is one skin: wings, fin and tailplane weld. Everything bolted or
 * strapped keeps its line: cowl panels against fabric, struts against wings, wheels against
 * struts, the pilot against the cockpit, the scarf against the pilot.
 *
 * **Far side first, so the near side wins every shared pixel.**
 */
const PARTS = [
  // ---- Far side: wheel, gear leg, interplane strut. One ramp step down, as every far limb.
  { name: 'wheelF', bone: 'hull', material: 'metal', z: 2.6, shape: { kind: 'ellipse', cx: 3.4, cy: 6.6, rx: 2.1, ry: 2.1, rz: 1.1 }, shift: -1 },
  { name: 'gearF', bone: 'hull', material: 'metal', z: 2.2, shape: { kind: 'capsule', x0: 2.6, y0: 2.4, x1: 3.4, y1: 6.2, r: 0.6 }, shift: -1 },
  { name: 'strutF', bone: 'hull', material: 'metal', z: 9, shape: { kind: 'capsule', x0: 0.6, y0: -7.4, x1: 1.2, y1: 2.2, r: 0.7 }, shift: -1 },

  // ---- The machine's mass.
  /**
   * The fuselage: one tapered capsule, nose to sternpost. The single heaviest mass in the body,
   * which is the shape §2b asks for — the read is carried by it, and everything else hangs off.
   */
  { weld: true, name: 'fuselage', bone: 'hull', material: 'linen', shape: { kind: 'capsule', x0: 10.5, y0: 0, x1: -13.5, y1: -0.6, r: 3.2, r1: 1.3 } },
  // The cowl: metal over the engine. A panel seam against fabric, so it is NOT welded.
  { name: 'cowl', bone: 'hull', material: 'metal', shape: { kind: 'ellipse', cx: 11.4, cy: -0.1, rx: 2.6, ry: 2.9, rz: 2.9 } },
  /**
   * **The wings, and these four slabs are the commission.**
   *
   * Each wing is two rects sharing one footprint: doped crimson above, raw linen below — the
   * deck's wood/grip structure, on a span that lives in depth. `d` 30 on top and 26 below — a biplane's span outreaches its length, and the first authoring at 26 measured only 1.4× the rest height at the quarter turn, under the silhouette proof's own bar: at
   * rest you see a 2 px edge; a quarter turn in, the span IS the height. The roll direction is
   * negative, as the kickflip's: it brings the +y face — the pale underside — toward the viewer
   * first, so the middle of the trick is the flash rather than the void.
   */
  { weld: true, name: 'wingTopA', bone: 'hull', material: 'linen', shape: { kind: 'rect', x: -6, y: -8.8, w: 10, h: 1.2, d: 30 } },
  { weld: true, name: 'wingTopB', bone: 'hull', material: 'cream', shape: { kind: 'rect', x: -6, y: -7.6, w: 10, h: 0.9, d: 29 } },
  { weld: true, name: 'wingBotA', bone: 'hull', material: 'linen', shape: { kind: 'rect', x: -5.5, y: 2.2, w: 9, h: 1.2, d: 26 } },
  { weld: true, name: 'wingBotB', bone: 'hull', material: 'cream', shape: { kind: 'rect', x: -5.5, y: 3.4, w: 9, h: 0.9, d: 25 } },
  // The empennage: fabric continuous with the fuselage, welded. The rudder's trailing edge is
  // cream so the tail reads at 4 px the way the wings read at 10.
  { weld: true, name: 'tailplane', bone: 'tail', material: 'linen', shape: { kind: 'rect', x: -3.6, y: -0.9, w: 6.2, h: 1.1, d: 12 } },
  { weld: true, name: 'fin', bone: 'tail', material: 'linen', shape: { kind: 'rect', x: -3.4, y: -6.4, w: 4.4, h: 6, d: 1.2 } },
  { weld: true, name: 'rudder', bone: 'tail', material: 'cream', shape: { kind: 'rect', x: -4.9, y: -5.9, w: 1.6, h: 5.3, d: 1.1 } },
  /**
   * The roundel: a marking, which is the right primitive — paint on the surface it lies on,
   * nothing added to the silhouette. The one thing here a player recognises as "an aeroplane
   * from a story" rather than "a shape".
   */
  { name: 'roundel', bone: 'hull', material: 'cream', z: -2.4, shape: { kind: 'ellipse', cx: -6.4, cy: -0.6, rx: 1.7, ry: 1.7 }, marking: true },

  // ---- The prop: a disc, whose plane contains the roll axis, so the roll leaves it alone.
  // A spinner solid was authored in front of it and the channel reported a 1×4 sliver — the
  // disc's own depth owns those pixels. The hub is a MARKING on the disc instead: paint, which
  // is what a spinner at this scale visually is.
  { name: 'disc', bone: 'prop', material: 'metal', shape: { kind: 'ellipse', cx: 0.7, cy: 0, rx: 0.7, ry: 7.2, rz: 7.2 }, shift: -1 },
  { name: 'hub', bone: 'prop', material: 'metal', z: -3, shape: { kind: 'ellipse', cx: 0.7, cy: 0, rx: 0.7, ry: 1.8 }, marking: true, shift: 2 },

  // ---- The pilot: a head in a leather helmet, and a scarf doing the work of a face.
  { name: 'head', bone: 'pilot', material: 'skin', shape: { kind: 'ellipse', cx: 0, cy: -1.1, rx: 1.9, ry: 2, rz: 1.8 } },
  { name: 'helmet', bone: 'pilot', material: 'metal', shape: { kind: 'ellipse', cx: -0.2, cy: -2.1, rx: 2.1, ry: 1.7, rz: 1.9 } },
  { name: 'scarfA', bone: 'scarf', material: 'scarf', shape: { kind: 'capsule', x0: 0.4, y0: 0, x1: -6.4, y1: -1.2, r: 1.1, r1: 0.6 } },

  // ---- Near side: strut, gear leg, wheel.
  { name: 'strutN', bone: 'hull', material: 'metal', z: -9, shape: { kind: 'capsule', x0: 0.6, y0: -7.4, x1: 1.2, y1: 2.2, r: 0.7 } },
  { name: 'gearN', bone: 'hull', material: 'metal', z: -2.2, shape: { kind: 'capsule', x0: 2.6, y0: 2.4, x1: 3.4, y1: 6.2, r: 0.6 } },
  { name: 'wheelN', bone: 'hull', material: 'metal', z: -2.6, shape: { kind: 'ellipse', cx: 3.4, cy: 6.6, rx: 2.1, ry: 2.1, rz: 1.1 } },
] as const

/**
 * **Cruise: the quietest clip on the shelf after the skate's pump, for the same reason.** Nothing
 * a plane does in level flight moves its silhouette much — the speed is reported by the world.
 * What does move: a 1 px bob, a 2° pitch wobble, the scarf, and the prop disc's shimmer.
 *
 * Advances with distance over `strideLen` in the game, like every looping locomotion here.
 */
export const aeroCruise: Grammar = {
  name: 'aero-cruise',
  palette: DAWN,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'cruise',
    phases: [
      { name: 'lift', at: 0 },
      { name: 'crest', at: 0.25 },
      { name: 'sink', at: 0.5 },
      { name: 'trough', at: 0.75 },
    ],
    tracks: [
      { bone: 'hull', channel: 'y', keys: [0.5, 0, -0.5, 0] },
      // Pitch a quarter of a cycle behind the bob — a machine noses over the crest of its own
      // wave. Also load-bearing for the channel: in phase with the bob, the crest and the trough
      // frames came out 0.0003 apart, which is one frame paid for twice.
      { bone: 'hull', channel: 'angle', keys: [0, 0.16, 0, -0.16] },
      // The scarf flutters against the airstream on its own beat — the one organic motion on a
      // machine, and the thing that says somebody is flying it.
      { bone: 'scarf', channel: 'angle', keys: [0.6, -0.5, 0.35, -0.65] },
      { bone: 'tail', channel: 'angle', keys: [-0.08, 0.06, -0.06, 0.08] },
      // The prop blur breathes. A disc that never changes is a decal; one that shimmers is spinning.
      { bone: 'prop', channel: 'scaleX', keys: [0.3, -0.3, 0.3, -0.3] },
    ],
  },
}

/**
 * **The climb, and it is this round's control.** Every rotation in it is `Bone.angle` — the nose
 * comes up in the screen plane, exactly the ollie's pitch. Nothing here uses roll; if the climb
 * degrades, the roll work damaged the screen-plane path and that is a rollback, not a tune.
 *
 * Plays once and holds: a zoom climb ends level, not where it started.
 */
export const aeroClimb: Grammar = {
  name: 'aero-climb',
  palette: DAWN,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'climb',
    wrap: false,
    phases: [
      { name: 'level', at: 0 },
      { name: 'pull', at: 0.25 },
      { name: 'zoom', at: 0.5 },
      { name: 'over', at: 0.75 },
      { name: 'out', at: 1 },
    ],
    tracks: [
      // Nose up through the pull, easing level past the top of the arc.
      { bone: 'hull', channel: 'angle', keys: [0, 0.32, 0.3, 0.14, -0.05] },
      // The scarf whips down and back as the nose goes up: the cheapest possible statement of g.
      { bone: 'scarf', channel: 'angle', keys: [0, 0.8, 0.9, 0.5, 0.1] },
      { bone: 'tail', channel: 'angle', keys: [0, -0.12, -0.1, -0.04, 0] },
      { bone: 'prop', channel: 'scaleX', keys: [0.3, -0.3, 0.3, -0.3, 0.3] },
    ],
  },
}

/**
 * **The barrel roll. Thirteen frames, played once, and one track is the round.**
 *
 * A full negative turn about the hull's own length — the kickflip's direction, chosen for the
 * same reason: the pale faces come toward the viewer first, so the middle of the trick is the
 * flash rather than the void. Thirteen frames because the wings need what the deck needed:
 * (n−1) divisible by four for the phases, and 30° between frames so the span walks through
 * readable widths instead of jumping from edge to face.
 *
 * The keys are monotone, not eased: a roll that slowed at the quarters would read as four poses.
 */
export const aeroRoll: Grammar = {
  name: 'aero-roll',
  palette: DAWN,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'barrel',
    wrap: false,
    phases: [
      { name: 'bank', at: 0 },
      { name: 'knife', at: 0.25 },
      { name: 'inverted', at: 0.5 },
      { name: 'recover', at: 0.75 },
      { name: 'level', at: 1 },
    ],
    tracks: [
      /** The one line the transfer exists for: a whole turn, on the root of the skeleton. */
      { bone: 'hull', channel: 'roll', keys: [0, -0.25, -0.5, -0.75, -1] },
      // A breath of pitch so the roll sits on a climbing line, and nothing more: pitching hard
      // through a roll would hide which rotation is doing the work — the kickflip's rule.
      { bone: 'hull', channel: 'angle', keys: [0.1, 0.06, 0, -0.03, 0.02] },
      { bone: 'scarf', channel: 'angle', keys: [0.4, 0.9, 0.5, 0.8, 0.2] },
      { bone: 'prop', channel: 'scaleX', keys: [0.3, -0.3, 0.3, -0.3, 0.3] },
    ],
  },
}
