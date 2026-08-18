"""Build Core Vault Engine Room ER-04: Material Match.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er04.py

ER-04 deterministically rebuilds the approved ER-03 geometry and locked hero
camera, then replaces only temporary work materials with semantic production PBR
families.  Lighting remains neutral review lighting; energy and ER-05 are absent.
"""

from pathlib import Path
import sys

import bpy


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import build_er01 as er01
import build_er02 as er02
import build_er03 as er03


REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
REFERENCE_PATH = REPO_DIR / "docs/references/engine-room/engine-room-hero-reference.png"
HERO_RENDER_PATH = REVIEW_DIR / "er-04-materials-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-04-materials-alternate.png"
REACTOR_CLOSEUP_PATH = REVIEW_DIR / "er-04-reactor-material-closeup.png"
ARCHITECTURE_CLOSEUP_PATH = REVIEW_DIR / "er-04-architecture-material-closeup.png"


def set_input(shader, name, value):
    if name in shader.inputs:
        shader.inputs[name].default_value = value


def new_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    output = material.node_tree.nodes.new("ShaderNodeOutputMaterial")
    output.location = (720, 20)
    shader = material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (430, 20)
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material, shader


def add_object_coordinates(nodes):
    coordinates = nodes.new("ShaderNodeTexCoord")
    coordinates.location = (-980, 40)
    return coordinates


def add_noise(nodes, location, scale, detail=2.0, roughness=0.55):
    noise = nodes.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "3D"
    noise.location = location
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    noise.inputs["Roughness"].default_value = roughness
    return noise


def add_color_ramp(nodes, location, dark_color, light_color, dark_position=0.24, light_position=0.78):
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.location = location
    ramp.color_ramp.elements[0].position = dark_position
    ramp.color_ramp.elements[0].color = (*dark_color, 1.0)
    ramp.color_ramp.elements[1].position = light_position
    ramp.color_ramp.elements[1].color = (*light_color, 1.0)
    return ramp


def add_roughness_range(nodes, location, low, high):
    mapping = nodes.new("ShaderNodeMapRange")
    mapping.location = location
    mapping.inputs["From Min"].default_value = 0.0
    mapping.inputs["From Max"].default_value = 1.0
    mapping.inputs["To Min"].default_value = low
    mapping.inputs["To Max"].default_value = high
    mapping.clamp = True
    return mapping


