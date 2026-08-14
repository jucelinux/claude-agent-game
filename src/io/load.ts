/**
 * The only place that touches the filesystem. The core imports nothing from here
 * (`HARNESS.md` §2.1) — this module composes loaded data with the pure functions.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Grammar, Params } from '../core/types.ts'
import type { Frame } from '../core/render.ts'
import { strip } from '../core/render.ts'
import { hashBuffers } from '../core/hash.ts'
import { measure } from '../core/metrics.ts'
import type { Metrics } from '../core/metrics.ts'
import { grammarByName } from '../grammars/index.ts'

export const ROOT_URL = new URL('../../', import.meta.url)
export const ROOT = fileURLToPath(ROOT_URL)

/** A run is data: `{grammar, tunables, seed}` plus any overrides. Replayable by construction. */
export type RunSpec = {
  readonly grammar: string
  readonly tunables: string
  readonly seed: number
  /** Dotted paths into the tunables, e.g. `"gait.swing": 0.12`. */
  readonly overrides?: Readonly<Record<string, number | boolean>>
}

export type RunResult = {
  readonly spec: RunSpec
  readonly grammar: Grammar
  readonly params: Params
  readonly frames: readonly Frame[]
  readonly hash: string
  readonly metrics: Metrics
}

export function loadParams(name: string): Params {
  const text = readFileSync(new URL(`tunables/${name}.json`, ROOT_URL), 'utf8')
  return JSON.parse(text) as Params
}

export function loadRun(path: string): RunSpec {
  return JSON.parse(readFileSync(path, 'utf8')) as RunSpec
}

export function saveRun(path: string, spec: RunSpec): void {
  writeFileSync(path, `${JSON.stringify(spec, null, 2)}\n`)
}

/** Apply dotted-path overrides to a params object, without mutating the original. */
export function withOverrides(params: Params, overrides: Readonly<Record<string, number | boolean>> = {}): Params {
  const copy = structuredClone(params) as unknown as Record<string, unknown>
  for (const [path, value] of Object.entries(overrides)) {
    const keys = path.split('.')
    let node = copy
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i] as string
      const next = node[key]
      if (typeof next !== 'object' || next === null) throw new Error(`override path "${path}" does not exist in the tunables`)
      node = next as Record<string, unknown>
    }
    const leaf = keys[keys.length - 1] as string
    if (!(leaf in node)) throw new Error(`override path "${path}" does not exist in the tunables`)
    node[leaf] = value
  }
  return copy as unknown as Params
}

export function execute(spec: RunSpec): RunResult {
  const grammar = grammarByName(spec.grammar)
  const params = withOverrides(loadParams(spec.tunables), spec.overrides)
  const frames = strip(grammar, params, spec.seed)
  return {
    spec,
    grammar,
    params,
    frames,
    hash: hashBuffers(frames.map((f) => f.buf)),
    metrics: measure(frames, grammar),
  }
}
