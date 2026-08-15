/**
 * The human's channel: a self-contained HTML page, no network, no dependency.
 *
 * Three modes, and the split is the whole point:
 *  - **bench** — mine. Labels, `t`, step, pause. Stopping time is how a defect gets named.
 *  - **gate**  — his. No control, no label, no filename, no tooltip. It loops and the only
 *    interaction it allows is pointing. The rule "never judge a still" protects *his*
 *    reading (`CLAUDE.md` gate block), so it is enforced here, not in the file format.
 *  - **selftest** — the null case, made visible instead of trusted (`HARNESS.md` §5).
 *
 * One blit path for every cell, one tick for the whole page: nearest-neighbour at an
 * integer scale, and every cell advances on the same accumulator. A cell that ran on its
 * own clock, or through a smoothing filter, would be compared as a renderer rather than as
 * art — and the error has a direction: smoothing flatters mine. portable.
 */
import type { RGB } from '../core/types.ts'

export type ViewCell = {
  readonly w: number
  readonly h: number
  readonly frames: readonly Uint8Array[]
  readonly palette: readonly RGB[]
  /** bench/selftest only — dropped from the payload in gate mode. */
  readonly label?: string
  /** Integer, defaults to the page's. A 32 px cell at ×6 and a 64 px cell at ×3 arrive on
   * screen the same size, which is the only way two resolutions compare as *idioms*. */
  readonly scale?: number
  /** Defaults to the page's. See the note on the runtime: a cell may own a **rate**, never
   * a clock — a 4-frame walk and an 8-frame walk have to finish a cycle together. */
  readonly msPerFrame?: number
  /** What this generation was about. Derived from what changed, never narrated. */
  readonly summary?: readonly string[]
  /**
   * **A slide is a run, not a sprite.** Cells sharing a group land on the same slide, so
   * one arrow press moves a whole run — the humanoid and every insect variation together —
   * instead of stepping through them one at a time and comparing from memory.
   */
  readonly group?: string
}

/**
 * Mid grey. Black was tried at the human's request on 14/08 and reverted by him on 15/08
 * once he had looked at it — the reason it does not work is worth keeping written down,
 * because it applies to any dark ground anyone proposes later: **index 0 is transparent, so
 * the page's ground is the sprite's background.** The darkest ink tones in these palettes
 * sit at RGB 10–26; against black they are invisible, and what disappears with them is the
 * outline — the exact thing the silhouette is judged on.
 */
export const GROUND = '#6b6b6b'

export type ViewSpec = {
  /**
   * `live` is the served page and the **only** one allowed to touch the network: it is
   * mine, it stays open, and the frames are swapped under a loop that never stops.
   * The gate is never live — a sheet that can change under him is not a reading.
   */
  readonly mode: 'bench' | 'gate' | 'selftest' | 'live'
  /** Integer only: pixel art at a fractional scale is judged through mud. */
  readonly scale: number
  readonly msPerFrame: number
  readonly cells: readonly ViewCell[]
  readonly title?: string
  readonly notes?: readonly string[]
  /** Defaults to `GROUND`. The self-test overrides it, and its reason is on `GROUND`. */
  readonly ground?: string
  /** One cell at a time with arrows. Defaults to on for `live`; forbidden for comparisons. */
  readonly slides?: boolean
}

