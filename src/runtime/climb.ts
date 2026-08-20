/**
 * **The climb: gravity, one-way surfaces, an automatic spring, and the fall that ends it.**
 *
 * Everything this game knows now lives in this file — the tower's hash, the sky, the motes, the
 * wrapped stamp and the loop — and none of it is reachable from any other game. In the closure
 * this replaced, `bandAt` sat eleven lines from the runner's `stoneAt` and both were in scope
 * everywhere.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { ctx2d } from './canvas.ts'
import { layerAt, rgb, rowOf } from './paint.ts'
import { inactive } from './types.ts'
import type { Canvas, Climber, Placed, RGB, Shape, Shared, StageClimb } from './types.ts'

export function makeClimb(c: Shared): Shape {
  const { S, ox, bg, sheets, keys, drawn, cv, rain } = c

  /**
   * **The climber's whole state, and there is not much of it.** A world row, a speed, a camera,
   * a best altitude and a flag. Everything a player sees is derived from these five numbers
   * every frame, and nothing is stored about the tower at all.
   */
  const block = S.climb
  if (block === null) return inactive()
  /**
   * **Declared non-null rather than merely narrowed, and the difference is a TypeScript rule
   * worth writing down.** A `const` narrowed by an early return stays narrowed inside arrow
   * functions and does NOT inside a hoisted `function` declaration — the compiler cannot prove
   * one was not called first. This runtime is written in hoisted declarations, so the guard
   * yields an alias whose DECLARED type carries the fact. It closed 507 errors without a cast.
   */
  const C0: StageClimb = block
  const found = ((): { st: Climber; D: Placed; act: NonNullable<Placed['climber']>; clips: NonNullable<Placed['clips']> } | null => {
    for (var ki = 0; ki < S.placed.length; ki++) {
      var kp = S.placed[ki]!
      if (kp === undefined || kp.climber === undefined) continue
      if (kp.clips === undefined) continue
      return { D: kp, act: kp.climber, clips: kp.clips, st: {
        at: ki, x: kp.x, y: C0.startRow, vy: 0, face: 1,
        state: 'fall', tuck: 0,
        // The camera starts low enough to show the garden the run begins in, and only ever
        // rises. A camera that came back down would let a player undo a fall by descending,
        // which is the one thing this genre never allows.
        cam: C0.startRow - S.h * 0.82,
        top: C0.startRow, best: 0, over: false,
      } }
    }
    return null
  })()
  /**
   * **A shape that is not in this scene returns before it builds anything.** That early exit is
   * what makes the state a non-null CONSTANT for the rest of the file — including inside every
   * closure below, which is a narrowing TypeScript grants a `const` and refuses a `let`. It is
   * what turned several hundred "possibly null" errors into checked code without one cast.
   */
  if (found === null) return inactive()
  const K: Climber = found.st
  /**
   * **The actor's own declaration, captured where it was CHECKED.**
   *
   * The state carries a slot index and the loop then re-read `S.placed[at].climber` — which the
   * compiler must treat as optional, because nothing in the type says the slot that was searched
   * for is the slot being read. Returning the placement and its clip names alongside the state
   * removes the question instead of asserting past it.
   */
  const KD = found.D, KA = found.act, KC = found.clips
  var scoreAt = 0

  /**
   * **The tower, and none of it is stored.**
   *
   * Band 'k' yields a platform's centre, its top row and which of the four variants it is,
   * from one integer hash — the same hash family the stars, the dust and the rain all use.
   * An unbounded tower therefore costs no memory, needs no generation step, and is identical
   * on every machine and every run. That last property is the one that matters: a recorded
   * input sequence replays to the same state, which is what makes a game verifiable at all.
   *
   * The jitter is always DOWNWARD from the band's own row, so the gap between two neighbours
   * is at most 'bandH' and never more. That is what makes reachability a fact rather than a
   * hope: one number bounds every gap in an infinite tower.
   */
  function bandAt(k: number, s: number) {
    var C = C0
    // The BAND is hashed once and every shelf in it shares that base, or the spacing below
    // cannot be constructed: two independent hashes are two independent positions.
    var b = ((k + C.seed) * 2654435761) >>> 0; b = (b ^ (b >>> 13)) >>> 0
    var h2 = (((b + s * 2654435769) >>> 0) * 1597334677) >>> 0; h2 = (h2 ^ (h2 >>> 15)) >>> 0
    /**
     * **The shelves of a band are spread evenly round the world, and that is what breaks the
     * orbit.**
     *
     * With one shelf per band and a constant sideways input, this game is a deterministic
     * dynamical system with a fixed period — and it locked into an orbit that bounced between
     * the garden and the first shelf for ever, because the crossing position at every shelf
     * above was a FIXED offset from the landing position below it. Either the offset matched or
     * it never did, which is why four sweeps of the landing window produced no gradient at all:
     * 4.0 m, 4.0 m, 4.0 m, 4.0 m, then suddenly 10. **A cliff instead of a curve is the shape
     * of a geometric lock, not of a difficulty setting.**
     *
     * The band hashes ONE base position and the rest are placed a whole fraction of the world
     * apart from it, each nudged by its own jitter. Slicing the width into ranges was the first
     * attempt and it does not hold: two shelves either side of a slice boundary sit next to each
     * other, and 147 px of a 200 px world was then out of reach at that altitude. **Spacing has
     * to be constructed, not hoped for.**
     *
     * The world wraps, so there is no edge for a shelf to hang off and no margin to keep it
     * away from one. A shelf on the seam is drawn on both sides and lands the same either way.
     */
    var span = S.w / C.perBand
    var x = (b % S.w) + s * span + ((h2 >>> 3) % C.spreadJitter) - C.spreadJitter / 2
    return {
      x: ((x % S.w) + S.w) % S.w,
      y: C.startRow - C.firstBand - k * C.bandH + (h2 % C.jitterY),
      v: (h2 >>> 9) % C.perches.length,
    }
  }

  /** Which band index sits nearest a world row. The search window is built around it. */
  function bandNear(y: number) {
    var C = C0
    return Math.floor((C.startRow - C.firstBand - y) / C.bandH)
  }

  /**
   * **Shortest distance from a to b on a world that wraps.** Walk off the left edge and you
   * arrive at the right one, so two points 190 px apart on a 200 px screen are 10 px apart.
   * The collision test and the drawing both have to agree about that or a cat lands on a shelf
   * it appears to be nowhere near.
   */
  function wrapDx(a: number, b: number) {
    var d = a - b
    if (d > S.w / 2) d -= S.w
    if (d < -S.w / 2) d += S.w
    return d
  }

  /**
   * **The climb: gravity, one-way surfaces, an automatic spring, and the fall that ends it.**
   *
   * Three rules and each is the genre:
   *
   * - **Nothing grants upward speed except a landing.** There is no jump key. A player steers
   *   and the world does the rest, which is why this is playable with two keys.
   * - **A surface only exists on the way down.** Rising through a shelf is how you get past it.
   *   The test is a CROSSING — was the contact row above the shelf last frame and below it now
   *   — rather than an overlap, so a fast fall cannot tunnel through a 1 px surface.
   * - **The camera never comes down.** Fall below the bottom of the screen and the run is over.
   *   That is the consequence this game exists to have.
   */
  function climb(t: number, dt: number) {
    var C = C0
    if (K.over) {
      // One key restarts. It is the same latched press the jump used, so a tap between two
      // animation frames still counts.
      if (keys.primaryTap) {
        keys.primaryTap = false
        K.x = KD.x; K.y = C.startRow; K.vy = 0; K.state = 'fall'; K.tuck = 0
        K.cam = C.startRow - S.h * 0.82; K.top = C.startRow; K.best = 0; K.over = false
      }
      return
    }
    keys.primaryTap = false

    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    if (dx !== 0) { K.x += dx * C.steer * dt; K.face = dx }
    // The world wraps. A kitten leaving the left edge arrives at the right one.
    K.x = ((K.x % S.w) + S.w) % S.w

    var was = K.y
    K.vy += C.gravity * dt
    K.y += K.vy * dt

    /**
     * **Landing.** Only while falling, only on a surface the contact row crossed this frame,
     * and only within half a plank of its centre. Every band whose row lies between where the
     * feet were and where they are is a candidate, which is what stops a fast fall from
     * passing through one.
     */
    if (K.vy > 0) {
      var lo = bandNear(was) - 2, hi = bandNear(K.y) + 2
      /**
       * **Band -1 is the garden floor**, a platform spanning the whole width at the start row.
       * It needs no special case anywhere else: the camera only rises, so once a player has
       * climbed past it he falls off the bottom of the screen before he can reach it again.
       *
       * The window is around where the feet WERE and where they ARE, and nothing outside it —
       * at four hundred metres up, band -1 is nine hundred bands away and testing it every
       * frame would be nine hundred hashes for an answer that is always no.
       */
      var landed = false
      for (var k = Math.min(lo, hi); k <= Math.max(lo, hi) && !landed; k++) {
        if (k < -1) continue
        for (var s = 0; s < C.perBand && !landed; s++) {
          // Band -1 is the garden, one surface spanning the whole width, so the second slot
          // of it is the same surface and is skipped.
          if (k < 0 && s > 0) continue
          var b = k < 0 ? { x: K.x, y: C.startRow, v: 0 } : bandAt(k, s)
          if (was > b.y || K.y < b.y) continue
          if (Math.abs(wrapDx(K.x, b.x)) > C.halfW + C.footHalf) continue
          K.y = b.y
          K.vy = -C.bounce
          K.state = 'tuck'; K.tuck = 0
          landed = true
        }
      }
    }

    if (K.state === 'tuck') {
      K.tuck += dt
      if (K.tuck >= C.tuckMs / 1000) K.state = K.vy < 0 ? 'rise' : 'fall'
    } else {
      K.state = K.vy < 0 ? 'rise' : 'fall'
    }

    // The camera holds him a fixed fraction down the screen, and only ever rises.
    var want = K.y - S.h * C.hold
    if (want < K.cam) K.cam = want
    if (K.y < K.top) {
      K.top = K.y
      K.best = (C.startRow - K.top) / C.pxPerMetre
    }
    // **The consequence.** Below the bottom of the screen and the run is over: the camera will
    // not follow him down, so there is no way back.
    if (K.y > K.cam + S.h + 24) K.over = true
  }

  /**
   * **The sky is a function of altitude**, quantised into bands for the same reason the floor
   * takes eight steps and the haze takes four: a smooth vertical gradient is one colour per
   * row, and this project has never spent colour that way.
   *
   * It is what the climbing is FOR. A player who has gone up two hundred metres is looking at
   * a different sky from the one the run started in, and that is the only reward this game
   * gives.
   */
  function skyAt(y: number): RGB {
    var C = C0
    var u = (C.startRow - y) / C.skyHeight
    if (u < 0) u = 0
    if (u > 1) u = 1
    var last = C.skyRamp.length - 1
    var f = u * last, i = Math.floor(f), g = f - i
    // `u` was clamped to [0,1] and `i` is floor(u·last), so both reads are inside the ramp.
    var a = C.skyRamp[i]!, b = C.skyRamp[Math.min(last, i + 1)]!
    return [
      Math.round(a[0] + (b[0] - a[0]) * g),
      Math.round(a[1] + (b[1] - a[1]) * g),
      Math.round(a[2] + (b[2] - a[2]) * g),
    ]
  }

  /**
   * **The star field and the garden floor are baked once and stamped, never redrawn per pixel.**
   *
   * A hundred and ten stars is a hundred and ten canvas calls a frame, and a canvas call costs
   * the same whether it moves one pixel or a thousand. The honest budget for this scene came out
   * at 237 calls against the project's ceiling of 200 — and it only came out at all because the
   * budget was taught about this draw path first. **It had been reporting three.**
   *
   * The tile is two screens tall and repeats, so the sky is endless with one stamp per wrap.
   * Identical arithmetic to the per-star version: the same hash, the same positions, computed
   * once instead of sixty times a second.
   */
  const TH = S.h * 2
  const starTile = cv(S.w, TH)
  var stx = ctx2d(starTile)
  for (var si2 = 0; si2 < C0.stars.count; si2++) {
    var sh = ((si2 + C0.stars.seed) * 2654435761) >>> 0; sh = (sh ^ (sh >>> 13)) >>> 0
    var sh2 = (sh * 1597334677) >>> 0; sh2 = (sh2 ^ (sh2 >>> 15)) >>> 0
    stx.fillStyle = rgb(C0.stars.colors[sh2 % C0.stars.colors.length]!)
    stx.fillRect(sh % S.w, sh2 % TH, 1, 1)
  }
  const floorStrip = cv(S.w, S.floor.length)
  var ftx = ctx2d(floorStrip)
  for (var fy2 = 0; fy2 < S.floor.length; fy2++) {
    ftx.fillStyle = rgb(S.floor[fy2]!); ftx.fillRect(0, fy2, S.w, 1)
  }
  

  var SKY_BANDS = 14
  function drawSky() {
    var C = C0, step = S.h / SKY_BANDS
    for (var i = 0; i < SKY_BANDS; i++) {
      var top = Math.floor(i * step), bot = Math.floor((i + 1) * step)
      ox.fillStyle = rgb(skyAt(K.cam + (top + bot) / 2))
      ox.fillRect(0, top, S.w, bot - top)
    }
    // **Stars fade in with the camera's own altitude, not with each star's.** One alpha for the
    // whole field is one state change instead of a hundred and ten, and the eye cannot tell the
    // two apart: what it reads is "the sky got dark and the stars came out".
    var u = (C.startRow - K.cam) / C.skyHeight
    if (u > 1) u = 1
    if (u > 0.12) {
      var tile = S.h * 2
      var off0 = ((-K.cam * C.stars.parallax) % tile + tile) % tile - tile
      ox.globalAlpha = Math.min(1, (u - 0.12) / 0.5)
      ox.drawImage(starTile, 0, Math.round(off0))
      ox.drawImage(starTile, 0, Math.round(off0 + tile))
      ox.globalAlpha = 1
    }
  }

  /**
   * **Motes: the second field this engine has, after rain.** Warm specks drifting through the
   * garden air, closed form in (index, t), owning no state.
   *
   * The pulse is expressed as a **choice of tone** rather than as an alpha, so the whole field
   * costs three fillStyle changes instead of one per speck. That is the same trade the rain
   * made when 240 fillRects became 48 stamps: a field is cheap only if it is drawn in groups.
   */
  function motes(t: number) {
    var M = C0.motes, tile = S.h * 2
    for (var tone = 0; tone < M.colors.length; tone++) {
      ox.fillStyle = rgb(M.colors[tone]!)
      for (var i = 0; i < M.count; i++) {
        var h = ((i + M.seed) * 2654435761) >>> 0; h = (h ^ (h >>> 13)) >>> 0
        var h2 = (h * 1597334677) >>> 0; h2 = (h2 ^ (h2 >>> 15)) >>> 0
        var phase = (h2 % 1024) / 1024
        var pulse = Math.sin(6.283185 * (t / M.period + phase))
        var lit = Math.floor((0.5 + 0.4999 * pulse) * M.colors.length)
        if (lit !== tone) continue
        var speed = M.speed * (0.55 + (h % 9) / 12)
        var mx = ((h % S.w) + t * speed) % S.w
        var my = (h2 % tile) - K.cam * M.parallax + Math.sin(6.283185 * (t / (M.period * 1.7) + phase)) * 5
        my = ((my % tile) + tile) % tile
        if (my >= S.h) continue
        ox.fillRect(Math.round(mx), Math.round(my), 1, 1)
      }
    }
  }

  /**
   * **One stamp, drawn up to twice**, so a sprite straddling an edge appears on both sides
   * instead of being cut in half. The world wraps and the drawing has to say so, or the
   * collision rule and the picture disagree at exactly the moment a player is looking.
   */
  function stampWrapped(sheet: Canvas, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number) {
    ox.drawImage(sheet, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh)
    if (dx + sw > S.w) ox.drawImage(sheet, sx, sy, sw, sh, Math.round(dx - S.w), Math.round(dy), sw, sh)
    else if (dx < 0) ox.drawImage(sheet, sx, sy, sw, sh, Math.round(dx + S.w), Math.round(dy), sw, sh)
  }

  /**
   * **The whole climbing picture**, and it is a second draw path rather than a camera bolted
   * onto the first.
   *
   * The fixed-camera path handles a cast of subjects with clips, drift, approach behaviour and
   * a y-sort. A climb has exactly one subject and an unbounded number of stamps, and making
   * every branch of the other loop camera-aware would have added an offset to six places that
   * do not need one. What the two share is the blit rule — nearest neighbour, integer scale,
   * index 0 transparent, one clock — and that is enforced by both calling the same 'drawImage'
   * into the same offscreen buffer at the scene's own resolution.
   */
  function drawClimb(t: number) {
    var C = C0
    drawSky()

    // The garden floor the run starts on. Visible for the first hundred pixels of the climb
    // and never again, which is the point: it is where you came from.
    var g0 = Math.round(S.ground - K.cam)
    if (g0 < S.h && g0 + S.floor.length > 0) ox.drawImage(floorStrip, 0, g0)

    motes(t)

    // Every band with any chance of being on screen, far to near. One extra band at each end
    // so a shelf slides in rather than appearing.
    var kTop = bandNear(K.cam) + 1
    var kBot = bandNear(K.cam + S.h) - 1
    for (var k = Math.max(0, kBot); k <= kTop && k >= 0; k++) {
      for (var s = 0; s < C.perBand; s++) {
        var b = bandAt(k, s)
        var li = C.perches[b.v]!, L = layerAt(S, li)
        // Each shelf is offset into the sway cycle by its own band and slot, so a screen of
        // fifteen of them never leans as one object. Same rule as the three clouds.
        var f = Math.floor(t * 1000 / L.ms + (k * 0.37 + s * 1.9)) % L.n
        stampWrapped(sheets[li]!, 0, f * L.h, L.w, L.h, b.x + L.ox, rowOf({ anchor: 'origin', y: b.y }, L) - K.cam)
      }
    }

    // The kitten. Its state names a clip and the clip names a layer, exactly as everywhere
    // else here: nothing about which pose is drawn has ever reached the sprites.
    var D = KD
    var cn = K.state === 'tuck' ? KA.tuck : K.state === 'rise' ? KA.rise : KA.fall
    var pair = KC[cn]!
    var ci = K.face < 0 ? pair.left : pair.right
    var CL = layerAt(S, ci)
    var cf = K.state === 'tuck'
      ? Math.min(CL.n - 1, Math.floor(K.tuck * 1000 / CL.ms))
      : Math.floor(t * 1000 / CL.ms) % CL.n
    drawn.push(K.at)
    stampWrapped(
      sheets[ci]!, 0, cf * CL.h, CL.w, CL.h,
      K.x + CL.ox, rowOf({ anchor: D.anchor, y: K.y }, CL) - K.cam,
    )

    if (K.over) {
      // The run is over and the picture says so before the text does. Same one-rectangle
      // device as the photographer's shutter: the cheapest possible way to change a state.
      ox.globalAlpha = 0.45
      ox.fillStyle = '#1a1020'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  /** The score, in the page rather than on the canvas: a HUD is not sprite art. */
  function score(now: number) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = K.over
      ? 'you fell at ' + K.best.toFixed(1) + ' m  ·  press space to climb again'
      : K.best.toFixed(1) + ' m'
  }



  return {
    active: true,
    step: climb, draw: drawClimb, score: score,
    state: function () { return K },
    observe: function () { return { kind: 'climb', state: K } },
  }
}
