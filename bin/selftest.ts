/**
 * The viewer's null case, **made visible instead of trusted** (`HARNESS.md` §5).
 *
 *   node bin/selftest.ts   -> .out/selftest.html
 *
 * Three cells whose answer I already know. If the page cannot separate them, its output
 * is worth less than no output — and note the direction of each failure: every one of them
 * makes the sheet *flatter* the sprite it is supposed to expose.
 *
 * stack — these buffers are viewer fixtures, portable to nothing.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import type { RGB } from '../src/core/types.ts'
import { emit } from '../src/viewer/page.ts'
import { loadParams } from '../src/io/load.ts'

const PALETTE: RGB[] = [
  [0, 0, 0], // 0 — transparent ground
  [26, 28, 36], // 1 — dark
  [222, 226, 233], // 2 — light
]

const SIZE = 16

/** 1 px checkerboard. At an integer scale with smoothing off it must stay hard-edged. */
function checkerboard(): Uint8Array {
  const px = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) px[y * SIZE + x] = (x + y) % 2 === 0 ? 1 : 2
  return px
}

/** A ring: the hole must show the page's grey, not a black box. */
function ring(): Uint8Array {
  const px = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const edge = x < 3 || y < 3 || x >= SIZE - 3 || y >= SIZE - 3
      if (edge) px[y * SIZE + x] = 2
    }
  }
  return px
}

/** A 3x3 marker, one pixel further right each frame. */
function marker(offset: number): Uint8Array {
  const px = new Uint8Array(SIZE * SIZE)
  for (let y = 6; y < 9; y++) for (let x = 2 + offset; x < 5 + offset; x++) px[y * SIZE + x] = 1
  return px
}

const params = loadParams('default')
const html = emit({
  mode: 'selftest',
  scale: params.playback.scale,
  msPerFrame: params.playback.msPerFrame,
  title: 'claude-ink-2d · selftest',
  notes: [
    'Null case for the viewer. Look once, and know what each failure would mean.',
    '',
    '1  checkerboard — must be hard 1 px squares, blown up to crisp blocks. If it is soft or',
    '   grey-ish, smoothing is on, and smoothing makes my sprite look better than it is.',
    '2  ring — the hole must show this page grey. If it shows black, index 0 is being painted,',
    '   and every cell of mine would carry a background the published loops do not have.',
    '3  static — four identical frames. It must not move.',
    '4  moving — one pixel per frame. It must move, at the same rate cell 3 is standing still.',
    '   If 3 and 4 look alike, the tick is dead and the whole sheet is a still.',
  ],
  cells: [
    { w: SIZE, h: SIZE, palette: PALETTE, label: '1 checkerboard', frames: [checkerboard()] },
    { w: SIZE, h: SIZE, palette: PALETTE, label: '2 ring', frames: [ring()] },
    { w: SIZE, h: SIZE, palette: PALETTE, label: '3 static', frames: [marker(0), marker(0), marker(0), marker(0)] },
    { w: SIZE, h: SIZE, palette: PALETTE, label: '4 moving', frames: [marker(0), marker(1), marker(2), marker(3)] },
  ],
})

mkdirSync('.out', { recursive: true })
writeFileSync('.out/selftest.html', html)
process.stdout.write('.out/selftest.html\n')
