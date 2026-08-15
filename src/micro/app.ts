/**
 * **The micro-game webapp.** His surface, 15/08: a shelf on the home route and one route
 * per game, so iterating means refreshing.
 *
 * Two pages, one blit path. The blit rules are the project's and they are not negotiable
 * anywhere a sprite reaches a screen: **nearest neighbour, integer scale, index 0 fully
 * transparent, and one accumulator for the whole page.** A cell may own a rate; it may never
 * own a clock. Those are the same rules the bench viewer compiles, and they are repeated
 * here rather than imported because this app is a *product surface* and the bench is an
 * instrument — but if the two ever disagree about a pixel, this file is the one that is
 * wrong.
 *
 * **Every route renders from current code on every request.** No cache, no build step: a
 * refresh is the whole iteration loop. The gallery freezes its entries on purpose and this
 * does the opposite on purpose.
 */
import type { RGB } from '../core/types.ts'

export type AppCell = {
  readonly w: number
  readonly h: number
  readonly scale: number
  readonly msPerFrame: number
  readonly frames: readonly Uint8Array[]
  readonly palette: readonly RGB[]
}

export type AppGame = {
  readonly id: string
  readonly title: string
  readonly blurb: string
  readonly date: string
  readonly meta: readonly string[]
  readonly cell: AppCell
}

const b64 = (frames: readonly Uint8Array[]): string =>
  Buffer.concat(frames.map((f) => Buffer.from(f))).toString('base64')

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Payload for one canvas. `n` is the frame count; the bytes are all frames concatenated. */
const payloadOf = (cell: AppCell): string =>
  JSON.stringify({
    w: cell.w,
    h: cell.h,
    n: cell.frames.length,
    scale: cell.scale,
    ms: cell.msPerFrame,
    palette: cell.palette,
    indices: b64(cell.frames),
  })

/**
 * The shared runtime. It decodes indexed bytes once into `ImageData`, then every frame is a
 * `putImageData` plus one scaled `drawImage` — which is why the scale has to be an integer:
 * pixel art through a fractional scale is judged through mud.
 */
const RUNTIME = `
function mount(el, D) {
  var view = document.createElement('canvas');
  view.width = D.w * D.scale; view.height = D.h * D.scale;
  var ctx = view.getContext('2d'); ctx.imageSmoothingEnabled = false;
  var off = document.createElement('canvas'); off.width = D.w; off.height = D.h;
  var octx = off.getContext('2d');
  var raw = atob(D.indices), per = D.w * D.h, images = [];
  for (var f = 0; f < D.n; f++) {
    var img = octx.createImageData(D.w, D.h);
    for (var i = 0; i < per; i++) {
      var idx = raw.charCodeAt(f * per + i), o = i * 4;
      if (idx === 0) { img.data[o + 3] = 0; continue; }
      var c = D.palette[idx];
      img.data[o] = c[0]; img.data[o+1] = c[1]; img.data[o+2] = c[2]; img.data[o+3] = 255;
    }
    images.push(img);
  }
  el.appendChild(view);
  return { ctx: ctx, octx: octx, off: off, view: view, images: images, n: D.n, ms: D.ms };
}
var CELLS = [], elapsed = 0, paused = false, last = null;
function draw() {
  for (var i = 0; i < CELLS.length; i++) {
    var c = CELLS[i], k = Math.floor(elapsed / c.ms) % c.n;
    c.octx.putImageData(c.images[k], 0, 0);
    c.ctx.clearRect(0, 0, c.view.width, c.view.height);
    c.ctx.drawImage(c.off, 0, 0, c.view.width, c.view.height);
    if (c.tag) c.tag.textContent = 'frame ' + k + ' / ' + c.n;
  }
}
function tick(now) {
  if (last === null) last = now;
  if (!paused) elapsed += now - last;
  last = now; draw(); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
document.addEventListener('keydown', function (e) {
  if (e.key === ' ') { paused = !paused; e.preventDefault(); }
  if (e.key === ',') { paused = true; elapsed = Math.max(0, elapsed - CELLS[0].ms); draw(); }
  if (e.key === '.') { paused = true; elapsed += CELLS[0].ms; draw(); }
});
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
  canvas { image-rendering: pixelated; display: block }
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

  .stage { display: flex; justify-content: center; padding: 8px 0 26px }
  .stage > div { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #0e0e11 }
  .about { max-width: 760px; margin: 0 auto }
  .about h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600 }
  .about p { margin: 0 0 14px; color: var(--dim) }
  .facts { display: flex; gap: 22px; flex-wrap: wrap; color: #6c6a68; font-size: 12px; border-top: 1px solid var(--line); padding-top: 14px }
  .keys { margin-top: 18px; color: #6c6a68; font-size: 12px }
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

/**
 * **The shelf.** Cards decimate their frames — every third one — because a card is a
 * thumbnail and the whole shelf otherwise ships three times the bytes to say the same thing.
 * The rate is scaled to match, so a card runs at the speed the game runs at.
 */
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

  const mounts = games
    .map((g, i) => {
      const every = 3
      const frames = g.cell.frames.filter((_, k) => k % every === 0)
      const thumb: AppCell = {
        ...g.cell,
        frames,
        scale: Math.max(1, Math.min(2, g.cell.scale)),
        msPerFrame: g.cell.msPerFrame * every,
      }
      return `CELLS.push(mount(document.getElementById('t${i}'), ${payloadOf(thumb)}));`
    })
    .join('\n')

  return shell(
    'claude-ink-2d · micro games',
    `<h1>claude-ink-2d</h1><span class="sub">micro games — every object here belongs to a scene, never to a cell</span>`,
    games.length === 0
      ? `<div class="empty">nothing on the shelf yet</div>`
      : `<div class="shelf">${cards}</div>`,
    mounts,
  )
}

/** **One game, big.** Full frame count, the scene's own scale, nothing else on the page. */
export function gamePage(game: AppGame): string {
  return shell(
    `${game.title} · claude-ink-2d`,
    `<a class="back" href="/">← shelf</a><h1>${esc(game.title)}</h1><span class="sub mono">${esc(game.id)}</span>`,
    `<div class="stage"><div id="stage"></div></div>
     <div class="about">
       <p>${esc(game.blurb)}</p>
       <div class="facts mono">${game.meta.map((m) => `<span>${esc(m)}</span>`).join('')}<span id="tag"></span></div>
       <div class="keys mono">space pauses · , and . step one frame · refresh re-renders from current code</div>
     </div>`,
    `var c = mount(document.getElementById('stage'), ${payloadOf(game.cell)});
     c.tag = document.getElementById('tag');
     CELLS.push(c);`,
  )
}
