/**
 * **Micro game 3: the climb.** His commission, 16/08, delivered without back-and-forth.
 *
 * > *"Será um jogo de plataforma em que um gatinho pula de plataforma em plataforma. O mesmo
 * > conceito do doodle jump, só que com uma estética de Cozy Game."*
 *
 * And the sentence before it, which decided what this round is: *"não vou atacar o 3d agora
 * pois segundo sua própria recomendação precisamos atacar a consequência primeiro."* The
 * recommendation he is quoting is a line in `DECISIONS.md` from the same day — *the forest has
 * a mechanic and no consequence; it is the smallest work on the list with the largest return,
 * and it is what turns a reactive scene into a game.* He read it and picked it over the 3D
 * work. **So the thing being tested here is not the drawing. It is whether this engine can
 * hold a game that can be lost.**
 *
 * ## What the sentence needed that did not exist this morning
 *
 * | the ask | what it needed |
 * |---|---|
 * | *pula de plataforma em plataforma* | surfaces. Every floor until now was one contact row painted into the backdrop |
 * | *o mesmo conceito do doodle jump* | a camera that follows, a tower with no top, and a fall that ends the run |
 * | *estética de Cozy Game* | a warm palette that does **not** spend the value range, and a sky that is worth climbing toward |
 *
 * ## Cozy, and the trap in the word
 *
 * The 15/08 ink verdict is the binding one: 5 tones over a **wide value range** with a drawn
 * line beat both rivals, and the Stardew control — real regions inside a narrow flat range —
 * tied for last. "Cozy" pulls straight at the loser. Pastel, soft, low contrast is exactly the
 * sample he ranked bottom, and reaching for it would spend a verdict to satisfy an adjective.
 *
 * **So every warm decision here is a hue decision and none of them is a value decision.** The
 * cat's coat runs 36 to 205 in luminance. The wood runs 40 to 200. The ink is a dark brown
 * instead of a black. Nothing on screen is cool except the sky at the very top of the climb,
 * and that one is cool on purpose: it is the only thing telling a player how far he has come.
 *
 * ## The two numbers the whole game rests on
 *
 * `bounce` and `gravity`. Everything else is decoration.
 *
 * A landing buys 228 px/s upward against 270 px/s² of gravity, so the apex is **96 px** — just
 * under three cat-heights — and the airtime from one landing to the next is **1.69 s**. The
 * worst gap anywhere in the tower is `bandH + jitterY` = **58 px**, which is 0.60 of the apex.
 * **The tower is provably climbable and the proof is one inequality rather than a level
 * designer**, asserted over ten thousand bands in `tests/climb.test.ts`.
 *
 * ## His second reading, 16/08, and it moved four numbers
 *
 * > *"embora eu sinta que tenham muitas plataformas disponíveis, o que torna o jogo pouco
 * > desafiador, pois é difícil errar um salto assim"*
 *
 * Correct, and it is the visible consequence of a fix rather than a taste I got wrong. The
 * tower had been thickened to break a locked orbit — one shelf per band made the game periodic
 * — and the thickening was tuned against a **robot holding one key**, which is a player who
 * never aims. That instrument cannot feel "too easy": it only reports whether progress happens.
 *
 * So the reading is now taken twice, and the pair is the measurement:
 *
 * | | before his note | now |
 * |---|---|---|
 * | shelves on screen | 15.8 | **9.2** |
 * | landing window | 26% of the width | **22%** |
 * | a run that never aims | ~20 m | **6.1 m, then falls** |
 * | a run that steers at the nearest shelf | — | **67 m in a minute, still climbing** |
 *
 * **One number is not a difficulty reading; the ratio between two is.** A game where aiming
 * buys you eleven times the height is a game where the skill is doing something.
 *
 * ## And the pixels, which were never a drawing problem
 *
 * > *"tornar o gatinho mais pixelado. Ver os contornos de suas formas dá ao gato um aspecto
 * > mais mecânico, o que você já resolveu com o gorila"*
 *
 * Measured rather than guessed, and the drawing was identical to the gorilla's on every axis
 * that could have explained it: same five tones, same drawn line, same inner outline, and
 * **28% of the kitten's painted pixels are outline against the gorilla's 27%**.
 *
 * What differed was the scene. Every other hero on this shelf stands **132 px tall on screen
 * with 3×3 pixels**; the kitten stood **72 px with 2×2**. At half the size and two thirds the
 * pixel, the eye stops reading pixels and starts reading the smooth shaded round masses — which
 * is exactly "seeing the contours of its forms". The world is 200×240 at ×3 now, so the kitten
 * is 132 px tall with 3×3 pixels, like everything else he has approved.
 *
 * **The finding is about where to look, not about the cat:** a subject can be drawn correctly
 * and presented wrongly, and a complaint about how something is *drawn* is worth checking
 * against how it is *shown* before a single pixel is touched.
 */
