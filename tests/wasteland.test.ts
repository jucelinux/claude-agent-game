import { describe, expect, it } from 'vitest'
import {
  getWastelandFootprintRelation,
  isWastelandGroundCenterVisible,
  isWastelandWalkable,
  sliceWastelandRectForPainter,
  wastelandScreenInputToWorldDelta,
  WASTELAND_BRIDGE_RAILS,
  WASTELAND_BRIDGES,
  WASTELAND_GROUND_RENDER_WINDOW,
  WASTELAND_MAP_BOUNDS,
  WASTELAND_PAINTER_SLICE_DEPTH,
  WASTELAND_PLAYER_SCREEN_SPEED,
  WASTELAND_TILE_HALF_HEIGHT,
  WASTELAND_TILE_HALF_WIDTH,
} from '../src/game/wasteland/wastelandMap.ts'

describe('Ashfall traversal map', () => {
  it('provides a wide playable area around the starting plaza', () => {
    expect(WASTELAND_MAP_BOUNDS).toEqual({ width: 72, depth: 64 })
    expect(isWastelandWalkable(37, 38)).toBe(true)
    expect(isWastelandWalkable(30, 38)).toBe(true)
  })

  it('blocks map boundaries and building footprints', () => {
    expect(isWastelandWalkable(0, 30)).toBe(false)
    expect(isWastelandWalkable(73, 30)).toBe(false)
    expect(isWastelandWalkable(8, 9)).toBe(false)
  })

  it('keeps the full traveler silhouette outside buildings and containers', () => {
    expect(isWastelandWalkable(4.7, 30)).toBe(false)
    expect(isWastelandWalkable(4.5, 30)).toBe(true)
    expect(isWastelandWalkable(14.7, 27.5)).toBe(false)
  })

  it('allows canal crossings only on the three bridges', () => {
    expect(isWastelandWalkable(27, 46)).toBe(false)
    expect(isWastelandWalkable(18, 46)).toBe(true)
    expect(isWastelandWalkable(37, 46)).toBe(true)
    expect(isWastelandWalkable(57, 46)).toBe(true)
  })

  it('keeps both bridgeheads connected to the canal banks', () => {
    for (const y of [44.1, 44.2, 44.35, 49.1, 49.25, 49.4]) {
      expect(isWastelandWalkable(37, y)).toBe(true)
    }
    expect(isWastelandWalkable(33.8, 46)).toBe(false)
    expect(isWastelandWalkable(40.2, 46)).toBe(false)
  })

  it('keeps the traveler inside the bridge rails', () => {
    expect(isWastelandWalkable(34.55, 46)).toBe(false)
    expect(isWastelandWalkable(35.2, 46)).toBe(true)
    expect(isWastelandWalkable(38.8, 46)).toBe(true)
    expect(isWastelandWalkable(39.45, 46)).toBe(false)
  })

  it('keeps the terrain render window above every edge of the viewport', () => {
    expect(WASTELAND_GROUND_RENDER_WINDOW.radius).toBeGreaterThan(32)
    expect(isWastelandGroundCenterVisible(0, 0)).toBe(true)
    expect(isWastelandGroundCenterVisible(160, 0)).toBe(true)
    expect(isWastelandGroundCenterVisible(320, 0)).toBe(true)
    expect(isWastelandGroundCenterVisible(0, 180)).toBe(true)
    expect(isWastelandGroundCenterVisible(320, 180)).toBe(true)
  })

  it('moves at one screen-space speed in cardinal and diagonal directions', () => {
    for (const [screenX, screenY] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const) {
      const delta = wastelandScreenInputToWorldDelta(screenX, screenY, 1)
      const projectedX = (delta.x - delta.y) * WASTELAND_TILE_HALF_WIDTH
      const projectedY = (delta.x + delta.y) * WASTELAND_TILE_HALF_HEIGHT
      expect(Math.hypot(projectedX, projectedY)).toBeCloseTo(WASTELAND_PLAYER_SCREEN_SPEED)
    }
  })

  it('places large footprints behind the player on their south and east sides', () => {
    const building = { x: 5, y: 28, width: 5.5, depth: 5 }

    expect(getWastelandFootprintRelation(building, 7, 34)).toBe('player-in-front')
    expect(getWastelandFootprintRelation(building, 11, 30)).toBe('player-in-front')
    expect(getWastelandFootprintRelation(building, 4, 30)).toBe('object-in-front')
    expect(getWastelandFootprintRelation(building, 7, 27)).toBe('object-in-front')
  })

  it('splits a long bridge rail across both sides of the character depth', () => {
    const bridge = WASTELAND_BRIDGES[1]
    const farRail = WASTELAND_BRIDGE_RAILS.find((rail) =>
      rail.bridgeIndex === 1 && rail.side === 'min-x'
    )
    const nearRail = WASTELAND_BRIDGE_RAILS.find((rail) =>
      rail.bridgeIndex === 1 && rail.side === 'max-x'
    )
    expect(bridge).toBeDefined()
    expect(farRail).toBeDefined()
    expect(nearRail).toBeDefined()
    if (bridge === undefined || farRail === undefined || nearRail === undefined) return

    const playerX = bridge.x + bridge.width * 0.5
    const playerY = bridge.y + bridge.depth * 0.5
    const farRelations = sliceWastelandRectForPainter(farRail).map((slice) =>
      getWastelandFootprintRelation(slice, playerX, playerY)
    )
    const nearSlices = sliceWastelandRectForPainter(nearRail)
    const nearRelations = nearSlices.map((slice) =>
      getWastelandFootprintRelation(slice, playerX, playerY)
    )

    expect(nearSlices.every((slice) => slice.depth <= WASTELAND_PAINTER_SLICE_DEPTH)).toBe(true)
    expect(farRelations.every((relation) => relation === 'player-in-front')).toBe(true)
    expect(nearRelations).toContain('player-in-front')
    expect(nearRelations).toContain('object-in-front')
    expect(nearRelations).not.toContain('overlap')
  })
})
