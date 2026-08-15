/**
 * **The only surface.** One page, opened once, never regenerated as a file.
 *
 *   node bin/serve.ts [runs…] [--set path=value] [--port 5173]
 *
 *   /           one slide per run: the batches, in order, latest version of each element
 *   /selftest   the viewer's null case, always available
 *   /frames.json, /events   what the page pulls and what wakes it up
 *
 * The page shows **runs**, and nothing else. A run reaches it by being kept (`bin/keep.ts`),
 * which is a deliberate act at the end of a batch — work in progress belongs in the
 * terminal bench, which is mine. Editing the viewer rebuilds the shell in a fresh process
 * and reloads the tab; keeping a run swaps the cells under a loop that never stops.
 *
 * The gate never comes through here (`bin/gate.ts` writes a frozen file): a sheet that can
 * change under the human mid-reading is not a reading.
 *
 * `node:http` and `node:fs` only — nothing added to the stack.
 */
import { execFileSync } from 'node:child_process'
import { watch } from 'node:fs'
import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
import { cellOf, galleryDir, list, shipped } from '../src/io/gallery.ts'

type Cell = { label?: string; [key: string]: unknown }

const argv = process.argv.slice(2)
const portFlag = argv.indexOf('--port')
const port = portFlag >= 0 ? Number(argv[portFlag + 1]) : 5173

/**
 * **One slide per run, and nothing else on the page.**
 *
 * There is no live cell any more. It was mine, not his, and it made a third slide out of
 * work nobody had been asked to judge — which is how the page drifted from "the runs" into
 * "everything the model happened to render". A run reaches the page when it is kept, and
 * keeping is a deliberate act at the end of a batch.
 */
function payload(): string {
  const cells: Cell[] = [
    ...shipped().map(cellOf).map((cell) => ({
      w: cell.w,
      h: cell.h,
      n: cell.frames.length,
      palette: cell.palette,
      indices: Buffer.concat(cell.frames.map((f) => Buffer.from(f))).toString('base64'),
      label: cell.label,
      scale: cell.scale,
      msPerFrame: cell.msPerFrame,
      summary: cell.summary,
      group: cell.group,
    })),
  ]
  return JSON.stringify({ mode: 'live', scale: 4, msPerFrame: 100, cells })
}

let served = payload()

function refresh(): boolean {
  const next = payload()
  if (next === served) return false
  served = next
  return true
}

const listeners = new Set<ServerResponse>()

/**
 * The shell comes from a fresh process too, so **editing the viewer needs no restart**.
 * When a change alters the shell the page is told to reload; when it only alters the
 * frames the page swaps them under a running loop. The distinction matters: a reload
 * restarts the animation, and judging motion from a standstill is what the live bench
 * exists to avoid, so it must never happen for a change that did not need it.
 */
function buildShell(mode: 'live' | 'selftest'): string {
  return execFileSync(process.execPath, ['bin/shell.ts', '--mode', mode], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
}

let shell = buildShell('live')
let selftest = buildShell('selftest')

const server = createServer((req, res) => {
  if (req.url === '/frames.json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(served)
    return
  }
  if (req.url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
    res.write('retry: 500\n\n')
    listeners.add(res)
    req.on('close', () => listeners.delete(res))
    return
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(req.url === '/selftest' ? selftest : shell)
})

server.listen(port, () => {
  const address = server.address()
  const bound = typeof address === 'object' && address !== null ? address.port : port
  process.stdout.write(`http://localhost:${bound}       one slide per run\n`)
  process.stdout.write(`http://localhost:${bound}/selftest   the viewer's null case\n`)
  process.stdout.write(`watching src, tunables, runs, gallery · ${shipped().length} on the page, ${list().length} in the history\n`)
})

let pending: NodeJS.Timeout | null = null
function onChange(): void {
  if (pending !== null) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = null
    let reload = false
    try {
      const next = buildShell('live')
      const nextSelftest = buildShell('selftest')
      reload = next !== shell || nextSelftest !== selftest
      shell = next
      selftest = nextSelftest
    } catch (error) {
      process.stderr.write(`\n${String(error).split('\n').slice(0, 6).join('\n')}\n`)
      return
    }
    const pageMoved = refresh()
    if (reload) {
      process.stdout.write('viewer changed — reloading the page\n')
      for (const res of listeners) res.write('data: reload\n\n')
      if (!pageMoved) return
    }
    if (!pageMoved) return
    // Nothing is kept here. Auto-keeping on every edit shattered the history into
    // micro-generations nobody asked for; a run is a batch someone decided to ship, and
    // `bin/keep.ts` is where that decision is made.
    process.stdout.write(`rebuilt  ${shipped().length} on the page, ${list().length} in the history\n`)
    for (const res of listeners) res.write('data: change\n\n')
  }, 80)
}

// The gallery is watched by its **resolved** path, not by the literal name: it is
// redirectable, and watching the wrong directory is a watcher that never fires while
// looking like it is working.
for (const dir of ['src', 'tunables', 'runs', galleryDir()]) {
  try {
    watch(dir, { recursive: true }, onChange)
  } catch {
    watch(dir, onChange)
  }
}