import type { Scene } from '../scene/types.ts'

/**
 * **The garden floor the run starts on**, and it is the one piece of ground in the game.
 *
 * Warm earth under grass. It is on screen for the first hundred pixels of the climb and then
 * never again, which is the whole reason it is worth drawing: it is where you came from, and a
 * climb with nothing below it is a climb with no altitude.
 */
const EARTH: readonly [number, number, number][] = [
  [46, 40, 30],
  [74, 68, 44],
  [104, 106, 58],
  [138, 148, 82],
]

/**
 * **The sky, walked by altitude rather than by row.** Amber at the garden, rose above it,
 * then dusk blue, then the deep indigo of real height.
 *
 * It is the reward. There is no boss, no item and no ending in this genre — the only thing a
 * player gets for climbing is a different picture, so the picture has to change enough to be
 * worth the trip. 640 px is about twelve bounces, which is a minute of decent play.
 */
const SKY: readonly [number, number, number][] = [
  [252, 214, 158],
  [244, 172, 132],
  [214, 132, 130],
  [156, 108, 140],
  [92, 82, 128],
  [46, 48, 92],
  [20, 22, 52],
]

export const cozyScene: Scene = {
  name: 'cozy',
  /**
   * **Portrait, and it is the genre's shape.** A vertical climber needs to show the next two
   * bands of shelves above the player and enough below to see what was just left.
   *
   * 200×240 at **×3** is 600×720 on the page. It was 200×300 at ×2, and the height came down so
   * the pixel could go up without the page growing: his second reading was that the kitten did
   * not read as pixel art, and the cause was that this was the only game on the shelf rendering
   * at ×2. Every hero here is now ~132 px tall on screen with a 3 px pixel.
   */
  w: 200,
  h: 240,
  // Unused by a climb — there is no frozen frame list — but every scene declares them, and the
  // shelf card and the budget both read the cycle length.
  frames: 8,
  msPerFrame: 90,
  scale: 3,
  // The garden band, and it is the only ground in the game. `nearRow` is a scene pixel below
  // the canvas because nothing here stands at depth 0: the floor is a backdrop, not a plane a
  // subject walks into.
  ground: 212,
  nearRow: 240,
  // A garden at head height has almost no aerial perspective in it. The forest's haze was
  // about fifty metres of trees; there is nothing here to look through.
  haze: 0.04,
  // The bottom of the sky ramp. Anything that reads `Scene.sky` directly — the palette merge,
  // the layer haze — gets the colour the game actually starts in.
  sky: [252, 214, 158],
  groundRamp: EARTH,
  placements: [
    /**
     * **The kitten**, and it is the whole cast. Three clips over one body: rising, falling, and
     * the 220 ms tuck that fires the moment it touches a shelf.
     *
     * `depth: 0` puts its start row at `nearRow`, the front of the stage — but a climb reads
     * that row once, as the altitude everything else is measured from, and then the camera
     * takes over.
     */
    {
      grammar: 'cat-fall', tunables: 'cat', x: 100, depth: 0, anchor: 'foot',
      clips: {
        rise: { grammar: 'cat-rise', tunables: 'cat' },
        fall: { grammar: 'cat-fall', tunables: 'cat' },
        tuck: { grammar: 'cat-tuck', tunables: 'cat-tuck' },
      },
      climber: { rise: 'rise', fall: 'fall', tuck: 'tuck' },
    },
  ],
  climb: {
    /**
     * **52 px between bands, and this number has been wrong in both directions.**
     *
     * It opened at 52 on the reasoning that the apex was 78 and two thirds of it left room. Two
     * halves of that failed:
     *
     * 1. **The jitter compounds across a pair.** A shelf may sit below its band's row, which
     *    shortens the gap above it and lengthens the gap below it by the same amount, so the
     *    worst case is `bandH + jitterY` and not `bandH`. Claimed 52, measured 67.
     * 2. **The tower locked.** One shelf per band with a steady input is a periodic system, and
     *    a robot holding one key bounced between the garden and the first shelf for ever. So the
     *    tower was thickened — two shelves per band, 30 px apart — and the thickening was tuned
     *    against that robot.
     *
     * **His reading is what corrected the correction:** *"muitas plataformas... é difícil errar
     * um salto assim"*. A robot that never aims cannot report "too easy"; it can only report
     * whether progress happens at all, so it drove the number to the wrong end of its range.
     *
     * Back to 52, with a bigger bounce under it: 9.2 shelves on screen instead of 15.8, and a
     * run that never aims now reaches 6 m and falls where it used to reach 20.
     */
    bandH: 52,
    // A shelf may sit up to 6 px BELOW its band's row and never above it, so the worst gap in
    // the whole infinite tower is 58 px against an apex of 96 — a ratio of 0.60. Off-grid enough
    // that the tower never reads as a ladder, small enough that the bound stays comfortable.
    jitterY: 6,
    // **Two, and it is the fix for a locked orbit rather than a density preference.** See
    // `Climb.perBand`. Two 44 px landing windows out of 200 puts a shelf within reach of about
    // 44% of every band. Density is controlled by `bandH` instead, which is the knob that does
    // not put the orbit back.
    perBand: 2,
    // ±15 px around a shelf's constructed position. The two shelves of a band are 100 px apart
    // by construction, so this leaves them between 70 and 130 apart — never more than 78 px of
    // the 200 px world out of reach at any altitude, and never a visible lattice.
    spreadJitter: 30,
    perches: [
      { grammar: 'perch-plank', tunables: 'perch' },
      { grammar: 'perch-moss', tunables: 'perch' },
      { grammar: 'perch-plank', tunables: 'perch' },
      { grammar: 'perch-fern', tunables: 'perch' },
      { grammar: 'perch-cushion', tunables: 'perch' },
      { grammar: 'perch-moss', tunables: 'perch' },
    ],
    // The board is 32 px across in `perch.ts`, so half of it is 16. Declared rather than
    // measured off the sprite, because the fern hangs a leaf 5 px past the end of its board and
    // a leaf is not a floor.
    halfW: 16,
    /**
     * How far past the plank's end a paw may catch: **6 px, which is the forgiveness every
     * platformer has and none of them mentions.** The paw itself is 5, so this is barely past
     * the geometric truth — a landing that misses by a pixel is a landing the player believes he
     * made, and nothing more generous than that.
     *
     * It was 10, and 10 made the landing window 26% of the world. His reading: *"é difícil errar
     * um salto assim"*. At 6 the window is 44 px, 22% of the width, and the difference between
     * aiming and not aiming is a factor of eleven in height reached.
     */
    footHalf: 6,
    // 220 ms, which is `cat-tuck`'s own four frames at 55 ms. The clip and the state end
    // together or the pose holds past the spring it is describing.
    tuckMs: 220,
    gravity: 270,
    bounce: 228,
    steer: 116,
    // 0.42 down the screen. High enough that a player sees three bands above and reads where he
    // is going; low enough that the shelf he just left is still visible under him.
    hold: 0.42,
    // The first shelf sits 62 px above the garden, well inside the 96 px apex from a standing
    // start. The first thing a player does must succeed.
    firstBand: 62,
    seed: 61,
    // 34 px is the kitten's own height, so the score counts kittens and calls them metres. It
    // is not physics; it is the only unit on screen a player can see the size of.
    pxPerMetre: 34,
    skyRamp: SKY,
    // 640 px of climb spends the whole ramp — about seven bounces, and 2.7 screens. Past it the
    // sky holds at the top colour and the stars are at full strength.
    skyHeight: 640,
    // Parallax 0.35: the stars move a third as fast as the shelves. A fixed field would read as
    // wallpaper and a field at full speed would read as more shelves.
    stars: { count: 90, colors: [[150, 152, 180], [204, 206, 228], [246, 246, 252]], seed: 29, parallax: 0.35 },
    /**
     * **Motes, and they are the cozy signature.** Warm specks drifting up through the garden
     * air — pollen at the bottom of the climb and something closer to fireflies at the top.
     *
     * Three tones and no alpha: a mote's pulse is expressed as which tone it currently shows,
     * so the whole field costs three fill colours instead of forty. Same trade the rain made.
     */
    motes: { count: 38, colors: [[186, 152, 108], [232, 202, 140], [255, 244, 196]], seed: 17, speed: 7, period: 3.4, parallax: 0.72 },
  },
}
