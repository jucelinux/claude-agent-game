/**
 * **The micro-game webapp.** His surface from 15/08 onward.
 *
 *   node bin/micro.ts            -> http://localhost:5177
 *   node bin/micro.ts --static   -> dist/micro/ as plain files
 *
 *   /            the shelf: every micro game ever made, oldest first
 *   /<id>        one game, big, on its own route
 *
 * The dev command watches imported source, while this server caches one built stage per game
 * until any source or tunable file changes. Iterating is still edit, refresh, look; refreshing
 * one route no longer pays to render every other route as well.
 *
 * `node:http` and `node:fs` only. Nothing added to the stack.
 */
import { createServer } from 'node:http'
import { gzipSync } from 'node:zlib'
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { toStage } from '../src/scene/layers.ts'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { gamePage, shelfPage } from '../src/micro/app.ts'
import type { AppGame } from '../src/micro/app.ts'

function buildGame(id: string): AppGame | undefined {
  const game = MICRO_GAMES.find((g) => g.id === id)
  if (game === undefined) return undefined
  const stage = toStage(game.scene)
  const bytes = stage.layers.reduce((a, l) => a + l.indices.length, 0)
  return {
    id: game.id,
    title: game.title,
    blurb: game.blurb,
    date: game.date,
    meta: [
      `${stage.w}\u00d7${stage.h}`,
      `\u00d7${stage.scale}`,
      `${stage.placed.length} subjects`,
      `${stage.layers.length} layers`,
      `${stage.colours} colours`,
      `${(bytes / 1024).toFixed(0)} KB of indices`,
      game.date,
    ],
    stage,
    ...(game.actions === undefined ? {} : { actions: game.actions }),
    ...(game.keys === undefined ? {} : { keys: game.keys }),
  }
}

/**
 * **The served size, measured rather than estimated.** The page prints its own wire cost, and
 * the only way to know it is to compress the page — which needs the page, which needs the
 * number. So it is built twice: once to measure, once to print. The first build is thrown
 * away and it costs a gzip of a couple of megabytes, which is milliseconds.
 */
function withWireCost(game: AppGame): AppGame {
  return { ...game, gzipBytes: gzipSync(Buffer.from(gamePage(game)), { level: 6 }).length }
}

const buildAll = (): AppGame[] =>
  MICRO_GAMES.map((g) => cachedGame(g.id)).filter((g): g is AppGame => g !== undefined)

/**
 * A tiny invalidation key is enough here: Node's watch mode reloads imported TypeScript, and
 * this walk also catches JSON tunables loaded through `readFileSync`. Size joins mtime so two
 * quick edits on a coarse filesystem do not accidentally look identical.
 */
function treeStamp(root: string): string {
  const entries = readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  return entries.flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) return [treeStamp(path)]
    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.json')) return []
    const stat = statSync(path)
    return [`${path}:${stat.mtimeMs}:${stat.size}`]
  }).join('|')
}

let stamp = ''
const cache = new Map<string, AppGame>()
function cachedGame(id: string): AppGame | undefined {
  const current = `${treeStamp('src')}|${treeStamp('tunables')}`
  if (current !== stamp) { stamp = current; cache.clear() }
  const hit = cache.get(id)
  if (hit !== undefined) return hit
  const built = buildGame(id)
  if (built === undefined) return undefined
  const measured = withWireCost(built)
  cache.set(id, measured)
  return measured
}

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
    // Gzip, and it is not a nicety: a stage ships every sprite's own frames instead of one
    // flattened list, and indexed art with wide transparent margins compresses about ten to
    // one. Without it the page is megabytes and the refresh loop stops being a loop.
    const send = (html: string, code = 200): void => {
      const accepts = String(req.headers['accept-encoding'] ?? '').includes('gzip')
      const head: Record<string, string> = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
      if (!accepts) { res.writeHead(code, head); res.end(html); return }
      const body = gzipSync(Buffer.from(html), { level: 6 })
      res.writeHead(code, { ...head, 'content-encoding': 'gzip', 'content-length': String(body.length) })
      res.end(body)
    }
    try {
      if (path === '' || path === '/') return send(shelfPage(buildAll()))
      const game = cachedGame(path.slice(1))
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
