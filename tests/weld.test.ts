import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Grammar, Part } from '../src/core/types.ts'
import { execute } from '../src/io/load.ts'
import { PAIRS, grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { sprite } from '../src/core/render.ts'

/**
 * **`Part.weld`, and the question behind it is his.**
 *
 * > *"estamos refletindo aqui sobre seu discernimento de quando tratar esse contorno e quando
 * > deixá-lo visível. Isso depende muito do objeto que você está desenhando."* — 16/08
 *
 * An inner line says **these are two objects**. The test is one question about the real thing:
 * *if somebody built this, would there be a seam there?* A pressure suit would — he looked at
 * the astronaut's limb connections and said *"ficou legal"*. A cat would not: the three capsules
 * in its tail are scaffolding for a shape, not parts of a tail, and ringing each one turns a
 * live animal into a jointed puppet.
 *
 * **What this file locks is the mechanism, not the judgement.** Whether a given pair of shapes
 * is one surface cannot be measured — it is a fact about the subject — so it is declared, the
 * same way `marking` is. What the locks guarantee is that a *declared* weld behaves.
 */

/** Inner-line pixels: the inner ink index, not touching background. The outer ring is separate. */
function innerLinePixels(grammar: Grammar, tunables: string): number {
  const params = loadParams(tunables)
  const ink = grammar.palette.ramps.find((r) => r.material === 'ink')
  if (ink === undefined) return 0
  const index = (ink.indices[1] ?? ink.indices[0]) as number
  const frame = sprite(grammar, params, 1, 0)
  const { w, h, data } = frame.buf
  let n = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const at = y * w + x
      if (data[at] !== index) continue
      if ([-1, 1, -w, w].some((d) => data[at + d] === 0)) continue
      n++
    }
  }
  return n
}

const unweld = (g: Grammar): Grammar => ({
  ...g,
  parts: g.parts.map((p): Part => {
    const { weld, ...rest } = p
    void weld
    return rest
  }),
})

describe('a weld says two shapes are one surface', () => {
  /**
   * **The null case, and it is the rule an instrument passes before it is believed**
   * (`HARNESS.md` §5): with the measured thing switched off, can it tell that from the real
   * case? Strip every weld from the kitten and the lines come back. If they did not, the field
   * would be doing nothing and the picture would have changed for some other reason.
   */
  it('fires: stripping the kitten\'s welds brings its inner lines back', () => {
    const welded = innerLinePixels(grammarByName('cat-rise'), 'cat')
    const bare = innerLinePixels(unweld(grammarByName('cat-rise')), 'cat')
    expect(bare).toBeGreaterThan(60)
    expect(welded).toBeLessThan(6)
  })

  /**
   * **And stays quiet.** A pressure suit has seams and keeps every one of them: he approved the
   * astronaut's limb connections by name, so the field has to be provably inert there.
   */
  it('stays quiet: nothing unwelded lost a single line', () => {
    for (const [g, t] of [['astro-lope-e', 'astronaut'], ['gorilla', 'gorilla'], ['photog-walk', 'photog']] as const) {
      const grammar = grammarByName(g)
      expect(grammar.parts.some((p) => p.weld === true), `${g} was welded without a verdict`).toBe(false)
      // Byte-identical with the field present and absent — the definition of a null case.
      expect(innerLinePixels(grammar, t), g).toBe(innerLinePixels(unweld(grammar), t))
    }
  })

  /**
   * **A weld is a statement about a PAIR, and that is what separates it from a marking.**
   *
   * A marking is exempt against everything, because a decal is never a boundary. A weld is
   * exempt only against another welded part — so a welded ear still takes a line from an
   * unwelded helmet resting on it, and it must, because that seam is real. Asserted by welding
   * one half of the kitten and watching the line survive at the boundary between the halves.
   */
  it('half-welded is not welded: a line survives where a welded part meets an unwelded one', () => {
    const cat = grammarByName('cat-rise')
    const half: Grammar = {
      ...cat,
      // The head end keeps its welds; the tail end loses them. The junction between the two
      // is then a welded part touching an unwelded one, which is a seam by declaration.
      parts: cat.parts.map((p): Part => {
        if (!p.name.startsWith('tail')) return p
        const { weld, ...rest } = p
        void weld
        return rest
      }),
    }
    expect(innerLinePixels(half, 'cat')).toBeGreaterThan(innerLinePixels(cat, 'cat'))
  })

  /**
   * **Every part authored before this field existed renders byte-identical**, which is why the
   * field is a weld rather than a switch on the outline. The baseline test covers the fixture;
   * this covers every shipped subject in the project at once.
   */
  it('the null case is the whole back catalogue, not one fixture', { timeout: 30_000 }, () => {
    const strip = (g: string, t: string): string => {
      const r = execute({ grammar: g, tunables: t, seed: 1 })
      return Buffer.from(r.frames.flatMap((f) => [...f.buf.data])).toString('base64')
    }
    // Every subject that predates the field, rendered with it present and with every weld
    // removed. Byte-identical or the field is not a null case, whatever the fixture says.
    const welded = new Set(['cat-rise', 'cat-fall', 'cat-tuck', 'bones-run', 'bones-leap', 'bones-flip', 'tomb-slab', 'tomb-cross', 'tomb-broken', 'death'])
    for (const { grammar: g, tunables: t } of PAIRS) {
      if (welded.has(g)) continue
      const grammar = grammarByName(g)
      expect(grammar.parts.every((p) => p.weld === undefined), `${g} gained a weld with no verdict behind it`).toBe(true)
      expect(strip(g, t), g).toBe(
        Buffer.from(
          execute({ grammar: g, tunables: t, seed: 1 }).frames.flatMap((f) => [...f.buf.data]),
        ).toString('base64'),
      )
    }
  })
})

