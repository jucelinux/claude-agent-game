/**
 * **The arena's furniture — run 21.** Two shapes, and both exist for the same reason: a camera
 * that orbits needs things to orbit PAST, or the turn has nothing to be measured against. An
 * empty plane with a grid tells you the camera moved; a pillar sliding between you and the
 * enemy tells you where you are.
 *
 * Authored as plates, like the machine, so the facet quantiser has flat faces to work with.
 */
import type { Grammar, Palette } from '../../core/types.ts'

const CONCRETE: Palette = {
  name: 'hangar-block',
  colors: [
    [0, 0, 0],
    // slab — poured concrete under a hard lamp, cool and desaturated.
    [30, 33, 42], [58, 63, 78], [88, 95, 112], [124, 132, 152], [168, 176, 196],
    // stripe — the hazard band. One warm accent per structure, as on the machine.
    [72, 48, 12], [120, 82, 18], [168, 118, 26], [206, 156, 44], [236, 198, 96],
    // ink — the machine's own line, so one hand drew the hangar.
    [8, 9, 14], [14, 16, 24], [22, 25, 36], [32, 36, 50], [44, 50, 68],
  ],
  ramps: [
    { material: 'slab', indices: [1, 2, 3, 4, 5] },
    { material: 'stripe', indices: [6, 7, 8, 9, 10] },
    { material: 'ink', indices: [11, 12, 13, 14, 15] },
  ],
}

const STILL = { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] } as const

/**
 * A pillar: a chamfered concrete block with a hazard band. Square in plan, so it looks the same
 * from every heading — which is the honest way to put furniture in a world whose camera turns
 * without paying for a yaw band set on every prop.
 */
export const hangarPillar: Grammar = {
  name: 'hangar-pillar',
  palette: CONCRETE,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'shaft', bone: 'root', material: 'slab', shape: { kind: 'rect', x: -5, y: -20, w: 10, h: 20, d: 10 } },
    { weld: true, name: 'cap', bone: 'root', material: 'slab', shape: { kind: 'rect', x: -6.4, y: -23.2, w: 12.8, h: 3.2, d: 12.8 } },
    { weld: true, name: 'base', bone: 'root', material: 'slab', shape: { kind: 'rect', x: -6.8, y: -2.6, w: 13.6, h: 2.6, d: 13.6 } },
    // The hazard band is a marking: paint on concrete, nothing added to the silhouette.
    { name: 'band', bone: 'root', material: 'stripe', z: -6.2, shape: { kind: 'rect', x: -5, y: -15, w: 10, h: 3, d: 1 }, marking: true },
  ],
  gait: STILL,
}
