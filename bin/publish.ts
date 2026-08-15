/**
 * The history as a **static site**, ready to drop on Netlify.
 *
 *   node bin/publish.ts            -> dist/index.html
 *
 * One self-contained file: every kept generation, its frames, its palette and the diff
 * that says what that run changed. No server behind it, no network out of it, nothing to
 * install to look at it — which is the same property the gate sheet needs and the same
 * reason both are files rather than apps.
 *
 * What is *not* published: the live bench (it needs the server it is named after) and the
 * gate sheet (it will carry reference art, and reference is for looking at).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { cellOf, list } from '../src/io/gallery.ts'
import { emit } from '../src/viewer/page.ts'

const entries = list()
if (entries.length === 0) {
  process.stderr.write('nothing kept yet — run node bin/keep.ts <run.json>\n')
  process.exit(1)
}

const html = emit({
  mode: 'bench',
  slides: true,
  scale: 4,
  msPerFrame: 100,
  cells: [
    ...entries.filter((e) => (e.track ?? 'progression') === 'progression'),
    ...entries.filter((e) => e.track === 'requests'),
  ].map(cellOf),
  title: 'claude-ink-2d',
  notes: [
    `claude-ink-2d — a sprite and animation grammar for articulated bodies. ${entries.length} kept generations in two lanes.`,
    'left and right walk the history · space pauses · , and . step one frame',
  ],
})

mkdirSync('dist', { recursive: true })
writeFileSync('dist/index.html', html)
const kb = Math.round(Buffer.byteLength(html) / 1024)
process.stdout.write(`dist/index.html  ${entries.length} generations, ${kb} KB, no dependency and no network\n`)
