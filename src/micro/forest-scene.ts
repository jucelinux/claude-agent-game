/**
 * **Micro game 1: the forest.** His commission of 15/08, second pass.
 *
 * The first pass came back with four findings, and three of them were one defect wearing
 * three faces:
 *
 * | his words | what was actually wrong |
 * |---|---|
 * | *"as árvores estão disformes"* | a tree was a flat structure, so no argument could change its shape |
 * | *"a animação idêntica em todas"* | every tree ran the same keys at the same phase |
 * | *"árvores que nem estão posicionadas no solo"* | depth was faked by raising the far trees off the floor |
 * | *"diferentes formas e tamanhos"* | the consequence of the first one |
 *
 * **The floating trees and the identical crowns had the same root: a missing mechanism
 * standing in for itself.** Depth had no representation at this level, so position was made
 * to carry it and could not; topology had no representation in the grammar, so numbers were
 * made to carry it and could not. Both are now built rather than mimed — `recede` on a
 * placement, recursion in `makeTree` — and in both cases the fake is gone rather than
 * tuned.
 *
 * **The wood is three haze bands and every tree stands on the floor.** Far trees are tall
 * and thin and pulled halfway to the sky's colour; near trees are fat-trunked and full
 * strength. That is the arrangement of the reference he sent and it is also just what a
 * forest is: you see the trunks of what is close and the silhouette of what is not.
 *
 * **The third pass built the runtime the second one had named.** The cloud that jumped at
 * the loop point and the gorilla nobody could steer were one limitation — composition done
 * ahead of time — and `src/scene/layers.ts` is the answer to both. The page now receives
 * layers and an arrangement, and composes each animation frame from real elapsed time.
 * `frames` and `msPerFrame` below survive only for the frozen gallery path.
 */
import type { Scene } from '../scene/compose.ts'

const CANOPY: readonly [number, number, number][] = [
  [26, 30, 26],
  [34, 40, 34],
  [44, 52, 44],
  [58, 68, 56],
]

/**
 * Three bands, and the numbers are one decision each rather than six. `recede` is the haze
 * and `footY` is the row the band's floor sits on; they move together because they are two
 * halves of the same statement about distance.
 */
const FAR = { recede: 0.5, ground: 131 }
const MID = { recede: 0.26, ground: 145 }
const NEAR = { recede: 0, ground: 163 }

/**
 * **A tree places by `baseY`, never by `footY`, and that is the fix for the last tree he
 * found off the ground.** `footY` aligns the lowest painted pixel; a tree's lowest painted
 * pixel is a root or the outline ring, seven to thirteen pixels below the trunk base — so
 * five of these stood that far in the air while the check I had written reported none.
 * `baseY` aligns the trunk base itself, which needs no measurement and cannot drift.
 */

/**
 * **Every tree gets its own place in the gust.** The first pass gave all fourteen the same
 * phase, so the whole wood leaned and returned as one object — which is the loudest thing
 * in his reading and the cheapest of all of these to have got right.
 *
 * **Evenly spaced, then permuted, and the first attempt was neither.** The golden ratio is
 * the right spread when N is unknown, and it is the wrong one here: a tree's cycle is 16
 * frames, so phases closer together than 1/16 land on the *same frame* and two trees sway
 * identically anyway. Fourteen golden-ratio offsets put two trees 0.034 apart — inside one
 * frame. Even spacing at 1/14 clears the frame grid with room over.
 *
 * The stride of 5 is coprime with 14, so it is a permutation of the same fourteen slots and
 * costs nothing — but it puts neighbours in *space* far apart in the *gust*, which is where
 * a repeated motion would actually be seen.
 */
const phaseOf = (i: number): number => ((i * 5) % 14) / 14

