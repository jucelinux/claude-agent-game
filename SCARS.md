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
pieces; it must not stand in for splitting them. For the current single-actor prototype, the
behind/actor/foreground composition is sufficient once the pieces are correct; do not build a
generic rendering engine in place of Phaser.
