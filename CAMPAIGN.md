# Apollo 11 campaign contract

Status: approved product direction, 21 August 2026.

## Thesis

This game recreates the Apollo 11 expedition from launch to splashdown as a historical,
single-player procedural campaign. The player does not watch a summary of the mission: they
perform the work that made it possible, under the constraints and in the sequence that the crew
faced.

The canonical successful playthrough follows the flown mission of Saturn V AS-506, Command and
Service Module CSM-107 *Columbia*, and Lunar Module LM-5 *Eagle*. History supplies the situation;
the player supplies execution.

## Player role

The player represents the flight crew, not an invented fourth astronaut and not an omniscient
Mission Control operator. Control moves to the station whose real responsibility matters in the
current procedure:

- Neil Armstrong for command decisions and direct vehicle control.
- Buzz Aldrin for LM systems, guidance readouts, procedures and callouts.
- Michael Collins for CSM operations, navigation and rendezvous responsibilities.
- Mission Control remains external. It observes telemetry, communicates and grants or withholds
  mission decisions according to the historical operating relationship.

A perspective change must follow a real division of work. The game must not assign every action
to Armstrong merely to preserve a conventional single protagonist.

## Meaning of fidelity

Fidelity means authentic procedure, configuration, constraint and consequence. It does not mean
reproducing every switch solely because the switch existed.

The game preserves:

- The flown order of events and the Ground Elapsed Time (GET) of canonical milestones.
- Mission-correct spacecraft, garments, tools, displays, terminology and crew responsibilities.
- Physical constraints that shaped decisions: trajectory, attitude, velocity, fuel, electrical
  power, oxygen, communications, navigation and thermal state.
- The relationship between a control, the indication it changes and the consequence that follows.
- Historically observed problems and uncertainty. Challenges are not replaced with fictional
  malfunctions for variety.

The game may adapt control density, spatial scale or inactive duration when the adaptation makes
a real process legible. Every material adaptation must state both its historical source and its
gameplay purpose. Generated imagery may translate an approved reference into the pixel-art
language; it is never evidence for a historical claim.

## Campaign time

The campaign uses the historical GET as its authoritative clock. The target duration for the
main campaign is 8–12 hours.

- Critical burns, manual control, docking, landing, EVA operations and entry run at or near their
  meaningful real duration.
- Passive coast, sleep, waiting and repeated stable orbits may advance at an explicit accelerated
  rate after the spacecraft is in a safe configuration and required work is complete.
- Acceleration never skips an unresolved checklist item, active failure, decision window or
  communication that carries new information.
- The displayed GET advances continuously. Compression changes the rate of time, never the order
  or identity of the mission events.

A real-time eight-day mode is outside the current campaign scope. It may later use the same
mission data, but it must not complicate the campaign implementation now.

## Challenge and consequence

The canonical path is Apollo 11 as flown. Player error may create one of three outcomes:

1. **Recover** — use a historically supported correction or contingency and continue, with the
   resulting expenditure of time or resources.
2. **Abort** — preserve the crew when mission rules or vehicle state no longer permit the primary
   objective.
3. **Loss of mission** — unsafe control or an ignored condition makes recovery impossible.

The game does not quietly force a failed attempt back onto the historical track. A completed or
ended chapter produces a debrief comparing player actions, actual telemetry and the applicable
procedure.

## Campaign chapters

1. [Crew ingress, countdown and Saturn V launch](docs/campaign/01-launch-day.md).
2. Earth parking orbit and systems checkout.
3. Translunar injection, transposition, docking and LM extraction.
4. Translunar coast, navigation and spacecraft housekeeping.
5. Lunar orbit insertion and LM activation.
6. Eagle undocking, descent-orbit insertion and powered descent.
7. Landing, surface preparation and lunar EVA.
8. Lunar ascent, rendezvous and docking with Columbia.
9. Transearth injection and coast home.
10. Service-module separation, entry, parachutes and splashdown.

These chapters describe player order, not implementation order.

## First vertical slice

The first complete slice begins with CSM/LM undocking at approximately GET 100:12 and ends when
Armstrong first makes contact with the lunar surface at approximately GET 109:24:15.

It must contain:

- Eagle undocking, the inspection maneuver and separation from Columbia.
- Descent-orbit insertion and preparation for powered descent.
- Powered descent with PGNS/AGS information, landing radar, crew callouts, communications,
  program alarms, propellant state and the manual landing phase.
- The flown long landing and avoidance of unsafe terrain as the canonical solution.
- Touchdown, engine shutdown and immediate stay/no-stay and abort-readiness procedures.
- Cabin configuration for EVA, hatch opening, egress and ladder descent.
- Transition into the existing lunar-surface scene at the first step.

The slice changes station between the three crew members only where their real responsibilities
require it. Its initial asset set is the mission-correct Eagle interior and exterior, the relevant
Apollo suit configurations, the visible parts of Columbia, landing-site terrain and cockpit
indications needed by the procedures above.

