/**
 * The whole history on one page, oldest first, every cell on the same clock.
 *
 *   node bin/gallery.ts            -> .out/gallery.html
 *   node bin/gallery.ts --newest   -> newest first
 *
 * Rebuilt from the kept JSON, never from the current code — which is the point. If a
 * refactor changes what the grammar renders, the gallery still shows what it *did* render,
 * and the difference is visible instead of quietly overwritten.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { parse } from './args.ts'
import { cellOf, list } from '../src/io/gallery.ts'
import { emit } from '../src/viewer/page.ts'

const { rest } = parse(process.argv.slice(2))
const entries = list()
if (entries.length === 0) {
  process.stderr.write('nothing kept yet — run node bin/keep.ts <run.json>\n')
  process.exit(1)
}
if (rest['newest'] !== undefined) entries.reverse()

const html = emit({
  mode: 'bench',
  scale: 4,
  msPerFrame: 100,
  cells: entries.map(cellOf),
  title: 'claude-ink-2d · gallery',
  notes: [
    `${entries.length} kept generation${entries.length === 1 ? '' : 's'}, oldest first. space pauses · left and right step a frame.`,
    'Each cell plays at the rate and scale its own run declared, off one page clock.',
  ],
})

mkdirSync('.out', { recursive: true })
writeFileSync('.out/gallery.html', html)
process.stdout.write(`.out/gallery.html  ${entries.length} cells\n`)
