/**
 * Run 13 — **the photographer**, and the first subject in this project built for a *mechanic*
 * rather than for a picture.
 *
 * His commission of 16/08: photographers come in from the edges of the screen, lie down on
 * the ground, and try to photograph the gorilla. The gorilla attacks; the photographer runs
 * back to the edge it came from.
 *
 * **Three gaits on one body, and that is the claim the grammar has been making since day
 * zero** — an action is data over an existing body, not a redrawing of it. Run 7 tested it
 * with a jump and an attack on the gorilla. This tests it harder, because `prone` is not a
 * variation on standing: the whole spine turns ninety degrees and the legs trail behind. If
 * a pose that different is reachable by rotating anchored parts, the claim holds for
 * anything a person does lying down.
 *
 * **What the body is for.** It has to read at 50 px against a wood, in one glance, as *a
 * person with a camera* — so the camera is the largest single accessory on it and it gets
 * its own material and a lens bright enough to be the highest value in the sprite. That is
 * the lesson probe D paid for: **a material that appears in two unrelated places is a
 * material doing two jobs**, and its inverse — an accessory that shares a material with
 * anatomy is read as anatomy.
 */
import type { Bone, Gait, Grammar, Palette, Part } from '../../core/types.ts'

/**
 * **The photographer's palette: five materials, five tones each, wide range with a drawn
 * line.** The idiom he ranked first on 15/08.
 *
 * The colours are chosen to sit in a wet wood rather than to be pretty on their own: a
 * desaturated olive vest and khaki trousers, which is what field kit actually is, and skin
 * warm enough to be the only warm thing in the picture — the eye finds him instantly against
 * an overcast forest, and that matters more here than it would on a character sheet, because
 * he is a target.
 */
const FIELD: Palette = {
  name: 'photog',
  colors: [
    [0, 0, 0],
    // skin — warm, and the only warm hue in the wood
    [78, 46, 36],
    [116, 72, 54],
    [156, 104, 78],
    [196, 146, 112],
    [230, 194, 158],
    // vest — olive field kit, close to the wood's greens so he belongs in it
    [34, 40, 30],
    [54, 62, 44],
    [78, 88, 62],
    [108, 118, 84],
    [146, 156, 116],
    // trouser — khaki, a value step off the vest so the two masses separate
    [44, 40, 32],
    [68, 62, 48],
    [96, 88, 68],
    [130, 120, 94],
    [170, 158, 126],
    // gear — the camera body and the boots, near-black and cool
    [16, 18, 22],
    [28, 31, 38],
    [44, 48, 58],
    [66, 72, 86],
    [98, 106, 124],
    // lens — the brightest thing on the sprite, so a 6 px disc still reads as glass
    [70, 84, 96],
    [110, 132, 148],
    [156, 182, 198],
    [206, 226, 236],
    [246, 252, 255],
    // ink — a cool black, the drawn line
    [12, 12, 16],
    [18, 19, 24],
    [26, 28, 34],
    [36, 39, 47],
    [48, 52, 62],
  ],
  ramps: [
    { material: 'skin', indices: [1, 2, 3, 4, 5] },
    { material: 'vest', indices: [6, 7, 8, 9, 10] },
    { material: 'trouser', indices: [11, 12, 13, 14, 15] },
    { material: 'gear', indices: [16, 17, 18, 19, 20] },
    { material: 'lens', indices: [21, 22, 23, 24, 25] },
    { material: 'ink', indices: [26, 27, 28, 29, 30] },
  ],
}

/**
 * **One body, and every gait below transforms exactly these bones.**
 *
 * Depth is on the bones rather than in the paint order, the same as the gorilla since run 7:
 * the far arm at +6 and the near arm at -6 against a torso 5 deep, so the near limb stands
 * proud of the mass and the far one is genuinely behind it.
 */
