import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ROOT, loadParams } from '../src/io/load.ts'
import { sprite, strip } from '../src/core/render.ts'
import { OWNER_OUTLINE } from '../src/core/raster.ts'
import type { Grammar, Params } from '../src/core/types.ts'

/**
 * **The depth solver's lock set.**
 *
 * The rule it replaces was "the part declared last is in front", which is a constant
 * standing in for something that varies with `t`. Everything below is calibrated in both
 * directions, because a depth test that always picks the same winner passes a
 * one-directional assertion perfectly (`TASTE-LOOP.md` §2.2).
 *
 * The subject is synthetic on purpose: two discs that overlap. The fixture grammar is the
 * baseline's subject and must not be perturbed to make a lock convenient.
 */
const SEAM = 6

function twoDiscs(za: number, zb: number, zTrack?: readonly number[]): Grammar {
  return {
    name: 'depth-fixture',
    palette: {
      name: 'depth-neutral',
      colors: [
        [0, 0, 0],
        [20, 20, 20],
        [70, 70, 70],
        [130, 130, 130],
        [200, 200, 200],
        [8, 8, 8],
        [250, 0, 0], // the seam index, deliberately unlike every shading tone
      ],
      ramps: [
        { material: 'mass', indices: [1, 2, 3, 4] },
        { material: 'ink', indices: [5, SEAM] },
      ],
    },
    skeleton: {
      bones: [
        { name: 'a', parent: null, x: 0, y: 0, z: za, angle: 0 },
        { name: 'b', parent: null, x: 0, y: 0, z: zb, angle: 0 },
      ],
    },
    // A is declared FIRST, so under the old rule B won every overlapping pixel, always.
    parts: [
      { name: 'A', bone: 'a', material: 'mass', shape: { kind: 'ellipse', cx: -2, cy: 0, rx: 6, ry: 6 } },
      { name: 'B', bone: 'b', material: 'mass', shape: { kind: 'ellipse', cx: 2, cy: 0, rx: 6, ry: 6 } },
    ],
    gait: {
      name: 'still',
      phases: [
        { name: 'near', at: 0 },
        { name: 'far', at: 0.5 },
      ],
      tracks: zTrack === undefined ? [] : [{ bone: 'a', channel: 'z', keys: zTrack }],
    },
  }
}

function bench(patch: Partial<Params> = {}): Params {
  const base = loadParams('default')
  return {
    ...base,
    canvas: { w: 32, h: 32, originX: 16, originY: 16 },
    outline: { enabled: false, material: 'ink', inner: false, rim: false },
    texture: { speckle: 0 },
    frames: { walk: 4 },
    gait: { ...base.gait, depth: 10 },
    ...patch,
  }
}

/** The pixel at the origin: inside both discs, so it is the one the two of them argue over. */
const CENTRE = 16 * 32 + 16
const A = 0
const B = 1

