/**
 * The bench that stays open.
 *
 *   node bin/serve.ts [runs…] [--set path=value] [--port 5173]
 *
 * Open the URL once. Editing a grammar, a tunable or the core re-executes the run and
 * pushes the frames; the page swaps them **under a loop that never stops**, so the change
 * is seen in motion rather than in a reload. Every regeneration that actually changes the
 * output pushes the previous one into a history strip beside it — the last few variants,
 * side by side, all on the same tick. That is the harness accumulating instead of resetting.
 *
 * The gate never comes through here. A sheet that can change under the human mid-reading is
 * not a reading; his page stays a frozen file (`bin/view.ts --mode gate`).
 *
 * `node:http` and `node:fs` only — nothing added to the stack.
 */
import { execFileSync } from 'node:child_process'
import { watch } from 'node:fs'
import { createServer } from 'node:http'
import type { ServerResponse } from 'node:http'
import { loadParams } from '../src/io/load.ts'
import { emit } from '../src/viewer/page.ts'

type Cell = { label?: string; [key: string]: unknown }
type Payload = { scale: number; msPerFrame: number; cells: Cell[] }

const argv = process.argv.slice(2)
const portFlag = argv.indexOf('--port')
const port = portFlag >= 0 ? Number(argv[portFlag + 1]) : 5173
const noKeep = argv.includes('--no-keep')
const forwarded = argv.filter((a, i) => i !== portFlag && i !== portFlag + 1 && a !== '--no-keep')

const params = loadParams('default')
const HISTORY = params.playback.history

function compute(): Payload {
  const out = execFileSync(process.execPath, ['bin/payload.ts', ...forwarded], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return JSON.parse(out) as Payload
}

let current = compute()
let history: Cell[][] = []

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
  history.unshift(current.cells)
  history = history.slice(0, HISTORY)
  current = next
  return true
}

/** Newest first, then the history, each cell told how old it is. */
function payload(): string {
  const cells: Cell[] = [...current.cells]
  history.forEach((generation, age) => {
    for (const cell of generation) cells.push({ ...cell, label: `${cell.label ?? ''} · -${age + 1}` })
  })
  return JSON.stringify({ mode: 'live', scale: current.scale, msPerFrame: current.msPerFrame, cells })
}

const listeners = new Set<ServerResponse>()

const shell = emit({
  mode: 'live',
  scale: current.scale,
  msPerFrame: current.msPerFrame,
  cells: [],
  title: 'claude-ink-2d · live',
  notes: ['space pauses · left and right step a frame · newest run first, history to its right'],
})

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
  res.end(shell)
})

server.listen(port, () => {
  const address = server.address()
  const bound = typeof address === 'object' && address !== null ? address.port : port
  process.stdout.write(`http://localhost:${bound}  —  watching src, tunables, runs\n`)
})

let pending: NodeJS.Timeout | null = null
function onChange(): void {
  if (pending !== null) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = null
    if (!refresh()) return
    // The moment the output changes is exactly the moment worth keeping — the live page
    // already computed it, and a generation nobody kept cannot be compared to later.
    // Except under test: a suite that writes to the history makes the history a rumour.
    if (!noKeep) {
      try {
        execFileSync(process.execPath, ['bin/keep.ts', ...forwarded, '--note', 'live'], { encoding: 'utf8' })
      } catch (error) {
        process.stderr.write(`could not keep this generation: ${String(error).split('\n')[0]}\n`)
      }
    }
    process.stdout.write(`swapped  ${current.cells.map((c) => c['label']).join('  ')}\n`)
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
