"""Build, rig and bake the Ashfall traveler into deterministic directional sprite data.

The Blender scene is an offline authoring source. Phaser only receives the indexed raster
frames written to ``src/authoring/generated``; Blender is never part of the game runtime.

Usage:
    .tools/blender-4.0.2-linux-x64/blender --background --python \
        scripts/blender/build_wasteland_traveler.py
"""

from __future__ import annotations

import base64
import json
import math
from pathlib import Path
from typing import Iterable, Sequence

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
ASSET_ROOT = ROOT / "public/assets/ashfall/traveler3d"
DATA_OUTPUT = ROOT / "src/authoring/generated/wastelandTraveler3d.json"
BLEND_OUTPUT = ASSET_ROOT / "ashfall-traveler.blend"
MOCAP_INPUT = ASSET_ROOT / "cmu-136-22-walk.json"

CELL_WIDTH = 36
CELL_HEIGHT = 42
SUPERSAMPLE = 4
RENDER_WIDTH = CELL_WIDTH * SUPERSAMPLE
RENDER_HEIGHT = CELL_HEIGHT * SUPERSAMPLE
ORIGIN_X = 18
CONTACT_Y = 38
IDLE_DURATIONS = [220, 220, 220, 220]

MOCAP_DATA = json.loads(MOCAP_INPUT.read_text(encoding="utf-8"))
MOCAP_POSES = MOCAP_DATA["poses"]
# 16 fps retains the captured contacts and passing poses without looking too smooth for the
# deliberately low-resolution render. One complete human stride takes just under a second.
WALK_DURATIONS = [62 for _ in MOCAP_POSES]


def motion_mean(side: str, channel: str, component: int | None = None) -> float:
    values = [pose[side][channel] for pose in MOCAP_POSES]
    if component is not None:
        values = [value[component] for value in values]
    return sum(values) / len(values)


MOTION_MEANS = {
    side: {
        "hip": [motion_mean(side, "hip", component) for component in range(3)],
        "knee": motion_mean(side, "knee"),
        "ankle": [motion_mean(side, "ankle", component) for component in range(2)],
        "shoulder": motion_mean(side, "shoulder"),
    }
    for side in ("left", "right")
}
SPINE_MEAN = [
    sum(pose["spine"][component] for pose in MOCAP_POSES) / len(MOCAP_POSES)
    for component in range(3)
]

DIRECTIONS = {
    "e": math.radians(90),
    "se": math.radians(45),
    "s": 0.0,
    "sw": math.radians(-45),
    "w": math.radians(-90),
    "nw": math.radians(-135),
    "n": math.radians(180),
    "ne": math.radians(135),
}

# Keep this order aligned with the runtime palette. Index zero is transparent.
PALETTE = [
    (0x00, 0x00, 0x00),
    (0x17, 0x1B, 0x1C),
    (0x34, 0x3D, 0x3D),
    (0x26, 0x32, 0x37),
    (0x38, 0x49, 0x4D),
    (0x51, 0x4D, 0x43),
    (0x84, 0x7E, 0x6C),
    (0xAA, 0xA1, 0x8A),
    (0x3D, 0x2A, 0x24),
    (0x70, 0x47, 0x35),
    (0x98, 0x60, 0x44),
    (0xA2, 0x58, 0x3E),
    (0x8D, 0x5D, 0x45),
    (0xC1, 0x8A, 0x64),
    (0xD6, 0xA2, 0x7A),
    (0x21, 0x1B, 0x19),
    (0x62, 0xD4, 0xCA),
]


def reset_scene() -> bpy.types.Scene:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures, bpy.data.materials):
        for datablock in list(datablocks):
            datablocks.remove(datablock)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = RENDER_WIDTH
    scene.render.resolution_y = RENDER_HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.render.filepath = str(ASSET_ROOT / "render.png")
    scene.eevee.taa_render_samples = 16
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 2.0
    scene.eevee.gtao_factor = 1.15
    scene.view_settings.look = "AgX - Medium High Contrast"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "MATERIAL"
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.curvature_ridge_factor = 1.35
    shading.curvature_valley_factor = 0.8
    shading.show_specular_highlight = False
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.0, 0.0, 0.0)
    scene.render.image_settings.color_management = "FOLLOW_SCENE"
    return scene


