import type { Params } from '../core/types.ts'

const REQUIRED_PATHS = [
  'canvas.w', 'canvas.h', 'canvas.originX', 'canvas.originY',
  'tones.perMaterial', 'frames.walk',
  'light.x', 'light.y', 'light.z', 'light.curve',
  'fill.x', 'fill.y', 'fill.z', 'fill.weight',
  'outline.enabled', 'outline.material', 'outline.inner', 'outline.rim',
  'body.scale', 'gait.swing', 'gait.lift', 'gait.depth', 'gait.roll',
  'texture.speckle', 'texture.dither', 'texture.lattice', 'texture.facet',
  'shadow.steps', 'shadow.bias', 'shadow.strength',
  'playback.msPerFrame', 'playback.scale',
] as const

export function validateParams(id: string, value: unknown): asserts value is Params {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${id}: parameters must be an object`)
  }

  const root = value as Record<string, unknown>
  const missing: string[] = []
  for (const path of REQUIRED_PATHS) {
    const [group, leaf] = path.split('.') as [string, string]
    const section = root[group]
    const entry = typeof section === 'object' && section !== null
      ? (section as Record<string, unknown>)[leaf]
      : undefined
    if (entry === undefined || (typeof entry === 'number' && !Number.isFinite(entry))) {
      missing.push(path)
    }
  }

  if (missing.length > 0) {
    throw new Error(`${id}: missing or invalid parameters: ${missing.join(', ')}`)
  }
}
