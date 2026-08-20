/** Pure collision and quarter-turn geometry. No canvas, clock or game state. */
export type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export type Point = { readonly x: number; readonly y: number }

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Clockwise quarter turns around a declared centre. */
export function turnPoint(x: number, y: number, turn: number, cx: number, cy: number): Point {
  var q = ((turn % 4) + 4) % 4
  var dx = x - cx, dy = y - cy
  if (q === 1) return { x: cx - dy, y: cy + dx }
  if (q === 2) return { x: cx - dx, y: cy - dy }
  if (q === 3) return { x: cx + dy, y: cy - dx }
  return { x: x, y: y }
}

/** A box stays axis-aligned after an exact quarter turn. */
export function turnBox(b: Box, turn: number, cx: number, cy: number): Box {
  var a = turnPoint(b.x, b.y, turn, cx, cy)
  var c = turnPoint(b.x + b.w, b.y + b.h, turn, cx, cy)
  return { x: Math.min(a.x, c.x), y: Math.min(a.y, c.y), w: Math.abs(c.x - a.x), h: Math.abs(c.y - a.y) }
}

/** Four solid bars derived from one navigable interior, in top/bottom/left/right order. */
export function boxWalls(b: Box, thickness: number): readonly Box[] {
  return [
    { x: b.x - thickness, y: b.y - thickness, w: b.w + thickness * 2, h: thickness },
    { x: b.x - thickness, y: b.y + b.h, w: b.w + thickness * 2, h: thickness },
    { x: b.x - thickness, y: b.y - thickness, w: thickness, h: b.h + thickness * 2 },
    { x: b.x + b.w, y: b.y - thickness, w: thickness, h: b.h + thickness * 2 },
  ]
}

export function boxTouchesCircle(b: Box, x: number, y: number, r: number): boolean {
  var px = Math.max(b.x, Math.min(x, b.x + b.w))
  var py = Math.max(b.y, Math.min(y, b.y + b.h))
  var dx = px - x, dy = py - y
  return dx * dx + dy * dy <= r * r
}
