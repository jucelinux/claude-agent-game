/**
 * **The runner: a treadmill, a chased distance, and obstacles that must leave the screen before
 * they die.**
 *
 * Three games ride this shape — the crypt, the kickflip and the snowboard — and they differ
 * only in their scene. That is the shape's whole claim, and it is why the despawn defect was
 * one fix in one place rather than three.
 */
import { bayerAt, ramp, rgb, rowOf } from './paint.ts'
import { inactive } from './types.ts'
import type { Runs, Shape, Shared } from './types.ts'

export function makeRunner(c: Shared): Shape {
  const { S, ox, bg, sheets, keys, drawn, cv, rain } = c

  /**
   * **The runner's whole state.** A world distance, a height, a vertical speed, how many jumps
   * are spent, and one number for the thing chasing him.
   */
  const N0 = S.runner
  const R = ((): Runs | null => {
    if (N0 === null) return null
    for (var ri = 0; ri < S.placed.length; ri++) {
      if (S.placed[ri]?.runs === undefined) continue
      return {
        at: ri, dist: 0, y: 0, vy: 0, jumps: 0, state: 'run', clip: 0,
        speed: N0.speed, menace: 0, passed: -1, best: 0, over: false,
      }
    }
    return null
  })()
  /**
   * **A shape that is not in this scene returns before it builds anything.** That early exit is
   * what makes the state a non-null CONSTANT for the rest of the file — including inside every
   * closure below, which is a narrowing TypeScript grants a `const` and refuses a `let`. It is
   * what turned several hundred "possibly null" errors into checked code without one cast.
   */
  if (R === null) return inactive()
  var scoreAt = 0

  /**
   * **The obstacles, and none of them is stored.** Slot 'k' yields a world position and a
   * variant from one integer hash — the same family the stars, the rain and the climb's shelves
   * all use. An endless graveyard costs no memory and is identical on every machine.
   */
  function stoneAt(k) {
    var N = N0
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
    var N = N0
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


  /** The runner's backdrop: a fixed sky, stars, a moon. Nothing here moves with the camera. */
  var runnerBg = null
  if (N0) {
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
    var DZ = N0.dither || { amount: 0, lattice: 4 }
    ramp(rb, S.w, N0.skyRamp, 0, N0.groundRow, DZ)
    if (N0.stars) {
      for (var sj = 0; sj < N0.stars.count; sj++) {
        var sha = ((sj + N0.stars.seed) * 2654435761) >>> 0; sha = (sha ^ (sha >>> 13)) >>> 0
        var shb = (sha * 1597334677) >>> 0; shb = (shb ^ (shb >>> 15)) >>> 0
        rb.fillStyle = rgb(N0.stars.colors[shb % N0.stars.colors.length])
        rb.fillRect(sha % S.w, shb % N0.stars.below, 1, 1)
      }
    }
    // The moon: a halo ring under a disc, and it is the only round thing in the picture.
    if (N0.moon) {
      var M0 = N0.moon
      rb.fillStyle = rgb(M0.halo)
      rb.beginPath(); rb.ellipse(M0.x, M0.y, M0.r + 3, M0.r + 3, 0, 0, 6.283185); rb.fill()
      rb.fillStyle = rgb(M0.color)
      rb.beginPath(); rb.ellipse(M0.x, M0.y, M0.r, M0.r, 0, 0, 6.283185); rb.fill()
    }
    // The road, dithered the same way: a receding surface is a ramp from the horizon down, and a
    // flat asphalt is the one thing that would say "this is a render at low resolution".
    if (DZ.amount > 0 && S.floor.length > 2) {
      ramp(rb, S.w, S.floor, N0.groundRow, S.h, DZ)
    } else {
      for (var fy3 = 0; fy3 < S.floor.length; fy3++) {
        rb.fillStyle = rgb(S.floor[fy3]); rb.fillRect(0, N0.groundRow + fy3, S.w, 1)
      }
    }
  }

  function drawRunner(t) {
    var N = N0
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
      // **`fromX` lives on the reaper, not on the runner, and this read the wrong object.**
      // `N.fromX` is undefined, so `rx` was NaN and every frame called drawImage with a
      // non-finite x — which a canvas silently ignores. Death has never been drawn in this
      // game. Found by the compiler in the first hour after the runtime left its template
      // literal; invisible to 628 locks, to the budget, and to four of his own readings.
      var rx = N.reaper.fromX + (N.holdX - 14 - N.reaper.fromX) * R.menace
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
      ? (N0.overText || 'she caught you at ') + R.best.toFixed(0) + ' m  ·  press space to run again'
      : R.best.toFixed(0) + ' m'
  }


  return {
    active: true,
    step: runner, draw: drawRunner, score: runnerScore,
    state: function () { return R },
  }
}
