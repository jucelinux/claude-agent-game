export type WastelandRect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly depth: number
}

export type WastelandFootprintRelation = 'object-in-front' | 'player-in-front' | 'overlap'

export type WastelandBuildingGeometry = WastelandRect & {
  readonly height: number
  readonly rows: number
  readonly columns: number
  readonly palette: 'concrete' | 'dark' | 'rust'
}

export type WastelandContainerGeometry = WastelandRect & {
  readonly palette: 'dark' | 'rust'
}

export type WastelandBridgeRailGeometry = WastelandRect & {
  readonly bridgeIndex: number
  readonly side: 'min-x' | 'max-x'
}

export const WASTELAND_MAP_BOUNDS = { width: 72, depth: 64 } as const
// Matches the traveler's widest planted pose instead of only its contact point.
export const WASTELAND_PLAYER_RADIUS = 0.42
export const WASTELAND_TILE_HALF_WIDTH = 9
export const WASTELAND_TILE_HALF_HEIGHT = 4.5
export const WASTELAND_PLAYER_SCREEN_SPEED = 28
export const WASTELAND_GROUND_RENDER_WINDOW = {
  radius: 42,
  minScreenX: -42,
  maxScreenX: 362,
  minScreenY: -12,
  maxScreenY: 214,
} as const

export const isWastelandGroundCenterVisible = (screenX: number, screenY: number): boolean =>
  screenX >= WASTELAND_GROUND_RENDER_WINDOW.minScreenX
  && screenX <= WASTELAND_GROUND_RENDER_WINDOW.maxScreenX
  && screenY >= WASTELAND_GROUND_RENDER_WINDOW.minScreenY
  && screenY <= WASTELAND_GROUND_RENDER_WINDOW.maxScreenY

export function wastelandScreenInputToWorldDelta(
  screenX: number,
  screenY: number,
  deltaSeconds: number,
): { readonly x: number; readonly y: number } {
  const length = Math.hypot(screenX, screenY)
  if (length === 0) return { x: 0, y: 0 }
  const normalizedX = screenX / length
  const normalizedY = screenY / length
  const screenDistance = WASTELAND_PLAYER_SCREEN_SPEED * deltaSeconds
  return {
    x: (
      normalizedX / (WASTELAND_TILE_HALF_WIDTH * 2)
      + normalizedY / (WASTELAND_TILE_HALF_HEIGHT * 2)
    ) * screenDistance,
    y: (
      -normalizedX / (WASTELAND_TILE_HALF_WIDTH * 2)
      + normalizedY / (WASTELAND_TILE_HALF_HEIGHT * 2)
    ) * screenDistance,
  }
}

export const WASTELAND_BUILDINGS: readonly WastelandBuildingGeometry[] = [
  { x: 6, y: 7, width: 6, depth: 4, height: 6.2, palette: 'dark', rows: 4, columns: 4 },
  { x: 20, y: 5, width: 4.5, depth: 5.5, height: 4.6, palette: 'concrete', rows: 3, columns: 3 },
  { x: 48, y: 7, width: 6.5, depth: 4, height: 5.4, palette: 'dark', rows: 4, columns: 5 },
  { x: 61, y: 13, width: 4.5, depth: 5.5, height: 7.2, palette: 'concrete', rows: 5, columns: 3 },
  { x: 5, y: 28, width: 5.5, depth: 5, height: 3.8, palette: 'concrete', rows: 2, columns: 4 },
  { x: 54, y: 30, width: 5.5, depth: 4.5, height: 4.5, palette: 'dark', rows: 3, columns: 4 },
  { x: 14, y: 52, width: 5, depth: 4, height: 4.2, palette: 'dark', rows: 3, columns: 3 },
  { x: 47, y: 53, width: 7, depth: 4.5, height: 5.6, palette: 'concrete', rows: 4, columns: 5 },
  { x: 62, y: 48, width: 4, depth: 4, height: 3.2, palette: 'rust', rows: 2, columns: 2 },
] as const

export const WASTELAND_CONTAINERS: readonly WastelandContainerGeometry[] = [
  { x: 15, y: 27, width: 2.7, depth: 1.25, palette: 'rust' },
  { x: 18.2, y: 28.1, width: 2.4, depth: 1.15, palette: 'dark' },
  { x: 45, y: 37.5, width: 2.8, depth: 1.25, palette: 'rust' },
  { x: 8, y: 39, width: 2.5, depth: 1.2, palette: 'dark' },
  { x: 61, y: 37, width: 3.1, depth: 1.3, palette: 'rust' },
  { x: 27, y: 56, width: 2.8, depth: 1.2, palette: 'rust' },
] as const

