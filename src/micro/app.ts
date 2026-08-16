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
    groundRamp: stage.groundRamp, floor: stage.floor, stars: stage.stars,
    rain: stage.rain, interactive, meter: interactive,
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

  /**
   * **The state, and it is the whole of what makes this a game rather than a picture.**
   *
   * The player holds a position, a facing and a named state; each photographer holds the
   * same plus a timer. Nothing here is in the sprites — a clip is chosen by the state, and
   * the sprites have never heard of a state.
   */
  var P = null, crew = []
  for (var i = 0; i < S.placed.length; i++) {
    var pl = S.placed[i]
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
  return { view: view, drawn: drawn }
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
  const playable = game.stage.placed.some((p) => p.player !== undefined)
  return shell(
    `${game.title} · claude-ink-2d`,
    `<a class="back" href="/">← shelf</a><h1>${esc(game.title)}</h1><span class="sub mono">${esc(game.id)}</span>`,
    `<div class="stage"><div id="stage"></div></div>
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
