/**
 * Run 14 — **the astronaut.** Gate v3, batch 1, and the first commission this project has
 * taken in his format: one sentence, no back-and-forth, one word back.
 *
 * > *"Eu quero que você crie para mim um astronauta. Quero ser capaz de pular e andar em todas
 * > as direções com ele. O ambiente: o solo lunar, similar a vista da lua com a terra ao
 * > fundo."*
 *
 * **The body is authored once, facing east, and turned by `yaw`.** Eight facings from one
 * grammar. That is the gap named on 15/08 and it is what the sentence actually asks for.
 *
 * **Why a pressure suit is the right body to test a yaw on, and it is luck rather than
 * design.** Every body this project has drawn is much wider than it is deep — a gorilla, a
 * human, a mantis. Turn one of those ninety degrees and the silhouette collapses. A suit is
 * close to a stack of near-cylinders: the torso is a barrel, the limbs are tubes, the helmet
 * is a sphere. Its front and side silhouettes differ less than any other body's would, so a
 * yaw that would embarrass a gorilla is survivable here. **That is worth stating plainly
 * before the verdict rather than claiming afterwards.**
 *
 * **The suit's three readable facts, in order of how far away they still work:**
 *
 * 1. **The helmet, and its visor.** One sphere and one dark disc. At any distance, a round
 *    head with a black face says astronaut and nothing else does.
 * 2. **The pack.** A box on the back, which is also what tells you which way he is facing
 *    when the visor is turned away — the one silhouette cue that survives a yaw to `n`.
 * 3. **The joint rings.** A suit is segmented at every joint, and those rings are the only
 *    place the drawn line is *supposed* to show. Everywhere else the suit is one surface,
 *    which is exactly what `Part.marking` was built for two hours ago.
 */
import type { Bone, Gait, Grammar, Palette, Part } from '../../core/types.ts'
import { yaw, FACINGS, YAW_OF } from '../../core/yaw.ts'

/**
 * **The suit's palette: white that is never white.**
 *
 * A pressure suit photographs as blinding white and paints as a pale warm grey, because the
 * lit face has to leave room above it for the *specular* on the helmet and for the sunlit
 * regolith. A material that starts at its brightest has nowhere to go.
 *
 * Five tones per material, the idiom he ranked first on 15/08.
 */
