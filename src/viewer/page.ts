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
}

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
}

export function emit(spec: ViewSpec): string {
  if (!Number.isInteger(spec.scale) || spec.scale < 1) {
    throw new Error(`scale must be a positive integer, is ${spec.scale}`)
  }
  const gate = spec.mode === 'gate'
  const live = spec.mode === 'live'

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
    background: #6b6b6b;
    color: #1c1c1c;
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100%; padding: 32px; box-sizing: border-box; gap: 24px;
  }
  #stage { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; justify-content: center }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 6px }
  canvas { image-rendering: pixelated; display: block }
${gate ? '' : '  .label { color: #2a2a2a }\n  .notes { max-width: 68ch; color: #232323; white-space: pre-wrap }'}
</style>
${notes.length > 0 ? `<div class="notes">${notes.map(escapeText).join('\n')}</div>` : ''}
<div id="stage"></div>
<script>
${runtime({ controls: spec.mode === 'bench' || live, labels: !gate, swap: live })}
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
new EventSource('/events').onmessage = function () { pull(); };
`

/**
 * The runtime, inlined. Written to be read: if this loop ever grows a second clock or a
 * per-cell timer, the page stops being an instrument and starts being an opinion.
 *
 * The controls **and the label machinery** are compiled out of the gate page rather than
 * switched off in it. A disabled control is one typo away from an enabled one, and the
 * things they would enable are judging a still and naming the impostor.
 */
const runtime = ({ controls, labels, swap }: { controls: boolean; labels: boolean; swap: boolean }): string => `
function start(D) {
  var stage = document.getElementById('stage');
  var cells = [];
  var ms = D.msPerFrame;
  var elapsed = 0, paused = false;

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

    return { n: c.n, ms: c.msPerFrame || D.msPerFrame, images: images, off: off, octx: octx, ctx: ctx, view: view${labels ? ', tag: tag, name: c.label' : ''} };
  });
  }

  function draw(elapsed) {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
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
    else if (e.key === 'ArrowRight') { paused = true; elapsed += ms; draw(elapsed); }
    else if (e.key === 'ArrowLeft') { paused = true; elapsed = elapsed > ms ? elapsed - ms : 0; draw(elapsed); }
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
