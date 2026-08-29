"""Build the animated low-poly professor character and export it as GLB.

The script is deliberately self-contained: meshes and tiny raster textures are authored
offline in pinned Blender, while Babylon.js owns the runtime camera, lights and rendering.

Usage:
    scripts/blender/run.sh --background --python scripts/blender/einstein_diorama.py -- \
        --output public/assets/einstein-diorama/einstein-lab.glb \
        --preview public/assets/einstein-diorama/preview.png
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from pathlib import Path
from typing import Callable, Sequence

import bpy
from mathutils import Vector


Color = tuple[float, float, float, float]


def parse_args() -> argparse.Namespace:
    payload = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Author the animated low-poly professor")
    parser.add_argument("--output", required=True, help="Output GLB path")
    parser.add_argument("--preview", required=True, help="Output preview PNG path")
    parser.add_argument("--motion-source", required=True, help="Quaternius CC0 animation GLB")
    return parser.parse_args(payload)


def srgb(hex_color: str) -> Color:
    value = hex_color.lstrip("#")
    if len(value) != 6:
        raise ValueError(f"invalid hex color {hex_color}")
    return (
        int(value[0:2], 16) / 255,
        int(value[2:4], 16) / 255,
        int(value[4:6], 16) / 255,
        1.0,
    )


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.images,
    ):
        for item in list(collection):
            collection.remove(item)


def pixel_image(
    output_dir: Path,
    name: str,
    colors: Sequence[Color],
    pattern: Callable[[int, int], int],
    size: int = 16,
) -> bpy.types.Image:
    image = bpy.data.images.new(name, width=size, height=size, alpha=True)
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            pixels.extend(colors[pattern(x, y) % len(colors)])
    image.pixels.foreach_set(pixels)
    image.file_format = "PNG"
    image.filepath_raw = str(output_dir / f"{name}.png")
    image.save()
    image.pack()
    return image


def textured_material(
    name: str,
    image: bpy.types.Image,
    *,
    roughness: float = 0.82,
    metallic: float = 0.0,
    emission: Color | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    coordinates = nodes.new("ShaderNodeTexCoord")
    texture.image = image
    texture.interpolation = "Closest"
    texture.extension = "REPEAT"
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if emission is not None:
        emission_input = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
        if emission_input is not None:
            emission_input.default_value = emission
        strength_input = shader.inputs.get("Emission Strength")
        if strength_input is not None:
            strength_input.default_value = emission_strength
    links.new(coordinates.outputs["Generated"], texture.inputs["Vector"])
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def assign_material(obj: bpy.types.Object, material: bpy.types.Material) -> None:
    if obj.data is not None and hasattr(obj.data, "materials"):
        obj.data.materials.append(material)


def apply_scale(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def bevel(obj: bpy.types.Object, width: float) -> None:
    if width <= 0:
        return
    modifier = obj.modifiers.new(name="single facet bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = 1
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def cube(
    name: str,
    location: Sequence[float],
    scale: Sequence[float],
    material: bpy.types.Material,
    *,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
    bevel_width: float = 0.025,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_scale(obj)
    bevel(obj, bevel_width)
    assign_material(obj, material)
    return obj


def ico(
    name: str,
    location: Sequence[float],
    scale: Sequence[float],
    material: bpy.types.Material,
    *,
    subdivisions: int = 1,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    apply_scale(obj)
    assign_material(obj, material)
    return obj


def cylinder(
    name: str,
    location: Sequence[float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    *,
    vertices: int = 8,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    bevel(obj, min(radius * 0.12, 0.025))
    assign_material(obj, material)
    return obj


def cylinder_between(
    name: str,
    start: Sequence[float],
    end: Sequence[float],
    radius: float,
    material: bpy.types.Material,
    *,
    vertices: int = 8,
) -> bpy.types.Object:
    start_vec = Vector(start)
    end_vec = Vector(end)
    direction = end_vec - start_vec
    obj = cylinder(name, (start_vec + end_vec) / 2, radius, direction.length, material, vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    return obj


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


def bone_world(armature: bpy.types.Object, bone_name: str, *, tail: bool = False) -> Vector:
    bone = armature.pose.bones[bone_name]
    return armature.matrix_world @ (bone.tail if tail else bone.head)


def bone_segment(
    armature: bpy.types.Object,
    bone_name: str,
    name: str,
    radius: float,
    material: bpy.types.Material,
    *,
    length_scale: float = 0.9,
    vertices: int = 7,
) -> bpy.types.Object:
    head = bone_world(armature, bone_name)
    tail = bone_world(armature, bone_name, tail=True)
    inset = (tail - head) * ((1 - length_scale) / 2)
    obj = cylinder_between(name, head + inset, tail - inset, radius, material, vertices=vertices)
    parent_to_bone(obj, armature, bone_name)
    return obj


def look_at(obj: bpy.types.Object, target: Sequence[float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def build_materials(output_dir: Path) -> dict[str, bpy.types.Material]:
    images = {
        "suit": pixel_image(
            output_dir,
            "tex-suit-16",
            [srgb("#4a403d"), srgb("#554a45"), srgb("#332e2d")],
            lambda x, y: 2 if x % 4 == 0 and y % 4 == 0 else (x + y) % 2,
        ),
        "skin": pixel_image(
            output_dir,
            "tex-skin-16",
            [srgb("#d2a079"), srgb("#e1b48e"), srgb("#b97f61")],
            lambda x, y: 2 if (x + 2 * y) % 9 == 0 else (x // 6 + y // 5) % 2,
        ),
        "hair": pixel_image(
            output_dir,
            "tex-hair-16",
            [srgb("#ddd8c9"), srgb("#f2eedf"), srgb("#a9aa9f")],
            lambda x, y: 2 if (x * 3 + y * 5) % 7 == 0 else (x // 3 + y // 2) % 2,
        ),
        "chalk": pixel_image(
            output_dir,
            "tex-chalk-16",
            [srgb("#d8dfc4"), srgb("#f3f0d5"), srgb("#a9c1ad")],
            lambda x, y: 2 if (x + y) % 5 == 0 else (x + y) % 2,
        ),
        "dark": pixel_image(
            output_dir,
            "tex-dark-16",
            [srgb("#171719"), srgb("#242327"), srgb("#08090b")],
            lambda x, y: 2 if (x + y * 2) % 11 == 0 else (x + y) % 2,
        ),
        "paper": pixel_image(
            output_dir,
            "tex-paper-16",
            [srgb("#d7cfaa"), srgb("#eee6c8"), srgb("#9d8f70")],
            lambda x, y: 2 if y in (4, 9, 13) else (x + y) % 2,
        ),
    }
    return {
        "suit": textured_material("MAT_Suit_Pixel", images["suit"]),
        "skin": textured_material("MAT_Skin_Pixel", images["skin"]),
        "hair": textured_material("MAT_Hair_Pixel", images["hair"], roughness=0.94),
        "chalk": textured_material("MAT_Chalk_Pixel", images["chalk"], roughness=1.0),
        "dark": textured_material("MAT_Dark_Pixel", images["dark"], roughness=0.68),
        "paper": textured_material("MAT_Paper_Pixel", images["paper"], roughness=0.94),
    }


def build_professor(
    materials: dict[str, bpy.types.Material],
    armature: bpy.types.Object,
) -> None:
    suit = materials["suit"]
    skin = materials["skin"]
    hair = materials["hair"]
    dark = materials["dark"]
    paper = materials["paper"]
    chalk = materials["chalk"]

    t_pose = bpy.data.actions.get("A_TPose")
    if t_pose is None:
        raise RuntimeError("motion source is missing A_TPose")
    armature.animation_data_create()
    armature.animation_data.action = t_pose
    bpy.context.scene.frame_set(0)
    bpy.context.view_layer.update()

    hips = bone_world(armature, "DEF-hips")
    chest = bone_world(armature, "DEF-spine.002")
    neck = bone_world(armature, "DEF-neck")
    head_bone = bone_world(armature, "DEF-head")
    head_center = head_bone + Vector((0, -0.015, 0.19))

    # The broad jacket and oversized head preserve the original caricature while
    # every rigid low-poly part inherits motion from a proven humanoid skeleton.
    jacket = cube(
        "Character_Jacket",
        (chest.x, chest.y + 0.06, (hips.z + neck.z) / 2 - 0.02),
        (0.53, 0.32, (neck.z - hips.z) * 0.47),
        suit,
        rotation=(0.055, 0, 0),
        bevel_width=0.10,
    )
    parent_to_bone(jacket, armature, "DEF-spine.002")
    for name, location, scale, material, rotation, width in (
        ("Character_Shirt", (chest.x, chest.y - 0.285, chest.z + 0.06), (0.18, 0.035, 0.29), paper, (0.055, 0, 0), 0.015),
        ("Character_Vest", (chest.x, chest.y - 0.315, chest.z - 0.22), (0.29, 0.04, 0.20), dark, (0.055, 0, 0), 0.02),
        ("Character_BowTie_L", (chest.x - 0.09, chest.y - 0.34, neck.z - 0.15), (0.10, 0.035, 0.07), dark, (0.07, 0.18, -0.28), 0.025),
        ("Character_BowTie_R", (chest.x + 0.09, chest.y - 0.34, neck.z - 0.15), (0.10, 0.035, 0.07), dark, (0.07, -0.18, 0.28), 0.025),
    ):
        part = cube(name, location, scale, material, rotation=rotation, bevel_width=width)
        parent_to_bone(part, armature, "DEF-spine.002")

    neck_mesh = cylinder(
        "Character_Neck",
        neck + Vector((0, 0, 0.05)),
        0.17,
        0.24,
        skin,
        vertices=8,
    )
    parent_to_bone(neck_mesh, armature, "DEF-neck")

    head = ico(
        "Character_Head",
        head_center,
        (0.40, 0.34, 0.48),
        skin,
        subdivisions=2,
        rotation=(0.04, 0, 0),
    )
    parent_to_bone(head, armature, "DEF-head")
    face_parts = (
        ("Character_Ear_L", head_center + Vector((-0.39, 0.0, 0.01)), (0.10, 0.07, 0.15), skin, (0, 0, 0)),
        ("Character_Ear_R", head_center + Vector((0.39, 0.0, 0.01)), (0.10, 0.07, 0.15), skin, (0, 0, 0)),
        ("Character_Nose", head_center + Vector((0, -0.36, 0)), (0.12, 0.16, 0.13), skin, (0, 0, 0)),
        ("Character_Eye_L", head_center + Vector((-0.14, -0.32, 0.12)), (0.045, 0.025, 0.045), dark, (0, 0, 0)),
        ("Character_Eye_R", head_center + Vector((0.14, -0.32, 0.12)), (0.045, 0.025, 0.045), dark, (0, 0, 0)),
    )
    for name, location, scale, material, rotation in face_parts:
        part = ico(name, location, scale, material, rotation=rotation)
        parent_to_bone(part, armature, "DEF-head")

    for name, location, scale, rotation, width in (
        ("Character_Brow_L", head_center + Vector((-0.15, -0.35, 0.21)), (0.13, 0.025, 0.035), (0.1, 0.03, -0.12), 0.018),
        ("Character_Brow_R", head_center + Vector((0.15, -0.35, 0.21)), (0.13, 0.025, 0.035), (0.1, -0.03, 0.12), 0.018),
        ("Character_Mustache_L", head_center + Vector((-0.12, -0.38, -0.13)), (0.16, 0.045, 0.07), (-0.08, 0.12, -0.26), 0.035),
        ("Character_Mustache_R", head_center + Vector((0.12, -0.38, -0.13)), (0.16, 0.045, 0.07), (-0.08, -0.12, 0.26), 0.035),
    ):
        part = cube(name, location, scale, hair, rotation=rotation, bevel_width=width)
        parent_to_bone(part, armature, "DEF-head")

    hair_clusters = [
        (-0.39, 0.03, 0.12, (0.22, 0.19, 0.25)),
        (-0.44, 0.08, 0.30, (0.20, 0.18, 0.24)),
        (-0.37, 0.10, 0.48, (0.23, 0.19, 0.25)),
        (-0.20, 0.10, 0.60, (0.24, 0.18, 0.20)),
        (0.02, 0.10, 0.65, (0.23, 0.17, 0.18)),
        (0.22, 0.10, 0.62, (0.25, 0.18, 0.20)),
        (0.40, 0.08, 0.49, (0.22, 0.19, 0.24)),
        (0.46, 0.04, 0.30, (0.21, 0.18, 0.25)),
        (0.40, 0.02, 0.12, (0.22, 0.19, 0.25)),
        (-0.53, 0.13, 0.46, (0.19, 0.17, 0.23)),
        (0.54, 0.12, 0.45, (0.20, 0.17, 0.23)),
        (-0.34, 0.16, 0.64, (0.20, 0.16, 0.19)),
        (0.38, 0.15, 0.66, (0.21, 0.16, 0.19)),
    ]
    for index, (x, y, z, scale) in enumerate(hair_clusters):
        cluster = ico(
            f"Character_Hair_{index:02d}",
            head_center + Vector((x, y, z)),
            scale,
            hair,
            subdivisions=1,
            rotation=(index * 0.23, index * 0.11, index * 0.17),
        )
        parent_to_bone(cluster, armature, "DEF-head")

    # Rigid limbs preserve the faceted style but receive authored joint motion.
    for side in ("L", "R"):
        suffix = side
        upper_arm = f"DEF-upper_arm.{side}"
        forearm = f"DEF-forearm.{side}"
        hand_bone = f"DEF-hand.{side}"
        thigh = f"DEF-thigh.{side}"
        shin = f"DEF-shin.{side}"
        toe = f"DEF-toe.{side}"
        bone_segment(armature, upper_arm, f"Character_UpperArm_{suffix}", 0.13, suit)
        bone_segment(armature, forearm, f"Character_Forearm_{suffix}", 0.115, suit)
        bone_segment(armature, thigh, f"Character_Thigh_{suffix}", 0.16, suit)
        bone_segment(armature, shin, f"Character_Shin_{suffix}", 0.15, suit)

        shoulder = ico(
            f"Character_Shoulder_{suffix}",
            bone_world(armature, upper_arm),
            (0.18, 0.17, 0.18),
            suit,
        )
        parent_to_bone(shoulder, armature, upper_arm)
        hand_location = bone_world(armature, hand_bone)
        hand = ico(
            f"Character_Hand_{suffix}",
            hand_location,
            (0.12, 0.10, 0.14),
            skin,
        )
        parent_to_bone(hand, armature, hand_bone)
        toe_location = bone_world(armature, toe)
        shoe = cube(
            f"Character_Shoe_{suffix}",
            toe_location + Vector((0, -0.10, 0.08)),
            (0.18, 0.30, 0.10),
            dark,
            rotation=(0, 0, 0.04 if side == "L" else -0.04),
            bevel_width=0.045,
        )
        parent_to_bone(shoe, armature, toe)

    hand_r = bone_world(armature, "DEF-hand.R")
    chalk_mesh = cylinder(
        "Character_Chalk",
        hand_r + Vector((0, -0.15, 0.05)),
        0.025,
        0.17,
        chalk,
        vertices=6,
        rotation=(0.28, 0.05, -0.30),
    )
    parent_to_bone(chalk_mesh, armature, "DEF-hand.R")


def configure_preview(preview_path: Path, armature: bpy.types.Object) -> None:
    scene = bpy.context.scene
    idle = bpy.data.actions.get("Idle_Loop")
    if idle is None:
        raise RuntimeError("motion source is missing Idle_Loop")
    armature.animation_data.action = idle
    armature.location = (0, 0, 0.13)
    scene.frame_set(18)
    bpy.context.view_layer.update()
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    scene.render.filepath = str(preview_path)
    scene.render.image_settings.color_management = "FOLLOW_SCENE"
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = bpy.data.worlds.new("PreviewWorld")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#071015")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.28
    scene.world = world

    camera_data = bpy.data.cameras.new("PreviewCamera")
    camera = bpy.data.objects.new("PreviewCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (7.7, -9.6, 6.2)
    camera_data.lens = 54
    look_at(camera, (0.0, 0.0, 1.72))
    scene.camera = camera

    key_data = bpy.data.lights.new("PreviewKey", type="AREA")
    key_data.energy = 950
    key_data.color = (1.0, 0.57, 0.29)
    key_data.shape = "DISK"
    key_data.size = 4.0
    key = bpy.data.objects.new("PreviewKey", key_data)
    bpy.context.collection.objects.link(key)
    key.location = (-3.2, -3.0, 6.4)
    look_at(key, (0.3, 0.2, 1.6))

    rim_data = bpy.data.lights.new("PreviewRim", type="AREA")
    rim_data.energy = 1150
    rim_data.color = (0.27, 0.58, 1.0)
    rim_data.size = 3.0
    rim = bpy.data.objects.new("PreviewRim", rim_data)
    bpy.context.collection.objects.link(rim)
    rim.location = (3.2, 2.1, 5.0)
    look_at(rim, (0.8, 0.2, 2.0))

    fill_data = bpy.data.lights.new("PreviewFill", type="AREA")
    fill_data.energy = 430
    fill_data.color = (0.36, 0.77, 0.82)
    fill_data.size = 5.0
    fill = bpy.data.objects.new("PreviewFill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-5.0, 0.5, 3.0)
    look_at(fill, (-0.5, 0.8, 1.6))

    bpy.ops.render.render(write_still=True)

    armature.location = (0, 0, 0.13)
    scene.frame_set(0)
    bpy.context.view_layer.update()


def export_glb(output_path: Path) -> None:
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
        export_yup=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_nla_strips=False,
        export_optimize_animation_size=True,
        export_anim_slide_to_zero=True,
    )


def main() -> None:
    args = parse_args()
    output_path = Path(args.output).expanduser().resolve()
    preview_path = Path(args.preview).expanduser().resolve()
    motion_source = Path(args.motion_source).expanduser().resolve()
    if output_path.suffix.lower() != ".glb":
        raise ValueError("--output must use the .glb extension")
    if preview_path.suffix.lower() != ".png":
        raise ValueError("--preview must use the .png extension")
    if not motion_source.is_file():
        raise FileNotFoundError(motion_source)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    for stale_texture in (
        "tex-wall-16.png",
        "tex-floor-16.png",
        "tex-wood-16.png",
        "tex-board-16.png",
        "tex-metal-16.png",
        "tex-brass-16.png",
        "tex-glow-16.png",
    ):
        (output_path.parent / stale_texture).unlink(missing_ok=True)

    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(motion_source))
    armature = next(
        (obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"),
        None,
    )
    if armature is None:
        raise RuntimeError("motion source did not contain an armature")
    for obj in tuple(bpy.context.scene.objects):
        if obj is not armature:
            bpy.data.objects.remove(obj, do_unlink=True)
    armature.name = "Character_Rig"
    armature.scale = (1.65, 1.65, 1.65)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    armature.select_set(False)
    armature.animation_data_create()

    materials = build_materials(output_path.parent)
    build_professor(materials, armature)
    configure_preview(preview_path, armature)

    retained_actions = {"Idle_Loop", "Walk_Loop"}
    for action in tuple(bpy.data.actions):
        if action.name not in retained_actions:
            bpy.data.actions.remove(action)
    idle = bpy.data.actions.get("Idle_Loop")
    if idle is None or bpy.data.actions.get("Walk_Loop") is None:
        raise RuntimeError("motion source is missing required locomotion clips")
    armature.animation_data.action = idle
    export_glb(output_path)

    mesh_count = sum(1 for obj in bpy.context.scene.objects if obj.type == "MESH")
    print(f"Exported {mesh_count} low-poly meshes to {output_path}")
    print("Exported Idle_Loop and Walk_Loop from the pinned CC0 motion source")
    print(f"Rendered catalog preview to {preview_path}")


if __name__ == "__main__":
    main()
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)