export const forestScene: Scene = {
  name: 'forest',
  w: 320,
  h: 176,
  frames: 24,
  msPerFrame: 50,
  scale: 3,
  ground: 128,
  // Overcast, and darker than the mid grey every subject was tuned against — which the rain
  // and the loaded clouds both need in order to read as weather rather than as decoration.
  // It is also what the haze lerps toward, so this colour now sets the whole far band.
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
    // **The sky, and it is the first thing here that is not periodic.** Speed is scene pixels
    // per second, so a cloud simply keeps going and wraps a full sprite width off each edge —
    // there is no loop point left to be seamless at.
    //
    // The three cadences are deliberately not multiples of each other: 17, 23 and 29 seconds.
    // Clouds on the same period rise and fall together and the sky reads as one object with
    // three parts, which is the same mistake the wood made with its wind.
    { grammar: 'cloud-c', tunables: 'sky', x: 60, y: 24, motion: { speed: 5.5, swayX: 7, bobY: 3.5, period: 23, at: 0.0 } },
    { grammar: 'cloud-a', tunables: 'sky', x: 205, y: 14, motion: { speed: 3.2, swayX: 5, bobY: 2.5, period: 29, at: 0.37 } },
    { grammar: 'cloud-b', tunables: 'sky', x: 300, y: 34, motion: { speed: 8.0, swayX: 9, bobY: 4.5, period: 17, at: 0.68 } },

    // **Far: the tall thin ones.** Conifers and slim broadleaves, half dissolved into the
    // sky. They are the tallest trees in the wood and they are the furthest away, so the
    // canopy line rises behind the near trunks instead of running level with them — which is
    // the thing he could not see happening in the first pass.
    { grammar: 'tree-spruce', tunables: 'wood', x: 18, baseY: FAR.ground + 1, recede: FAR.recede, phase: phaseOf(0) },
    { grammar: 'tree-pine', tunables: 'wood', x: 88, baseY: FAR.ground - 1, recede: FAR.recede, phase: phaseOf(1) },
    { grammar: 'tree-tall', tunables: 'wood', x: 152, baseY: FAR.ground + 2, recede: FAR.recede, phase: phaseOf(2) },
    { grammar: 'tree-airy', tunables: 'wood', x: 222, baseY: FAR.ground, recede: FAR.recede, phase: phaseOf(3) },
    { grammar: 'tree-birch', tunables: 'wood', x: 292, baseY: FAR.ground + 3, recede: FAR.recede, phase: phaseOf(4) },

    // **Mid: the middle of the wood.** Where the crowns start to read as separate masses.
    { grammar: 'tree-crown', tunables: 'wood', x: 4, baseY: MID.ground - 2, recede: MID.recede, phase: phaseOf(5) },
    { grammar: 'tree-elm', tunables: 'wood', x: 70, baseY: MID.ground + 1, recede: MID.recede, phase: phaseOf(6) },
    { grammar: 'tree-snag', tunables: 'wood', x: 138, baseY: MID.ground - 1, recede: MID.recede, phase: phaseOf(7) },
    { grammar: 'tree-maple', tunables: 'wood', x: 208, baseY: MID.ground + 3, recede: MID.recede, phase: phaseOf(8) },
    { grammar: 'tree-sapling', tunables: 'wood', x: 268, baseY: MID.ground + 4, recede: MID.recede, phase: phaseOf(9) },

    // **Near: the trunks.** Full strength, standing lowest, and chosen for girth rather than
    // for height — the foreground of a forest is bark, not canopy.
    { grammar: 'tree-broad', tunables: 'wood', x: 34, baseY: NEAR.ground + 3, recede: NEAR.recede, phase: phaseOf(10) },
    { grammar: 'tree-oak', tunables: 'wood', x: 146, baseY: NEAR.ground - 2, recede: NEAR.recede, phase: phaseOf(11) },
    { grammar: 'tree-willow', tunables: 'wood', x: 258, baseY: NEAR.ground + 1, recede: NEAR.recede, phase: phaseOf(12) },
    { grammar: 'tree-bush', tunables: 'wood', x: 210, baseY: NEAR.ground + 8, recede: NEAR.recede, phase: phaseOf(13) },

    // **The gorilla, and he is his now.** Left and right only, which is what he asked for.
    //
    // He walks in front of the near trunks and behind the bush, because the paint order is
    // the one the scene already had — haze, then the row he stands on. No case was added for
    // the actor, which is the test of whether the depth rule was the right one.
    {
      grammar: 'gorilla', tunables: 'gorilla', x: 96, footY: NEAR.ground + 2,
      // 46 px/s. A stride is 8 frames at 90 ms, so he covers about 33 px per cycle — close to
      // his own body length, which is what stops a walk from looking like a skate.
      control: { speed: 46, minX: 14, maxX: 306, idleFrame: 0 },
    },
  ],
}
