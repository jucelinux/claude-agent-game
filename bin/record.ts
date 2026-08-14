/**
 * The recorder. Captures the run you are looking at into a file the headless runner can
 * consume — fixtures get authored **by using the thing**, not by hand (`HARNESS.md` §3).
 *
 *   node bin/record.ts runs/wide-swing.run.json --set gait.swing=0.14
 */
import { parse } from './args.ts'
import { execute, saveRun } from '../src/io/load.ts'

const argv = process.argv.slice(2)
const out = argv[0]
if (out === undefined || out.startsWith('--')) {
  process.stderr.write('usage: node bin/record.ts <out.run.json> [--grammar g] [--tunables t] [--seed n] [--set path=value]\n')
  process.exit(1)
}

const { spec } = parse(argv.slice(1))
const result = execute(spec)
saveRun(out, spec)
process.stdout.write(`recorded ${out}  hash=${result.hash}\n`)
