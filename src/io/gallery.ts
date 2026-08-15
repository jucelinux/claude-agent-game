/**
 * **Every sprite this project ever produced, kept.**
 *
 * The human asked for the history on 14/08 — from the dummy onwards — and the reason it is
 * worth having is not sentiment: a grammar is judged by where it *moved*, and the gate's
 * counter measures exactly that. A run that is regenerated and lost leaves the movement
 * unverifiable, and "it got better" becomes a claim instead of a comparison.
 *
 * One JSON file per kept generation: the indexed frames, the palette, the run that made
 * them, and the hash. Small, diffable, and enough to rebuild the animation years later
 * without this code — which is the same bet the export contract makes.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import type { RGB } from '../core/types.ts'
import type { ViewCell } from '../viewer/page.ts'
import type { RunResult } from './load.ts'
import { ROOT } from './load.ts'

/**
 * Overridable so the suite can exercise the whole keep-and-serve loop against a throwaway
 * directory. The first version guarded the real gallery with a `--no-keep` flag, which
 * protected it by convention; this protects it by construction, and lets the test verify
 * the thing the flag used to switch off.
 */
export function galleryDir(): string {
  const override = process.env['INK_GALLERY']
  return override === undefined ? `${ROOT}gallery/` : override.endsWith('/') ? override : `${override}/`
}

export type GalleryEntry = {
  readonly n: number
  readonly date: string
  readonly grammar: string
  readonly tunables: string
  readonly seed: number
  readonly overrides: Readonly<Record<string, number | boolean>>
  readonly hash: string
  readonly w: number
  readonly h: number
  readonly frames: number
  readonly msPerFrame: number
  readonly scale: number
  readonly palette: readonly RGB[]
  /** All frames, concatenated, base64. Index space — the palette is separate on purpose. */
  readonly indices: string
  /** The resolved tunables, minus the anchors. What makes an entry self-describing. */
  readonly params: Readonly<Record<string, unknown>>
  /** What this generation was about: **derived** from what changed, never narrated. */
  readonly summary: readonly string[]
  /**
   * The run this generation belongs to. Entries sharing a topic are one slide, so a run is
   * seen whole — the humanoid beside every insect variation — instead of one sprite at a
   * time compared from memory. Defaults to the first line of the derived summary, which
   * makes the title of an unlabelled run be *what changed in it*.
   */
  readonly topic: string
  readonly note?: string
}

/** Flatten to dotted paths so two generations can be compared leaf by leaf. */
function flatten(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof value !== 'object' || value === null) {
    out.set(prefix, JSON.stringify(value))
    return out
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    for (const [path, leaf] of flatten(child, prefix === '' ? key : `${prefix}.${key}`)) out.set(path, leaf)
  }
  return out
}

/**
 * The summary is a diff, and that is the point: a narrated note says what I meant to do,
 * a diff says what actually changed. When they disagree the diff is right.
 */
export function summarise(params: Record<string, unknown>, previous: GalleryEntry | undefined): string[] {
  if (previous === undefined) return ['first kept generation of this grammar']
  const before = flatten(previous.params)
  const after = flatten(params)
  const lines: string[] = []
  for (const [path, value] of after) {
    const was = before.get(path)
    if (was === undefined) lines.push(`${path}  born  ${value}`)
    else if (was !== value) lines.push(`${path}  ${was} → ${value}`)
  }
  for (const path of before.keys()) if (!after.has(path)) lines.push(`${path}  removed`)
  return lines.length === 0 ? ['no tunable moved — the change was in the grammar itself'] : lines
}

export function entryFrom(
  result: RunResult,
  n: number,
  date: string,
  note?: string,
  topic?: string,
): GalleryEntry {
  const { _anchors, ...params } = result.params as unknown as Record<string, unknown>
  void _anchors
  const previous = list().filter((e) => e.grammar === result.spec.grammar).pop()
  const summary = summarise(params, previous)
  return {
    params,
    summary,
    topic: topic ?? (summary[0] as string),
    n,
    date,
    grammar: result.spec.grammar,
    tunables: result.spec.tunables,
    seed: result.spec.seed,
    overrides: result.spec.overrides ?? {},
    hash: result.hash,
    w: result.params.canvas.w,
    h: result.params.canvas.h,
    frames: result.frames.length,
    msPerFrame: result.params.playback.msPerFrame,
    scale: result.params.playback.scale,
    palette: result.grammar.palette.colors,
    indices: Buffer.concat(result.frames.map((f) => Buffer.from(f.buf.data))).toString('base64'),
    ...(note === undefined ? {} : { note }),
  }
}

export function list(): GalleryEntry[] {
  const dir = galleryDir()
  mkdirSync(dir, { recursive: true })
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(dir + f, 'utf8')) as GalleryEntry)
    .sort((a, b) => a.n - b.n)
}

export function nextNumber(): number {
  const entries = list()
  return entries.length === 0 ? 1 : (entries[entries.length - 1] as GalleryEntry).n + 1
}

/** Kept only when the hash is new: the history records movement, not repetition. */
export function keep(entry: GalleryEntry): string | null {
  if (list().some((e) => e.hash === entry.hash && e.grammar === entry.grammar)) return null
  const path = `${galleryDir()}${String(entry.n).padStart(4, '0')}-${entry.grammar}-${entry.hash.slice(0, 8)}.json`
  writeFileSync(path, `${JSON.stringify(entry, null, 2)}\n`)
  return path
}

export function cellOf(entry: GalleryEntry): ViewCell {
  const bytes = Buffer.from(entry.indices, 'base64')
  const per = entry.w * entry.h
  const frames: Uint8Array[] = []
  for (let f = 0; f < entry.frames; f++) frames.push(new Uint8Array(bytes.subarray(f * per, (f + 1) * per)))
  return {
    w: entry.w,
    h: entry.h,
    frames,
    palette: entry.palette,
    label: `#${String(entry.n).padStart(4, '0')} · ${entry.grammar}${entry.note === undefined ? '' : ` · ${entry.note}`}`,
    group: `${entry.date} · ${entry.topic ?? 'untitled run'}`,
    scale: entry.scale,
    msPerFrame: entry.msPerFrame,
    summary: [
      `${entry.w}×${entry.h} · ${entry.frames} frames · ${entry.msPerFrame} ms/frame · ${entry.frames * entry.msPerFrame} ms cycle`,
      '',
      ...(entry.summary ?? []),
    ],
  }
}
