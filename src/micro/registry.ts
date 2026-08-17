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

import type { Scene } from '../scene/types.ts'
import { cozyScene } from './cozy-scene.ts'
import { cryptScene } from './crypt-scene.ts'
import { skateScene } from './skate-scene.ts'
import { forestScene } from './forest-scene.ts'
import { moonScene } from './moon-scene.ts'
import { aeroScene } from './aero-scene.ts'
import { snowScene } from './snow-scene.ts'
import { descentScene } from './descent-scene.ts'

export type MicroGame = {
  /** Stable, and it never changes: he navigates by it. */
  readonly id: string
  readonly title: string
  /** One sentence on what this iteration added. Not a description of the picture. */
  readonly blurb: string
  readonly date: string
  readonly scene: Scene
  /** What the keys do. Written per game, because a control scheme belongs to a game. */
  readonly keys?: string
}




/**
 * **The shelf was cleared on 15/08, at his instruction.** The two entries that opened it —
 * `side-view` and `top-down` — were reorganisations of existing work rather than
 * iterations, and the pending defects they carried (three absent parts on the mech, two on
 * the beetle, eight subjects still in the ink he ranked last) go with them. His reasoning,
 * and it is better than fixing them one by one: *"possivelmente elas irão emergir nessa
 * nova forma de trabalho"* — a defect that matters will come back as a commission, and one
 * that never comes back never mattered.
 *
 * **Commission 1, his words, 15/08: a dense forest.**
 *
 * - a forest, with **a diversity of trees of distinct shapes**
 * - the **gorilla under his control** in the scene, walking left and right only
 * - **loaded clouds and rain** happening in it
 *
 * One request, and it lands on three of the four gaps named that morning:
 *
 * | the ask | the capability it needs |
 * |---|---|
 * | trees of distinct shapes | generativity — one tree has to become trees |
 * | a controlled gorilla | the engine: input, a loop, state, facing |
 * | rain and cloud | effects, and there is no mechanism at all |
 *
 * **Rain is the structural one.** It is not a body, it is a **field**: this grammar is bones
 * and parts, so two hundred drops would be two hundred parts. Fire, smoke, sparks and rain
 * are all fields — a function of position and time rather than a transformed solid — and
 * that is a new class of primitive rather than another shape.
 *
 * **And the scene stops being a frame strip.** A gorilla he steers cannot be pre-rendered,
 * so the browser has to run a loop: input, state, draw. That is the engine slice arriving
 * because content demanded it, which is the right way round.
 */
