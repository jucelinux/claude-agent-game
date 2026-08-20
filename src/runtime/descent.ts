/**
 * **The descent: the camera looks down the hill, and the world comes at you.**
 *
 * The third camera and the first with a perspective divide. Obstacles are born at the vanishing
 * point and grow through discrete scale bands as they approach — never a stretched sprite.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { ctx2d } from './canvas.ts'
import { bayerAt, layerAt, ramp, rgb, rowOf } from './paint.ts'
import { inactive } from './types.ts'
import type { Canvas, Placed, Rides, Shape, Shared, StageDescent } from './types.ts'

export function makeDescent(c: Shared): Shape {
  const { S, ox, bg, sheets, keys, drawn, cv, rain } = c

  /**
   * **The rider's whole state.** A slope distance, a lane, a hop height, a steer sign and a flag.
   * Everything on screen is derived from these six numbers every frame.
   */
  const block = S.descent
  if (block === null) return inactive()
  /**
   * **Declared non-null rather than merely narrowed, and the difference is a TypeScript rule
   * worth writing down.** A `const` narrowed by an early return stays narrowed inside arrow
   * functions and does NOT inside a hoisted `function` declaration — the compiler cannot prove
   * one was not called first. This runtime is written in hoisted declarations, so the guard
   * yields an alias whose DECLARED type carries the fact. It closed 507 errors without a cast.
   */
  const D0: StageDescent = block
  const found = ((): { st: Rides; D: Placed; act: NonNullable<Placed['rides']>; clips: NonNullable<Placed['clips']> } | null => {
    for (var di = 0; di < S.placed.length; di++) {
      const dp = S.placed[di]!
      if (dp === undefined || dp.rides === undefined || dp.clips === undefined) continue
      return { D: dp, act: dp.rides, clips: dp.clips, st: {
        at: di, dist: 0, x: (D0.minX + D0.maxX) / 2, y: 0, vy: 0,
        steer: 0, clip: 0, speed: D0.speed, best: 0, over: false,
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
  const DS: Rides = found.st
  /**
   * **The actor's own declaration, captured where it was CHECKED.** The state carries a slot
   * index and the loop then re-read `S.placed[at].rides` — which the compiler must treat as
   * optional, because nothing in the type says the slot searched for is the slot being read.
   */
  const DSD = found.D, DSA = found.act, DSC = found.clips
  var scoreAt = 0

  /**
   * **The descent's backdrop, baked once.** Sky strip woven at the top, the piste ramp below,
   * the ridge treeline and the clouds stamped in — all static, which is honesty as much as
   * economy: a far ridge does not visibly move when you travel straight away from it, and a
   * static backdrop is the no-crawl rule by construction.
   */
  const descentBg = cv(S.w, S.h)
  var db = ctx2d(descentBg)
  var DDZ = D0.dither || { amount: 0, lattice: 2 }
  ramp(db, S.w, D0.skyRamp, 0, D0.horizonRow, DDZ)
  ramp(db, S.w, S.floor, D0.horizonRow, S.h, DDZ)
  if (D0.clouds) {
    var DC = D0.clouds, CLD = layerAt(S, DC.layer)
    for (var ci2 = 0; ci2 < DC.count; ci2++) {
      var ch = ((ci2 + DC.seed) * 2654435761) >>> 0; ch = (ch ^ (ch >>> 13)) >>> 0
      var ch2 = (ch * 1597334677) >>> 0; ch2 = (ch2 ^ (ch2 >>> 15)) >>> 0
      db.drawImage(sheets[DC.layer]!, 0, 0, CLD.w, CLD.h,
        (ch % S.w) - Math.round(CLD.w / 2), DC.minY + (ch2 % Math.max(1, DC.maxY - DC.minY)), CLD.w, CLD.h)
    }
  }
  if (D0.ridge) {
    var RG = D0.ridge
    var rgN = Math.ceil(S.w / RG.spacing) + 2
    for (var ri = -1; ri < rgN; ri++) {
      var rh = ((ri + RG.seed) * 2654435761) >>> 0; rh = (rh ^ (rh >>> 13)) >>> 0
      var rh2 = (rh * 1597334677) >>> 0; rh2 = (rh2 ^ (rh2 >>> 15)) >>> 0
      var rli = RG.puffs[(rh2 >>> 5) % RG.puffs.length]!, RL = layerAt(S, rli)
      db.drawImage(sheets[rli]!, 0, 0, RL.w, RL.h,
        ri * RG.spacing + (rh % RG.jitterX) + RL.ox, rowOf({ anchor: 'origin', y: RG.row }, RL), RL.w, RL.h)
    }
  }
  

  /** The descent's obstacles: 2D hashed slots — a slope distance AND a lane, nothing stored. */
  function slopeAt(k: number) {
    var D = D0
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
  function descend(t: number, dt: number) {
    var D = D0
    if (DS.over) {
      if (keys.primaryTap) {
        keys.primaryTap = false
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

    if (keys.primaryTap) {
      keys.primaryTap = false
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
      // Height from band 0, the full-size render: collision truth never depends on which
      // scale band happens to be on screen.
      var SL = layerAt(S, D.stones[sl.v]![0]!)
      if (DS.y > 0 && -SL.oy < D.clearance) continue
      DS.over = true
    }
  }

  /**
   * **The divide, in one function — his batch-7 words compiled.** A thing A slope-pixels
   * ahead of the rider shrinks by zNear/(A+zNear): factor 1 at the rider's own row, smaller
   * toward the horizon. Its screen row and its lane converge by the same factor, so the
   * horizon is a vanishing point rather than a shelf. Behind the rider (A < 0) the factor
   * grows past 1 and the row runs off the bottom — a passed thing exits past the camera on
   * the same curve it arrived by.
   */
  function persp(A: number) { return D0.zNear / Math.max(D0.zNear * 0.28, A + D0.zNear) }

  function descentRow(f: number) { return D0.horizonRow + (D0.holdY - D0.horizonRow) * f }

  function drawDescent(t: number) {
    var D = D0
    ox.drawImage(descentBg, 0, 0)

    /**
     * **The piste dust: the treadmill made visible.** Hashed flecks cycling through the view
     * range on the same perspective curve as everything else — between obstacles, they are
     * the only thing saying the ground moves. Two tones, bigger and faster near the camera.
     */
    if (D.dust) {
      var mid = (D.minX + D.maxX) / 2
      for (var di2 = 0; di2 < D.dust.count; di2++) {
        var uh = ((di2 + D.dust.seed) * 2654435761) >>> 0; uh = (uh ^ (uh >>> 13)) >>> 0
        var uh2 = (uh * 1597334677) >>> 0; uh2 = (uh2 ^ (uh2 >>> 15)) >>> 0
        var ahead = (((uh % D.range) - DS.dist) % D.range + D.range) % D.range
        var fd = persp(ahead)
        var dxw = D.minX + (uh2 % (D.maxX - D.minX))
        ox.fillStyle = rgb(D.dust.colors[uh2 % D.dust.colors.length]!)
        var sz = fd > 0.7 ? 2 : 1
        ox.fillRect(Math.round(mid + (dxw - mid) * fd) , Math.round(descentRow(fd)), sz, sz)
      }
    }

    /**
     * **Slots walk far to near, spawning at the horizon** — the batch-7 correction. Visible
     * ahead-window is [-behind, range]: sd in [dist - behind, dist + range], through leadIn
     * and the jitter as the batch-5 lesson demands.
     */
    var behind = D.zNear * 1.6
    var kFirst = Math.max(0, Math.floor((DS.dist - behind - D.jitterD - D.leadIn) / D.spacingD))
    var kLast = Math.floor((DS.dist + D.range - D.leadIn) / D.spacingD) + 1

    // Painter's order: far first, so k DESCENDS (larger sd = further ahead = nearer horizon);
    // the rider is spliced in when the walk crosses his own row.
    var riderDrawn = false
    for (var k = kLast; k >= kFirst - 1; k--) {
      var beyond = k < kFirst
      // Null exactly when `beyond`, and every read below is already behind that test. Typed as
      // the union rather than asserted, so the compiler checks the pairing instead of trusting it.
      const sl = beyond ? null : slopeAt(k)
      if (!riderDrawn && (sl === null || sl.d <= DS.dist)) {
        riderDrawn = true
        drawRider(t)
      }
      // `sl` is null exactly when `beyond`; testing the value rather than the flag is what
      // lets the compiler follow the pairing instead of being told about it.
      if (sl === null) break
      var A = sl.d - DS.dist
      if (A > D.range || A < -behind) continue
      var f = persp(A)
      // Snap to the nearest rendered band: each is its own crisp drawing, never a resample.
      var si = 0
      for (var b2 = 1; b2 < D.scales.length; b2++) {
        if (Math.abs(D.scales[b2]! - f) < Math.abs(D.scales[si]! - f)) si = b2
      }
      var li = D.stones[sl.v]![si]!, L = layerAt(S, li)
      var mid2 = (D.minX + D.maxX) / 2
      var sx = mid2 + (sl.x - mid2) * f + L.ox
      var top = rowOf({ anchor: 'origin', y: descentRow(f) }, L)
      if (top > S.h || top + L.h < 0) continue
      ox.drawImage(sheets[li]!, 0, 0, L.w, L.h, Math.round(sx), Math.round(top), L.w, L.h)
    }

    rain(t)

    if (DS.over) {
      ox.globalAlpha = 0.5
      ox.fillStyle = '#0a0812'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  function drawRider(t: number) {
    var D = D0
    var pd = S.placed[DS.at]
    // The state names a clip: airborne is the launch, a held key is the carve (mirrored for
    // the other edge by the pair mechanism), and the rest is the glide.
    var cn = DS.y > 0 || DS.vy !== 0 ? DSA.launch : DS.steer !== 0 ? DSA.carve : DSA.glide
    var pair = DSC[cn]!
    var li = DS.steer < 0 ? pair.left : pair.right
    var L = layerAt(S, li)
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
    ox.drawImage(sheets[li]!, 0, f * L.h, L.w, L.h,
      Math.round(DS.x + L.ox), Math.round(rowOf({ anchor: 'origin', y: D.holdY }, L) - DS.y), L.w, L.h)
  }

  function descentScore(now: number) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = DS.over
      ? (D0.overText || 'you wiped out at ') + DS.best.toFixed(0) + ' m  ·  press space to ride again'
      : DS.best.toFixed(0) + ' m'
  }


  return {
    active: true,
    step: descend, draw: drawDescent, score: descentScore,
    state: function () { return DS },
    observe: function () { return { kind: 'descent', state: DS } },
  }
}
