/**
 * **The micro-game webapp.** His surface from 15/08 onward.
 *
 *   node bin/micro.ts            -> http://localhost:5174
 *   node bin/micro.ts --static   -> dist/micro/ as plain files
 *
 *   /            the shelf: every micro game ever made, oldest first
 *   /<id>        one game, big, on its own route
 *
 * **Every route renders from current code on every request.** There is no cache and no
 * build step, so iterating on a game is: edit, refresh, look. That is the opposite of the
 * gallery, which freezes an entry so a refactor shows up as a difference — the gallery is
 * the record and this is the product.
 *
 * `node:http` and `node:fs` only. Nothing added to the stack.
 */
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { compose } from '../src/scene/compose.ts'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { gamePage, shelfPage } from '../src/micro/app.ts'
import type { AppGame } from '../src/micro/app.ts'

function buildGame(id: string): AppGame | undefined {
  const game = MICRO_GAMES.find((g) => g.id === id)
  if (game === undefined) return undefined
  const composed = compose(game.scene)
  const own = composed.cohesion.perSubject.reduce((a, s) => a + s.colours, 0)
  const shared = composed.cohesion.perSubject.reduce((a, s) => a + s.shared, 0)
  const cycle = composed.scene.frames * composed.scene.msPerFrame
  return {
    id: game.id,
    title: game.title,
    blurb: game.blurb,
    date: game.date,
    meta: [
      `${composed.scene.w}×${composed.scene.h}`,
      `×${composed.scene.scale}`,
      `${composed.buffers.length} frames`,
      `${cycle} ms cycle`,
      `${composed.scene.placements.length} subjects`,
      `${composed.cohesion.totalColours} colours`,
      `${Math.round((100 * shared) / Math.max(1, own + shared))}% palette reuse`,
      game.date,
    ],
    cell: {
      w: composed.scene.w,
      h: composed.scene.h,
      scale: composed.scene.scale,
      msPerFrame: composed.scene.msPerFrame,
      frames: composed.buffers.map((b) => b.data),
      palette: composed.palette.colors,
    },
  }
}

const buildAll = (): AppGame[] => MICRO_GAMES.map((g) => buildGame(g.id)).filter((g): g is AppGame => g !== undefined)

if (process.argv.includes('--static')) {
  const games = buildAll()
  mkdirSync('dist/micro', { recursive: true })
  writeFileSync('dist/micro/index.html', shelfPage(games))
  for (const game of games) {
    mkdirSync(`dist/micro/${game.id}`, { recursive: true })
    writeFileSync(`dist/micro/${game.id}/index.html`, gamePage(game))
  }
  process.stdout.write(`dist/micro/  ${games.length} games, one route each\n`)
} else {
  // Configurable, and it defaults high on purpose: 5174 was already taken on this machine
  // by something that was not ours, and a server that silently fails to bind serves someone
  // else's pages under our routes — which is exactly what happened the first time.
  const flag = process.argv.indexOf('--port')
  const port = flag >= 0 ? Number(process.argv[flag + 1]) : 5177
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0]!.replace(/\/+$/, '')
    const send = (html: string, code = 200): void => {
      res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(html)
    }
    try {
      if (path === '' || path === '/') return send(shelfPage(buildAll()))
      const game = buildGame(path.slice(1))
      // A miss goes back to the shelf rather than to a dead end: he navigates by refreshing,
      // and a stale URL after an id changes should land somewhere useful.
      if (game === undefined) return send(shelfPage(buildAll()), 404)
      return send(gamePage(game))
    } catch (err) {
      return send(`<pre style="color:#e88;background:#131316;padding:32px;font:13px monospace">${String((err as Error).stack ?? err)}</pre>`, 500)
    }
  })
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      process.stderr.write(`port ${port} is already taken. Pass --port <n> — and do not assume the pages you see are ours.\n`)
      process.exit(1)
    }
    throw err
  })
  server.listen(port, () => {
    process.stdout.write(`micro games on http://localhost:${port}\n`)
    for (const g of MICRO_GAMES) process.stdout.write(`  /${g.id.padEnd(20)} ${g.title}\n`)
  })
}
