/**
 * One bench turn: **author -> look -> name the defect -> compile** (`TASTE-LOOP.md` §3c).
 * Change a tunable, regenerate, look — with no human and no browser in the path.
 *
 *   node bin/bench.ts
 *   node bin/bench.ts runs/fixture.run.json --set gait.swing=0.12
 *   node bin/bench.ts --set outline.enabled=false --record runs/no-outline.run.json
 *
 * The elapsed line is not decoration: above ~100 ms the loop's latency starts changing
 * what gets tried (`HARNESS.md` §4).
 */
import { parse } from './args.ts'
import { execute, saveRun } from '../src/io/load.ts'
import { dumpStrip, silhouetteStrip } from '../src/perception/lum.ts'

const started = process.hrtime.bigint()
const { spec, rest } = parse(process.argv.slice(2))
const result = execute(spec)
const buffers = result.frames.map((f) => f.buf)

const header = result.frames.map((f) => `t=${f.t.toFixed(3)}`.padEnd(result.params.canvas.w, ' ')).join(' | ')
process.stdout.write(`${header}\n`)
process.stdout.write(`${dumpStrip(buffers, result.grammar.palette)}\n\n`)
process.stdout.write(`silhouette, 25%:\n${silhouetteStrip(buffers)}\n\n`)

const m = result.metrics
process.stdout.write(`hash            ${result.hash}\n`)
process.stdout.write(`ink coverage    ${m.inkCoverage.map((v) => v.toFixed(4)).join('  ')}\n`)
process.stdout.write(`outline px      ${m.outlinePixels.join('  ')}\n`)
process.stdout.write(`tones used      ${JSON.stringify(m.tonesUsed)} of ${result.params.tones.perMaterial} budgeted\n`)
process.stdout.write(`distinct frames ${m.distinctFrames} of ${m.frames}\n`)
process.stdout.write(`min pair dist   ${m.minPairDistance.toFixed(4)}\n`)
for (const [part, counts] of Object.entries(m.partPixels)) {
  const absent = counts.every((c) => c === 0) ? '   <- ABSENT' : ''
  process.stdout.write(`part ${part.padEnd(10)} ${counts.join('  ')}${absent}\n`)
}

const record = rest['record']
if (typeof record === 'string') {
  saveRun(record, spec)
  process.stderr.write(`run recorded to ${record}\n`)
}

const elapsed = Number(process.hrtime.bigint() - started) / 1e6
process.stdout.write(`\nelapsed         ${elapsed.toFixed(1)} ms\n`)
