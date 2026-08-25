import type { RasterAssetSource } from '../compiler/types.ts'
import type { IndexedBuffer, RGB } from '../core/types.ts'
import {
  WASTELAND_TRAVELER_DIRECTIONS,
  type WastelandTravelerDirection,
} from '../game/character/wastelandTraveler.ts'
import bakedJson from './generated/wastelandTraveler3d.json'

type BakedClip = {
  readonly durations: readonly number[]
  readonly frames: readonly string[]
}

type BakedTravelerData = {
  readonly version: 2
  readonly cell: { readonly w: number; readonly h: number }
  readonly origin: { readonly x: number; readonly y: number }
  readonly contact: { readonly x: number; readonly y: number }
  readonly palette: readonly RGB[]
  readonly clips: Readonly<Record<string, BakedClip>>
}

const baked = bakedJson as unknown as BakedTravelerData

function decodeFrame(encoded: string): IndexedBuffer {
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
  const data = new Uint8Array(baked.cell.w * baked.cell.h)
  let target = 0
  for (let source = 0; source < bytes.length; source += 3) {
    const paletteIndex = bytes[source]
    const low = bytes[source + 1]
    const high = bytes[source + 2]
    if (paletteIndex === undefined || low === undefined || high === undefined) {
      throw new Error('ashfall traveler 3D frame contains an incomplete RLE run')
    }
    const count = low | high << 8
    if (count < 1 || target + count > data.length) {
      throw new Error('ashfall traveler 3D frame contains an invalid RLE run')
    }
    data.fill(paletteIndex, target, target + count)
    target += count
  }
  if (target !== data.length) {
    throw new Error(`ashfall traveler 3D frame decoded ${target}/${data.length} pixels`)
  }
  return { w: baked.cell.w, h: baked.cell.h, data }
}

function phaseAt(durations: readonly number[], frame: number): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  return durations.slice(0, frame).reduce((sum, duration) => sum + duration, 0) / total
}

function buildSource(
  direction: WastelandTravelerDirection,
  state: 'idle' | 'walk',
): RasterAssetSource {
  const clip = baked.clips[`${direction}-${state}`]
  if (clip === undefined) throw new Error(`missing baked traveler clip ${direction}-${state}`)
  if (clip.frames.length !== clip.durations.length) {
    throw new Error(`traveler clip ${direction}-${state} changed its duration layout`)
  }
  return {
    id: `ashfall-traveler-${direction}-${state}`,
    kind: 'character',
    raster: {
      frames: clip.frames.map((frame, index) => ({
        t: state === 'walk' ? phaseAt(clip.durations, index) : index / clip.frames.length,
        durationMs: clip.durations[index] ?? 48,
        buf: decodeFrame(frame),
      })),
      palette: baked.palette,
      origin: baked.origin,
      contact: baked.contact,
      phases: state === 'walk'
        ? [
            { name: 'left-contact', at: 0, frame: 0 },
            { name: 'right-passing', at: 0.25, frame: clip.frames.length / 4 },
            { name: 'right-contact', at: 0.5, frame: clip.frames.length / 2 },
            { name: 'left-passing', at: 0.75, frame: clip.frames.length * 3 / 4 },
          ]
        : [{ name: 'breath', at: 0, frame: 0 }],
      loops: true,
      materials: [{
        name: 'Blender low-poly + CMU mocap retarget',
        indices: baked.palette.slice(1).map((_, index) => index + 1),
      }],
    },
  }
}

/** Directional sprites baked offline from one rigged Blender character. */
export const WASTELAND_TRAVELER_3D_ATLAS_ASSETS: readonly RasterAssetSource[] =
  WASTELAND_TRAVELER_DIRECTIONS.flatMap((direction) => [
    buildSource(direction, 'idle'),
    buildSource(direction, 'walk'),
  ])
