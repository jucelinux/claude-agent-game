/**
 * **The only surface.** One page, opened once, never regenerated as a file.
 *
 *   node bin/serve.ts [runs…] [--set path=value] [--port 5173]
 *
 *   /           the live run, and the whole kept history behind it
 *   /selftest   the viewer's null case, always available
 *   /frames.json, /events   what the page pulls and what wakes it up
 *
 * Editing a grammar, a tunable or the core re-executes the run in a **fresh process** — no
 * module cache to serve stale frames — and the page swaps them under a loop that never
 * stops. Every generation with a new hash is kept in `gallery/` on the way past, so the
 * history on screen is the history on disk: nothing to remember to regenerate.
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
import { cellOf, list } from '../src/io/gallery.ts'
import { emit } from '../src/viewer/page.ts'
import { SELFTEST } from '../src/viewer/selftest.ts'

type Cell = { label?: string; [key: string]: unknown }
type Payload = { scale: number; msPerFrame: number; cells: Cell[] }

const argv = process.argv.slice(2)
const portFlag = argv.indexOf('--port')
const port = portFlag >= 0 ? Number(argv[portFlag + 1]) : 5173
const forwarded = argv.filter((_, i) => i !== portFlag && i !== portFlag + 1)

function compute(): Payload {
  const out = execFileSync(process.execPath, ['bin/payload.ts', ...forwarded], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return JSON.parse(out) as Payload
}

let current = compute()

function identity(payload: Payload): string {
  return payload.cells.map((c) => String(c['indices']).length + ':' + String(c['label'])).join('|')
}

function refresh(): boolean {
  let next: Payload
  try {
    next = compute()
  } catch (error) {
    process.stderr.write(`\n${String(error).split('\n').slice(0, 6).join('\n')}\n`)
    return false
  }
  if (identity(next) === identity(current)) return false
  current = next
  return true
}

/**
 * The live run first, then everything ever kept, newest behind it. The thing being worked
 * on stays at the top left and the past trails away from it — which is the shape of the
 * only question the gate asks: **did it move?**
 */
function payload(): string {
  const kept = list().reverse().map(cellOf)
  const cells: Cell[] = [
    ...current.cells,
    ...kept.map((cell) => ({
      w: cell.w,
      h: cell.h,
      n: cell.frames.length,
      palette: cell.palette,
      indices: Buffer.concat(cell.frames.map((f) => Buffer.from(f))).toString('base64'),
      label: cell.label,
      scale: cell.scale,
      msPerFrame: cell.msPerFrame,
      summary: cell.summary,
    })),
  ]
  return JSON.stringify({ mode: 'live', scale: current.scale, msPerFrame: current.msPerFrame, cells })
}

const listeners = new Set<ServerResponse>()

const shell = emit({
  mode: 'live',
  scale: current.scale,
  msPerFrame: current.msPerFrame,
  cells: [],
  title: 'claude-ink-2d',
  notes: ['left and right arrows walk the history · space pauses · , and . step one frame'],
})
const selftest = emit(SELFTEST)

const server = createServer((req, res) => {
  if (req.url === '/frames.json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(payload())
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
  process.stdout.write(`http://localhost:${bound}       the live run and every kept generation\n`)
  process.stdout.write(`http://localhost:${bound}/selftest   the viewer's null case\n`)
  process.stdout.write(`watching src, tunables, runs · ${list().length} generations kept\n`)
})

let pending: NodeJS.Timeout | null = null
function onChange(): void {
  if (pending !== null) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = null
    if (!refresh()) return
    // The moment the output changes is the moment worth keeping: the page has it, and a
    // generation nobody kept cannot be compared to later.
    try {
      execFileSync(process.execPath, ['bin/keep.ts', ...forwarded, '--note', 'live'], { encoding: 'utf8' })
    } catch (error) {
      process.stderr.write(`could not keep this generation: ${String(error).split('\n')[0]}\n`)
    }
    process.stdout.write(`swapped  ${current.cells.map((c) => c['label']).join('  ')}  ·  ${list().length} kept\n`)
    for (const res of listeners) res.write('data: change\n\n')
  }, 80)
}

for (const dir of ['src', 'tunables', 'runs']) {
  try {
    watch(dir, { recursive: true }, onChange)
  } catch {
    watch(dir, onChange)
  }
}