const SUIT: Palette = {
  name: 'astronaut',
  colors: [
    [0, 0, 0],
    // suit — warm off-white. The darkest is a lunar shadow, which is nearly black: there is
    // no air on the moon to bounce light into a shadow, and that is the whole look.
    [38, 38, 46],
    [86, 86, 96],
    [140, 140, 148],
    [190, 190, 194],
    [232, 233, 236],
    // visor — gold, and the only saturated ramp on the body. The Apollo sun visor is gold
    // leaf, and it is the single detail that stops a white figure from being a snowman.
    [46, 30, 10],
    [96, 64, 18],
    [156, 110, 34],
    [212, 164, 64],
    [252, 218, 128],
    // gear — the pack, the boots, the hoses. Cool grey, a clear step below the suit so the
    // silhouette breaks into parts instead of reading as one blob.
    [20, 22, 28],
    [40, 44, 54],
    [66, 72, 86],
    [98, 106, 122],
    [138, 148, 166],
    // flag — the shoulder patch. One saturated red, so a 3 px mark still reads as a mark.
    [70, 16, 20],
    [122, 26, 30],
    [176, 40, 42],
    [214, 74, 68],
    [244, 132, 118],
    // ink — the drawn line, a cool near-black
    [8, 8, 12],
    [14, 15, 20],
    [22, 23, 30],
    [32, 34, 42],
    [44, 46, 56],
  ],
  ramps: [
    { material: 'suit', indices: [1, 2, 3, 4, 5] },
    { material: 'visor', indices: [6, 7, 8, 9, 10] },
    { material: 'gear', indices: [11, 12, 13, 14, 15] },
    { material: 'flag', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

/**
 * **The skeleton, and every depth on it is authored rather than defaulted** — because this is
 * the first body in the project that will be *turned*, and a bone at z 0 stays at x 0 through
 * every yaw. A body with no depth turns into a line.
 */
const bones: Bone[] = [
  { name: 'pelvis', parent: null, x: 0, y: 0, z: 0, angle: 0 },
  { name: 'torso', parent: 'pelvis', x: 0, y: -2, z: 0, angle: 0 },
  { name: 'neck', parent: 'torso', x: 0, y: -12, z: 0, angle: 0 },
  { name: 'head', parent: 'neck', x: 0.5, y: -4, z: 0, angle: 0 },
  /**
   * Far limbs first. **±7.6 against a torso 5.4 wide**, and the number is set by the facing he
   * could not read rather than by the one he could.
   *
   * In a side view the arms overlap the barrel and any offset past 5.5 works. Turned to face
   * the camera those same offsets become the shoulders' width on screen, and at ±5 the arms
   * cleared the torso by two pixels and vanished behind it — *"quando ando com S, não
   * visualizo os braços"*. At ±7.6 they stand five pixels clear of the barrel and, more
   * importantly, clear of the THIGH — which sits at ±3.4 and was eating the forearm at the
   * three-quarter facings. A suit holds the arms out; this is that, said in the only axis a
   * side-on body has for saying it.
   */
  // **Both arms hang the same way and differ only in PHASE.** They were mirrored — the far
  // one splayed forward and the near one back — which is a natural thing to type and an
  // impossible thing for a body. It is the third time this project has shipped that defect,
  // after probe D and the photographer, and the first time it was caught by a lock.
  { name: 'armFU', parent: 'torso', x: 0, y: -10, z: 7.6, angle: -0.03 },
  /**
   * **The forearm hangs straight from the elbow, and the splay it briefly had was a joint
   * break wearing a disguise.**
   *
   * I gave `armFL`/`armNL` a depth offset of 2.6 to hold the forearm outboard, because a
   * pressure suit does hold the arms out. In the authored side view that offset is pure depth
   * and invisible. Turned a quarter it becomes **2.6 px of screen displacement at the elbow**,
   * and he read it in one look: *"os antebraços parecem estar desconectados dos braços"*.
   *
   * It is the same lesson as the visor, one joint further down: **anything authored purely in
   * depth is unfalsifiable in the view it was authored in.** A real arm's segments touch. The
   * splay has to come from where the shoulder is, and the shoulder is already at 7.6.
   */
  { name: 'armFL', parent: 'armFU', x: 0, y: 7, z: 0, angle: -0.04 },
  { name: 'legFU', parent: 'pelvis', x: 0, y: 1, z: 3.4, angle: 0 },
  { name: 'legFL', parent: 'legFU', x: 0, y: 8.5, z: 0, angle: 0.02 },
  { name: 'legNU', parent: 'pelvis', x: 0, y: 1, z: -3.4, angle: 0 },
  { name: 'legNL', parent: 'legNU', x: 0, y: 8.5, z: 0, angle: 0.02 },
  { name: 'armNU', parent: 'torso', x: 0, y: -10, z: -7.6, angle: -0.03 },
  { name: 'armNL', parent: 'armNU', x: 0, y: 7, z: 0, angle: -0.04 },
]

/**
 * **The suit is one surface with rings at the joints, and that is `Part.marking` doing the
 * work he named this morning.**
 *
 * Every limb segment, the torso and the hips are solids and they meet; without help the inner
 * line would draw a seam at every one of those meetings and the suit would read as a pile of
 * sausages — *"todas as formas geométricas que formam uma estrutura do corpo, com o contorno
 * interno visível"*, in his words. The joint rings are markings: they recolour the surface
 * where a real suit is segmented, and nothing else is allowed to announce itself.
 */
const parts: Part[] = [
  { name: 'armFU', bone: 'armFU', material: 'suit', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.9, r1: 2.6 } },
  { name: 'armFL', bone: 'armFL', material: 'suit', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 2.6, r1: 2.3 } },
    // The glove sits past the end of the sleeve rather than inside it. At cy 7.4 the forearm's
  // own end cap — which reaches 9.0 — swallowed it in three of the turned facings, and a hand
  // that vanishes is an arm that ends in nothing.
  { name: 'gloveF', bone: 'armFL', material: 'gear', shift: -1, shape: { kind: 'ellipse', cx: 0.3, cy: 8.6, rx: 2.8, ry: 2.6, rz: 2.8 } },
  { name: 'legFU', bone: 'legFU', material: 'suit', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8.5, r: 3.3, r1: 3 } },
  { name: 'legFL', bone: 'legFL', material: 'suit', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 3, r1: 2.7 } },
  { name: 'bootF', bone: 'legFL', material: 'gear', shift: -1, shape: { kind: 'ellipse', cx: 0.9, cy: 8.6, rx: 3.6, ry: 2.3, rz: 3.4 } },

  // **The barrel.** A suit's torso is pressurised, so it is a cylinder rather than a chest —
  // and a cylinder is the one solid whose silhouette is the same from every direction, which
  // is why this body survives being turned at all.
  { name: 'hips', bone: 'pelvis', material: 'suit', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 4.6, ry: 4.4, rz: 4.6 } },
  { name: 'torso', bone: 'torso', material: 'suit', shape: { kind: 'ellipse', cx: 0, cy: -6, rx: 5.4, ry: 7.6, rz: 5.4 } },
  /**
   * **The PLSS — the square pack on the back**, and he named its absence: *"eu senti falta
   * daquela mochila quadrada que fica nas costas do astronauta"*. It was there and it was too
   * small and too far behind the barrel to clear it.
   *
   * It is also the one part of this body that tells you which way he is facing when the visor
   * has turned away, so it is the silhouette cue the whole eight-way walk rests on. A rect
   * rather than an ellipse because it is the only hard-edged thing on the figure and that
   * contrast is what makes it read as equipment.
   *
   * **It carries NO depth offset, and that is the correction.** It had `z: 5.6` — a lie, told
   * so it would draw behind the torso in a side view where nobody could check it. A pack is
   * centred across a person's back; it sits *behind* them in x and nowhere in z. Turned a
   * quarter, the lie put it five pixels to one side and on top of an arm: *"quando ando com o
   * W o braço do astronauta está atrás da mochila"*. Its depth now comes from its own `d`,
   * which is what a solid's depth is for.
   */
  { name: 'pack', bone: 'torso', material: 'gear', shift: -1, shape: { kind: 'rect', x: -7.2, y: -13, w: 6.2, h: 12, d: 7.4 } },
  { name: 'neck', bone: 'neck', material: 'gear', shape: { kind: 'capsule', x0: 0, y0: -0.5, x1: 0, y1: 1.5, r: 2.6 } },
  // The helmet: a sphere, and the one part of this body that is genuinely the same from every
  // angle. It is also the largest single mass, which is what makes the figure read at 40 px.
  { name: 'helmet', bone: 'head', material: 'suit', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5.2, ry: 5.2, rz: 5.2 } },

  { name: 'legNU', bone: 'legNU', material: 'suit', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8.5, r: 3.5, r1: 3.2 } },
  { name: 'legNL', bone: 'legNL', material: 'suit', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 3.2, r1: 2.9 } },
  { name: 'bootN', bone: 'legNL', material: 'gear', shape: { kind: 'ellipse', cx: 0.9, cy: 8.6, rx: 3.8, ry: 2.4, rz: 3.6 } },
  { name: 'armNU', bone: 'armNU', material: 'suit', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 3.1, r1: 2.8 } },
  { name: 'armNL', bone: 'armNL', material: 'suit', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 2.8, r1: 2.5 } },
  { name: 'gloveN', bone: 'armNL', material: 'gear', shape: { kind: 'ellipse', cx: 0.3, cy: 8.6, rx: 3, ry: 2.8, rz: 3 } },

  // **The visor**, and it is a marking: gold on the front of the helmet, not a lump attached
  // to it. Its depth is what turns it — at `n` it rotates round the sphere and disappears,
  // which is precisely how a person can tell which way he is looking.
  /**
   * **The visor, and its position is now honest.** It had `cx: 2.2, z: -3.6` — half of it
   * forward and half of it shoved at the camera to clear the skull. The shove is a position,
   * so it rotated: a quarter turn to the south sent it 3.6 px to the *left* and he saw it
   * *"olhando para a esquerda"*.
   *
   * A visor is on the front of a helmet and nowhere in depth. It goes forward in `cx`, and the
   * decal rule in `render.ts` hides it when the turn carries it round the back. `z: -0.2` is
   * the smallest negative that keeps it on the near half at the authored facing — a marking
   * needs a side, and zero has none.
   */
  { name: 'visor', bone: 'head', material: 'visor', marking: true, z: -0.2, shape: { kind: 'ellipse', cx: 3.4, cy: 0.2, rx: 3.6, ry: 3.8, rz: 2.4 } },
  // The joint rings: the only places a suit is *supposed* to show a seam.
    // The joint rings run all the way round the body, so they sit on the centre plane and turn
  // with it. -0.2 rather than 0 for the same reason as the visor: a decal needs a side.
  { name: 'ringW', bone: 'torso', material: 'gear', marking: true, z: -0.2, shape: { kind: 'ellipse', cx: 0, cy: 0.6, rx: 5.5, ry: 1.4, rz: 5.5 } },
  { name: 'ringN', bone: 'neck', material: 'gear', marking: true, z: -0.2, shape: { kind: 'ellipse', cx: 0, cy: 1.4, rx: 3.4, ry: 1.3, rz: 3.4 } },
  // The shoulder patch. Three pixels of saturated red on a body with none, so the eye finds
  // the figure against a grey plain instantly — which matters more here than on any subject
  // so far, because the player has to keep track of him while he moves in eight directions.
  { name: 'flag', bone: 'armNU', material: 'flag', marking: true, z: -2.4, shape: { kind: 'ellipse', cx: -0.4, cy: 1.6, rx: 1.8, ry: 2.1, rz: 1.4 } },
]

