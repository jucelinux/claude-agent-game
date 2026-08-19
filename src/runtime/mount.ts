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


  var keys: Keys = {}
  if (S.interactive) {
    var down = function (e: KeyEvent, v: boolean) {
      var k = e.key
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = v; e.preventDefault() }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = v; e.preventDefault() }
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { keys.up = v; e.preventDefault() }
      if (k === 'ArrowDown' || k === 's' || k === 'S') { keys.down = v; e.preventDefault() }
      // **A press is latched, not sampled.** A tap that begins and ends between two animation
      // frames is invisible to a loop that only reads the key's current state — and at 60 fps
      // that is a 16 ms window a person hits regularly. The edge is consumed by the loop, so
      // the input survives the gap between frames rather than falling into it.
      if (k === ' ' || k === 'x' || k === 'X' || k === 'z' || k === 'Z') {
        if (v && !keys.hit) { keys.tap = true; keys.jumpTap = true }
        keys.hit = v; e.preventDefault()
      }
      /**
       * **Two more flags, and they exist because the arena is the first game with four verbs.**
       * Every game before it conflated space, x and z into one 'act' button, which is right when
       * a game has one action. A duel has a dash AND a trigger, and a player who dashes every
       * time he fires has no mechanic to be refined about. The old flags are untouched, so no
       * shipped game changes.
       */
      if (k === ' ') { if (v && !keys.space) keys.spaceTap = true; keys.space = v; e.preventDefault() }
      if (k === 'x' || k === 'X' || k === 'z' || k === 'Z') { keys.fire = v; e.preventDefault() }
    }
    window.addEventListener('keydown', function (e) { down(e, true) })
    window.addEventListener('keyup', function (e) { down(e, false) })
  }


  /**
   * **The meter: what the machine actually did**, against the budget's prediction of what it
   * would be asked to do. The pairing is the point — a budget that says cheap next to a meter
   * that says 30 fps is a budget measuring the wrong thing ('HARNESS.md' section 5).
   *
   * Two separate numbers, because they answer different questions. **fps** comes from the
   * gaps between animation frames and includes everything the browser does; **work** is the
   * time spent inside this loop and is the only part this code owns. A page at 60 fps with
   * 14 ms of work has no headroom left even though nothing is dropping yet.
   */
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
   * **The five shapes, built once, asked once.** Each owns its own state inside its own module
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
  rainOf = makeRain(S, ox, cv)

  var shapes = [runner, arena, descent, climb, stage]
  let shape: Shape = stage
  for (const s of shapes) { if (s.active) { shape = s; break } }

  let t0: number | null = null, prev = 0
  function frame(now: number) {
    var began = clock()
    if (t0 === null) t0 = now
    var t = (now - t0) / 1000
    var dt = Math.min(0.05, t - prev)
    // 120 frames is two seconds at 60 fps: long enough that one slow frame does not dominate
    // the average, short enough that a stall shows up while it is still happening.
    if (prev > 0) { meter.gaps.push((t - prev) * 1000); if (meter.gaps.length > 120) meter.gaps.shift() }
    prev = t

    drawn.length = 0
    shape.step(t, dt)
    shape.draw(t)
    vx.drawImage(off, 0, 0, view.width, view.height)
    meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
    report(now)
    shape.score(now)
    requestAnimationFrame(frame)
  }
  el.appendChild(view)
  requestAnimationFrame(frame)

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
    state: function () { return shape.state() },
    cam: function () { return arena.cam() },
    project: function (x: number, y: number, z: number) { return S.arena ? arena.project(x, y, z) : null },
    scaleOf: function (k: number, ladder: readonly number[], cur?: number) { return S.arena ? arena.scaleOf(k, ladder, cur) : 0 },
  }
}
