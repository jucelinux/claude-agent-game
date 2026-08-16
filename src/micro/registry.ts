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

import type { Scene } from '../scene/compose.ts'
import { forestScene } from './forest-scene.ts'

export type MicroGame = {
  /** Stable, and it never changes: he navigates by it. */
  readonly id: string
  readonly title: string
  /** One sentence on what this iteration added. Not a description of the picture. */
  readonly blurb: string
  readonly date: string
  readonly scene: Scene
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
      'Walk the gorilla with the arrow keys. Fourteen trees from one recursive grammar — a branch is a smaller tree, so a crown is a consequence of its branching rather than a layout placed near it. Depth is haze rather than position, every trunk obeys a physical ceiling on its girth, and the clouds drift in real seconds rather than in frames, so there is no loop point left for them to jump at.',
    date: '2026-08-15',
    scene: forestScene,
  },
]
