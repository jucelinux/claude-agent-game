import { describe, expect, it } from 'vitest'
import { compileBundle, compileClip } from '../src/compiler/compile.ts'
import { compileProject, PROJECT_ID, PROJECT_SEED } from '../src/authoring/project.ts'
import { WASTELAND_TRAVELER_3D_ATLAS_ASSETS } from '../src/authoring/wastelandTraveler3dAtlas.ts'
import { COMPILER_FIXTURE } from './fixture.ts'

describe('deterministic project compiler', () => {
  it('produces the same bundle from the same project', () => {
    const first = compileProject()
    const second = compileProject()

    expect(first.checksum).toBe(second.checksum)
    expect(first.clips).toEqual(second.clips)
  })

  it('compiles a registered grammar to portable raster metadata', () => {
    const first = compileClip(COMPILER_FIXTURE, PROJECT_SEED)
    const second = compileClip(COMPILER_FIXTURE, PROJECT_SEED)

    expect(first.checksum).toBe(second.checksum)
    expect(first.atlas.rgba).toEqual(second.atlas.rgba)
    expect(first.frames).toHaveLength(1)
    expect(first.bounds.w).toBeGreaterThan(0)
    expect(first.bounds.h).toBeGreaterThan(0)
    expect(first.atlas.rgba.some((byte, index) => index % 4 === 3 && byte === 255)).toBe(true)
  })

  it('rejects duplicate public asset ids', () => {
    expect(() => compileBundle(
      PROJECT_ID,
      [COMPILER_FIXTURE, COMPILER_FIXTURE],
      PROJECT_SEED,
    )).toThrow(/duplicate asset id/)
  })

  it('rejects invalid parameter data at the compiler boundary', () => {
    const invalid = {
      ...COMPILER_FIXTURE,
      params: {
        ...COMPILER_FIXTURE.params,
        canvas: { ...COMPILER_FIXTURE.params.canvas, w: Number.NaN },
      },
    }
    expect(() => compileClip(invalid, PROJECT_SEED)).toThrow(/canvas\.w/)
  })

  it('compiles authored indexed frames into a deterministic animation atlas', () => {
    const source = WASTELAND_TRAVELER_3D_ATLAS_ASSETS.find(
      (asset) => asset.id === 'ashfall-traveler-s-walk',
    )
    if (source === undefined) throw new Error('missing south walk atlas fixture')
    const first = compileClip(source, PROJECT_SEED)
    const second = compileClip(source, PROJECT_SEED)

    expect(first).toEqual(second)
    expect(first.frames).toHaveLength(16)
    expect(first.frames.every((frame) => frame.durationMs === 62)).toBe(true)
    expect(first.bounds.h).toBeGreaterThan(24)
    expect(first.palette).toHaveLength(17)
  })

  it('compiles the Blender rig bake into the active directional atlas', () => {
    const source = WASTELAND_TRAVELER_3D_ATLAS_ASSETS.find(
      (asset) => asset.id === 'ashfall-traveler-n-walk',
    )
    if (source === undefined) throw new Error('missing north Blender walk atlas fixture')
    const compiled = compileClip(source, PROJECT_SEED)
    const uniqueFrames = new Set(source.raster.frames.map((frame) =>
      Array.from(frame.buf.data).join(','),
    ))

    expect(compiled.frames).toHaveLength(16)
    expect(uniqueFrames.size).toBeGreaterThanOrEqual(8)
    expect(compiled.bounds.h).toBeGreaterThan(24)
    expect(compiled.materials[0]?.name).toBe('Blender low-poly + CMU mocap retarget')
  })
})
