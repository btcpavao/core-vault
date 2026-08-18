"""Build Core Vault Engine Room ER-05: Final Lighting / Energy Match.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er05.py

ER-05 rebuilds the approved ER-04c geometry, normals and material state, then
replaces neutral utility review lights with the final Mediterranean daylight
hierarchy.  A separate, clearly named energy collection visualizes the truthful
Ready / Active Core state.  Runtime integration and GLB export remain deferred.
"""

from pathlib import Path
import math
import sys

import bpy


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import build_er01 as er01
import build_er02 as er02
import build_er03 as er03
import build_er04 as er04
import build_er04b as er04b
import build_er04c as er04c


REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-05-lighting-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-05-lighting-alternate.png"
ENERGY_CLOSEUP_PATH = REVIEW_DIR / "er-05-reactor-energy-closeup.png"
MAIN_CENTER = er03.REACTOR_CENTER
SECONDARY_CENTER = (4.60, 7.00)


def set_input(shader, name, value):
    if name in shader.inputs:
        shader.inputs[name].default_value = value


def make_energy_material(name, color, strength, family):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.name = "CV_Energy_Output"
    output.label = "Energy Output"
    output.location = (360, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.name = "CV_Energy_Principled"
    shader.label = "Controlled Active Blue Energy"
    shader.location = (40, 0)
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    set_input(shader, "Base Color", (color[0] * 0.12, color[1] * 0.18, color[2] * 0.28, 1.0))
    set_input(shader, "Metallic", 0.0)
    set_input(shader, "Roughness", 0.24)
    set_input(shader, "Emission Color", (*color, 1.0))
    set_input(shader, "Emission Strength", strength)
    material.diffuse_color = (*color, 1.0)
    material["CV_MaterialFamily"] = family
    material["CV_TruthState"] = "Ready / Active Core"
    material["CV_RuntimeOwnership"] = "Blender hero-state preview; runtime must drive actual state"
    return material


def add_energy_curve(name, points, bevel_depth, material, collection, cyclic=False):
    curve_data = bpy.data.curves.new(f"{name}_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 2
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 3
    curve_data.resolution_u = 3
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1.0)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve_data)
    curve_data.materials.append(material)
    collection.objects.link(obj)
    obj["CV_EnergyRole"] = "Ready / Active Core authored energy"
    return obj


def helix_points(center, z_min, z_max, radius, turns, count, phase=0.0, breathing=0.0):
    points = []
    for index in range(count):
        t = index / (count - 1)
        angle = phase + math.tau * turns * t
        local_radius = radius * (1.0 + breathing * math.sin(math.tau * 2.0 * t + phase))
        points.append((
            center[0] + math.cos(angle) * local_radius,
            center[1] + math.sin(angle) * local_radius,
            z_min + (z_max - z_min) * t,
        ))
    return points


def ring_points(center, z, radius, count=128, phase=0.0, wave=0.022):
    points = []
    for index in range(count):
        t = index / count
        angle = phase + math.tau * t
        local_radius = radius * (1.0 + 0.018 * math.sin(angle * 3.0 + phase))
        points.append((
            center[0] + math.cos(angle) * local_radius,
            center[1] + math.sin(angle) * local_radius,
            z + wave * math.sin(angle * 2.0 + phase),
        ))
    return points


def arc_points(center, z, radius, span, count=104, phase=0.0, wave=0.030):
    """Return an intentionally incomplete, gently irregular energy arc."""
    points = []
    for index in range(count):
        t = index / (count - 1)
        angle = phase + math.tau * span * t
        local_radius = radius * (
            1.0
            + 0.032 * math.sin(angle * 2.7 + phase)
            + 0.014 * math.sin(math.tau * 3.0 * t)
        )
        points.append((
            center[0] + math.cos(angle) * local_radius,
            center[1] + math.sin(angle) * local_radius,
            z + wave * math.sin(angle * 2.0 + phase),
        ))
    return points


def add_energy_point_light(name, location, energy, color, radius, collection):
    light_data = bpy.data.lights.new(name=name, type="POINT")
    light_data.energy = energy
    light_data.color = color
    light_data.shadow_soft_size = radius
    light_data.use_shadow = False
    light = bpy.data.objects.new(name, light_data)
    light.location = location
    light["CV_EnergyRole"] = "Controlled blue contribution from active core"
    collection.objects.link(light)
    return light