describe('depth', () => {
  it('the nearer surface wins, and it wins in both directions', () => {
    // A is declared first. Under paint order it could never win; under depth it wins when
    // it is nearer, and loses when it is not. One assertion without the other proves
    // nothing — a solver stuck on "first" and a solver stuck on "last" each pass one.
    expect(sprite(twoDiscs(-5, 5), bench(), 1, 0).owners[CENTRE]).toBe(A)
    expect(sprite(twoDiscs(5, -5), bench(), 1, 0).owners[CENTRE]).toBe(B)
  })

  it('null case: with every bone on one plane, depth degenerates into paint order', () => {
    // The measured thing switched off (`HARNESS.md` §5). This is the *old* renderer's rule,
    // and the solver has to reproduce it exactly when there is no depth to solve — which is
    // also what keeps every grammar authored before the solver rendering as itself.
    const flat = sprite(twoDiscs(0, 0), bench(), 1, 0)
    expect(flat.owners[CENTRE]).toBe(B)

    // And it is not vacuous: the same scene with depth separated does not agree with it.
    const solved = sprite(twoDiscs(-5, 5), bench(), 1, 0)
    expect(solved.owners[CENTRE]).not.toBe(flat.owners[CENTRE])
  })

  it('depth resolves order without moving a single pixel on screen', () => {
    // The 2.5D contract, and the reason this change is safe to make mid-week: there is no
    // projection divide, so shifting the entire body in depth is a no-op. If this ever
    // fails, depth has started deciding *where* things are and not merely *which* is in
    // front, and every composition in the repo is silently invalid.
    const here = sprite(twoDiscs(-5, 5), bench(), 1, 0)
    const farAway = sprite(twoDiscs(95, 105), bench(), 1, 0)
    expect([...farAway.buf.data]).toEqual([...here.buf.data])

    // Relative depth, by contrast, must change the picture — otherwise the above passes
    // because the solver does nothing at all.
    const flipped = sprite(twoDiscs(5, -5), bench(), 1, 0)
    expect([...flipped.buf.data]).not.toEqual([...here.buf.data])
  })

  it('a limb can travel through depth inside one cycle — the punch case', () => {
    // What no paint order expresses: the same part behind a mass at one phase and in front
    // of it at another. A fist is behind the shoulder at the wind-up and past the chest at
    // the strike, and that is one part, one cycle.
    const swinging = twoDiscs(0, 0, [1, -1])
    const owners = strip(swinging, bench(), 1).map((f) => f.owners[CENTRE])
    expect(new Set(owners).size).toBe(2)
    expect(owners).toContain(A)
    expect(owners).toContain(B)
  })

  it('the seam darkens the far part, whatever the declaration order says', () => {
    // The inner outline always claimed to darken the pixel *behind*; it used to ask paint
    // order, which is why it could be wrong. A is declared first and placed nearer, so
    // every seam pixel has to land on B.
    const params = bench({ outline: { enabled: false, material: 'ink', inner: true, rim: false } })
    const frame = sprite(twoDiscs(-5, 5), params, 1, 0)

    const seamOwners = new Set<number>()
    for (let at = 0; at < frame.buf.data.length; at++) {
      if (frame.buf.data[at] === SEAM) seamOwners.add(frame.owners[at] as number)
    }
    expect(seamOwners.size).toBeGreaterThan(0)
    expect([...seamOwners]).toEqual([B])

    // Both ways: put A behind and the seam moves onto A, with no change to the parts list.
    const flipped = sprite(twoDiscs(5, -5), params, 1, 0)
    const flippedOwners = new Set<number>()
    for (let at = 0; at < flipped.buf.data.length; at++) {
      if (flipped.buf.data[at] === SEAM) flippedOwners.add(flipped.owners[at] as number)
    }
    expect([...flippedOwners]).toEqual([A])
  })

  it('null case for the seam: with no depth between them, no part is behind another', () => {
    // The seam is depth-driven now, so a flat scene must produce none of it. This is what
    // separates "the rule reads depth" from "the rule fires wherever two parts touch and
    // happens to have depth nearby".
    const params = bench({ outline: { enabled: false, material: 'ink', inner: true, rim: false } })
    const flat = sprite(twoDiscs(0, 0), params, 1, 0)
    expect([...flat.buf.data].some((v) => v === SEAM)).toBe(false)
  })

  it('a tunables file missing a leaf throws at load instead of painting nothing', () => {
    // Calibrated against the real failure, in both halves. **First the damage:** the
    // tunables are JSON behind a cast, so a leaf the core reads and a file does not carry
    // arrives as `undefined`, turns the shading arithmetic to `NaN`, and paints a blank
    // canvas — a green suite over an empty sprite, which is the defect `HARNESS.md` §3
    // says has actually shipped in this method before.
    const params = bench()
    const holed = { ...params, light: { ...params.light, z: NaN } } as Params
    const blank = sprite(twoDiscs(-5, 5), holed, 1, 0)
    expect([...blank.buf.data].every((v) => v === 0)).toBe(true)

    // **Then the guard**, which is what makes the damage unreachable: no file gets to be
    // in that state, because loading one refuses. Underscored so the anchor lock, which
    // reads every real tunables file, correctly ignores this one.
    const path = `${ROOT}tunables/_missing-leaf.json`
    const good = JSON.parse(readFileSync(`${ROOT}tunables/default.json`, 'utf8')) as Record<string, Record<string, unknown>>
    delete good['light']!['z']
    writeFileSync(path, JSON.stringify(good))
    try {
      expect(() => loadParams('_missing-leaf')).toThrow(/light\.z/)
    } finally {
      rmSync(path)
    }
    // And the guard is not a blanket refusal: the shipped files all load.
    expect(() => loadParams('default')).not.toThrow()
  })
})