## Historical evidence policy

Use sources in this order:

1. As-flown telemetry, event tables and the Apollo 11 Mission Report.
2. Final flight plan, checklists, operations handbooks and mission rules.
3. Air-to-ground and onboard transcripts, flight journal and lunar surface journal.
4. Technical crew debriefing and post-flight engineering analysis.
5. Mission photography, onboard film, television and spacecraft drawings.
6. Secondary sources only for discovery or for clearly attributed interpretation.

Planned and flown procedure are not interchangeable. If authoritative records disagree, record
the disagreement beside the implementation and choose explicitly. Do not manufacture false
precision. For example, official records place the first step within a span of several seconds;
the campaign uses 109:24:15 as its milestone while retaining the source note.

Primary source index:

- [Apollo 11 Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf)
- [Final Apollo 11 Flight Plan](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11fltpln_final_reformat.pdf)
- [Apollo by the Numbers](https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf)
- [Apollo 11 Lunar Surface Journal](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.html)
- [The First Lunar Landing](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.landing.html)
- [One Small Step](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.step.html)
- [Apollo 11 Technical Crew Debriefing](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tecdbrf.html)
- [Apollo Operations Handbook — Lunar Module](https://www.nasa.gov/wp-content/uploads/static/history/alsj/lm10handbookvol1.pdf)
- [Apollo 11 Lunar Surface Operations Plan](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11flsp.pdf)

## Implementation boundary

Phaser remains the game engine. Vehicle dynamics, cockpit interaction, campaign state and mission
procedures are game-specific code under `src/game/`; they must not become a repository-owned
general engine. The grammar renderer and deterministic compiler continue to own authored raster
assets and their portable metadata.

The mission timeline is game content, not a replacement game loop. Phaser owns time and scene
lifecycle; Apollo data determines what the current mission state means.

## Current mechanical prototype

The first implementation checkpoint starts at the P66 terminal-descent handover rather than at
PDI. It exists to validate the playable relationship between rate of descent, forward velocity,
propellant margin, terrain avoidance and touchdown. It is not yet a flight-dynamics reconstruction.

The following adaptations are explicit and provisional:

- The P66 initial altitude, velocities and burn margin are play-model values awaiting calibration
  against as-flown telemetry.
- Forward control compresses the consequence of Armstrong's pitch/attitude control into one axis;
  it is not a simulated translational hand controller.
- Crater, boulder-field and clear-ground coordinates are authored test bands, not surveyed
  coordinates for West Crater or the actual landing track.
- The displayed burn margin estimates remaining powered-flight time; it is not an LM propellant
  quantity display. The 60- and 30-second thresholds exercise the historical decision pressure.
- Landing limits are prototype safety gates and have not yet been derived from LM structural or
  mission-rule limits.
- The active 320 × 180 cockpit composition is the approved 16-bit art direction, not an approved
  LM-5 panel configuration. Historical configuration remains a separate evidence task.

The original vector blockout and its first top-down `Mesh2D` decomposition were rejected. The mesh
magnified terrain into perspective artifacts and an incomplete cockpit mask left an opaque strip at
the window base. A later high-detail plate sequence was also abandoned because separate generated
views could not guarantee one continuous terrain identity.

The active scene uses a deliberately reduced 16-bit visual language. The cockpit is a 48-color,
320 × 180 interpretation of the approved composition, enlarged exactly 3×. The exterior is one
authored 3D corridor rendered offline with Blender into a deterministic 16-color state grid. Phaser
selects nearby complete views from vehicle downrange and altitude, continuously reprojects them
inside a 10% overscan border and changes views through a binary 16-phase Bayer mask. The transition
never interpolates terrain colors. Phaser performs no 3D terrain rendering or independent terrain-
wave animation at runtime. Blender is an asset-authoring tool only; Phaser remains the sole game
engine.

The state grid contains 25 downrange samples and 16 altitude samples, concentrated over hazardous
terrain and below 80 feet. Its 2× visual downrange scale keeps crater and boulder-field transitions
legible within the compressed prototype descent; it does not alter model timing and must not be
interpreted as surveyed distance. The landing remains a playable game-specific prototype with live
objectives, condition gates, success, failure and reset.

`public/assets/landing/p66-visual-target.png` remains provenance for the approved window composition,
material hierarchy and lunar lighting only. It is not evidence for panel configuration, site geometry
or telemetry. Code-rendered readings and the mission card remain provisional legibility adaptations.
The six lower-panel annunciators (`CRTR`, `SITE`, `FWD`, `VERT`, `FUEL`, `CONT`) mirror the prototype
landing gates for quick player recognition; their labels and arrangement are not an LM-5 panel
reconstruction.

These adaptations are governed by the [Apollo 11 Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf),
the [LM Operations Handbook](https://www.nasa.gov/wp-content/uploads/static/history/alsj/lm10handbookvol1.pdf),
and the [First Lunar Landing transcript and commentary](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.landing.html).