def build_main_energy(collection, materials):
    cx, cy = MAIN_CENTER
    add_energy_curve(
        "CV_Energy_Main_PrimaryHelix",
        helix_points((cx, cy), 1.46, 4.78, 0.66, 3.25, 220, 0.25, 0.10),
        0.013, materials["core"], collection)
    add_energy_curve(
        "CV_Energy_Main_SecondaryHelix",
        helix_points((cx, cy), 1.50, 4.72, 0.42, -4.10, 220, 2.40, 0.08),
        0.007, materials["accent"], collection)
    add_energy_curve(
        "CV_Energy_Main_AxisFilament",
        helix_points((cx, cy), 1.42, 4.82, 0.13, 1.35, 180, 1.15, 0.16),
        0.010, materials["core"], collection)
    add_energy_curve(
        "CV_Energy_Main_FineFilament",
        helix_points((cx, cy), 1.55, 4.68, 0.27, 5.15, 260, 0.72, 0.15),
        0.0045, materials["accent"], collection)

    arc_specs = (
        (1.62, 0.58, 0.68, 0.10),
        (2.32, 0.80, 0.78, 0.75),
        (3.08, 0.67, 0.71, 1.25),
        (3.84, 0.82, 0.76, 1.85),
        (4.48, 0.56, 0.64, 2.35),
    )
    for index, (z, radius, span, phase) in enumerate(arc_specs, start=1):
        add_energy_curve(
            f"CV_Energy_Main_LayeredArc_{index:02d}",
            arc_points((cx, cy), z, radius, span, 104, phase),
            0.006 if index in (1, 5) else 0.007,
            materials["accent"], collection)

    add_energy_point_light(
        "CV_EnergyLight_Main_Lower", (cx, cy, 1.62), 90.0,
        (0.06, 0.34, 1.0), 0.42, collection)
    add_energy_point_light(
        "CV_EnergyLight_Main_Core", (cx, cy, 3.08), 190.0,
        (0.04, 0.28, 1.0), 0.58, collection)
    add_energy_point_light(
        "CV_EnergyLight_Main_Upper", (cx, cy, 4.58), 70.0,
        (0.08, 0.40, 1.0), 0.38, collection)


def build_secondary_energy(collection, materials):
    cx, cy = SECONDARY_CENTER
    add_energy_curve(
        "CV_Energy_Secondary_Helix",
        helix_points((cx, cy), 1.00, 3.20, 0.28, 2.20, 150, 0.60, 0.08),
        0.007, materials["secondary"], collection)
    for index, (z, radius, span, phase) in enumerate(((1.38, 0.34, 0.64, 0.3), (2.72, 0.38, 0.70, 1.1)), start=1):
        add_energy_curve(
            f"CV_Energy_Secondary_Arc_{index:02d}",
            arc_points((cx, cy), z, radius, span, 84, phase, 0.012),
            0.0045, materials["secondary"], collection)
    add_energy_point_light(
        "CV_EnergyLight_Secondary_Core", (cx, cy, 2.12), 45.0,
        (0.05, 0.28, 0.90), 0.34, collection)


def add_area_light(name, position, target, energy, size, color, collection, cast_shadow=False):
    light = er01.add_area_light(name, position, target, energy, size, collection)
    light.data.color = color
    light.data.shape = "DISK"
    light.data.use_shadow = cast_shadow
    light["CV_LightingRole"] = "ER-05 final authored lighting"
    return light


