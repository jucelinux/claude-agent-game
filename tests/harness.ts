/**
 * **The browser fake, and it lives here because it is now used by two games.**
 *
 * A runner page keeps its whole state in a closure and hands it out through `__last`, so driving
 * one headless needs a document, a window, a canvas context and a frame clock. Copying that into a
 * second test file would be two fakes with one name — and the record already paid for that lesson
 * at the engine level: *"a rule copied into three places is three rules"*, which is how the
 * skeleton's feet landed 15 px below the ground.
 *
 * **The context is deliberately strict where it can be.** `drawImage` throws unless it is handed
 * something the fake itself made, because a runtime passing a non-canvas is a defect a permissive
 * stub would swallow — and an instrument that flatters is the failure shape `HARNESS.md` §5 names.
 */
export type Harness = {
  state: () => { dist: number; y: number; jumps: number; state: string; menace: number; over: boolean; best: number }
  /** The camera, and the projection that SHIPS — never a copy of it written in a test file. */
  cam: () => { x: number; z: number; h: number; b: number }
  project: (x: number, y: number, z: number) => { x: number; y: number; k: number; fwd: number } | null
  scaleOf: (k: number, ladder: readonly number[], cur?: number) => number
  text: Record<string, string>
  tick: (now: number) => void
  key: (name: string, down: boolean) => void
}

export function run(html: string): Harness {
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'))
  const text: Record<string, string> = {}
  let pending: ((now: number) => void) | null = null
  let next = 0
  const makeCanvas = (): Record<string, unknown> => {
    const id = next++
    const ctx = {
      set imageSmoothingEnabled(_v: boolean) {},
      set fillStyle(_v: string) {},
      set globalAlpha(_v: number) {},
      set strokeStyle(_v: string) {},
      set lineWidth(_v: number) {},
      createImageData: (w: number, h: number) => {
        // The browser throws "Value is not of type 'long'" here; a fake that shrugs at NaN
        // approves the exact class of defect it exists to catch — a scene field that never
        // reached the payload sailed through this stub and died only on the real page.
        if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) {
          throw new TypeError(`createImageData(${w}, ${h}) — a browser would have thrown`)
        }
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }
      },
      putImageData: () => {},
      fillRect: () => {}, beginPath: () => {}, fill: () => {}, ellipse: () => {},
      // The path API, added when the arena's floor grid needed it. A fake that lacks a method
      // the real context has does not "pass" — it throws, which is at least loud; a fake that
      // SHRUGS is the flattering instrument this file's header is about.
      moveTo: () => {}, lineTo: () => {}, stroke: () => {}, closePath: () => {},
      drawImage: (src: { _canvas?: true }) => {
        if (src?._canvas !== true) throw new TypeError('drawImage got a non-canvas — a browser would have thrown')
      },
    }
    return { _id: id, _canvas: true as const, width: 0, height: 0, getContext: () => ctx }
  }
  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const sandbox = {
    document: {
      createElement: () => makeCanvas(),
      getElementById: (id: string) => ({
        appendChild: () => {}, className: '',
        set textContent(v: string) { text[id] = v },
        get textContent() { return text[id] ?? '' },
      }),
    },
    window: { addEventListener: (n: string, fn: (e: unknown) => void) => { (listeners[n] ??= []).push(fn) }, onerror: null },
    requestAnimationFrame: (fn: (now: number) => void) => { pending = fn },
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    Math,
  }
  let mounted: unknown = null
  const capture = { ...sandbox, __capture: (m: unknown) => { mounted = m } }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...Object.keys(capture), `${script}\n__capture(__last)`)(...Object.values(capture))
  return {
    state: () => (mounted as { state: () => ReturnType<Harness['state']> }).state(),
    cam: () => (mounted as { cam: () => ReturnType<Harness['cam']> }).cam(),
    project: (x: number, y: number, z: number) => (mounted as { project: Harness['project'] }).project(x, y, z),
    scaleOf: (k: number, ladder: readonly number[], cur?: number) =>
      (mounted as { scaleOf: Harness['scaleOf'] }).scaleOf(k, ladder, cur),
    text,
    tick: (now: number) => { const fn = pending; pending = null; fn?.(now) },
    key: (name: string, down: boolean) => {
      for (const fn of listeners[down ? 'keydown' : 'keyup'] ?? []) fn({ key: name, preventDefault: () => {} })
    },
  }
}

