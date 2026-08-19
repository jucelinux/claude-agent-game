/**
 * **Micro game 5: the street.** His commission, 16/08 — *"vamos de skate"*, with the pixel art
 * pushed to the extreme of the challenge.
 *
 * ## Two capabilities under test, on two different objects, on purpose
 *
 * He asked for an experimental round, so this one carries two things instead of one. A miss on two
 * capabilities cannot normally be attributed, which is why they are on **separate objects**:
 *
 * | the capability | where it lives | how it fails visibly |
 * |---|---|---|
 * | **roll** — rotation out of the screen plane | the board | the deck does not turn over |
 * | **ordered dither** — the pixel-art quantiser | the sky and the road | the dusk reads as bands |
 *
 * So one word of *why* on a miss says which half missed, without a second reading.
 *
 * ## The pixel-art half came back with a measured NO on the rider, and that is the result
 *
 * The thesis was that the idiom lives in the quantiser: replace one `Math.floor` and every subject
 * on the shelf changes. **Half of it survived contact with the instrument.**
 *
 * A weave needs a patch of one surface for its lattice to sit on. Measured, as the share of painted
 * pixels inside a single-owner cell: the rider **0.000** at a 4×4 lattice and 0.289 at 2×2; the
 * skeleton 0.080; the kitten 0.068; a kerb 0.703. Switching both outlines off changed it not at all,
 * and doubling the body's scale moved it to 0.177 — **the cause is scale, not the drawn line.**
 *
 * Turned on at 0.6 on the rider it moved the mean tone region from 5.5 px to 4.7, below the noise
 * floor the 15/08 verdict is calibrated against, while periodicity stayed negative. That is the
 * definition of the speckle he retired: it destroyed the region structure and returned no order.
 * **So the rider ships at dither 0 and the backdrop ships at full amplitude.** At this scale the
 * pixel-art idiom for a body is tone placement; dither is for surfaces.
 *
 * ## What the street reuses, and what is new
 *
 * The runner engine is the crypt's, unchanged: a held rider, a world that moves, obstacles from a
 * hash, two jump impulses, a collision box read from each obstacle's own art. **What it gained is
 * an optional chaser** — a street has nothing running after you, so a collision ends the run
 * outright. That generality is harvested from a second game rather than designed for a first one.
 */
import type { Scene } from '../scene/types.ts'

/**
 * **Asphalt at dusk, and it is a ramp rather than four rows because the ramp is dithered.**
 *
 * Six stops from the horizon down: cool and pale where the low sun grazes it, dark and warm-shifted
 * in the near foreground. Painted flat this is six visible bands; woven through the lattice it is a
 * receding road. The road is the largest single surface in the picture and therefore the place the
 * weave has the most room of anything on the shelf.
 */
const ASPHALT: readonly [number, number, number][] = [
  [86, 84, 104],
  [70, 68, 88],
  [56, 54, 72],
  [44, 42, 58],
  [34, 32, 46],
  [26, 24, 36],
]

/**
 * **Dusk, from the horizon up: seven stops over a very wide range.**
 *
 * The 15/08 verdict selected a wide value range cut into regions. A dithered ramp is that verdict's
 * natural extension rather than a departure from it — the regions are still there, and what the
 * weave adds sits *below* one tone step, so the range is spent the same way and read finer.
 *
 * Warm and bright at the horizon where the sun has just gone, cooling and darkening upward into a
 * blue-violet. Orange to indigo across seven stops is the widest sky in the project.
 */
const DUSK: readonly [number, number, number][] = [
  [46, 42, 82],
  [66, 54, 96],
  [98, 70, 100],
  [140, 88, 96],
  [186, 112, 88],
  [222, 148, 96],
  [244, 190, 132],
]

