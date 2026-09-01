# Tokyo Neon '89 — visual direction

## Approval state

- Prototype ID: `tokyo-neon-89`
- Maturity: `art-pass`
- Concept approval: 2026-08-31, a 3D Tokyo neon city scene with explicitly PS1 aesthetics
- Reference research authorization: granted 2026-08-31 by the user's request to research
  references
- Reference-direction approval: 2026-08-31, the user selected *Kowloon's Gate* as the dominant
  influence
- Target-frame approval: approved 2026-08-31 when the user reviewed the local frame and said
  "Avance!"
- Rendered-result approval: not approved; the first generic interpretation was rejected and the
  target-driven art pass is awaiting review

The concept remains approved. The current interpretation does not.

## Visual thesis

The intended scene is a compressed Shinjuku side street in 1989, expressed through the Asian
Gothic density and unsettling first-person composition of *Kowloon's Gate*. The adaptation keeps
Tokyo's observed storefronts, writing systems, utilities and street use; it borrows the game's
spatial pressure, accumulated surfaces, oblique routes and PS1 image character, not Hong Kong's
geography or Chinese cultural details.

The PS1 visual grammar must shape asset construction and composition through low-resolution
texture work, economical polygonal silhouettes, restrained draw distance and limited material
response. It must not be reduced to a pixelation filter over smooth modern PBR geometry, and the
pre-rendered "JPEG Dungeon" look must be translated into navigable Babylon geometry rather than
misrepresented as real-time PS1 rendering.

## Reference packet

The dominant reference direction, exact target frame and proposed asset plan are approved for an
art pass. The rendered interpretation remains subject to visual review.

