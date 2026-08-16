/**
 * **Micro game 1: the forest.** His commission of 15/08.
 *
 * A dense wood of nine trees, none of them the same, with loaded clouds drifting over it
 * and rain falling through it. Every part of that sentence was a gap named the same
 * morning, and each is answered by a different mechanism:
 *
 * - **the trees** by `makeTree` — one grammar, nine arguments, no two alike
 * - **the clouds** by the `lobed` primitive built for foliage, paying twice
 * - **the rain** by a *field*, which is the first thing here that is not a body
 *
 * The trees stand on one line and are ordered back to front by their foot row, so the wood
 * has depth without needing any. Nothing is scaled to fake distance — he named that cost on
 * the first scene, and shrinking a subject does not scale its detail down, it never draws it.
 */
import type { Scene } from '../scene/compose.ts'

const CANOPY: readonly [number, number, number][] = [
  [26, 30, 26],
  [34, 40, 34],
  [44, 52, 44],
  [58, 68, 56],
]

export const forestScene: Scene = {
  name: 'forest',
  w: 288,
  h: 152,
  frames: 24,
  msPerFrame: 50,
  scale: 3,
  ground: 126,
  // Overcast, and darker than the mid grey every subject was tuned against — which the rain
  // and the loaded clouds both need in order to read as weather rather than as decoration.
  sky: [88, 96, 116],
  groundRamp: CANOPY,
  fields: [
    {
      kind: 'rain',
      // Two tones: a near drop and a far one. Rain with one tone is a scan line.
      colors: [
        [120, 132, 156],
        [168, 182, 206],
      ],
      spacing: 7,
      length: 5,
      slant: -0.35,
      // 3 whole passes per 1200 ms cycle: an integer, or the sheet jumps at the loop point.
      passes: 3,
      seed: 17,
    },
  ],
  placements: [
    // The sky. Drift wraps at the scene edge, so a cloud that sails off the right arrives
    // back on the left and the sky never empties.
    { grammar: 'cloud-c', tunables: 'sky', x: 60, y: 26, drift: 96 },
    { grammar: 'cloud-a', tunables: 'sky', x: 190, y: 18, drift: 72 },
    { grammar: 'cloud-b', tunables: 'sky', x: 268, y: 34, drift: 120 },

    // **The wood, and the placement no longer cancels the heights.** His reading of the
    // first pass: *"na forma como vejo todas elas estão no mesmo nível de altura"*. They
    // were — the tall trees had been put nearest, which lowered their tops back into line
    // with the short ones. Now height decides where a tree stands: the tallest go furthest
    // back and the shortest come forward, so the canopy line rises and falls.
    { grammar: 'tree-e', tunables: 'wood', x: 44, footY: 120 },
    { grammar: 'tree-b', tunables: 'wood', x: 152, footY: 120 },
    { grammar: 'tree-a', tunables: 'wood', x: 236, footY: 121 },

    { grammar: 'tree-i', tunables: 'wood', x: 96, footY: 127 },
    { grammar: 'tree-c', tunables: 'wood', x: 196, footY: 128 },
    { grammar: 'tree-f', tunables: 'wood', x: 268, footY: 127 },

    { grammar: 'tree-h', tunables: 'wood', x: 20, footY: 134 },
    { grammar: 'tree-d', tunables: 'wood', x: 128, footY: 141 },
    { grammar: 'tree-g', tunables: 'wood', x: 224, footY: 142 },

    // The gorilla, walking the floor of the wood. Placed for now; his hands take it next.
    { grammar: 'gorilla', tunables: 'gorilla', x: 118, footY: 138 },
  ],
}
