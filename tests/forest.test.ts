import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { FOREST, makeTree } from '../src/grammars/vegetation/forest.ts'
import { forestScene } from '../src/micro/forest-scene.ts'
import { standRow } from '../src/scene/types.ts'
import { toStage } from '../src/scene/layers.ts'

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

/**
 * How far below its contact row a subject may paint. Measured, not chosen: the trunk's base
 * capsule used to reach 12 px below the origin and the depth planes were 11 px apart, so a
 * tree's ground footprint swallowed the whole distance between two depths.
 */
const OVERHANG_MAX = 5

type Read = { readonly diameter: number; readonly height: number; readonly base: number; readonly foot: number }

/**
 * Trunk diameter and total painted height, both from pixels.
 *
 * **The diameter is read at a tenth of the tree's height, not at the very bottom**, and that
 * is the forester's convention rather than a convenience: at ground level you are measuring
 * the *root flare*, which is one and a half to two times the trunk and varies with species
 * far more than the trunk does. Diameter at breast height is the number every published
 * trunk-to-height ratio is quoted against, so it has to be the number this lock reads.
 */
function readTree(name: string): Read {
  const run = execute({ grammar: name, tunables: 'wood', seed: 1 })
  const { originX, originY } = run.params.canvas
  const f = run.frames[0]!.buf

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
  const height = bottom - top + 1

  // The contiguous painted run through the origin column, clear of the root flare. Through
  // the origin, so it measures the trunk and not a branch that happens to cross that row.
  const row = originY - Math.max(3, Math.round(height * 0.1))
  let left = originX
  let right = originX
  while (left > 0 && f.data[row * f.w + left - 1] !== 0) left--
  while (right < f.w - 1 && f.data[row * f.w + right + 1] !== 0) right++

  return { diameter: right - left + 1, height, base: originY, foot: bottom + 1 }
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
  it('every tree places by its origin, and its origin is on the floor', () => {
    for (const p of forestScene.placements) {
      if (!p.grammar.startsWith('tree-')) continue
      expect(p.depth, `${p.grammar} has no depth, so its row and its haze are two facts that can disagree`)
        .toBeTypeOf('number')
      expect(p.anchor, `${p.grammar} anchors by foot; a tree's origin IS its ground contact`).toBeUndefined()
      const row = standRow(forestScene, p.depth as number)
      expect(row, `${p.grammar} stands on row ${row}, above the horizon ${forestScene.ground}`)
        .toBeGreaterThanOrEqual(forestScene.ground)
    }
  })

  it('nothing paints more than a few pixels below the row it stands on', () => {
    // **This is the number that made his last finding possible.** A subject that paints far
    // below its contact row has an ambiguous ground footprint, and two subjects whose
    // footprints overlap cannot be ordered by the eye however carefully they are ordered by
    // the code. It was 12 px against depth planes 11 px apart, and it is now 5 px against
    // planes 15 px apart.
    for (const grammar of FOREST) {
      const { base, foot } = readTree(grammar.name)
      const over = foot - base
      expect(over, `${grammar.name}: ${over} px of paint below its contact row`).toBeLessThanOrEqual(OVERHANG_MAX)
    }
  })

  it('the depth planes are further apart than anything standing on them overhangs', () => {
    const depths = [...new Set(forestScene.placements.filter((p) => p.depth !== undefined).map((p) => p.depth as number))]
    const rows = depths.map((d) => standRow(forestScene, d)).sort((a, b) => a - b)
    for (let i = 1; i < rows.length; i++) {
      const gap = (rows[i] as number) - (rows[i - 1] as number)
      expect(gap, `two depth planes are ${gap} px apart, inside the ${OVERHANG_MAX} px a subject can overhang`)
        .toBeGreaterThan(OVERHANG_MAX)
    }
  })
})

describe('the picture cannot contradict itself about distance', () => {
  it('anything drawn behind another thing has its base above it', () => {
    // **His fourth finding, as an invariant.** He could not name what was wrong and this is
    // it: a subject drawn behind another whose base sits LOWER on screen says "further away"
    // with its haze and "nearer" with its position. The scene must never be able to say both.
    const stage = toStage(forestScene)
    const floor = stage.placed
      .map((p, i) => ({ i, p, layer: stage.layers[p.layer] as (typeof stage.layers)[number] }))
      .filter(({ p }) => stage.placed.indexOf(p) >= 0)

    // **Only across different depths.** Two subjects on the same plane are the same distance
    // away, so which of them overlaps the other is arbitrary and their base rows carry no
    // claim about distance at all. The first version of this lock compared every consecutive
    // pair and failed on two trees in the same band — which is the lock being wrong, not the
    // scene. A depth invariant has to be stated between depths.
    const read = floor
      .map(({ p, layer }) => {
        const source = forestScene.placements.find((q, j) => `${q.grammar}#${j}` === layer.id.replace(':left', ''))
        return { name: layer.id, depth: source?.depth ?? 0, sky: source?.sky === true, bottom: p.y + layer.oy + layer.h - 1 }
      })
      .filter((r) => !r.sky)

    for (let a = 0; a < read.length; a++) {
      for (let b = a + 1; b < read.length; b++) {
        const back = read[a] as (typeof read)[number]
        const front = read[b] as (typeof read)[number]
        if (back.depth <= front.depth) continue
        expect(
          front.bottom,
          `${back.name} is further away than ${front.name} and is drawn behind it, but its base is ` +
            `${back.bottom - front.bottom} px LOWER — the picture says further with its haze and nearer with its position`,
        ).toBeGreaterThan(back.bottom)
      }
    }
  })
})