const bones: Bone[] = [
  { name: 'pelvis', parent: null, x: 0, y: 0, z: 0, angle: 0 },
  { name: 'torso', parent: 'pelvis', x: 0, y: -1, z: 0, angle: 0 },
  { name: 'neck', parent: 'torso', x: 0.5, y: -13, z: 0, angle: 0 },
  { name: 'head', parent: 'neck', x: 0.5, y: -3.5, z: 0, angle: 0 },
  // Far limbs first, so a tie at exactly equal depth still breaks the way the animal reads.
  { name: 'armFU', parent: 'torso', x: 0, y: -11, z: 6, angle: 0.02 },
  { name: 'armFL', parent: 'armFU', x: 0, y: 7.5, z: 0, angle: 0.05 },
  { name: 'legFU', parent: 'pelvis', x: -0.5, y: 1, z: 5, angle: 0 },
  { name: 'legFL', parent: 'legFU', x: 0, y: 9, z: 0, angle: 0.02 },
  { name: 'legNU', parent: 'pelvis', x: 1, y: 1, z: -5, angle: 0 },
  { name: 'legNL', parent: 'legNU', x: 0, y: 9, z: 0, angle: 0.02 },
  { name: 'armNU', parent: 'torso', x: 1, y: -11, z: -6, angle: -0.02 },
  { name: 'armNL', parent: 'armNU', x: 0, y: 7.5, z: 0, angle: -0.05 },
  // The camera hangs off the near forearm, so it goes where the hands go and needs no track
  // of its own in any gait. That is the whole reason it is a bone rather than a part on the
  // arm: it has to be able to sit at the eye in one pose and swing at the chest in another.
  { name: 'cam', parent: 'armNL', x: 0, y: 7, z: -3, angle: 0 },
]

const parts: Part[] = [
  { name: 'armFU', bone: 'armFU', material: 'vest', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.5, r: 2, r1: 1.7 } },
  { name: 'armFL', bone: 'armFL', material: 'skin', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 1.7, r1: 1.4 } },
  { name: 'legFU', bone: 'legFU', material: 'trouser', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 9, r: 2.6, r1: 2.1 } },
  { name: 'legFL', bone: 'legFL', material: 'trouser', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 9, r: 2.1, r1: 1.7 } },
  { name: 'bootF', bone: 'legFL', material: 'gear', shift: -1, shape: { kind: 'ellipse', cx: 1.4, cy: 9.4, rx: 3, ry: 1.8, rz: 2.6 } },

  // The two masses. A pack on the back is what stops a side-on human from being a plank, and
  // it also says field kit without needing a single readable detail.
  { name: 'pelvis', bone: 'pelvis', material: 'trouser', shape: { kind: 'ellipse', cx: 0, cy: -1, rx: 4, ry: 4, rz: 4.4 } },
  { name: 'torso', bone: 'torso', material: 'vest', shape: { kind: 'ellipse', cx: 0, cy: -7, rx: 4.6, ry: 7.5, rz: 5 } },
  { name: 'pack', bone: 'torso', material: 'gear', z: 4, shift: -1, shape: { kind: 'ellipse', cx: -4.2, cy: -7, rx: 3, ry: 5, rz: 3.4 } },
  { name: 'neck', bone: 'neck', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 2.5, r: 1.6 } },
  { name: 'head', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 3.6, ry: 4, rz: 3.8 } },
  { name: 'cap', bone: 'head', material: 'vest', z: -1, shape: { kind: 'ellipse', cx: -0.2, cy: -2.8, rx: 3.9, ry: 2.2, rz: 4 } },
  { name: 'peak', bone: 'head', material: 'vest', z: -2, shape: { kind: 'capsule', x0: 1.5, y0: -2.2, x1: 5.2, y1: -1.8, r: 0.9 } },

  { name: 'legNU', bone: 'legNU', material: 'trouser', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 9, r: 2.8, r1: 2.3 } },
  { name: 'legNL', bone: 'legNL', material: 'trouser', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 9, r: 2.3, r1: 1.8 } },
  { name: 'bootN', bone: 'legNL', material: 'gear', shape: { kind: 'ellipse', cx: 1.5, cy: 9.5, rx: 3.2, ry: 1.9, rz: 2.8 } },
  { name: 'armNU', bone: 'armNU', material: 'vest', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.5, r: 2.2, r1: 1.8 } },
  { name: 'armNL', bone: 'armNL', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 1.8, r1: 1.5 } },

  // **The camera, and it is the biggest accessory on the body on purpose.** At 50 px a
  // person carrying something small is a person carrying nothing, and the whole mechanic
  // depends on reading, at a glance, that this one is pointing a lens at you.
  { name: 'body', bone: 'cam', material: 'gear', z: -3, shape: { kind: 'rect', x: -2.6, y: -2.4, w: 5.2, h: 4.4, d: 4 } },
  { name: 'barrel', bone: 'cam', material: 'gear', z: -4, shape: { kind: 'capsule', x0: 1.5, y0: 0, x1: 5.5, y1: 0, r: 1.8 } },
  { name: 'glass', bone: 'cam', material: 'lens', z: -5, shape: { kind: 'ellipse', cx: 5.8, cy: 0, rx: 1.5, ry: 1.6, rz: 1.2 } },
]

