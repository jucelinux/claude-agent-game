/**
 * **The golden trace: what the runtime DREW, as a number.**
 *
 * This exists for one job — a refactor that moves 2000 lines of runtime out of a template
 * literal and into typed modules has to prove it changed nothing. No test asserts "the picture
 * is the same"; every lock asserts some property of it. So this records the actual sequence of
 * canvas calls a game makes over a fixed number of frames, with a fixed input script, and
 * folds it into one hash.
 *
 * **It is not a picture and it is not a substitute for one.** It cannot see colour choices the
 * palette makes, and it would not notice a game that draws the right calls in the right order
 * with the wrong sprite in the atlas. What it CAN say is the thing the refactor needs said:
 * *the drawing decisions are byte-identical to the ones the string version made*.
 *
 * The input script is fixed and shared, so two runs differ only if the code differs. Every
 * game is driven with the same keys whether it uses them or not — a game that ignores a key
 * still has to ignore it identically.
 */

/** One recorded canvas call, flattened to a string so the fold is order-sensitive. */
type Call = string

export type Trace = { readonly hash: string; readonly calls: number; readonly sample: readonly Call[] }

/** A 64-bit-ish fold over the call strings. Cheap, order-sensitive, deterministic. */
function fold(calls: readonly Call[]): string {
  let a = 0x811c9dc5
  let b = 0x01000193
  for (const c of calls) {
    for (let i = 0; i < c.length; i++) {
      a = Math.imul(a ^ c.charCodeAt(i), 16777619) >>> 0
      b = (Math.imul(b + c.charCodeAt(i), 2654435761) ^ (b >>> 15)) >>> 0
    }
    a = (a ^ 0x9e3779b9) >>> 0
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')
}

/** Numbers are rounded to a thousandth: a trace must not be a floating-point diff. */
const n = (v: unknown): string =>
  typeof v === 'number' ? (Number.isFinite(v) ? (Math.round(v * 1000) / 1000).toString() : `!${v}`) : String(v)

/**
 * **The recording context.** Every method the runtime uses, recording its arguments. Anything
 * the runtime calls that is NOT here throws, exactly as the strict fake in `harness.ts` does —
 * a recorder that silently ignores a call is a recorder that says two different pictures are
 * the same one.
 */
export function recorder(calls: Call[], id: number): Record<string, unknown> {
  const put = (name: string, ...args: unknown[]): void => { calls.push(`${id}.${name}(${args.map(n).join(',')})`) }
  const ctx = {
    set imageSmoothingEnabled(v: boolean) { put('smooth', v) },
    set fillStyle(v: string) { put('fill=', v) },
    set strokeStyle(v: string) { put('stroke=', v) },
    set globalAlpha(v: number) { put('alpha=', v) },
    set lineWidth(v: number) { put('lw=', v) },
    createImageData: (w: number, h: number) => {
      if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) {
        throw new TypeError(`createImageData(${w}, ${h}) — a browser would have thrown`)
      }
      put('imageData', w, h)
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }
    },
    putImageData: () => put('putImageData'),
    fillRect: (...a: number[]) => put('fillRect', ...a),
    beginPath: () => put('beginPath'),
    closePath: () => put('closePath'),
    fill: () => put('fill'),
    stroke: () => put('stroke'),
    moveTo: (...a: number[]) => put('moveTo', ...a),
    lineTo: (...a: number[]) => put('lineTo', ...a),
    ellipse: (...a: number[]) => put('ellipse', ...a),
    drawImage: (src: { _id?: number; _canvas?: true }, ...rest: number[]) => {
      if (src?._canvas !== true) throw new TypeError('drawImage got a non-canvas — a browser would have thrown')
      put('drawImage', src._id ?? -1, ...rest)
    },
  }
  return ctx as unknown as Record<string, unknown>
}

/**
 * **The input script, and it is deliberately the same for every game.**
 *
 * Frame numbers, not seconds, so it is independent of the clock. It presses every key the
 * shelf uses, holds each for a while, and overlaps two of them — because a game that reads
 * two keys at once is a game whose input merge has to be recorded too.
 */
export const SCRIPT: readonly (readonly [number, string, boolean])[] = [
  [10, 'ArrowRight', true], [40, 'ArrowRight', false],
  [45, ' ', true], [47, ' ', false],
  [60, 'ArrowLeft', true], [90, 'ArrowLeft', false],
  [95, 'ArrowUp', true], [130, 'ArrowUp', false],
  [100, 'x', true], [140, 'x', false],
  [150, ' ', true], [152, ' ', false],
  [160, 'ArrowRight', true], [165, 'ArrowUp', true],
  [200, 'ArrowRight', false], [205, 'ArrowUp', false],
  [210, 'ArrowDown', true], [240, 'ArrowDown', false],
  [250, 'z', true], [252, 'z', false],
]

/** How many frames every trace runs. 300 at 16.67 ms is five seconds of play. */
export const FRAMES = 300

/**
 * **Drive one game's page through the fixed script and fold what it drew.**
 *
 * The frame clock is fixed at 16.67 ms and never reads a real one, so the trace is a property
 * of the code and of nothing else. `run` is the shared fake browser; only the eye differs.
 */
export function traceOf(
  html: string,
  run: (h: string, f?: (id: number) => Record<string, unknown>) => {
    tick: (now: number) => void
    key: (name: string, down: boolean) => void
  },
  script: readonly (readonly [number, string, boolean])[] = SCRIPT,
): Trace {
  const calls: Call[] = []
  const h = run(html, (id) => recorder(calls, id))
  for (let f = 0; f < FRAMES; f++) {
    for (const [at, key, down] of script) if (at === f) h.key(key, down)
    h.tick(f * 16.67)
  }
  return { hash: fold(calls), calls: calls.length, sample: calls.slice(0, 6) }
}
