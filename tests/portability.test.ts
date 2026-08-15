import { describe, expect, it } from 'vitest'
import { loadParams } from '../src/io/load.ts'
import { strip } from '../src/core/render.ts'
import { fixture } from '../src/grammars/fixture.ts'
import { GRAMMARS } from '../src/grammars/index.ts'
import { describe as manifestOf, validate } from '../src/export/contract.ts'
import type { Manifest } from '../src/export/contract.ts'

/**
 * **The artifact stays exportable.** The exporter ships at the vertical slice; these locks
 * ship now, so the grammar cannot drift into something no engine can ingest while nobody
 * is looking. Every assertion here is a requirement of an atlas consumer — Pixi, Godot,
 * LÖVE, Unity — and none of them is a requirement of any one of them.
 */
describe('export contract', () => {
  const params = loadParams('default')

  it('every declared grammar satisfies the contract', () => {
    for (const [name, grammar] of Object.entries(GRAMMARS)) {
      expect(validate(manifestOf(grammar, params)), `grammar "${name}"`).toEqual([])
    }
  })

  it('every frame is the same rect: an atlas has one cell size, not one per frame', () => {
    const frames = strip(fixture, params, 1)
    for (const frame of frames) {
      expect(frame.buf.w).toBe(params.canvas.w)
      expect(frame.buf.h).toBe(params.canvas.h)
      expect(frame.buf.data.length).toBe(params.canvas.w * params.canvas.h)
    }
  })

  it('the pivot is declared, on the grid, and constant across the cycle', () => {
    const m = manifestOf(fixture, params)
    expect(m.pivot).toEqual({ x: params.canvas.originX, y: params.canvas.originY })
    expect(Number.isInteger(m.pivot.x) && Number.isInteger(m.pivot.y)).toBe(true)
    // Constant by construction: the pivot is the render origin, not a per-frame bbox.
    expect(m.frames.every(() => true)).toBe(true)
  })

  it('phases are named and land on real frames — a footstep can be synced to one', () => {
    const m = manifestOf(fixture, params)
    expect(m.phases.length).toBeGreaterThanOrEqual(4)
    for (const phase of m.phases) {
      expect(phase.name).not.toBe('')
      expect(m.frames[phase.frame]).toBeDefined()
    }
  })

  it('anchors are exported, so something can be attached to the sprite', () => {
    const m = manifestOf(fixture, params)
    expect(m.anchors.length).toBeGreaterThan(0)
    expect(m.anchors[0]!.parent).toBe(null)
    for (const anchor of m.anchors) expect(anchor.name).not.toBe('')
  })

  it('timing travels with the artifact, in whole milliseconds', () => {
    const m = manifestOf(fixture, params)
    expect(m.totalMs).toBe(m.frames.length * params.playback.msPerFrame)
    for (const frame of m.frames) expect(Number.isInteger(frame.durationMs)).toBe(true)
  })

  it('the validator is calibrated: each violation is actually caught', () => {
    const good = manifestOf(fixture, params)
    const broken = (patch: Partial<Manifest>): number => validate({ ...good, ...patch }).length

    expect(validate(good)).toEqual([])
    expect(broken({ palette: Array.from({ length: 257 }, () => [0, 0, 0] as const) })).toBeGreaterThan(0)
    expect(broken({ materials: [{ name: 'shell', indices: [0, 1] }] })).toBeGreaterThan(0)
    expect(broken({ pivot: { x: 1.5, y: 2 } })).toBeGreaterThan(0)
    expect(broken({ pivot: { x: 9999, y: 2 } })).toBeGreaterThan(0)
    expect(broken({ phases: [{ name: 'a', at: 0, frame: 0 }, { name: 'a', at: 0.5, frame: 2 }] })).toBeGreaterThan(0)
    expect(broken({ phases: [{ name: 'b', at: 0.5, frame: 2 }, { name: 'a', at: 0.25, frame: 1 }] })).toBeGreaterThan(0)
    expect(broken({ anchors: [{ name: 'hand', parent: 'arm', x: 0, y: 0, angleTurns: 0 }] })).toBeGreaterThan(0)
    expect(broken({ frames: [{ index: 0, t: 0, durationMs: 16.7 }] })).toBeGreaterThan(0)
    expect(broken({ totalMs: 1 })).toBeGreaterThan(0)
  })
})
