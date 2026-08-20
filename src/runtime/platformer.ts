/**
 * **The Orrery's game shape.** Simulation sees exact quarter turns only; presentation eases
 * between them. That split keeps collision axis-aligned and replayable while the room still
 * reads as one continuous machine in motion.
 */
import { boxTouchesCircle, boxWalls, overlaps, turnBox, turnPoint } from './collision.ts'
import { makeAudio } from './audio.ts'
import { layerAt, rgb } from './paint.ts'
import { inactive } from './types.ts'
import type { Box } from './collision.ts'
import type { KeeperState, Keeps, Layer, Placed, Shape, Shared, StagePlatformer } from './types.ts'

/** The animation graph is data, so an impossible transition fails at the step that asks for it. */
const TRANSITIONS: Readonly<Record<KeeperState, readonly KeeperState[]>> = {
  // Grounded actors can leave a ledge without jumping. `fall` is therefore a direct edge from
  // both locomotion states, not only from `rise` after the apex.
  idle: ['run', 'rise', 'fall', 'brace', 'dead', 'won'],
  run: ['idle', 'rise', 'fall', 'brace', 'dead', 'won'],
  rise: ['fall', 'idle', 'run', 'brace', 'dead', 'won'],
  // Coyote time deliberately permits a jump just after a ledge has changed `run` to `fall`.
  fall: ['rise', 'idle', 'run', 'brace', 'dead', 'won'],
  // Rotation normally resolves to `fall`; R is also valid while the keeper is bracing.
  brace: ['fall', 'idle'],
  dead: ['idle'],
  won: ['idle'],
}

