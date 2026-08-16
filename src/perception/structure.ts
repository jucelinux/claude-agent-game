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
import { PERIODIC, weave } from './weave.ts'

export type Finding = {
  /** Machine-readable, so a lock can assert on a class of finding. */
  readonly check: string
  /** How loud. `alert` is almost certainly a defect; `note` is worth a look. */
  readonly level: 'alert' | 'note'
  readonly message: string
}

/**
 * Mean same-tone region size below which shading has become per-pixel noise.
 *
 * **It is not a noise test on its own, and `tests/dither.test.ts` measures why.** Over one
 * gradient an ordered Bayer weave lands at 4.2 px and the retired speckle at 10.0 — so this
 * floor fires on the correct work and clears the dirt. Region size measures how *finely*
 * shading is cut; it was standing in for whether the cutting is *intentional*, and only
 * periodicity carries that (`src/perception/weave.ts`). The check below reads both.
 */
export const NOISE_FLOOR = 5

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
export function findings(frames: readonly Frame[], grammar: Grammar, lattice = 4): Finding[] {
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
    /**
     * **A check was written here and withdrawn before shipping, and the withdrawal is kept**
     * because it is the second time this file has done it for the same reason.
     *
     * The class it was for reached its fourth occurrence — a limb pair authored as one pose at
     * a phase offset, so the far limb hides inside the near one — and `TASTE-LOOP.md` §3.8 says
     * that is where patching stops and the lock generalizes. `absent` cannot see it (the part is
     * never at zero) and `mostly-hidden` cannot see it (never blank for half the cycle), so the
     * attempt measured **declared shape area against best painted frame**.
     *
     * It fired on 237 parts across 69 shipped subjects, including the astronaut's pack seen from
     * behind and the gorilla's neck. **Occlusion is normal and correct**, and a check that cannot
     * tell a hidden part from a swallowed one is a check that alerts on healthy work — which is
     * worse than silence, because it trains the reader to skip the channel.
     *
     * The invariant was in the wrong place. A limb pair being one pose is a fact about the
     * **grammar**, not about the render, and no amount of counting pixels recovers intent from
     * a picture. It is a lock now: `tests/pairs.test.ts`.
     */
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
  //
  // **It now reads the lattice before it calls anything noise**, and the reason is measured in
  // `tests/dither.test.ts`: over one gradient an ordered weave lands at 4.2 px mean region and
  // the retired speckle at 10.0. Region size alone had the two cases exactly backwards. Fine
  // cutting is noise when it is aperiodic and a texture when it is periodic, and only
  // `weave()` can tell which — so the alert now requires both halves.
  const r = regions(first.buf)
  const wv = weave(first.buf, first.owners, lattice)
  const fine = r.meanSize < NOISE_FLOOR
  const ordered = wv.surface >= 0.12 && wv.period >= PERIODIC
  const level = fine && !ordered ? 'alert' : 'note'
  out.push({
    check: 'regions',
    level,
    message:
      `tone regions: ${r.count}, mean ${r.meanSize.toFixed(1)} px, biggest ${r.biggest}, ` +
      `${Math.round(100 * r.singletonFraction)}% single-pixel` +
      (level === 'alert' ? ` — below ${NOISE_FLOOR} px mean and aperiodic: noise, not shading` : '') +
      (fine && level === 'note' ? ` — fine, but periodic (${wv.period.toFixed(2)}): an ordered weave` : ''),
  })

  // 8. THE WEAVE. Born 16/08 with the ordered dither, because every other check in this file
  // and every lock in the repo is blind to it: the threshold has zero mean, so a dithered
  // region carries the same average tone, the same silhouette and the same pixel count as an
  // undithered one. Reported always, including at 0, so its absence is as visible as its
  // presence — a weave that silently switched off would otherwise read as a weave that works.
  out.push({
    check: 'weave',
    level: 'note',
    message:
      `surface ${Math.round(100 * wv.surface)}% of painted` +
      (wv.surface < 0.12
        ? ` — TOO LITTLE SURFACE TO DITHER: almost no ${lattice}x${lattice} cell belongs to one part, so a weave here is indistinguishable from noise`
        : `, textured ${Math.round(100 * wv.textured)}%, orphans ${Math.round(100 * wv.orphans)}%, ` +
          `period ${wv.period.toFixed(2)} (${wv.period >= PERIODIC ? 'ordered' : 'aperiodic'})`),
  })

  return out
}

/** One line per finding, alerts first. Nothing else — a wall of data is a picture again. */
export function report(frames: readonly Frame[], grammar: Grammar, lattice = 4): string {
  const all = findings(frames, grammar, lattice)
  const alerts = all.filter((f) => f.level === 'alert')
  const notes = all.filter((f) => f.level === 'note')
  const line = (f: Finding): string => `  ${f.level === 'alert' ? '!!' : '  '} [${f.check}] ${f.message}`
  if (all.length === 0) return '  no findings'
  return [...alerts, ...notes].map(line).join('\n')
}
