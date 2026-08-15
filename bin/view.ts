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
import { buildCells } from '../src/viewer/cells.ts'
import { emit } from '../src/viewer/page.ts'

const argv = process.argv.slice(2)
const runs = argv.filter((a) => a.endsWith('.json'))
const flags = argv.filter((a) => !a.endsWith('.json'))

const { rest } = parse(flags)
// Only two modes reach a file. `live` is served, never written: a page on disk that
// expects a server behind it is a page that lies the day the server is not running.
const mode = rest['mode'] === 'gate' ? 'gate' : 'bench'
const out = typeof rest['out'] === 'string' ? rest['out'] : `.out/${mode}.html`

const specs = runs.length > 0 ? runs.map((r) => parse([r, ...flags]).spec) : [parse(flags).spec]
const data = buildCells(specs)

const html = emit({
  mode,
  scale: data.scale,
  msPerFrame: data.msPerFrame,
  cells: data.cells,
  title: `claude-ink-2d · ${mode}`,
  notes:
    mode === 'bench'
      ? ['space pauses · left and right step a frame · this page is mine, and stopping time here is how a defect gets named']
      : undefined,
})

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)
process.stdout.write(`${out}  ${data.cells.length} cell(s), ${data.msPerFrame} ms/frame, x${data.scale}\n`)
for (const hash of data.hashes) process.stdout.write(`  ${hash}\n`)
