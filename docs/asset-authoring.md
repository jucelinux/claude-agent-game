# Asset authoring

This workspace supports three complementary asset paths. They all end as ordinary data consumed
by a Phaser scene; none introduces another runtime or game engine.

## Procedural grammar

Use `src/core/` and `src/grammars/` for shapes and animation that benefit from deterministic,
parameterized generation. Register a grammar and its parameters in
`src/authoring/catalog.ts`. The compiler produces a portable raster atlas with animation,
palette, origin, contact and anchor metadata. `src/phaser/installBundle.ts` installs that output
as Phaser textures and animations.

## Generated or imported raster images

Place approved raster assets under `public/assets/<feature>/` and load them through Phaser's
normal preload APIs. Keep a README beside the assets that records:

- the asset's purpose and native pixel dimensions;
- whether it was generated, photographed, illustrated or imported;
- source references, prompts and material transformations;
- licensing or provenance constraints;
- the intended Phaser texture key and animation frame layout.

Generated imagery is an authoring input, not a source of factual truth. For pixel art, author at
the intended logical resolution and display with nearest-neighbour sampling; do not depend on
runtime downscaling to invent the style.

## Blender renders

Blender is an offline authoring tool for perspective, lighting, animation or geometry that is
more dependable in 3D. Keep project-specific `.blend` files and scripts with their feature, then
render PNG output into `public/assets/<feature>/`. Phaser only sees the exported images.

The reusable render entry point is:

```sh
blender scene.blend --background --python scripts/blender/render_scene.py -- \
  --output public/assets/example/frame.png --width 320 --height 180 --transparent
```

The script requires an active camera, sets an exact output size and writes a PNG. Scene-specific
camera motion, materials and animation remain in the `.blend` file or a feature script instead
of becoming repository-owned runtime abstractions.
