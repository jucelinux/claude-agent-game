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
}

export type ViewSpec = {
  readonly mode: 'bench' | 'gate' | 'selftest'
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
    return payload
  })

  const data = {
    mode: spec.mode,
    scale: spec.scale,
    // Timing is a property of the page, never of a cell: one tick, or nobody is comparable.
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
${runtime({ controls: spec.mode === 'bench', labels: !gate })}
start(${escapeScript(JSON.stringify(data))});
</script>
`
}

/**
 * The runtime, inlined. Written to be read: if this loop ever grows a second clock or a
 * per-cell timer, the page stops being an instrument and starts being an opinion.
 *
 * The controls **and the label machinery** are compiled out of the gate page rather than
 * switched off in it. A disabled control is one typo away from an enabled one, and the
 * things they would enable are judging a still and naming the impostor.
 */
const runtime = ({ controls, labels }: { controls: boolean; labels: boolean }): string => `
function start(D) {
  var stage = document.getElementById('stage');
  var cells = D.cells.map(function (c) {
    var wrap = document.createElement('div');
    wrap.className = 'cell';

    var view = document.createElement('canvas');
    view.width = c.w * D.scale;
    view.height = c.h * D.scale;
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

    return { n: c.n, images: images, off: off, octx: octx, ctx: ctx, view: view${labels ? ', tag: tag, name: c.label' : ''} };
  });

  function draw(frame) {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var k = frame % cell.n;
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

  // One accumulator, one frame counter, every cell. No cell owns a clock.
  var last = null, acc = 0, frame = 0, paused = false;
  function tick(now) {
    if (last === null) last = now;
    acc += now - last;
    last = now;
    if (!paused) {
      while (acc >= D.msPerFrame) { acc -= D.msPerFrame; frame++; }
    } else {
      acc = 0;
    }
    draw(frame);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
${
  controls
    ? `
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ') { paused = !paused; e.preventDefault(); }
    else if (e.key === 'ArrowRight') { paused = true; frame++; draw(frame); }
    else if (e.key === 'ArrowLeft') { paused = true; frame = frame > 0 ? frame - 1 : 0; draw(frame); }
  });
`
    : ''
}}
`

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** JSON inside a <script> only needs the closing-tag sequence broken up. */
function escapeScript(json: string): string {
  return json.replace(/<\//g, '<\\/')
}
