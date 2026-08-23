import { describe, expect, it } from 'vitest'
import { compileBundle, compileClip } from '../src/compiler/compile.ts'
import { compileProject, PROJECT_ID, PROJECT_SEED } from '../src/authoring/project.ts'
import { PROJECT_ASSETS } from '../src/authoring/catalog.ts'

describe('deterministic project compiler', () => {
  it('produces the same bundle from the same project', () => {
    const first = compileProject()
    const second = compileProject()

    expect(first.checksum).toBe(second.checksum)
    expect(first.clips.map((clip) => clip.checksum)).toEqual(second.clips.map((clip) => clip.checksum))
    first.clips.forEach((clip, index) => {
      expect(clip.atlas.rgba).toEqual(second.clips[index]?.atlas.rgba)
    })
  }, 30_000)

  it('rejects duplicate public asset ids', () => {
    const source = PROJECT_ASSETS[0]
    expect(source).toBeDefined()
    expect(() => compileBundle(PROJECT_ID, [source!, source!], PROJECT_SEED)).toThrow(/duplicate asset id/)
  })

  it('rejects invalid parameter data at the compiler boundary', () => {
    const source = PROJECT_ASSETS[0]
    expect(source).toBeDefined()
    const invalid = {
      ...source!,
      params: {
        ...source!.params,
        canvas: { ...source!.params.canvas, w: Number.NaN },
      },
    }
    expect(() => compileClip(invalid, PROJECT_SEED)).toThrow(/canvas\.w/)
  })
})
