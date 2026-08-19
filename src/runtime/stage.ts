/**
 * **The fixed stage: a camera that does not move, and a cast that does.**
 *
 * The first shape this project had, and the only one where paint order is data rather than a
 * per-frame decision — except for the one subject who roams, whose row is state and who
 * therefore has to be spliced back into the order every frame.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { compass, layerAt, rgb, rowOf } from './paint.ts'
import type { Crew, Placed, Player, Shape, Shared } from './types.ts'

export function makeStage(c: Shared): Shape {
  const { S, ox, bg, sheets, keys, drawn, cv, rain } = c

  /**
   * **The cast, built by two passes rather than one, and the reason is the type.**
   *
   * The player is at most one and may be none; the photographers are a list. Building them in
   * one loop meant `P` had to start as `null` and be assigned inside it — which is exactly the
   * pattern TypeScript cannot narrow inside a hoisted function, and it is what made this file's
   * state invisible for as long as the runtime was a string.
   */
  const cast = ((): { st: Player; D: Placed; act: NonNullable<Placed['player']>; clips: NonNullable<Placed['clips']> } | null => {
    for (var pi = 0; pi < S.placed.length; pi++) {
      const pl = S.placed[pi]!
      if (pl === undefined || pl.player === undefined || pl.clips === undefined) continue
      return { D: pl, act: pl.player, clips: pl.clips, st: {
        at: pi, x: pl.x, row: pl.y, face: 1, dir: 'e',
        state: 'idle', walk: 0, atk: 0, hit: false,
        // Height above the contact row, and the speed it is changing at. Zero is standing.
        lift: 0, vy: 0,
      } }
    }
    return null
  })()
  /**
   * **The player is optional here and only here.** A fixed stage can be a diorama with nobody in
   * it — the forest is one — so unlike the four other shapes this cannot early-return on a null
   * cast. Each function that needs him re-binds it locally, which is the narrowing a hoisted
   * declaration does support.
   */
  const P: Player | null = cast === null ? null : cast.st
  const crew: Crew[] = []
  for (var ci = 0; ci < S.placed.length; ci++) {
    const pl = S.placed[ci]!
    if (pl === undefined || pl.approach === undefined) continue
    const a = pl.approach
    crew.push({
      at: ci, p: pl, a: a, x: a.from === 'left' ? -80 : S.w + 80,
      face: a.from === 'left' ? 1 : -1, state: 'away', clock: 0, next: a.delay, shot: 0,
    })
  }

  /** How long a clip runs, in seconds. The sprite owns its own rate; the state does not. */
  function span(ix: number) { var L = layerAt(S, ix); return L.n * L.ms / 1000 }

  /**
   * **The blow.** Anything prone within reach, on the side he is facing, gets up and runs.
   * It fires once per attack, at 'hitAt' through the clip — anticipation is longer than
   * impact, and a hit that registers on frame 0 registers before the arm has moved.
   */
  function strike() {
    const me = cast
    if (me === null) return
    for (const n of crew) {
      if (n.state !== 'prone') continue
      var dx = n.x - me.st.x
      // **Reach is optional on a player and this is the only place it is read.** A subject with
      // no attack has no reach, and `strike` is only ever called from inside the attack branch —
      // stated here rather than assumed, because the type is the one that knows.
      if (me.act.reach === undefined || Math.abs(dx) > me.act.reach) continue
      if (dx * me.st.face < 0) continue
      n.state = 'out'; n.clock = 0
      n.face = n.a.from === 'left' ? -1 : 1
    }
  }

  function think(t: number, dt: number) {
    const me = cast
    if (me === null) return
    const P = me.st, pd = me.act
    if (P.state === 'attack' && pd.attack !== undefined && pd.hitAt !== undefined) {
      P.atk += dt
      var dur = span(me.clips[pd.attack]!.right)
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

    for (const n of crew) {
      const a = n.a
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
   * **One frame of a fixed stage.** The backdrop, the weather, the cast in paint order, and
   * the shutter. It was the tail of the frame loop; being a function is what lets `mount`
   * treat five shapes the same way instead of falling through to this one.
   */
  function drawStage(t: number) {
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
    // A copy from the start: the payload's order is READ-ONLY, and the roaming player is
    // spliced into it. Mutating the payload would make the second frame disagree with the first.
    var seq = S.order.slice()
    if (cast !== null && cast.act.roam) {
      const him = cast.st
      seq.splice(seq.indexOf(him.at), 1)
      var slot = 0
      while (slot < seq.length && (S.placed[seq[slot]!]?.y ?? Infinity) <= him.row) slot++
      seq.splice(slot, 0, him.at)
    }
    for (const i of seq) {
      // `seq` is the payload's own order, so every entry indexes a slot that exists.
      var D = S.placed[i]!, li = D.layer, L, f, dx, dy

      if (D.player && P) {
        // The state names a clip; the clip names a layer. Nothing about which animation runs
        // has ever reached the sprites, which is why an idle cost a gait and not a rewrite.
        const pd = D.player
        // **`attack` is optional on a player and `base` was allowed to be undefined.** The moon's
        // player has no attack; the state machine can never put him in one, but nothing in the
        // type said so, and the clip name was then the string "undefined-e".
        if (pd === undefined || P === null) continue
        const base = P.state === 'attack' && pd.attack !== undefined ? pd.attack
          : P.state === 'jump' ? (pd.jump ? pd.jump.clip : pd.idle)
          : P.state === 'walk' ? pd.walk : pd.idle
        // **A facing is part of the clip's name.** 'lope' plus '-ne' is a grammar, generated
        // by yawing the authored body, and the runtime never learns what a yaw is.
        // Any placed subject may carry no clips at all; this branch is only entered for one
        // that does, and saying so is cheaper than an assertion that hides the question.
        const clips = D.clips
        if (clips === undefined) continue
        var name = clips[base + '-' + P.dir]! ? base + '-' + P.dir : base
        var pair = clips[name]!
        if (pair === undefined) continue
        // The western half is the eastern half mirrored. 'n' and 's' face the camera and are
        // symmetric, so mirroring them would be a flip nobody could see and a layer nobody
        // needs — they use the un-mirrored render whichever way he last walked.
        var mirror = P.face < 0 && P.dir !== 'n' && P.dir !== 's'
        li = mirror ? pair.left : pair.right
        L = layerAt(S, li)
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
        let who: Crew | null = null
        for (var c = 0; c < crew.length; c++) { const n = crew[c]!; if (n !== undefined && n.at === i) who = n }
        const app = D.approach, cl = D.clips
        if (who === null || app === undefined || cl === undefined) continue
        var cn = who.state === 'in' ? app.walk : who.state === 'prone' ? app.prone : app.flee
        var pr = cl[cn]!
        li = who.face < 0 ? pr.left : pr.right
        L = layerAt(S, li)
        f = Math.floor(who.clock / L.ms) % L.n
        dx = Math.round(who.x) + L.ox
        // Anchored against THIS clip's own feet, so the body that lies down meets the same
        // floor as the body that walked in.
        dy = rowOf(D, L)
        if (who.state === 'away') continue
        if (who.flash !== undefined && t - who.flash < 0.07) flash = 1
      } else {
        L = layerAt(S, li)
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
      ox.drawImage(sheets[li]!, 0, f * L.h, L.w, L.h, Math.round(dx), Math.round(dy), L.w, L.h)
    }

    // **The shutter.** One rectangle, and it is the cheapest possible way to say a photograph
    // was taken — which is the whole state the player is being asked to prevent. A flash the
    // player cannot see is a mechanic with no feedback.
    if (flash) {
      ox.globalAlpha = 0.34
      ox.fillStyle = '#ffffff'; ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  return {
    // The fixed stage is every game that declares no other shape, so it is the fallback rather
    // than a claim: `mount` reaches it when nothing else is active.
    active: true,
    step: think, draw: drawStage, score: function () {},
    state: function () { return P },
  }
}
