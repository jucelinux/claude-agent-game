/** Two states of one mechanical sun. The silhouette is a cog; light is a material change. */
import type { Grammar, Palette, Part } from '../../core/types.ts'

const CELESTIAL: Palette = {
  name: 'orrery-sun',
  colors: [
    [0, 0, 0],
    [20, 31, 39], [29, 58, 64], [43, 88, 88], [70, 119, 106], [113, 151, 126],
    [53, 34, 16], [101, 66, 24], [154, 108, 38], [209, 163, 69], [243, 211, 125],
    [63, 58, 54], [112, 103, 92], [169, 155, 132], [223, 207, 169], [255, 243, 198],
    [6, 11, 20], [10, 20, 31], [17, 34, 45], [27, 51, 61], [42, 70, 76],
  ],
  ramps: [
    { material: 'verdigris', indices: [1, 2, 3, 4, 5] },
    { material: 'brass', indices: [6, 7, 8, 9, 10] },
    { material: 'light', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

const still = { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] } as const
const shell = (lit: boolean): readonly Part[] => [
  { weld: true, name: 'outerCog', bone: 'root', material: lit ? 'brass' : 'verdigris', shape: { kind: 'lobed', cx: 0, cy: 0, rx: 8.8, ry: 8.8, rz: 3.2, lobes: 12, depth: 0.18, phase: 0.13 } },
  { weld: true, name: 'innerFace', bone: 'root', material: lit ? 'light' : 'brass', z: -3.3, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5.8, ry: 5.8, rz: 1.3 } },
  { name: 'orbit', bone: 'root', material: lit ? 'brass' : 'verdigris', z: -4.8, marking: true, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 4.2, ry: 4.2, rz: 0.4 } },
  { name: 'axis', bone: 'root', material: lit ? 'light' : 'ink', z: -5.3, marking: true, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 1.4, ry: 1.4, rz: 0.3 } },
]

const of = (name: string, lit: boolean): Grammar => ({
  name, palette: CELESTIAL,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: shell(lit), gait: still,
})

export const orrerySunDormant = of('orrery-sun-dormant', false)
export const orrerySunLit = of('orrery-sun-lit', true)
export const ORRERY_SUNS: readonly Grammar[] = [orrerySunDormant, orrerySunLit]
