/** Turning runs into page cells, shared by the file viewer, the payload dump and the server. */
import type { RunSpec } from '../io/load.ts'
import { execute } from '../io/load.ts'
import type { ViewCell } from './page.ts'

export type PageData = {
  readonly scale: number
  readonly msPerFrame: number
  readonly cells: readonly ViewCell[]
  /** One hash per cell, in order. The page's identity, and what history compares on. */
  readonly hashes: readonly string[]
}

export function buildCells(specs: readonly RunSpec[]): PageData {
  if (specs.length === 0) throw new Error('nothing to view')
  const results = specs.map((spec) => execute(spec))
  const first = results[0] as (typeof results)[number]
  return {
    scale: first.params.playback.scale,
    msPerFrame: first.params.playback.msPerFrame,
    hashes: results.map((r) => r.hash),
    // Each cell carries its own scale and rate so that different resolutions arrive the
    // same size on screen and different frame counts finish a cycle together. Both come
    // from that sample's own tunables — nothing here is chosen at view time.
    cells: results.map((result) => ({
      w: result.params.canvas.w,
      h: result.params.canvas.h,
      frames: result.frames.map((f) => f.buf.data),
      palette: result.grammar.palette.colors,
      label: `${result.spec.grammar} · ${result.hash}`,
      scale: result.params.playback.scale,
      msPerFrame: result.params.playback.msPerFrame,
    })),
  }
}

/** Cells travel to the browser as base64; this is the same shape `emit` embeds. */
export function toJson(data: PageData, mode: 'live'): string {
  return JSON.stringify({
    mode,
    scale: data.scale,
    msPerFrame: data.msPerFrame,
    cells: data.cells.map((cell) => ({
      w: cell.w,
      h: cell.h,
      n: cell.frames.length,
      palette: cell.palette,
      indices: Buffer.concat(cell.frames.map((f) => Buffer.from(f))).toString('base64'),
      label: cell.label,
      scale: cell.scale,
      msPerFrame: cell.msPerFrame,
    })),
  })
}