def material(name: str, color: tuple[int, int, int]) -> bpy.types.Material:
    value = bpy.data.materials.new(name)
    value.diffuse_color = tuple(channel / 255 for channel in color) + (1.0,)
    value.use_nodes = True
    shader = value.node_tree.nodes.get("Principled BSDF")
    if shader is not None:
        shader.inputs["Base Color"].default_value = value.diffuse_color
        shader.inputs["Roughness"].default_value = 1.0
        shader.inputs["Specular IOR Level"].default_value = 0.0
    return value


def create_lighting(scene: bpy.types.Scene) -> None:
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    if background is not None:
        background.inputs["Color"].default_value = (0.16, 0.18, 0.18, 1.0)
        background.inputs["Strength"].default_value = 0.7

    key_data = bpy.data.lights.new("soft-key", "AREA")
    key_data.energy = 360
    key_data.shape = "DISK"
    key_data.size = 4.0
    key = bpy.data.objects.new("soft-key", key_data)
    key.location = (-3.5, -4.0, 6.0)
    key.rotation_euler = ((Vector((0, 0, 1.0)) - key.location).to_track_quat("-Z", "Y").to_euler())
    bpy.context.collection.objects.link(key)

    fill_data = bpy.data.lights.new("rear-fill", "AREA")
    fill_data.energy = 120
    fill_data.size = 3.0
    fill = bpy.data.objects.new("rear-fill", fill_data)
    fill.location = (3.0, 4.0, 3.5)
    fill.rotation_euler = ((Vector((0, 0, 1.0)) - fill.location).to_track_quat("-Z", "Y").to_euler())
    bpy.context.collection.objects.link(fill)