export const MICRO_GAMES: readonly MicroGame[] = [
  {
    id: 'forest',
    title: 'The forest',
    blurb:
      'Walk the silverback with the arrows and hit with space. Photographers come in from the edges, lie down and start shooting; drive them off before they get the picture. Fourteen trees from one recursive grammar, all of them behind the player so the front of the stage stays clear. Depth is one number and haze rather than position; the clouds drift in real seconds, so there is no loop point left for them to jump at.',
    date: '2026-08-16',
    keys: '← → walk · space attack · drive the photographers off before they get the shot',
    scene: forestScene,
  },
  /**
   * **Gate v3, batch 1.** His sentence, in one turn, with no back-and-forth:
   *
   * > *"Eu quero que você crie para mim um astronauta. Quero ser capaz de pular e andar em
   * > todas as direções com ele. O ambiente: o solo lunar, similar a vista da lua com a terra
   * > ao fundo."*
   *
   * My prediction of a miss, and the reason, are in `BACKLOG.md` — written before he looked.
   */
  {
    id: 'moon',
    title: 'The moon',
    blurb:
      'Walk in eight directions with the arrows and jump with space. One authored body turned about its own axis gives every facing: fifteen grammars from one astronaut. The jump is lunar — 42 px/s of gravity against a 62 px/s push, which hangs for nearly three seconds — and the shadow on the ground is the only thing telling you where you land. No haze anywhere, because there is no air: distance is carried by the floor alone.',
    date: '2026-08-16',
    keys: '← → ↑ ↓ walk in eight directions · space jump · the shadow is where you land',
    scene: moonScene,
  },
  /**
   * **The climb.** His commission, 16/08, and the sentence before it decided the round:
   *
   * > *"Será um jogo de plataforma em que um gatinho pula de plataforma em plataforma. O mesmo
   * > conceito do doodle jump, só que com uma estética de Cozy Game."*
   * >
   * > *"Não vou atacar o 3d agora pois segundo sua própria recomendação precisamos atacar a
   * > consequência primeiro."*
   *
   * The recommendation is a line of mine from the same day: the forest has a mechanic and no
   * consequence, and that is the smallest work on the list with the largest return. **So this
   * is the first game on the shelf that can be lost**, and the fall is the point of it.
   */
  {
    id: 'cozy',
    title: 'The climb',
    blurb:
      'Steer the kitten with the arrows; the bounce is automatic and there is no jump key. The tower has no top and is not stored anywhere — every shelf is an integer hash of its own band index, so the climb is endless and identical on every machine. It is provably climbable: the apex of one bounce is 96 px and no gap is ever more than 58. The sky is a function of how high you are, the stars come out as you go, and falling off the bottom ends the run — the first consequence anything on this shelf has had. His second reading thinned the tower and doubled the pixel: 9 shelves on screen instead of 16, and a run that never aims now reaches 6 m where it used to reach 20.',
    date: '2026-08-16',
    keys: '← → steer · space to climb again after a fall · the bounce takes care of itself',
    scene: cozyScene,
  },
  /**
   * **The run.** His commission, 16/08, given after he asked to work on 3D and I asked for a
   * sentence that would need pitch or roll.
   *
   * > *"Controlamos uma caveira fugindo da morte... estilo a página de offline do google... o
   * > diferencial aqui é que a caveira tem um pulo duplo em que ela projeta um salto mortal para
   * > frente. Quero um acabamento e familiaridade com o SOTN."*
   *
   * **It did not need 3D.** A somersault seen from the side is a screen-plane rotation. What it
   * did need was a gait that ends somewhere other than where it started, which nothing here
   * could express — see `Gait.wrap`.
   */
  {
    id: 'crypt',
    title: 'The run',
    blurb:
      'Space to jump, space again in the air for the somersault. The graveyard is generated from an integer hash of its own index, so it never ends and it is the same on every machine. The first jump clears a broken stump; a cross needs the flip, which is the double jump earning its place rather than decorating it. Death is one number between nought and one: time pushes it up, a collision shoves it, clearing a stone gives a little back, and where she stands on screen is that number read as a distance. Six hits end a run. The somersault turns a full circle, which is the first animation here that does not return to where it started.',
    date: '2026-08-16',
    keys: 'space jump · space again in the air = somersault · six collisions and she reaches you',
    scene: cryptScene,
  },
  /**
   * **Micro game 5: the kickflip.** His commission, 16/08, chosen from three themes I offered after
   * he asked to attack 3D and pixel art in one experimental round.
   *
   * > *"Vamos de skate (sua recomendação), e posteriormente os outros 2 para validar se
   * > consolidamos a técnica. Pixel Art: pode puxar para o extremo do desafio."*
   *
   * **This one did need 3D, and it is the first commission here that does.** A kickflip is rotation
   * about the axis the skater travels along, which for a figure crossing the picture is screen x —
   * so the deck tilts toward and away from the camera. `Bone.angle` lives in the screen plane and
   * `yaw.ts` turns a body about the vertical; neither could do it. The record called it
   * *inexpressible* rather than badly tuned, and this is the round that expressed it.
   *
   * **The pixel-art half came back with a measured no on the rider**, and the number is in
   * `skate-scene.ts`: a 36 px body of 27 primitives has no patch of one surface for a lattice to sit
   * on, so the weave there is the speckle his 15/08 verdict retired. It ships on the sky and the
   * road, which are one surface a hundred rows deep.
   */
  {
    id: 'skate',
    title: 'Kickflip',
    blurb:
      'Space to ollie, space again in the air for a kickflip. The board turns a full circle about its own length, which is the first rotation here that leaves the screen plane at all: a quarter of the way through you are looking at 8 px of pale wood where a moment before there were 2 px of edge, and three quarters through it is the grip tape, the darkest thing on the subject. Thin, bright, thin, dark, thin — and no paint order, ramp shift or depth offset can produce that sequence. The kerb and the cone fall to the ollie; the rail needs the flip. The dusk and the asphalt are an ordered Bayer weave rather than flat bands, which is where the pixel-art work of this round measurably landed — the rider carries none of it, because a body this small has no surface to weave on.',
    date: '2026-08-16',
    keys: 'space ollie · space again in the air = kickflip · one collision ends the run',
    scene: skateScene,
  },
  /**
   * **Micro game 6: the dawn patrol.** Transfer test B from the backlog — the barrel roll on a
   * second subject — delivered as the game it lives in, per the 15/08 rule.
   *
   * The kickflip proved `Bone.roll` on a plank hanging from an unrotated bone. This machine is
   * the same channel on the ROOT of a 21-part skeleton: wings, tail, wheels and pilot all carried
   * through the turn, and the silhouette is the proof — 26 px of wingspan that live entirely in
   * depth at rest sweep into the vertical at the quarter turn, so the sprite grows mass that was
   * never on screen. The climb is the control, authored wholly in the screen plane.
   */
  {
    id: 'aero',
    title: 'Barrel roll',
    blurb:
      'Space climbs; space again in the air is a barrel roll. The biplane turns a whole circle about its own length — a quarter in, the wings that were two pale edges stand upright taller than the machine, and the cream undersides trade places with the crimson tops the way the deck traded wood for grip. The balloon and the flock fall to the climb; the kite balloon hangs its cable too high for anything but the roll. The dawn and the valley far below are the largest woven surface on the shelf, and two cloud bands drift at their own fractions of the world’s speed, so the sky has depth the backdrop alone could never carry. One collision and you go down.',
    date: '2026-08-17',
    keys: 'space climb · space again in the air = barrel roll · one collision ends the run',
    scene: aeroScene,
  },
  /**
   * **Micro game 7: the rodeo.** His commission, 17/08 — snowboard, and the aesthetic is a
   * him-named reference: Yoshi's Island, SNES, "bem pixel art mesmo". The sky weaves on the
   * 2×2 checker instead of the 4×4 Bayer, the line is crayon-warm, the snow falls in front of
   * the world, and the trick composes a full roll with a root that leans — the declared
   * approximation of `Bone.roll`, tested in the camera his reference forces.
   */
  {
    id: 'snow',
    title: 'Rodeo',
    blurb:
      'Space jumps; space again in the air is a rodeo — the whole boarder turns a circle about the line of travel, board over head, and comes down riding. The suit and the sky are Yoshi’s Island winter: teal checker-blended sky, blue-shadowed snow, outlined clouds, a treeline on the horizon, and snowfall drifting between you and the mountain. The snowman and the sapling fall to the jump; the tall snow-capped pine needs the trick. One collision and you wipe out.',
    date: '2026-08-17',
    keys: 'space jump · space again in the air = rodeo · one collision ends the run',
    scene: snowScene,
  },
  /**
   * **Micro game 8: the descent.** His correction, 17/08 — the snowboard test was always about
   * the CAMERA — and this is the camera: the first new view since the moon, high behind the
   * rider, the world scrolling down the fall line. Steering plays the composed carve (a 31–36°
   * bank with rolled children under it, the declared approximation at full amplitude, measured
   * in the locks), and the mountain is the same Yoshi's Island winter seen from above.
   */
  {
    id: 'descent',
    title: 'The descent',
    blurb:
      'Hold left or right to carve — the whole body banks past thirty degrees, inside hand brushing the snow — and space hops. You ride into the screen: everything ahead is born small at the horizon and grows down the perspective curve toward you, through seven crisp render sizes, converging lanes and flowing snow-dust — his batch-7 reading, compiled. Rocks and snowmen pass under the hop; saplings and pines do not, and the difference is only how tall each is drawn. One collision and you wipe out. The snowfall, the checker sky and the crayon line are the same winter as the rodeo — one mountain, two cameras.',
    date: '2026-08-17',
    keys: '← → carve · space hop · rocks and snowmen duck under the hop, pines never',
    scene: descentScene,
  },
]