def add_final_lighting(collection):
    # Dominant warm Mediterranean daylight from the open left arcade.
    add_area_light(
        "CV_Light_Daylight_LeftKey", (-10.8, -2.2, 7.7), (0.0, 2.4, 2.3),
        2800.0, 4.6, (1.0, 0.74, 0.49), collection, cast_shadow=True)
    # Broad, cooler sky component keeps the open side believable and glass dimensional.
    add_area_light(
        "CV_Light_Daylight_LeftSky", (-9.8, 5.8, 5.8), (-0.8, 4.0, 2.8),
        1250.0, 7.0, (0.66, 0.82, 1.0), collection)
    # Warm floor/stone bounce lifts the interior without flattening shadows.
    add_area_light(
        "CV_Light_Interior_WarmBounce", (-3.2, -1.4, 0.75), (0.0, 2.8, 2.7),
        500.0, 5.5, (1.0, 0.62, 0.36), collection)
    # Controlled opposite-side sculpting gives bronze mass and readable glass edges.
    add_area_light(
        "CV_Light_Reactor_Sculpt", (6.4, -2.6, 5.1), (0.0, 1.8, 3.0),
        500.0, 3.2, (0.82, 0.86, 0.92), collection)
    # Quiet rear warmth separates the Reactor from the facade without theatrical rim light.
    add_area_light(
        "CV_Light_Rear_Depth", (0.0, 14.7, 5.8), (0.0, 4.8, 2.9),
        450.0, 4.8, (1.0, 0.69, 0.43), collection)
    add_area_light(
        "CV_Light_Secondary_Separation", (7.6, 9.4, 4.7), (4.6, 7.0, 2.2),
        260.0, 2.4, (0.90, 0.78, 0.64), collection)


def configure_world_and_atmosphere(scene):
    world = scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputWorld")
    output.name = "CV_World_Output"
    output.location = (460, 0)
    background = nodes.new("ShaderNodeBackground")
    background.name = "CV_World_CoolExterior"
    background.location = (100, 80)
    background.inputs["Color"].default_value = (0.035, 0.075, 0.13, 1.0)
    background.inputs["Strength"].default_value = 0.24
    volume = nodes.new("ShaderNodeVolumeScatter")
    volume.name = "CV_World_SubtleAtmosphere"
    volume.location = (100, -150)
    volume.inputs["Color"].default_value = (0.50, 0.58, 0.67, 1.0)
    volume.inputs["Density"].default_value = 0.0022
    volume.inputs["Anisotropy"].default_value = 0.18
    links.new(background.outputs["Background"], output.inputs["Surface"])
    links.new(volume.outputs["Volume"], output.inputs["Volume"])
    scene["CV_Atmosphere"] = "World Volume Scatter density 0.0022; restrained depth only"


def configure_restrained_glow(scene):
    group_name = "CV_ER05_FinalCompositor"
    existing = bpy.data.node_groups.get(group_name)
    if existing:
        bpy.data.node_groups.remove(existing)
    bpy.ops.node.new_compositing_node_group(name=group_name)
    group = bpy.data.node_groups[group_name]
    scene.compositing_node_group = group
    nodes = group.nodes
    links = group.links
    nodes.clear()
    render_layers = nodes.new("CompositorNodeRLayers")
    render_layers.name = "CV_RenderLayers"
    render_layers.location = (-300, 0)
    glare = nodes.new("CompositorNodeGlare")
    glare.name = "CV_Energy_RestrainedGlow"
    glare.location = (0, 0)
    glare.inputs["Type"].default_value = "Fog Glow"
    glare.inputs["Quality"].default_value = "High"
    glare.inputs["Threshold"].default_value = 1.25
    glare.inputs["Size"].default_value = 0.55
    glare.inputs["Strength"].default_value = 0.22
    glare.inputs["Saturation"].default_value = 0.95
    composite = nodes.new("NodeGroupOutput")
    composite.name = "CV_FinalComposite"
    composite.location = (300, 0)
    links.new(render_layers.outputs["Image"], glare.inputs["Image"])
    links.new(glare.outputs["Image"], composite.inputs["Image"])
    scene["CV_Glow"] = "Fog Glow threshold 1.25, size 0.55, strength 0.22; energy only"


def configure_scene():
    scene = er04c.configure_scene()
    scene.name = "CV_EngineRoom_ER05"
    scene["CV_ProductionStage"] = "ER-05 Final Lighting / Energy Match"
    scene["CV_PreviousApprovedStage"] = "ER-04c Surface Normals / Smooth Shading Correction"
    scene["CV_GeometryLocked"] = True
    scene["CV_MaterialsLocked"] = True
    scene["CV_HeroCameraLocked"] = True
    scene["CV_TruthState"] = "Ready / Active Core"
    scene["CV_StageScope"] = "Final Blender lighting, atmosphere and truthful active energy only"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.25
    configure_world_and_atmosphere(scene)
    configure_restrained_glow(scene)
    return scene


