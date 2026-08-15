/**
 * **The micro-game shelf.** His surface from 15/08 onward.
 *
 *   node bin/micro.ts            -> dist/micro.html
 *   node bin/micro.ts --serve    -> http://localhost:5174, rebuilt on every save
 *
 * One slide per micro game, oldest first, arrows to walk them. Everything renders **live**
 * from current code, so an engine improvement reaches every game ever made — which is the
 * opposite of the gallery's rule and deliberately so. The gallery is the record. This is
 * the product.
 */
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync, watch } from 'node:fs'
import { compose } from '../src/scene/compose.ts'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { emit } from '../src/viewer/page.ts'
import type { ViewCell } from '../src/viewer/page.ts'

function build(): string {
  const cells: ViewCell[] = MICRO_GAMES.map((game) => {
    const composed = compose(game.scene)
    const own = composed.cohesion.perSubject.reduce((a, s) => a + s.colours, 0)
    const shared = composed.cohesion.perSubject.reduce((a, s) => a + s.shared, 0)
    return {
      w: composed.scene.w,
      h: composed.scene.h,
      frames: composed.buffers.map((b) => b.data),
      palette: composed.palette.colors,
      label: `${game.title} · ${game.blurb}`,
      group: `${game.date} · ${game.title}`,
      scale: composed.scene.scale,
      msPerFrame: composed.scene.msPerFrame,
      summary: [
        `${game.id} · ${composed.scene.w}×${composed.scene.h} · ${composed.buffers.length} frames · ${composed.scene.frames * composed.scene.msPerFrame} ms cycle`,
        `${composed.scene.placements.length} subjects · ${composed.cohesion.totalColours} colours · ${Math.round((100 * shared) / Math.max(1, own + shared))}% palette reuse`,
      ],
    }
  })
  return emit({
    mode: 'bench',
    slides: true,
    scale: 3,
    msPerFrame: 50,
    cells,
    title: 'claude-ink-2d · micro games',
    notes: [
      'One slide per iteration. Every object here belongs to a scene, never to a cell.',
      'left and right walk the shelf · space pauses · , and . step one frame',
    ],
  })
}

if (process.argv.includes('--serve')) {
  const port = 5174
  let html = build()
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(html)
  })
  for (const dir of ['src', 'tunables']) {
    watch(dir, { recursive: true }, () => {
      try {
        html = build()
        process.stdout.write(`rebuilt  ${MICRO_GAMES.length} micro games\n`)
      } catch (err) {
        process.stderr.write(`build failed: ${String(err)}\n`)
      }
    })
  }
  server.listen(port, () => process.stdout.write(`micro games on http://localhost:${port}  ·  ${MICRO_GAMES.length} on the shelf\n`))
} else {
  const html = build()
  mkdirSync('dist', { recursive: true })
  writeFileSync('dist/micro.html', html)
  process.stdout.write(`dist/micro.html  ${MICRO_GAMES.length} micro games, ${Math.round(Buffer.byteLength(html) / 1024)} KB\n`)
}