describe('scale', () => {
  it('a part collapsed to nothing paints nothing, not one pixel', () => {
    // Calibrated both ways. The defect: at scale 0 the inverse scale is forced to 0, so
    // every candidate pixel maps to the shape's centre and the centre is always inside —
    // the part vanished everywhere except for a single stray pixel. It shipped with the
    // scale channel in run 6 and hid among thirty-six parts; it surfaced when a falling
    // leaf would not reach zero on its way off screen.
    const collapse: number[] = [-1, -1]
    const gone = twoDiscs(-5, 5, undefined)
    const withScale: Grammar = {
      ...gone,
      gait: { ...gone.gait, tracks: [{ bone: 'a', channel: 'scale', keys: collapse }] },
    }
    const frame = sprite(withScale, bench(), 1, 0)
    let ownedByA = 0
    for (const owner of frame.owners) if (owner === A) ownedByA++
    expect(ownedByA).toBe(0)

    // And it is not vacuous: at full scale the same part owns a real area.
    const whole = sprite(twoDiscs(-5, 5), bench(), 1, 0)
    let wholeA = 0
    for (const owner of whole.owners) if (owner === A) wholeA++
    expect(wholeA).toBeGreaterThan(50)
  })
})

describe('the lobed primitive', () => {
  const disc = (kind: 'ellipse' | 'lobed', depth: number): Grammar => ({
    ...twoDiscs(0, 0),
    parts: [
      {
        name: 'A',
        bone: 'a',
        material: 'mass',
        shape:
          kind === 'ellipse'
            ? { kind: 'ellipse', cx: 0, cy: 0, rx: 9, ry: 9 }
            : { kind: 'lobed', cx: 0, cy: 0, rx: 9, ry: 9, lobes: 6, depth, phase: 0 },
      },
    ],
  })

  it('null case: at depth 0 it is pixel-identical to the ellipse it generalises', () => {
    // The measured thing switched off (`HARNESS.md` §5). A new shape that quietly shades or
    // bounds itself differently from the primitive it extends would make every comparison
    // between an old sample and a new one meaningless, and the difference would be read as
    // art. Byte equality is the right rule here precisely because it is *not* a margin: at
    // depth 0 the formula reduces to the ellipse exactly, so anything but identity is a bug.
    const round = sprite(disc('ellipse', 0), bench(), 1, 0)
    const flat = sprite(disc('lobed', 0), bench(), 1, 0)
    expect([...flat.buf.data]).toEqual([...round.buf.data])
  })

  it('and it is not vacuous: depth actually ripples the boundary', () => {
    const round = sprite(disc('ellipse', 0), bench(), 1, 0)
    const bumpy = sprite(disc('lobed', 0.3), bench(), 1, 0)
    expect([...bumpy.buf.data]).not.toEqual([...round.buf.data])

    // Six lobes at depth 0.3 on a radius of 9 swing the boundary by ±2.7 px, so the ragged
    // shape must differ from the smooth one by a real area rather than by a few stray pixels.
    let differing = 0
    for (let at = 0; at < round.buf.data.length; at++) {
      if (round.buf.data[at] !== bumpy.buf.data[at]) differing++
    }
    expect(differing).toBeGreaterThan(40)
  })
})

/**
 * **The shadow pass.** The second use of the depth buffer, and the first one that changes
 * the picture — run 7 built the buffer, used it to decide paint order, and threw it away,
 * which is why that round bought correctness and no visible change.
 */
