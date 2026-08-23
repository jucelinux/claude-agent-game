# Chapter 1 — Launch day

Status: approved implementation contract, 22 August 2026.

The product, interaction and visual decisions in this document were explicitly accepted before
implementation began.

## Chapter promise

The player enters *Columbia* with the Apollo 11 crew, resolves the small configuration problem
that occurred during ingress, prepares the spacecraft for boost, lives through the terminal count
at real speed and verifies that the Saturn V is safely in flight.

The chapter starts with Armstrong entering the Command Module at 06:54 EDT on 16 July 1969 and
ends when the vehicle clears the launch tower, roughly 12 seconds after liftoff. NASA records
Armstrong in the left couch, Collins entering five minutes later for the right couch and Aldrin
entering last for the center couch. The final countdown was trouble-free, and liftoff occurred at
09:32 EDT from Pad 39A. [NASA, “The Journey to the Moon
Begins”](https://www.nasa.gov/history/50-years-ago-the-journey-to-the-moon-begins/)

This is not yet the complete ascent. Roll, staging and Earth-orbit insertion belong to the next
increment of Chapter 1. Ending at tower clear gives the first implementation one complete dramatic
arc and one unambiguous handoff: Launch Control managed the countdown and Houston assumed flight
control after the rocket cleared the tower. [NASA, “The Journey to the Moon
Begins”](https://www.nasa.gov/history/50-years-ago-the-journey-to-the-moon-begins/)

## Player objective

> **Prepare Columbia for launch. Verify guidance, safety and communications. At ignition, confirm
> that the Saturn V has entered flight and remain ready to abort through tower clear.**

The objective is always expressed in three layers:

1. **Mission objective** — prepare *Columbia* for launch.
2. **Current procedure** — the named checklist block now in work.
3. **Acceptance condition** — the indication or call that proves the procedure is complete.

The game never asks the player to infer a goal from an unexplained panel. The physical checklist
is part of the scene; a compact builder/game overlay may explain a term on first encounter, but it
must not replace the spacecraft indication that proves the action.

## Evidence notation

- **FLOWN** — an as-flown event, observation or artifact.
- **PLAN** — the procedure or countdown state prepared before flight.
- **ADAPTATION** — a proposed game treatment. It is not a historical claim.
- **OPEN** — evidence or ownership still required before implementation.

The prelaunch schedule is necessarily a mixture of plan and record: GET does not yet exist, and
the surviving onboard and air-to-ground transcripts begin at or after liftoff. Planned countdown
events below come from the Apollo 11 press kit and prelaunch mission report; as-flown behavior comes
from the Mission Report, technical transcripts and crew debriefing.

## Historical spine

| Time | Class | Historical event | Game treatment |
| --- | --- | --- | --- |
| 04:15 EDT | FLOWN | Crew wake-up; breakfast, suiting and transport follow. | A short, non-interactive prologue establishes date, place, crew and the campaign objective. No invented dialogue. |
| 06:54 EDT | FLOWN | Armstrong enters first and takes the left couch. Collins follows five minutes later for the right couch; Aldrin enters last for the center couch. | The player meets each real station in ingress order. This is orientation, not free-roaming exploration. |
| During final ingress/countdown preparation | FLOWN | The number 2 rotation hand controller caught a shock-attenuator release. Collins and backup CMP Fred Haise coordinated the recovery and the release was re-locked. | First procedural incident: identify the unsafe state, request the correct assistance and verify the re-lock. Exact manipulation remains non-interactive until stronger evidence describes it. |
| T−01:55:00 | PLAN | Houston/spacecraft command checks. | Guided communications check; introduces read-back and positive confirmation. |
| T−01:50:00 to T−01:46:00 | PLAN | Abort advisory and Emergency Detection System checks. | The player learns what will be monitored during boost. This is a verification, not a fictional emergency. |
| T−00:43:00 to T−00:42:00 | PLAN | Apollo access arm moves to standby and the Launch Escape System is armed. | A brief exterior insert makes the state change visible; cabin indication and ground call must agree. |
| T−00:20:00 to T−00:06:00 | PLAN / FLOWN artifact | Crew boost preparation: SM RCS, guidance reference, controller power, EDS automation, engine-out automation, fuel-cell reactant valves, cooling and TVC servo power. | The main playable checklist block. The game selects only controls with a visible consequence or a later boost responsibility. |
| T−00:05:00 | PLAN and FLOWN | Apollo access arm fully retracts. The as-flown log places this at 09:27 EDT. | Final exterior confirmation before the automatic sequence. |
| T−00:04:00 to T−00:00:45 | PLAN / FLOWN artifact | Communications check; CMC program P02 and V75 verification; recorder, glycol bypass, main bus ties, pad communications and GDC alignment. | Final crew actions. The last accepted configuration closes guided preparation; flight-critical controls remain operable. |
| T−00:03:10 | PLAN | Automatic firing sequencer begins. | Time acceleration becomes unavailable. The remaining 3 minutes 10 seconds run at 1×. |
| T−00:00:50 | PLAN | Launch vehicle transfers to internal power. | Ground call and vehicle status change; no invented crew switch. |
| T−00:00:08.9 | PLAN and FLOWN | S-IC ignition sequence begins. | Sound begins as low rumble and vibration, not an immediate cinematic explosion. |
| T−00:00:02 | PLAN | All five first-stage engines are running. | The five launch-vehicle engine lights extinguish as specified by the flown checklist. The player cross-checks the pattern rather than commanding ignition. |
| GET 00:00:00 | FLOWN / ADAPTATION | Liftoff indication turns on; the mission event timer resets and begins counting. The Mission Report records liftoff at GET 00:00:00.6 relative to range zero. | The visible clock changes from `T−` to `GET` when liftoff is verified; the debrief retains the 0.6-second telemetry value. |
| GET +00:00:04 | FLOWN | Armstrong reports that the clock is running. | Player confirms the running clock; Armstrong's historical call follows successful verification. |
| Approximately GET +00:00:12 | FLOWN | Tower clear. Crew recalled 10–12 seconds, with Armstrong reading the event timer; vibration decreased appreciably at tower clearance. | Success condition. Launch Control hands the flight to Houston and the chapter closes as the roll program begins. |

Sources for the table:

- [Apollo 11 Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf),
  sections 2, 3 and 4: range-zero convention, liftoff at GET 00:00:00.6 and the as-flown
  launch account.
- [Apollo 11 Press Kit](https://ntrs.nasa.gov/citations/19690022248), pp. 18–20: planned crew
  ingress, countdown, access-arm, power-transfer and ignition events.
- [Apollo 11 Prelaunch Mission Operations Report](https://www.apollojournals.org/afj/ap11fj/pdf/a11-prelaunch-rep1.pdf),
  pp. 9–15: official countdown, holds and scrub/turnaround boundaries.
- [Apollo 11 Launch Operations Checklist](https://www.apollojournals.org/afj/ap11fj/a11-locindex.html),
  flown artifact L2-1 through L2-3: crew boost preparation and the launch indication sequence.
- [Apollo 11 technical air-to-ground transcript](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html),
  opening entries: clock, roll and pitch-program calls.
- [Apollo 11 Technical Crew Debriefing](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html),
  sections 1.8 and 3.1–3.5: ingress irregularity, ignition, liftoff and tower-clear sensation.
- [NASA, “The Journey to the Moon Begins”](https://www.nasa.gov/history/50-years-ago-the-journey-to-the-moon-begins/):
  ingress order, launch time and Launch Control/Houston handoff.

## Playable sequence

### Beat 1 — The expedition

Target play time: 45–60 seconds.

The opening states the historical objective in plain language: land two crew members on the Moon
and return all three safely to Earth. It identifies Saturn V AS-506, *Columbia* CSM-107, *Eagle*
LM-5, Pad 39A and 16 July 1969. The official mission objective was to perform a crewed lunar
landing and return. [Apollo 11 Prelaunch Mission Operations
Report](https://www.apollojournals.org/afj/ap11fj/pdf/a11-prelaunch-rep1.pdf), p. 7.

**ADAPTATION:** events before ingress appear as a brief chronological montage because breakfast,
suiting and transport carry historical context but do not yet provide a meaningful playable
decision. The game must label the time advance rather than pretending those hours did not occur.

### Beat 2 — Ingress and stations

Target play time: 4–5 minutes.

Perspective follows actual ingress order: Armstrong/left, Collins/right, Aldrin/center. The player
is taught the three station identities and the difference between a command, an action and an
independent verification. White Room personnel assist the crew; they are not puppeted by the
player. [NASA, “The Journey to the Moon
Begins”](https://www.nasa.gov/history/50-years-ago-the-journey-to-the-moon-begins/)

The rotation-controller/strut-release problem is the first authored interaction because it really
happened. The player sees an unexpected release state, hears the crew identify it, requests pad
support and verifies the restored indication. The scene teaches the campaign's central loop without
inventing a malfunction. [Apollo 11 Technical Crew
Debriefing](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html), section 1.8.

**OPEN:** the debrief identifies Collins and backup CMP Fred Haise in the recovery but does not
describe every hand movement. Until another primary procedure is found, the repair itself is an
observed crew/pad animation; the player owns recognition, coordination and verification only.

### Beat 3 — Spacecraft status

Historical span: ingress to T−00:20:00. Target play time: 5–7 minutes.

The game advances through completed, stable periods and stops for three meaningful blocks:

1. command/communication verification;
2. abort advisory and Emergency Detection System verification;
3. access-arm standby and Launch Escape System armed confirmation.

Each block uses the same interaction grammar:

`hear/read command → locate control or display → perform/observe action → cross-check indication → report`

**ADAPTATION:** repeated ground-only checks remain audible background and timeline entries. They do
not become fake astronaut work. The chapter includes no random fault injection: the Apollo 11
prelaunch systems operations and checks were completed on time and without difficulty. [Apollo 11
Mission Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf),
section 4.1.

### Beat 4 — Boost preparation

Historical span: T−00:20:00 to T−00:03:10. Target play time: 7–9 minutes.

This is the main procedural challenge. The flown checklist supplies the order and target states.
The interaction set is intentionally smaller than the printed list:

- establish the boost safety chain (`EDS AUTO`, `LV RATES AUTO`, `2 ENG OUT AUTO`);
- verify the guidance reference and launch attitude;
- confirm direct controller power and the correct launch-computer program;
- verify the final cooling, power and communications transitions;
- conduct the last GDC alignment and confirm no motion on FDAI 2.

Every accepted item changes a readable state. Controls whose only game effect would be another
checkmark remain crew callouts until their downstream consequence exists in the simulation.

The original checklist contains late handwritten timing changes, including primary glycol bypass
near T−00:02:15, main bus ties at T−00:01:15, pad communications off at T−00:01:00 and GDC alignment at
T−00:00:45. The artifact index states that the scans derive from the flown Smithsonian checklist and
that its annotations are original. [Apollo 11 Launch Operations
Checklist](https://www.apollojournals.org/afj/ap11fj/a11-locindex.html), L2-1 and L2-2.

**OPEN:** final action-to-crewmember ownership must be traced to a crew procedure, recording or
panel reach study before controls are assigned in code. The checklist was used by the crew but does
not label every line by operator. The implementation must not guess merely from job titles.

### Beat 5 — Terminal count and tower clear

Historical span and target play time: T−00:03:10 to approximately GET +00:00:12, at 1×.

The player does not command launch. From firing-sequencer start through engine ignition, the
Saturn V and launch team own the sequence. The player's task changes from configuration to
verification:

- observe launch vehicle internal power;
- distinguish ignition vibration from liftoff;
- cross-check five engine lights, `LIFTOFF`, the mission clock and P11;
- report the running clock;
- monitor the initial guidance/rate warnings and remain ready for the commander's abort decision;
- confirm tower clear and the control handoff to Houston.

The sensory treatment follows the crew report: low rumbling and moderate vibration at ignition,
a marked increase at hold-down release, whole-body oscillation after release, then a clear reduction
near tower clear. Communications stay intelligible. [Apollo 11 Technical Crew
Debriefing](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html),
sections 3.1–3.5.

The historical success path ends with no alarm. Armstrong's first recorded air-to-ground calls are
“Clock” at GET +4 seconds and the roll program at +13 seconds. The implementation may use the
historical recording only after its source file and restoration path are established; until then,
the transcript governs timing and subtitles. [Apollo 11 technical air-to-ground
transcript](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html).

## Time model

Prelaunch displays `T−HH:MM:SS`. At verified liftoff, it changes visibly to `GET DDD:HH:MM:SS`.
The Mission Report defines range zero as the integral second before liftoff and records actual
liftoff at 00:00:00.6. The player's display rounds the transition to GET zero while the debrief and
mission event record retain the telemetry precision. [Apollo 11 Mission
Report](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf),
sections 2 and 3.

Time acceleration is explicit and deterministic:

- ingress to T−00:20:00 may advance only after the current procedure is accepted;
- T−00:20:00 to T−00:03:10 may alternate between 1× during actions and accelerated travel to the next
  scheduled block;
- T−00:03:10 through tower clear is locked at 1×;
- no unresolved item, new communication or abnormal indication can be crossed by acceleration.

**ADAPTATION:** after the player explicitly requests the next event once, a stable prelaunch span
advances at `900×` behind a visible Pad 39A countdown passage. The passage remains on screen for at
least 0.9 second and stops exactly at the next unresolved crew procedure. The rate is a presentation
compression, not a historical spacecraft capability. The earlier hold-to-advance treatment was
rejected because its first apparently inactive interval required roughly 11 seconds of continuous
input and supplied no useful feedback.

Expected first-play duration is 20–25 minutes. The player experiences about 2 hours 38 minutes of
mission chronology without sitting through completed pad work.

## Consequence model

The canonical attempt remains Apollo 11 as flown. This chapter does not invent an engine failure,
pad fire or false alarm for excitement.

- Before the automatic sequence, an incomplete crew item stops progress and explains the missing
  acceptance condition.
- A countdown hold or recycle is used only where the prelaunch mission report permitted one.
- Between T−00:00:16.2 and T−00:00:08.9 the historical rules allowed recycle or scrub depending on the
  circumstance; an engine cutoff after ignition meant scrub. [Apollo 11 Prelaunch Mission
  Operations Report](https://www.apollojournals.org/afj/ap11fj/pdf/a11-prelaunch-rep1.pdf), p. 9.
- A true post-liftoff abnormality requires a separately sourced Mode I abort implementation. It is
  outside this increment; the nominal chapter must not fake it with a generic failure screen.

On success, the chapter debrief compares only meaningful items: completed procedure blocks,
incorrect actions and recoveries, countdown holds, configuration at ignition, liftoff verification
latency and the as-flown event times.

## Visual and interaction proposal

No asset is approved by this section. It describes the direction to validate before production.

1. Keep the approved 320 × 180, reduced 16-bit pixel language.
2. Open on one quiet exterior establishing shot of Pad 39A in the Florida morning, then move inside
   *Columbia*. Do not build a launch-site walking game.
3. Treat the Command Module as three connected station views, not one miniaturized wall of labels.
   A procedure brings the relevant control cluster into readable scale while preserving its real
   position in the cabin.
4. Keep the checklist physically present. The current line, target state and confirming indication
   receive restrained highlights; completed work is marked on the page.
5. Use the windows for real external state — White Room activity, sky and tower motion — and never
   as decorative looping animation.
6. During ignition and liftoff, derive intensity from layered pixel displacement, instrument shake,
   sound and controller vibration. Do not replace the player's cabin perspective with a long
   cinematic at the moment their monitoring responsibility is highest.
7. Permit brief, authored exterior cuts only after a verified call, so they reward understanding
   rather than hide an action.

The active opening plate and commander's-window exterior are generated raster translations of this
approved direction. They are tracked with their final prompts in
`public/assets/launch/README.md`. Neither asset is historical evidence; any visible geometry that
becomes mechanically relevant still requires confirmation against official photography or vehicle
drawings.

The temporary audio language is synthesized into deterministic 16-bit WAV data and played through
Phaser. Layered sine waves, short pulses, relay-like transients, frequency sweeps and electrical hum
evoke period test equipment without pretending to be archival Apollo audio. Actual communications
remain a separate provenance and restoration task.

The core mechanic is procedural cross-checking, not switch density: a command, a physical action,
an independent indication and a spoken confirmation form one complete unit. A control enters the
game only when at least two parts of that causal chain are represented.

## Initial implementation boundary

The first implementation should stop at a vertical skeleton:

- a new Chapter 1 Phaser scene and mission-state data under `src/game/`;
- deterministic chapter events, `T−`/GET transition and explicit acceleration gates;
- three station placeholders with only the approved interaction clusters;
- objective, current procedure and acceptance-condition UI;
- scripted historical calls as text and temporary local audio cues;
- tower-clear success and evidence-backed debrief;
- no final art generation, full Saturn V ascent, random failures or general-purpose procedure
  engine.

The active skeleton now opens with three contextual 16-bit views—Pad 39A and Saturn V, Armstrong at
the White Room hatch, then the three crew stations inside *Columbia*—before entering a close
procedural view. That close view is an interaction focus, not the complete visual vocabulary of the
chapter. Stable-time passages return to an exterior launch-site view so the operation never becomes
an unexplained succession of abstract panel screens.

The timeline is Apollo 11 game content. Phaser continues to own scene lifecycle, input, audio,
camera and time.

## Approved decisions

Accepted on 22 August 2026:

1. **Scope:** start at Armstrong's ingress and end at tower clear; continue the ascent in the next
   increment.
2. **Agency:** the player prepares, verifies and may stop an unsafe sequence, but does not press a
   fictional launch button.
3. **Duration:** 20–25 minutes, with the final 3 minutes 10 seconds plus tower clearance at 1×.
4. **First incident:** use the actual rotation-controller/strut-release problem as a guided
   recognition and coordination sequence.
5. **Perspective:** three connected crew-station views, with changes only after operator ownership
   is evidenced.
6. **Visual direction:** reduced 16-bit cabin and Pad 39A art, with the player remaining inside
   *Columbia* through ignition and tower clear.
