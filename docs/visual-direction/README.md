# Visual direction workflow

This workflow keeps technical progress, art production and visual approval from collapsing into
one misleading definition of "done". Every visually led prototype has a brief created from
[`TEMPLATE.md`](./TEMPLATE.md).

## Maturity stages

| Stage | Meaning | Promotion requirement |
| --- | --- | --- |
| `reference` | The concept exists; references, anti-references or target frame are incomplete. | Reference packet and target frame explicitly approved. |
| `blockout` | Camera, scale, route and composition are being tested with disposable forms. | Approved target has shaped the layout and an asset plan is accepted. |
| `art-pass` | Authored geometry, materials, lighting and storytelling are being produced. | Canonical captures score at least 4 in every rubric category. |
| `review-candidate` | The implementation is ready for human visual review. | Explicit user approval of the rendered result. |
| `approved` | The rendered direction is accepted and may be described as a finished playable study. | New visual direction requires a new approval cycle. |

Concept approval allows a prototype to exist in the catalog. It does not skip these stages or
constitute approval of its rendered interpretation.

## Required evidence

Each brief records:

- observed references and their sources or asset licenses;
- anti-references and generic shortcuts to avoid;
- one approved target frame and its intended camera/composition contract;
- an asset plan separating blockout geometry from final content;
- canonical review views;
- a discrepancy log comparing captures with the target;
- the user's explicit visual approval when it happens.

References may be supplied by the user or researched only after the repository's required
permission is granted. Generated concepts are offline planning inputs, not automatic visual
authority and not runtime systems.

## Review rubric

Score every category from 0 to 5 against the approved references, never against the previous
implementation. A `review-candidate` needs at least 4 in every category; averages cannot hide a
failed dimension.

| Category | Review question |
| --- | --- |
| Reference fidelity | Does the scene reflect observed forms rather than prompt stereotypes? |
| Composition | Do canonical views have intentional hierarchy, depth and focal control? |
| Shape language | Are silhouettes and proportions authored, varied and coherent? |
| Materials and light | Do surfaces and lighting explain the space instead of decorating it? |
| Specificity | Could the scene belong only to this place, period and visual thesis? |
| Environmental storytelling | Does the environment imply use, history and human presence? |

Record concrete discrepancies below the score. The rubric is a review aid, not an automated
approval system.

## Captures

Run:

```sh
npm run capture:visual
```

The command visits the scene-owned review camera bookmarks and writes individual PNG files plus
a labeled contact sheet under `artifacts/visual-review/<prototype-id>/`. `artifacts/` is ignored
because captures are review output. After the user approves a result, intentionally copy the
chosen target or baseline into a provenance-documented project location.

Browser tests continue to check loading, visibility, motion and regressions. A passing test is
never a rubric score and never changes maturity.
