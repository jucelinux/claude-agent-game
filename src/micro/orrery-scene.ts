/**
 * THESIS: a compact mechanical planetarium whose whole architecture is the player's verb.
 * OWN-WORLD: aged brass, oxidised teal, ultramarine void, bone-white starlight, one vermilion core.
 * STORY: wake three mechanical suns, complete their circuit, and return to the service hatch.
 * FIRST VIEWPORT: a square chamber centred in a wide instrument panel; three suns form a clear
 * triangle around a lethal core, while the keeper begins at the hatch below it.
 * FORM: approved radial one-screen composition; no seed image—the brief was explicit and the
 * user delegated composition. Circles carry motion, thick boxes carry collision, negative space
 * around the core preserves the route. At 320×180 and integer ×4, every relevant edge is exact.
 */
import type { Scene } from '../scene/types.ts'

export const orreryScene: Scene = {
  name: 'orrery',
  w: 320,
  h: 180,
  frames: 8,
  msPerFrame: 90,
  scale: 4,
  ground: 179,
  nearRow: 179,
  haze: 0,
  sky: [5, 10, 20],
  groundRamp: [[5, 10, 20]],
  placements: [
    {
      grammar: 'keeper-idle',
      tunables: 'keeper',
      x: 160,
      y: 166,
      sky: true,
      anchor: 'foot',
      clips: {
        idle: { grammar: 'keeper-idle', tunables: 'keeper' },
        run: { grammar: 'keeper-run', tunables: 'keeper' },
        rise: { grammar: 'keeper-rise', tunables: 'keeper' },
        fall: { grammar: 'keeper-fall', tunables: 'keeper' },
        brace: { grammar: 'keeper-brace', tunables: 'keeper' },
      },
      keeper: { idle: 'idle', run: 'run', rise: 'rise', fall: 'fall', brace: 'brace' },
    },
  ],
  platformer: {
    startX: 160,
    startY: 166,
    bodyHalfW: 5,
    bodyH: 38,
    speed: 74,
    accel: 520,
    friction: 680,
    gravity: 320,
    // 32.9 px at the apex: enough to clear the room's tallest 30 px quarter-turned obstacle,
    // with less than three pixels of margin. The height is derived from v²/2g.
    jump: 145,
    coyoteMs: 92,
    bufferMs: 108,
    strideLen: 31,
    rotateMs: 420,
    // Inner faces of the four border bars. The keeper is contained here after a quarter turn,
    // because rotating only the foot point can otherwise place an upright body inside a wall.
    bounds: { x: 84, y: 14, w: 152, h: 152 },
    wall: 8,
    /**
     * Four border bars make a sealed 160×160 playfield. The remaining boxes are paired around
     * the core so each quarter turn yields a readable new floor without changing topology.
     */
    solids: [
      { x: 212, y: 136, w: 14, h: 7 },
      { x: 90, y: 108, w: 20, h: 7 },
      { x: 210, y: 101, w: 20, h: 7 },
      { x: 145, y: 48, w: 30, h: 7 },
      { x: 106, y: 76, w: 22, h: 7 },
      { x: 192, y: 70, w: 22, h: 7 },
    ],
    core: { x: 160, y: 90, r: 12 },
    suns: [
      { x: 160, y: 29, r: 10 },
      { x: 101, y: 91, r: 10 },
      { x: 219, y: 91, r: 10 },
    ],
    hatch: { x: 146, y: 146, w: 28, h: 20 },
    sun: {
      dormant: { grammar: 'orrery-sun-dormant', tunables: 'orrery' },
      lit: { grammar: 'orrery-sun-lit', tunables: 'orrery' },
    },
    rings: [
      { r: 25, speed: 0.075, spokes: 3 },
      { r: 39, speed: -0.047, spokes: 4 },
      { r: 55, speed: 0.023, spokes: 6 },
    ],
    colors: {
      void: [5, 10, 20],
      chamber: [12, 24, 42],
      chamberHi: [28, 48, 55],
      ink: [6, 13, 24],
      brass: [144, 101, 39],
      brassHi: [232, 195, 104],
      teal: [48, 104, 102],
      tealDark: [18, 51, 65],
      bone: [250, 236, 198],
      vermilion: [203, 60, 38],
    },
    seed: 3119,
  },
}