export const skateScene: Scene = {
  name: 'skate',
  /**
   * **240×150 at ×4, the crypt's frame exactly.** A runner has to show three obstacles ahead or
   * every collision is unfair, and 960×600 on the page is the register his second reading on the
   * kitten asked for: a chunky pixel, not a smooth one.
   */
  w: 240,
  h: 150,
  frames: 8,
  msPerFrame: 70,
  scale: 4,
  ground: 116,
  nearRow: 150,
  haze: 0,
  sky: [46, 42, 82],
  groundRamp: ASPHALT,
  placements: [
    {
      grammar: 'skate-roll', tunables: 'skate', x: 54, depth: 0, anchor: 'foot',
      clips: {
        roll: { grammar: 'skate-roll', tunables: 'skate' },
        ollie: { grammar: 'skate-ollie', tunables: 'skate-ollie' },
        flip: { grammar: 'skate-flip', tunables: 'skate-flip' },
      },
      runs: { run: 'roll', leap: 'ollie', flip: 'flip' },
    },
  ],
  runner: {
    groundRow: 116,
    /**
     * **The contact shadow, and this is the game the finding was MADE on** — batch 4:
     * *"nenhum dos dois pilotos está apoiado no chão"*. It took until 18/08 to come back here,
     * which is the whole reason `SCARS.md` exists. Dusk-blue against warm asphalt, 13 px for a
     * board that is wider than a body.
     */
    contact: { rx: 13, alpha: 0.26, color: [24, 20, 38], fade: 44 },
    // Held a quarter into the screen, as the crypt: room to read three obstacles ahead, and the
    // board is 26 px long so it needs more clearance behind it than a runner does.
    holdX: 58,
    /**
     * **A street is faster than a graveyard and it accelerates harder.** 124 px/s against the
     * crypt's 108, gaining 3.0 a second against 2.6, capped at 196 against 175. A skater rolls; a
     * skeleton runs. Everything about the difficulty follows from this one ramp: the gap between
     * obstacles shrinks in *time* without shrinking in *space*, so the street never gets denser and
     * the player only gets less warning.
     */
    speed: 124,
    accel: 3,
    maxSpeed: 196,
    gravity: 430,
    /**
     * **Two impulses, and the three obstacle heights were set from them rather than the reverse.**
     *
     * 137 px/s against 430 px/s² gives an apex of **22 px** — enough for the kerb at 9 and the cone
     * at 18, and not enough for the rail at 30. The kickflip adds 150 from wherever he is, which
     * takes the apex to **48**.
     *
     * So a third of the street is unreachable without the second press. That is what separates a
     * differentiator from a decoration, and it is the same arithmetic the crypt used — including
     * the 150, which was 110 until his reading: *"a projeção do pulo duplo deveria garantir mais
     * altura, concorda?"*
     */
    jump: 137,
    flip: 150,
    /**
     * **48 px per pump cycle, and a pump is not a stride.**
     *
     * The crypt derives its stride from body height, because a sprinter covers about 1.2 of its own
     * height per stride. A skater's knees bend on a rhythm that has nothing to do with its legs, so
     * this is derived from the board instead: 48 px is not quite two deck lengths, which gives 2.6
     * pumps a second at the starting speed and 4.1 at the cap. The rule it obeys is the one that
     * matters — the animation advances with **distance**, so it can never disagree with the road.
     * A hand-picked divisor is what gave the skeleton 9.9 stride cycles a second at the cap.
     */
    strideLen: 48,
    stones: [
      { grammar: 'street-kerb', tunables: 'street' },
      { grammar: 'street-cone', tunables: 'street' },
      { grammar: 'street-kerb', tunables: 'street' },
      { grammar: 'street-rail', tunables: 'street' },
      { grammar: 'street-cone', tunables: 'street' },
    ],
    /**
     * **170 apart with 40 of jitter, and the arithmetic is the crypt's lesson applied rather than
     * rediscovered.**
     *
     * The jitter only ever adds, so the base spacing looks like a floor on every gap. It is not:
     * the gap between two obstacles is `spacing + jitter(k) - jitter(k-1)`, so the worst case is
     * `spacing - jitterX` = **130 px**. At the 196 px/s cap that arrives 0.66 s apart against a
     * jump that hangs for 0.64 — which clears, with nothing to spare. 170 rather than the crypt's
     * 160 because this world runs 12% faster.
     */
    leadIn: 240,
    spacing: 170,
    jitterX: 40,
    // The rider is 30 px wide with the board's nose, and 10 is the BODY rather than the deck: a
    // board tip that kills you is a board tip a player will hate. Same reasoning as the crypt's
    // shroud and the climb's leaf.
    bodyHalfW: 10,
    // The kerb is 22 px across and the rail 21 at its feet. 8 is the mass, not the lip.
    stoneHalfW: 8,
    // 36 px is the rider's own height, so the score counts his own body lengths.
    pxPerMetre: 36,
    /**
     * **No chaser, and the absence is the design.** The crypt's `menace` is a gap that closes, and
     * it is right for a graveyard. On a street the consequence is the street: hit a kerb at 196 px/s
     * and the run is over. One mechanism instead of two, which is the dinosaur's rule.
     */
    overText: 'you ate it at ',
    /**
     * **The weave, at full amplitude on a 4×4 lattice, and it is the only place in this game the
     * dither is switched on.**
     *
     * 1.0 spans a whole stop, so every row of sky between two stops is a real two-colour weave
     * rather than a nudge. The lattice is 4 here and 2 on the bodies, and the difference is measured
     * surface: a sky is 240×116 px of one surface, and a 36 px rider has none at all.
     */
    dither: { amount: 1, lattice: 4 },
    skyRamp: DUSK,
    seed: 71,
  },
}
