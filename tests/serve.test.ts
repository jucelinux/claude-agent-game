import { spawn } from 'node:child_process'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { copyFileSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ROOT } from '../src/io/load.ts'

/**
 * The live bench is an instrument too, and its failure mode is the flattering one: a
 * watcher that quietly stops firing shows me **stale frames while I believe they are
 * fresh**, so I would read a defect as fixed. So it gets the same treatment as the rest —
 * it has to prove it fires when the output changes, and prove it stays quiet when it does
 * not, which is the null case for "the page updated".
 */

const TUNABLES = 'live-test'
const PATH = `${ROOT}tunables/_${TUNABLES}.json`
const NAME = `_${TUNABLES}`

let server: ChildProcessWithoutNullStreams
let base: string

function payload(): Promise<{ cells: { label?: string }[] }> {
  return fetch(`${base}/frames.json`).then((r) => r.json() as Promise<{ cells: { label?: string }[] }>)
}

/** Poll until the page reports `count` cells, or give up and say what it did report. */
async function until(count: number, ms = 6000): Promise<{ cells: { label?: string }[] }> {
  const deadline = Date.now() + ms
  let last = await payload()
  while (Date.now() < deadline) {
    if (last.cells.length === count) return last
    await new Promise((resolve) => setTimeout(resolve, 100))
    last = await payload()
  }
  return last
}

beforeAll(async () => {
  copyFileSync(`${ROOT}tunables/default.json`, PATH)
  // --no-keep: the suite must not write generations into the kept history.
  server = spawn(process.execPath, ['bin/serve.ts', '--tunables', NAME, '--port', '0', '--no-keep'], { cwd: ROOT })
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
})

describe('the live bench', () => {
  it('serves a page and the frames behind it', async () => {
    const html = await fetch(base).then((r) => r.text())
    expect(html).toContain('EventSource')
    expect(html).toContain('page.swap')

    const first = await payload()
    expect(first.cells.length).toBe(1)
    expect(first.cells[0]!.label).toMatch(/^fixture · [0-9a-f]{16}$/)
  })

  it('a change to a tunable swaps the frames and keeps the previous one beside it', async () => {
    const before = (await payload()).cells[0]!.label
    const text = readFileSync(PATH, 'utf8').replace('"swing": 0.08', '"swing": 0.13')
    expect(text).toContain('0.13')
    writeFileSync(PATH, text)

    const after = await until(2)
    expect(after.cells.length, 'the watcher never fired').toBe(2)
    expect(after.cells[0]!.label).not.toBe(before)
    // History: the previous generation stays on the page, told how old it is.
    expect(after.cells[1]!.label).toBe(`${before} · -1`)
  }, 20000)

  it('a change that does not change the output does not pretend it did', async () => {
    // The null case. Rewriting a watched file byte-for-byte fires the watcher; if the page
    // swapped on that, every "it changed" it ever reports would be worth nothing.
    const before = await payload()
    writeFileSync(PATH, readFileSync(PATH, 'utf8'))
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const after = await payload()

    expect(after.cells.length).toBe(before.cells.length)
    expect(after.cells.map((c) => c.label)).toEqual(before.cells.map((c) => c.label))
  }, 20000)
})