def apply_scale(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    paint: bpy.types.Material,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    assert obj is not None
    obj.name = name
    obj.dimensions = dimensions
    apply_scale(obj)
    obj.data.materials.append(paint)
    if bevel > 0:
        modifier = obj.modifiers.new("single-plane bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)
    return obj


def tapered_box(
    name: str,
    z_min: float,
    z_max: float,
    lower_half_width: float,
    upper_half_width: float,
    half_depth: float,
    paint: bpy.types.Material,
) -> bpy.types.Object:
    vertices = []
    for z, half_width in ((z_min, lower_half_width), (z_max, upper_half_width)):
        vertices.extend([
            (-half_width, -half_depth, z),
            (half_width, -half_depth, z),
            (half_width, half_depth, z),
            (-half_width, half_depth, z),
        ])
    faces = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    mesh = bpy.data.meshes.new(f"{name}-mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(paint)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    paint: bpy.types.Material,
    vertices: int = 6,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        end_fill_type="NGON",
        location=location,
    )
    obj = bpy.context.object
    assert obj is not None
    obj.name = name
    obj.data.materials.append(paint)
    return obj


def low_poly_head(name: str, paint: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0, -0.01, 1.59))
    obj = bpy.context.object
    assert obj is not None
    obj.name = name
    obj.scale = (0.17, 0.145, 0.205)
    apply_scale(obj)
    obj.data.materials.append(paint)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def create_armature() -> bpy.types.Object:
    data = bpy.data.armatures.new("AshfallTravelerRig")
    rig = bpy.data.objects.new("AshfallTravelerRig", data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(
        name: str,
        head: tuple[float, float, float],
        tail: tuple[float, float, float],
        parent: str | None = None,
        connected: bool = False,
    ) -> None:
        value = data.edit_bones.new(name)
        value.head = head
        value.tail = tail
        value.roll = 0.0
        if parent is not None:
            value.parent = data.edit_bones[parent]
            value.use_connect = connected

    bone("root", (0, 0, 0), (0, 0, 0.12))
    bone("pelvis", (0, 0, 0.76), (0, 0, 0.94), "root")
    bone("spine", (0, 0, 0.94), (0, 0, 1.38), "pelvis", True)
    bone("head", (0, 0, 1.38), (0, 0, 1.72), "spine", True)

    for side, x in (("L", -0.105), ("R", 0.105)):
        bone(f"thigh.{side}", (x, 0, 0.78), (x, 0, 0.44), "pelvis")
        bone(f"shin.{side}", (x, 0, 0.44), (x, 0, 0.12), f"thigh.{side}", True)
        bone(f"foot.{side}", (x, 0, 0.12), (x, -0.23, 0.09), f"shin.{side}", True)

    for side, x in (("L", -0.285), ("R", 0.285)):
        bone(f"upper_arm.{side}", (x, 0, 1.31), (x, 0, 1.04), "spine")
        bone(f"forearm.{side}", (x, 0, 1.04), (x, 0, 0.78), f"upper_arm.{side}", True)

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.show_in_front = True
    rig.data.display_type = "STICK"
    rig.rotation_mode = "XYZ"
    rig.select_set(False)
    return rig


def parent_to_bone(obj: bpy.types.Object, rig: bpy.types.Object, bone_name: str) -> None:
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def build_character(rig: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    parts: list[tuple[bpy.types.Object, str]] = [
        (tapered_box("coat-torso", 0.78, 1.35, 0.22, 0.29, 0.14, materials["coat"]), "spine"),
        (tapered_box("coat-skirt", 0.61, 0.84, 0.245, 0.22, 0.145, materials["coat_dark"]), "pelvis"),
        (box("backpack", (0, 0.205, 1.08), (0.42, 0.2, 0.56), materials["pack"], 0.035), "spine"),
        (box("backpack-flap", (0, 0.316, 1.22), (0.34, 0.035, 0.16), materials["pack_light"], 0.012), "spine"),
        (box("backpack-signal", (0, 0.34, 1.12), (0.105, 0.025, 0.1), materials["signal"]), "spine"),
        (box("strap-left", (-0.18, -0.157, 1.08), (0.045, 0.025, 0.48), materials["pack_dark"], 0.01), "spine"),
        (box("strap-right", (0.18, -0.157, 1.08), (0.045, 0.025, 0.48), materials["pack_dark"], 0.01), "spine"),
        (cylinder("scarf", (0, 0, 1.39), 0.205, 0.095, materials["scarf"], 8), "head"),
        (low_poly_head("head", materials["skin"]), "head"),
        (box("hair-cap", (0, 0.025, 1.72), (0.31, 0.25, 0.11), materials["hair"], 0.025), "head"),
        (box("hair-back", (0, 0.125, 1.61), (0.3, 0.06, 0.2), materials["hair"], 0.02), "head"),
        (box("face-plane", (0, -0.153, 1.59), (0.19, 0.025, 0.13), materials["skin_light"], 0.012), "head"),
    ]

    for side, x, shade in (("L", -0.285, "coat_dark"), ("R", 0.285, "coat")):
        parts.extend([
            (cylinder(f"upper-arm-{side}", (x, 0, 1.175), 0.075, 0.27, materials[shade]), f"upper_arm.{side}"),
            (cylinder(f"forearm-{side}", (x, 0, 0.91), 0.065, 0.26, materials[shade]), f"forearm.{side}"),
            (box(f"hand-{side}", (x, -0.005, 0.77), (0.11, 0.1, 0.13), materials["skin"], 0.025), f"forearm.{side}"),
        ])

    for side, x, shade in (("L", -0.105, "trouser_dark"), ("R", 0.105, "trouser")):
        parts.extend([
            (cylinder(f"thigh-{side}", (x, 0, 0.61), 0.09, 0.34, materials[shade], 5), f"thigh.{side}"),
            (cylinder(f"shin-{side}", (x, 0, 0.28), 0.075, 0.32, materials[shade], 5), f"shin.{side}"),
            (box(f"boot-cuff-{side}", (x, -0.01, 0.14), (0.17, 0.16, 0.19), materials["boot_light"], 0.02), f"foot.{side}"),
            (box(f"boot-{side}", (x, -0.105, 0.075), (0.18, 0.34, 0.13), materials["boot"], 0.025), f"foot.{side}"),
        ])

    for obj, bone_name in parts:
        parent_to_bone(obj, rig, bone_name)


def create_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    data = bpy.data.cameras.new("IsometricSpriteCamera")
    camera = bpy.data.objects.new("IsometricSpriteCamera", data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -8.0, 2.75)
    target = Vector((0, 0, 0.93))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    data.type = "ORTHO"
    data.ortho_scale = 2.18
    data.lens = 55
    scene.camera = camera
    return camera


def clear_pose(rig: bpy.types.Object) -> None:
    rig.location = (0, 0, 0)
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0, 0, 0)
        bone.location = (0, 0, 0)
        bone.scale = (1, 1, 1)


def interpolate_value(first: object, second: object, blend: float) -> object:
    if isinstance(first, list) and isinstance(second, list):
        return [
            interpolate_value(first[index], second[index], blend)
            for index in range(len(first))
        ]
    if isinstance(first, dict) and isinstance(second, dict):
        return {
            key: interpolate_value(first[key], second[key], blend)
            for key in first
        }
    return float(first) + (float(second) - float(first)) * blend


def sample_mocap_pose(phase: float) -> dict[str, object]:
    position = (phase / math.tau % 1.0) * len(MOCAP_POSES)
    first_index = math.floor(position)
    second_index = (first_index + 1) % len(MOCAP_POSES)
    return interpolate_value(
        MOCAP_POSES[first_index],
        MOCAP_POSES[second_index],
        position - first_index,
    )


def lowest_boot_z() -> float:
    values = []
    for name in ("boot-L", "boot-R"):
        boot = bpy.data.objects.get(name)
        if boot is None:
            raise RuntimeError(f"missing grounded walk object {name}")
        values.extend((boot.matrix_world @ Vector(corner)).z for corner in boot.bound_box)
    return min(values)


def ground_walk_pose(rig: bpy.types.Object) -> None:
    bpy.context.view_layer.update()
    rig.location.z += 0.012 - lowest_boot_z()
    bpy.context.view_layer.update()


def apply_walk_pose(rig: bpy.types.Object, phase: float) -> None:
    clear_pose(rig)
    motion = sample_mocap_pose(phase)
    spine = motion["spine"]

    # The capture supplies the little counter-rotations that make a walk read as weight
    # transfer instead of two legs hinged under a rigid torso. Keep them restrained at this
    # sprite scale; the source performer remains the biomechanical authority.
    rig.pose.bones["pelvis"].rotation_euler.y = math.radians(
        (spine[2] - SPINE_MEAN[2]) * 0.24
    )
    rig.pose.bones["pelvis"].rotation_euler.z = math.radians(
        (spine[1] - SPINE_MEAN[1]) * 0.42
    )
    rig.pose.bones["spine"].rotation_euler.x = math.radians(
        2.0 + (spine[0] - SPINE_MEAN[0]) * 0.3
    )
    rig.pose.bones["spine"].rotation_euler.y = math.radians(
        (spine[2] - SPINE_MEAN[2]) * 0.16
    )
    rig.pose.bones["head"].rotation_euler.y = -rig.pose.bones["spine"].rotation_euler.y * 0.45

    for source_side, rig_side in (("left", "L"), ("right", "R")):
        source = motion[source_side]
        means = MOTION_MEANS[source_side]
        hip = source["hip"]
        ankle = source["ankle"]

        # The ASF skeletons use different calibrated rest axes for the two legs. Recentring
        # each side removes that calibration asymmetry while preserving the captured curve.
        thigh = rig.pose.bones[f"thigh.{rig_side}"]
        thigh.rotation_euler.x = math.radians(hip[0] - means["hip"][0] - 7.0)
        thigh.rotation_euler.y = math.radians((hip[2] - means["hip"][2]) * 0.16)
        thigh.rotation_euler.z = math.radians((hip[1] - means["hip"][1]) * 0.28)

        knee_degrees = max(4.0, min(78.0, source["knee"] - means["knee"] + 33.0))
        rig.pose.bones[f"shin.{rig_side}"].rotation_euler.x = math.radians(knee_degrees)

        foot = rig.pose.bones[f"foot.{rig_side}"]
        foot.rotation_euler.x = math.radians(ankle[0] - means["ankle"][0] - 11.0)
        foot.rotation_euler.y = math.radians((ankle[1] - means["ankle"][1]) * 0.35)

        shoulder_degrees = -(source["shoulder"] - means["shoulder"]) * 1.2
        rig.pose.bones[f"upper_arm.{rig_side}"].rotation_euler.x = math.radians(
            shoulder_degrees
        )
        elbow_degrees = max(10.0, min(28.0, source["elbow"] * 0.7))
        rig.pose.bones[f"forearm.{rig_side}"].rotation_euler.x = -math.radians(elbow_degrees)

    # Solve the in-place root from the rendered boot geometry. This makes one foot carry
    # weight in every pose and prevents both the old hovering frames and floor penetration.
    ground_walk_pose(rig)


def apply_idle_pose(rig: bpy.types.Object, phase: float) -> None:
    clear_pose(rig)
    breath = math.sin(phase)
    rig.location.z = breath * 0.012
    rig.pose.bones["spine"].rotation_euler.x = math.radians(1.4) * breath
    rig.pose.bones["head"].rotation_euler.x = math.radians(-0.7) * breath
    rig.pose.bones["upper_arm.L"].rotation_euler.x = math.radians(2.5) * breath
    rig.pose.bones["upper_arm.R"].rotation_euler.x = math.radians(-2.5) * breath


def create_actions(rig: bpy.types.Object) -> None:
    def key_pose(frame: int) -> None:
        rig.keyframe_insert(data_path="location", frame=frame)
        for bone in rig.pose.bones:
            bone.keyframe_insert(data_path="rotation_euler", frame=frame)

    walk = bpy.data.actions.new("walk")
    rig.animation_data_create()
    rig.animation_data.action = walk
    for frame in range(len(MOCAP_POSES) + 1):
        apply_walk_pose(rig, frame / len(MOCAP_POSES) * math.tau)
        key_pose(frame + 1)
    walk.use_fake_user = True

    idle = bpy.data.actions.new("idle")
    rig.animation_data.action = idle
    for frame in range(5):
        apply_idle_pose(rig, frame / 4 * math.tau)
        key_pose(frame + 1)
    idle.use_fake_user = True
    rig.animation_data.action = walk

    for action in (walk, idle):
        for curve in action.fcurves:
            for point in curve.keyframe_points:
                point.interpolation = "BEZIER"
    # The bake sets exact sub-frame poses itself. Leaving an Action active makes Blender
    # reevaluate frame 1 immediately before every render and freeze every exported cell.
    rig.animation_data.action = None


def validate_leg_flexion(rig: bpy.types.Object) -> None:
    peak_frames = {
        "L": max(range(len(MOCAP_POSES)), key=lambda frame: MOCAP_POSES[frame]["left"]["knee"]),
        "R": max(range(len(MOCAP_POSES)), key=lambda frame: MOCAP_POSES[frame]["right"]["knee"]),
    }
    separation = abs(peak_frames["L"] - peak_frames["R"])
    separation = min(separation, len(MOCAP_POSES) - separation)
    if separation < len(MOCAP_POSES) * 0.4:
        raise RuntimeError(f"captured knees are not alternating: peaks {peak_frames}")

    for side, frame in peak_frames.items():
        phase = frame / len(MOCAP_POSES) * math.tau
        apply_walk_pose(rig, phase)
        bpy.context.view_layer.update()
        shin = rig.pose.bones[f"shin.{side}"]
        foot = rig.pose.bones[f"foot.{side}"]
        knee_y = shin.head.y
        ankle_y = shin.tail.y
        toe_y = foot.tail.y
        if ankle_y <= knee_y + 0.08:
            raise RuntimeError(
                f"{side} knee is inverted: ankle {ankle_y:.3f} is not behind knee {knee_y:.3f}"
            )
        if toe_y >= ankle_y:
            raise RuntimeError(
                f"{side} boot is reversed: toe {toe_y:.3f} is not ahead of ankle {ankle_y:.3f}"
            )
        if abs(lowest_boot_z() - 0.012) > 0.001:
            raise RuntimeError(f"{side} captured gait lost ground contact")
    clear_pose(rig)


def nearest_palette(red: float, green: float, blue: float) -> int:
    sample = (round(red * 255), round(green * 255), round(blue * 255))
    return min(
        range(1, len(PALETTE)),
        key=lambda index: sum((sample[channel] - PALETTE[index][channel]) ** 2 for channel in range(3)),
    )


def quantize_render(scene: bpy.types.Scene) -> bytes:
    # In a surfaceless Linux render Blender 4.0 does not expose Render Result pixels, even
    # though Eevee completed successfully. Loading the written PNG is stable in both GUI and
    # background modes and remains an offline-only intermediate.
    bpy.ops.render.render(write_still=True)
    result = bpy.data.images.load(scene.render.filepath, check_existing=False)
    pixels = list(result.pixels[:])
    if len(pixels) != RENDER_WIDTH * RENDER_HEIGHT * 4:
        raise RuntimeError(
            f"unexpected Render Result size {tuple(result.size)} with {len(pixels)} channels"
        )
    output = bytearray(CELL_WIDTH * CELL_HEIGHT)
    for target_y in range(CELL_HEIGHT):
        for target_x in range(CELL_WIDTH):
            samples: list[tuple[float, float, float]] = []
            for sample_y in range(SUPERSAMPLE):
                source_y_from_top = target_y * SUPERSAMPLE + sample_y
                source_y = RENDER_HEIGHT - 1 - source_y_from_top
                for sample_x in range(SUPERSAMPLE):
                    source_x = target_x * SUPERSAMPLE + sample_x
                    offset = (source_y * RENDER_WIDTH + source_x) * 4
                    alpha = pixels[offset + 3]
                    if alpha >= 0.45:
                        samples.append((pixels[offset], pixels[offset + 1], pixels[offset + 2]))
            if len(samples) < 3:
                continue
            count = len(samples)
            red = sum(sample[0] for sample in samples) / count
            green = sum(sample[1] for sample in samples) / count
            blue = sum(sample[2] for sample in samples) / count
            output[target_y * CELL_WIDTH + target_x] = nearest_palette(red, green, blue)
    bpy.data.images.remove(result)
    return bytes(output)


def encode_rle(frame: bytes) -> str:
    encoded = bytearray()
    cursor = 0
    while cursor < len(frame):
        color = frame[cursor]
        run = 1
        while cursor + run < len(frame) and frame[cursor + run] == color and run < 65535:
            run += 1
        encoded.extend((color, run & 0xFF, run >> 8))
        cursor += run
    return base64.b64encode(encoded).decode("ascii")


def save_strip(
    name: str,
    frames: Sequence[bytes],
    rows: int = 1,
    opaque_background: bool = False,
) -> None:
    columns = math.ceil(len(frames) / rows)
    width = CELL_WIDTH * columns
    height = CELL_HEIGHT * rows
    if opaque_background:
        background = (0.19, 0.18, 0.16, 1.0)
    else:
        background = (0.0, 0.0, 0.0, 0.0)
    pixels = list(background) * (width * height)
    for frame_index, frame in enumerate(frames):
        column = frame_index % columns
        row = frame_index // columns
        for y in range(CELL_HEIGHT):
            for x in range(CELL_WIDTH):
                palette_index = frame[y * CELL_WIDTH + x]
                if palette_index == 0:
                    continue
                color = PALETTE[palette_index]
                target_x = column * CELL_WIDTH + x
                target_y_from_top = row * CELL_HEIGHT + y
                target_y = height - 1 - target_y_from_top
                offset = (target_y * width + target_x) * 4
                pixels[offset : offset + 4] = [
                    color[0] / 255,
                    color[1] / 255,
                    color[2] / 255,
                    1.0,
                ]
    image = bpy.data.images.new(name, width=width, height=height, alpha=True)
    image.pixels = pixels
    image.file_format = "PNG"
    image.filepath_raw = str(ASSET_ROOT / f"{name}.png")
    image.save()
    bpy.data.images.remove(image)


def phase_starts(durations: Sequence[int]) -> Iterable[float]:
    total = sum(durations)
    elapsed = 0
    for duration in durations:
        yield elapsed / total
        elapsed += duration


def bake(scene: bpy.types.Scene, rig: bpy.types.Object) -> dict[str, object]:
    clips: dict[str, object] = {}
    walk_preview: list[bytes] = []
    idle_preview: list[bytes] = []
    for direction, rotation in DIRECTIONS.items():
        rig.rotation_euler.z = rotation
        direction_walk: list[bytes] = []
        for phase in phase_starts(WALK_DURATIONS):
            apply_walk_pose(rig, phase * math.tau)
            bpy.context.view_layer.update()
            direction_walk.append(quantize_render(scene))
        direction_idle: list[bytes] = []
        for frame in range(len(IDLE_DURATIONS)):
            apply_idle_pose(rig, frame / len(IDLE_DURATIONS) * math.tau)
            bpy.context.view_layer.update()
            direction_idle.append(quantize_render(scene))

        unique_walk_frames = len(set(direction_walk))
        unique_idle_frames = len(set(direction_idle))
        if unique_walk_frames < 8:
            raise RuntimeError(
                f"{direction} walk bake froze: {unique_walk_frames}/{len(direction_walk)} unique frames"
            )
        if unique_idle_frames < 2:
            raise RuntimeError(
                f"{direction} idle bake froze: {unique_idle_frames}/{len(direction_idle)} unique frames"
            )

        clips[f"{direction}-walk"] = {
            "durations": WALK_DURATIONS,
            "frames": [encode_rle(frame) for frame in direction_walk],
        }
        clips[f"{direction}-idle"] = {
            "durations": IDLE_DURATIONS,
            "frames": [encode_rle(frame) for frame in direction_idle],
        }
        save_strip(f"ashfall-traveler-{direction}-walk", direction_walk)
        save_strip(f"ashfall-traveler-{direction}-idle", direction_idle)
        walk_preview.extend(direction_walk)
        idle_preview.extend(direction_idle)

    save_strip("preview-walk", walk_preview, rows=len(DIRECTIONS), opaque_background=True)
    save_strip("preview-idle", idle_preview, rows=len(DIRECTIONS), opaque_background=True)
    return {
        "version": 2,
        "generator": "Blender 4.0.2 / CMU 136_22 mocap retarget",
        "cell": {"w": CELL_WIDTH, "h": CELL_HEIGHT},
        "origin": {"x": ORIGIN_X, "y": CONTACT_Y},
        "contact": {"x": ORIGIN_X, "y": CONTACT_Y},
        "palette": [list(color) for color in PALETTE],
        "clips": clips,
    }


def main() -> None:
    ASSET_ROOT.mkdir(parents=True, exist_ok=True)
    DATA_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    scene = reset_scene()
    materials = {
        "boot": material("boot", PALETTE[1]),
        "boot_light": material("boot-light", PALETTE[2]),
        "trouser_dark": material("trouser-dark", PALETTE[3]),
        "trouser": material("trouser", PALETTE[4]),
        "coat_dark": material("coat-dark", PALETTE[5]),
        "coat": material("coat", PALETTE[6]),
        "coat_light": material("coat-light", PALETTE[7]),
        "pack_dark": material("pack-dark", PALETTE[8]),
        "pack": material("pack", PALETTE[9]),
        "pack_light": material("pack-light", PALETTE[10]),
        "scarf": material("scarf", PALETTE[11]),
        "skin_dark": material("skin-dark", PALETTE[12]),
        "skin": material("skin", PALETTE[13]),
        "skin_light": material("skin-light", PALETTE[14]),
        "hair": material("hair", PALETTE[15]),
        "signal": material("signal", PALETTE[16]),
    }
    rig = create_armature()
    build_character(rig, materials)
    create_camera(scene)
    create_lighting(scene)
    create_actions(rig)
    validate_leg_flexion(rig)
    data = bake(scene, rig)
    DATA_OUTPUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    rig.rotation_euler.z = 0
    rig.animation_data.action = bpy.data.actions["walk"]
    scene.frame_start = 1
    scene.frame_end = len(MOCAP_POSES)
    scene.frame_set(1)
    scene.render.resolution_x = RENDER_WIDTH
    scene.render.resolution_y = RENDER_HEIGHT
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUTPUT))
    Path(scene.render.filepath).unlink(missing_ok=True)
    print(f"Saved {BLEND_OUTPUT}")
    print(f"Saved {DATA_OUTPUT}")


if __name__ == "__main__":
    main()
