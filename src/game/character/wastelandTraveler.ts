export const WASTELAND_TRAVELER_DIRECTIONS = [
  'e',
  'se',
  's',
  'sw',
  'w',
  'nw',
  'n',
  'ne',
] as const

export type WastelandTravelerDirection = (typeof WASTELAND_TRAVELER_DIRECTIONS)[number]
