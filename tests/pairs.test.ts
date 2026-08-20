import { describe, expect, it } from 'vitest'
import { PAIRS } from '../src/grammars/index.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import type { Bone, Grammar } from '../src/core/types.ts'

/**
 * **Both sides of a body must be two limbs, not one limb drawn twice.**
 *
 * `DECISIONS.md` records this defect four times: probe D's mirrored elbows, the photographer's,
 * the astronaut's, and the kitten's far legs painting two to four pixels in every frame of
 * eight. `TASTE-LOOP.md` §3.8 — third occurrence of a class, stop patching and generalize the
 * lock — and this is the fourth.
 *
 * **It took two attempts and the first one is the more useful half.** The first measured the
 * symptom: a part that declares far more shape than it ever paints. It fired on 237 parts across
 * 69 shipped subjects, including bodies he had passed without a word, because **occlusion is
 * normal**: a neck is inside a head, a backpack seen from the front is behind a torso. No
 * pixel count separates a part that is correctly hidden from one that is accidentally hidden,
 * because the difference is intent and a picture does not carry intent.
 *
 * **The invariant belongs to the grammar.** A pair of limbs on opposite sides of a body is
 * declared, not inferred: same parent, same rest position, opposite depth. What has to be true
 * of such a pair is that at some point in the cycle the two are **doing different things**, and
 * that is a fact about the gait, checkable without rendering anything.
 *
 * **A phase offset alone does not satisfy it, and that is the whole point.** Two limbs with the
 * same key list read half a cycle apart are far apart at every instant — that is the gorilla's
 * walk and it works. Two limbs whose keys all sit inside a ten-degree band are the same limb
 * whatever their phase, because at any instant the two angles are within ten degrees. The
 * measurement is therefore taken **per frame**, never on the key lists.
 */

/** Bones that are the same joint on opposite sides: one parent, one rest spot, opposite depth. */
function mirrorPairs(grammar: Grammar): [Bone, Bone][] {
  const out: [Bone, Bone][] = []
  const bones = grammar.skeleton.bones
  for (let i = 0; i < bones.length; i++) {
    for (let j = i + 1; j < bones.length; j++) {
      const a = bones[i] as Bone
      const b = bones[j] as Bone
      if (a.parent !== b.parent) continue
      const za = a.z ?? 0
      const zb = b.z ?? 0
      // Opposite sides of the centre plane, and far enough off it that the two are a pair
      // rather than two things that happen to be near the middle.
      if (za * zb >= 0 || Math.abs(za) < 2 || Math.abs(zb) < 2) continue
      // The same joint: a shoulder and a hip on one parent are not a pair.
      if (Math.abs(a.x - b.x) > 4 || Math.abs(a.y - b.y) > 4) continue
      out.push([a, b])
    }
  }
  return out
}

/**
 * **18 degrees, and it is calibrated in both directions against real samples.**
 *
 * The kitten's first draft put both front legs inside a ten-degree band — 0.1 of a swing of 0.3
 * turns — and the far one painted two to four pixels in every frame. The fix spread them to 34
 * degrees. The gorilla's walk, which has never been questioned on this axis, separates its
 * diagonal pairs by up to 168 degrees.
 *
 * 18 sits between the defect and the fix with room on both sides. It is a floor on *the widest
 * moment of the cycle*, not on every frame: a pair that crosses is a pair doing its job, and a
 * walk has two crossings per stride.
 */
const FLOOR = 0.05

/**
 * **Clips where both limbs are meant to do the same thing, and every one of them is an action
 * rather than a cycle.**
 *
 * This list is the finding, not the escape hatch. Run over all sixty-nine subjects the check
 * fired on nine, and **all nine are symmetric by intent**: a two-footed landing, a two-footed
 * leap, a body standing still, a body lying down. It fired on no walk, no lope and no run.
 *
 * So the rule the four defects were really about is narrower than "a body has two of each
 * limb": **a locomotion cycle must alternate.** A gorilla lands on both fists, an astronaut
 * pushes off with both boots, a kitten meets a shelf with both front paws — and a limb pair
 * held together for a quarter of a second is a pose, where a limb pair held together through a
 * whole walk is a paper doll.
 *
 * Nothing in a grammar declares which it is, and no measurement can infer it — the same
 * situation as `Part.marking`, where what the locks guarantee is that a *declared* marking
 * behaves and whether it should have been declared is his eye. So the declaration is here, by
 * name, with its reason, and it is challengeable.
 */