export function emit(spec: ViewSpec): string {
  if (!Number.isInteger(spec.scale) || spec.scale < 1) {
    throw new Error(`scale must be a positive integer, is ${spec.scale}`)
  }
  const gate = spec.mode === 'gate'
  const live = spec.mode === 'live'
  /**
   * **Slides are for history; grids are for comparisons.** The gate must show all six cells
   * at once because that *is* the reading, and the self-test's four cells only mean
   * anything side by side — so neither may ever be a slideshow, and asking is an error
   * rather than a silently ignored option.
   */
  const slides = spec.slides ?? live
  if (slides && (gate || spec.mode === 'selftest')) {
    throw new Error(`${spec.mode} is a comparison and cannot be a slideshow`)
  }
  const ground = spec.ground ?? GROUND

  const cells = spec.cells.map((cell) => {
    const per = cell.w * cell.h
    for (const frame of cell.frames) {
      if (frame.length !== per) throw new Error(`a frame of ${frame.length} px does not fit ${cell.w}x${cell.h}`)
    }
    const bytes = Buffer.concat(cell.frames.map((f) => Buffer.from(f)))
    const payload: Record<string, unknown> = {
      w: cell.w,
      h: cell.h,
      n: cell.frames.length,
      palette: cell.palette,
      indices: bytes.toString('base64'),
    }
    // In gate mode a label is a tell, and a tell is the end of the reading.
    if (!gate && cell.label !== undefined) payload['label'] = cell.label
    if (cell.scale !== undefined) {
      if (!Number.isInteger(cell.scale) || cell.scale < 1) throw new Error(`cell scale must be a positive integer, is ${cell.scale}`)
      payload['scale'] = cell.scale
    }
    if (cell.msPerFrame !== undefined) {
      if (!Number.isInteger(cell.msPerFrame) || cell.msPerFrame < 1) throw new Error(`cell msPerFrame must be a positive integer, is ${cell.msPerFrame}`)
      payload['msPerFrame'] = cell.msPerFrame
    }
    if (!gate && cell.summary !== undefined) payload['summary'] = cell.summary
    if (!gate && cell.group !== undefined) payload['group'] = cell.group
    return payload
  })

  const data = {
    mode: spec.mode,
    scale: spec.scale,
    /**
     * **One clock for the page; a cell may declare a rate against it.** The first version
     * of this forbade a cell any timing at all, and that was too blunt: comparing a
     * 4-frame walk with an 8-frame walk requires both to finish a cycle in the same wall
     * time, or the sheet is also comparing walking speed. What must never come back is a
     * cell owning a *timer* — one accumulator drives the page, and a cell's rate is a
     * declared number read off it.
     */
    msPerFrame: spec.msPerFrame,
    cells,
  }

  const title = gate ? 'sheet' : (spec.title ?? 'claude-ink-2d')
  const notes = gate ? [] : (spec.notes ?? [])

  return `<!doctype html>
<meta charset="utf-8">
<title>${escapeText(title)}</title>
<style>
  :root { color-scheme: dark }
  html, body { margin: 0; height: 100% }
  body {
    background: ${ground};
    color: ${ground === GROUND ? '#8a8a8a' : '#1c1c1c'};
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100%; padding: 32px; box-sizing: border-box; gap: 20px;
  }
  #stage { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; justify-content: center }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 6px }
  canvas { image-rendering: pixelated; display: block }
${gate ? '' : `  .label { color: ${ground === GROUND ? '#9a9a9a' : '#2a2a2a'} }
  .notes { max-width: 68ch; color: ${ground === GROUND ? '#767676' : '#232323'}; white-space: pre-wrap }
  #nav { display: flex; gap: 16px; align-items: center; user-select: none }
  #nav span { cursor: pointer; padding: 2px 10px; border: 1px solid currentColor; color: inherit }
  #caption { max-width: 72ch; min-height: 5em; white-space: pre-wrap; text-align: left }
  #caption b { color: ${ground === GROUND ? '#d8d8d8' : '#101010'}; font-weight: normal }`}
</style>
${notes.length > 0 ? `<div class="notes">${notes.map(escapeText).join('\n')}</div>` : ''}
<div id="stage"></div>
${slides ? '<div id="nav"></div>\n<div id="caption"></div>' : ''}
<script>
${runtime({ controls: spec.mode === 'bench' || live, labels: !gate, swap: live, slides })}
${live ? 'var page = start' : 'start'}(${escapeScript(JSON.stringify(data))});
${live ? BOOTSTRAP : ''}</script>
`
}

/**
 * Live only. The page is opened once and never rebuilt: on a change the server pings, the
 * frames are pulled and swapped **under a running loop**, so the difference is seen in
 * motion instead of in a reload. This is the one page allowed to reach the network, and
 * `bin/view.ts` cannot write it to a file.
 */
const BOOTSTRAP = `
function pull() {
  fetch('/frames.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { page.swap(d); });
}
pull();
new EventSource('/events').onmessage = function (e) {
  // A frame change swaps under the running loop; only a change to the page itself is
  // worth a reload, because a reload restarts the animation.
  if (e.data === 'reload') { location.reload(); } else { pull(); }
};
`

/**
 * The runtime, inlined. Written to be read: if this loop ever grows a second clock or a
 * per-cell timer, the page stops being an instrument and starts being an opinion.
 *
 * The controls **and the label machinery** are compiled out of the gate page rather than
 * switched off in it. A disabled control is one typo away from an enabled one, and the
 * things they would enable are judging a still and naming the impostor.
 */
const runtime = ({
  controls,
  labels,
  swap,
  slides,
}: {
  controls: boolean
  labels: boolean
  swap: boolean
  slides: boolean
}): string => `
function start(D) {
  var stage = document.getElementById('stage');
  var cells = [];
  var ms = D.msPerFrame;
  var elapsed = 0, paused = false, slide = 0, groups = [];

  // Rebuilding the cells never touches the frame counter or the accumulator. That is the
  // whole trick of the live page: the loop does not restart, so a change is seen in motion.
  function build(D) {
  stage.innerHTML = '';
  ms = D.msPerFrame;
  cells = D.cells.map(function (c) {
    var wrap = document.createElement('div');
    wrap.className = 'cell';

    var scale = c.scale || D.scale;
    var view = document.createElement('canvas');
    view.width = c.w * scale;
    view.height = c.h * scale;
    var ctx = view.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var off = document.createElement('canvas');
    off.width = c.w;
    off.height = c.h;
    var octx = off.getContext('2d');

    // Every cell reaches the screen through this decode. Indexed bytes in, ImageData out,
    // index 0 fully transparent so no cell carries a background the others do not.
    var raw = atob(c.indices);
    var per = c.w * c.h;
    var images = [];
    for (var f = 0; f < c.n; f++) {
      var img = octx.createImageData(c.w, c.h);
      for (var i = 0; i < per; i++) {
        var idx = raw.charCodeAt(f * per + i);
        var o = i * 4;
        if (idx === 0) { img.data[o + 3] = 0; continue; }
        var rgb = c.palette[idx];
        img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = 255;
      }
      images.push(img);
    }

    wrap.appendChild(view);
${
  labels
    ? `    var tag = null;
    if (c.label) {
      tag = document.createElement('div');
      tag.className = 'label';
      tag.textContent = c.label;
      wrap.appendChild(tag);
    }
`
    : ''
}    stage.appendChild(wrap);

    return { n: c.n, ms: c.msPerFrame || D.msPerFrame, images: images, off: off, octx: octx, ctx: ctx, view: view, wrap: wrap, group: ${slides ? "(c.group || '')" : "''"}, name: ${labels || slides ? 'c.label' : 'null'}, summary: ${slides ? 'c.summary' : 'null'}${labels ? ', tag: tag' : ''} };
  });
${
  slides
    ? `  groups = [];
  for (var g = 0; g < cells.length; g++) {
    if (groups.length === 0 || groups[groups.length - 1].name !== cells[g].group) {
      groups.push({ name: cells[g].group, items: [] });
    }
    groups[groups.length - 1].items.push(g);
    cells[g].slide = groups.length - 1;
  }
  if (slide >= groups.length) slide = 0;
  show(slide);
`
    : ''
}  }
${
  slides
    ? `
  // One run at a time. The history only grows; a wall of every generation is a wall.
  function show(i) {
    if (groups.length === 0) return;
    slide = ((i % groups.length) + groups.length) % groups.length;
    for (var k = 0; k < cells.length; k++) cells[k].wrap.style.display = cells[k].slide === slide ? 'flex' : 'none';
    var nav = document.getElementById('nav');
    nav.textContent = '';
    var back = document.createElement('span'); back.textContent = '\\u2039';
    back.onclick = function () { show(slide - 1); };
    var count = document.createElement('div'); count.textContent = (slide + 1) + ' / ' + groups.length;
    var next = document.createElement('span'); next.textContent = '\\u203a';
    next.onclick = function () { show(slide + 1); };
    nav.appendChild(back); nav.appendChild(count); nav.appendChild(next);

    var caption = document.getElementById('caption');
    caption.textContent = '';
    var head = document.createElement('b');
    head.textContent = groups[slide].name || '';
    caption.appendChild(head);
    var items = groups[slide].items;
    for (var q = 0; q < items.length; q++) {
      var cell = cells[items[q]];
      var lines = cell.summary || [];
      if (items.length > 1) caption.appendChild(document.createTextNode('\\n\\n' + (cell.name || '')));
      for (var s = 0; s < lines.length; s++) caption.appendChild(document.createTextNode('\\n' + lines[s]));
    }
    draw(elapsed);
  }
`
    : ''
}
  function draw(elapsed) {
    for (var i = 0; i < cells.length; i++) {
${slides ? '      if (cells[i].slide !== slide) continue;\n' : ''}      var cell = cells[i];
      var k = Math.floor(elapsed / cell.ms) % cell.n;
      cell.octx.putImageData(cell.images[k], 0, 0);
      cell.ctx.clearRect(0, 0, cell.view.width, cell.view.height);
      cell.ctx.drawImage(cell.off, 0, 0, cell.view.width, cell.view.height);
${
  controls
    ? `      if (cell.tag) { cell.tag.textContent = cell.name + '  f' + k + '  t=' + (k / cell.n).toFixed(3); }
`
    : ''
}    }
  }

  // One accumulator for the whole page. A cell reads its own frame off this one number.
  var last = null;
  function tick(now) {
    if (last === null) last = now;
    if (!paused) elapsed += now - last;
    last = now;
    draw(elapsed);
    requestAnimationFrame(tick);
  }
  build(D);
  requestAnimationFrame(tick);
${
  controls
    ? `
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ') { paused = !paused; e.preventDefault(); }
${
  slides
    ? `    else if (e.key === 'ArrowRight') { show(slide + 1); }
    else if (e.key === 'ArrowLeft') { show(slide - 1); }
    else if (e.key === '.') { paused = true; elapsed += ms; draw(elapsed); }
    else if (e.key === ',') { paused = true; elapsed = elapsed > ms ? elapsed - ms : 0; draw(elapsed); }`
    : `    else if (e.key === 'ArrowRight') { paused = true; elapsed += ms; draw(elapsed); }
    else if (e.key === 'ArrowLeft') { paused = true; elapsed = elapsed > ms ? elapsed - ms : 0; draw(elapsed); }`
}
  });
`
    : ''
}${swap ? '\n  return { swap: build };\n' : ''}}
`

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** JSON inside a <script> only needs the closing-tag sequence broken up. */
function escapeScript(json: string): string {
  return json.replace(/<\//g, '<\\/')
}