describe('shadow', () => {
  /** A caster in front, a receiver behind, and nothing else in the scene. */
  const scene = (): Grammar => {
    const g = twoDiscs(-9, 0)
    return {
      ...g,
      parts: [
        { name: 'A', bone: 'a', material: 'mass', shape: { kind: 'ellipse', cx: 0, cy: -7, rx: 4, ry: 4 } },
        { name: 'B', bone: 'b', material: 'mass', shape: { kind: 'ellipse', cx: 0, cy: 2, rx: 10, ry: 10 } },
      ],
    }
  }
  const lit = (patch: Partial<Params> = {}): Params =>
    bench({ shadow: { steps: 12, bias: 0.4, strength: 1 }, light: { x: 0, y: -1, z: -0.35, curve: 1 }, ...patch })

  it('null case: strength 0 and steps 0 each leave the frame byte-identical', () => {
    // The measured thing switched off (`HARNESS.md` §5). Two separate disables, because a
    // pass guarded on one of them and not the other would still run half the time.
    const none = sprite(scene(), lit({ shadow: { steps: 0, bias: 0.4, strength: 0 } }), 1, 0)
    const noStrength = sprite(scene(), lit({ shadow: { steps: 12, bias: 0.4, strength: 0 } }), 1, 0)
    const noSteps = sprite(scene(), lit({ shadow: { steps: 0, bias: 0.4, strength: 1 } }), 1, 0)
    expect([...noStrength.buf.data]).toEqual([...none.buf.data])
    expect([...noSteps.buf.data]).toEqual([...none.buf.data])

    // And it is not vacuous: with the pass on, the same scene is not the same picture.
    const shadowed = sprite(scene(), lit(), 1, 0)
    expect([...shadowed.buf.data]).not.toEqual([...none.buf.data])
  })

  it('the shadow lands on the far side of the caster, and vanishes when the lamp crosses over', () => {
    // Calibrated in both directions, and the second direction is stronger than the first
    // draft of this test expected. The caster sits ABOVE the receiver, so a lamp above
    // throws its shadow down onto the receiver, and a lamp below throws it up into empty
    // space. The correct assertion is therefore not "the band moves" but "the band exists
    // and then does not" — the first version asserted movement, and failed because the
    // engine was right and the test was wrong about the geometry.
    const rowsDarkened = (p: Params): number[] => {
      const off = sprite(scene(), { ...p, shadow: { ...p.shadow, strength: 0 } }, 1, 0)
      const on = sprite(scene(), p, 1, 0)
      const rows = new Set<number>()
      for (let at = 0; at < on.buf.data.length; at++) {
        if (on.buf.data[at] !== off.buf.data[at]) rows.add(Math.floor(at / on.buf.w))
      }
      return [...rows].sort((a, b) => a - b)
    }
    const fromAbove = rowsDarkened(lit())
    const fromBelow = rowsDarkened(lit({ light: { x: 0, y: 1, z: -0.35, curve: 1 } }))
    expect(fromAbove.length).toBeGreaterThan(0)
    expect(fromBelow).toEqual([])
    expect(Math.min(...fromAbove)).toBeGreaterThan(9)
    // And every darkened row sits below the caster's own centre row, which is where a
    // shadow thrown from above has to land. The caster's centre is at y = 16 - 7 = 9. The
    // first draft asserted y > 16 and failed at 11, which was the test guessing the
    // geometry instead of deriving it: the receiver is visible right beside the caster, so
    // the band starts as soon as there is receiver to the side of it.
  })

  it('a convex part never shadows itself, at any radius and any bias', () => {
    // **The null case the bias could not deliver.** Acne scales with curvature, so a lone
    // sphere self-shadowed 198 px at radius 18 and went on self-shadowing at eight times
    // the tolerance. Identity settles exactly what the tolerance was approximating: every
    // primitive here is convex in depth, and a convex solid cannot cast onto itself under a
    // directional light. The loop is over radius AND bias because the defect was a function
    // of both, and the fix has to be a function of neither.
    for (const rx of [6, 11, 18, 22]) {
      for (const bias of [0.05, 0.25, 1.2]) {
        const lone: Grammar = {
          ...twoDiscs(0, 0),
          parts: [{ name: 'A', bone: 'a', material: 'mass', shape: { kind: 'ellipse', cx: 0, cy: 0, rx, ry: rx } }],
        }
        const params = lit({ shadow: { steps: 8, bias, strength: 1 } })
        const on = sprite(lone, params, 1, 0)
        const off = sprite(lone, { ...params, shadow: { ...params.shadow, strength: 0 } }, 1, 0)
        expect([...on.buf.data], `radius ${rx}, bias ${bias}`).toEqual([...off.buf.data])
      }
    }
  })

  it('a lamp aimed straight at the viewer casts nothing', () => {
    // There is no screen direction to march in. The guard exists so the pass does not
    // divide by zero and silently paint the body its darkest tone.
    const none = sprite(scene(), lit({ shadow: { steps: 12, bias: 0.4, strength: 0 } }), 1, 0)
    const head = sprite(scene(), lit({ light: { x: 0, y: 0, z: -1, curve: 1 } }), 1, 0)
    expect([...head.buf.data]).toEqual([...sprite(scene(), lit({ light: { x: 0, y: 0, z: -1, curve: 1 }, shadow: { steps: 0, bias: 0.4, strength: 0 } }), 1, 0).buf.data])
    expect(none.buf.data.length).toBeGreaterThan(0)
  })

  it('a pixel already at the darkest tone does not wrap around to the lightest', () => {
    // The clamp is the whole guard. Strength far past the ramp length must bottom out, and
    // an off-by-one here would turn every shadow into a highlight.
    const hard = sprite(scene(), lit({ shadow: { steps: 12, bias: 0.4, strength: 99 } }), 1, 0)
    const ramp = scene().palette.ramps[0]!.indices
    const darkest = ramp[0] as number
    for (let at = 0; at < hard.buf.data.length; at++) {
      if (hard.buf.data[at] === 0) continue
      expect(ramp).toContain(hard.buf.data[at] as number)
    }
    expect([...hard.buf.data].some((v) => v === darkest)).toBe(true)
  })

  it('the shadow never repaints the outline ring', () => {
    // It runs before the edge treatments on purpose: the ring owns the silhouette, and a
    // shadow crossing it would put a hole in the one thing that holds the shape together.
    const params = lit({ outline: { enabled: true, material: 'ink', inner: false, rim: false } })
    const on = sprite(scene(), params, 1, 0)
    const off = sprite(scene(), { ...params, shadow: { ...params.shadow, strength: 0 } }, 1, 0)
    for (let at = 0; at < on.buf.data.length; at++) {
      if (off.owners[at] === OWNER_OUTLINE) expect(on.buf.data[at]).toBe(off.buf.data[at])
    }
  })
})

