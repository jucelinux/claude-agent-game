import { spawn } from 'node:child_process'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { copyFileSync, mkdtempSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ROOT } from '../src/io/load.ts'

/**
 * The live bench is an instrument too, and its failure mode is the flattering one: a
 * watcher that quietly stops firing shows me **stale frames while I believe they are
 * fresh**, so I would read a defect as fixed. It has to prove it fires when the output
 * changes, stay quiet when it does not, and — since the history now lives on the same page
 * — prove that a change actually reaches the kept history rather than only the screen.
 *
 * The gallery is redirected at a throwaway directory for the run. The first version of this
 * protected the real history with a `--no-keep` flag, which is protection by convention and
 * also switched off the very thing worth testing.
 */

const TUNABLES = '_live-test'
const PATH = `${ROOT}tunables/${TUNABLES}.json`
let gallery: string
let server: ChildProcessWithoutNullStreams
let base: string

type Cell = { label?: string }
const payload = (): Promise<{ cells: Cell[] }> =>
  fetch(`${base}/frames.json`).then((r) => r.json() as Promise<{ cells: Cell[] }>)

async function until(predicate: (p: { cells: Cell[] }) => boolean, ms = 8000): Promise<{ cells: Cell[] }> {
  const deadline = Date.now() + ms
  let last = await payload()
  while (Date.now() < deadline && !predicate(last)) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    last = await payload()
  }
  return last
}

beforeAll(async () => {
  gallery = mkdtempSync(`${tmpdir()}/ink-gallery-`)
  copyFileSync(`${ROOT}tunables/default.json`, PATH)
  server = spawn(process.execPath, ['bin/serve.ts', '--tunables', TUNABLES, '--port', '0'], {
    cwd: ROOT,
    env: { ...process.env, INK_GALLERY: gallery },
  })
  base = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('the server never announced a port')), 15000)
    server.stdout.on('data', (chunk: Buffer) => {
      const match = chunk.toString().match(/http:\/\/localhost:\d+/)
      if (match !== null) {
        clearTimeout(timer)
        resolve(match[0])
      }
    })
  })
}, 20000)

afterAll(() => {
  server?.kill()
  rmSync(PATH, { force: true })
  rmSync(gallery, { recursive: true, force: true })
})

describe('the live bench', () => {
  it('serves the page, the self-test, and the frames behind them', async () => {
    const html = await fetch(base).then((r) => r.text())
    expect(html).toContain('EventSource')
    expect(html).toContain('page.swap')

    // The null case is served, not generated into a file somebody has to remember to make.
    const selftest = await fetch(`${base}/selftest`).then((r) => r.text())
    expect(selftest).toContain('checkerboard')
    expect(selftest).not.toContain('EventSource')

    const first = await payload()
    expect(first.cells.length).toBe(1) // live only: the throwaway gallery starts empty
    expect(first.cells[0]!.label).toMatch(/^fixture · [0-9a-f]{16}$/)
  })

  it('a change swaps the frames, is kept, and joins the history on the page', async () => {
    const before = (await payload()).cells[0]!.label
    writeFileSync(PATH, readFileSync(PATH, 'utf8').replace('"swing": 0.08', '"swing": 0.13'))

    const after = await until((p) => p.cells.length === 2)
    expect(after.cells.length, 'the watcher never fired').toBe(2)
    expect(after.cells[0]!.label).not.toBe(before)
    // The history is on disk, not in the server's memory: it survives a restart, and it is
    // what makes "did it move?" answerable weeks later.
    expect(readdirSync(gallery).filter((f) => f.endsWith('.json')).length).toBe(1)
    expect(after.cells[1]!.label).toContain('fixture')
  }, 25000)

  it('a change that does not change the output does not pretend it did', async () => {
    // Rewriting a watched file byte-for-byte fires the watcher; if the page swapped on
    // that, every "it changed" it ever reports would be worth nothing — and the history
    // would fill with duplicates of the same generation.
    const before = await payload()
    writeFileSync(PATH, readFileSync(PATH, 'utf8'))
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const after = await payload()

    expect(after.cells.map((c) => c.label)).toEqual(before.cells.map((c) => c.label))
    expect(readdirSync(gallery).filter((f) => f.endsWith('.json')).length).toBe(1)
  }, 25000)
})
