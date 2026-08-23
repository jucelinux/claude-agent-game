"""Render the active Blender scene to a predictable PNG.

Usage:
    blender scene.blend --background --python scripts/blender/render_scene.py -- \
        --output public/assets/example/frame.png --width 320 --height 180 --transparent
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy


def parse_args() -> argparse.Namespace:
    payload = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Render the active Blender scene to PNG")
    parser.add_argument("--output", required=True, help="Output PNG path")
    parser.add_argument("--width", required=True, type=int, help="Output width in pixels")
    parser.add_argument("--height", required=True, type=int, help="Output height in pixels")
    parser.add_argument("--transparent", action="store_true", help="Render a transparent film")
    return parser.parse_args(payload)


def main() -> None:
    args = parse_args()
    if args.width < 1 or args.height < 1:
        raise ValueError("width and height must be positive")

    scene = bpy.context.scene
    if scene.camera is None:
        raise RuntimeError("the Blender scene needs an active camera")

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    scene.render.resolution_x = args.width
    scene.render.resolution_y = args.height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA" if args.transparent else "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = args.transparent
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
