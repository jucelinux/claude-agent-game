# The Relativity Workshop diorama

`einstein-lab.glb` is a project-authored, animated low-poly model consumed by Babylon's official
glTF loader. It contains the room, laboratory props and a caricature of a wild-haired early
twentieth-century physicist. No external visual model or texture source is used.

- Geometry: 81 named meshes authored by `scripts/blender/einstein_diorama.py`.
- Materials: thirteen project-authored 16 × 16 PNG textures embedded in the GLB and retained
  beside it as inspectable source assets.
- Runtime sampling: nearest-neighbour with mipmaps, configured by the Babylon scene.
- Catalog preview: `preview.png`, rendered offline at 960 × 540.
- Animation: `Idle_Loop` and `Walk_Loop`, retargeted offline from the Universal Animation
  Library Standard by Quaternius.
- Motion license: CC0 1.0 Universal / Public Domain Dedication.
- Motion source archive SHA-256:
  `18ff1a7215f4852b320203e8aaf02a1578b5c8eef9027fbaedfcedc7b85a3ac2`.
- Authoring version: Blender 5.2.1 LTS, pinned by `scripts/blender/setup.sh`.

Regenerate the committed assets with:

```sh
npm run setup:blender
npm run setup:motion-source
npm run author:einstein-diorama
```
