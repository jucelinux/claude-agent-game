/**
 * The headless runner. No presentation layer: a run in, a state hash and the objective
 * metrics out (`HARNESS.md` §3).
 *
 *   node bin/run.ts runs/fixture.run.json
 *   node bin/run.ts runs/fixture.run.json --write-baseline
 */
import { writeFileSync } from 'node:fs'
import { parse } from './args.ts'
import { execute } from '../src/io/load.ts'

const { spec, rest } = parse(process.argv.slice(2))
const result = execute(spec)

const report = {
  spec,
  hash: result.hash,
  metrics: result.metrics,
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

const target = rest['write-baseline']
if (target !== undefined) {
  const path = typeof target === 'string' ? target : 'runs/fixture.baseline.json'
  const baseline = {
    note: 'Regenerate with the command below. A baseline without its command and date is a rumour.',
    command: 'npm run baseline',
    date: new Date().toISOString().slice(0, 10),
    spec,
    hash: result.hash,
  }
  writeFileSync(path, `${JSON.stringify(baseline, null, 2)}\n`)
  process.stderr.write(`baseline written to ${path}\n`)
}
