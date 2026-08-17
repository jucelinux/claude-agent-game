/**
 * The structured look — the bench loop's second eye (CLAUDE.md §5, amended 16/08).
 *
 *   node bin/see.ts --grammar skate-roll --tunables skate
 *   node bin/see.ts runs/tree.run.json --set light.curve=0.9 --scale 4
 *
 * Writes a contact-sheet PNG to `.eye/` and prints the path. The agent Reads the file.
 *
 * The rules that make the look safe, and they are CLAUDE.md §5's, not this file's:
 *  1. Every fix still enters through the grammar. There is nothing else to edit.
 *  2. The counting channel (`bin/bench.ts`) still runs — it finds what sight cannot.
 *  3. What the look caught that the counts did not gets one line in the round's record.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { parse } from './args.ts'
import { execute } from '../src/io/load.ts'
import { ROOT } from '../src/io/load.ts'
import { sheetPng } from '../src/io/png.ts'

const { spec, rest } = parse(process.argv.slice(2))
const result = execute(spec)

const scale = rest['scale'] === undefined ? 3 : Number(rest['scale'])
const png = sheetPng(result.frames.map((f) => f.buf), result.grammar.palette, scale)

const dir = `${ROOT}.eye`
mkdirSync(dir, { recursive: true })
const out = typeof rest['out'] === 'string' ? rest['out'] : `${dir}/${spec.grammar}@${spec.tunables}.png`
writeFileSync(out, png)

const { w, h } = result.frames[0]?.buf ?? { w: 0, h: 0 }
process.stdout.write(`${out}\n`)
process.stdout.write(`${result.frames.length} frames of ${w}x${h} at x${scale} · hash ${result.hash}\n`)
process.stdout.write(`look to name the defect; fix through the grammar; the counts still decide absence\n`)
