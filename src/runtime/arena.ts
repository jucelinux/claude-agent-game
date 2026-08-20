/**
 * **The arena: a ground plane, two machines, and a camera that has a heading of its own.**
 *
 * The fifth game shape and the only one whose camera turns. A thing's place on screen is not a
 * row and a column here — it is a projection, and the yaw band a body draws at is
 * `bodyHeading - cameraHeading`. Two of this file's defects were unit errors that a type could
 * not have caught and a string certainly did not: it is the strongest argument in the repository
 * for the golden trace that guards it.
 */
/**
 * The `!` on a read like `xs[i]` inside `for (var i = 0; i < xs.length; i++)` is the loop's own
 * bound restated: TypeScript cannot carry the comparison into the index, and a guard there would
 * be dead code that reads as doubt about something the line above already decided.
 */
import { ctx2d } from './canvas.ts'
import { bayerAt, layerAt, ramp, rgb, rowOf, turnDelta } from './paint.ts'
import { inactive } from './types.ts'
import type { ArenaEye, Cam, Canvas, Drawable, Duel, Machine, Shape, Shared, StageArena } from './types.ts'

export function makeArena(c: Shared): Shape & ArenaEye {
  const { S, ox, bg, sheets, keys, drawn, cv, rain } = c

  /**
   * **The arena block, bound once and non-null for the file.** Every reference below used to be
   * `S.arena.something` against a type that admits null, which the compiler could not see
   * because the whole runtime was a string. Binding it here is what lets the rest of the file
   * read as the game it is rather than as a chain of guards — and the early return is what
   * makes `active` a fact instead of a field somebody has to remember to set.
   */
  const block = S.arena
  if (block === null) return inactive() as Shape & ArenaEye
  /**
   * **Declared non-null rather than merely narrowed, and the difference is a TypeScript rule
   * worth writing down.** A `const` narrowed by an early return stays narrowed inside arrow
   * functions and does NOT inside a hoisted `function` declaration — the compiler cannot prove
   * one was not called first. This runtime is written in hoisted declarations, so the guard
   * yields an alias whose DECLARED type carries the fact. It closed 507 errors without a cast.
   */
  const A0: StageArena = block
  var scoreAt = 0

  /**
   * **The arena's backdrop, baked once: a sky and a floor, both woven.** Everything that moves
   * in this game is projected per frame, so the backdrop is the one thing that is not — and a
   * static backdrop is the no-crawl rule by construction, as in every game here.
   */
  const arenaBg = cv(S.w, S.h)
  var ab = ctx2d(arenaBg)
  var ADZ = A0.dither || { amount: 0, lattice: 2 }
  ramp(ab, S.w, A0.skyRamp, 0, A0.horizonRow, ADZ)
  ramp(ab, S.w, A0.floorRamp, A0.horizonRow, S.h, ADZ)
  


  /**
   * **The projection, and it is the whole of the new camera.** A world point against a camera
   * that has a position AND a heading: rotate into camera space, divide by depth. Everything
   * else in this mode — where a machine stands, how big it draws, which way the grid runs — is
   * this one function called with different arguments.
   */
  function project(wx: number, wy: number, wz: number) {
    var A = A0
    var dx = wx - CAM.x, dz = wz - CAM.z
    /**
     * **The heading is in TURNS and the trig wants radians**, and the missing factor here is
     * the whole of his third report: 'a cena vai para um ANGULO em que nao consigo visualizar
     * nem meu player, nem o inimigo'. The rig placed the camera with CAM.h * 2pi and this
     * function read the same number raw, so position and projection used two different
     * bases that agreed only at zero. The first strafe parted them; a tenth of a turn of
     * camera put 36 degrees of rig against 5.7 degrees of view, and the frame ran off the
     * duel. The lock below drives the SHIPPED function, which is why it can never come back:
     * the old lock re-implemented the projection and tested its own copy.
     */
    var th = CAM.h * 6.283185
    var c = Math.cos(th), s = Math.sin(th)
    var fwd = dx * s + dz * c
    if (fwd < A.near) return null
    var side = dx * c - dz * s
    var k = A.focal / fwd
    return { x: S.w / 2 + side * k, y: A.horizonRow + (A.camHeight - wy) * k, k: k, fwd: fwd }
  }


  /**
   * **The band, and this is the runtime yaw the ledger was missing.** A machine's heading minus
   * the camera's, wrapped and quantised: the index of a grammar that was generated already
   * turned that far. The runtime never rotates anything — it chooses.
   */
  function bandOf(heading: number) {
    var A = A0
    /**
     * **The quarter turn is not a fudge, it is the two conventions meeting.** The body is
     * authored facing EAST and yaw measures from there; the camera looks along +z. So a machine
     * whose heading equals the camera's is walking AWAY from it — which is yaw 0.25 in the
     * compass the astronaut established ('n' is walking away), not yaw 0. Without the offset
     * the player was drawn in profile while walking directly away, which is what the first
     * screenshot showed.
     */
    var rel = ((heading - CAM.h + 0.25) % 1 + 1) % 1
    return Math.round(rel * A.bands) % A.bands
  }

  /**
   * **Nearest rendered size to the projection's own factor, against whichever ladder the thing
   * uses.** Same snap as the descent's, but the ladder is now per kind — a machine and a
   * pillar do not live at the same range of depths and a single ladder served neither.
   */
  function scaleOf(k: number, ladder: readonly number[], cur?: number): number {
    // The projection's own factor, normalised so the PLAYER — who is always at camDist by
    // construction of the rig — lands exactly on 1. Anything further back asks for less.
    var A = A0, want = k * A.camDist / A.focal, si = 0
    for (var i = 1; i < ladder.length; i++) {
      if (Math.abs(ladder[i]! - want) < Math.abs(ladder[si]! - want)) si = i
    }
    /**
     * **Hysteresis, and its absence is his report: *'tem uma distância específica que o tamanho
     * fica variando constantemente, causando uma sensação de bug'*.**
     *
     * Nearest-band-per-frame has no memory. Sitting exactly on a boundary, a hundredth of a unit
     * of movement flips the choice, and the flip is a 21 percent size change every frame.
     *
     * The descent uses the same ladder ratio and never showed this, which is the part worth
     * writing down: on a treadmill every object crosses every boundary ONCE, moving one way.
     * In an arena the enemy closes and backs off and the player strafes, so a thing can live on
     * a boundary. **The band technique did not change; the motion did**, and a rule that was
     * safe in one game shape was not safe in the next.
     *
     * So the band is kept until the new one is clearly better, not merely better. bandHold is
     * that margin, and it is why every drawn thing now carries the band it drew at last frame.
     */
    if (cur === undefined || cur === si) return si
    if (Math.abs(ladder[si]! - want) > Math.abs(ladder[cur]! - want) * (1 - A.bandHold)) return cur
    return si
  }

  const CAM: Cam = { x: 0, z: -60, h: 0, b: 0 }
  const AR: Duel = ((): Duel => {
    var mk = function (px: number, pz: number, player: boolean) {
      return {
        // Both spawn already facing each other: a body heading that has to ease into place on
        // the first frame is a machine that spins on the title screen.
        x: px, z: pz, h: player ? 0 : 0.5, bh: player ? 0 : 0.5, player: player, armour: A0.armour,
        walked: 0, boost: 0, cool: 0, reload: 0, dir: 1, flip: 0, hurt: 0,
      }
    }
    /**
     * **The pillars are placed ONCE, into the sim, and that is the whole of his second report.**
     * They used to be hashed inside the draw loop, which meant the only thing in this game that
     * knew where they stood was the painter — so a shot passed through one and a machine walked
     * into one. A prop the simulation cannot see is scenery pretending to be an obstacle.
     *
     * Spread by INDEX with a hashed nudge: a pure hash bunches, and a ring of pillars that all
     * stand on one side gives a turning camera nothing to measure itself against.
     */
    var pil = []
    for (var pi = 0; pi < A0.pillarCount; pi++) {
      var ph = ((pi + A0.pillarSeed) * 2654435761) >>> 0; ph = (ph ^ (ph >>> 13)) >>> 0
      var ph2 = (ph * 1597334677) >>> 0; ph2 = (ph2 ^ (ph2 >>> 15)) >>> 0
      var pang = (pi / A0.pillarCount + (ph % 400) / 4000) * 6.283185
      /**
       * **From a fifth of the way out to four fifths, and the old ring started at a half.**
       * Every pillar stood on the rim while the duel was fought in the middle, so cover existed
       * on the map and never where anyone was — which is the other half of *"esse barril não
       * serve para nada"*: it was not only inert, it was never nearby.
       */
      var prad = A0.radius * (0.2 + (ph2 % 620) / 1000)
      /**
       * **Walked outward until it clears every pillar already placed.** Nine slots on a spread
       * that was tuned for seven put two columns 13 units apart — inside each other, since a
       * pillar is 21 across. The walk is deterministic and bounded, so the world is still one
       * integer hash and a recorded input still replays: no rejection sampling, no randomness,
       * just a fixed ladder of positions tried in a fixed order.
       */
      /**
       * **Twice the machine's own keep-out, so two columns can never trap one between them.**
       * At a closer spacing a machine wedged in the gap is inside both keep-out discs at once,
       * and pushing it clear of one puts it back inside the other — a corner that no number of
       * sequential passes resolves exactly. At this spacing every point on the floor is inside
       * at most one disc, so one pass is not an approximation, it is the answer. It also means
       * a machine can always walk between any two columns, which is what makes them cover
       * rather than walls.
       */
      var keepP = (A0.pillarHalf + A0.bodyHalf) * 2 + 4
      for (var tryN = 0; tryN < 24; tryN++) {
        var cx = Math.sin(pang) * prad, cz = Math.cos(pang) * prad
        var clash = false
        for (var pq = 0; pq < pil.length; pq++) {
          if (Math.hypot(cx - pil[pq]!.x, cz - pil[pq]!.z) < keepP) { clash = true; break }
        }
        if (!clash) { pil.push({ x: cx, z: cz }); break }
        prad += keepP * 0.5
        if (prad > A0.radius * 0.9) prad = A0.radius * 0.2
      }
    }
    const duel: Duel = {
      you: mk(0, -A0.radius * 0.45, true),
      foe: mk(0, A0.radius * 0.45, false),
      pillars: pil,
      shots: [], over: 0, clock: 0,
    }
    return duel
  })()
  CAM.x = AR.you.x + A0.camSide
  CAM.z = AR.you.z - A0.camDist
  CAM.b = 0
  // The first frame is aimed by the same solver every later frame uses. A rig that starts on a
  // different rule than it runs on is a rig with two behaviours to debug.
  CAM.h = aimAt(AR.you, AR.foe)

  /**
   * **The duel: lock, strafe, dash, fire.** Four verbs, and the first of them is what makes the
   * yaw bands earn their place — a machine that faces its target while MOVING sideways is a
   * machine whose walk plays at a heading its motion does not share.
   */
  function arenaStep(t: number, dt: number) {
    var A = A0, you = AR.you, foe = AR.foe
    AR.clock += dt
    if (AR.over !== 0) {
      if (keys.primaryTap) {
        keys.primaryTap = false
        you.x = 0; you.z = -A.radius * 0.45; you.armour = A.armour; you.boost = 0; you.cool = 0
        foe.x = 0; foe.z = A.radius * 0.45; foe.armour = A.armour; foe.boost = 0; foe.cool = 0
        you.h = 0; you.bh = 0; foe.h = 0.5; foe.bh = 0.5
        AR.shots.length = 0; AR.over = 0; AR.clock = 0
        // **Redeploy moves the camera too, and the omission was a real hole.** The machines
        // teleported back to their marks while the camera stayed where the last one died, so
        // for one frame the rig and the duel were a hundred units apart and the framing
        // guarantee — which is arithmetic about the CURRENT position — described nothing.
        CAM.b = 0
        CAM.x = you.x + A.camSide
        CAM.z = you.z - A.camDist
        CAM.h = aimAt(you, foe)
      }
      return
    }

    // **Lock: both machines always face each other.** It is the genre's contract and it is why
    // the mechanic is one key shorter than it would otherwise be.
    you.h = Math.atan2(foe.x - you.x, foe.z - you.z) / 6.283185
    foe.h = Math.atan2(you.x - foe.x, you.z - foe.z) / 6.283185

    var move = function (m: Machine, fwdAmt: number, sideAmt: number, dt2: number) {
      var c = Math.cos(m.h * 6.283185), s = Math.sin(m.h * 6.283185)
      // Facing is (sin h, cos h); its right hand is (cos h, -sin h).
      var vx = s * fwdAmt + c * sideAmt
      var vz = c * fwdAmt - s * sideAmt
      m.x += vx * dt2
      m.z += vz * dt2
      // Where the machine actually TRAVELLED this step. The lock decides where it aims; this
      // decides where its thrusters point, and the two are the same only when it walks forward.
      m.vh = Math.atan2(vx, vz) / 6.283185
      var r = Math.sqrt(m.x * m.x + m.z * m.z)
      if (r > A.radius) { m.x = m.x / r * A.radius; m.z = m.z / r * A.radius }
      // **And so is the other machine.** The duel closed to a tenth of a unit before this —
      // two 23-unit bodies occupying one point, which no amount of camera work can make read.
      var other = m === you ? foe : you
      var odx = m.x - other.x, odz = m.z - other.z
      var od = Math.hypot(odx, odz)
      if (od < A.bodyHalf * 2) {
        // Zero distance has no direction, so the tie is broken along the lock axis rather than
        // by a hidden bias: the pair separates the way they are already facing.
        if (od < 0.001) { odx = Math.sin(m.h * 6.283185); odz = Math.cos(m.h * 6.283185); od = 1 }
        m.x = other.x + odx / od * A.bodyHalf * 2
        m.z = other.z + odz / od * A.bodyHalf * 2
      }
      // **A pillar is solid.** Pushed out along the line from its centre, which slides a
      // machine around it instead of stopping it dead — a dash into cover should carry you
      // past the cover, not stick you to it.
      // One pass is exact, and it is the PLACEMENT that makes it so: the columns are spread at
      // twice this keep-out, so no point on the floor is inside two of these discs at once.
      var keep = A.pillarHalf + A.bodyHalf
      for (const pw of AR.pillars) {
        var ddx = m.x - pw.x, ddz = m.z - pw.z
        var dd = Math.hypot(ddx, ddz)
        if (dd < keep && dd > 0.001) { m.x = pw.x + ddx / dd * keep; m.z = pw.z + ddz / dd * keep }
      }
      m.walked += Math.hypot(vx, vz) * dt2
    }

    // ---- The player.
    var fwd = (keys.up ? 1 : 0) - (keys.down ? 1 : 0)
    var side = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    you.cool = Math.max(0, you.cool - dt * 1000)
    you.reload = Math.max(0, you.reload - dt * 1000)
    you.hurt = Math.max(0, you.hurt - dt)
    if (keys.primaryTap) {
      keys.primaryTap = false
      if (you.cool <= 0 && (fwd !== 0 || side !== 0)) {
        you.boost = A.boostMs; you.cool = A.boostCoolMs; you.bf = fwd; you.bs = side
      }
    }
    if (you.boost > 0) {
      you.boost -= dt * 1000
      move(you, (you.bf || 0) * A.boostSpeed, (you.bs || 0) * A.boostSpeed, dt)
    } else if (fwd !== 0 || side !== 0) {
      var norm = fwd !== 0 && side !== 0 ? 0.7071 : 1
      move(you, fwd * A.speed * norm, side * A.strafe * norm, dt)
    }
    if (keys.secondary && you.reload <= 0) {
      you.reload = A.reloadMs
      AR.shots.push({ x: you.x, z: you.z, h: you.h, gone: 0, mine: true })
    }

    // ---- The machine. Deterministic from its own clock: no ambient randomness anywhere here,
    // which is what lets the headless harness replay a duel.
    var d2 = Math.hypot(foe.x - you.x, foe.z - you.z)
    foe.cool = Math.max(0, foe.cool - dt * 1000)
    foe.reload = Math.max(0, foe.reload - dt * 1000)
    foe.hurt = Math.max(0, foe.hurt - dt)
    foe.flip -= dt
    if (foe.flip <= 0) {
      var fh = ((Math.floor(AR.clock * 2) + A.seed) * 2654435761) >>> 0
      fh = (fh ^ (fh >>> 13)) >>> 0
      foe.dir = (fh & 1) === 0 ? 1 : -1
      foe.flip = 1.1 + (fh % 900) / 1000
      if ((fh >>> 8) % 5 === 0 && foe.cool <= 0) { foe.boost = A.boostMs; foe.cool = A.boostCoolMs }
    }
    var closeAmt = d2 > A.aiFar ? 1 : d2 < A.aiClose ? -1 : 0
    if (foe.boost > 0) {
      foe.boost -= dt * 1000
      move(foe, closeAmt * A.boostSpeed * 0.6, foe.dir * A.boostSpeed, dt)
    } else {
      move(foe, closeAmt * A.speed * 0.85, foe.dir * A.strafe * 0.8, dt)
    }
    if (foe.reload <= 0 && d2 < A.shotRange * 0.9) {
      foe.reload = A.aiReloadMs
      AR.shots.push({ x: foe.x, z: foe.z, h: foe.h, gone: 0, mine: false })
    }

    /**
     * ---- **Where each body POINTS, which is not where it aims.**
     *
     * A locked duel has a geometry the first build's bug was hiding: the camera must frame both
     * machines, so it looks roughly along the axis they face; therefore the player is always
     * seen from behind and the enemy always head-on, and eleven of the twelve yaw bands would
     * be unreachable. That is a theorem about framing cameras, not a tuning — the player is
     * held within frameHold of the view axis by construction, so his relative heading cannot
     * leave that cone.
     *
     * A machine under boost is the exception, and it is the honest one: thrusters push along
     * travel, so a dashing machine points where it dashes while its weapon stays on the target.
     * A sideways dash then shows the body in full profile. The bands are spent by the dash and
     * by the boom's lead, which is also when the game is at its most dynamic — the two wants
     * turn out to be one.
     */
    var faceTo = function (m: Machine, dt2: number) {
      var want = m.boost > 0 && m.vh !== undefined ? m.vh : m.h
      m.bh += turnDelta(want, m.bh) * Math.min(1, A.faceEase * dt2)
    }
    faceTo(you, dt)
    faceTo(foe, dt)

    // ---- Shots travel and land. A shot is a point on the plane; a machine is a radius.
    for (var i = AR.shots.length - 1; i >= 0; i--) {
      // The loop walks its own list backwards so a splice cannot skip an entry; the index is
      // therefore always inside it.
      var sh = AR.shots[i]!
      var step = A.shotSpeed * dt
      sh.x += Math.sin(sh.h * 6.283185) * step
      sh.z += Math.cos(sh.h * 6.283185) * step
      sh.gone += step
      /**
       * **A pillar stops a shot, and it is the reason to stand behind one.** His words: *'nao
       * ha bloqueio do projetil nele'*. Tested before the machines, so cover beats a hit at
       * the same instant — which is what makes the cover worth walking to.
       */
      var blocked = false
      for (const pb of AR.pillars) {
        if (Math.hypot(sh.x - pb.x, sh.z - pb.z) < A.pillarHalf) { blocked = true; break }
      }
      if (blocked) { AR.shots.splice(i, 1); continue }
      var target = sh.mine ? foe : you
      if (Math.hypot(sh.x - target.x, sh.z - target.z) < A.shotHalf) {
        target.armour -= A.damage
        target.hurt = 0.16
        AR.shots.splice(i, 1)
        if (target.armour <= 0) { target.armour = 0; AR.over = sh.mine ? 1 : -1 }
        continue
      }
      if (sh.gone > A.shotRange) AR.shots.splice(i, 1)
    }

    /**
     * ---- **The camera, and it is now TWO headings instead of one.** The first build had a
     * single eased angle that both placed the camera and aimed it, which made the aim a
     * consequence of the lag rather than of what had to be shown.
     *
     * **The boom** is the eased one, and the lag is load-bearing: a camera welded behind the
     * player would hold him at relative heading zero for ever and eleven of the twelve yaw
     * bands would never draw. It decides WHERE the camera stands.
     *
     * **The view** is not eased at all. It is solved every frame from where the camera ended
     * up: aim at the bisector of the two machines, so both sit symmetric about the centre,
     * then clamp that aim so the player can never be further than frameHold off the axis.
     * Both machines in frame is then a property of the arithmetic, not of a tuning.
     */
    // The boom leads the strafe: hold right and the camera swings out that way, so the duel is
    // seen from the shoulder the player is running toward. It is the genre's own move, it costs
    // one term, and it is the second thing that spends the yaw bands.
    CAM.b += turnDelta(you.h + A.boomLead * side, CAM.b) * Math.min(1, A.camEase * dt)
    // Behind along the boom, then out to its right: over the shoulder.
    var bh = CAM.b * 6.283185
    CAM.x = you.x - Math.sin(bh) * A.camDist + Math.cos(bh) * A.camSide
    CAM.z = you.z - Math.cos(bh) * A.camDist - Math.sin(bh) * A.camSide
    CAM.h = aimAt(you, foe)
  }

  /**
   * **The aim, solved rather than eased.** Bearings to both machines from wherever the camera
   * ended up; the bisector frames them symmetrically; the clamp is the guarantee. frameHold
   * is an angle the player is allowed to sit off the axis, and it is derived from the frame's
   * own half-width, so a wider screen holds a wider duel without any other number moving.
   */
  function aimAt(you: Machine, foe: Machine) {
    var A = A0
    var ay = Math.atan2(you.x - CAM.x, you.z - CAM.z) / 6.283185
    var af = Math.atan2(foe.x - CAM.x, foe.z - CAM.z) / 6.283185
    var off = turnDelta(af, ay) / 2
    var lim = A.frameHold
    return ay + Math.max(-lim, Math.min(lim, off))
  }

  /** One machine, stamped at the band its heading asks for and the size its depth asks for. */
  function mechDraw(m: Machine, t: number, out: Drawable[]) {
    var A = A0
    var p = project(m.x, 0, m.z)
    if (p === null) return
    var si = scaleOf(p.k, A.scales, m.band)
    m.band = si
    var set = m.boost > 0 ? A.boost : A.walk
    // Both indices come from the generator's own counts: `bandOf` wraps modulo `bands` and
    // `scaleOf` returns a position in the ladder it was handed.
    var li = set[bandOf(m.bh)]![si]!
    var L = layerAt(S, li)
    var f = m.boost > 0
      ? Math.min(L.n - 1, Math.floor((A.boostMs - m.boost) / L.ms))
      : Math.floor(m.walked / (A.strideLen / L.n)) % L.n
    out.push({ fwd: p.fwd, kind: 'mech' as const, li: li, L: L, frame: f, x: p.x, y: p.y, hurt: m.hurt, k: p.k, disc: A.bodyHalf })
  }

  function drawArena(t: number) {
    var A = A0
    ox.drawImage(arenaBg, 0, 0)

    /**
     * **The floor grid, and it is the cue that makes the camera legible.** Lines in world space,
     * projected — so they converge on the vanishing point and swing as the camera turns. A
     * player of that era read a plane in space from exactly this, long before any shading.
     */
    ox.strokeStyle = rgb(A.grid.color)
    ox.lineWidth = 1
    ox.beginPath()
    var R = A.radius, st = A.grid.step
    for (var g = -R; g <= R + 0.01; g += st) {
      // Each line is walked in segments so the perspective divide bends it correctly and a
      // segment that crosses behind the camera is dropped rather than smeared across the view.
      var prevA = null, prevB = null
      for (var u = -R; u <= R + 0.01; u += st) {
        var pa = project(g, 0, u), pb = project(u, 0, g)
        if (pa !== null && prevA !== null) { ox.moveTo(prevA.x, prevA.y); ox.lineTo(pa.x, pa.y) }
        if (pb !== null && prevB !== null) { ox.moveTo(prevB.x, prevB.y); ox.lineTo(pb.x, pb.y) }
        prevA = pa; prevB = pb
      }
    }
    ox.stroke()

    /**
     * **Everything on the plane is depth-sorted every frame**, which is new: a fixed camera lets
     * paint order be decided once when the stage is built, and a camera that orbits does not.
     */
    const out: Drawable[] = []
    for (var i = 0; i < AR.pillars.length; i++) {
      // The same list the simulation blocks against. Two lists would be two truths, and the
      // one the player believes is the drawn one.
      var pw = AR.pillars[i]!
      var pp = project(pw.x, 0, pw.z)
      if (pp === null) continue
      // A pillar takes a size band exactly as a machine does. Without it the first build drew
      // a block two hundred units away at the size of one standing beside you.
      /**
       * **A pillar has its own ladder, and this is the other half of his 'floating' report.**
       * The machines live between 0.31 and 1 of the reference size, measured over three long
       * drives; a pillar the camera walks past reaches 3.2 and beyond. Sharing one ladder meant
       * a pillar STOPPED GROWING at arm's length — and a prop that does not grow as you close on
       * it is a prop that is not in the world, whatever row it is stamped on.
       */
      var psi = scaleOf(pp.k, A.pillarScales, pw.band)
      pw.band = psi
      var pli = A.pillar[psi]!
      var PL = layerAt(S, pli)
      out.push({ fwd: pp.fwd, kind: 'pillar' as const, li: pli, L: PL, x: pp.x, y: pp.y, hurt: 0, k: pp.k, disc: A.pillarHalf, frame: 0 })
    }
    mechDraw(AR.foe, t, out)
    mechDraw(AR.you, t, out)
    for (var j = 0; j < AR.shots.length; j++) {
      var sp = project(AR.shots[j]!.x, 6, AR.shots[j]!.z)
      if (sp !== null) out.push({ fwd: sp.fwd, kind: 'shot' as const, x: sp.x, y: sp.y, k: sp.k })
    }
    out.sort(function (a, b) { return b.fwd - a.fwd })

    for (const e of out) {
      if (e.kind === 'shot') {
        var r = Math.max(1, Math.round(e.k * 0.9))
        ox.fillStyle = '#ffd27a'
        ox.fillRect(Math.round(e.x) - r, Math.round(e.y) - r, r * 2, r * 2)
        continue
      }
      /**
       * **The contact shadow, and it is why he saw the pillar floating.** Nothing on this plane
       * was touching it: a sprite stamped at the projected row of y=0 IS standing on the floor
       * arithmetically, and the eye has no way to know that. Batch 4 already found this class
       * once — 'neither rider is grounded' — and it shipped again here, which is the finding
       * this round pays for twice.
       *
       * A disc on the ground projects to an ellipse. The width is the ordinary divide; the
       * height is foreshortened by exactly camHeight/fwd, because a step in depth moves a
       * ground point by that much less on screen than the same step across. No new camera —
       * the same projection, differentiated.
       */
      if (e.disc > 0) {
        var sw = e.disc * e.k
        var sh2 = Math.max(0.6, sw * (A.camHeight / e.fwd))
        ox.globalAlpha = A.contact.alpha
        ox.fillStyle = rgb(A.contact.color)
        ox.beginPath()
        ox.ellipse(Math.round(e.x), Math.round(e.y), Math.max(1, sw), sh2, 0, 0, 6.283185)
        ox.fill()
        ox.globalAlpha = 1
      }
      var L = e.L
      var fr = e.frame || 0
      /**
       * **Anchored by the FOOT, and the machines had been anchored by their core.**
       *
       * project() returns the row of world y=0 — the floor under the thing. Stamping the
       * sprite's ORIGIN there puts the origin on the floor, and the mech's origin is its core:
       * every machine has been drawn hovering its own leg length above the ground since the
       * first build. It never showed, because at 34 px the legs stayed inside the frame and
       * there was no contact shadow to disagree with them. At 60 px the feet leave the bottom
       * of the screen, and the shadow — drawn at the true ground point — sits a body away.
       * One placement rule (rowOf), used with the anchor the situation actually calls for.
       */
      var row = rowOf({ anchor: 'foot', y: e.y }, L)
      ox.drawImage(sheets[e.li]!, 0, fr * L.h, L.w, L.h,
        Math.round(e.x + L.ox), Math.round(row), L.w, L.h)
      // A hit flashes the machine white for a sixth of a second: the cheapest possible feedback,
      // and the shutter's own device.
      if (e.hurt > 0) {
        ox.globalAlpha = 0.5
        ox.fillStyle = '#ffffff'
        ox.fillRect(Math.round(e.x + L.ox), Math.round(row), L.w, L.h)
        ox.globalAlpha = 1
      }
    }

    if (AR.over !== 0) {
      ox.globalAlpha = 0.45
      ox.fillStyle = AR.over === 1 ? '#0a1420' : '#200a0a'
      ox.fillRect(0, 0, S.w, S.h)
      ox.globalAlpha = 1
    }
  }

  function arenaScore(now: number) {
    if (!S.meter || now - scoreAt < 90) return
    scoreAt = now
    var el = document.getElementById('score'); if (!el) return
    el.textContent = AR.over !== 0
      ? (AR.over === 1 ? 'target destroyed' : 'you were destroyed') + '  ·  press space to redeploy'
      : 'AP ' + Math.round(AR.you.armour) + '   ·   TARGET ' + Math.round(AR.foe.armour)
  }


  return {
    active: true,
    step: arenaStep, draw: drawArena, score: arenaScore,
    state: function () { return AR },
    observe: function () { return { kind: 'arena', state: AR } },
    // The arena alone hands two functions out: the framing lock has to drive the SHIPPED
    // projection, because the lock that came before it re-implemented one in the test file and
    // so never noticed that this one read a heading in turns as if it were radians.
    cam: function () { return CAM },
    project: project,
    scaleOf: scaleOf,
  }
}
