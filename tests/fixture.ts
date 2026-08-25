import type { Grammar, Params } from '../src/core/types.ts'
import type { GrammarAssetSource } from '../src/compiler/types.ts'

const FIXTURE_GRAMMAR: Grammar = {
  name: 'compiler-fixture',
  palette: {
    name: 'fixture-palette',
    colors: [
      [0, 0, 0],
      [22, 28, 36],
      [132, 159, 178],
      [232, 240, 244],
    ],
    ramps: [{ material: 'ink', indices: [1, 2, 3] }],
  },
  skeleton: {
    bones: [{ name: 'root', parent: null, x: 0, y: 0, angle: 0 }],
  },
  parts: [
    { name: 'body', bone: 'root', material: 'ink', shape: { kind: 'rect', x: -3, y: -3, w: 6, h: 6 } },
  ],
  gait: {
    name: 'idle',
    phases: [{ name: 'hold', at: 0 }],
    tracks: [],
  },
}

const FIXTURE_PARAMS: Params = {
  canvas: { w: 16, h: 16, originX: 8, originY: 8 },
  tones: { perMaterial: 3 },
  frames: { walk: 1 },
  light: { x: -1, y: -1, z: -0.5, curve: 1.2 },
  fill: { x: 1, y: 0, z: -0.25, weight: 0 },
  outline: { enabled: false, material: 'ink', inner: false, rim: false },
  body: { scale: 1 },
  gait: { swing: 0, lift: 0, depth: 0, roll: 0 },
  texture: { speckle: 0, dither: 0, lattice: 0, facet: 0 },
  shadow: { steps: 0, bias: 0, strength: 0 },
  playback: { msPerFrame: 100, scale: 1 },
  _anchors: {},
}

export const COMPILER_FIXTURE: GrammarAssetSource = {
  id: 'compiler-fixture',
  kind: 'environment',
  grammar: FIXTURE_GRAMMAR,
  params: FIXTURE_PARAMS,
}