const PHASES = [
  { name: 'contact', at: 0 },
  { name: 'down', at: 0.25 },
  { name: 'pass', at: 0.5 },
  { name: 'up', at: 0.75 },
] as const

/**
 * **The lunar stride, and it is not a walk.**
 *
 * At a sixth of Earth's gravity a person cannot walk — a stride needs weight to fall onto,
 * and there is not enough. Apollo crews **loped**: both feet leave the ground, the body hangs
 * a long time, and the arms come up for balance rather than swinging. That is a real fact
 * about the subject and it is also the easiest thing in the world to get wrong, because the
 * default is to author a walk and slow it down.
 *
 * Two things carry it, and both are timing rather than shape:
 * - the body rises high and **hangs** — the `up` key is held rather than passed through;
 * - the legs cycle **slowly** while the body is airborne, so the feet look unhurried while
 *   the arc is fast. That contrast is what low gravity looks like.
 */
const LOPE: Gait = {
  name: 'lope',
  phases: [...PHASES],
  tracks: [
    // The hang. Up over one phase, held across two, down over one: an asymmetric arc, which
    // is what a body in a sixth of a g actually traces.
    { bone: 'pelvis', channel: 'y', keys: [0.35, -0.9, -1, -0.2] },
    { bone: 'torso', channel: 'angle', keys: [0.05, 0.03, 0.03, 0.06] },
    { bone: 'legNU', channel: 'angle', keys: [0.3, 0.06, -0.28, -0.02] },
    { bone: 'legNL', channel: 'angle', keys: [0.04, 0.3, 0.1, 0.06] },
    { bone: 'legFU', channel: 'angle', keys: [-0.28, -0.02, 0.3, 0.06] },
    { bone: 'legFL', channel: 'angle', keys: [0.1, 0.06, 0.04, 0.3] },
    /**
     * **The arms pump, and the first version's did not.** His reading of 16/08: *"na animação
     * de movimento, não importa a direção, os braços estão fixos, sempre"*.
     *
     * I had a real fact — a suit's shoulder resists, and Apollo crews loped with their arms
     * out for balance rather than swinging them like a walk — and I applied it until the range
     * was nine degrees, which is not restraint, it is a still image. Twenty-six degrees is
     * restrained; nine is broken. **A fact about a subject is not a licence to stop animating
     * it**, and that is the general form of the mistake.
     */
    { bone: 'armNU', channel: 'angle', keys: [0.01, -0.13, -0.27, -0.13] },
    { bone: 'armNL', channel: 'angle', keys: [-0.15, -0.19, -0.23, -0.19] },
    { bone: 'armFU', channel: 'angle', keys: [-0.27, -0.13, 0.01, -0.13] },
    { bone: 'armFL', channel: 'angle', keys: [-0.23, -0.19, -0.15, -0.19] },
    { bone: 'head', channel: 'angle', keys: [0.01, -0.01, 0.01, -0.01] },
  ],
}

