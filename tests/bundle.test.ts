import { describe, expect, it } from 'vitest'
import { compileProject } from '../src/authoring/project.ts'

describe('portable bundle contract', () => {
  const bundle = compileProject()

  it('contains only the astronaut project content', () => {
    expect(bundle.format).toBe('agent-game-bundle')
    expect(bundle.version).toBe(1)
    expect(bundle.project).toBe('apollo-11')
    expect(bundle.clips).toHaveLength(25)
    expect(bundle.clips.filter((clip) => clip.kind === 'character')).toHaveLength(15)
    expect(bundle.clips.filter((clip) => clip.kind === 'environment')).toHaveLength(10)
  })

  it('carries valid atlas, timing and world-contact metadata for every clip', () => {
    for (const clip of bundle.clips) {
      expect(clip.atlas.rgba).toHaveLength(clip.atlas.w * clip.atlas.h * 4)
      expect(clip.frames.length).toBeGreaterThan(0)
      expect(clip.frames.every((frame) => frame.x + frame.w <= clip.atlas.w)).toBe(true)
      expect(clip.frames.every((frame) => frame.y + frame.h <= clip.atlas.h)).toBe(true)
      expect(clip.frames.every((frame) => frame.durationMs > 0)).toBe(true)
      expect(clip.contact.x).toBeGreaterThanOrEqual(0)
      expect(clip.contact.x).toBeLessThanOrEqual(clip.cell.w)
      expect(clip.contact.y).toBeGreaterThan(0)
      expect(clip.contact.y).toBeLessThanOrEqual(clip.cell.h)
      expect(clip.bounds.w).toBeGreaterThan(0)
      expect(clip.bounds.h).toBeGreaterThan(0)
      expect(clip.atlas.rgba.some((byte, index) => index % 4 === 3 && byte === 255)).toBe(true)
    }
  })

  it('keeps each named animation phase on a real frame', () => {
    for (const clip of bundle.clips) {
      for (const phase of clip.phases) {
        expect(phase.frame).toBeGreaterThanOrEqual(0)
        expect(phase.frame).toBeLessThan(clip.frames.length)
      }
    }
  })
})