const SYMMETRIC: Readonly<Record<string, string>> = {
  'gorilla-jump': 'a gorilla launches and lands on both fists together',
  'gorilla-jump-stardew': 'the same jump in a different ink',
  'gorilla-jump-chrono': 'the same jump in a different ink',
  'gorilla-attack': 'both arms come forward into the blow',
  'gorilla-idle': 'standing still, and both arms hang',
  'photog-prone': 'lying down, both elbows planted on the ground',
  'astro-idle-e': 'standing still in a pressure suit, arms held out either side',
  'astro-leap-e': 'a lunar leap is a two-footed push',
  'cat-tuck': 'a cat meets a shelf with both front paws and springs off both',
  'keeper-idle': 'standing at the service hatch, both boots carry the same quiet weight',
  // Run 21. A boosting machine is not walking: the thrust moves it, both legs trail together
  // and the shoulders hold the weapons level. The same intent as the lunar leap's two-footed
  // push. Only band 0 is listed — the other eleven are turned copies and are skipped above.
  'mech-boost-0': 'a boost is thrust, not a stride: both legs trail and the guns stay level',
}

describe('a body has two of each limb', () => {
  for (const pair of PAIRS) {
    if (SYMMETRIC[pair.grammar] !== undefined) continue
    const grammar = grammarByName(pair.grammar)
    /**
     * **A turned body is not a body this check can read, and run 21 is where that surfaced.**
     *
     * The detector pairs two bones by `Bone.z` having opposite signs — which says "opposite
     * sides of the body" on an AUTHORED body and says "opposite sides of the CAMERA" the moment
     * a yaw has been applied. On a mech turned thirty degrees it duly paired a shoulder block
     * against a thruster rack and reported that they moved as one limb, which they are not and
     * never were. The invariant belongs to the authoring; the facings inherit it.
     */
    if (grammar.yawTurns !== undefined) continue
    const pairs = mirrorPairs(grammar)
    if (pairs.length === 0) continue

    it(`${pair.grammar}: no mirrored pair moves as one limb`, () => {
      const params = loadParams(pair.tunables)
      const worst: string[] = []
      for (const [a, b] of pairs) {
        let widest = 0
        for (let f = 0; f < params.frames.walk; f++) {
          const pose = evaluate(grammar.gait, params, f / params.frames.walk)
          // The rest angle is part of where a limb is, so the comparison is the whole angle
          // and not just the animated delta.
          const av = a.angle + (pose.get(a.name)?.angle ?? 0)
          const bv = b.angle + (pose.get(b.name)?.angle ?? 0)
          widest = Math.max(widest, Math.abs(av - bv))
        }
        if (widest < FLOOR) {
          worst.push(`${a.name}/${b.name} never separate by more than ${(widest * 360).toFixed(1)}°`)
        }
      }
      expect(worst, `${pair.grammar} draws one limb twice`).toEqual([])
    })
  }

  /**
   * **The null case, and it is the rule an instrument passes before it is believed**
   * (`HARNESS.md` §5). A check that cannot be made to fire on demand is not a check — and the
   * first attempt at this one shipped nothing precisely because it could not be made to stay
   * quiet.
   */
  it('fires on a pair authored as one limb, and stays quiet when they are spread', () => {
    const base = grammarByName('cat-rise')
    const params = loadParams('cat')
    const near = base.gait.tracks.find((t) => t.bone === 'armN' && t.channel === 'angle')!
    const widest = (farKeys: readonly number[]): number => {
      const gait = {
        ...base.gait,
        tracks: base.gait.tracks.map((t) =>
          t.bone === 'armF' && t.channel === 'angle' ? { ...t, keys: farKeys } : t,
        ),
      }
      let w = 0
      for (let f = 0; f < params.frames.walk; f++) {
        const pose = evaluate(gait, params, f / params.frames.walk)
        w = Math.max(w, Math.abs((pose.get('armN')?.angle ?? 0) - (pose.get('armF')?.angle ?? 0)))
      }
      return w
    }
    // The defect as it actually shipped: the same key list, one phase later.
    const asOnePose = [...near.keys.slice(1), near.keys[0] as number]
    expect(widest(asOnePose)).toBeLessThan(FLOOR)
    // And the fix that is in the file.
    expect(widest([-0.24, -0.34, -0.4, -0.3])).toBeGreaterThan(FLOOR)
  })
})
