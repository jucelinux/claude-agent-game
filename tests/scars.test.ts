import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { ROOT } from '../src/io/load.ts'

/**
 * **The gates for the scars that had none, and they ask rather than demand.**
 *
 * `SCARS.md` is the ledger of lessons that apply to more than one game and of whether anything
 * enforces them. Three had nothing at all, and one of those — the contact shadow — was recorded
 * in three markdown files and still shipped missing from three games, INCLUDING the one it was
 * discovered in. That is the measured cost that released the round-close step of the frozen
 * method, and these are what it buys.
 *
 * **The shape matters more than the rules.** `CLAUDE.md`'s don't still holds: a rule that would
 * spare a conversation is suspect. So each of these lets a scene say *no, and here is why*, in a
 * sentence a human reads — and refuses silence. The measured counter-example is `bandHold`: the
 * arena needs the size-band hold and `/descent` genuinely does not, because on a treadmill every
 * boundary is crossed once. A gate that demanded it of both would have put a meaningless number
 * into a shipped game.
 *
 * A declared exception is not a loophole. It is the conversation, written down where the next
 * reader will find it.
 */

/** An exemption must be a sentence, not a shrug. Ten characters is the `_anchors` bar. */
const SENTENCE = 12

describe('SCARS #1 — nothing on a plane is grounded without a contact shadow', () => {
  for (const game of MICRO_GAMES) {
    const stage = toStage(game.scene)
    const n = stage.runner
    if (n === null) continue
    it(`${game.id}: declares a contact shadow, or why it has none`, () => {
      if (n.contact !== undefined) {
        expect(n.contact.rx, `${game.id}'s contact shadow has no width`).toBeGreaterThan(0)
        expect(n.contact.alpha).toBeGreaterThan(0)
        expect(n.contact.fade, 'a shadow that never shrinks says nothing about height').toBeGreaterThan(0)
        return
      }
      expect(n.noContact, `${game.id} has neither a contact shadow nor a reason for having none`)
        .toBeDefined()
      expect(n.noContact!.length, `${game.id}'s reason is too short to be one`).toBeGreaterThan(SENTENCE)
    })
  }

  it('and at least one game actually carries one, or this gate is decorative', () => {
    // A gate every scene satisfies by writing an excuse is a gate that enforces nothing.
    let carried = 0
    for (const game of MICRO_GAMES) if (toStage(game.scene).runner?.contact !== undefined) carried++
    expect(carried, 'no runner has a contact shadow — the gate is passing on exemptions alone')
      .toBeGreaterThan(2)
  }, 60_000)
})

describe('SCARS #2 — an obstacle leaves the screen before it is destroyed', () => {
  /**
   * The lock this replaces named three stages by hand, and two games were born after it. Naming
   * stages by hand is how a sweep stops sweeping: it does not fail when a game is added, it just
   * quietly stops covering the shelf.
   */
  for (const game of MICRO_GAMES) {
    const stage = toStage(game.scene)
    const n = stage.runner
    if (n === null) continue
    it(`${game.id}: the draw window reaches past both edges`, () => {
      // The window the draw loop walks, in world units, either side of what is on screen.
      const before = n.leadIn + n.spacing
      expect(before, `${game.id} would destroy an obstacle before it left the screen`)
        .toBeGreaterThan(0)
      // A stone at the far edge must still be inside the window when its last pixel is on screen.
      const widest = Math.max(...n.stones.map((li) => stage.layers[li]!.w))
      expect(n.spacing, `${game.id} spaces obstacles closer than one is wide`).toBeGreaterThan(widest)
    })
  }
})

describe('SCARS #3 — an animation rate is derived from the body, never picked', () => {
  /**
   * Twice this shipped and twice his words named it as feel: *"parece que ela está correndo em
   * supervelocidade"*, then *"desengonçada"*. Both times the cause was a divisor somebody chose,
   * so the animation accelerated while the body did not. The rule is that a travelling actor's
   * cycle is DISTANCE over a stride length, and a stride length is a fact about the body.
   */
  const RATE = /strideLen/
  for (const game of MICRO_GAMES) {
    const stage = toStage(game.scene)
    const shapes = [stage.runner, stage.descent, stage.arena, stage.platformer].filter((x) => x !== null)
    if (shapes.length === 0) continue
    it(`${game.id}: every travelling actor has a stride length`, () => {
      for (const shape of shapes) {
        const len = (shape as { strideLen?: number }).strideLen
        expect(len, `${game.id} has a travelling actor with no stride length`).toBeDefined()
        expect(len!, `${game.id}'s stride length is not a distance`).toBeGreaterThan(1)
      }
    })
  }

  it('and no draw path divides distance by a number of its own', () => {
    // The defect twice over was `dist / 2.2` — a literal in the draw path. The rule is greppable:
    // a frame index comes from a declared stride length or from a clip's own milliseconds.
    for (const file of ['runner', 'descent', 'arena', 'platformer', 'climb', 'stage']) {
      const src = readFileSync(`${ROOT}src/runtime/${file}.ts`, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      const picked = src.match(/(?:dist|walked)\s*\/\s*[\d.]+/g)
      expect(picked, `${file}.ts divides a distance by a literal: ${picked?.join(', ')}`).toBeNull()
      if (RATE.test(src)) expect(src).toMatch(/strideLen/)
    }
  })
})
