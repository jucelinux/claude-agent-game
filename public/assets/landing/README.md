# P66 visual target

`p66-visual-target.png` is an AI-generated visual-direction raster, created with the built-in
OpenAI image generation tool on 21 August 2026 and normalized to the game's 960 × 540 canvas.

It establishes the approved quality target: a dominant forward window, high-density pixel art,
hard lunar lighting, granular terrain, irregular rocks, crater depressions and a diegetic cockpit.
It is not historical evidence and must not be used to infer LM-5 control placement, panel labels,
landing-site geometry or as-flown telemetry. Its display apertures are intentionally blank so all
readable data remains controlled by game code.

The prompt used the user-provided concept frame as a quality/composition reference and explicitly
excluded readable labels, numbers, logos, external HUD, science-fiction controls, atmospheric haze,
flat terrain bands, circular sticker-like craters and pyramid rocks.

## Generation prompt

> Create a highly polished 16:9 first-person pixel-art view from Neil Armstrong's commander
> station inside Lunar Module Eagle during P66 terminal descent, approximately 200 feet above
> the Moon. The lunar surface dominates the large triangular forward window: a dangerous shallow
> crater and irregular boulder field lie in the near path, with clearer ground beyond. Use dense,
> deliberately placed pixels, severe unfiltered lunar sunlight, a bright granular silver-gray
> surface, razor-hard shadows and an almost-black 1969 cockpit with layered metal, rivets, cables,
> insulation, checklist paper, instrument bezels and blank recessed display apertures. Keep all
> screens blank for code-rendered data. No readable text or numbers, external HUD, sci-fi controls,
> haze, flat terrain bands, circular sticker-like craters, pyramid rocks, stars, Earth, flags,
> footprints, astronaut, watermark or LM exterior. The supplied image is a quality, composition,
> pixel-density and mood reference only; do not copy its labels or exact instrument configuration.

## Active 16-bit interpretation

`p66-cockpit-snes.png` is the active cockpit layer. It derives from the approved target rather than
from a new generated image: the raster was reduced to a 320 × 180 logical canvas, quantized to a
48-color scene palette and cut with `p66-window-mask-snes.svg`. The opening is genuine alpha all the
way through the lower seal. Phaser enlarges this texture exactly 3× with nearest-neighbor sampling.

The exterior is one deterministic 3D corridor authored and rendered offline with Blender. It is
sampled at 25 downrange values and 16 altitude values, producing 400 views of the same crater,
boulder field and clear-ground corridor. Sampling is denser over the crater, the boulder field and
below 80 feet, where perspective changes are most visible. Phaser does not render or simulate a
second 3D engine: it selects nearby baked views from the current landing state.

Every source view is rendered at 352 × 198 with a central 320 × 180 composition and a 10% overscan
border, reduced through one shared 16-color palette with ordered Bayer dithering, and packed into
twenty-five 4 × 4 atlases. The runtime uses nearest-neighbor sampling. Between authored states it
reprojects each plate with pixel-snapped translation and quantized scale, then replaces it through a
16-phase binary Bayer mask. Each transition pixel belongs wholly to the outgoing or incoming frame;
there is no alpha blend, fractional terrain color or soft texture filtering.

Only the first four atlases are part of the blocking scene preload (about 1.5 MB instead of the
complete 8.9 MB terrain set). After Phaser presents the first unfiltered lunar frame, it loads the
remaining twenty-one atlases in the background. The opening set covers 900–975 feet downrange; if a
later plate is ever delayed, the view retains its last available frame instead of exposing the black
window behind it.

`scripts/blender/render_p66_terrain.py` is the reproducible scene source. The local Blender binary is
an ignored authoring tool, not a runtime dependency. `scripts/build-p66-terrain-atlas.mjs` performs
the palette reduction, atlas build and dimension checks. `src/game/landing/bakedTerrain.ts` owns the
state-to-frame mapping, continuous plate pose and deterministic transition phases. The authored
terrain coordinates and the 2× visual downrange scale are gameplay adaptations rather than surveyed
Apollo 11 landing-site data.

The earlier top-down `Mesh2D` map, generated full-frame plates, runtime primitive projection and
incomplete cockpit extractions were removed after review. They either magnified pixels into
perspective artifacts, changed terrain identity between states, made depressions read as decals or
left opaque material along the window base.
