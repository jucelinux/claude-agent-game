import type { RunSpec } from '../src/io/load.ts'
import { loadRun } from '../src/io/load.ts'

export type Parsed = { readonly spec: RunSpec; readonly rest: Readonly<Record<string, string | true>> }

/**
 * `[run.json] [--grammar g] [--tunables t] [--seed n] [--set path=value ...] [--flag]`
 *
 * A run file is the base; every flag overrides it. That is what makes the bench turn and
 * the recorded run the same object — you tune with `--set`, then record what you tuned.
 */
export function parse(argv: readonly string[]): Parsed {
  let spec: RunSpec = { grammar: 'fixture', tunables: 'default', seed: 1 }
  const overrides: Record<string, number | boolean> = {}
  const rest: Record<string, string | true> = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string
    if (!arg.startsWith('--')) {
      spec = { ...loadRun(arg), ...{} }
      if (spec.overrides !== undefined) Object.assign(overrides, spec.overrides)
      continue
    }
    const key = arg.slice(2)
    const next = argv[i + 1]
    switch (key) {
      case 'grammar':
        spec = { ...spec, grammar: expect(next, '--grammar') }
        i++
        break
      case 'tunables':
        spec = { ...spec, tunables: expect(next, '--tunables') }
        i++
        break
      case 'seed':
        spec = { ...spec, seed: Number(expect(next, '--seed')) }
        i++
        break
      case 'set': {
        const pair = expect(next, '--set')
        const eq = pair.indexOf('=')
        if (eq < 0) throw new Error(`--set wants path=value, got "${pair}"`)
        const path = pair.slice(0, eq)
        const raw = pair.slice(eq + 1)
        overrides[path] = raw === 'true' ? true : raw === 'false' ? false : Number(raw)
        if (typeof overrides[path] === 'number' && Number.isNaN(overrides[path])) {
          throw new Error(`--set ${path}: "${raw}" is not a number or a boolean`)
        }
        i++
        break
      }
      default:
        if (next !== undefined && !next.startsWith('--')) {
          rest[key] = next
          i++
        } else {
          rest[key] = true
        }
    }
  }

  return { spec: { ...spec, overrides }, rest }
}

function expect(value: string | undefined, flag: string): string {
  if (value === undefined) throw new Error(`${flag} needs a value`)
  return value
}
