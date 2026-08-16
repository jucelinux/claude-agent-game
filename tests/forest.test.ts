import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { FOREST, makeTree } from '../src/grammars/run12/forest.ts'
import { forestScene } from '../src/micro/forest-scene.ts'

/**
 * **The two locks his third reading asked for**, and they are the same request twice:
 * *"seria bom você ter essas referências para não cometer mais esse tipo de erro"*.
 *
 * Both defects had already been "checked" before he saw them, and both checks asked the
 * wrong question. That is the failure this file exists to stop, and it is worth naming
 * plainly because it is the one I keep making:
 *
 * - **The floating tree.** My check asked `footY >= scene.ground`. `footY` is the number I
 *   *set*; the trunk base is the number that *matters*, and it sits seven to thirteen pixels
 *   higher because roots and drooping branches paint below it. Five of fourteen trees stood
 *   off the ground and the check said zero. The lock below measures the base.
 * - **The fat trunk.** Nothing checked it at all. `tree-broad` shipped with a base 0.57 of
 *   the whole tree's height — five times a baobab, which is the stoutest tree there is.
 *
 * The rule both obey (`HARNESS.md` §5): **measure the quantity in the complaint, not the
 * quantity in the code.** A check written against the parameter you just set can only ever
 * confirm you set it.
 */

/** The stoutest real tree — a baobab, a veteran open-grown oak — is about a quarter. */
const BASE_MAX_MEASURED = 0.25

type Read = { readonly diameter: number; readonly height: number; readonly base: number; readonly foot: number }

/** Trunk diameter at the base and total painted height, both from pixels. */
function readTree(name: string): Read {
  const run = execute({ grammar: name, tunables: 'wood', seed: 1 })
  const { originX, originY } = run.params.canvas
  const f = run.frames[0]!.buf

  // The contiguous painted run through the origin column, two rows above the base. Through
  // the origin, so it measures the trunk and not a branch that happens to cross that row.
  const row = originY - 2
  let left = originX
  let right = originX
  while (left > 0 && f.data[row * f.w + left - 1] !== 0) left--
  while (right < f.w - 1 && f.data[row * f.w + right + 1] !== 0) right++

  // Painted extent over the whole cycle: a tree in wind is taller in some frames.
  let top = f.h
  let bottom = -1
  for (const frame of run.frames) {
    const { w, h, data } = frame.buf
    for (let y = 0; y < h; y++) {
      let any = false
      for (let x = 0; x < w; x++) if (data[y * w + x] !== 0) { any = true; break }
      if (any) { if (y < top) top = y; if (y > bottom) bottom = y }
    }
  }
  return { diameter: right - left + 1, height: bottom - top + 1, base: originY, foot: bottom + 1 }
}

describe('the physical limits of a tree', () => {
  it('no trunk base is stouter than the stoutest tree that exists', () => {
    for (const grammar of FOREST) {
      const { diameter, height } = readTree(grammar.name)
      const ratio = diameter / height
      expect(
        ratio,
        `${grammar.name}: trunk base ${diameter} px on a tree ${height} px tall is ${ratio.toFixed(3)} — ` +
          `past ${BASE_MAX_MEASURED}, which is a baobab. A tree is made wide by its branches.`,
      ).toBeLessThanOrEqual(BASE_MAX_MEASURED)
    }
  })

  it('asking for a trunk past the ceiling fails loudly rather than quietly', () => {
    // The null case for the guard: the same arguments that built tree-broad's first version.
    // A guard nobody has seen fail is a guard nobody knows the shape of (`HARNESS.md` §5).
    const stout = {
      name: 'over', height: 28, girth: 8, taperPow: 1.5, flare: 0.75, bulge: 0.16, wander: 0.009, lean: 0.006,
      first: 0.44, whorls: 2, perWhorl: 4, levels: 2, split: 2, divergence: 0.11, shorten: 0.74, reach: 0.85,
      droop: -0.005, crown: 8.4, leaf: 'leafB' as const, seed: 8.8,
    }
    expect(() => makeTree(stout)).toThrow(/physical ceiling/)
    // ...and the same tree on a trunk tall enough for that base is accepted, so the guard is
    // bounding the ratio rather than refusing a thick trunk.
    expect(() => makeTree({ ...stout, height: 84 })).not.toThrow()
  })
})

describe('the wood stands on the ground', () => {
  it('every tree in the scene has its trunk base at or below the ground line', () => {
    for (const p of forestScene.placements) {
      if (!p.grammar.startsWith('tree-')) continue
      const { base, foot } = readTree(p.grammar)
      expect(p.baseY, `${p.grammar} places by footY or y; a tree's origin is its ground contact, so it places by baseY`)
        .toBeTypeOf('number')
      const row = (p.baseY as number) - base + base // the origin lands exactly on baseY
      expect(
        row,
        `${p.grammar}: trunk base lands on row ${row}, above the ground line ${forestScene.ground}`,
      ).toBeGreaterThanOrEqual(forestScene.ground)
      // And what hangs below the base has to be short enough to read as root rather than as
      // a tree standing in a hole.
      const buried = foot - base
      expect(buried, `${p.grammar}: ${buried} px hang below the trunk base, which buries the flare`).toBeLessThanOrEqual(18)
    }
  })
})
