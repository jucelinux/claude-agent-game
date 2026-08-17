/**
 * **The micro-game webapp.** His surface, 15/08: a shelf on the home route and one route
 * per game, so iterating means refreshing.
 *
 * **It stopped being a frame player on 15/08**, because two of his findings could not be
 * answered by one: a cloud that jumps at the loop point, and a gorilla nobody can steer.
 * Both are the same limitation — the *composition* was done ahead of time — and neither is
 * about the drawing. So the page now receives **layers and an arrangement**, and composes
 * every animation frame itself from live state and real elapsed time.
 *
 * What did not change, and must not: **the sprites are still pre-rendered by the
 * deterministic core.** A walk cycle is a pure function of its grammar, hashed and locked,
 * and it crosses the wire as indexed bytes plus a palette exactly as everywhere else here.
 * The browser is a *consumer* of the core (`HARNESS.md` §2.1); what moved into it is
 * arrangement, not drawing.
 *
 * The blit rules are the project's and they are not negotiable anywhere a sprite reaches a
 * screen: **nearest neighbour, integer scale, index 0 fully transparent, one clock for the
 * page.** Everything is drawn into an offscreen buffer at the scene's own resolution and
 * blitted once, so no sprite is ever sampled through a fractional scale.
 *
 * **Every route renders from current code on every request.** No cache, no build step: a
 * refresh is the whole iteration loop.
 */
import type { RGB } from '../core/types.ts'
import type { Stage } from '../scene/layers.ts'
import { budgetFacts, budgetOf } from '../scene/budget.ts'