def make_stone_material(name, dark_color, light_color, macro_scale,
                        roughness_low, roughness_high, pore_scale=24.0,
                        bump_strength=0.10, bump_distance=0.025):
    material, shader = new_material(name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    coordinates = add_object_coordinates(nodes)
    macro = add_noise(nodes, (-760, 130), macro_scale, 2.4, 0.58)
    ramp = add_color_ramp(nodes, (-520, 170), dark_color, light_color)
    roughness = add_roughness_range(nodes, (-250, -120), roughness_low, roughness_high)
    pores = add_noise(nodes, (-740, -280), pore_scale, 2.0, 0.62)
    bump = nodes.new("ShaderNodeBump")
    bump.location = (160, -190)
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = bump_distance
    links.new(coordinates.outputs["Object"], macro.inputs["Vector"])
    links.new(coordinates.outputs["Object"], pores.inputs["Vector"])
    links.new(macro.outputs["Fac"], ramp.inputs["Fac"])
    links.new(macro.outputs["Fac"], roughness.inputs["Value"])
    links.new(pores.outputs["Fac"], bump.inputs["Height"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(roughness.outputs["Result"], shader.inputs["Roughness"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    set_input(shader, "Metallic", 0.0)
    material.diffuse_color = (*light_color, 1.0)
    material["CV_MaterialFamily"] = "Stone"
    material["CV_Mapping"] = "Object-space 3D procedural; bake baseColor/roughness/normal for glTF"
    return material


def make_metal_material(name, dark_color, light_color, metallic,
                        roughness_low, roughness_high, macro_scale=3.2,
                        brush_scale=92.0, brush_strength=0.045,
                        anisotropy=0.0, family="Engineering Metal"):
    material, shader = new_material(name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    coordinates = add_object_coordinates(nodes)
    macro = add_noise(nodes, (-760, 130), macro_scale, 3.0, 0.58)
    ramp = add_color_ramp(nodes, (-520, 170), dark_color, light_color, 0.28, 0.76)
    roughness = add_roughness_range(nodes, (-250, -120), roughness_low, roughness_high)
    brush = add_noise(nodes, (-740, -280), brush_scale, 1.2, 0.34)
    bump = nodes.new("ShaderNodeBump")
    bump.location = (160, -190)
    bump.inputs["Strength"].default_value = brush_strength
    bump.inputs["Distance"].default_value = 0.006
    links.new(coordinates.outputs["Object"], macro.inputs["Vector"])
    links.new(coordinates.outputs["Object"], brush.inputs["Vector"])
    links.new(macro.outputs["Fac"], ramp.inputs["Fac"])
    links.new(macro.outputs["Fac"], roughness.inputs["Value"])
    links.new(brush.outputs["Fac"], bump.inputs["Height"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(roughness.outputs["Result"], shader.inputs["Roughness"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    set_input(shader, "Metallic", metallic)
    set_input(shader, "Anisotropic IOR Level", anisotropy)
    set_input(shader, "Anisotropic", anisotropy)
    material.diffuse_color = (*light_color, 1.0)
    material["CV_MaterialFamily"] = family
    material["CV_Mapping"] = "Object-space 3D procedural; bake baseColor/roughness/normal for glTF"
    return material


def make_glass_material(name, color, alpha, roughness, transmission, family):
    material, shader = new_material(name)
    set_input(shader, "Base Color", (*color, 1.0))
    set_input(shader, "Metallic", 0.0)
    set_input(shader, "Roughness", roughness)
    set_input(shader, "IOR", 1.47)
    set_input(shader, "Transmission Weight", transmission)
    set_input(shader, "Alpha", alpha)
    set_input(shader, "Coat Weight", 0.12)
    set_input(shader, "Coat Roughness", 0.08)
    material.diffuse_color = (*color, alpha)
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "BLENDED"
    material["CV_MaterialFamily"] = family
    material["CV_RuntimeNote"] = "Translate to glTF transmission/alpha with renderer-specific sorting validation"
    return material


def make_console_screen_material():
    material, shader = new_material("CV_Mat_Console_Screen")
    set_input(shader, "Base Color", (0.006, 0.014, 0.018, 1.0))
    set_input(shader, "Metallic", 0.04)
    set_input(shader, "Roughness", 0.14)
    set_input(shader, "IOR", 1.48)
    set_input(shader, "Coat Weight", 0.28)
    set_input(shader, "Coat Roughness", 0.08)
    material.diffuse_color = (0.006, 0.014, 0.018, 1.0)
    material["CV_MaterialFamily"] = "Console Screen Placeholder"
    return material


def make_architecture_materials():
    return {
        "stone": make_stone_material(
            "CV_Mat_Stone_Warm", (0.27, 0.18, 0.105), (0.52, 0.37, 0.215),
            0.62, 0.58, 0.72, 23.0, 0.095, 0.025),
        "stone_light": make_stone_material(
            "CV_Mat_Stone_Trim", (0.36, 0.25, 0.145), (0.64, 0.47, 0.285),
            0.72, 0.54, 0.68, 25.0, 0.085, 0.022),
        "stone_dark": make_stone_material(
            "CV_Mat_Stone_StructureDark", (0.14, 0.095, 0.060), (0.29, 0.205, 0.125),
            0.52, 0.65, 0.79, 20.0, 0.075, 0.022),
        "floor": make_stone_material(
            "CV_Mat_Stone_Floor", (0.17, 0.100, 0.050), (0.34, 0.220, 0.110),
            0.42, 0.38, 0.56, 18.0, 0.070, 0.018),
        "floor_light": make_stone_material(
            "CV_Mat_Stone_FloorLight", (0.22, 0.135, 0.064), (0.40, 0.270, 0.135),
            0.48, 0.40, 0.58, 19.0, 0.065, 0.018),
        "floor_dark": make_stone_material(
            "CV_Mat_Stone_JointSubstrate", (0.040, 0.030, 0.024), (0.090, 0.065, 0.046),
            0.80, 0.76, 0.88, 16.0, 0.040, 0.012),
        "ceiling": make_stone_material(
            "CV_Mat_Ceiling_WarmStructural", (0.095, 0.052, 0.026), (0.23, 0.13, 0.058),
            0.38, 0.64, 0.80, 15.0, 0.055, 0.016),
        "ceiling_dark": make_stone_material(
            "CV_Mat_Ceiling_Deep", (0.024, 0.016, 0.012), (0.070, 0.042, 0.025),
            0.44, 0.72, 0.86, 14.0, 0.040, 0.012),
        "recess": make_stone_material(
            "CV_Mat_Stone_Recess", (0.070, 0.050, 0.038), (0.15, 0.105, 0.072),
            0.55, 0.70, 0.84, 17.0, 0.055, 0.016),
        "recess_dark": make_stone_material(
            "CV_Mat_Stone_RecessDeep", (0.010, 0.010, 0.009), (0.032, 0.027, 0.021),
            0.70, 0.80, 0.92, 13.0, 0.030, 0.010),
        "platform": make_stone_material(
            "CV_Mat_Stone_Platform", (0.18, 0.115, 0.062), (0.38, 0.250, 0.125),
            0.50, 0.43, 0.60, 18.0, 0.065, 0.018),
        "platform_light": make_stone_material(
            "CV_Mat_Stone_PlatformTrim", (0.24, 0.160, 0.085), (0.47, 0.310, 0.160),
            0.58, 0.39, 0.56, 20.0, 0.060, 0.016),
    }


def make_reactor_materials():
    return {
        "machine": make_metal_material(
            "CV_Mat_Bronze_Main", (0.035, 0.018, 0.008), (0.13, 0.060, 0.020),
            0.90, 0.31, 0.43, 2.6, 105.0, 0.045, 0.28, "Aged Structural Bronze"),
        "machine_dark": make_metal_material(
            "CV_Mat_Metal_Blackened", (0.006, 0.008, 0.010), (0.030, 0.034, 0.038),
            0.80, 0.40, 0.55, 3.8, 86.0, 0.035, 0.12, "Blackened Engineering Metal"),
        "machine_light": make_metal_material(
            "CV_Mat_Bronze_Machined", (0.070, 0.035, 0.012), (0.22, 0.105, 0.030),
            0.94, 0.22, 0.33, 3.4, 120.0, 0.035, 0.42, "Machined Bronze Accent"),
        "inner": make_metal_material(
            "CV_Mat_Internal_DarkSteel", (0.008, 0.012, 0.015), (0.050, 0.060, 0.068),
            0.72, 0.46, 0.61, 4.2, 74.0, 0.030, 0.08, "Internal Dark Steel"),
        "inner_light": make_metal_material(
            "CV_Mat_Internal_Machined", (0.055, 0.065, 0.072), (0.18, 0.20, 0.21),
            0.84, 0.27, 0.40, 4.8, 112.0, 0.028, 0.30, "Internal Machined Metal"),
        "glass": make_glass_material(
            "CV_Mat_Glass_Reactor", (0.025, 0.060, 0.075), 0.18, 0.075, 0.42,
            "Main Reactor Technical Glass"),
    }


def make_secondary_materials(main_materials):
    secondary = dict(main_materials)
    secondary["glass"] = make_glass_material(
        "CV_Mat_Glass_Secondary", (0.020, 0.047, 0.058), 0.21, 0.085, 0.36,
        "Secondary Reactor Technical Glass")
    return secondary


def build_approved_architecture(root, materials, console_materials):
    architecture = er01.create_collection("CV_Architecture", root)
    er02.build_floor(architecture, materials)
    er02.build_left_arcade(architecture, materials)
    er02.build_rear_facade(architecture, materials)
    er02.build_right_side(architecture, materials)
    er02.build_ceiling(architecture, materials)
    er02.build_foreground(architecture, materials)
    er02.build_console(root, {**materials, "reactor_dark": console_materials["enclosure"]})
    console = bpy.data.collections["CV_Console_Greybox"]
    er02.add_box("CV_Console_ScreenTrim", (-4.95, -1.62, 1.665), (1.46, 0.88, 0.045),
                 console_materials["trim"], console, bevel=0.025)
    er02.add_box("CV_Console_ScreenSurface", (-4.95, -1.62, 1.697), (1.30, 0.72, 0.025),
                 console_materials["screen"], console, bevel=0.012)
    return architecture


def add_reference_background(camera, collection):
    er03.add_reference_background(camera, collection)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-04 material match; approved geometry and hero camera locked"


def configure_scene():
    scene = er03.configure_scene()
    scene.name = "CV_EngineRoom_ER04"
    scene["CV_ProductionStage"] = "ER-04 Material Match"
    scene["CV_PreviousApprovedStage"] = "ER-03 Reactor Match"
    scene["CV_GeometryLocked"] = True
    scene["CV_HeroCameraLocked"] = True
    scene["CV_StageScope"] = "Production materials only; ER-05 lighting, energy, export and runtime deferred"
    scene["CV_ExternalTextures"] = "None; project-owned procedural node materials only"
    scene.world.color = (0.012, 0.011, 0.010)
    return scene


def add_colored_area_light(name, position, target, energy, size, color, collection):
    light = er01.add_area_light(name, position, target, energy, size, collection)
    light.data.color = color
    return light


def add_material_review_lighting(lights):
    add_colored_area_light("CV_Utility_MaterialKey", (-6.8, -0.8, 6.5), (0.0, 2.3, 2.2),
                           2450, 5.4, (1.0, 0.94, 0.86), lights)
    add_colored_area_light("CV_Utility_MaterialFrontFill", (2.8, -7.8, 5.2), (0.0, 2.0, 2.5),
                           780, 4.6, (0.88, 0.93, 1.0), lights)
    add_colored_area_light("CV_Utility_MaterialRear", (0.0, 13.5, 5.5), (0.0, 5.7, 2.6),
                           1080, 4.4, (1.0, 0.90, 0.79), lights)
    add_colored_area_light("CV_Utility_MaterialRightStrip", (7.2, 3.8, 5.2), (0.4, 2.2, 2.8),
                           820, 3.0, (0.82, 0.90, 1.0), lights)
    add_colored_area_light("CV_Utility_MaterialReactorInspect", (-1.8, -4.8, 4.4), (0.1, 1.8, 3.0),
                           540, 2.7, (1.0, 0.95, 0.88), lights)


def build_scene():
    scene = configure_scene()
    architecture_materials = make_architecture_materials()
    reactor_materials = make_reactor_materials()
    secondary_materials = make_secondary_materials(reactor_materials)
    console_materials = {
        "enclosure": make_metal_material(
            "CV_Mat_Console_Enclosure", (0.006, 0.008, 0.010), (0.028, 0.032, 0.035),
            0.72, 0.42, 0.56, 4.0, 76.0, 0.025, 0.08, "Console Dark Enclosure"),
        "trim": make_metal_material(
            "CV_Mat_Console_Trim", (0.055, 0.020, 0.006), (0.19, 0.075, 0.018),
            0.88, 0.28, 0.39, 3.0, 94.0, 0.030, 0.24, "Console Bronze Trim"),
        "screen": make_console_screen_material(),
    }

    root = er01.create_collection("CV_EngineRoom")
    build_approved_architecture(root, architecture_materials, console_materials)
    reactor_root = er01.create_collection("CV_Reactor", root)
    secondary_root = er01.create_collection("CV_Reactor_Secondary", root)
    cameras = er01.create_collection("CV_Cameras", root)
    lights = er01.create_collection("CV_Lights_Utility", root)

    er03.build_platform_interfaces(reactor_root, secondary_root, architecture_materials)
    er03.build_main_base(reactor_root, reactor_materials)
    er03.build_main_chamber(reactor_root, reactor_materials)
    er03.build_main_frame(reactor_root, reactor_materials)
    er03.build_main_cap(reactor_root, reactor_materials)
    er03.build_main_internal(reactor_root, reactor_materials)
    er03.build_main_ports(reactor_root, reactor_materials)
    er03.build_secondary_reactor(secondary_root, secondary_materials)

    hero_camera = er01.add_camera("CV_HeroCamera", er02.HERO_CAMERA_POSITION, er02.HERO_CAMERA_TARGET,
                                  er02.HERO_FOCAL_LENGTH_MM, cameras)
    add_reference_background(hero_camera, cameras)
    alternate_camera = er01.add_camera("CV_MaterialReviewCamera", (7.55, -8.75, 4.55),
                                       (0.55, 2.70, 2.80), 36.0, cameras)
    reactor_closeup = er01.add_camera("CV_ReactorMaterialCloseupCamera", (4.80, -8.10, 3.55),
                                      (0.10, 1.80, 3.05), 36.0, cameras)
    architecture_closeup = er01.add_camera("CV_ArchitectureMaterialCloseupCamera", (1.40, -6.40, 2.75),
                                           (-6.65, 1.20, 2.85), 44.0, cameras)
    add_material_review_lighting(lights)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)

    scene.camera = alternate_camera
    scene.render.filepath = str(ALTERNATE_RENDER_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = reactor_closeup
    scene.render.filepath = str(REACTOR_CLOSEUP_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = architecture_closeup
    scene.render.filepath = str(ARCHITECTURE_CLOSEUP_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved ER-04 source: {BLEND_PATH}")
    print(f"Saved ER-04 hero review: {HERO_RENDER_PATH}")
    print(f"Saved ER-04 alternate review: {ALTERNATE_RENDER_PATH}")
    print(f"Saved ER-04 Reactor close-up: {REACTOR_CLOSEUP_PATH}")
    print(f"Saved ER-04 architecture close-up: {ARCHITECTURE_CLOSEUP_PATH}")


if __name__ == "__main__":
    build_scene()