/**
 * **Standing on the moon.** A suit is pressurised, so it never fully relaxes: the idle is a
 * slow sway with the arms held out, and the helmet turns to look around because the body
 * cannot. Three periods that do not divide each other, the same rule the gorilla's idle uses.
 */
const IDLE: Gait = {
  name: 'idle',
  phases: [
    { name: 'rest', at: 0 },
    { name: 'draw', at: 0.25 },
    { name: 'hold', at: 0.5 },
    { name: 'ease', at: 0.75 },
  ],
  tracks: [
    { bone: 'pelvis', channel: 'y', keys: [0, -0.12, 0, 0.1] },
    { bone: 'torso', channel: 'angle', keys: [0.02, 0.01, 0.02, 0.03] },
    { bone: 'head', channel: 'angle', keys: [0.02, -0.03, -0.01, 0.04] },
    { bone: 'armNU', channel: 'angle', keys: [-0.13, -0.15, -0.13, -0.11] },
    { bone: 'armNL', channel: 'angle', keys: [-0.17, -0.19, -0.17, -0.15] },
    { bone: 'armFU', channel: 'angle', keys: [-0.11, -0.13, -0.11, -0.09] },
    { bone: 'armFL', channel: 'angle', keys: [-0.14, -0.16, -0.14, -0.12] },
    { bone: 'legNU', channel: 'angle', keys: [0.01, 0.02, 0.01, 0] },
    { bone: 'legFU', channel: 'angle', keys: [0, 0.01, 0.02, 0.01] },
  ],
}

