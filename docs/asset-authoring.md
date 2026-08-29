# Asset authoring

This workspace supports three complementary asset paths. They all end as ordinary data consumed
by a Babylon.js scene; none introduces another runtime or game engine.

## Procedural grammar

Use `src/core/` and `src/grammars/` for shapes and animation that benefit from deterministic,
parameterized generation. Register a grammar and its parameters in
`src/authoring/catalog.ts`. The compiler produces a portable raster atlas with animation,
palette, origin, contact and anchor metadata. Project-owned Babylon scenes consume that bundle.

## Generated or imported raster images

Place approved raster assets under `public/assets/<feature>/` and load them through Babylon's
normal texture or sprite APIs. Keep a README beside the assets that records:

- the asset's purpose and native pixel dimensions;
- whether it was generated, photographed, illustrated or imported;
- source references, prompts and material transformations;
- licensing or provenance constraints;
- the intended Babylon texture key and animation frame layout.

Generated imagery is an authoring input, not a source of factual truth. For pixel art, author at
the intended logical resolution and display with nearest-neighbour sampling; do not depend on
runtime downscaling to invent the style.

The retained atlas compositor turns a numbered frame sequence into a deterministic raster atlas:

```sh
npm run compose:atlas -- \
  --input-dir /tmp/rendered-frames --output public/assets/example/atlas.png \
  --columns 8 --rows 4 --cell-size 256
```

## Blender renders

Blender is an offline authoring tool for perspective, lighting, animation or geometry that is
more dependable in 3D. Keep project-specific `.blend` files and scripts with their feature, then
render PNG or GLB output into `public/assets/<feature>/`. Babylon only sees the exported asset;
Blender is never a runtime dependency.

Install the checksum-pinned portable Blender LTS build into the ignored `.tools/` cache:

```sh
npm run setup:blender
```

The reusable render entry point is:

```sh
npm run blender -- scene.blend --background --python scripts/blender/render_scene.py -- \
  --output public/assets/example/frame.png --width 320 --height 180 --transparent
```

The script requires an active camera, sets an exact output size and writes a PNG. Scene-specific
camera motion, materials and animation remain in the `.blend` file or a feature script instead
of becoming repository-owned runtime abstractions.