def build_scene():
    scene = configure_scene()
    architecture_materials = er04b.make_architecture_materials()
    reactor_materials = er04b.make_reactor_materials()
    secondary_materials = er04b.make_secondary_materials(reactor_materials)
    console_materials = {
        "enclosure": er04b.make_refined_metal_material(
            "CV_Mat_Console_Enclosure", (0.004, 0.006, 0.008), (0.021, 0.025, 0.029),
            0.76, 0.48, 0.60, 3.0, 115.0, 0.009, 0.06, "Console Dark Enclosure"),
        "trim": er04b.make_refined_metal_material(
            "CV_Mat_Console_Trim", (0.020, 0.013, 0.006), (0.075, 0.047, 0.017),
            1.0, 0.36, 0.46, 2.1, 135.0, 0.009, 0.20, "Console Bronze Trim"),
        "screen": er04b.make_console_screen_material(),
    }
    energy_materials = {
        "core": make_energy_material(
            "CV_Mat_Energy_BlueCore", (0.020, 0.22, 0.95), 8.0, "Main Active Core Energy"),
        "accent": make_energy_material(
            "CV_Mat_Energy_BlueAccent", (0.020, 0.16, 0.65), 3.8, "Main Layered Energy Accent"),
        "secondary": make_energy_material(
            "CV_Mat_Energy_BlueSecondary", (0.020, 0.14, 0.55), 2.6, "Secondary Active Energy"),
    }

    root = er01.create_collection("CV_EngineRoom")
    er04.build_approved_architecture(root, architecture_materials, console_materials)
    reactor_root = er01.create_collection("CV_Reactor", root)
    secondary_root = er01.create_collection("CV_Reactor_Secondary", root)
    energy = er01.create_collection("CV_Reactor_Energy", root)
    cameras = er01.create_collection("CV_Cameras", root)
    lights = er01.create_collection("CV_Lights_Final", root)

    er03.build_platform_interfaces(reactor_root, secondary_root, architecture_materials)
    er03.build_main_base(reactor_root, reactor_materials)
    er03.build_main_chamber(reactor_root, reactor_materials)
    er03.build_main_frame(reactor_root, reactor_materials)
    er03.build_main_cap(reactor_root, reactor_materials)
    er03.build_main_internal(reactor_root, reactor_materials)
    er03.build_main_ports(reactor_root, reactor_materials)
    er03.build_secondary_reactor(secondary_root, secondary_materials)
    er04b.assign_dark_structural_bronze(reactor_materials["bronze_dark"])
    er04c.apply_architecture_surface_normal_corrections()

    build_main_energy(energy, energy_materials)
    build_secondary_energy(energy, energy_materials)

    hero_camera = er01.add_camera(
        "CV_HeroCamera", er02.HERO_CAMERA_POSITION, er02.HERO_CAMERA_TARGET,
        er02.HERO_FOCAL_LENGTH_MM, cameras)
    er04.add_reference_background(hero_camera, cameras)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-05 final lighting/energy reference match; approved camera locked"
    alternate_camera = er01.add_camera(
        "CV_MaterialReviewCamera", (7.55, -8.75, 4.55), (0.55, 2.70, 2.80), 36.0, cameras)
    closeup_camera = er01.add_camera(
        "CV_ReactorMaterialCloseupCamera", (4.80, -8.10, 3.55), (0.10, 1.80, 3.05), 36.0, cameras)
    er01.add_camera(
        "CV_ArchitectureMaterialCloseupCamera", (1.40, -6.40, 2.75), (-6.65, 1.20, 2.85), 44.0, cameras)
    add_final_lighting(lights)

    render_jobs = (
        (hero_camera, HERO_RENDER_PATH),
        (alternate_camera, ALTERNATE_RENDER_PATH),
        (closeup_camera, ENERGY_CLOSEUP_PATH),
    )
    for camera, output_path in render_jobs:
        scene.camera = camera
        scene.render.filepath = str(output_path)
        if camera == hero_camera:
            bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
        bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-05 source: {BLEND_PATH}")
    print(f"Saved ER-05 hero: {HERO_RENDER_PATH}")
    print(f"Saved ER-05 alternate: {ALTERNATE_RENDER_PATH}")
    print(f"Saved ER-05 Reactor energy close-up: {ENERGY_CLOSEUP_PATH}")


if __name__ == "__main__":
    build_scene()
