/**
 * The gate sheet — **the one page that is still a file, on purpose.**
 *
 *   node bin/gate.ts runs/probe-b.run.json
 *
 * Writes `sheet/gate.html`: no control, no label, no tooltip, nothing that names a cell.
 * It does not come from the live server and it never will — a sheet that can change under
 * the human mid-reading is not a reading, and a frozen file is what makes a reading
 * repeatable weeks later.
 *
 * `sheet/` is gitignored: it carries reference art, and reference is for looking at.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { parse } from './args.ts'
import { buildCells } from '../src/viewer/cells.ts'
import { emit } from '../src/viewer/page.ts'

const argv = process.argv.slice(2)
const runs = argv.filter((a) => a.endsWith('.json'))
const flags = argv.filter((a) => !a.endsWith('.json'))
const { rest } = parse(flags)
const out = typeof rest['out'] === 'string' ? rest['out'] : 'sheet/gate.html'

const specs = runs.length > 0 ? runs.map((r) => parse([r, ...flags]).spec) : [parse(flags).spec]
const data = buildCells(specs)

// Reference cells are not built yet — they need his five loops, and the same blit path.
const html = emit({ mode: 'gate', scale: data.scale, msPerFrame: data.msPerFrame, cells: data.cells })

mkdirSync('sheet', { recursive: true })
writeFileSync(out, html)
process.stdout.write(`${out}  ${data.cells.length} cell(s) — mine only, until the five references exist\n`)
