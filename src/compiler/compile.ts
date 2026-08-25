import { strip } from '../core/render.ts'
import type { IndexedBuffer, RGB } from '../core/types.ts'
import type {
  AssetSource,
  CompiledBundle,
  CompiledClip,
  GrammarAssetSource,
  RasterAssetSource,
} from './types.ts'
import { validateParams } from './validateParams.ts'

const checksumBytes = (bytes: Uint8ClampedArray, seed = 0x811c9dc5): number => {
  let hash = seed >>> 0
  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

const checksumText = (text: string, seed = 0x811c9dc5): number => {
  let hash = seed >>> 0
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

const hex = (value: number): string => value.toString(16).padStart(8, '0')

const seedFor = (projectSeed: number, id: string): number => checksumText(id, projectSeed)

type IndexedFrame = {
  readonly t: number
  readonly buf: IndexedBuffer
}

function frameBounds(frames: readonly IndexedFrame[]): {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly bottom: number
} {
  const first = frames[0]
  if (first === undefined) throw new Error('a compiled clip must contain a frame')
  let minX = first.buf.w
  let minY = first.buf.h
  let maxX = -1
  let maxY = -1
  for (const frame of frames) {
    for (let y = 0; y < frame.buf.h; y++) {
      for (let x = 0; x < frame.buf.w; x++) {
        if (frame.buf.data[y * frame.buf.w + x] === 0) continue
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('a compiled clip rendered no pixels')
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, bottom: maxY + 1 }
}

function buildRgbaAtlas(
  id: string,
  frames: readonly IndexedFrame[],
  palette: readonly RGB[],
): { readonly w: number; readonly h: number; readonly rgba: Uint8ClampedArray } {
  const first = frames[0]
  if (first === undefined) throw new Error(`${id}: renderer returned no frames`)
  const cellW = first.buf.w
  const cellH = first.buf.h
  const atlasW = cellW * frames.length
  const rgba = new Uint8ClampedArray(atlasW * cellH * 4)

  frames.forEach((frame, frameIndex) => {
    if (frame.buf.w !== cellW || frame.buf.h !== cellH) {
      throw new Error(`${id}: frame ${frameIndex} changed cell size`)
    }
    for (let y = 0; y < cellH; y++) {
      for (let x = 0; x < cellW; x++) {
        const paletteIndex = frame.buf.data[y * cellW + x] as number
        const target = (y * atlasW + frameIndex * cellW + x) * 4
        if (paletteIndex === 0) continue
        const color = palette[paletteIndex]
        if (color === undefined) throw new Error(`${id}: palette index ${paletteIndex} is absent`)
        rgba[target] = color[0]
        rgba[target + 1] = color[1]
        rgba[target + 2] = color[2]
        rgba[target + 3] = 255
      }
    }
  })

  return { w: atlasW, h: cellH, rgba }
}

function compileGrammarClip(source: GrammarAssetSource, projectSeed: number): CompiledClip {
  validateParams(source.id, source.params)
  const rendered = strip(source.grammar, source.params, seedFor(projectSeed, source.id))
  const first = rendered[0]
  if (first === undefined) throw new Error(`${source.id}: renderer returned no frames`)

  const cellW = first.buf.w
  const cellH = first.buf.h
  const atlas = buildRgbaAtlas(source.id, rendered, source.grammar.palette.colors)

  const loops = source.grammar.gait.wrap !== false
  const frameCount = rendered.length
  const phaseSpan = loops || frameCount < 2 ? frameCount : frameCount - 1
  const bounds = frameBounds(rendered)
  const clipChecksum = hex(checksumBytes(atlas.rgba, checksumText(source.id)))

  return {
    id: source.id,
    kind: source.kind,
    textureKey: `generated:${source.id}`,
    atlas,
    cell: { w: cellW, h: cellH },
    origin: { x: source.params.canvas.originX, y: source.params.canvas.originY },
    contact: { x: source.params.canvas.originX, y: bounds.bottom },
    bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
    frames: rendered.map((frame, index) => ({
      index,
      x: index * cellW,
      y: 0,
      w: cellW,
      h: cellH,
      t: frame.t,
      durationMs: source.params.playback.msPerFrame,
    })),
    phases: source.grammar.gait.phases.map((phase) => ({
      name: phase.name,
      at: phase.at,
      frame: loops
        ? Math.round(phase.at * phaseSpan) % frameCount
        : Math.min(frameCount - 1, Math.round(phase.at * phaseSpan)),
    })),
    loops,
    palette: source.grammar.palette.colors,
    materials: source.grammar.palette.ramps.map((ramp) => ({
      name: ramp.material,
      indices: ramp.indices,
    })),
    anchors: source.grammar.skeleton.bones.map((bone) => ({
      name: bone.name,
      parent: bone.parent,
      x: bone.x,
      y: bone.y,
      angleTurns: bone.angle,
    })),
    checksum: clipChecksum,
  }
}

function compileRasterClip(source: RasterAssetSource): CompiledClip {
  const first = source.raster.frames[0]
  if (first === undefined) throw new Error(`${source.id}: raster source has no frames`)
  if (source.raster.palette.length < 2) throw new Error(`${source.id}: raster palette has no paint colors`)
  const atlas = buildRgbaAtlas(source.id, source.raster.frames, source.raster.palette)
  const bounds = frameBounds(source.raster.frames)
  const clipChecksum = hex(checksumBytes(atlas.rgba, checksumText(source.id)))

  return {
    id: source.id,
    kind: source.kind,
    textureKey: `generated:${source.id}`,
    atlas,
    cell: { w: first.buf.w, h: first.buf.h },
    origin: source.raster.origin,
    contact: source.raster.contact,
    bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
    frames: source.raster.frames.map((frame, index) => ({
      index,
      x: index * first.buf.w,
      y: 0,
      w: first.buf.w,
      h: first.buf.h,
      t: frame.t,
      durationMs: frame.durationMs,
    })),
    phases: source.raster.phases,
    loops: source.raster.loops,
    palette: source.raster.palette,
    materials: source.raster.materials,
    anchors: [],
    checksum: clipChecksum,
  }
}

export function compileClip(source: AssetSource, projectSeed: number): CompiledClip {
  return 'raster' in source
    ? compileRasterClip(source)
    : compileGrammarClip(source, projectSeed)
}

export function compileBundle(project: string, sources: readonly AssetSource[], seed: number): CompiledBundle {
  const ids = new Set<string>()
  for (const source of sources) {
    if (ids.has(source.id)) throw new Error(`duplicate asset id "${source.id}"`)
    ids.add(source.id)
  }
  const clips = sources.map((source) => compileClip(source, seed))
  const checksum = hex(checksumText(clips.map((clip) => `${clip.id}:${clip.checksum}`).join('|'), seed))
  return { format: 'agent-game-bundle', version: 1, project, seed, clips, checksum }
}
