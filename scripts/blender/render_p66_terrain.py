"""Render the authored P66 lunar corridor as low-resolution exterior plates.

Blender is an offline authoring tool only. Phaser remains the runtime engine. Coordinates and
terrain bands are gameplay adaptations documented in CAMPAIGN.md, not surveyed Apollo 11 data.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector


CONTENT_WIDTH = 320
CONTENT_HEIGHT = 180
WIDTH = 352
HEIGHT = 198
FORWARD_ORIGIN = 900.0
FORWARD_SCALE = 2.0

CRATERS = (
    (-24.0, 1050.0, 72.0, 23.0),
    (170.0, 1190.0, 24.0, 5.0),
    (-230.0, 1255.0, 18.0, 4.0),
    (310.0, 1720.0, 16.0, 3.5),
    (20.0, 1478.0, 11.0, 2.2),
    (-35.0, 1540.0, 9.0, 1.7),
)

HERO_ROCKS = (
    (-118.0, 1090.0, 13.0),
    (82.0, 1115.0, 17.0),
    (-35.0, 1145.0, 11.0),
    (48.0, 1175.0, 15.0),
    (-104.0, 1215.0, 17.0),
    (112.0, 1245.0, 12.0),
    (-62.0, 1275.0, 9.0),
    (-210.0, 1330.0, 10.0),
    (-25.0, 1390.0, 2.0),
    (35.0, 1430.0, 1.8),
    (-45.0, 1480.0, 2.4),
    (230.0, 1410.0, 8.0),
    (-260.0, 1520.0, 9.0),
    (-12.0, 1475.0, 1.2),
    (18.0, 1492.0, 0.8),
    (-30.0, 1530.0, 1.5),
    (45.0, 1560.0, 1.0),
)

PREVIEW_STATES = (
    ("200ft", 900.0, 200.0),
    ("120ft", 1075.0, 120.0),
    ("065ft", 1350.0, 65.0),
    ("020ft", 1455.0, 20.0),
)

GRID_DOWNRANGE = (
    900.0, 925.0, 950.0, 975.0, 1000.0, 1025.0, 1050.0, 1075.0,
    1100.0, 1125.0, 1150.0, 1175.0, 1200.0, 1225.0, 1250.0, 1275.0,
    1300.0, 1325.0, 1350.0, 1400.0, 1450.0, 1500.0, 1600.0, 1800.0, 2200.0,
)
GRID_ALTITUDE = (
    200.0, 175.0, 150.0, 125.0, 100.0, 80.0, 70.0, 60.0,
    50.0, 40.0, 30.0, 20.0, 15.0, 10.0, 5.0, 0.0,
)


def create_micro_craters() -> tuple[tuple[float, float, float, float], ...]:
    randomizer = random.Random(196907201)
    craters: list[tuple[float, float, float, float]] = []
    while len(craters) < 46:
        x = randomizer.uniform(-620.0, 620.0)
        y = randomizer.uniform(940.0, 2350.0)
        radius = randomizer.uniform(8.0, 24.0)
        if 1330.0 <= y <= 1850.0 and abs(x) < 145.0 and randomizer.random() < 0.5:
            continue
        craters.append((x, y, radius, radius * randomizer.uniform(0.12, 0.26)))
    return tuple(craters)


MICRO_CRATERS = create_micro_craters()


def parse_arguments() -> argparse.Namespace:
    raw = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--mode", choices=("preview", "grid", "row", "manifest"), default="preview")
    parser.add_argument("--downrange", type=float)
    return parser.parse_args(raw)


def scene_forward(game_downrange: float) -> float:
    """Map provisional gameplay feet to authored scene depth without changing event timing."""
    return FORWARD_ORIGIN + (game_downrange - FORWARD_ORIGIN) * FORWARD_SCALE


def crater_height(x: float, y: float, crater: tuple[float, float, float, float]) -> float:
    center_x, game_center_y, radius, depth = crater
    distance = math.hypot(x - center_x, y - scene_forward(game_center_y))
    normalized = distance / radius
    depression = 0.0
    if normalized < 1.0:
        depression = -depth * (1.0 - normalized * normalized) ** 2
    rim_width = radius * 0.13
    rim = depth * 0.18 * math.exp(-((distance - radius) / rim_width) ** 2)
    return depression + rim


def terrain_height(x: float, y: float) -> float:
    broad = (
        math.sin(x * 0.010 + y * 0.003) * 1.1
        + math.sin(x * 0.027 - y * 0.009) * 0.55
        + math.cos(y * 0.018) * 0.38
    )
    detail = math.sin(x * 0.091 + y * 0.073) * 0.18 + math.cos(x * 0.047 - y * 0.123) * 0.12
    return broad + detail + sum(crater_height(x, y, crater) for crater in (*CRATERS, *MICRO_CRATERS))


def reset_scene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    if hasattr(scene, "eevee"):
        scene.eevee.taa_render_samples = 16
    scene.render.resolution_x = WIDTH
    scene.render.resolution_y = HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    scene.render.pixel_aspect_x = 1
    scene.render.pixel_aspect_y = 1
    scene.render.filepath = ""
    scene.render.use_file_extension = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world = bpy.data.worlds.new("Lunar black sky")
    scene.world.color = (0.0, 0.0, 0.0)
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    if background is not None:
        background.inputs["Color"].default_value = (0.001, 0.0015, 0.003, 1.0)
        background.inputs["Strength"].default_value = 0.018
    return scene


def make_ground_material() -> bpy.types.Material:
    material = bpy.data.materials.new("Regolith")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    principled = nodes.new("ShaderNodeBsdfPrincipled")
    geometry = nodes.new("ShaderNodeNewGeometry")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.38
    noise.inputs["Detail"].default_value = 1.4
    noise.inputs["Roughness"].default_value = 0.56
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "LINEAR"
    ramp.color_ramp.elements[0].position = 0.26
    ramp.color_ramp.elements[0].color = (0.35, 0.365, 0.39, 1.0)
    ramp.color_ramp.elements[1].position = 0.74
    ramp.color_ramp.elements[1].color = (0.455, 0.47, 0.495, 1.0)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    bump.inputs["Distance"].default_value = 0.12
    principled.inputs["Roughness"].default_value = 0.93
    principled.inputs["Specular IOR Level"].default_value = 0.12
    links.new(geometry.outputs["Position"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    links.new(principled.outputs["BSDF"], output.inputs["Surface"])
    return material


def make_rock_material() -> bpy.types.Material:
    material = bpy.data.materials.new("Rock")
    material.diffuse_color = (0.31, 0.32, 0.35, 1.0)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is not None:
        principled.inputs["Base Color"].default_value = (0.27, 0.285, 0.31, 1.0)
        principled.inputs["Roughness"].default_value = 0.96
        principled.inputs["Specular IOR Level"].default_value = 0.08
    return material


def create_terrain(material: bpy.types.Material) -> bpy.types.Object:
    columns = 385
    rows = 513
    minimum_x, maximum_x = -1800.0, 1800.0
    minimum_y, maximum_y = scene_forward(820.0), scene_forward(3000.0)
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for row in range(rows):
        y = minimum_y + (maximum_y - minimum_y) * row / (rows - 1)
        for column in range(columns):
            x = minimum_x + (maximum_x - minimum_x) * column / (columns - 1)
            vertices.append((x, y, terrain_height(x, y)))
    for row in range(rows - 1):
        for column in range(columns - 1):
            a = row * columns + column
            faces.append((a, a + 1, a + columns + 1, a + columns))

    mesh = bpy.data.meshes.new("P66 corridor mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    terrain = bpy.data.objects.new("P66 lunar corridor", mesh)
    bpy.context.collection.objects.link(terrain)
    terrain.data.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return terrain


def rock_points() -> list[tuple[float, float, float]]:
    points = list(HERO_ROCKS)
    randomizer = random.Random(11071969)
    for _ in range(82):
        y = randomizer.uniform(970.0, 2240.0)
        x = randomizer.uniform(-520.0, 520.0)
        size = randomizer.uniform(2.0, 7.5)
        if 1330.0 <= y <= 1850.0 and abs(x) < 145.0:
            if randomizer.random() < 0.82:
                continue
            x += -120.0 if x < 0 else 120.0
        points.append((x, y, size))
    return points


def create_rocks(material: bpy.types.Material) -> bpy.types.Object:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    randomizer = random.Random(19690720)
    for x, game_y, radius in rock_points():
        base = len(vertices)
        y = scene_forward(game_y)
        ground = terrain_height(x, y)
        angle = randomizer.uniform(0.0, math.tau)
        stretch = randomizer.uniform(0.72, 1.28)
        base_ring: list[tuple[float, float, float]] = []
        shoulder_ring: list[tuple[float, float, float]] = []
        sides = 7
        for index in range(sides):
            theta = angle + math.tau * index / sides
            irregularity = randomizer.uniform(0.78, 1.16)
            base_ring.append((
                x + math.cos(theta) * radius * irregularity * stretch,
                y + math.sin(theta) * radius * irregularity / stretch,
                ground - radius * 0.06,
            ))
            shoulder_ring.append((
                x + math.cos(theta + 0.16) * radius * irregularity * stretch * 0.58,
                y + math.sin(theta + 0.16) * radius * irregularity / stretch * 0.58,
                ground + radius * randomizer.uniform(0.42, 0.56),
            ))
        vertices.extend(base_ring)
        vertices.extend(shoulder_ring)
        vertices.append((
            x + randomizer.uniform(-0.18, 0.18) * radius,
            y + randomizer.uniform(-0.18, 0.18) * radius,
            ground + radius * randomizer.uniform(0.62, 0.76),
        ))
        cap = base + sides * 2
        for index in range(sides):
            next_index = (index + 1) % sides
            faces.append((base + index, base + next_index, base + sides + next_index))
            faces.append((base + index, base + sides + next_index, base + sides + index))
            faces.append((base + sides + index, base + sides + next_index, cap))

    mesh = bpy.data.meshes.new("P66 boulder mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    rocks = bpy.data.objects.new("P66 boulders", mesh)
    bpy.context.collection.objects.link(rocks)
    rocks.data.materials.append(material)
    return rocks


def add_sun() -> None:
    light_data = bpy.data.lights.new("Unfiltered lunar sun", type="SUN")
    light_data.energy = 4.4
    light_data.angle = math.radians(0.18)
    light = bpy.data.objects.new("Unfiltered lunar sun", light_data)
    bpy.context.collection.objects.link(light)
    direction = Vector((-0.65, -0.72, -0.24))
    light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera() -> bpy.types.Object:
    camera_data = bpy.data.cameras.new("P66 commander view")
    # Wider source framing supplies a 10% overscan border. The central 320 × 180 crop keeps the
    # approved composition and pixel density used by the cockpit window.
    camera_data.lens = 19.0 * CONTENT_WIDTH / WIDTH
    camera_data.sensor_width = 36.0
    camera_data.clip_start = 1.0
    camera_data.clip_end = 5200.0
    camera = bpy.data.objects.new("P66 commander view", camera_data)
    bpy.context.collection.objects.link(camera)
    return camera


def position_camera(camera: bpy.types.Object, downrange: float, altitude: float) -> None:
    visual_downrange = scene_forward(downrange)
    ground = terrain_height(0.0, visual_downrange)
    camera.location = (0.0, visual_downrange, ground + max(4.0, altitude))
    progress = max(0.0, min(1.0, (200.0 - altitude) / 200.0))
    pitch = math.radians(24.0 + progress * 17.0)
    direction = Vector((0.0, math.cos(pitch), -math.sin(pitch)))
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_states(
    scene: bpy.types.Scene,
    camera: bpy.types.Object,
    output: Path,
    mode: str,
    row_downrange: float | None,
) -> None:
    output.mkdir(parents=True, exist_ok=True)
    scene.camera = camera
    if mode == "preview":
        states = [(name, downrange, altitude) for name, downrange, altitude in PREVIEW_STATES]
    elif mode in ("grid", "manifest"):
        states = [
            (f"frame-{downrange_index * len(GRID_ALTITUDE) + altitude_index:03d}", downrange, altitude)
            for downrange_index, downrange in enumerate(GRID_DOWNRANGE)
            for altitude_index, altitude in enumerate(GRID_ALTITUDE)
        ]
    else:
        if row_downrange is None or row_downrange not in GRID_DOWNRANGE:
            raise ValueError("--mode row requires an exact --downrange value from GRID_DOWNRANGE")
        downrange_index = GRID_DOWNRANGE.index(row_downrange)
        states = [
            (f"frame-{downrange_index * len(GRID_ALTITUDE) + altitude_index:03d}", row_downrange, altitude)
            for altitude_index, altitude in enumerate(GRID_ALTITUDE)
        ]

    if mode != "manifest":
        for name, downrange, altitude in states:
            position_camera(camera, downrange, altitude)
            scene.render.filepath = str(output / f"p66-{name}.png")
            bpy.ops.render.render(write_still=True)

    manifest = {
        "logicalWidth": WIDTH,
        "logicalHeight": HEIGHT,
        "contentWidth": CONTENT_WIDTH,
        "contentHeight": CONTENT_HEIGHT,
        "mode": "grid" if mode == "manifest" else mode,
        "downrangeFt": list(GRID_DOWNRANGE) if mode in ("grid", "manifest") else None,
        "altitudeFt": list(GRID_ALTITUDE) if mode in ("grid", "manifest") else None,
        "frames": [
            {"name": name, "downrangeFt": downrange, "altitudeFt": altitude}
            for name, downrange, altitude in states
        ],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def main() -> None:
    arguments = parse_arguments()
    scene = reset_scene()
    ground_material = make_ground_material()
    rock_material = make_rock_material()
    create_terrain(ground_material)
    create_rocks(rock_material)
    add_sun()
    camera = add_camera()
    render_states(
        scene,
        camera,
        Path(arguments.output).resolve(),
        arguments.mode,
        arguments.downrange,
    )


if __name__ == "__main__":
    main()
