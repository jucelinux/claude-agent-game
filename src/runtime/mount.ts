/**
 * **Mount: build the world once, then run one shape's loop for ever.**
 *
 * This file used to be two thousand lines. It is now the part that is genuinely common to every
 * game — the canvases, the backdrop, the key latch, the frame clock and the meter — plus a
 * dispatcher. **The dispatch is the change worth reading.** There were four near-identical
 * early-return blocks in the old loop, one per shape, each repeating the blit, the meter push,
 * the report and the request; a fifth game meant a fifth copy, and a fix to the sequence meant
 * four edits. Now every shape is a `Shape`, and the loop does not know how many there are.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { ctx2d, cv, decode } from './canvas.ts'
import { rgb } from './paint.ts'
import { makeRain } from './rain.ts'
import { makeClimb } from './climb.ts'
import { makeRunner } from './runner.ts'
import { makeDescent } from './descent.ts'
import { makeArena } from './arena.ts'
import { makePlatformer } from './platformer.ts'
import { makeStage } from './stage.ts'
import type { Canvas, Keys, KeyEvent, Payload, Shape } from './types.ts'

export function mount(el: HTMLElement, S: Payload) {
  var view = cv(S.w * S.scale, S.h * S.scale)
  var vx = ctx2d(view); vx.imageSmoothingEnabled = false
  var off = cv(S.w, S.h), ox = ctx2d(off)
  var decodeAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0
  var sheets = S.layers.map(decode)
  var decodeMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : 0) - decodeAt

  // The backdrop never changes, so it is drawn once and copied. The floor's colour per row
  // arrives already computed: the recede is one rule and it is applied in one place, or the
  // page and the compositor put the horizon in two different rows.
  var bg = cv(S.w, S.h), bx = ctx2d(bg)
  bx.fillStyle = rgb(S.sky); bx.fillRect(0, 0, S.w, S.h)
  // **Stars go into the backdrop, not into a field.** A field is evaluated per pixel per
  // frame because it moves; a fixed sky does not. Same integer hash the rain uses, so the
  // pattern is irregular and identical on every machine.
  if (S.stars) {
    for (var si = 0; si < S.stars.count; si++) {
      var sh1 = ((si + S.stars.seed) * 2654435761) >>> 0; sh1 = (sh1 ^ (sh1 >>> 13)) >>> 0
      var sh2 = (sh1 * 1597334677) >>> 0; sh2 = (sh2 ^ (sh2 >>> 15)) >>> 0
      bx.fillStyle = rgb(S.stars.colors[sh2 % S.stars.colors.length]!)
      bx.fillRect(sh1 % S.w, sh2 % S.stars.below, 1, 1)
    }
  }
  for (var y = 0; y < S.floor.length; y++) {
    bx.fillStyle = rgb(S.floor[y]!); bx.fillRect(0, S.ground + y, S.w, 1)
  }
  // **Dust.** Same hash as the stars, thrown over the floor instead of the sky. Regolith is
  // powder, and a flat fill reads as a tile however well its value is graded.
  if (S.dust) {
    var band = S.h - S.ground
    for (var di = 0; di < S.dust.count; di++) {
      var dh = ((di + S.dust.seed) * 2654435761) >>> 0; dh = (dh ^ (dh >>> 13)) >>> 0
      var dh2 = (dh * 1597334677) >>> 0; dh2 = (dh2 ^ (dh2 >>> 15)) >>> 0
      bx.fillStyle = rgb(S.dust.colors[dh2 % S.dust.colors.length]!)
      bx.fillRect(dh % S.w, S.ground + (dh2 % band), 1, 1)
    }
  }


  /**
   * **Input is a TIMELINE, not a poll, and that is what makes a replay exact.**
   *
   * Every event carries the moment it happened, and the loop applies it to the SIMULATION STEP
   * it belongs to rather than to whichever frame happened to notice it. Without that, the same
   * play produces a different game at a different refresh rate — not because the simulation
   * drifts, but because a 144 Hz screen samples the keyboard at moments a 60 Hz screen never
   * visits. Measured: one step of steer, every time, on the climb.
   *
   * It also makes a recording trivial and honest. A recorded play is exactly this list — a
   * timestamp, a key, and up or down — and replaying it cannot diverge, because the loop already
   * treats live input as a list of the same shape.
   */
  const keys: Keys = {}
  const timeline: { at: number; key: string; down: boolean }[] = []
  /**
   * **Everything that was pressed, kept.** The loop consumes `timeline`; this keeps the same
   * events so a play can be written out and handed back. A recording IS this list, which is the
   * dividend of treating live input as a timeline in the first place — the recorder needed no
   * new concept, only a second reference.
   */
  const log: { at: number; key: string; down: boolean }[] = []
  if (S.interactive) {
    const record = function (e: KeyEvent, v: boolean): void {
      const k = e.key
      if (!WATCHED.test(k)) return
      // The event's own clock, which is the same one `requestAnimationFrame` is given.
      const ev = { at: typeof e.timeStamp === 'number' ? e.timeStamp : 0, key: k, down: v }
      timeline.push(ev)
      log.push(ev)
      e.preventDefault()
    }
    window.addEventListener('keydown', function (e: KeyEvent) { record(e, true) })
    window.addEventListener('keyup', function (e: KeyEvent) { record(e, false) })
  }

  /**
   * **One event, folded into the latched state.** A press is LATCHED and not sampled: a tap that
   * begins and ends between two steps is invisible to a loop that only reads the key's current
   * level, and at 120 steps a second that is an 8 ms window a person hits regularly. The edge is
   * consumed by the shape, so the input survives the gap rather than falling into it.
   */
  function apply(k: string, v: boolean): void {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = v
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = v
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = v
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = v
    var actionKey = k.length === 1 ? k.toLowerCase() : k
    if (S.actions.primary.includes(actionKey)) {
      if (v && !keys.primary) keys.primaryTap = true
      keys.primary = v
    }
    if (S.actions.secondary.includes(actionKey)) {
      if (v && !keys.secondary) keys.secondaryTap = true
      keys.secondary = v
    }
    if (k === 'r' || k === 'R') { if (v) keys.restartTap = true }
    if (k === 'm' || k === 'M') { if (v) keys.muteTap = true }
  }

  /** Everything the shelf reads. Anything else is left to the page. */
  const WATCHED = /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|[adwsxzrmADWSXZRM]| )$/

  var clock = (typeof performance !== 'undefined' && performance.now)
    ? function () { return performance.now() } : function () { return 0 }
  const meter: { gaps: number[]; work: number[]; at: number; worst: number; decode: number } =
    { gaps: [], work: [], at: 0, worst: 0, decode: 0 }
  meter.decode = decodeMs

  function report(now: number) {
    if (!S.meter || now - meter.at < 500) return
    meter.at = now
    var el = document.getElementById('meter'); if (!el) return
    var g = meter.gaps, w = meter.work
    if (g.length === 0) return
    var sg = 0, sw = 0, mx = 0
    for (var i = 0; i < g.length; i++) { sg += g[i]!; sw += w[i]!; if (w[i]! > mx) mx = w[i]! }
    el.textContent =
      Math.round(1000 / (sg / g.length)) + ' fps' +
      '  ·  work ' + (sw / w.length).toFixed(2) + ' ms, worst ' + mx.toFixed(2) + ' ms' +
      '  ·  budget 16.67 ms' +
      '  ·  decode ' + meter.decode.toFixed(0) + ' ms'
    meter.gaps = []; meter.work = []
  }


  /**
   * Which slot each blit in the last frame belongs to, in call order. A subject that is off
   * screen is not drawn at all, so position in the call list is not position in the scene —
   * and any harness reading the loop from outside needs to be told which is which.
   */
  const drawn: number[] = []


  /**
   * **The six shapes, built once, asked once.** Each owns its own state inside its own module
   * scope; the first that says it is active gets the loop, and the fixed stage is last because
   * it is the fallback rather than a claim.
   */
  /**
   * **Built in one order and asked in another, and both orders are load-bearing.**
   *
   * A shape bakes its backdrop when it is built, so CONSTRUCTION order decides which canvas is
   * which — and `tests/golden.test.ts` records canvas identity, so this order is the file order
   * the closure had. The rain is last for the same reason, behind one indirection so the shapes
   * can hold it before it exists.
   *
   * DISPATCH order is a different question: which shape owns the loop. The runner is asked
   * first and the fixed stage last, because the stage is the fallback rather than a claim.
   */
  let rainOf: ((t: number) => void) | null = null
  var shared = { S: S, ox: ox, bg: bg, sheets: sheets, keys: keys, drawn: drawn, cv: cv,
                 rain: function (t: number) { if (rainOf !== null) rainOf(t) } }
  var climb = makeClimb(shared)
  var runner = makeRunner(shared)
  var arena = makeArena(shared)
  var descent = makeDescent(shared)
  var stage = makeStage(shared)
  // Added after every shipped shape so their construction-time canvas identities remain exact.
  var platformer = makePlatformer(shared)
  rainOf = makeRain(S, ox, cv)

  var shapes = [runner, arena, descent, platformer, climb, stage]
  let shape: Shape = stage
  for (const s of shapes) { if (s.active) { shape = s; break } }

  /**
   * **The fixed timestep, and it is a stated prerequisite this loop did not meet.**
   *
   * `CLAUDE.md` §Architecture says *a recorded input replays identically*. The loop integrated
   * against `now - prev` — the real elapsed frame time — so the same key sequence produced a
   * different game on a 144 Hz screen than on a 60 Hz one. **The locks could not see it**,
   * because `tests/harness.ts` feeds a fixed 16.67 ms tick: the instrument was testing a
   * determinism the product did not have, which is the fifth occurrence of that shape and the
   * first found by reading the build order rather than by a defect.
   *
   * The simulation now advances in whole steps of `STEP` and nothing else. A slow frame runs
   * several; a fast one runs none and redraws the same state, which is correct — the picture is
   * a function of the state and the state only moves in steps.
   *
   * `MAX_CATCHUP` is the spiral-of-death bound: a tab that was in the background for a minute
   * must not try to simulate a minute when it wakes. It drops the backlog and says so by simply
   * carrying on, which is what every fixed-step loop does and the only honest thing available —
   * the alternative is a hang.
   */
  const HZ = 120
  const STEP = 1 / HZ
  const MAX_CATCHUP = 8
  let t0: number | null = null
  /** How many whole steps the simulation has run. An integer, deliberately. */
  let done = 0
  let prevReal = 0
  let running = true
  let queued = false
  let rebaseClock = false

  function queue(): void {
    if (running && !queued) {
      queued = true
      requestAnimationFrame(frame)
    }
  }

  function frame(now: number) {
    queued = false
    if (!running) return
    var began = clock()
    if (t0 === null) t0 = now
    if (rebaseClock) {
      // A shelf card may have been outside the viewport for minutes. Preserve the number of
      // simulated steps and move the origin instead of treating that absence as catch-up work.
      t0 = now - (done * 1000) / HZ
      prevReal = 0
      rebaseClock = false
    }
    /**
     * **Whole milliseconds, and the rounding is what makes the claim exact.**
     *
     * The number of steps owed at a given moment is `floor(ms · 120 / 1000)` — integer
     * arithmetic on an integer, so two machines at two refresh rates that reach the same
     * millisecond have run the same number of steps. Carrying the browser's fractional
     * timestamp instead leaves a residue that lands either side of a step boundary, and the
     * two runs then differ by one step for ever after.
     */
    const ms = Math.round(now - t0)
    const real = ms / 1000
    // 120 frames is two seconds at 60 fps: long enough that one slow frame does not dominate
    // the average, short enough that a stall shows up while it is still happening.
    if (prevReal > 0) { meter.gaps.push((real - prevReal) * 1000); if (meter.gaps.length > 120) meter.gaps.shift() }
    prevReal = real

    /**
     * **The simulation advances in whole steps and nothing else, which is the prerequisite
     * `CLAUDE.md` states and this loop did not meet.** It integrated against the real elapsed
     * frame time, so the same keys produced a different game on a 144 Hz screen than on a 60 Hz
     * one — and no lock could see it, because the harness feeds a fixed tick.
     *
     * `MAX_CATCHUP` bounds the spiral of death: a tab that was in the background for a minute
     * must not try to simulate a minute when it wakes. It drops the backlog, which is what every
     * fixed-step loop does and the only honest option — the alternative is a hang.
     */
    const owed = Math.floor((ms * HZ) / 1000)
    let steps = 0
    while (done < owed && steps < MAX_CATCHUP) {
      done++; steps++
      // Everything that happened up to the END of this step, applied before it runs. The step
      // therefore sees the same input on every machine, whatever its screen does.
      const upTo = t0 + (done * 1000) / HZ
      while (timeline.length > 0 && timeline[0]!.at <= upTo) {
        const ev = timeline.shift()!
        apply(ev.key, ev.down)
      }
      shape.step(done * STEP, STEP)
    }
    if (done < owed) {
      // Dropped a backlog: the events it would have consumed still have to land, or a key
      // pressed during a stall would stay down for ever.
      done = owed
      const upTo = t0 + (done * 1000) / HZ
      while (timeline.length > 0 && timeline[0]!.at <= upTo) { const ev = timeline.shift()!; apply(ev.key, ev.down) }
    }

    drawn.length = 0
    shape.draw(done * STEP)
    vx.drawImage(off, 0, 0, view.width, view.height)
    meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
    report(now)
    shape.score(now)
    queue()
  }

  el.appendChild(view)
  queue()

  /**
   * **What the loop is thinking, readable from outside it.**
   *
   * `drawn` has always been here: which slot each blit belongs to, because a subject that is off
   * screen is not drawn and position in the call list is not position in the scene. `state` is
   * the same idea one level up, and it exists because a scrolling game cannot be diagnosed from
   * its draw calls at all — a screen row is a world row minus a camera, and neither of the two
   * is recoverable from their difference.
   *
   * `project` and `scaleOf` are handed out for one reason: the framing lock has to drive the
   * SHIPPED projection. The lock that came before it re-implemented one inside the test file and
   * so never noticed that this one read a heading in turns as if it were radians.
   */
  return {
    view: view, drawn: drawn,
    /**
     * **A play, as the file `bin/play.ts` reads.** Times are relative to the first frame, so a
     * recording is independent of when the tab was opened. `feed` is the other direction: hand
     * back a play and it runs exactly as it did, because the loop applies an event to the
     * simulation step it belongs to and not to the frame that noticed it.
     */
    log: function () {
      const base = t0 === null ? 0 : t0
      return log.map(function (e) { return [Math.round(e.at - base), e.key, e.down] })
    },
    feed: function (events: readonly (readonly [number, string, boolean])[]) {
      const base = t0 === null ? 0 : t0
      for (const e of events) timeline.push({ at: base + e[0], key: e[1], down: e[2] })
      timeline.sort(function (a, b) { return a.at - b.at })
    },
    state: function () { return shape.state() },
    observe: function () { return shape.observe() },
    pause: function () { running = false },
    resume: function () {
      if (running) return
      running = true
      rebaseClock = true
      queue()
    },
    cam: function () { return arena.cam() },
    project: function (x: number, y: number, z: number) { return S.arena ? arena.project(x, y, z) : null },
    scaleOf: function (k: number, ladder: readonly number[], cur?: number) { return S.arena ? arena.scaleOf(k, ladder, cur) : 0 },
  }
}
