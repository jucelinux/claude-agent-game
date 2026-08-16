/**
 * **Micro game 1: the forest.** His commission of 15/08, fourth pass.
 *
 * His reading of the third: the diversity is *"notável"*, and one thing is still wrong that
 * he could not name — *"tem algumas árvores que estão no plano de trás do gorila e a base da
 * árvore está abaixo do gorila"*. He was right, it was two defects at once, and both were in
 * the engine rather than in this file.
 *
 * **1. A tree painted ten pixels below where it said it stood.** The trunk's base capsule
 * ended two pixels below the origin with a radius of eight, and a capsule has a round cap —
 * so the paint carried on another eight. Placing a tree by its origin therefore placed it by
 * a row nothing visible was on, and the whole wood's depth ordering is decided by that row.
 *
 * **2. Distance was stated twice, by two fields that could disagree.** `recede` carried the
 * haze and `baseY` carried the row, with nothing tying them together. So a tree could be
 * hazier than the gorilla — further away — and stand lower than him — nearer. That is a
 * picture contradicting itself, and no amount of tuning either field fixes it.
 *
 * **The correction is that `depth` is now the only statement of distance.** The row, the
 * haze and the paint order are all derived from it. The contradiction is not checked for; it
 * is no longer expressible.
 *
 * **And the floor became a plane.** It was one flat band below one line, which is why none of
 * this was legible: nothing told the eye that a lower row was nearer. It now recedes by the
 * same haze its trees carry — one rule for the floor and for the things standing on it.
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
/**
 * **Four planes, and the gaps between them are the measurement that matters.**
 *
 * A subject paints a few pixels below its contact row — a root, an outline ring, the round
 * cap of a capsule — and the worst of those overhangs in this wood is 5 px. So two planes
 * closer together than 5 px produce a picture the eye cannot order, which is exactly the
 * defect he found. **The rule: the distance between two planes must exceed the overhang of
 * anything standing on them.** These are 15 to 18 px apart, three times over.
 *
 * The gorilla walks between the middle and the front, so near trunks pass in front of him
 * and the middle of the wood stays behind. That is a placement, not a special case.
 */
/**
 * **Six planes, and every tree is on one of the five behind the player.**
 *
 * His instruction of 16/08: *"mova todas as árvores para o plano de fundo do gorila. No
 * primeiro plano o jogador precisará de visibilidade de todo o plano frontal."* It is a game
 * design decision rather than a picture one and it outranks the picture: the front sixteen
 * rows are where the mechanic happens, and a trunk standing in them is a trunk hiding a
 * photographer. The wood loses its foreground framing and the player gains a stage.
 *
 * **The gaps are the measurement that matters.** A subject paints a few pixels below its
 * contact row — a root, an outline ring, the round cap of a capsule — and the worst of those
 * overhangs is 5 px. Two planes closer together than that produce a picture the eye cannot
 * order, which was his fourth finding. These are 8 px apart, and 12 between the last tree and
 * the player, and a lock checks every pair.
 */