const PHASES = [
  { name: 'contact', at: 0 },
  { name: 'down', at: 0.25 },
  { name: 'pass', at: 0.5 },
  { name: 'up', at: 0.75 },
] as const

/**
 * **Walking in.** A stride with the camera down at the chest: he has not raised it yet, so
 * the pose says "arriving" rather than "shooting", and the two states are told apart by
 * silhouette rather than by anything the player has to notice.
 */
const WALK: Gait = {
  name: 'walk',
  phases: [...PHASES],
  tracks: [
    // **Every key here is a fraction of `gait.swing`, and `gait.swing` belongs to the prone
    // gait.** Laying the spine flat needs a quarter turn; a walking thigh needs 25 degrees.
    // One amplitude serves three gaits, so the walk's numbers are small on purpose — the
    // first draft reused a walk's usual key of 0.9 against a 104 degree amplitude and the
    // legs came out in a 94 degree split.
    { bone: 'pelvis', channel: 'y', keys: [0, 0.34, 0, -0.34] },
    { bone: 'torso', channel: 'angle', keys: [0.03, 0.05, 0.03, 0.01] },
    { bone: 'legNU', channel: 'angle', keys: [0.24, 0, -0.23, 0] },
    { bone: 'legNL', channel: 'angle', keys: [0, 0.44, 0.08, -0.14] },
    { bone: 'legFU', channel: 'angle', keys: [-0.23, 0, 0.24, 0] },
    { bone: 'legFL', channel: 'angle', keys: [0.08, -0.14, 0, 0.44] },
    { bone: 'armNU', channel: 'angle', keys: [-0.19, -0.02, 0.15, -0.02] },
    { bone: 'armNL', channel: 'angle', keys: [-0.3, -0.34, -0.3, -0.26] },
    { bone: 'armFU', channel: 'angle', keys: [0.17, -0.01, -0.19, -0.01] },
    { bone: 'armFL', channel: 'angle', keys: [-0.19, -0.15, -0.19, -0.23] },
    { bone: 'head', channel: 'angle', keys: [0.02, 0, -0.02, 0] },
    // Aimed down and in, hanging at the chest: a camera nobody is looking through points at
    // the ground. Without a track it inherits the forearm and swings like a lantern.
    { bone: 'cam', channel: 'angle', keys: [0.42, 0.4, 0.44, 0.41] },
  ],
}

/**
 * **Prone, and this is the pose that tests the grammar.**
 *
 * The spine turns a quarter turn: `pelvis` at 0.25 lays the whole body flat and takes the
 * legs with it, so they trail behind without a single track of their own beyond a small
 * spread. The chest props up on the elbows, the head lifts to the viewfinder, and the near
 * arm folds so the camera lands at the eye.
 *
 * **Nothing here is a redrawn frame.** Every part is the same solid the standing body uses,
 * at a different angle — which is exactly the cut `CLAUDE.md` names as the one separating
 * reachable from unreachable, tested at ninety degrees rather than at ten.
 *
 * The cycle is a slow breath with the shutter finger working, so a photographer lying still
 * is still visibly alive. A held frame reads as a bug.
 */