export const WASTELAND_OVERPASS_PILLARS: readonly WastelandRect[] = [
  { x: 5, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 12, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 20, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 37, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 47, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 58, y: 18.6, width: 0.55, depth: 0.55 },
  { x: 67, y: 18.6, width: 0.55, depth: 0.55 },
] as const

export const WASTELAND_BRIDGES: readonly WastelandRect[] = [
  { x: 16.5, y: 44.2, width: 4.5, depth: 5.1 },
  { x: 34.5, y: 44.2, width: 5, depth: 5.1 },
  { x: 55, y: 44.2, width: 4.5, depth: 5.1 },
] as const

export const WASTELAND_BRIDGE_RAIL_WIDTH = 0.2
export const WASTELAND_PAINTER_SLICE_DEPTH = 0.5

export const WASTELAND_BRIDGE_RAILS: readonly WastelandBridgeRailGeometry[] =
  WASTELAND_BRIDGES.flatMap((bridge, bridgeIndex) => [
    {
      x: bridge.x,
      y: bridge.y,
      width: WASTELAND_BRIDGE_RAIL_WIDTH,
      depth: bridge.depth,
      bridgeIndex,
      side: 'min-x' as const,
    },
    {
      x: bridge.x + bridge.width - WASTELAND_BRIDGE_RAIL_WIDTH,
      y: bridge.y,
      width: WASTELAND_BRIDGE_RAIL_WIDTH,
      depth: bridge.depth,
      bridgeIndex,
      side: 'max-x' as const,
    },
  ])

export function sliceWastelandRectForPainter(
  rect: WastelandRect,
  maxSliceDepth = WASTELAND_PAINTER_SLICE_DEPTH,
): readonly WastelandRect[] {
  if (!Number.isFinite(maxSliceDepth) || maxSliceDepth <= 0) {
    throw new Error('Painter slice depth must be a positive finite number')
  }
  const count = Math.max(1, Math.ceil(rect.depth / maxSliceDepth))
  const sliceDepth = rect.depth / count
  return Array.from({ length: count }, (_, index) => ({
    x: rect.x,
    y: rect.y + sliceDepth * index,
    width: rect.width,
    depth: sliceDepth,
  }))
}

export const WASTELAND_TOWER_BASE: WastelandRect = {
  x: 40,
  y: 25,
  width: 1.7,
  depth: 1.7,
}

const STATIC_SOLIDS: readonly WastelandRect[] = [
  ...WASTELAND_BUILDINGS,
  ...WASTELAND_CONTAINERS,
  ...WASTELAND_OVERPASS_PILLARS,
  ...WASTELAND_BRIDGE_RAILS,
  WASTELAND_TOWER_BASE,
  { x: 27, y: 18, width: 6.4, depth: 2.5 },
] as const

export const containsWastelandPoint = (
  rect: WastelandRect,
  x: number,
  y: number,
  margin: number,
): boolean => x + margin > rect.x
  && x - margin < rect.x + rect.width
  && y + margin > rect.y
  && y - margin < rect.y + rect.depth

export function getWastelandFootprintRelation(
  rect: WastelandRect,
  playerX: number,
  playerY: number,
): WastelandFootprintRelation {
  if (playerX >= rect.x + rect.width || playerY >= rect.y + rect.depth) {
    return 'player-in-front'
  }
  if (playerX <= rect.x || playerY <= rect.y) return 'object-in-front'
  return 'overlap'
}

const isBridgeAt = (x: number, y: number): boolean => WASTELAND_BRIDGES.some((bridge) =>
  // The walkable footprint includes the two bridgeheads. Eroding this rectangle
  // left a thin blocked strip exactly where the bridge met each canal bank.
  containsWastelandPoint(bridge, x, y, WASTELAND_PLAYER_RADIUS * 1.25),
)

export function isWastelandWalkable(x: number, y: number): boolean {
  if (
    x < 0.7
    || y < 0.7
    || x > WASTELAND_MAP_BOUNDS.width - 0.7
    || y > WASTELAND_MAP_BOUNDS.depth - 0.7
  ) return false

  if (
    y + WASTELAND_PLAYER_RADIUS > 44.45
    && y - WASTELAND_PLAYER_RADIUS < 49
    && !isBridgeAt(x, y)
  ) return false

  return !STATIC_SOLIDS.some((rect) =>
    containsWastelandPoint(rect, x, y, WASTELAND_PLAYER_RADIUS),
  )
}