const T1 = 0.962  // row 128
const T2 = 0.808  // row 136
const T3 = 0.654  // row 144
const T4 = 0.5    // row 152
const T5 = 0.346  // row 160
const ACTOR = 0.115 // row 172

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
  h: 188,
  frames: 24,
  msPerFrame: 50,
  scale: 3,
  // The floor: depth 1 stands on row 126, depth 0 on row 174. Everything between recedes.
  ground: 126,
  nearRow: 178,
  // 0.55 at the horizon. Measured against the same thing the sky was: below 0.4 the far band
  // still reads as full-strength trees standing oddly high, and above 0.7 the conifers stop
  // holding a silhouette at all.
  haze: 0.55,
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
    { grammar: 'cloud-c', tunables: 'sky', x: 60, y: 24, sky: true, motion: { speed: 5.5, swayX: 7, bobY: 3.5, period: 23, at: 0.0 } },
    { grammar: 'cloud-a', tunables: 'sky', x: 205, y: 14, sky: true, motion: { speed: 3.2, swayX: 5, bobY: 2.5, period: 29, at: 0.37 } },
    { grammar: 'cloud-b', tunables: 'sky', x: 300, y: 34, sky: true, motion: { speed: 8.0, swayX: 9, bobY: 4.5, period: 17, at: 0.68 } },

    // **The back of the wood: the tall thin ones.** Conifers and slim broadleaves, half dissolved into the
    // sky. They are the tallest trees in the wood and they are the furthest away, so the
    // canopy line rises behind the near trunks instead of running level with them — which is
    // the thing he could not see happening in the first pass.
    { grammar: 'tree-spruce', tunables: 'wood', x: 18, depth: T1, phase: phaseOf(0) },
    { grammar: 'tree-pine', tunables: 'wood', x: 88, depth: T2, phase: phaseOf(1) },
    { grammar: 'tree-tall', tunables: 'wood', x: 152, depth: T1, phase: phaseOf(2) },
    { grammar: 'tree-airy', tunables: 'wood', x: 222, depth: T2, phase: phaseOf(3) },
    { grammar: 'tree-birch', tunables: 'wood', x: 292, depth: T1, phase: phaseOf(4) },

    // **The middle of the wood.** Where the crowns start to read as separate masses.
    { grammar: 'tree-crown', tunables: 'wood', x: 4, depth: T3, phase: phaseOf(5) },
    { grammar: 'tree-elm', tunables: 'wood', x: 70, depth: T4, phase: phaseOf(6) },
    { grammar: 'tree-snag', tunables: 'wood', x: 138, depth: T3, phase: phaseOf(7) },
    { grammar: 'tree-maple', tunables: 'wood', x: 208, depth: T4, phase: phaseOf(8) },
    { grammar: 'tree-sapling', tunables: 'wood', x: 268, depth: T3, phase: phaseOf(9) },

    // **The last rank of trees, and it is still behind the player.** These were the
    // foreground until 16/08; they are the closest thing the wood is now allowed to be.
    { grammar: 'tree-broad', tunables: 'wood', x: 34, depth: T5, phase: phaseOf(10) },
    { grammar: 'tree-oak', tunables: 'wood', x: 146, depth: T5, phase: phaseOf(11) },
    { grammar: 'tree-willow', tunables: 'wood', x: 258, depth: T5, phase: phaseOf(12) },
    { grammar: 'tree-bush', tunables: 'wood', x: 210, depth: T5, phase: phaseOf(13) },

    // **The photographers**, and they enter from opposite edges on periods that do not divide
    // each other — 11 and 17 seconds — so the player is never given a rhythm to memorise.
    //
    // They are drawn BEFORE the gorilla and on his own plane: same distance, so which of them
    // overlaps is arbitrary, and putting the player last means the character a person is
    // steering is never hidden behind anything.
    {
      grammar: 'photog-walk', tunables: 'photog', x: 0, depth: ACTOR, anchor: 'foot',
      clips: {
        walk: { grammar: 'photog-walk', tunables: 'photog' },
        prone: { grammar: 'photog-prone', tunables: 'photog' },
        run: { grammar: 'photog-run', tunables: 'photog' },
      },
      approach: {
        walk: 'walk', prone: 'prone', flee: 'run', from: 'left',
        // 34 px/s walking against the gorilla's 46: he can always be reached. 92 fleeing,
        // which is twice the gorilla — being struck is the only thing that makes him quick.
        walkSpeed: 34, fleeSpeed: 92,
        // 46 px is just outside the gorilla's 40 px reach, so the player has to step in.
        standoff: 46,
        delay: 2.5, period: 11, shutter: 2.4,
      },
    },
    {
      grammar: 'photog-walk', tunables: 'photog', x: 0, depth: ACTOR, anchor: 'foot',
      clips: {
        walk: { grammar: 'photog-walk', tunables: 'photog' },
        prone: { grammar: 'photog-prone', tunables: 'photog' },
        run: { grammar: 'photog-run', tunables: 'photog' },
      },
      approach: {
        walk: 'walk', prone: 'prone', flee: 'run', from: 'right',
        walkSpeed: 34, fleeSpeed: 92, standoff: 46,
        delay: 7, period: 17, shutter: 2.4,
      },
    },

    // **The gorilla: three clips and a state, and the state is the game.**
    //
    // `idle` was his ask of 16/08 and it is not a nicety — a released key used to hold frame
    // 0 of the walk, and a held frame reads as a crash rather than as standing still.
    {
      grammar: 'gorilla-idle', tunables: 'gorilla-idle', x: 160, depth: ACTOR, anchor: 'foot',
      clips: {
        idle: { grammar: 'gorilla-idle', tunables: 'gorilla-idle' },
        walk: { grammar: 'gorilla', tunables: 'gorilla' },
        hit: { grammar: 'gorilla-attack', tunables: 'gorilla-attack' },
      },
      player: {
        // 46 px/s. A stride is 8 frames at 75 ms, so he covers about 28 px per cycle — close
        // to his own body length, which is what stops a walk from looking like a skate.
        speed: 46, minX: 16, maxX: 304,
        idle: 'idle', walk: 'walk', attack: 'hit',
        // 40 px is the fist at full extension plus a little. Reach is a promise: anything the
        // player can see the arm touch has to be a thing the arm hits.
        reach: 40,
        // 0.55 through the clip. Run 7 authored the attack with anticipation longer than
        // impact, so the blow lands past the middle — a hit registered on frame 0 registers
        // before the arm has moved and reads as a miss that worked.
        hitAt: 0.55,
      },
    },
  ],
}
