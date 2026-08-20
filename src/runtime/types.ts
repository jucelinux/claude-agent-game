/**
 * **What the runtime is handed, and what it shares.**
 *
 * The browser half of this project used to live inside a template literal, where the payload
 * was a shape nobody had written down: `S.arena.horizonRow` was a hope, and a scene field that
 * never reached the JSON once shipped through 522 green locks and died only in a browser. These
 * types are that hope made checkable. They are deliberately the SAME types the stage builder
 * uses — imported, not restated — because two declarations of one shape is how the two halves
 * of a program start disagreeing.
 *
 * The one difference is `Layer`: on this side the pixels arrive base64'd and the field is named
 * for what it means here (`foot`, `n`, `ms`) rather than for what it meant to the renderer.
 */
import type { Placed as StagePlaced, Stage, StageArena, StageClimb, StageDescent, StagePlatformer, StageRunner } from '../scene/layers.ts'
import type { ActionBindings } from '../scene/types.ts'
import type { RGB } from '../core/types.ts'
import type { Cam, Climber, Duel, Keeps, Observation, Player, Rides, Runs, RuntimeState } from '../observation/types.ts'

export type { RGB }
export type { StageArena, StageClimb, StageDescent, StagePlatformer, StageRunner }
export type { Cam, Climber, Duel, KeeperState, Keeps, Machine, Observation, Player, Rides, Runs, Shot } from '../observation/types.ts'

/** One sprite sheet as the page receives it: a vertical strip of frames, indices base64'd. */
export type Layer = {
  readonly w: number
  readonly h: number
  readonly ox: number
  readonly oy: number
  /** Rows from the origin down to the lowest painted pixel — `footOff` on the other side. */
  readonly foot: number
  readonly n: number
  readonly ms: number
  readonly palette: readonly RGB[]
  readonly indices: string
}

/**
 * **A placement as the payload carries it, and it is the STAGE's, not the scene's.**
 *
 * The difference matters and was invisible: a scene's `clips` names two grammars, and a stage's
 * `clips` names two LAYER INDICES, one per facing. The runtime reads `.left` and `.right` off
 * them — which only the stage's version has. Declaring the wrong one produced eight errors
 * pointing straight at the confusion.
 */
export type Placed = StagePlaced

/** The whole payload. Every field here is written by `payloadOf` in `app.ts` and by nothing else. */
export type Payload = {
  readonly w: number
  readonly h: number
  readonly scale: number
  readonly ground: number
  readonly sky: RGB
  readonly groundRamp: readonly RGB[]
  readonly floor: readonly RGB[]
  readonly stars?: { readonly count: number; readonly seed: number; readonly below: number; readonly colors: readonly RGB[] }
  readonly dust?: { readonly count: number; readonly seed: number; readonly colors: readonly RGB[] }
  readonly rain: Stage['rain']
  /**
   * **The STAGE's shapes, not the scene's, and the difference was invisible until now.**
   * `payloadOf` sends `stage.climb`, which is the scene's declaration with every grammar
   * reference already resolved to a layer index — a different type with a different field set.
   * The runtime read `S.climb.startRow` for months against a type that has no `startRow`,
   * because nothing was checking. `null` rather than absent: that is what the payload carries.
   */
  readonly climb: StageClimb | null
  readonly runner: StageRunner | null
  readonly descent: StageDescent | null
  readonly arena: StageArena | null
  readonly platformer: StagePlatformer | null
  readonly actions: ActionBindings
  readonly interactive: boolean
  readonly meter: boolean
  readonly layers: readonly Layer[]
  readonly placed: readonly Placed[]
  readonly order: readonly number[]
}

/**
 * **The latched key state.** `primaryTap` and `secondaryTap` are edges the loop consumes; the
 * corresponding names without `Tap` are levels. Physical keys are translated once in `mount`,
 * so a shape asks for a verb and never needs to know whether that verb was Space, X or Z.
 */
export type Keys = {
  left?: boolean
  right?: boolean
  up?: boolean
  down?: boolean
  primary?: boolean
  primaryTap?: boolean
  secondary?: boolean
  secondaryTap?: boolean
  restartTap?: boolean
  muteTap?: boolean
}

