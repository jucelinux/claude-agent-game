# Ashfall traveler 3D bake

- Source: `ashfall-traveler.blend`
- Generator: `scripts/blender/build_wasteland_traveler.py`
- Renderer: Blender 4.0.2, Eevee, orthographic camera
- Motion: CMU subject 136, take `136_22` (Normal Walk), retargeted to the Ashfall rig
- Output: 36×42 indexed frames, 8 directions, 4 idle frames and 16 walk frames
- Runtime: the Blender renders are compiled as ordinary raster assets; Blender is not loaded by the game

Run the generator from the repository root:

```sh
.tools/blender-4.0.2-linux-x64/blender --background --python scripts/blender/build_wasteland_traveler.py
```

The capture samples used by the offline retarget are stored in `cmu-136-22-walk.json`; source
terms and acknowledgement are recorded in `MOCAP-LICENSE.md`. The earlier polygon atlas is no
longer registered in the Builder.
