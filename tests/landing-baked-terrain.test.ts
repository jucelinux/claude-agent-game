import { describe, expect, it } from 'vitest'
import { P66_TERMINAL_START_STATE, stepLanding } from '../src/game/landing/model.ts'
import {
  P66_TERRAIN_ALTITUDE_FT,
  P66_TERRAIN_ATLAS_COUNT,
  P66_TERRAIN_ATLAS_KEYS,
  P66_TERRAIN_DITHER_STEPS,
  P66_TERRAIN_DEFERRED_ATLAS_KEYS,
  P66_TERRAIN_DOWNRANGE_FT,
  P66_TERRAIN_FRAME_COUNT,
  P66_TERRAIN_TRANSITION_MS,
  P66_TERRAIN_STARTUP_ATLAS_COUNT,
  P66_TERRAIN_STARTUP_ATLAS_KEYS,
  getP66TerrainDitherStep,
  getP66TerrainFrame,
  getP66TerrainPose,
  isP66TerrainDitherPixelVisible,
} from '../src/game/landing/bakedTerrain.ts'

describe('P66 pre-rendered terrain state grid', () => {
  it('selects the exact starting and touchdown corners', () => {
    expect(getP66TerrainFrame(900, 200)).toMatchObject({
      absoluteFrame: 0,
      atlasIndex: 0,
      atlasFrame: 0,
    })
    expect(getP66TerrainFrame(2_200, 0)).toMatchObject({
      absoluteFrame: 399,
      atlasIndex: 24,
      atlasFrame: 15,
    })
  })

  it('clamps out-of-grid flight state to authored edge frames', () => {
    expect(getP66TerrainFrame(-100, 900).absoluteFrame).toBe(0)
    expect(getP66TerrainFrame(9_000, -200).absoluteFrame).toBe(399)
  })

  it('maps every state cell to one unique atlas frame', () => {
    const frames = new Set<number>()
    for (const downrange of P66_TERRAIN_DOWNRANGE_FT) {
      for (const altitude of P66_TERRAIN_ALTITUDE_FT) {
        const frame = getP66TerrainFrame(downrange, altitude)
        frames.add(frame.absoluteFrame)
        expect(frame.textureKey).toBe(P66_TERRAIN_ATLAS_KEYS[frame.atlasIndex])
        expect(frame.atlasFrame).toBeGreaterThanOrEqual(0)
        expect(frame.atlasFrame).toBeLessThan(16)
      }
    }
    expect(frames.size).toBe(P66_TERRAIN_FRAME_COUNT)
    expect(P66_TERRAIN_ATLAS_KEYS).toHaveLength(P66_TERRAIN_ATLAS_COUNT)
  })

  it('blocks only on a safe opening runway of terrain atlases', () => {
    expect(P66_TERRAIN_STARTUP_ATLAS_COUNT).toBe(4)
    expect(P66_TERRAIN_STARTUP_ATLAS_KEYS).toEqual(P66_TERRAIN_ATLAS_KEYS.slice(0, 4))
    expect(P66_TERRAIN_DEFERRED_ATLAS_KEYS).toEqual(P66_TERRAIN_ATLAS_KEYS.slice(4))
    for (const downrangeFt of [900, 925, 950, 975]) {
      expect(P66_TERRAIN_STARTUP_ATLAS_KEYS).toContain(
        getP66TerrainFrame(downrangeFt, 0).textureKey,
      )
    }
    expect(P66_TERRAIN_STARTUP_ATLAS_KEYS).not.toContain(
      getP66TerrainFrame(1_000, 0).textureKey,
    )
  })

  it('uses nearest discrete pixels instead of interpolating colors', () => {
    expect(getP66TerrainFrame(912, 188).absoluteFrame).toBe(getP66TerrainFrame(900, 200).absoluteFrame)
    expect(getP66TerrainFrame(913, 187).absoluteFrame).toBe(getP66TerrainFrame(925, 175).absoluteFrame)
  })

  it('moves an overscanned plate in quantized pixel-art steps between authored states', () => {
    const frame = getP66TerrainFrame(900, 200)
    expect(getP66TerrainPose(frame, 900, 200)).toEqual({ x: 480, y: 270, scale: 3 })
    const advanced = getP66TerrainPose(frame, 912, 188)
    expect(advanced.y).not.toBe(270)
    expect(advanced.scale).toBeGreaterThan(3)
    expect(Number.isInteger(advanced.y)).toBe(true)
    expect(advanced.scale * 64).toBe(Math.round(advanced.scale * 64))
  })

  it('uses exactly sixteen palette-safe dissolve phases', () => {
    expect(getP66TerrainDitherStep(0)).toBe(0)
    expect(getP66TerrainDitherStep(P66_TERRAIN_TRANSITION_MS / 2)).toBe(8)
    expect(getP66TerrainDitherStep(P66_TERRAIN_TRANSITION_MS)).toBe(P66_TERRAIN_DITHER_STEPS)
    expect(getP66TerrainDitherStep(Number.POSITIVE_INFINITY)).toBe(P66_TERRAIN_DITHER_STEPS)
    for (let step = 0; step <= P66_TERRAIN_DITHER_STEPS; step += 1) {
      let visible = 0
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 4; x += 1) {
          if (isP66TerrainDitherPixelVisible(x, y, step)) visible += 1
        }
      }
      expect(visible).toBe(step)
    }
  })

  it('keeps the reference descent visually responsive between baked frames', () => {
    let state = P66_TERMINAL_START_STATE
    let lastPresentation = ''
    let staticFrames = 0
    let longestStaticRun = 0
    let visualStates = 0

    for (let simulationFrame = 0; simulationFrame < 6_000 && state.status === 'flying'; simulationFrame += 1) {
      const frame = getP66TerrainFrame(state.forwardPositionFt, state.altitudeFt)
      const pose = getP66TerrainPose(frame, state.forwardPositionFt, state.altitudeFt)
      const presentation = `${frame.absoluteFrame}:${pose.y}:${pose.scale}`
      if (presentation === lastPresentation) {
        staticFrames += 1
      } else {
        longestStaticRun = Math.max(longestStaticRun, staticFrames)
        staticFrames = 1
        visualStates += 1
        lastPresentation = presentation
      }
      const forwardCommand = state.forwardPositionFt >= 1_280 && state.forwardSpeedFps > 4 ? -1 : 0
      state = stepLanding(state, { rateCommand: 0, forwardCommand }, 1 / 60)
    }

    longestStaticRun = Math.max(longestStaticRun, staticFrames)
    expect(state.status).toBe('landed')
    expect(visualStates).toBeGreaterThan(500)
    expect(longestStaticRun).toBeLessThanOrEqual(30)
  })
})
