# Persistent branch learnings

This is the branch's durable learning memory. It records lessons that should change how later
work is approached, not a history of every implementation detail.

Each entry needs evidence, a generalized lesson and an obligation. Prose preserves the memory;
the obligation is what keeps the next implementation from rediscovering it.

## Operating gate: scan solved territory first

Before designing a material solution from scratch for a known problem class:

1. Name the problem and the constraints that matter in this project.
2. Survey established options: engine facilities, standard techniques, reference
   implementations, reusable tools, or properly licensed assets and datasets.
3. Compare the viable options on quality, project fit, license and provenance, deterministic
   or offline boundaries, integration cost and long-term maintenance.
4. Prefer adapting a proven option when it satisfies the constraints more reliably than a
   bespoke implementation.
5. Build from scratch only when the problem is part of the game's actual differentiation or
   when the established options fail a concrete constraint. Record that reason near the work.

This gate applies to consequential systems such as character animation, pathfinding, physics,
camera behaviour, asset pipelines and content tooling. It does not require research for small,
repo-local edits, and it never authorizes an unapproved dependency, asset, license, product
change or authoring-workflow change. The repository boundaries in `CLAUDE.md` and `AGENTS.md`
still apply.

## Scar 01 — biomechanical motion should start from motion data

**Evidence.** The Ashfall traveller's hand-authored isometric walk required repeated visual
corrections to arms, knees, leg phase and rear-facing views, but the gait continued to read as
mechanical. Retargeting an established human mocap walk through Blender produced the accepted
result while preserving the low-poly character, eight-direction atlas, deterministic asset
compiler and Phaser runtime boundary.

**Lesson.** Human locomotion is a solved biomechanical problem and a poor place to spend the
prototype's novelty budget. The distinctive work is the character, camera, rendering and game
feel; a credible base gait can come from proven motion data.

**Obligation.** For future humanoid movement, first evaluate a rigged or retargetable motion
source with a compatible license. Customize timing, exaggeration, silhouettes and render style
after the biomechanical base works. Author joint motion from zero only when the desired movement
is intentionally non-human or existing sources cannot satisfy a documented constraint.

## Scar 02 — isometric depth is an ordering of footprints, not one `x + y` number

**Evidence.** Ashfall already used a parallel 2:1 dimetric projection and sorted static objects
around the traveller's foot contact. The bridge still cut across the traveller because both long
rails were submitted as one object with the depth of their farthest corner. Once that number
passed the traveller's depth, the entire rail moved to the foreground, including the portion
that was physically behind him.

**Lesson.** The familiar `x + y` key is sufficient for a tile or a point-like actor; an extended
object occupies a depth interval. In an isometric scene, projected angle, painter order and
collision footprint are one spatial contract. Walkable assemblies need separate floors and
occluders, and an occluder that spans the actor's depth must be split into independently
sortable pieces. The actor is ordered by its ground-contact point, never by the centre of its
sprite or its transparent bounds.

**Obligation.** Isometric content must declare a world footprint. Draw floors below actors,
sort compact solids against the actor's foot contact, and depth-slice long structures wherever
an actor can pass through their depth interval. Use the same footprint for collision and
visibility, with a stable tie-break at shared boundaries. A scalar depth may order the resulting
pieces; it must not stand in for splitting them. In a deliberately 2D isometric renderer, the
behind/actor/foreground composition is sufficient once the pieces are correct; do not build a
generic rendering engine in place of the selected runtime engine.

## Scar 03 — real 3D requires a real 3D renderer

**Evidence.** An earlier chamber study used genuine 3D coordinates, a perspective divide,
near-plane clipping and painter-sorted faces, but ultimately rasterized every face through a 2D
graphics API. It was effective for one constrained room and also produced recurring failures
around occlusion, transparent walls and camera-dependent face order. The next open, sunlit
environment would additionally require a depth buffer, terrain, normals, lights, shadows,
materials and a model pipeline.

**Lesson.** A software projection can be a useful visual probe, but it stops being economical
when the requested experience depends on the canonical facilities of a 3D renderer. At that
point, adding more projection code is not iteration on the game; it is accidental engine work.

**Obligation.** Runtime 3D uses Babylon.js meshes, cameras, materials, lights and GPU depth.
Blender content enters through GLB/glTF. Deliberate 2D scenes may use Babylon sprites, GUI or
dynamic textures, but no scene may reimplement a general projection, visibility or lighting
pipeline. The engine-neutral compiler remains independent from Babylon.

## Scar 04 — movement direction is a screen-space contract

**Evidence.** Einstein's first camera-relative movement implementation computed its lateral
basis with the cross-product operands reversed. World coordinates and animation remained
internally consistent, yet A moved right and D moved left from the player's view. Correcting the
basis and asserting the resulting world-coordinate signs in a browser test closed the defect.

**Lesson.** A mathematically plausible camera basis is not enough to establish the player's
left and right. Handedness, view direction and the runtime's camera convention meet at the
screen, which is where the control contract must be evaluated.

**Obligation.** Camera-relative controls must derive their basis from Babylon camera state and
include a rendered or browser-level test that independently exercises left and right. Validate
the observed screen direction after camera changes; do not infer correctness only from non-zero
movement or a unit-vector calculation.

## Scar 05 — visible motion needs rendered-frame tests

**Evidence.** The LCD mecha and animated Einstein could both satisfy state and position tests
while still risking invisible, cropped or visually discontinuous frames. Playwright canvas
sampling caught the presentation boundary by checking character pixels during starts, reversals,
jumps and input transitions. The same harness verified lighting and action effects in Babylon.

**Lesson.** Simulation tests prove state transitions; they do not prove that the player can see
the result. Animation, camera framing, alpha, asset loading and render timing form a separate
contract that only exists in rendered output.

**Obligation.** Every approved playable prototype needs at least one browser-level smoke test
that loads its Babylon scene without page errors and samples or captures the canvas. Motion-heavy
features must exercise their risky transitions frame-by-frame. Keep deterministic logic in fast
unit tests and reserve Playwright for the visible contract.