const PRONE: Gait = {
  name: 'prone',
  phases: [
    { name: 'settle', at: 0 },
    { name: 'sight', at: 0.25 },
    { name: 'hold', at: 0.5 },
    { name: 'breathe', at: 0.75 },
  ],
  tracks: [
    // A quarter turn lays the spine flat and takes the legs with it. 0.86 x 0.29 = 0.249, so
    // the pelvis lands on 90 degrees exactly.
    { bone: 'pelvis', channel: 'angle', keys: [0.86, 0.86, 0.86, 0.86] },
    { bone: 'pelvis', channel: 'y', keys: [0, -0.06, 0, 0.06] },
    // **The spine is nearly horizontal, and the first draft had it at 52 degrees.** That is a
    // man kneeling, not a man on his belly, and it put his head 8 px in front of his pelvis
    // where a prone body puts it 20. The chest rises 15 degrees off the floor, propped on the
    // elbows, and breathes about two.
    { bone: 'torso', channel: 'angle', keys: [-0.24, -0.27, -0.26, -0.25] },
    { bone: 'neck', channel: 'angle', keys: [-0.15, -0.17, -0.16, -0.158] },
    { bone: 'head', channel: 'angle', keys: [-0.1, -0.12, -0.11, -0.105] },
    // **Legs trail nearly straight.** They were folding 43 degrees at the knee, backwards —
    // a leg does not do that, and it is what made them read as inverted. A prone leg is a
    // straight line with the boot flat on the floor.
    { bone: 'legNU', channel: 'angle', keys: [0.06, 0.055, 0.065, 0.058] },
    { bone: 'legNL', channel: 'angle', keys: [-0.02, -0.04, -0.01, -0.03] },
    { bone: 'legFU', channel: 'angle', keys: [0.03, 0.035, 0.025, 0.032] },
    { bone: 'legFL', channel: 'angle', keys: [0, 0.015, -0.01, 0.008] },
    // Elbows planted on the floor in front of the chest, forearms up to the eye.
    { bone: 'armNU', channel: 'angle', keys: [-0.89, -0.91, -0.9, -0.895] },
    { bone: 'armNL', channel: 'angle', keys: [-0.95, -0.97, -0.96, -0.955] },
    { bone: 'armFU', channel: 'angle', keys: [-0.85, -0.87, -0.86, -0.855] },
    { bone: 'armFL', channel: 'angle', keys: [-0.92, -0.94, -0.93, -0.925] },
    // **The camera is aimed, not carried, and that is why it has a track of its own.**
    //
    // Without one it inherits the forearm's angle, and a forearm folded back to the eye
    // points the lens at the photographer's own face — which is exactly what it did. A wrist
    // is the joint that separates where a hand IS from where it points, and this is that
    // joint. Every gait aims it; none of them let it drift.
    { bone: 'cam', channel: 'angle', keys: [1.26, 1.28, 1.27, 1.265] },
  ],
}

/**
 * **Running away.** The same stride, opened up and pitched forward, with the camera clutched
 * in to the chest rather than swinging — which is what a person carrying something expensive
 * does when they stop caring about anything else.
 */
const RUN: Gait = {
  name: 'run',
  phases: [...PHASES],
  tracks: [
    { bone: 'pelvis', channel: 'y', keys: [0.3, -0.9, 0.3, -0.9] },
    { bone: 'torso', channel: 'angle', keys: [0.09, 0.11, 0.09, 0.11] },
    { bone: 'neck', channel: 'angle', keys: [-0.05, -0.07, -0.05, -0.07] },
    // A stride at 40 degrees against the walk's 25: the difference between the two gaits is
    // amplitude and pitch, and nothing else. A run that is a fast walk is a fast walk.
    { bone: 'legNU', channel: 'angle', keys: [0.38, -0.05, -0.36, 0.08] },
    { bone: 'legNL', channel: 'angle', keys: [-0.05, 0.62, 0.08, -0.24] },
    { bone: 'legFU', channel: 'angle', keys: [-0.36, 0.08, 0.38, -0.05] },
    { bone: 'legFL', channel: 'angle', keys: [0.08, -0.24, -0.05, 0.62] },
    // Both arms in and folded: the camera is being protected, not carried.
    { bone: 'armNU', channel: 'angle', keys: [-0.26, -0.2, -0.28, -0.22] },
    { bone: 'armNL', channel: 'angle', keys: [-0.5, -0.54, -0.48, -0.52] },
    { bone: 'armFU', channel: 'angle', keys: [-0.2, -0.26, -0.22, -0.28] },
    { bone: 'armFL', channel: 'angle', keys: [-0.46, -0.42, -0.5, -0.44] },
    { bone: 'head', channel: 'angle', keys: [-0.06, -0.02, -0.06, -0.02] },
    // Clutched in and turned down, protected against the chest.
    { bone: 'cam', channel: 'angle', keys: [0.66, 0.68, 0.65, 0.67] },
  ],
}

const of = (name: string, gait: Gait): Grammar => ({ name, palette: FIELD, skeleton: { bones }, parts, gait })

export const photogWalk = of('photog-walk', WALK)
export const photogProne = of('photog-prone', PRONE)
export const photogRun = of('photog-run', RUN)

export const PHOTOGRAPHER: readonly Grammar[] = [photogWalk, photogProne, photogRun]