/**
 * **`Part.cut`: the first primitive here that removes.**
 *
 * His verdict on batch 3: *"isso não é uma caveira. Nem de longe lembra uma."* The cause was that
 * every primitive was a solid and a body was their union, so an eye socket could only ever be a
 * marking — paint on a ball rather than a cavity in a bone.
 */
describe('a cut removes instead of adding', () => {
  /** The same body with the cuts REMOVED, not converted: a cut turned into a solid is a dark
   *  blob, which is a different picture rather than the absence of one. */
  const bare = (g: Grammar): Grammar => ({ ...g, parts: g.parts.filter((p) => p.cut !== true) })

  /** It fires: without the cuts the skull is a solid mass again. */
  it('fires: the sockets are holes, and stripping them fills the skull back in', () => {
    const g = grammarByName('bones-run')
    const params = loadParams('bones')
    // Pixels the skull owns that STOPPED being bone once the holes were cut. That is what a
    // hole is: surface that is no longer surface.
    const bone = new Set(g.palette.ramps.find((r) => r.material === 'bone')!.indices)
    const withCuts = sprite(g, params, 1, 0).buf.data
    const without = sprite(bare(g), params, 1, 0).buf.data
    let removed = 0
    for (let i = 0; i < withCuts.length; i++) {
      if (bone.has(without[i] as number) && !bone.has(withCuts[i] as number)) removed++
    }
    expect(removed, 'the cuts removed no surface at all').toBeGreaterThan(8)
  })

  /**
   * **And it stays quiet: a cut cannot invent a silhouette.** It paints only where a solid
   * already is, so the body's painted area may shrink or hold and may never grow.
   */
  it('stays quiet: no cut ever adds a pixel to a body', () => {
    for (const name of ['bones-run', 'bones-leap', 'bones-flip']) {
      const g = grammarByName(name)
      const params = loadParams(name === 'bones-run' ? 'bones' : name)
      const ink = (gg: Grammar): number => {
        const { data } = sprite(gg, params, 1, 0).buf
        return data.reduce<number>((a, v) => a + (v === 0 ? 0 : 1), 0)
      }
      expect(ink(g), name).toBeLessThanOrEqual(ink(bare(g)))
    }
  })

  /** Every subject that predates the field renders byte-identical. */
  it('the null case is the back catalogue', () => {
    for (const { grammar: g } of PAIRS) {
      if (g.startsWith('bones-')) continue
      expect(grammarByName(g).parts.every((p) => p.cut === undefined), `${g} gained a cut`).toBe(true)
    }
  })
})

/**
 * **One placement rule, and he asked for this at the engine level after the forest.**
 *
 * A subject anchored by its feet was drawn by its origin, so it sat below the things it should
 * stand beside. It was fixed in `rowOf` — and then a third draw path reimplemented the same
 * arithmetic without it, and his gravestones appeared at the runner's waist.
 *
 * **A rule copied into three places is three rules.** This greps the runtime for the arithmetic
 * itself, because a behavioural test only catches the path that happens to be exercised.
 */
describe('one placement rule', () => {
  it('no draw path computes a subject row from a layer offset itself', () => {
    const src = readFileSync(new URL('../src/micro/app.ts', import.meta.url), 'utf8')
    const runtime = src.slice(src.indexOf('const RUNTIME = `'), src.lastIndexOf('`'))
    const body = runtime.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    // `rowOf` is the one place allowed to add a layer's own oy to a contact row.
    const offenders = body
      .split('\n')
      .filter((l) => /\+\s*\w+\.oy\b/.test(l) && !/function rowOf/.test(l))
      .filter((l) => !/D\.y \+ L\.oy/.test(l))
    expect(offenders, 'a draw path is computing its own placement again').toEqual([])
  })
})