export function makePlatformer(c: Shared): Shape {
  const { S, ox, sheets, keys } = c
  const block = S.platformer
  if (block === null) return inactive()
  const N: StagePlatformer = block
  const found = ((): { at: number; D: Placed; act: NonNullable<Placed['keeper']>; clips: NonNullable<Placed['clips']> } | null => {
    for (var i = 0; i < S.placed.length; i++) {
      var p = S.placed[i]!
      if (p.keeper !== undefined && p.clips !== undefined) return { at: i, D: p, act: p.keeper, clips: p.clips }
    }
    return null
  })()
  if (found === null) return inactive()
  const D = found.D, A = found.act, clips = found.clips
  const cx = S.w / 2, cy = S.h / 2
  const K: Keeps = {
    at: found.at, x: N.startX, y: N.startY, vx: 0, vy: 0, face: 1,
    state: 'idle', stateAt: 0, walked: 0, grounded: false,
    turn: 0, turning: 0, turnFrom: 0, turnClock: 0,
    suns: 0, over: false, won: false, elapsed: 0, best: 0,
  }
  var lastGround = -99
  var jumpUntil = -99
  var scoreAt = 0
  const audio = makeAudio(S.interactive)

  function enter(next: KeeperState, t: number): void {
    if (K.state === next) return
    if (!TRANSITIONS[K.state].includes(next)) throw new Error('illegal keeper transition ' + K.state + ' -> ' + next)
    K.state = next
    K.stateAt = t
  }

  function body(): Box { return { x: K.x - N.bodyHalfW, y: K.y - N.bodyH, w: N.bodyHalfW * 2, h: N.bodyH } }
  function authoredSolids(): readonly Box[] { return [...boxWalls(N.bounds, N.wall), ...N.solids] }
  function solids(): Box[] { return authoredSolids().map(function (b) { return turnBox(b, K.turn, cx, cy) }) }

  /**
   * Keep the upright collision body inside the room after its foot point has been rotated.
   * Solid-box resolution needs an old position on the safe side of a wall; a quarter turn can
   * instead begin with the body already embedded in that wall, so the room boundary is the
   * authoritative final constraint.
   */
  function contain(t: number): void {
    var r = turnBox(N.bounds, K.turn, cx, cy)
    var minX = r.x + N.bodyHalfW, maxX = r.x + r.w - N.bodyHalfW
    var minY = r.y + N.bodyH, maxY = r.y + r.h
    if (K.x < minX) { K.x = minX; if (K.vx < 0) K.vx = 0 }
    if (K.x > maxX) { K.x = maxX; if (K.vx > 0) K.vx = 0 }
    if (K.y < minY) { K.y = minY; if (K.vy < 0) K.vy = 0 }
    if (K.y > maxY) {
      K.y = maxY; if (K.vy > 0) K.vy = 0
      K.grounded = true; lastGround = t
    }
  }

  function reset(t: number): void {
    K.x = N.startX; K.y = N.startY; K.vx = 0; K.vy = 0; K.face = 1
    K.turn = 0; K.turning = 0; K.turnFrom = 0; K.turnClock = 0
    K.suns = 0; K.over = false; K.won = false; K.elapsed = 0; K.walked = 0
    K.grounded = false; lastGround = -99; jumpUntil = -99
    enter('idle', t)
  }

  function die(t: number): void {
    K.over = true; K.vx = 0; K.vy = 0; enter('dead', t); audio.cue('death')
  }

  function activate(): void {
    var b = body()
    var before = K.suns
    for (var i = 0; i < N.suns.length; i++) {
      if ((K.suns & (1 << i)) !== 0) continue
      var s = N.suns[i]!
      var q = turnPoint(s.x, s.y, K.turn, cx, cy)
      // The drawn cog has teeth and a one-pixel outline outside its declared disc. Six pixels
      // include those teeth plus one generous contact cell, so what looks touched is touched.
      if (boxTouchesCircle(b, q.x, q.y, s.r + 6)) K.suns |= 1 << i
    }
    if (K.suns !== before) audio.cue('sun')
  }

  function finishTurn(t: number): void {
    var q = turnPoint(K.x, K.y, 1, cx, cy)
    K.x = q.x; K.y = q.y
    var vx = K.vx, vy = K.vy
    K.vx = -vy * 0.35; K.vy = vx * 0.35
    K.turn = (K.turn + 1) % 4
    K.turnFrom = K.turn; K.turning = 0; K.turnClock = 0; K.grounded = false
    contain(t)
    enter('fall', t)
  }

  function step(t: number, dt: number): void {
    if (keys.muteTap) { keys.muteTap = false; audio.toggle() }
    if (keys.restartTap || ((K.over || K.won) && keys.primaryTap)) {
      keys.restartTap = false; keys.primaryTap = false; reset(t); return
    }
    if (K.over || K.won) { keys.secondaryTap = false; keys.primaryTap = false; return }
    K.elapsed += dt

    if (keys.secondaryTap && K.turning === 0) {
      keys.secondaryTap = false
      K.turnFrom = K.turn; K.turning = 1; K.turnClock = 0; K.vx = 0; K.vy = 0
      enter('brace', t); audio.cue('rotate')
    }
    if (K.turning !== 0) {
      K.turnClock += dt
      if (K.turnClock * 1000 >= N.rotateMs) finishTurn(t)
      return
    }

    if (keys.primaryTap) { keys.primaryTap = false; jumpUntil = t + N.bufferMs / 1000 }
    if (K.grounded) lastGround = t
    if (jumpUntil >= t && t - lastGround <= N.coyoteMs / 1000) {
      K.vy = -N.jump; K.grounded = false; jumpUntil = -99; enter('rise', t)
    }

    var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    if (dir !== 0) {
      K.vx += dir * N.accel * dt
      if (K.vx > N.speed) K.vx = N.speed
      if (K.vx < -N.speed) K.vx = -N.speed
      K.face = dir
    } else {
      var brake = N.friction * dt
      if (Math.abs(K.vx) <= brake) K.vx = 0
      else K.vx -= Math.sign(K.vx) * brake
    }

    var oldX = K.x
    K.x += K.vx * dt
    var bs = solids()
    for (var i = 0; i < bs.length; i++) {
      var wall = bs[i]!
      if (!overlaps(body(), wall)) continue
      if (K.vx > 0 && oldX + N.bodyHalfW <= wall.x + 1) K.x = wall.x - N.bodyHalfW
      else if (K.vx < 0 && oldX - N.bodyHalfW >= wall.x + wall.w - 1) K.x = wall.x + wall.w + N.bodyHalfW
      // `vx` is also the controller's horizontal intent. Keep it while the player presses into
      // a wall: position is still projected exactly to the face, and the stored intent lets a
      // jump leave the corner on the first step that clears it. With no input it is physical
      // velocity again and the wall stops it.
      if (dir === 0) K.vx = 0
    }
    K.walked += Math.abs(K.x - oldX)

    var oldY = K.y
    K.vy += N.gravity * dt
    K.y += K.vy * dt
    K.grounded = false
    for (var j = 0; j < bs.length; j++) {
      var floor = bs[j]!
      if (!overlaps(body(), floor)) continue
      if (K.vy >= 0 && oldY <= floor.y + 1) {
        K.y = floor.y; K.vy = 0; K.grounded = true; lastGround = t
      } else if (K.vy < 0 && oldY - N.bodyH >= floor.y + floor.h - 1) {
        K.y = floor.y + floor.h + N.bodyH; K.vy = 0
      }
    }
    contain(t)

    if (K.grounded) enter(Math.abs(K.vx) > 4 ? 'run' : 'idle', t)
    else enter(K.vy < 0 ? 'rise' : 'fall', t)

    activate()
    var core = turnPoint(N.core.x, N.core.y, K.turn, cx, cy)
    if (boxTouchesCircle(body(), core.x, core.y, N.core.r)) die(t)
    if (K.y > S.h + N.bodyH || K.y < -N.bodyH || K.x < -N.bodyH || K.x > S.w + N.bodyH) die(t)

    if (K.suns === (1 << N.suns.length) - 1) {
      var hatch = turnBox(N.hatch, K.turn, cx, cy)
      if (overlaps(body(), hatch)) {
        K.won = true; K.best = K.best === 0 ? K.elapsed : Math.min(K.best, K.elapsed); K.vx = 0; K.vy = 0
        enter('won', t); audio.cue('win')
      }
    }
  }

  function point(x: number, y: number, angle: number): { x: number; y: number } {
    var a = angle * Math.PI / 2, dx = x - cx, dy = y - cy
    return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) }
  }

  function poly(b: Box, angle: number, fill: string, stroke?: string): void {
    var a = point(b.x, b.y, angle), d = point(b.x + b.w, b.y, angle)
    var e = point(b.x + b.w, b.y + b.h, angle), f = point(b.x, b.y + b.h, angle)
    ox.beginPath(); ox.moveTo(a.x, a.y); ox.lineTo(d.x, d.y); ox.lineTo(e.x, e.y); ox.lineTo(f.x, f.y); ox.closePath()
    ox.fillStyle = fill; ox.fill()
    if (stroke !== undefined) { ox.strokeStyle = stroke; ox.lineWidth = 1; ox.stroke() }
  }

  function line(x0: number, y0: number, x1: number, y1: number, angle: number): void {
    var a = point(x0, y0, angle), b = point(x1, y1, angle)
    ox.beginPath(); ox.moveTo(a.x, a.y); ox.lineTo(b.x, b.y); ox.stroke()
  }

  function stamp(L: Layer, li: number, x: number, y: number, frame: number): void {
    ox.drawImage(sheets[li]!, 0, frame * L.h, L.w, L.h, Math.round(x + L.ox), Math.round(y + L.oy), L.w, L.h)
  }

  function actorAt(t: number, angle: number): void {
    var name = K.state === 'run' ? A.run : K.state === 'rise' ? A.rise : K.state === 'fall' || K.state === 'dead' ? A.fall : K.state === 'brace' ? A.brace : A.idle
    var pair = clips[name]
    if (pair === undefined) throw new Error('keeper clip "' + name + '" was not resolved')
    var li = K.face < 0 ? pair.left : pair.right
    var L = layerAt(S, li)
    var phase = K.state === 'run' ? K.walked / N.strideLen : (t - K.stateAt) * 1000 / (L.ms * L.n)
    var frame = Math.floor(phase * L.n) % L.n
    var p = K.turning === 0 ? { x: K.x, y: K.y } : point(K.x, K.y, angle - K.turnFrom)
    // K.y is the foot contact; each pose owns its own cropped foot offset.
    stamp(L, li, p.x, p.y - L.foot, frame)
  }

  function draw(t: number): void {
    var C = N.colors
    ox.fillStyle = rgb(C.void); ox.fillRect(0, 0, S.w, S.h)

    // Static side cabinets keep the rotating playfield square and make the 320-wide frame feel
    // authored instead of letterboxed.
    ox.fillStyle = rgb(C.tealDark); ox.fillRect(0, 0, 72, S.h); ox.fillRect(248, 0, 72, S.h)
    ox.fillStyle = rgb(C.ink)
    for (var sy = 8; sy < S.h; sy += 12) { ox.fillRect(8, sy, 52, 1); ox.fillRect(260, S.h - sy, 52, 1) }
    ox.fillStyle = rgb(C.brass)
    for (var pin = 0; pin < 8; pin++) {
      var h = ((pin + N.seed) * 2654435761) >>> 0
      ox.fillRect(15 + (h % 38), 10 + ((h >>> 8) % 156), 2, 2)
      ox.fillRect(267 + ((h >>> 4) % 38), 10 + ((h >>> 12) % 156), 2, 2)
    }

    var p = K.turning === 0 ? 0 : Math.min(1, K.turnClock * 1000 / N.rotateMs)
    p = p * p * (3 - 2 * p)
    var angle = K.turnFrom + p
    poly({ x: 76, y: 6, w: 168, h: 168 }, angle, rgb(K.suns === 7 ? C.chamberHi : C.chamber), rgb(C.brass))

    // Concentric mechanisms run at separate exact rates. The room angle is added, so a turn is
    // visible even when the platform nearest the keeper leaves the frame behind it.
    for (var ri = 0; ri < N.rings.length; ri++) {
      var ring = N.rings[ri]!
      ox.strokeStyle = rgb(ri === 1 && K.suns === 7 ? C.brassHi : C.teal); ox.lineWidth = 1
      ox.beginPath(); ox.ellipse(cx, cy, ring.r, ring.r, 0, 0, Math.PI * 2); ox.stroke()
      var spin = angle + t * ring.speed
      for (var sp = 0; sp < ring.spokes; sp++) {
        var a = (spin + sp * 4 / ring.spokes) * Math.PI / 2
        var r0 = ring.r - 3, r1 = ring.r + 3
        ox.beginPath(); ox.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
        ox.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ox.stroke()
      }
    }

    // Powered lines are drawn below solids and sprites. Each sun completes one third of the
    // circuit, so progress exists in the world and not only in the HUD.
    ox.strokeStyle = rgb(C.brassHi); ox.lineWidth = 1
    for (var wi = 0; wi < N.suns.length; wi++) if ((K.suns & (1 << wi)) !== 0) {
      var ws = N.suns[wi]!
      line(N.core.x, N.core.y, ws.x, ws.y, angle)
    }

    var worldSolids = authoredSolids()
    for (var si = 0; si < worldSolids.length; si++) {
      poly(worldSolids[si]!, angle, rgb(C.tealDark), rgb(si < 4 ? C.brassHi : C.brass))
    }

    var hatchFill = K.suns === 7 ? rgb(C.bone) : rgb(C.ink)
    poly(N.hatch, angle, hatchFill, rgb(K.suns === 7 ? C.brassHi : C.teal))
    ox.strokeStyle = rgb(C.brass)
    var hx = N.hatch.x + N.hatch.w / 2
    line(hx, N.hatch.y + 3, hx, N.hatch.y + N.hatch.h - 3, angle)

    for (var sun = 0; sun < N.suns.length; sun++) {
      var sd = N.suns[sun]!, pos = point(sd.x, sd.y, angle)
      var li = (K.suns & (1 << sun)) !== 0 ? N.sun.lit : N.sun.dormant
      var SL = layerAt(S, li)
      stamp(SL, li, pos.x, pos.y, 0)
    }

    // The core is the fixed danger at the centre: all room turns happen around it, so it never
    // drifts and cannot be mistaken for decoration that moved into the player's path.
    ox.fillStyle = rgb(C.ink); ox.beginPath(); ox.ellipse(cx, cy, N.core.r + 5, N.core.r + 5, 0, 0, Math.PI * 2); ox.fill()
    ox.fillStyle = rgb(C.vermilion); ox.beginPath(); ox.ellipse(cx, cy, N.core.r, N.core.r, 0, 0, Math.PI * 2); ox.fill()
    ox.fillStyle = rgb(C.brassHi); ox.fillRect(cx - 2, cy - 2, 4, 4)

    if (K.grounded && K.turning === 0) {
      ox.globalAlpha = 0.34; ox.fillStyle = rgb(C.ink); ox.beginPath(); ox.ellipse(K.x, K.y + 1, N.bodyHalfW + 2, 2, 0, 0, Math.PI * 2); ox.fill(); ox.globalAlpha = 1
    }
    actorAt(t, angle)

    // Three small instrument lamps: a redundant, language-free progress channel.
    for (var ui = 0; ui < N.suns.length; ui++) {
      ox.fillStyle = rgb((K.suns & (1 << ui)) !== 0 ? C.bone : C.tealDark)
      ox.fillRect(12 + ui * 8, 10, 5, 3)
    }
  }

  function score(now: number): void {
    if (now - scoreAt < 80) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    if (K.won) el.textContent = 'CIRCUIT COMPLETE · ' + K.elapsed.toFixed(1) + ' s · SPACE TO REPLAY'
    else if (K.over) el.textContent = 'CORE BREACH · R TO RESTART'
    else {
      var count = ((K.suns & 1) ? 1 : 0) + ((K.suns & 2) ? 1 : 0) + ((K.suns & 4) ? 1 : 0)
      el.textContent = count + ' / 3 SUNS · ' + K.elapsed.toFixed(1) + ' s'
    }
  }

  return {
    active: true, step: step, draw: draw, score: score,
    state: function () { return { ...K } },
    observe: function () { return { kind: 'platformer', state: { ...K } } },
  }
}
