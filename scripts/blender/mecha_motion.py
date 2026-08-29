"""Render a side-profile mecha atlas from proven humanoid motion data.

The source rig is used only as offline motion data. The generated armor is
rigidly parented to its bones, rendered with Blender Workbench outlines, and
compiled into ordinary transparent PNG frames for Babylon.js.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


CLIPS = (
    ("Idle_Loop", True),
    ("Walk_Loop", True),
    ("Jump_Start", False),
    ("Jump_Loop", True),
    ("Jump_Land", False),
)

INK = (0.035, 0.045, 0.035, 1.0)
ARMOR = (0.64, 0.68, 0.59, 1.0)
ARMOR_LIGHT = (0.78, 0.81, 0.72, 1.0)
ARMOR_DARK = (0.34, 0.39, 0.32, 1.0)
ARMOR_SHADE = (0.48, 0.53, 0.45, 1.0)
VISOR = (0.08, 0.12, 0.09, 1.0)


def parse_args() -> argparse.Namespace:
    payload = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build the LCD mecha motion frames")
    parser.add_argument("--source", required=True, help="Quaternius animation GLB")
    parser.add_argument("--output-dir", required=True, help="PNG frame directory")
    parser.add_argument("--frames-per-clip", type=int, default=12)
    parser.add_argument("--cell-size", type=int, default=320)
    return parser.parse_args(payload)


def material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    result = bpy.data.materials.new(name)
    result.diffuse_color = color
    return result


def parent_to_bone(
    obj: bpy.types.Object,
    armature: bpy.types.Object,
    bone_name: str,
) -> None:
    world = obj.matrix_world.copy()
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def add_beveled_cube(
    name: str,
    location: Vector,
    dimensions: tuple[float, float, float],
    rotation: Matrix,
    fill: bpy.types.Material,
    armature: bpy.types.Object,
    bone_name: str,
    bevel: float = 0.035,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    if obj is None:
        raise RuntimeError(f"failed to create {name}")
    obj.name = name
    obj.dimensions = dimensions
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = rotation.to_quaternion()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(fill)
    modifier = obj.modifiers.new("machined-edges", "BEVEL")
    modifier.width = bevel
    modifier.segments = 2
    parent_to_bone(obj, armature, bone_name)
    return obj


def add_bone_segment(
    armature: bpy.types.Object,
    bone_name: str,
    name: str,
    width: float,
    depth: float,
    length_scale: float,
    fill: bpy.types.Material,
    offset: Vector | None = None,
) -> bpy.types.Object:
    bone = armature.pose.bones[bone_name]
    head = armature.matrix_world @ bone.head
    tail = armature.matrix_world @ bone.tail
    direction = tail - head
    location = (head + tail) * 0.5 + (offset or Vector())
    rotation = Vector((0, 0, 1)).rotation_difference(direction.normalized()).to_matrix()
    return add_beveled_cube(
        name,
        location,
        (width, depth, direction.length * length_scale),
        rotation,
        fill,
        armature,
        bone_name,
        bevel=min(width, depth) * 0.16,
    )


def add_bone_block(
    armature: bpy.types.Object,
    bone_name: str,
    name: str,
    location: Vector,
    dimensions: tuple[float, float, float],
    fill: bpy.types.Material,
    rotation_z: float = 0.0,
    bevel: float = 0.035,
) -> bpy.types.Object:
    rotation = Matrix.Rotation(rotation_z, 4, "X")
    return add_beveled_cube(
        name,
        location,
        dimensions,
        rotation,
        fill,
        armature,
        bone_name,
        bevel,
    )


def bone_world(armature: bpy.types.Object, bone_name: str) -> Vector:
    return armature.matrix_world @ armature.pose.bones[bone_name].head


def create_mecha(armature: bpy.types.Object) -> None:
    armor = material("armor", ARMOR)
    armor_light = material("armor-light", ARMOR_LIGHT)
    armor_dark = material("armor-dark", ARMOR_DARK)
    armor_shade = material("armor-shade", ARMOR_SHADE)
    visor = material("visor", VISOR)

    # Model in the imported T-pose so rigid parts inherit stable bone-local offsets.
    armature.animation_data.action = bpy.data.actions["A_TPose"]
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    hips = bone_world(armature, "DEF-hips")
    spine = bone_world(armature, "DEF-spine.002")
    neck = bone_world(armature, "DEF-neck")
    head = bone_world(armature, "DEF-head")

    add_bone_block(
        armature, "DEF-hips", "pelvis", hips + Vector((0, 0.005, 0.045)),
        (0.34, 0.34, 0.24), armor_dark, bevel=0.055,
    )
    add_bone_block(
        armature, "DEF-spine.002", "chest", spine + Vector((0, -0.015, 0.12)),
        (0.45, 0.42, 0.45), armor, bevel=0.065,
    )
    add_bone_block(
        armature, "DEF-spine.002", "chest-plate", spine + Vector((0, -0.235, 0.13)),
        (0.31, 0.075, 0.29), armor_light, bevel=0.035,
    )
    # The front value break lives on the camera-facing side of the armor. It is
    # a material decision, so the walk rotation cannot brighten it away.
    add_bone_block(
        armature, "DEF-spine.002", "frontal-shadow-panel",
        spine + Vector((-0.244, -0.105, 0.13)),
        (0.038, 0.17, 0.28), armor_shade, bevel=0.012,
    )
    add_bone_block(
        armature, "DEF-spine.002", "backpack", spine + Vector((0, 0.245, 0.11)),
        (0.34, 0.16, 0.4), armor_dark, bevel=0.045,
    )
    # This is an authored value break, not a view-dependent shadow. Keeping it
    # on the camera-facing side of the torso prevents the arm swing from making
    # the dorsal read disappear during locomotion.
    add_bone_block(
        armature, "DEF-spine.002", "dorsal-shadow-panel",
        spine + Vector((-0.242, 0.115, 0.13)),
        (0.035, 0.16, 0.28), armor_dark, bevel=0.012,
    )
    add_bone_block(
        armature, "DEF-neck", "neck", neck + Vector((0, 0, 0.015)),
        (0.2, 0.18, 0.18), armor_dark, bevel=0.025,
    )
    add_bone_block(
        armature, "DEF-head", "helmet", head + Vector((0, -0.01, 0.12)),
        (0.38, 0.38, 0.34), armor_light, bevel=0.065,
    )
    add_bone_block(
        armature, "DEF-head", "face-guard", head + Vector((0, -0.235, 0.08)),
        (0.28, 0.1, 0.19), armor, bevel=0.025,
    )
    add_bone_block(
        armature, "DEF-head", "visor", head + Vector((0, -0.292, 0.145)),
        (0.19, 0.035, 0.07), visor, bevel=0.012,
    )
    add_bone_block(
        armature, "DEF-head", "fin-upper", head + Vector((0, -0.08, 0.36)),
        (0.055, 0.34, 0.045), armor_light, rotation_z=math.radians(-16), bevel=0.01,
    )
    add_bone_block(
        armature, "DEF-head", "fin-lower", head + Vector((0, -0.16, 0.315)),
        (0.055, 0.28, 0.04), armor_light, rotation_z=math.radians(18), bevel=0.01,
    )

    for side in ("L", "R"):
        shoulder = f"DEF-shoulder.{side}"
        upper_arm = f"DEF-upper_arm.{side}"
        forearm = f"DEF-forearm.{side}"
        hand = f"DEF-hand.{side}"
        thigh = f"DEF-thigh.{side}"
        shin = f"DEF-shin.{side}"
        foot = f"DEF-foot.{side}"
        toe = f"DEF-toe.{side}"
        suffix = side.lower()

        add_bone_block(
            armature, shoulder, f"shoulder-{suffix}", bone_world(armature, upper_arm),
            (0.26, 0.3, 0.25), armor_light, bevel=0.05,
        )
        add_bone_segment(armature, upper_arm, f"upper-arm-{suffix}", 0.22, 0.21, 0.82, armor)
        add_bone_segment(armature, forearm, f"forearm-{suffix}", 0.24, 0.25, 0.86, armor_light)
        add_bone_block(
            armature, hand, f"hand-{suffix}", bone_world(armature, hand),
            (0.2, 0.22, 0.22), armor_dark, bevel=0.04,
        )

        add_bone_segment(armature, thigh, f"thigh-{suffix}", 0.29, 0.31, 0.88, armor)
        add_bone_segment(armature, shin, f"shin-{suffix}", 0.27, 0.3, 0.9, armor_light)
        add_bone_block(
            armature, shin, f"knee-{suffix}", bone_world(armature, shin),
            (0.31, 0.34, 0.24), armor_dark, bevel=0.05,
        )
        foot_head = bone_world(armature, foot)
        toe_head = bone_world(armature, toe)
        add_bone_block(
            armature, foot, f"ankle-{suffix}", foot_head + Vector((0, 0.01, 0.035)),
            (0.23, 0.25, 0.22), armor_dark, bevel=0.035,
        )
        add_bone_block(
            armature, toe, f"foot-{suffix}", toe_head + Vector((0, -0.08, 0.02)),
            (0.25, 0.34, 0.14), armor_light, bevel=0.035,
        )


def point_camera(camera: bpy.types.Object, target: Vector) -> None:
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()


def configure_render(scene: bpy.types.Scene, cell_size: int) -> None:
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = cell_size
    scene.render.resolution_y = cell_size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.render.use_file_extension = True
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = False
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "BOTH"
    scene.display.shading.curvature_ridge_factor = 1.7
    scene.display.shading.curvature_valley_factor = 1.25
    scene.display.shading.show_specular_highlight = False
    scene.display.shading.show_object_outline = True
    scene.display.shading.object_outline_color = INK[:3]
    scene.display.shading.background_type = "WORLD"


def render_frames(
    scene: bpy.types.Scene,
    armature: bpy.types.Object,
    output_dir: Path,
    frames_per_clip: int,
) -> None:
    frame_number = 0
    for action_name, loops in CLIPS:
        action = bpy.data.actions.get(action_name)
        if action is None:
            raise RuntimeError(f"missing required action {action_name}")
        armature.animation_data.action = action
        start, end = action.frame_range
        for sample in range(frames_per_clip):
            divisor = frames_per_clip if loops else max(1, frames_per_clip - 1)
            source_frame = start + (end - start) * sample / divisor
            scene.frame_set(math.floor(source_frame), subframe=source_frame % 1)
            scene.render.filepath = str(output_dir / f"frame-{frame_number:03d}.png")
            bpy.ops.render.render(write_still=True)
            frame_number += 1


def main() -> None:
    args = parse_args()
    if args.frames_per_clip < 2 or args.cell_size < 64:
        raise ValueError("frames-per-clip must be >= 2 and cell-size must be >= 64")

    source = Path(args.source).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    if not source.is_file():
        raise FileNotFoundError(source)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene = bpy.context.scene
    armature = next(
        (obj for obj in scene.objects if obj.type == "ARMATURE"),
        None,
    )
    if armature is None:
        raise RuntimeError("the motion source did not contain an armature")
    armature.animation_data_create()

    for obj in tuple(scene.objects):
        if obj is not armature:
            obj.hide_render = True

    create_mecha(armature)

    camera_data = bpy.data.cameras.new("profile-camera")
    camera = bpy.data.objects.new("profile-camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = Vector((-4.2, 0, 0.9))
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 2.45
    camera_data.lens = 55
    point_camera(camera, Vector((0, 0, 0.9)))
    scene.camera = camera
    configure_render(scene, args.cell_size)
    render_frames(scene, armature, output_dir, args.frames_per_clip)


if __name__ == "__main__":
    main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)