/**
 * **The jump: one long pose, because a sixth of a g gives you time to hold one.**
 *
 * On Earth a jump is anticipation, extension, a brief hang and an impact to absorb — run 7
 * authored exactly that for the gorilla. Here the hang is most of it. The runtime holds this
 * clip's middle for as long as the arc lasts, so the pose has to be worth looking at for
 * nearly a second: knees tucked, arms out, helmet up.
 */
const LEAP: Gait = {
  name: 'leap',
  phases: [
    { name: 'crouch', at: 0 },
    { name: 'drive', at: 0.25 },
    { name: 'hang', at: 0.5 },
    { name: 'reach', at: 0.75 },
  ],
  tracks: [
    { bone: 'pelvis', channel: 'y', keys: [0.6, -0.4, -0.6, -0.3] },
    { bone: 'torso', channel: 'angle', keys: [0.12, 0.02, 0.01, 0.04] },
    { bone: 'legNU', channel: 'angle', keys: [0.4, -0.2, 0.34, 0.12] },
    { bone: 'legNL', channel: 'angle', keys: [0.5, 0.06, 0.46, 0.16] },
    { bone: 'legFU', channel: 'angle', keys: [0.36, -0.24, 0.28, 0.06] },
    { bone: 'legFL', channel: 'angle', keys: [0.46, 0.04, 0.4, 0.1] },
    { bone: 'armNU', channel: 'angle', keys: [-0.04, -0.28, -0.25, -0.2] },
    { bone: 'armNL', channel: 'angle', keys: [-0.24, -0.14, -0.12, -0.17] },
    { bone: 'armFU', channel: 'angle', keys: [-0.02, -0.25, -0.22, -0.18] },
    { bone: 'armFL', channel: 'angle', keys: [-0.21, -0.12, -0.1, -0.15] },
    { bone: 'head', channel: 'angle', keys: [0.04, -0.02, -0.03, -0.01] },
  ],
}

const base = (name: string, gait: Gait): Grammar => ({ name, palette: SUIT, skeleton: { bones }, parts, gait })

/** The three clips, authored facing east. */
export const ASTRO_CLIPS = { idle: IDLE, lope: LOPE, leap: LEAP } as const

/**
 * **Every clip in every facing, generated.** Three gaits times five turns — the western three
 * are mirrors of the eastern three and the runtime reaches them by flipping, which is exactly
 * how the gorilla already faces left.
 */
export const ASTRONAUT: readonly Grammar[] = Object.entries(ASTRO_CLIPS).flatMap(([clip, gait]) =>
  (['e', 'ne', 'n', 'se', 's'] as const).map((f) =>
    // The amplitudes come from `tunables/astronaut.json`, repeated here because `src/core`
    // may not read a tunables file and a unit conversion that guesses its units is a bug.
    yaw(base(`astro-${clip}-${f}`, gait), YAW_OF[f], `astro-${clip}-${f}`, 0.26, 7),
  ),
)

export { FACINGS }
