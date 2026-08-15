/**
 * Run 12 — **loaded clouds.** The second half of his weather, and the cheapest part of it.
 *
 * A cloud needed no new mechanism at all. It is a **lobed blob with octaves** — the
 * primitive built for foliage in run 9, pointed at the other thing in nature whose form is
 * a ragged boundary rather than a body. That is the first time a primitive here has paid
 * twice, and it is the argument for the vocabulary being small and general instead of
 * large and specific.
 *
 * "Carregada" is a value decision, not a shape one: a storm cloud is dark underneath and
 * bright only along its top edge, so the ramp runs from a deep blue-grey to near white and
 * the light rakes from above. The `shift` on the lower lobes is the cheat that keeps the
 * belly heavy when the lambert term alone would not.
 */
import type { Grammar, Palette, Part } from '../../core/types.ts'

export const STORM: Palette = {
  name: 'storm',
  colors: [
    [0, 0, 0],
    [46, 50, 64],
    [70, 76, 94],
    [104, 111, 132],
    [148, 156, 176],
    [206, 212, 226],
  ],
  ramps: [{ material: 'vapour', indices: [1, 2, 3, 4, 5] }],
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * `mass` sets how many lobes make the body and `weight` how dark the belly runs. A cloud
 * has no skeleton beyond one bone: it does not articulate, it only drifts, and drifting is
 * the scene's job rather than the grammar's.
 */
export function makeCloud(name: string, mass: number, spread: number, weight: number, seed: number): Grammar {
  const parts: Part[] = []
  for (let i = 0; i < mass; i++) {
    const a = i * GOLDEN + seed
    const cx = (i - (mass - 1) / 2) * spread * 0.62
    const cy = Math.sin(a) * spread * 0.16
    const s = 0.7 + 0.45 * (((i * 5) % 4) / 4)
    parts.push({
      name: `lobe${i}`,
      bone: 'sky',
      material: 'vapour',
      z: -i * 0.6,
      // The belly is pushed down its own ramp: a loaded cloud is dark underneath in a way
      // the light alone will not deliver, because the lamp is above it.
      shift: cy > 0 ? -weight : 0,
      shape: {
        kind: 'lobed',
        cx,
        cy,
        rx: spread * 0.58 * s,
        ry: spread * 0.34 * s,
        rz: spread * 0.4,
        lobes: 5,
        depth: 0.26,
        phase: a,
        octaves: 3,
      },
    })
  }
  return {
    name,
    palette: STORM,
    skeleton: { bones: [{ name: 'sky', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
    parts,
    // A cloud does not articulate. It breathes, barely, so a still sky is not a photograph.
    gait: {
      name: 'drift',
      phases: [
        { name: 'a', at: 0 },
        { name: 'b', at: 0.5 },
      ],
      tracks: [{ bone: 'sky', channel: 'scaleX', keys: [0.012, -0.012] }],
    },
  }
}

export const CLOUDS: readonly Grammar[] = [
  makeCloud('cloud-a', 5, 15, 2, 0.0),
  makeCloud('cloud-b', 4, 12, 1, 2.1),
  makeCloud('cloud-c', 6, 17, 2, 4.2),
]
