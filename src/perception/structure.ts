/**
 * **The findings channel.** The agent's second eye, and it does not draw a picture.
 *
 * `lum.ts` shows what a frame looks like. This file answers questions about it. The
 * distinction is the whole point and it came out of measuring how defects were actually
 * found in this project: of seven real defects in one session, **six were found by counting
 * and one by looking**, and the ones found by counting each needed a bespoke script written
 * on the spot. Every check below is one of those scripts, kept.
 *
 * The rule this obeys (`CLAUDE.md` §5): **enrich the channel toward answering questions
 * about parts, never toward showing a better image.** A richer picture would let the model
 * fix pixels; a richer question layer cannot, because it reports on parts and materials and
 * has no pixel to offer. Blindness to pixels is load-bearing.
 *
 * Every check is calibrated against a defect that really happened. The comment on each says
 * which one, so a check that never fires again can be retired on evidence.
 */
import type { Grammar, IndexedBuffer } from '../core/types.ts'
import type { Frame } from '../core/render.ts'
import { OWNER_OUTLINE } from '../core/raster.ts'

export type Finding = {
  /** Machine-readable, so a lock can assert on a class of finding. */
  readonly check: string
  /** How loud. `alert` is almost certainly a defect; `note` is worth a look. */
  readonly level: 'alert' | 'note'
  readonly message: string
}

/** Mean same-tone region size below which shading has become per-pixel noise. */
const NOISE_FLOOR = 5

function materialOf(grammar: Grammar): Map<number, string> {
  const map = new Map<number, string>()
  for (const ramp of grammar.palette.ramps) for (const i of ramp.indices) map.set(i, ramp.material)
  return map
}

/**
 * Connected regions of one palette index, over painted pixels only.
 *
 * Born as a throwaway script during the ink probe, where it settled an argument the eye had
 * lost twice: the incumbent idiom cut 667 body pixels into 195 regions with 46% of them a
 * single pixel, against 95 regions for the idiom he ranked first. Shading that fine is not
 * shading.
 */
export function regions(buf: IndexedBuffer): {
  count: number
  meanSize: number
  biggest: number
  singletonFraction: number
} {
  const { w, h, data } = buf
  const seen = new Uint8Array(w * h)
  const sizes: number[] = []
  const stack: number[] = []
  for (let start = 0; start < w * h; start++) {
    if (seen[start] === 1 || data[start] === 0) continue
    const index = data[start]
    let size = 0
    stack.push(start)
    seen[start] = 1
    while (stack.length > 0) {
      const at = stack.pop() as number
      size++
      const x = at % w
      const y = (at / w) | 0
      if (x > 0 && seen[at - 1] === 0 && data[at - 1] === index) { seen[at - 1] = 1; stack.push(at - 1) }
      if (x < w - 1 && seen[at + 1] === 0 && data[at + 1] === index) { seen[at + 1] = 1; stack.push(at + 1) }
      if (y > 0 && seen[at - w] === 0 && data[at - w] === index) { seen[at - w] = 1; stack.push(at - w) }
      if (y < h - 1 && seen[at + w] === 0 && data[at + w] === index) { seen[at + w] = 1; stack.push(at + w) }
    }
    sizes.push(size)
  }
  if (sizes.length === 0) return { count: 0, meanSize: 0, biggest: 0, singletonFraction: 0 }
  const total = sizes.reduce((a, b) => a + b, 0)
  return {
    count: sizes.length,
    meanSize: total / sizes.length,
    biggest: Math.max(...sizes),
    singletonFraction: sizes.filter((s) => s === 1).length / sizes.length,
  }
}

/** Which material owns the outer boundary, counted in pixels. */
export function silhouetteOwners(frame: Frame, grammar: Grammar): Map<string, number> {
  const byIndex = materialOf(grammar)
  const { w, h, data } = frame.buf
  const out = new Map<string, number>()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] === 0) continue
      const onEdge =
        x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        data[at - 1] === 0 || data[at + 1] === 0 || data[at - w] === 0 || data[at + w] === 0
      const behindRing =
        (x > 0 && frame.owners[at - 1] === OWNER_OUTLINE) ||
        (x < w - 1 && frame.owners[at + 1] === OWNER_OUTLINE) ||
        (y > 0 && frame.owners[at - w] === OWNER_OUTLINE) ||
        (y < h - 1 && frame.owners[at + w] === OWNER_OUTLINE)
      if (!onEdge && !behindRing) continue
      const owner = frame.owners[at] as number
      const key = owner === OWNER_OUTLINE ? 'outline' : (byIndex.get(data[at] as number) ?? 'unknown')
      out.set(key, (out.get(key) ?? 0) + 1)
    }
  }
  return out
}

/**
 * **The whole strip, read for problems.** The output is a list of findings, never a dump —
 * a dump is a picture made of numbers and it has the same defect as a picture.
 */
