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
import { forestScene } from './forest-scene.ts'
import { moonScene } from './moon-scene.ts'

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
]