/**
 * **The fill light.** A second, weaker lamp opposite the key, so the shadow half of a body
 * keeps a step of form instead of landing on the floor of its ramp and staying there.
 */
describe('fill light', () => {
  const disc = (): Grammar => {
    const g = twoDiscs(0, 0)
    return { ...g, parts: [{ name: 'A', bone: 'a', material: 'mass', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 11, ry: 11 } }] }
  }
  const withFill = (weight: number, x = 0.5): Params =>
    bench({ light: { x: -0.6, y: -0.8, z: -0.35, curve: 1 }, fill: { x, y: 0.7, z: -0.2, weight } })

  it('null case: at weight 0 the fill direction cannot change anything', () => {
    // The cleanest available form of "the measured thing switched off": with the weight at
    // zero, two opposite fill directions must produce the same bytes. If they do not, the
    // weight is not gating the term and every sample authored before the fill existed is
    // silently rendering differently.
    const left = sprite(disc(), withFill(0, -0.9), 1, 0)
    const right = sprite(disc(), withFill(0, 0.9), 1, 0)
    expect([...left.buf.data]).toEqual([...right.buf.data])

    // Not vacuous: with weight on, the same two directions disagree.
    const litLeft = sprite(disc(), withFill(0.3, -0.9), 1, 0)
    const litRight = sprite(disc(), withFill(0.3, 0.9), 1, 0)
    expect([...litLeft.buf.data]).not.toEqual([...litRight.buf.data])
  })

  it('the fill lifts the shadow end of the ramp, and lifts it further as it strengthens', () => {
    // The whole purpose in one assertion, calibrated by degree rather than by presence.
    const darkestLevel = (p: Params): number => {
      const frame = sprite(disc(), p, 1, 0)
      const ramp = disc().palette.ramps[0]!.indices
      let lowest = ramp.length
      for (const v of frame.buf.data) {
        if (v === 0) continue
        const level = ramp.indexOf(v as number)
        if (level >= 0 && level < lowest) lowest = level
      }
      return lowest
    }
    const none = darkestLevel(withFill(0))
    const some = darkestLevel(withFill(0.35))
    expect(none).toBe(0)
    expect(some).toBeGreaterThan(none)
  })

  it('the fill costs value range, which is the trade it has to be worth', () => {
    // Declared in the type and asserted here, so nobody has to take the comment's word for
    // it: a fill compresses the ramp. His ink verdict says range is half of what makes a
    // sprite read, so the knob spends the exact thing that verdict selected.
    const spread = (p: Params): number => {
      const frame = sprite(disc(), p, 1, 0)
      const used = new Set<number>()
      for (const v of frame.buf.data) if (v !== 0) used.add(v as number)
      return used.size
    }
    expect(spread(withFill(0.6))).toBeLessThan(spread(withFill(0)))
  })
})
