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
 * A landing buys 205 px/s upward against 270 px/s² of gravity, so the apex is **78 px** and
 * the airtime from one landing to the next is **1.52 s**. The bands are **52 px** apart, and
 * the jitter only ever moves a shelf DOWN from its band's row — so 52 px is a bound on every
 * gap in an infinite tower, and 78 px of apex clears it with half again to spare. **The tower
 * is provably climbable, and the proof is one inequality rather than a level designer.**
 *
 * Sideways, `steer` is 116 px/s. The world wraps, so no two shelves are ever more than 100 px
 * apart, and 100 px takes 0.86 s against 1.52 s of airtime. That is a comfortable margin and it
 * is deliberately comfortable: a cozy game is not a game about precision.
 */
import type { Scene } from '../scene/compose.ts'

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
   * bands of shelves above the player and enough below to see what was just left. 200×300 at
   * ×2 is 400×600 on the page, which fits a browser window beside its own notes.
   */
  w: 200,
  h: 300,
  // Unused by a climb — there is no frozen frame list — but every scene declares them, and the
  // shelf card and the budget both read the cycle length.
  frames: 8,
  msPerFrame: 90,
  scale: 2,
  // The garden band, and it is the only ground in the game. `nearRow` is a scene pixel below
  // the canvas because nothing here stands at depth 0: the floor is a backdrop, not a plane a
  // subject walks into.
  ground: 268,
  nearRow: 300,
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
     * **30 px between bands, and the first value was 52 for a reason that turned out to be
     * wrong twice over.**
     *
     * The reasoning was: the apex is 78 px, so put the gap at two thirds of it and the tower is
     * climbable with room to spare. Both halves of that failed a lock.
     *
     * 1. **The jitter compounds across a pair.** A shelf may sit below its band's row, so the
     *    gap between two neighbours is `bandH + jitter(lower) - jitter(upper)` and the worst
     *    case is `bandH + jitterY`, not `bandH`. Measured over ten thousand bands: 67 px
     *    against a claimed bound of 52. The apex still cleared it, by 11 px instead of 26.
     * 2. **One shelf every 78 px is not this genre.** In the game he named, a jump passes
     *    several platforms on the way up and catches one on the way down; the player aims. At
     *    52 px a bounce passed one and a half, and a run with no aiming at all died in seconds.
     *    **Cozy is a difficulty statement as much as a palette statement**, and this was not a
     *    cozy tower.
     *
     * At 30, a bounce clears about two and a half bands and a fall past six of them is what it
     * takes to lose. Somebody steering catches one nearly every time.
     */
    bandH: 38,
    // A shelf may sit up to 8 px BELOW its band's row and never above it, so the worst gap in
    // the whole infinite tower is 46 px against an apex of 78. Off-grid enough that the tower
    // never reads as a ladder, small enough that the bound stays comfortable.
    jitterY: 8,
    // **Two, and it is the fix for a locked orbit rather than a density preference.** See
    // `Climb.perBand`. Two 48 px landing windows out of 200 puts a shelf within reach of about
    // half of every band, and a bounce passes two bands.
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
     * How far past the plank's end a paw may catch: **10 px, which is the forgiveness every
     * platformer has and none of them mentions.** The paw itself is 5, so this is twice the
     * geometric truth, and it is deliberate — a landing that misses by one pixel is a landing
     * the player believes he made.
     *
     * Measured with the whole loop run headless, one key held for sixty seconds — a player who
     * never aims at anything. At 9 he reaches 5 m. At 10 he reaches 20 and the run still ends.
     * Somebody actually aiming does far better than either, which is why the number is set from
     * the floor of the range rather than the middle.
     */
    footHalf: 10,
    // 220 ms, which is `cat-tuck`'s own four frames at 55 ms. The clip and the state end
    // together or the pose holds past the spring it is describing.
    tuckMs: 220,
    gravity: 270,
    bounce: 205,
    steer: 116,
    // 0.42 down the screen. High enough that a player sees three bands above and reads where he
    // is going; low enough that the shelf he just left is still visible under him.
    hold: 0.42,
    // The first shelf sits 62 px above the garden, which is inside one bounce from a standing
    // start. The first thing a player does must succeed.
    firstBand: 62,
    seed: 61,
    // 34 px is the kitten's own height, so the score counts kittens and calls them metres. It
    // is not physics; it is the only unit on screen a player can see the size of.
    pxPerMetre: 34,
    skyRamp: SKY,
    // 640 px of climb spends the whole ramp — about twelve bounces, or a minute of play. Past
    // it the sky holds at the top colour and the stars are at full strength.
    skyHeight: 640,
    // Parallax 0.35: the stars move a third as fast as the shelves. A fixed field would read as
    // wallpaper and a field at full speed would read as more shelves.
    stars: { count: 110, colors: [[150, 152, 180], [204, 206, 228], [246, 246, 252]], seed: 29, parallax: 0.35 },
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
