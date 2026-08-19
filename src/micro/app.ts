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
import { bundleRuntime } from './bundle.ts'

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
    rain: stage.rain, climb: stage.climb, runner: stage.runner, descent: stage.descent, arena: stage.arena, interactive, meter: interactive,
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
/**
 * **The runtime, and it is no longer a string.**
 *
 * It used to be 2014 lines of JavaScript inside a template literal in this file: one scope for
 * nine games, invisible to the compiler, with backticks forbidden inside its own comments. It
 * broke the parse three times in one session, and a scene field that never reached the payload
 * once shipped through 522 green locks and died only in a browser.
 *
 * The cause was structural rather than careless — **a string cannot contradict the agent writing
 * it.** The runtime now lives in `src/runtime/` as typed modules, one per game shape, and
 * `bundleRuntime` turns them into the one classic script this page has always served. No
 * dependency and no build step: Node strips the types and the module wiring is twelve lines.
 *
 * `tests/golden.test.ts` holds the proof that the move changed nothing — the exact sequence of
 * canvas calls every game makes, folded to one number per game.
 */
const RUNTIME = bundleRuntime()

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
  const playable = game.stage.arena !== null || game.stage.placed.some((p) => p.player !== undefined || p.climber !== undefined || p.runs !== undefined || p.rides !== undefined)
  // **The score is a DOM element and not a sprite.** A HUD is not art: baking a number into an
  // indexed buffer would mean drawing a font, and a font is the one thing in a pixel game that
  // has to be legible at every scale rather than beautiful at one.
  const scored = game.stage.climb !== null || game.stage.runner !== null || game.stage.descent !== null || game.stage.arena !== null
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