| Reference | What it establishes | Source and provenance |
| --- | --- | --- |
| *Kowloon's Gate*, Ryūjōro alley frame | Dominant composition: eye-level enclosure, route bending out of sight, dark foreground mass, layered signs and selective pools of color | Screenshot from Sony Music Entertainment's 1997 PlayStation game, reproduced in [えすえふ's 2024 review](https://note.com/sfsfsf/n/n1b75ef15549d); copyright remains with its owners; reference-only, not a project asset |
| Hiroshi Kimura interview | The team observed Hong Kong alleys and combined lived details; the city was treated as an inhabited place rather than an empty ruin | [MANTANWEB, 2022](https://mantan-web.jp/article/20221027dog00m200063000c.html), interview with the game's director |
| Original production credits | Separates the pre-rendered "JPEG Dungeon" art direction from the real-time dungeon modeling and graphics | [Credits transcribed from the Japanese PS1 release](https://raido.moe/staff/ps1/ps1_kowloons_gate.html), © 1997 Sony Music Entertainment (Japan) |
| Shinjuku street, 28 December 1988 | Period control for Tokyo storefront scale, advertising density, street furniture and Japanese sign orientation | [Wikimedia Commons file](https://commons.wikimedia.org/wiki/File:Street_view_of_Tokyo_in_December_1988.jpg), unknown photographer, CC0 1.0 |
| Katsumi Watanabe, *Shinjuku 1965–97* | Human presence and working nightlife as the subject of Kabukichō rather than empty cyberpunk scenery | [Photobook record and review](https://photoguide.jp/txt/WATANABE_Katsumi), Shinchosha 1997; copyrighted book, observation-only |
| Sony Advanced GPU notes, 1996 | Period technical context for linear texture mapping and geometry subdivision instead of arbitrary modern "wobble" | [Sony Computer Entertainment America developer conference PDF](https://psx.arthus.net/sdk/Psy-Q/DOCS/CONF/SCEA/adv_gpu.pdf); technical reference-only |

## Anti-references

- Generic cyan-and-magenta cyberpunk palette used without observed lighting motivation.
- Rectangular towers whose only identity comes from emissive window grids.
- Japanese glyphs used as decorative proof of place.
- Bloom, fog, rain and wet-road streaks treated as substitutes for material design.
- Symmetrical corridor composition with evenly distributed interest.
- Babylon primitives presented as final low-poly architecture rather than disposable blockout.
- A city with no residents, routines, accumulated objects, wear or implied history.
- Smooth modern PBR geometry rendered at low resolution and mislabeled as PS1.
- Uncontrolled vertex wobble, affine distortion, dithering or pixelation applied as nostalgia
  effects without a chosen reference game and legibility target.
- Copying Chinese language, feng shui symbols, Hong Kong shop typologies or Kowloon geography
  into a scene whose stated place is Tokyo.
- Copying the source game's pre-rendered imagery into runtime textures or presenting its JPEG
  dungeons as evidence of real-time polygon budgets.
- Signs with duplicate readable faces: a sign has one declared public face, an opaque back and
  front-side culling so text can never be seen mirrored through the reverse surface.

## Target frame

- Candidate source frame: [Ryūjōro alley screenshot](https://assets.st-note.com/img/1714829676928-ky75um6GKi.jpg), from the review and provenance entry above; linked remotely and not copied into the repository
- Adaptation: a Shinjuku service alley at night in 1989, not a recreation of Ryūjōro
- Camera intent: 4:3, eye height around 1.65 m, moderately wide perspective without fisheye;
  the route begins close to the viewer, compresses between foreground masses and turns right
  behind a lit corner rather than terminating on a centered vanishing point
- Focal hierarchy: warm-red sign cluster in the upper-left; yellow-green threshold at the turn;
  dark storefront and service objects framing the lower-left; cooler secondary signs receding
  to the right
- Required translation: Japanese business types and correctly oriented Japanese text replace
  the source frame's Chinese signage; the visual rhythm and spatial pressure remain
- Approved on: 2026-08-31

The user approved this exact frame as the composition target after reviewing the local copy. It
authorizes the art pass but does not approve the resulting render.

## Asset plan

| Content group | Proposed production path | State | Provenance |
| --- | --- | --- | --- |
| Camera, controls and collision | Babylon.js facilities | Reusable technical base | Repository-owned code |
| Street and building massing | Scene-owned authored Babylon geometry arranged as a compact L-route; Blender/GLB remains an option only for later hero replacements | Art pass | Repository-owned; dimensions derived from documented Tokyo references |
| Storefronts and signs | Deterministic low-resolution DynamicTextures on single-sided sign faces with opaque backs | Art pass | Repository-owned; Japanese copy remains subject to review and every sign declares its public-facing normal |
| Ground, walls and shutters | Deterministic 64×64 surface textures for grime, patched concrete, tile and painted metal; StandardMaterial without PBR gloss | Art pass | Repository-owned procedural source; no game screenshots sampled |
| Human-scale props | Scene-owned low-poly bicycle, crates, exterior AC units, pipes, drains, awnings and utility cables | Art pass | Repository-owned geometry; no third-party asset selected |
| Human presence | One deliberately sparse low-poly resident silhouette near the night counter | Art pass, needs refinement | Repository-owned geometry |
| Landmark | The lit right-hand threshold and the route beyond it replace the generic skyline as the entry landmark | Art pass | Repository-owned composition derived from the approved target |
| Rain and atmospheric motion | Camera-relative Babylon particle systems using repository-authored nearest-neighbor streak and ground-splash textures; restrained gray-green/amber response, wet asphalt specular, no bloom | Art pass, requested by the user on 2026-08-31 | Repository-owned runtime code and procedural textures |

The rejected layout, palette, signs, building forms, materials and lighting were replaced. Scene
lifecycle, first-person navigation, Babylon collision integration and diagnostics were retained.
The authored route and facade kit are distinctive scene work built from scratch after target
approval. Common props were kept deliberately small and repository-owned; no third-party asset
was selected or authorized.

## Canonical review views

| Key | View | What it must eventually prove |
| --- | --- | --- |
| 1 | Alley entry | Target-frame hierarchy, spatial pressure and the invitation toward the turn |
| 2 | Lit turn | The route bending right behind an illuminated threshold |
| 3 | Kissa frontage | Correctly oriented signs, shutters, utilities and accumulated use |
| 4 | Service turn | The secondary route's tighter rhythm and asymmetric discoveries |
| 5 | Night counter | Human presence, warm local light and a destination beyond the entry frame |

The current captures are under `artifacts/visual-review/tokyo-neon-89/`. They document this
art pass and its deficiencies; they are not approved shots or source assets.

## Current review rubric

| Category | Score 0–5 | Evidence and discrepancies |
| --- | ---: | --- |
| Reference fidelity | 3 | The compressed eye-level alley, restrained red/amber/green palette and selective signs reflect the target, but the source frame still has substantially richer layering and tonal variation. |
| Composition | 3 | The entry has a clear sign cluster and warm counter, but the right-hand turn reads too weakly and some detail views remain dominated by dark wall area. |
| Shape language | 3 | Shutters, awnings, frames, AC units, pipes, cables and an L-route replace the tower grid; large building masses remain visibly box-derived. |
| Materials and light | 3 | Deterministic 64×64 concrete, tile, metal and asphalt surfaces establish a PS1 vocabulary without bloom; midtones and local light separation need another pass. |
| Specificity | 3 | Shinjuku address, kissa, snack bar, mahjong, yakitori, vending and service fixtures establish place and use; Japanese copy and period accuracy still need human review. |
| Environmental storytelling | 3 | Closed shutters, bicycle, crates, counter, utilities and one resident imply routines, but the secondary route lacks enough distinct events. |

The scene is correctly classified as `art-pass`. It cannot advance to `review-candidate` until
every category reaches at least 4 against the approved target.

## Discrepancy log

1. Make the opening at the lit threshold read unequivocally as a right-hand route from view 1,
   rather than as a luminous strip against an end wall.
2. Add two or three distinct depth layers to the end composition without returning to a skyline
   or evenly distributed neon.
3. Break the remaining large building masses with authored setbacks, rooflines and facade depth.
4. Lift selected wall midtones and separate adjacent materials while preserving the dark frame.
5. Review Japanese business names, vertical writing order and 1989 period accuracy with a fluent
   reader before finalizing the sign atlas.
6. Replace or refine the resident silhouette and add a second routine to the service route.
7. Preserve the corrected sign contract: single public face, opaque back, front-side culling and
   `TEXT_TEXTURE_INVERT_Y` used when uploading authored canvas text.
8. Keep the rain subordinate to the architecture: it should read most clearly against local
   lights and dark gaps without becoming a bright full-screen veil or a substitute for material
   variation.

## Promotion record

- 2026-08-31: concept implementation authorized.
- 2026-08-31: first render rejected; scene reclassified from `Playable` to `blockout`.
- 2026-08-31: user clarified that the intended retro language is specifically PS1 and identified
  mirrored text in the canonical render.
- 2026-08-31: reference research authorized; user selected *Kowloon's Gate* as the dominant
  visual influence. A Ryūjōro alley frame was proposed as the exact target.
- 2026-08-31: the user reviewed the locally accessible Ryūjōro frame and said "Avance!"; the
  frame and proposed Tokyo adaptation were approved as the target. The new L-shaped alley,
  restrained palette, low-resolution surfaces and single-sided signage advanced the scene to
  `art-pass`; the rendered result remains unapproved.
- 2026-08-31: the user explicitly requested rain. The deferred atmospheric probe was promoted
  into the art pass with a restrained PS1-scale particle treatment that preserves the approved
  architecture and lighting hierarchy.
