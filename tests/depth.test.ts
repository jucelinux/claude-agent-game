import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ROOT, loadParams } from '../src/io/load.ts'
import { sprite, strip } from '../src/core/render.ts'
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
