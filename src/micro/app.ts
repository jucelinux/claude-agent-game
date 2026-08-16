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

export type AppGame = {
  readonly id: string
  readonly title: string
  readonly blurb: string
  readonly date: string
  readonly meta: readonly string[]
  readonly stage: Stage
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The stage as JSON, with each layer's indices base64'd. */
const payloadOf = (stage: Stage, scale: number, interactive: boolean): string =>
  JSON.stringify({
    w: stage.w, h: stage.h, scale, ground: stage.ground, sky: stage.sky,
    groundRamp: stage.groundRamp, floor: stage.floor, rain: stage.rain, interactive,
    layers: stage.layers.map((l) => ({
      w: l.w, h: l.h, ox: l.ox, oy: l.oy, n: l.frames, ms: l.msPerFrame,
      palette: l.palette, indices: Buffer.from(l.indices).toString('base64'),
    })),
    placed: stage.placed,
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
  var sheets = S.layers.map(decode)

  // The backdrop never changes, so it is drawn once and copied. The floor's colour per row
  // arrives already computed: the recede is one rule and it is applied in one place, or the
  // page and the compositor put the horizon in two different rows.
  var bg = cv(S.w, S.h), bx = bg.getContext('2d')
  bx.fillStyle = rgb(S.sky); bx.fillRect(0, 0, S.w, S.h)
  for (var y = 0; y < S.floor.length; y++) {
    bx.fillStyle = rgb(S.floor[y]); bx.fillRect(0, S.ground + y, S.w, 1)
  }

  // The actor: the one subject whose position is state rather than data.
  var actor = null
  for (var i = 0; i < S.placed.length; i++) {
    if (S.placed[i].control) actor = { p: S.placed[i], x: S.placed[i].x, face: 1, clock: 0, moving: false }
  }
  var keys = {}
  if (S.interactive && actor) {
    var down = function (e, v) {
      var k = e.key
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = v; e.preventDefault() }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = v; e.preventDefault() }
    }
    window.addEventListener('keydown', function (e) { down(e, true) })
    window.addEventListener('keyup', function (e) { down(e, false) })
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
      ox.fillStyle = rgb(R.colors[hsh % R.colors.length])
      var fall = (((t * R.speed / span) + ph) % 1) * span - R.length
      for (var k = 0; k < R.length; k++) {
        var yy = Math.round(fall + k); if (yy < 0 || yy >= S.h) continue
        var xx = Math.round(x0 + k * R.slant); if (xx < 0 || xx >= S.w) continue
        ox.fillRect(xx, yy, 1, 1)
      }
    }
  }

  var t0 = null, prev = 0
  function frame(now) {
    if (t0 === null) t0 = now
    var t = (now - t0) / 1000
    var dt = Math.min(0.05, t - prev); prev = t

    if (actor) {
      var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
      actor.moving = dir !== 0
      if (dir !== 0) {
        actor.face = dir
        actor.x = Math.max(actor.p.control.minX, Math.min(actor.p.control.maxX, actor.x + dir * actor.p.control.speed * dt))
        // The walk clock only runs while he walks, so the cycle resumes where it stopped
        // instead of carrying on behind a standing pose.
        actor.clock += dt * 1000
      }
    }

    ox.drawImage(bg, 0, 0)
    rain(t)

    for (var i = 0; i < S.placed.length; i++) {
      var P = S.placed[i], li = P.layer, L, f, dx, dy
      if (P.control && actor) {
        li = actor.face < 0 ? P.control.flip : P.layer
        L = S.layers[li]
        f = actor.moving ? Math.floor(actor.clock / L.ms) % L.n : P.control.idleFrame % L.n
        dx = Math.round(actor.x) + L.ox; dy = P.y + L.oy
      } else {
        L = S.layers[li]
        f = Math.floor(t * 1000 / L.ms + P.phase * L.n) % L.n
        dx = P.x + L.ox; dy = P.y + L.oy
        if (P.motion) {
          // Continuous in seconds, so there is no loop point to be seamless at. The sway
          // term is what makes the speed rise and fall: a cloud that travels at one rate is
          // a cutout on a rail.
          var M = P.motion, u = 6.283185 * (t / M.period + M.at)
          dx += M.speed * t + M.swayX * Math.sin(u)
          dy += M.bobY * Math.sin(u * 0.61 + 2.3)
          // Wrap with a whole sprite width of margin off each edge, so it leaves and returns
          // entirely off screen rather than reappearing cut in half.
          var span = S.w + L.w
          dx = ((dx + L.w) % span + span) % span - L.w
        }
      }
      ox.drawImage(sheets[li], 0, f * L.h, L.w, L.h, Math.round(dx), Math.round(dy), L.w, L.h)
    }

    vx.drawImage(off, 0, 0, view.width, view.height)
    requestAnimationFrame(frame)
  }
  el.appendChild(view)
  requestAnimationFrame(frame)
  return view
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
  .keys { margin: 0 auto 20px; max-width: 860px; text-align: center;
          color: var(--ink); font-size: 13px; background: var(--card);
          border: 1px solid var(--line); border-radius: 8px; padding: 12px 18px }
  .keys b { color: var(--accent); font-family: ui-monospace, Menlo, monospace }
  .back { color: var(--dim); font-size: 13px }
  .back:hover { color: var(--accent) }
  .empty { color: var(--dim); text-align: center; padding: 60px 0 }
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
  const playable = game.stage.placed.some((p) => p.control !== undefined)
  return shell(
    `${game.title} · claude-ink-2d`,
    `<a class="back" href="/">← shelf</a><h1>${esc(game.title)}</h1><span class="sub mono">${esc(game.id)}</span>`,
    `<div class="stage"><div id="stage"></div></div>
     ${playable ? `<div class="keys"><b>←</b> <b>→</b> or <b>A</b> <b>D</b> to walk</div>` : ''}
     <div class="about">
       <p>${esc(game.blurb)}</p>
       <div class="facts mono">${game.meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
     </div>`,
    `mount(document.getElementById('stage'), ${payloadOf(game.stage, game.stage.scale, true)});`,
  )
}