export type AppGame = {
  readonly id: string
  readonly title: string
  readonly blurb: string
  readonly date: string
  readonly meta: readonly string[]
  readonly stage: Stage
  /** What the keys do, in this game's own words. A control scheme is per game, not per engine. */
  readonly keys?: string
  /** Filled in by whoever served the page, since only it knows what compression achieved. */
  readonly gzipBytes?: number
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The stage as JSON, with each layer's indices base64'd. */
const payloadOf = (stage: Stage, scale: number, interactive: boolean): string =>
  JSON.stringify({
    w: stage.w, h: stage.h, scale, ground: stage.ground, sky: stage.sky,
    groundRamp: stage.groundRamp, floor: stage.floor, stars: stage.stars, dust: stage.dust,
    rain: stage.rain, climb: stage.climb, runner: stage.runner, descent: stage.descent, interactive, meter: interactive,
    layers: stage.layers.map((l) => ({
      w: l.w, h: l.h, ox: l.ox, oy: l.oy, foot: l.footOff, n: l.frames, ms: l.msPerFrame,
      palette: l.palette, indices: Buffer.from(l.indices).toString('base64'),
    })),
    placed: stage.placed,
    // The order the stage was built in. A roaming player is spliced out of it and back in at
    // the row he currently stands on, every frame.
    order: stage.placed.map((_, i) => i),
  })

/**
 * **The runtime.** Input, state, draw — the three things a game loop is, and the first time
 * this project has had one.
 *
 * Each layer decodes once into a vertical strip canvas, so a frame is a `drawImage` with a
 * source rectangle rather than a per-pixel copy. Everything lands in an offscreen buffer at
 * the scene's own resolution and is blitted once at an integer scale.
 */
const RUNTIME = `
function rgb(c){ return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' }
function cv(w,h){ var c = document.createElement('canvas'); c.width=w; c.height=h; return c }

/** One layer's whole cycle as a vertical strip. Decoded once, drawn from thereafter. */
function decode(L){
  var c = cv(L.w, L.h * L.n), x = c.getContext('2d')
  var img = x.createImageData(L.w, L.h * L.n), raw = atob(L.indices), per = L.w * L.h * L.n
  for (var i = 0; i < per; i++) {
    var idx = raw.charCodeAt(i), o = i * 4
    if (idx === 0) { img.data[o+3] = 0; continue }
    var p = L.palette[idx]
    img.data[o] = p[0]; img.data[o+1] = p[1]; img.data[o+2] = p[2]; img.data[o+3] = 255
  }
  x.putImageData(img, 0, 0)
  return c
}

function mount(el, S) {
  var view = cv(S.w * S.scale, S.h * S.scale)
  var vx = view.getContext('2d'); vx.imageSmoothingEnabled = false
  var off = cv(S.w, S.h), ox = off.getContext('2d')
  var decodeAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0
  var sheets = S.layers.map(decode)
  var decodeMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : 0) - decodeAt

  // The backdrop never changes, so it is drawn once and copied. The floor's colour per row
  // arrives already computed: the recede is one rule and it is applied in one place, or the
  // page and the compositor put the horizon in two different rows.
  var bg = cv(S.w, S.h), bx = bg.getContext('2d')
  bx.fillStyle = rgb(S.sky); bx.fillRect(0, 0, S.w, S.h)
  // **Stars go into the backdrop, not into a field.** A field is evaluated per pixel per
  // frame because it moves; a fixed sky does not. Same integer hash the rain uses, so the
  // pattern is irregular and identical on every machine.
  if (S.stars) {
    for (var si = 0; si < S.stars.count; si++) {
      var sh1 = ((si + S.stars.seed) * 2654435761) >>> 0; sh1 = (sh1 ^ (sh1 >>> 13)) >>> 0
      var sh2 = (sh1 * 1597334677) >>> 0; sh2 = (sh2 ^ (sh2 >>> 15)) >>> 0
      bx.fillStyle = rgb(S.stars.colors[sh2 % S.stars.colors.length])
      bx.fillRect(sh1 % S.w, sh2 % S.stars.below, 1, 1)
    }
  }
  for (var y = 0; y < S.floor.length; y++) {
    bx.fillStyle = rgb(S.floor[y]); bx.fillRect(0, S.ground + y, S.w, 1)
  }
  // **Dust.** Same hash as the stars, thrown over the floor instead of the sky. Regolith is
  // powder, and a flat fill reads as a tile however well its value is graded.
  if (S.dust) {
    var band = S.h - S.ground
    for (var di = 0; di < S.dust.count; di++) {
      var dh = ((di + S.dust.seed) * 2654435761) >>> 0; dh = (dh ^ (dh >>> 13)) >>> 0
      var dh2 = (dh * 1597334677) >>> 0; dh2 = (dh2 ^ (dh2 >>> 15)) >>> 0
      bx.fillStyle = rgb(S.dust.colors[dh2 % S.dust.colors.length])
      bx.fillRect(dh % S.w, S.ground + (dh2 % band), 1, 1)
    }
  }

  /**
   * **The state, and it is the whole of what makes this a game rather than a picture.**
   *
   * The player holds a position, a facing and a named state; each photographer holds the
   * same plus a timer. Nothing here is in the sprites — a clip is chosen by the state, and
   * the sprites have never heard of a state.
   */
  var P = null, crew = [], K = null, R = null, DS = null
  for (var i = 0; i < S.placed.length; i++) {
    var pl = S.placed[i]
    /**
     * **The climber's whole state, and there is not much of it.**
     *
     * A world row, a speed, a camera, a best altitude and a flag. Everything a player sees —
     * which pose, which shelf is under him, how high the score says he is — is derived from
     * these five numbers every frame. Nothing is stored about the tower at all: a platform is
     * recomputed from its band index whenever anybody asks about it.
     */
    if (pl.climber && S.climb) {
      K = {
        at: i, x: pl.x, y: S.climb.startRow, vy: 0, face: 1,
        state: 'fall', tuck: 0,
        // The camera starts low enough to show the garden the run begins in, and only ever
        // rises. A camera that came back down would let a player undo a fall by descending,
        // which is the one thing this genre never allows.
        cam: S.climb.startRow - S.h * 0.82,
        top: S.climb.startRow, best: 0, over: false,
      }
    }
    /**
     * **The runner's whole state.** A world distance, a height, a vertical speed, how many jumps
     * are spent, and one number for Death. Everything a player sees is derived from these.
     */
    if (pl.runs && S.runner) {
      R = {
        at: i, dist: 0, y: 0, vy: 0, jumps: 0, state: 'run', clip: 0,
        speed: S.runner.speed, menace: 0, passed: -1, best: 0, over: false,
      }
    }
    /**
     * **The rider's whole state.** A slope distance, a lane, a hop height, a steer sign and a
     * flag. Everything on screen is derived from these six numbers every frame.
     */
    if (pl.rides && S.descent) {
      DS = {
        at: i, dist: 0, x: (S.descent.minX + S.descent.maxX) / 2, y: 0, vy: 0,
        steer: 0, clip: 0, speed: S.descent.speed, best: 0, over: false,
      }
    }
    if (pl.player) {
      P = {
        at: i, x: pl.x, row: pl.y, face: 1, dir: 'e',
        state: 'idle', walk: 0, atk: 0, hit: false,
        // Height above the contact row, and the speed it is changing at. Zero is standing.
        lift: 0, vy: 0,
      }
    }
    if (pl.approach) {
      var a = pl.approach
      crew.push({
        at: i, p: pl, a: a, x: a.from === 'left' ? -80 : S.w + 80,
        face: a.from === 'left' ? 1 : -1, state: 'away', clock: 0, next: a.delay, shot: 0,
      })
    }
  }

  var keys = {}
  if (S.interactive) {
    var down = function (e, v) {
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
    }
    window.addEventListener('keydown', function (e) { down(e, true) })
    window.addEventListener('keyup', function (e) { down(e, false) })
  }

  /**
   * **Which of eight compass points an input vector points at.** The western half is reached
   * by mirroring the eastern half, so only five are ever rendered — and mirroring is correct
   * for a *turn* in a way it is not for lighting, which is why 'layers.ts' re-renders the lamp
   * and this function does not care.
   *
   * 'last' is returned when nothing is pressed, so releasing the keys leaves him facing where
   * he was walking rather than snapping back to a default.
   */
  function compass(dx, dy, last) {
    if (dx === 0 && dy === 0) return last
    if (dx === 0) return dy < 0 ? 'n' : 's'
    if (dy === 0) return 'e'
    return dy < 0 ? 'ne' : 'se'
  }

  /** How long a clip runs, in seconds. The sprite owns its own rate; the state does not. */
  function span(ix) { var L = S.layers[ix]; return L.n * L.ms / 1000 }

  /**
   * **Where a layer's crop goes, given the row its subject stands on.**
   *
   * 'origin' puts the sprite's own origin on the row — right when the author put the origin
   * at the ground contact, which is every tree. 'foot' puts the lowest painted pixel there —
   * right when the origin is somewhere else, like a person's pelvis.
   *
   * **It is applied per LAYER, and that is the fix.** It used to be resolved once against a
   * subject's main clip, so a photographer who stands with his feet 21 px below his pelvis
   * and lies down with them beside it was drawn lying down at standing height — floating.
   */
  function rowOf(D, L) { return D.anchor === 'foot' ? D.y + L.oy - L.foot : D.y + L.oy }

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
  function bandAt(k, s) {
    var C = S.climb
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
  function bandNear(y) {
    var C = S.climb
    return Math.floor((C.startRow - C.firstBand - y) / C.bandH)
  }

  /**
   * **Shortest distance from a to b on a world that wraps.** Walk off the left edge and you
   * arrive at the right one, so two points 190 px apart on a 200 px screen are 10 px apart.
   * The collision test and the drawing both have to agree about that or a cat lands on a shelf
   * it appears to be nowhere near.
   */
  function wrapDx(a, b) {
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
  function climb(t, dt) {
    var C = S.climb
    if (K.over) {
      // One key restarts. It is the same latched press the jump used, so a tap between two
      // animation frames still counts.
      if (keys.jumpTap) {
        keys.jumpTap = false
        K.x = S.placed[K.at].x; K.y = C.startRow; K.vy = 0; K.state = 'fall'; K.tuck = 0
        K.cam = C.startRow - S.h * 0.82; K.top = C.startRow; K.best = 0; K.over = false
      }
      return
    }
    keys.jumpTap = false

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
  function skyAt(y) {
    var C = S.climb
    var u = (C.startRow - y) / C.skyHeight
    if (u < 0) u = 0
    if (u > 1) u = 1
    var last = C.skyRamp.length - 1
    var f = u * last, i = Math.floor(f), g = f - i
    var a = C.skyRamp[i], b = C.skyRamp[Math.min(last, i + 1)]
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
  var starTile = null, floorStrip = null
  if (S.climb) {
    var TH = S.h * 2
    starTile = cv(S.w, TH)
    var stx = starTile.getContext('2d')
    for (var si2 = 0; si2 < S.climb.stars.count; si2++) {
      var sh = ((si2 + S.climb.stars.seed) * 2654435761) >>> 0; sh = (sh ^ (sh >>> 13)) >>> 0
      var sh2 = (sh * 1597334677) >>> 0; sh2 = (sh2 ^ (sh2 >>> 15)) >>> 0
      stx.fillStyle = rgb(S.climb.stars.colors[sh2 % S.climb.stars.colors.length])
      stx.fillRect(sh % S.w, sh2 % TH, 1, 1)
    }
    floorStrip = cv(S.w, S.floor.length)
    var ftx = floorStrip.getContext('2d')
    for (var fy2 = 0; fy2 < S.floor.length; fy2++) {
      ftx.fillStyle = rgb(S.floor[fy2]); ftx.fillRect(0, fy2, S.w, 1)
    }
  }

  var SKY_BANDS = 14
  function drawSky() {
    var C = S.climb, step = S.h / SKY_BANDS
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
  function motes(t) {
    var M = S.climb.motes, tile = S.h * 2
    for (var tone = 0; tone < M.colors.length; tone++) {
      ox.fillStyle = rgb(M.colors[tone])
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
  function stampWrapped(sheet, sx, sy, sw, sh, dx, dy) {
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
  function drawClimb(t) {
    var C = S.climb
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
        var li = C.perches[b.v], L = S.layers[li]
        // Each shelf is offset into the sway cycle by its own band and slot, so a screen of
        // fifteen of them never leans as one object. Same rule as the three clouds.
        var f = Math.floor(t * 1000 / L.ms + (k * 0.37 + s * 1.9)) % L.n
        stampWrapped(sheets[li], 0, f * L.h, L.w, L.h, b.x + L.ox, rowOf({ anchor: 'origin', y: b.y }, L) - K.cam)
      }
    }

    // The kitten. Its state names a clip and the clip names a layer, exactly as everywhere
    // else here: nothing about which pose is drawn has ever reached the sprites.
    var D = S.placed[K.at]
    var cn = K.state === 'tuck' ? D.climber.tuck : K.state === 'rise' ? D.climber.rise : D.climber.fall
    var pair = D.clips[cn]
    var ci = K.face < 0 ? pair.left : pair.right
    var CL = S.layers[ci]
    var cf = K.state === 'tuck'
      ? Math.min(CL.n - 1, Math.floor(K.tuck * 1000 / CL.ms))
      : Math.floor(t * 1000 / CL.ms) % CL.n
    drawn.push(K.at)
    stampWrapped(
      sheets[ci], 0, cf * CL.h, CL.w, CL.h,
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
  var scoreAt = 0
  function score(now) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = K.over
      ? 'you fell at ' + K.best.toFixed(1) + ' m  ·  press space to climb again'
      : K.best.toFixed(1) + ' m'
  }


  /**
   * **The obstacles, and none of them is stored.** Slot 'k' yields a world position and a
   * variant from one integer hash — the same family the stars, the rain and the climb's shelves
   * all use. An endless graveyard costs no memory and is identical on every machine.
   */
  function stoneAt(k) {
    var N = S.runner
    var h = ((k + N.seed) * 2654435761) >>> 0; h = (h ^ (h >>> 13)) >>> 0
    var h2 = (h * 1597334677) >>> 0; h2 = (h2 ^ (h2 >>> 15)) >>> 0
    return {
      x: N.leadIn + k * N.spacing + (h % N.jitterX),
      v: (h2 >>> 7) % N.stones.length,
    }
  }

  /**
   * **The run: one axis, two jumps, and a number called Death.**
   *
   * The only decision a player makes is when to leave the ground, which is the whole of the
   * genre he named. What is new here is the second press: it buys another impulse **and** a
   * somersault that has to complete rather than oscillate.
   */
  function runner(t, dt) {
    var N = S.runner
    if (R.over) {
      if (keys.jumpTap) {
        keys.jumpTap = false
        R.dist = 0; R.y = 0; R.vy = 0; R.jumps = 0; R.state = 'run'; R.clip = 0
        R.speed = N.speed; R.menace = 0; R.passed = -1; R.best = 0; R.over = false
      }
      return
    }

    // The world speeds up for ever, which is what makes an endless runner end.
    R.speed = Math.min(N.maxSpeed, R.speed + N.accel * dt)
    R.dist += R.speed * dt
    if (R.dist / N.pxPerMetre > R.best) R.best = R.dist / N.pxPerMetre

    /**
     * **The double jump.** The first press works only from the ground; the second only in the
     * air, and only once. 'jumps' is the whole of that rule and it is reset by landing.
     */
    if (keys.jumpTap) {
      keys.jumpTap = false
      if (R.jumps === 0 && R.y === 0) {
        R.vy = -N.jump; R.jumps = 1; R.state = 'leap'; R.clip = 0
      } else if (R.jumps === 1) {
        // The somersault. A second impulse AND a clip that turns a full circle: the impulse is
        // what makes it a double jump, the turn is what makes it his.
        R.vy = -N.flip; R.jumps = 2; R.state = 'flip'; R.clip = 0
      }
    }

    if (R.y > 0 || R.vy !== 0) {
      R.vy += N.gravity * dt
      R.y = R.y - R.vy * dt
      R.clip += dt
      if (R.y <= 0) { R.y = 0; R.vy = 0; R.jumps = 0; R.state = 'run'; R.clip = 0 }
    }

    /**
     * **Death creeps, and a collision hands her a stride.** She is one number: 'menace' between
     * 0 and 1, read back as a position on screen. At 1 she reaches him.
     *
     * Clearing a stone gives a little back, so a clean run holds her off and a clumsy one does
     * not. That is the entire feedback loop, and it needs no pathfinding to be felt.
     */
    if (N.reaper) R.menace += N.reaper.creep * dt

    /**
     * **One stone is resolved once**, either as a hit or as a clear, and 'passed' is the whole of
     * that bookkeeping. A slot behind him that was never touched gives a little of the gap back;
     * a slot he is inside of while lower than its top takes a stride.
     *
     * The height is read from the ART — the crop's own top row above the ground line — so a
     * stone's difficulty is a fact about how it was drawn and never a number typed twice.
     */
    var near = Math.round(R.dist / N.spacing)
    for (var k = Math.max(0, near - 2); k <= near + 2; k++) {
      if (k <= R.passed) continue
      var st = stoneAt(k)
      var rel = st.x - R.dist
      var reach = N.bodyHalfW + N.stoneHalfW
      if (Math.abs(rel) < reach) {
        var SL = S.layers[N.stones[st.v]]
        if (R.y < -SL.oy - 2) {
          R.passed = k
          // **No chaser means a collision is the consequence itself.** The crypt spends a hit as
          // time off a closing gap; a street has nothing chasing you, so hitting a kerb at speed
          // ends the run. That is the dinosaur's rule and it needs no second mechanism.
          if (N.reaper) R.menace = Math.min(1, R.menace + N.reaper.hit)
          else { R.over = true; R.state = 'caught' }
        }
      } else if (rel < -reach) {
        R.passed = k
        if (N.reaper) R.menace = Math.max(0, R.menace - N.reaper.relief)
      }
    }

    if (N.reaper && R.menace >= 1) { R.menace = 1; R.over = true; R.state = 'caught' }
  }

  /**
   * **The ordered weave, shared by every backdrop that has a surface.** It lived inside the
   * runner's block until the descent needed it too — two copies of a quantiser would be two
   * quantisers eventually, the compose/layers lesson.
   */
  var BAY4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]
  var BAY2 = [0,2,3,1]
  function bayerAt(x, y, n) {
    if (n === 2) return (BAY2[(y & 1) * 2 + (x & 1)] + 0.5) / 4 - 0.5
    return (BAY4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5
  }
  /** Paint rows y0..y1 as a dithered ramp through 'stops'. At amount 0 it is flat bands. */
  function ramp(ctx, stops, y0, y1, dz) {
    var span = y1 - y0
    var img = ctx.createImageData(S.w, span)
    var d = img.data
    for (var yy = 0; yy < span; yy++) {
      // Position along the ramp in STOP units, so the fraction is the thing to dither.
      var u = (stops.length - 1) * (yy / Math.max(1, span - 1))
      for (var xx = 0; xx < S.w; xx++) {
        var k = Math.floor(u + dz.amount * bayerAt(xx, y0 + yy, dz.lattice))
        if (k < 0) k = 0
        if (k > stops.length - 1) k = stops.length - 1
        var c = stops[k]
        var at = (yy * S.w + xx) * 4
        d[at] = c[0]; d[at + 1] = c[1]; d[at + 2] = c[2]; d[at + 3] = 255
      }
    }
    ctx.putImageData(img, 0, y0)
  }

  /** The runner's backdrop: a fixed sky, stars, a moon. Nothing here moves with the camera. */
  var runnerBg = null
  if (S.runner) {
    runnerBg = cv(S.w, S.h)
    var rb = runnerBg.getContext('2d')
    /**
     * **The sky and the road are where the ordered dither actually pays, and that is measured.**
     *
     * The sprite pipeline carries the same weave and it was switched OFF on the rider: a 36 px body
     * of 27 primitives has 0.000 of its pixels inside a single-owner 4x4 cell, so a lattice there is
     * indistinguishable from the speckle his verdict retired. A sky is 240x100 px of ONE surface.
     * Same knob, same reasoning, four hundred times the room.
     *
     * So instead of N flat bands, the sky is a continuous ramp quantised through the Bayer lattice:
     * each row's exact position between two stops becomes a per-pixel choice between those two
     * stops, weighted by the lattice cell. Two colours weave and the eye reads the value between
     * them. That is the classic pixel-art dusk, and it is the whole visible result of this half of
     * the round.
     *
     * **No crawl, and it is by construction rather than by luck.** The one dither defect I predicted
     * was a pattern that slides through a moving surface. The backdrop is painted ONCE into a static
     * canvas and never scrolls, so the lattice is welded to the world. The scrolling elements — the
     * road dashes and the obstacles — carry no dither at all.
     */
    var DZ = S.runner.dither || { amount: 0, lattice: 4 }
    ramp(rb, S.runner.skyRamp, 0, S.runner.groundRow, DZ)
    if (S.runner.stars) {
      for (var sj = 0; sj < S.runner.stars.count; sj++) {
        var sha = ((sj + S.runner.stars.seed) * 2654435761) >>> 0; sha = (sha ^ (sha >>> 13)) >>> 0
        var shb = (sha * 1597334677) >>> 0; shb = (shb ^ (shb >>> 15)) >>> 0
        rb.fillStyle = rgb(S.runner.stars.colors[shb % S.runner.stars.colors.length])
        rb.fillRect(sha % S.w, shb % S.runner.stars.below, 1, 1)
      }
    }
    // The moon: a halo ring under a disc, and it is the only round thing in the picture.
    if (S.runner.moon) {
      var M0 = S.runner.moon
      rb.fillStyle = rgb(M0.halo)
      rb.beginPath(); rb.ellipse(M0.x, M0.y, M0.r + 3, M0.r + 3, 0, 0, 6.283185); rb.fill()
      rb.fillStyle = rgb(M0.color)
      rb.beginPath(); rb.ellipse(M0.x, M0.y, M0.r, M0.r, 0, 0, 6.283185); rb.fill()
    }
    // The road, dithered the same way: a receding surface is a ramp from the horizon down, and a
    // flat asphalt is the one thing that would say "this is a render at low resolution".
    if (DZ.amount > 0 && S.floor.length > 2) {
      ramp(rb, S.floor, S.runner.groundRow, S.h, DZ)
    } else {
      for (var fy3 = 0; fy3 < S.floor.length; fy3++) {
        rb.fillStyle = rgb(S.floor[fy3]); rb.fillRect(0, S.runner.groundRow + fy3, S.w, 1)
      }
    }
  }

  function drawRunner(t) {
    var N = S.runner
    ox.drawImage(runnerBg, 0, 0)

    /**
     * **The drift bands: the sky's own traffic, far to near.** The stones' hash at a fraction
     * of the world's speed — slot k yields a position, an altitude and a variant, nothing is
     * stored, and the band scrolls at 'parallax' of the distance. Each puff is offset into its
     * own breathing cycle by its slot, the three-clouds rule, so a sky of many never pulses as
     * one object.
     */
    for (var b = 0; b < (N.drift ? N.drift.length : 0); b++) {
      var B = N.drift[b]
      var scrolled = R.dist * B.parallax
      var f0 = Math.floor((scrolled - 80) / B.spacing)
      var f1 = Math.floor((scrolled + S.w + 80) / B.spacing) + 1
      for (var dk = f0; dk <= f1; dk++) {
        var dh = ((dk + B.seed) * 2654435761) >>> 0; dh = (dh ^ (dh >>> 13)) >>> 0
        var dh2 = (dh * 1597334677) >>> 0; dh2 = (dh2 ^ (dh2 >>> 15)) >>> 0
        var pli = B.puffs[(dh2 >>> 5) % B.puffs.length], PL = S.layers[pli]
        var px = dk * B.spacing + (dh % B.jitterX) - scrolled + PL.ox
        if (px > S.w + 60 || px < -60 - PL.w) continue
        // Through rowOf, as every placement: a band row is still a row, and the one rule the
        // engine has about rows is that exactly one function turns them into crop positions.
        var py = rowOf({ anchor: 'origin', y: B.minY + (dh2 % Math.max(1, B.maxY - B.minY)) }, PL)
        // Slots run negative behind the start line, so the modulo has to be taken twice or a
        // negative slot asks drawImage for a frame above the sheet.
        var pf = ((Math.floor(t * 1000 / PL.ms + dk * 0.37) % PL.n) + PL.n) % PL.n
        ox.drawImage(sheets[pli], 0, pf * PL.h, PL.w, PL.h, Math.round(px), Math.round(py), PL.w, PL.h)
      }
    }

    // The stones, far to near is irrelevant here: they all stand on one row.
    /**
     * **The slot window maps SCREEN edges to slot indices, and forgetting leadIn was his
     * batch-5 note.** Slot k sits at world x = leadIn + k*spacing + jitter, and the screen's
     * left edge is at world x = dist - holdX. The old window divided (dist - 60) by the
     * spacing — no leadIn, no holdX — which culled every stone at screen x = holdX + leadIn
     * - 60 - spacing + jitter: mid-screen, in all three runners, since the crypt.
     * "O mais comum é que ele saia da tela e seja destruído fora dela." 60 px of margin
     * beyond each edge covers the widest crop in the catalog.
     */
    var first = Math.floor((R.dist - N.holdX - N.leadIn - 60) / N.spacing)
    var last = Math.floor((R.dist - N.holdX - N.leadIn + S.w + 60) / N.spacing) + 1
    for (var k = Math.max(0, first); k <= last; k++) {
      var st = stoneAt(k)
      var li = N.stones[st.v], L = S.layers[li]
      var sx = N.holdX + (st.x - R.dist) + L.ox
      // Culled only once the CROP is past an edge, never while any pixel of it is on screen.
      if (sx > S.w || sx + L.w < 0) continue
      // A stone with more than one frame animates on the page clock, offset by its slot so a
      // sky of flocks never beats as one. A 1-frame stone is byte-identical to the old path.
      var sf = L.n > 1 ? Math.floor(t * 1000 / L.ms + k * 0.37) % L.n : 0
      ox.drawImage(sheets[li], 0, sf * L.h, L.w, L.h, Math.round(sx),
        Math.round(rowOf({ anchor: 'origin', y: N.groundRow }, L)), L.w, L.h)
    }

    /**
     * **Death, placed by one number.** 'fromX' is where she waits at menace 0 and the runner's
     * own column is where she arrives at 1. Nothing about her is a decision made per frame.
     */
    if (N.reaper) {
      var D2 = S.layers[N.reaper.layer]
      var rx = N.fromX + (N.holdX - 14 - N.fromX) * R.menace
      var rf = Math.floor(t * 1000 / D2.ms) % D2.n
      ox.drawImage(sheets[N.reaper.layer], 0, rf * D2.h, D2.w, D2.h,
        Math.round(rx + D2.ox), Math.round(rowOf({ anchor: 'origin', y: N.groundRow }, D2)), D2.w, D2.h)
    }

    // The runner. The state names a clip; the clip names a layer.
    var D = S.placed[R.at]
    var cn = R.state === 'flip' ? D.runs.flip : R.state === 'leap' ? D.runs.leap : D.runs.run
    var pair = D.clips[cn]
    var ri = pair.right
    var RL = S.layers[ri]
    /**
     * **The two airborne clips play ONCE and hold their last frame**, which is what 'Gait.wrap'
     * false is for: the pose at the end of a somersault is a whole turn from where it started,
     * so a clip that looped would put the body back where it began halfway through the jump.
     */
    /**
     * **The stride advances with DISTANCE over a stride length, not over a magic divisor.**
     *
     * It was 'dist / 2.2', which at the speed cap is 9.9 stride cycles a second — *"parece que
     * ela está correndo em supervelocidade"*. The divisor was a number I picked, so the animation
     * accelerated without bound while the body did not.
     *
     * 'strideLen' is derived: a sprinting figure covers about 1.2 of its own height per stride,
     * and this one is 34 px. So the cycle is 2.6 strides a second at the starting speed and 4.3
     * at the cap, which is what a sprinter actually does.
     */
    var rfr = R.state === 'run'
      ? Math.floor(R.dist / (N.strideLen / RL.n)) % RL.n
      : Math.min(RL.n - 1, Math.floor(R.clip * 1000 / RL.ms))
    /**
     * **One placement rule, and this path used to compute its own.**
     *
     * He asked for this at the engine level after the forest: a subject anchored by its feet was
     * drawn by its origin, so it sat below the things it should stand beside. It was fixed in
     * 'rowOf' and then a THIRD draw path reimplemented the arithmetic without it — his feet
     * landed on row 127 with the ground at 112, which is why a gravestone appeared at his waist.
     *
     * A rule copied into three places is three rules. Every path calls this one now, and a lock
     * greps the source to keep it that way.
     */
    var stand = { anchor: D.anchor, y: N.groundRow }
    ox.drawImage(sheets[ri], 0, rfr * RL.h, RL.w, RL.h,
      Math.round(N.holdX + RL.ox), Math.round(rowOf(stand, RL) - R.y), RL.w, RL.h)

    /**
     * **Weather falls in FRONT of the world in a runner** — his reference has the snow
     * between the player and the camera. The field is screen-space and camera-free, so the
     * same rain() the forest uses works unchanged; only the call site is new, and a runner
     * scene without a field skips it exactly as the fixed path does.
     */
    rain(t)

    if (R.over) {
      ox.globalAlpha = 0.5
      ox.fillStyle = '#0a0812'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  function runnerScore(now) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = R.over
      ? (S.runner.overText || 'she caught you at ') + R.best.toFixed(0) + ' m  ·  press space to run again'
      : R.best.toFixed(0) + ' m'
  }

  /**
   * **The descent's backdrop, baked once.** Sky strip woven at the top, the piste ramp below,
   * the ridge treeline and the clouds stamped in — all static, which is honesty as much as
   * economy: a far ridge does not visibly move when you travel straight away from it, and a
   * static backdrop is the no-crawl rule by construction.
   */
  var descentBg = null
  if (S.descent) {
    descentBg = cv(S.w, S.h)
    var db = descentBg.getContext('2d')
    var DDZ = S.descent.dither || { amount: 0, lattice: 2 }
    ramp(db, S.descent.skyRamp, 0, S.descent.horizonRow, DDZ)
    ramp(db, S.floor, S.descent.horizonRow, S.h, DDZ)
    if (S.descent.clouds) {
      var DC = S.descent.clouds, CLD = S.layers[DC.layer]
      for (var ci2 = 0; ci2 < DC.count; ci2++) {
        var ch = ((ci2 + DC.seed) * 2654435761) >>> 0; ch = (ch ^ (ch >>> 13)) >>> 0
        var ch2 = (ch * 1597334677) >>> 0; ch2 = (ch2 ^ (ch2 >>> 15)) >>> 0
        db.drawImage(sheets[DC.layer], 0, 0, CLD.w, CLD.h,
          (ch % S.w) - Math.round(CLD.w / 2), DC.minY + (ch2 % Math.max(1, DC.maxY - DC.minY)), CLD.w, CLD.h)
      }
    }
    if (S.descent.ridge) {
      var RG = S.descent.ridge
      var rgN = Math.ceil(S.w / RG.spacing) + 2
      for (var ri = -1; ri < rgN; ri++) {
        var rh = ((ri + RG.seed) * 2654435761) >>> 0; rh = (rh ^ (rh >>> 13)) >>> 0
        var rh2 = (rh * 1597334677) >>> 0; rh2 = (rh2 ^ (rh2 >>> 15)) >>> 0
        var rli = RG.puffs[(rh2 >>> 5) % RG.puffs.length], RL = S.layers[rli]
        db.drawImage(sheets[rli], 0, 0, RL.w, RL.h,
          ri * RG.spacing + (rh % RG.jitterX) + RL.ox, rowOf({ anchor: 'origin', y: RG.row }, RL), RL.w, RL.h)
      }
    }
  }

  /** The descent's obstacles: 2D hashed slots — a slope distance AND a lane, nothing stored. */
  function slopeAt(k) {
    var D = S.descent
    var h = ((k + D.seed) * 2654435761) >>> 0; h = (h ^ (h >>> 13)) >>> 0
    var h2 = (h * 1597334677) >>> 0; h2 = (h2 ^ (h2 >>> 15)) >>> 0
    return {
      d: D.leadIn + k * D.spacingD + (h % D.jitterD),
      x: D.minX + (h2 % (D.maxX - D.minX)),
      v: (h2 >>> 9) % D.stones.length,
    }
  }

  /**
   * **The descent: one lane axis, one hop, and the mountain decides the rest.**
   *
   * Steering is the CARVE — the composed-roll clip plays whenever a key is held, which is the
   * whole reason this game exists. The hop clears what its art is shorter than 'clearance',
   * read from the crop: a rock is jumpable and a pine is lethal because of how each is drawn.
   */
  function descend(t, dt) {
    var D = S.descent
    if (DS.over) {
      if (keys.jumpTap) {
        keys.jumpTap = false
        DS.dist = 0; DS.x = (D.minX + D.maxX) / 2; DS.y = 0; DS.vy = 0
        DS.steer = 0; DS.clip = 0; DS.speed = D.speed; DS.best = 0; DS.over = false
      }
      return
    }

    DS.speed = Math.min(D.maxSpeed, DS.speed + D.accel * dt)
    DS.dist += DS.speed * dt
    if (DS.dist / D.pxPerMetre > DS.best) DS.best = DS.dist / D.pxPerMetre

    var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    DS.steer = dx
    if (dx !== 0) DS.x = Math.max(D.minX, Math.min(D.maxX, DS.x + dx * D.steer * dt))

    if (keys.jumpTap) {
      keys.jumpTap = false
      if (DS.y === 0) { DS.vy = -D.jump; DS.clip = 0 }
    }
    if (DS.y > 0 || DS.vy !== 0) {
      DS.vy += D.gravity * dt
      DS.y = DS.y - DS.vy * dt
      DS.clip += dt
      if (DS.y <= 0) { DS.y = 0; DS.vy = 0; DS.clip = 0 }
    }

    // Collision: any slot whose slope window and lane window both overlap the rider. Airborne
    // clears art shorter than the clearance: height read from the crop, never a flag.
    var near = Math.round((DS.dist - D.leadIn) / D.spacingD)
    for (var k = Math.max(0, near - 3); k <= near + 3; k++) {
      var sl = slopeAt(k)
      if (Math.abs(sl.d - DS.dist) >= D.stoneHalfD + D.bodyHalfD) continue
      if (Math.abs(sl.x - DS.x) >= D.stoneHalfW + D.bodyHalfW) continue
      var SL = S.layers[D.stones[sl.v]]
      if (DS.y > 0 && -SL.oy < D.clearance) continue
      DS.over = true
    }
  }

  function drawDescent(t) {
    var D = S.descent
    ox.drawImage(descentBg, 0, 0)

    /**
     * **The slot window maps SCREEN edges through leadIn and the jitter — his batch-5 lesson,
     * applied at birth instead of learned again.** Screen y = holdY + (slotD - dist); terrain
     * ahead is BELOW the rider and rises as the camera advances down the slope.
     */
    var kFirst = Math.max(0, Math.floor((DS.dist - D.holdY - 60 - D.jitterD - D.leadIn) / D.spacingD))
    var kLast = Math.floor((DS.dist + (S.h - D.holdY) + 60 - D.leadIn) / D.spacingD) + 1

    // Painter's order is slope order: far (up-screen) first, the rider spliced in at his row.
    var riderDrawn = false
    for (var k = kFirst; k <= kLast + 1; k++) {
      var beyond = k > kLast
      var sl = beyond ? null : slopeAt(k)
      if (!riderDrawn && (beyond || sl.d >= DS.dist)) {
        riderDrawn = true
        drawRider(t)
      }
      if (beyond) break
      var li = D.stones[sl.v], L = S.layers[li]
      var sy = D.holdY + (sl.d - DS.dist)
      var sx = sl.x + L.ox
      // The crop's top through rowOf — the one function allowed to turn a row into a position.
      var top = rowOf({ anchor: 'origin', y: sy }, L)
      if (top > S.h || top + L.h < 0) continue
      ox.drawImage(sheets[li], 0, 0, L.w, L.h, Math.round(sx), Math.round(top), L.w, L.h)
    }

    rain(t)

    if (DS.over) {
      ox.globalAlpha = 0.5
      ox.fillStyle = '#0a0812'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  function drawRider(t) {
    var D = S.descent
    var pd = S.placed[DS.at]
    // The state names a clip: airborne is the launch, a held key is the carve (mirrored for
    // the other edge by the pair mechanism), and the rest is the glide.
    var cn = DS.y > 0 || DS.vy !== 0 ? pd.rides.launch : DS.steer !== 0 ? pd.rides.carve : pd.rides.glide
    var pair = pd.clips[cn]
    var li = DS.steer < 0 ? pair.left : pair.right
    var L = S.layers[li]
    var f = DS.y > 0 || DS.vy !== 0
      ? Math.min(L.n - 1, Math.floor(DS.clip * 1000 / L.ms))
      : Math.floor(DS.dist / (D.strideLen / L.n)) % L.n
    /**
     * **The contact shadow, and it is the batch-4 look's finding applied at birth**: a rider
     * with no shadow floats on snow. It shrinks with the hop, and it is the only thing telling
     * the player where the landing is.
     */
    var sk = Math.max(0.45, 1 - DS.y / 40)
    ox.globalAlpha = 0.22 * sk
    ox.fillStyle = '#1a2a4a'
    ox.beginPath()
    ox.ellipse(Math.round(DS.x), D.holdY + 15, Math.round(9 * sk), Math.max(1, Math.round(3 * sk)), 0, 0, 6.283185)
    ox.fill()
    ox.globalAlpha = 1
    ox.drawImage(sheets[li], 0, f * L.h, L.w, L.h,
      Math.round(DS.x + L.ox), Math.round(rowOf({ anchor: 'origin', y: D.holdY }, L) - DS.y), L.w, L.h)
  }

  function descentScore(now) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = DS.over
      ? (S.descent.overText || 'you wiped out at ') + DS.best.toFixed(0) + ' m  ·  press space to ride again'
      : DS.best.toFixed(0) + ' m'
  }

  /**
   * **The blow.** Anything prone within reach, on the side he is facing, gets up and runs.
   * It fires once per attack, at 'hitAt' through the clip — anticipation is longer than
   * impact, and a hit that registers on frame 0 registers before the arm has moved.
   */
  function strike() {
    for (var c = 0; c < crew.length; c++) {
      var n = crew[c]
      if (n.state !== 'prone') continue
      var dx = n.x - P.x
      if (Math.abs(dx) > S.placed[P.at].player.reach) continue
      if (dx * P.face < 0) continue
      n.state = 'out'; n.clock = 0
      n.face = n.a.from === 'left' ? -1 : 1
    }
  }

  function think(t, dt) {
    if (!P) return
    var pd = S.placed[P.at].player
    if (P.state === 'attack') {
      P.atk += dt
      var dur = span(S.placed[P.at].clips[pd.attack].right)
      if (!P.hit && P.atk >= dur * pd.hitAt) { P.hit = true; strike() }
      if (P.atk >= dur) { P.state = 'idle'; P.hit = false }
    } else if (pd.attack && (keys.hit || keys.tap)) {
      // **Guarded on the clip existing, and it crashed without the guard.** The moon's player
      // has a jump and no attack, so the same key that swings the gorilla's fist was setting
      // a state whose clip is undefined — and the draw then looked up 'undefined-e'. One key
      // means different things to different actors, and the actor decides, not the key.
      keys.tap = false
      P.state = 'attack'; P.atk = 0; P.hit = false
    } else {
      var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
      var dy = pd.roam ? (keys.down ? 1 : 0) - (keys.up ? 1 : 0) : 0

      /**
       * **Eight directions, and the diagonals are scaled so they are not faster.**
       *
       * Pressing two keys gives a vector of length sqrt(2); dividing by it is the oldest fix
       * in games and the one every engine that skips it gets reported for. The depth axis
       * also moves slower than the screen axis, because the floor is foreshortened: a step
       * "into" the picture covers fewer rows than the same step across it.
       */
      if (dx !== 0 || dy !== 0) {
        var norm = dx !== 0 && dy !== 0 ? 0.7071 : 1
        P.state = 'walk'
        P.walk += dt * 1000
        if (dx !== 0) P.face = dx
        P.dir = compass(dx, dy, P.dir)
        P.x = Math.max(pd.minX, Math.min(pd.maxX, P.x + dx * pd.speed * norm * dt))
        if (pd.roam && dy !== 0) {
          P.row = Math.max(pd.roam.minRow, Math.min(pd.roam.maxRow, P.row + dy * pd.roam.depthSpeed * norm * dt))
        }
      } else { P.state = 'idle' }

      // **The jump.** A press while standing buys an upward speed; gravity takes it back.
      // On the moon that ratio is the subject: a sixth of a g gives a hang of over a second,
      // and it is the one number in this scene that a player feels rather than sees.
      if (pd.jump && keys.jumpTap && P.lift === 0) { P.vy = -pd.jump.impulse }
      keys.jumpTap = false
    }

    if (pd.jump) {
      if (P.lift > 0 || P.vy !== 0) {
        P.vy += pd.jump.gravity * dt
        P.lift = P.lift - P.vy * dt
        if (P.lift <= 0) { P.lift = 0; P.vy = 0 }
        P.state = 'jump'
      }
    }

    for (var c = 0; c < crew.length; c++) {
      var n = crew[c], a = n.a
      if (n.state === 'away') {
        if (t >= n.next) {
          n.state = 'in'; n.clock = 0
          n.x = a.from === 'left' ? -40 : S.w + 40
          n.face = a.from === 'left' ? 1 : -1
        }
      } else if (n.state === 'in') {
        // He stops a fixed distance short, on his own side of the gorilla. Walking THROUGH
        // the subject is the failure this one number prevents.
        var goal = P ? P.x + (a.from === 'left' ? -a.standoff : a.standoff) : n.x
        var step = a.walkSpeed * dt
        n.face = n.x < goal ? 1 : -1
        n.clock += dt * 1000
        if (Math.abs(n.x - goal) <= step) { n.x = goal; n.state = 'prone'; n.shot = t + 0.6 }
        else { n.x += (goal > n.x ? 1 : -1) * step }
      } else if (n.state === 'prone') {
        n.clock += dt * 1000
        // Lying still, he still tracks the animal: the lens follows the subject, which is
        // the one thing a photographer does that a rock does not.
        if (P) n.face = P.x > n.x ? 1 : -1
        if (t >= n.shot) { n.shot = t + a.shutter; n.flash = t }
      } else {
        n.clock += dt * 1000
        n.x += n.face * a.fleeSpeed * dt
        if (n.x < -60 || n.x > S.w + 60) { n.state = 'away'; n.next = t + a.period }
      }
    }
  }

  /**
   * **A drop is a sprite, stamped once per column.** It used to be one fillRect per drop
   * pixel — 240 calls a frame against 19 for every subject in the wood put together, and a
   * canvas call costs the same whether it moves one pixel or a thousand. 48 now.
   *
   * The stamp is byte-identical to the per-pixel version because x0 and the row index are
   * both integers: round(x0 + k*slant) equals x0 + round(k*slant) for integer x0, so baking
   * the slant into the stamp changes nothing. It is a cheaper way to say the same thing, not
   * a cheaper-looking rain.
   */
  var drops = null
  if (S.rain) {
    drops = []
    for (var ci = 0; ci < S.rain.colors.length; ci++) {
      var xs = [], lo = 0, hi = 0
      for (var dk = 0; dk < S.rain.length; dk++) {
        // **Named 'lean', and the name is the bug fix.** It was 'off', which is also the name
        // of the offscreen buffer twelve lines up — and 'var' is function-scoped, so building
        // the rain stamps quietly replaced the canvas the whole page draws into with the
        // number -1. Every frame then called drawImage on an integer.
        var lean = Math.round(dk * S.rain.slant); xs.push(lean)
        if (lean < lo) lo = lean
        if (lean > hi) hi = lean
      }
      var stamp = cv(hi - lo + 1, S.rain.length), stx = stamp.getContext('2d')
      stx.fillStyle = rgb(S.rain.colors[ci])
      for (var dj = 0; dj < S.rain.length; dj++) stx.fillRect(xs[dj] - lo, dj, 1, 1)
      drops.push({ canvas: stamp, ox: lo })
    }
  }

  function rain(t) {
    var R = S.rain; if (!R) return
    var span = S.h + R.length * 2
    var cols = Math.ceil(S.w / R.spacing) + 2
    for (var c = 0; c < cols; c++) {
      // The same integer hash the compositor used, so the sheet is irregular and identical
      // on every machine. What changed is only that its phase now advances in seconds.
      // The trailing >>> 0 is load-bearing: XOR in JS yields a SIGNED 32-bit integer, so
      // without it hsh goes negative and hsh % colors.length returns -1. That indexed one
      // slot before the rain's palette in the compositor and had done since the rain was
      // written — silently, because the wrong entry is a plausible grey.
      var hsh = ((c + R.seed) * 2654435761) >>> 0; hsh = (hsh ^ (hsh >>> 13)) >>> 0
      var ph = (hsh % 1024) / 1024
      var x0 = c * R.spacing + (hsh % R.spacing)
      var d = drops[hsh % drops.length]
      var fall = (((t * R.speed / span) + ph) % 1) * span - R.length
      ox.drawImage(d.canvas, x0 + d.ox, Math.round(fall))
    }
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
  var meter = { gaps: [], work: [], at: 0, worst: 0, decode: 0 }
  meter.decode = decodeMs

  function report(now) {
    if (!S.meter || now - meter.at < 500) return
    meter.at = now
    var el = document.getElementById('meter'); if (!el) return
    var g = meter.gaps, w = meter.work
    if (g.length === 0) return
    var sg = 0, sw = 0, mx = 0
    for (var i = 0; i < g.length; i++) { sg += g[i]; sw += w[i]; if (w[i] > mx) mx = w[i] }
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
  var drawn = []

  var t0 = null, prev = 0
  function frame(now) {
    var began = clock()
    if (t0 === null) t0 = now
    var t = (now - t0) / 1000
    var dt = Math.min(0.05, t - prev)
    // 120 frames is two seconds at 60 fps: long enough that one slow frame does not dominate
    // the average, short enough that a stall shows up while it is still happening.
    if (prev > 0) { meter.gaps.push((t - prev) * 1000); if (meter.gaps.length > 120) meter.gaps.shift() }
    prev = t

    // **A climbing scene takes the other path entirely.** Its camera moves, its cast is one
    // subject and an unbounded number of stamps, and its backdrop is a function of altitude —
    // none of which the fixed-camera loop below has any way to express.
    if (S.runner && R) {
      drawn.length = 0
      runner(t, dt)
      drawRunner(t)
      vx.drawImage(off, 0, 0, view.width, view.height)
      meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
      report(now); runnerScore(now)
      requestAnimationFrame(frame)
      return
    }

    // **A descent takes its own path**: a fourth camera, a fourth loop.
    if (S.descent && DS) {
      drawn.length = 0
      descend(t, dt)
      drawDescent(t)
      vx.drawImage(off, 0, 0, view.width, view.height)
      meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
      report(now); descentScore(now)
      requestAnimationFrame(frame)
      return
    }

    if (S.climb && K) {
      drawn.length = 0
      climb(t, dt)
      drawClimb(t)
      vx.drawImage(off, 0, 0, view.width, view.height)
      meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
      report(now); score(now)
      requestAnimationFrame(frame)
      return
    }

    think(t, dt)

    ox.drawImage(bg, 0, 0)
    rain(t)

    var flash = 0
    drawn.length = 0
    /**
     * **The y-sort, and it exists because he can now walk toward the camera.**
     *
     * Every other subject in this project has a fixed contact row, so paint order is decided
     * once when the stage is built. A roaming player does not: walk south past a boulder and
     * you have to come out in front of it. So the order is rebuilt each frame, and only for
     * the one subject whose row is state rather than data.
     */
    var seq = S.order
    if (P && S.placed[P.at].player && S.placed[P.at].player.roam) {
      seq = S.order.slice()
      seq.splice(seq.indexOf(P.at), 1)
      var slot = 0
      while (slot < seq.length && S.placed[seq[slot]].y <= P.row) slot++
      seq.splice(slot, 0, P.at)
    }
    for (var oi = 0; oi < seq.length; oi++) {
      var i = seq[oi]
      var D = S.placed[i], li = D.layer, L, f, dx, dy

      if (D.player && P) {
        // The state names a clip; the clip names a layer. Nothing about which animation runs
        // has ever reached the sprites, which is why an idle cost a gait and not a rewrite.
        var pd = D.player
        var base = P.state === 'attack' ? pd.attack
          : P.state === 'jump' ? (pd.jump ? pd.jump.clip : pd.idle)
          : P.state === 'walk' ? pd.walk : pd.idle
        // **A facing is part of the clip's name.** 'lope' plus '-ne' is a grammar, generated
        // by yawing the authored body, and the runtime never learns what a yaw is.
        var name = D.clips[base + '-' + P.dir] ? base + '-' + P.dir : base
        var pair = D.clips[name]
        // The western half is the eastern half mirrored. 'n' and 's' face the camera and are
        // symmetric, so mirroring them would be a flip nobody could see and a layer nobody
        // needs — they use the un-mirrored render whichever way he last walked.
        var mirror = P.face < 0 && P.dir !== 'n' && P.dir !== 's'
        li = mirror ? pair.left : pair.right
        L = S.layers[li]
        var own = P.state === 'attack' ? P.atk * 1000
          : P.state === 'jump' ? t * 1000
          : P.state === 'walk' ? P.walk : t * 1000
        // The attack plays ONCE and holds its last frame until the state clears, or a fast
        // clip loops back to the wind-up mid-swing and the blow appears to be thrown twice.
        f = P.state === 'attack'
          ? Math.min(L.n - 1, Math.floor(own / L.ms))
          : Math.floor(own / L.ms) % L.n
        dx = Math.round(P.x) + L.ox
        // The row he STANDS on drives the sprite; the height he has jumped to lifts it after.
        var stand = { anchor: D.anchor, y: Math.round(P.row) }
        dy = rowOf(stand, L) - Math.round(P.lift)

        /**
         * **The shadow, and it is the only thing telling a player where he will land.**
         *
         * A jumping body leaves its contact row and the shadow does not. Without it a jump in
         * an overhead view is a sprite drifting upward for no reason, and the landing is a
         * surprise. It shrinks with height because that is what a shadow does, and it is one
         * ellipse: the cheapest possible answer to the most necessary feedback in the scene.
         */
        if (pd.jump) {
          var lift = P.lift
          var k = Math.max(0.45, 1 - lift / 44)
          ox.globalAlpha = 0.42 * k
          ox.fillStyle = '#000000'
          var sw = Math.round(L.w * 0.34 * k), sh = Math.max(1, Math.round(sw * 0.4))
          ox.beginPath()
          ox.ellipse(Math.round(P.x), Math.round(P.row) - 1, sw, sh, 0, 0, 6.283185)
          ox.fill()
          ox.globalAlpha = 1
        }
      } else if (D.approach) {
        var me = null
        for (var c = 0; c < crew.length; c++) if (crew[c].at === i) me = crew[c]
        var cn = me.state === 'in' ? D.approach.walk : me.state === 'prone' ? D.approach.prone : D.approach.flee
        var pr = D.clips[cn]
        li = me.face < 0 ? pr.left : pr.right
        L = S.layers[li]
        f = Math.floor(me.clock / L.ms) % L.n
        dx = Math.round(me.x) + L.ox
        // Anchored against THIS clip's own feet, so the body that lies down meets the same
        // floor as the body that walked in.
        dy = rowOf(D, L)
        if (me.state === 'away') continue
        if (me.flash !== undefined && t - me.flash < 0.07) flash = 1
      } else {
        L = S.layers[li]
        f = Math.floor(t * 1000 / L.ms + D.phase * L.n) % L.n
        dx = D.x + L.ox; dy = rowOf(D, L)
        if (D.motion) {
          // Continuous in seconds, so there is no loop point to be seamless at. The sway
          // term is what makes the speed rise and fall: a cloud that travels at one rate is
          // a cutout on a rail.
          var M = D.motion, u = 6.283185 * (t / M.period + M.at)
          dx += M.speed * t + M.swayX * Math.sin(u)
          dy += M.bobY * Math.sin(u * 0.61 + 2.3)
          // Wrap with a whole sprite width of margin off each edge, so it leaves and returns
          // entirely off screen rather than reappearing cut in half.
          var span2 = S.w + L.w
          dx = ((dx + L.w) % span2 + span2) % span2 - L.w
        }
      }
      drawn.push(i)
      ox.drawImage(sheets[li], 0, f * L.h, L.w, L.h, Math.round(dx), Math.round(dy), L.w, L.h)
    }

    // **The shutter.** One rectangle, and it is the cheapest possible way to say a photograph
    // was taken — which is the whole state the player is being asked to prevent. A flash the
    // player cannot see is a mechanic with no feedback.
    if (flash) {
      ox.globalAlpha = 0.34
      ox.fillStyle = '#ffffff'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }

    vx.drawImage(off, 0, 0, view.width, view.height)
    meter.work.push(clock() - began); if (meter.work.length > 120) meter.work.shift()
    report(now)
    requestAnimationFrame(frame)
  }
  el.appendChild(view)
  requestAnimationFrame(frame)
  /**
   * **What the loop is thinking, readable from outside it.**
   *
   * 'drawn' has always been here: which slot each blit belongs to, because a subject that is
   * off screen is not drawn and position in the call list is not position in the scene. 'state'
   * is the same idea one level up, and it exists because a scrolling game cannot be diagnosed
   * from its draw calls at all — a screen row is a world row minus a camera, and neither of the
   * two is recoverable from their difference.
   *
   * It is a **findings channel and not a picture** (\'CLAUDE.md\' §5): it answers questions about
   * the state, and it cannot show pixels. The first thing it found was a locked orbit that four
   * different tuning sweeps had failed to explain.
   */
  return { view: view, drawn: drawn, state: function () { return R || K || DS || P } }
}
`

const STYLE = `
  :root {
    --ink: #e8e6e3; --dim: #8b8783; --line: #2a2a2e;
    --bg: #131316; --card: #1b1b20; --accent: #d9b26a;
  }
  * { box-sizing: border-box }
  html, body { margin: 0; background: var(--bg); color: var(--ink) }
  body {
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px }
  canvas { image-rendering: pixelated; display: block; max-width: 100% }
  a { color: inherit; text-decoration: none }
  header {
    border-bottom: 1px solid var(--line); padding: 22px 32px;
    display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
  }
  header h1 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: .01em }
  header .sub { color: var(--dim); font-size: 13px }
  main { padding: 32px; max-width: 1400px; margin: 0 auto }

  .shelf { display: grid; gap: 26px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)) }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    overflow: hidden; display: flex; flex-direction: column;
    transition: border-color .14s ease, transform .14s ease;
  }
  .card:hover { border-color: var(--accent); transform: translateY(-2px) }
  .thumb { display: flex; align-items: center; justify-content: center;
           padding: 18px; background: #0e0e11; border-bottom: 1px solid var(--line) }
  .card .body { padding: 16px 18px 18px }
  .card h2 { margin: 0 0 6px; font-size: 15px; font-weight: 600 }
  .card p { margin: 0; color: var(--dim); font-size: 13.5px; line-height: 1.5 }
  .card .meta { margin-top: 12px; color: #6c6a68; font-size: 11.5px; letter-spacing: .02em }

  .stage { display: flex; justify-content: center; padding: 8px 0 20px }
  .stage > div { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #0e0e11 }
  .about { max-width: 860px; margin: 0 auto }
  .about p { margin: 0 0 14px; color: var(--dim) }
  .facts { display: flex; gap: 22px; flex-wrap: wrap; color: #6c6a68; font-size: 12px; border-top: 1px solid var(--line); padding-top: 14px }
  .meter { max-width: 860px; margin: 0 auto 14px; display: flex; gap: 18px; flex-wrap: wrap;
           align-items: center; color: var(--ink); background: #10131a;
           border: 1px solid var(--line); border-radius: 8px; padding: 11px 16px; font-size: 12.5px }
  .tag { color: #6c6a68; text-transform: uppercase; letter-spacing: .09em; font-size: 10.5px }
  .facts .tag { margin-right: -8px }
  .score { max-width: 860px; margin: 0 auto 6px; text-align: center; font-size: 20px;
           letter-spacing: .04em; color: var(--accent) }
  .keys { margin: 0 auto 20px; max-width: 860px; text-align: center;
          color: var(--ink); font-size: 13px; background: var(--card);
          border: 1px solid var(--line); border-radius: 8px; padding: 12px 18px }
  .keys b { color: var(--accent); font-family: ui-monospace, Menlo, monospace }
  .back { color: var(--dim); font-size: 13px }
  .back:hover { color: var(--accent) }
  .empty { color: var(--dim); text-align: center; padding: 60px 0 }
  /* The page's own perception channel. I cannot look at his browser, so it has to speak. */
  #boot { max-width: 860px; margin: 0 auto 14px; padding: 11px 16px; border-radius: 8px;
          border: 1px solid var(--line); background: #10131a; color: var(--dim); font-size: 12.5px }
  #boot.bad { border-color: #a8453c; background: #241416; color: #f0b7b0; white-space: pre-wrap }
`

const shell = (title: string, head: string, body: string, script: string): string =>
  `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLE}</style>
<header>${head}</header>
<main>${body}</main>
<script>${RUNTIME}${script}</script>
`

/** **The shelf.** Cards run the same runtime with input off, at scale 1. */
export function shelfPage(games: readonly AppGame[]): string {
  const cards = games
    .map(
      (g, i) => `
    <a class="card" href="/${esc(g.id)}">
      <div class="thumb" id="t${i}"></div>
      <div class="body">
        <h2>${esc(g.title)}</h2>
        <p>${esc(g.blurb)}</p>
        <div class="meta mono">${esc(g.meta.join(' · '))}</div>
      </div>
    </a>`,
    )
    .join('')

  const mounts = games.map((g, i) => `mount(document.getElementById('t${i}'), ${payloadOf(g.stage, 1, false)});`).join('\n')

  return shell(
    'claude-ink-2d · micro games',
    `<h1>claude-ink-2d</h1><span class="sub">micro games — every object here belongs to a scene, never to a cell</span>`,
    games.length === 0 ? `<div class="empty">nothing on the shelf yet</div>` : `<div class="shelf">${cards}</div>`,
    mounts,
  )
}

/** **One game, big, and playable.** Input is bound on this route and nowhere else. */
export function gamePage(game: AppGame): string {
  const playable = game.stage.placed.some((p) => p.player !== undefined || p.climber !== undefined || p.runs !== undefined || p.rides !== undefined)
  // **The score is a DOM element and not a sprite.** A HUD is not art: baking a number into an
  // indexed buffer would mean drawing a font, and a font is the one thing in a pixel game that
  // has to be legible at every scale rather than beautiful at one.
  const scored = game.stage.climb !== null || game.stage.runner !== null || game.stage.descent !== null
  return shell(
    `${game.title} · claude-ink-2d`,
    `<a class="back" href="/">← shelf</a><h1>${esc(game.title)}</h1><span class="sub mono">${esc(game.id)}</span>`,
    `${scored ? `<div class="score mono" id="score">0.0 m</div>` : ''}
     <div id="boot" class="mono"></div>
     <div class="stage"><div id="stage"></div></div>
     <div class="meter mono"><span class="tag">measured</span><span id="meter">warming up…</span></div>
     ${playable ? `<div class="keys">${esc(game.keys ?? '← → walk · space act')}</div>` : ''}
     <div class="about">
       <p>${esc(game.blurb)}</p>
       <div class="facts mono"><span class="tag">budget</span>${budgetFacts(budgetOf(game.stage, game.gzipBytes ?? 0))
         .map((m) => `<span>${esc(m)}</span>`)
         .join('')}</div>
       <div class="facts mono">${game.meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
     </div>`,
    `
     var __boot = document.getElementById('boot');
     function __say(kind, text) { if (!__boot) return; __boot.className = 'mono ' + kind; __boot.textContent = text }
     window.onerror = function (msg, src, line, col, err) {
       __say('bad', 'the runtime threw and the game is not running:\\n' + msg + '\\n' + ((err && err.stack) || '') );
       return false
     };
     var __last = null;
     try {
       __last = mount(document.getElementById('stage'), ${payloadOf(game.stage, game.stage.scale, true)});
       __say('', 'running — ${game.stage.layers.length} layers, ${game.stage.w}×${game.stage.h} at ×${game.stage.scale}');
     } catch (e) {
       __say('bad', 'mount failed and the game is not running:\\n' + (e && (e.stack || e.message) || e));
     }`,
  )
}
