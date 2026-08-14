/**
 * The human's channel, written to a file.
 *
 *   node bin/view.ts                                  -> .out/bench.html
 *   node bin/view.ts --set gait.swing=0.14
 *   node bin/view.ts runs/a.run.json runs/b.run.json  -> one cell per run, one tick for all
 *   node bin/view.ts --mode gate                      -> no label, no control, no tell
 *
 * A cell is one loop. Every cell on the page shares the same ms/frame and the same
 * integer scale, because a comparison where one cell runs smoother compares renderers.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parse } from './args.ts'
import { execute } from '../src/io/load.ts'
import type { ViewCell } from '../src/viewer/page.ts'
import { emit } from '../src/viewer/page.ts'

const argv = process.argv.slice(2)
const runs = argv.filter((a) => a.endsWith('.json'))
const flags = argv.filter((a) => !a.endsWith('.json'))

const { rest } = parse(flags)
const mode = rest['mode'] === 'gate' ? 'gate' : 'bench'
const out = typeof rest['out'] === 'string' ? rest['out'] : `.out/${mode}.html`

const specs = runs.length > 0 ? runs.map((r) => parse([r, ...flags]).spec) : [parse(flags).spec]
const results = specs.map((spec) => execute(spec))
const first = results[0]
if (first === undefined) throw new Error('nothing to view')

const cells: ViewCell[] = results.map((result, i) => ({
  w: result.params.canvas.w,
  h: result.params.canvas.h,
  frames: result.frames.map((f) => f.buf.data),
  palette: result.grammar.palette.colors,
  label: `${result.spec.grammar}${runs[i] !== undefined ? ` · ${runs[i]}` : ''} · ${result.hash}`,
}))

const html = emit({
  mode,
  scale: first.params.playback.scale,
  msPerFrame: first.params.playback.msPerFrame,
  cells,
  title: `claude-ink-2d · ${mode}`,
  notes:
    mode === 'bench'
      ? ['space pauses · left and right step a frame · this page is mine, and stopping time here is how a defect gets named']
      : undefined,
})

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)
process.stdout.write(`${out}  ${cells.length} cell(s), ${first.params.playback.msPerFrame} ms/frame, x${first.params.playback.scale}\n`)
for (const result of results) process.stdout.write(`  ${result.spec.grammar}  ${result.hash}\n`)