/** A 2D context, as much of one as this runtime ever touches. */
export type Ctx2D = CanvasRenderingContext2D
export type Canvas = HTMLCanvasElement

/**
 * **What every game shape is handed.** Read-only for all of it: the canvases, the decoded
 * sheets, the payload, the key state, and the two things that are genuinely shared — the list
 * of slots drawn this frame, which the harness reads, and the rain, which three shapes draw.
 *
 * **What is NOT here is the point.** No `K`, no `R`, no `DS`, no `AR`, no `CAM`. Each shape owns
 * its own state now, inside its own module scope, which is why `var side` in the arena can no
 * longer be the same variable as `var side` anywhere else.
 */
export type Shared = {
  readonly S: Payload
  readonly ox: Ctx2D
  readonly bg: Canvas
  readonly sheets: readonly Canvas[]
  readonly keys: Keys
  readonly drawn: number[]
  readonly cv: (w: number, h: number) => Canvas
  readonly rain: (t: number) => void
}

/**
 * **A game shape, and there are six.** `step` advances the simulation, `draw` paints one
 * frame, `score` writes the meter. `active` is false when this shape's actor is not in the
 * scene, and it is how `mount` chooses a path without asking about payload fields.
 */
export type Shape = {
  readonly active: boolean
  readonly step: (t: number, dt: number) => void
  readonly draw: (t: number) => void
  readonly score: (now: number) => void
  readonly state: () => RuntimeState
  readonly observe: () => Observation
}

/**
 * **What each game shape remembers, and it is startlingly little.**
 *
 * These were `var K = null` inside a two-thousand-line closure — invisible to the compiler,
 * which is why `K.state` was a string nobody had enumerated and `AR.pillars` was a field that
 * existed because somebody remembered to add it. Writing them down cost an afternoon and turned
 * 361 implicit-`any` errors into checked code.
 *
 * Every one is deliberately flat and mutable: a game loop mutates, and pretending otherwise
 * would put a copy in the hot path for a purity nothing here needs.
 */

/** One photographer: where he is, what he is doing, and when he does the next thing. */
export type Crew = {
  at: number; p: Placed; a: NonNullable<Placed['approach']>
  x: number; face: number; state: string; clock: number; next: number; shot: number
  /** When the shutter last fired, in seconds. Absent until he has taken a photograph. */
  flash?: number
}

/** What a shape that is not in this scene returns. The dispatcher never steps it. */
export const inactive = (): Shape => ({
  active: false,
  step: () => {},
  draw: () => {},
  score: () => {},
  state: () => null,
  observe: () => ({ kind: 'inactive', state: null }),
})

/**
 * **The two functions the arena hands out, and the reason they exist at all.**
 *
 * The framing lock has to drive the SHIPPED projection. The lock that came before it
 * re-implemented one inside the test file and asserted against its own copy — which is exactly
 * why it never noticed that the runtime read a heading in turns as if it were radians.
 */
export type ArenaEye = {
  readonly cam: () => Cam
  readonly project: (x: number, y: number, z: number) => { x: number; y: number; k: number; fwd: number } | null
  readonly scaleOf: (k: number, ladder: readonly number[], cur?: number) => number
}

/**
 * **One thing the arena is about to stamp, before the painter has sorted them.**
 *
 * A machine, a column and a shot are three different things with one job — to be drawn at a
 * depth — so the sort works over the union rather than over three lists that would have to be
 * merged and could disagree about order.
 */
export type Drawable =
  | {
      readonly kind: 'shot'
      fwd: number; x: number; y: number; k: number
    }
  | {
      readonly kind: 'mech' | 'pillar'
      fwd: number; x: number; y: number; k: number
      li: number; L: Layer; frame: number; hurt: number
      /** Radius of the contact shadow on the floor, in world units. */
      disc: number
    }

/** As much of a keyboard event as this runtime reads. */
export type KeyEvent = {
  readonly key: string
  readonly preventDefault: () => void
  /** The browser's own clock, the same one `requestAnimationFrame` is handed. */
  readonly timeStamp?: number
}
