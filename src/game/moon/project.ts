export const MOON_WORLD = {
  width: 960,
  height: 540,
  horizon: 204,
  playable: { x: 38, y: 270, w: 884, h: 230 },
} as const

export type LunarPlacement = {
  readonly asset: string
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly rotation?: number
}

export const LUNAR_PLACEMENTS: readonly LunarPlacement[] = [
  // Integer scales preserve one authored pixel as one, two or three screen pixels.
  { asset: 'crater-d', x: 96, y: 226, scale: 1 },
  { asset: 'crater-b', x: 300, y: 242, scale: 1 },
  { asset: 'crater-d', x: 564, y: 232, scale: 1 },
  { asset: 'crater-b', x: 858, y: 250, scale: 1 },
  { asset: 'crater-a', x: 142, y: 304, scale: 1 },
  { asset: 'crater-e', x: 752, y: 294, scale: 1 },
  { asset: 'crater-f', x: 328, y: 404, scale: 2 },
  { asset: 'crater-c', x: 718, y: 382, scale: 2 },
  { asset: 'crater-a', x: 86, y: 474, scale: 2 },
  { asset: 'crater-e', x: 908, y: 492, scale: 2 },
  { asset: 'crater-b', x: 510, y: 508, scale: 2 },
  { asset: 'rock-a', x: 186, y: 424, scale: 2, rotation: -0.08 },
  { asset: 'rock-c', x: 812, y: 332, scale: 1, rotation: 0.12 },
  { asset: 'rock-b', x: 582, y: 286, scale: 1 },
]
