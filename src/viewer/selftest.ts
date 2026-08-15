/**
 * The viewer's null case, **made visible instead of trusted** (`HARNESS.md` §5).
 *
 * It lives beside the live bench at `/selftest` rather than in a file, because an
 * instrument you have to remember to regenerate is an instrument that stops being run.
 *
 * stack — these buffers are viewer fixtures, portable to nothing.
 */
import type { RGB } from '../core/types.ts'
import type { ViewCell, ViewSpec } from './page.ts'

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

const CELLS: ViewCell[] = [
  { w: SIZE, h: SIZE, palette: PALETTE, label: '1 checkerboard', frames: [checkerboard()], scale: 8 },
  { w: SIZE, h: SIZE, palette: PALETTE, label: '2 ring', frames: [ring()], scale: 8 },
  { w: SIZE, h: SIZE, palette: PALETTE, label: '3 static', frames: [marker(0), marker(0), marker(0), marker(0)], scale: 8 },
  { w: SIZE, h: SIZE, palette: PALETTE, label: '4 moving', frames: [marker(0), marker(1), marker(2), marker(3)], scale: 8 },
]

export const SELFTEST: ViewSpec = {
  mode: 'selftest',
  scale: 8,
  msPerFrame: 150,
  title: 'claude-ink-2d · selftest',
  // The one page that keeps a mid grey while everything else went black. Reason on GROUND:
  // a ground that can swallow a dark defect cannot be the page that proves defects show.
  ground: '#6b6b6b',
  notes: [
    'Null case for the viewer. Look once, and know what each failure would mean.',
    'This page stays grey while the rest went black — a black ground would hide case 2.',
    '',
    '1  checkerboard — must be hard 1 px squares, blown up to crisp blocks. If it is soft or',
    '   grey-ish, smoothing is on, and smoothing makes my sprite look better than it is.',
    '2  ring — the hole must show this page grey. If it shows black, index 0 is being painted,',
    '   and every cell of mine would carry a background the published loops do not have.',
    '3  static — four identical frames. It must not move.',
    '4  moving — one pixel per frame. It must move, at the same rate cell 3 is standing still.',
    '   If 3 and 4 look alike, the tick is dead and the whole sheet is a still.',
  ],
  cells: CELLS,
}