export function findings(frames: readonly Frame[], grammar: Grammar): Finding[] {
  const out: Finding[] = []
  if (frames.length === 0) return [{ check: 'empty', level: 'alert', message: 'the strip has no frames' }]

  const first = frames[0] as Frame
  const { w, h } = first.buf
  const n = grammar.parts.length

  // Per part, across the strip: pixels, bbox, tone, and whether it reaches the boundary.
  const px = new Array<number[]>(n)
  const minX = new Array<number>(n).fill(Infinity)
  const maxX = new Array<number>(n).fill(-Infinity)
  const minY = new Array<number>(n).fill(Infinity)
  const maxY = new Array<number>(n).fill(-Infinity)
  const tonesUsed = new Array<Set<number>>(n)
  for (let i = 0; i < n; i++) { px[i] = []; tonesUsed[i] = new Set<number>() }
  let clippedFrames = 0

  for (const frame of frames) {
    const counts = new Int32Array(n)
    let clipped = false
    const { data } = frame.buf
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const at = y * w + x
        if (data[at] === 0) continue
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) clipped = true
        const owner = frame.owners[at] as number
        if (owner < 0) continue
        counts[owner] = (counts[owner] as number) + 1
        if (x < (minX[owner] as number)) minX[owner] = x
        if (x > (maxX[owner] as number)) maxX[owner] = x
        if (y < (minY[owner] as number)) minY[owner] = y
        if (y > (maxY[owner] as number)) maxY[owner] = y
        ;(tonesUsed[owner] as Set<number>).add(data[at] as number)
      }
    }
    if (clipped) clippedFrames++
    for (let i = 0; i < n; i++) (px[i] as number[]).push(counts[i] as number)
  }

  // 1. ABSENT. Every run since run 3 has produced one of these, and looking never found any:
  //    a part that is not there leaves no trace to see.
  for (let i = 0; i < n; i++) {
    const part = grammar.parts[i]!
    const counts = px[i] as number[]
    if (counts.every((c) => c === 0)) {
      out.push({ check: 'absent', level: 'alert', message: `part "${part.name}" renders 0 px in all ${frames.length} frames` })
      continue
    }
    // 2. MOSTLY HIDDEN. The far arm in run 7 was here before it was absent.
    const blank = counts.filter((c) => c === 0).length
    if (blank >= Math.ceil(frames.length / 2)) {
      out.push({ check: 'mostly-hidden', level: 'note', message: `part "${part.name}" renders 0 px in ${blank} of ${frames.length} frames` })
    }
    // 3. THIN. A part reduced to a sliver is present by the count and absent to the eye.
    const bw = (maxX[i] as number) - (minX[i] as number) + 1
    const bh = (maxY[i] as number) - (minY[i] as number) + 1
    if (Number.isFinite(bw) && (bw <= 1 || bh <= 1)) {
      out.push({ check: 'thin', level: 'note', message: `part "${part.name}" is ${bw}x${bh} px at its largest — a sliver` })
    }
    // 4. FLAT. A part that spends one or two tones has no modelling on it — it is a paper
    //    cut-out sitting on a body that has volume. Replaces a value-collision check that
    //    was written first and **withdrawn before shipping because it could not be
    //    calibrated in both directions**: measured by mean tone it fired on almost every
    //    part of every healthy sample, and measured by fraction-near-ground it fired on
    //    none. An instrument that cannot be made to fire and stay quiet on demand is not an
    //    instrument (`HARNESS.md` §5), and one that alerts on healthy work is worse than
    //    silent, because it trains the reader to skip it.
    //    Gated on area: a part 2 px wide cannot show five tones, so reporting it as flat is
    //    reporting its size. 20 px is the smallest area that can carry a light side, a dark
    //    side and a step between them at this resolution.
    const biggestFrame = Math.max(...counts)
    const ramp = grammar.palette.ramps.find((rp) => rp.material === part.material)
    if (ramp !== undefined && ramp.indices.length >= 4 && biggestFrame >= 20) {
      const used = tonesUsed[i] as Set<number>
      if (used.size <= 2) {
        out.push({
          check: 'flat',
          level: 'note',
          message: `part "${part.name}" uses ${used.size} of ${ramp.indices.length} tones — no modelling on it`,
        })
      }
    }
  }

  // 5. CLIPPED. The jump ran off the bottom of the cell in run 7 and nothing said so until
  //    an idiom with an outer line made the value lock fail for a different reason.
  if (clippedFrames > 0) {
    out.push({
      check: 'clipped',
      level: 'alert',
      message: `the subject touches the canvas border in ${clippedFrames} of ${frames.length} frames — no room for an outline there`,
    })
  }

  // 6. SILHOUETTE OWNERSHIP. The tree's crown was upside down — a dark dome with green spots
  //    — and this is the number that says so in one line.
  const owners = silhouetteOwners(first, grammar)
  const bodyTotal = [...owners].filter(([k]) => k !== 'outline').reduce((a, [, v]) => a + v, 0)
  if (bodyTotal > 0) {
    const parts = [...owners]
      .filter(([k]) => k !== 'outline')
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${Math.round((100 * v) / bodyTotal)}%`)
    out.push({ check: 'silhouette', level: 'note', message: `boundary is owned by: ${parts.join(', ')}` })
  }

  // 7. REGION STRUCTURE. Settled the ink probe when the eye had lost twice.
  const r = regions(first.buf)
  const level = r.meanSize < NOISE_FLOOR ? 'alert' : 'note'
  out.push({
    check: 'regions',
    level,
    message:
      `tone regions: ${r.count}, mean ${r.meanSize.toFixed(1)} px, biggest ${r.biggest}, ` +
      `${Math.round(100 * r.singletonFraction)}% single-pixel` +
      (level === 'alert' ? ` — below ${NOISE_FLOOR} px mean is noise, not shading` : ''),
  })

  return out
}

/** One line per finding, alerts first. Nothing else — a wall of data is a picture again. */
export function report(frames: readonly Frame[], grammar: Grammar): string {
  const all = findings(frames, grammar)
  const alerts = all.filter((f) => f.level === 'alert')
  const notes = all.filter((f) => f.level === 'note')
  const line = (f: Finding): string => `  ${f.level === 'alert' ? '!!' : '  '} [${f.check}] ${f.message}`
  if (all.length === 0) return '  no findings'
  return [...alerts, ...notes].map(line).join('\n')
}
