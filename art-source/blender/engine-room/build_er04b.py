"""Build Core Vault Engine Room ER-04b: Material Refinement Pass.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er04b.py

ER-04b deterministically rebuilds the approved ER-04 geometry and locked hero
camera, while changing only material node graphs and assignments between
existing material families.  ER-04 utility review lights and cameras are reused
unchanged so the review set isolates material response.  ER-05 lighting,
energy, export and runtime integration remain explicitly out of scope.
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


REPO_DIR = SOURCE_DIR.parents[2]
REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-04b-materials-hero.png"
ALTERNATE_RENDER_PATH = REVIEW_DIR / "er-04b-materials-alternate.png"
REACTOR_CLOSEUP_PATH = REVIEW_DIR / "er-04b-reactor-material-closeup.png"
ARCHITECTURE_CLOSEUP_PATH = REVIEW_DIR / "er-04b-architecture-material-closeup.png"


def set_input(shader, name, value):
    if name in shader.inputs:
        shader.inputs[name].default_value = value


def named_node(nodes, node_type, name, location):
    node = nodes.new(node_type)
    node.name = name
    node.label = name.replace("CV_", "").replace("_", " ")
    node.location = location
    return node


def new_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    output = named_node(material.node_tree.nodes, "ShaderNodeOutputMaterial", "CV_Output_Surface", (980, 20))
    shader = named_node(material.node_tree.nodes, "ShaderNodeBsdfPrincipled", "CV_Principled_Surface", (700, 20))
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material, shader


def add_rotated_object_coordinates(nodes, links, rotation=(0.31, 0.57, 0.19)):
    coordinates = named_node(nodes, "ShaderNodeTexCoord", "CV_Coord_Object", (-1500, 80))
    rotate = named_node(nodes, "ShaderNodeVectorRotate", "CV_Coord_NonAxialRotation", (-1300, 80))
    rotate.rotation_type = "EULER_XYZ"
    if "Rotation" in rotate.inputs:
        rotate.inputs["Rotation"].default_value = rotation
    links.new(coordinates.outputs["Object"], rotate.inputs["Vector"])
    return rotate.outputs["Vector"]


def add_noise(nodes, name, location, scale, detail=2.0, roughness=0.5):
    noise = named_node(nodes, "ShaderNodeTexNoise", name, location)
    noise.noise_dimensions = "3D"
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = detail
    noise.inputs["Roughness"].default_value = roughness
    return noise


def add_color_ramp(nodes, name, location, dark_color, light_color, dark_position=0.18, light_position=0.82):
    ramp = named_node(nodes, "ShaderNodeValToRGB", name, location)
    ramp.color_ramp.elements[0].position = dark_position
    ramp.color_ramp.elements[0].color = (*dark_color, 1.0)
    ramp.color_ramp.elements[1].position = light_position
    ramp.color_ramp.elements[1].color = (*light_color, 1.0)
    return ramp


def add_range(nodes, name, location, low, high):
    mapping = named_node(nodes, "ShaderNodeMapRange", name, location)
    mapping.inputs["From Min"].default_value = 0.0
    mapping.inputs["From Max"].default_value = 1.0
    mapping.inputs["To Min"].default_value = low
    mapping.inputs["To Max"].default_value = high
    mapping.clamp = True
    return mapping


def make_refined_stone_material(
    name,
    dark_color,
    light_color,
    macro_scale,
    roughness_low,
    roughness_high,
    pore_scale=28.0,
    bump_strength=0.028,
    bump_distance=0.010,
    slab_variation=0.0,
    family="Mediterranean Limestone",
):
    """Calm, domain-warped limestone without axial or high-frequency striping."""
    material, shader = new_material(name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    vector = add_rotated_object_coordinates(nodes, links)

    warp = add_noise(nodes, "CV_Macro_Warp", (-1090, 300), max(0.34, macro_scale * 0.55), 1.6, 0.48)
    warp_amount = named_node(nodes, "ShaderNodeVectorMath", "CV_Macro_WarpAmount", (-870, 300))
    warp_amount.operation = "MULTIPLY"
    warp_amount.inputs[1].default_value = (0.13, 0.13, 0.13)
    warped_vector = named_node(nodes, "ShaderNodeVectorMath", "CV_Macro_WarpedCoordinates", (-660, 260))
    warped_vector.operation = "ADD"
    macro_primary = add_noise(nodes, "CV_Macro_Primary", (-450, 270), macro_scale, 2.0, 0.54)
    macro_secondary = add_noise(nodes, "CV_Macro_Secondary", (-450, 70), macro_scale * 2.37, 1.4, 0.46)
    macro_mix = named_node(nodes, "ShaderNodeMixRGB", "CV_Macro_NonRepeatingBlend", (-220, 230))
    macro_mix.blend_type = "MULTIPLY"
    macro_mix.inputs["Fac"].default_value = 0.17

    links.new(vector, warp.inputs["Vector"])
    links.new(warp.outputs["Color"], warp_amount.inputs[0])
    links.new(vector, warped_vector.inputs[0])
    links.new(warp_amount.outputs["Vector"], warped_vector.inputs[1])
    links.new(warped_vector.outputs["Vector"], macro_primary.inputs["Vector"])
    links.new(vector, macro_secondary.inputs["Vector"])
    links.new(macro_primary.outputs["Fac"], macro_mix.inputs[1])
    links.new(macro_secondary.outputs["Fac"], macro_mix.inputs[2])

    tone_output = macro_mix.outputs["Color"]
    if slab_variation > 0.0:
        object_info = named_node(nodes, "ShaderNodeObjectInfo", "CV_Slab_ObjectVariation", (-430, -110))
        slab_mix = named_node(nodes, "ShaderNodeMixRGB", "CV_Slab_SubtleBlend", (0, 100))
        slab_mix.blend_type = "MIX"
        slab_mix.inputs["Fac"].default_value = slab_variation
        links.new(tone_output, slab_mix.inputs[1])
        links.new(object_info.outputs["Random"], slab_mix.inputs[2])
        tone_output = slab_mix.outputs["Color"]

    ramp = add_color_ramp(nodes, "CV_Limestone_TonalRange", (250, 240), dark_color, light_color)
    roughness = add_range(nodes, "CV_Limestone_RoughnessRange", (250, -10), roughness_low, roughness_high)
    links.new(tone_output, ramp.inputs["Fac"])
    links.new(tone_output, roughness.inputs["Value"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(roughness.outputs["Result"], shader.inputs["Roughness"])

    micro_a = add_noise(nodes, "CV_Micro_Pores_A", (-420, -300), pore_scale, 1.2, 0.42)
    micro_b = add_noise(nodes, "CV_Micro_Pores_B", (-420, -470), pore_scale * 1.91, 1.0, 0.36)
    micro_mix = named_node(nodes, "ShaderNodeMixRGB", "CV_Micro_QuietBlend", (-160, -330))
    micro_mix.blend_type = "MULTIPLY"
    micro_mix.inputs["Fac"].default_value = 0.22
    bump = named_node(nodes, "ShaderNodeBump", "CV_Micro_BumpOnly", (430, -230))
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = bump_distance
    links.new(vector, micro_a.inputs["Vector"])
    links.new(vector, micro_b.inputs["Vector"])
    links.new(micro_a.outputs["Fac"], micro_mix.inputs[1])
    links.new(micro_b.outputs["Fac"], micro_mix.inputs[2])
    links.new(micro_mix.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])

    set_input(shader, "Metallic", 0.0)
    material.diffuse_color = (*light_color, 1.0)
    material["CV_MaterialFamily"] = family
    material["CV_Refinement"] = "ER-04b non-axial domain warp, restrained macro tone and two-scale micro bump"
    material["CV_BakeRequirement"] = "Bake baseColor, roughness and tangent-space normal for glTF"
    material["CV_Mapping"] = "Object-space procedural; maintain consistent texel density during baking"
    return material


def make_refined_metal_material(
    name,
    dark_color,
    light_color,
    metallic,
    roughness_low,
    roughness_high,
    macro_scale=2.0,
    brush_scale=130.0,
    brush_strength=0.014,
    anisotropy=0.0,
    family="Engineering Metal",
):
    """Deep engineered metal with broad mass and restrained manufacturing grain."""
    material, shader = new_material(name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    vector = add_rotated_object_coordinates(nodes, links, (0.17, 0.41, 0.29))
    macro_a = add_noise(nodes, "CV_Metal_MacroPrimary", (-760, 180), macro_scale, 2.0, 0.50)
    macro_b = add_noise(nodes, "CV_Metal_MacroSecondary", (-760, 10), macro_scale * 2.19, 1.2, 0.42)
    macro_mix = named_node(nodes, "ShaderNodeMixRGB", "CV_Metal_MacroBlend", (-510, 145))
    macro_mix.blend_type = "MULTIPLY"
    macro_mix.inputs["Fac"].default_value = 0.14
    ramp = add_color_ramp(nodes, "CV_Metal_TonalRange", (-260, 190), dark_color, light_color, 0.22, 0.80)
    roughness = add_range(nodes, "CV_Metal_RoughnessRange", (-250, -30), roughness_low, roughness_high)
    brush = add_noise(nodes, "CV_Metal_ManufacturingGrain", (-520, -300), brush_scale, 1.0, 0.30)
    bump = named_node(nodes, "ShaderNodeBump", "CV_Metal_RestrainedBump", (390, -180))
    bump.inputs["Strength"].default_value = brush_strength
    bump.inputs["Distance"].default_value = 0.003

    links.new(vector, macro_a.inputs["Vector"])
    links.new(vector, macro_b.inputs["Vector"])
    links.new(vector, brush.inputs["Vector"])
    links.new(macro_a.outputs["Fac"], macro_mix.inputs[1])
    links.new(macro_b.outputs["Fac"], macro_mix.inputs[2])
    links.new(macro_mix.outputs["Color"], ramp.inputs["Fac"])
    links.new(macro_mix.outputs["Color"], roughness.inputs["Value"])
    links.new(brush.outputs["Fac"], bump.inputs["Height"])
    links.new(ramp.outputs["Color"], shader.inputs["Base Color"])
    links.new(roughness.outputs["Result"], shader.inputs["Roughness"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    set_input(shader, "Metallic", metallic)
    set_input(shader, "Anisotropic IOR Level", anisotropy)
    set_input(shader, "Anisotropic", anisotropy)
    material.diffuse_color = (*light_color, 1.0)
    material["CV_MaterialFamily"] = family
    material["CV_Refinement"] = "ER-04b deep tonal range with reduced copper/gold response and quiet grain"
    material["CV_BakeRequirement"] = "Bake baseColor, roughness and tangent-space normal for glTF"
    material["CV_Mapping"] = "Object-space procedural; anisotropy may require runtime approximation"
    return material


def make_refined_glass_material(name, color, front_alpha, edge_alpha, family):
    """Cool-neutral technical glass with facing-dependent edge presence."""
    material, shader = new_material(name)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    vector = add_rotated_object_coordinates(nodes, links, (0.09, 0.27, 0.13))
    micro = add_noise(nodes, "CV_Glass_MicroRoughness", (-380, -180), 7.0, 1.0, 0.32)
    roughness = add_range(nodes, "CV_Glass_RoughnessRange", (-120, -160), 0.038, 0.058)
    layer_weight = named_node(nodes, "ShaderNodeLayerWeight", "CV_Glass_Facing", (-380, 170))
    alpha_range = add_range(nodes, "CV_Glass_EdgeAlpha", (-110, 160), edge_alpha, front_alpha)
    links.new(vector, micro.inputs["Vector"])
    links.new(micro.outputs["Fac"], roughness.inputs["Value"])
    links.new(roughness.outputs["Result"], shader.inputs["Roughness"])
    links.new(layer_weight.outputs["Facing"], alpha_range.inputs["Value"])
    links.new(alpha_range.outputs["Result"], shader.inputs["Alpha"])
    set_input(shader, "Base Color", (*color, 1.0))
    set_input(shader, "Metallic", 0.0)
    set_input(shader, "IOR", 1.47)
    set_input(shader, "Transmission Weight", 0.62)
    set_input(shader, "Coat Weight", 0.18)
    set_input(shader, "Coat Roughness", 0.055)
    material.diffuse_color = (*color, front_alpha)
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "BLENDED"
    material["CV_MaterialFamily"] = family
    material["CV_Refinement"] = "ER-04b facing-controlled edge alpha, thin roughness variation and physical panel thickness"
    material["CV_RuntimeNote"] = "Validate KHR_materials_transmission, alpha sorting, depth write and overlapping curved panels"
    material["CV_BakeRequirement"] = "Bake only micro roughness if retained; facing response must be rebuilt in runtime shader"
    return material


def make_console_screen_material():
    material, shader = new_material("CV_Mat_Console_Screen")
    set_input(shader, "Base Color", (0.004, 0.009, 0.012, 1.0))
    set_input(shader, "Metallic", 0.03)
    set_input(shader, "Roughness", 0.18)
    set_input(shader, "IOR", 1.48)
    set_input(shader, "Coat Weight", 0.22)
    set_input(shader, "Coat Roughness", 0.10)
    material.diffuse_color = (0.004, 0.009, 0.012, 1.0)
    material["CV_MaterialFamily"] = "Console Screen Placeholder"
    material["CV_Emission"] = "None"
    return material


def make_architecture_materials():
    return {
        "stone": make_refined_stone_material(
            "CV_Mat_Stone_Warm", (0.190, 0.145, 0.100), (0.420, 0.340, 0.245),
            1.05, 0.62, 0.72, 28.0, 0.030, 0.010),
        "stone_light": make_refined_stone_material(
            "CV_Mat_Stone_Trim", (0.275, 0.225, 0.165), (0.520, 0.445, 0.340),
            1.24, 0.58, 0.68, 31.0, 0.027, 0.009),
        "stone_dark": make_refined_stone_material(
            "CV_Mat_Stone_StructureDark", (0.100, 0.078, 0.055), (0.245, 0.195, 0.135),
            0.86, 0.68, 0.79, 25.0, 0.026, 0.009),
        "floor": make_refined_stone_material(
            "CV_Mat_Stone_Floor", (0.140, 0.103, 0.065), (0.320, 0.255, 0.175),
            0.68, 0.44, 0.56, 24.0, 0.024, 0.008, 0.085, "Cut Limestone Floor"),
        "floor_light": make_refined_stone_material(
            "CV_Mat_Stone_FloorLight", (0.170, 0.125, 0.080), (0.360, 0.290, 0.200),
            0.76, 0.45, 0.57, 26.0, 0.022, 0.008, 0.075, "Cut Limestone Floor"),
        "floor_dark": make_refined_stone_material(
            "CV_Mat_Stone_JointSubstrate", (0.032, 0.024, 0.019), (0.070, 0.052, 0.037),
            0.56, 0.80, 0.90, 20.0, 0.012, 0.006, 0.0, "Stone Joint Substrate"),
        "ceiling": make_refined_stone_material(
            "CV_Mat_Ceiling_WarmStructural", (0.075, 0.042, 0.022), (0.195, 0.112, 0.052),
            0.34, 0.69, 0.81, 22.0, 0.018, 0.007, 0.0, "Warm Ceiling Structure"),
        "ceiling_dark": make_refined_stone_material(
            "CV_Mat_Ceiling_Deep", (0.018, 0.012, 0.009), (0.052, 0.032, 0.020),
            0.38, 0.76, 0.88, 20.0, 0.012, 0.006, 0.0, "Deep Ceiling Recess"),
        "recess": make_refined_stone_material(
            "CV_Mat_Stone_Recess", (0.052, 0.038, 0.029), (0.125, 0.088, 0.060),
            0.42, 0.74, 0.86, 23.0, 0.016, 0.007, 0.0, "Limestone Recess"),
        "recess_dark": make_refined_stone_material(
            "CV_Mat_Stone_RecessDeep", (0.008, 0.008, 0.007), (0.026, 0.022, 0.018),
            0.48, 0.83, 0.93, 18.0, 0.010, 0.005, 0.0, "Deep Architectural Recess"),
        "platform": make_refined_stone_material(
            "CV_Mat_Stone_Platform", (0.150, 0.108, 0.070), (0.340, 0.265, 0.175),
            0.72, 0.49, 0.61, 25.0, 0.022, 0.008, 0.035, "Cut Limestone Platform"),
        "platform_light": make_refined_stone_material(
            "CV_Mat_Stone_PlatformTrim", (0.195, 0.145, 0.095), (0.410, 0.325, 0.220),
            0.82, 0.45, 0.58, 27.0, 0.020, 0.007, 0.025, "Cut Limestone Platform Trim"),
    }


def make_reactor_materials():
    materials = {
        "machine": make_refined_metal_material(
            "CV_Mat_Bronze_Main", (0.012, 0.009, 0.006), (0.060, 0.040, 0.018),
            1.0, 0.40, 0.54, 1.75, 135.0, 0.013, 0.22, "Aged Structural Bronze"),
        "machine_dark": make_refined_metal_material(
            "CV_Mat_Metal_Blackened", (0.004, 0.005, 0.006), (0.022, 0.026, 0.030),
            0.84, 0.46, 0.59, 2.8, 110.0, 0.010, 0.08, "Blackened Engineering Metal"),
        "machine_light": make_refined_metal_material(
            "CV_Mat_Bronze_Machined", (0.032, 0.022, 0.010), (0.115, 0.074, 0.030),
            1.0, 0.27, 0.38, 2.4, 150.0, 0.010, 0.36, "Machined Bronze Accent"),
        "inner": make_refined_metal_material(
            "CV_Mat_Internal_DarkSteel", (0.006, 0.009, 0.011), (0.040, 0.048, 0.054),
            0.76, 0.50, 0.63, 3.1, 105.0, 0.010, 0.06, "Internal Dark Steel"),
        "inner_light": make_refined_metal_material(
            "CV_Mat_Internal_Machined", (0.040, 0.048, 0.054), (0.135, 0.150, 0.160),
            0.88, 0.32, 0.43, 3.5, 145.0, 0.009, 0.24, "Internal Machined Metal"),
        "glass": make_refined_glass_material(
            "CV_Mat_Glass_Reactor", (0.018, 0.044, 0.055), 0.105, 0.255,
            "Main Reactor Technical Glass"),
    }
    materials["bronze_dark"] = make_refined_metal_material(
        "CV_Mat_Bronze_AgedDark", (0.006, 0.0045, 0.003), (0.035, 0.024, 0.010),
        1.0, 0.48, 0.61, 1.45, 125.0, 0.011, 0.16, "Dark Aged Structural Bronze")
    return materials


def make_secondary_materials(main_materials):
    secondary = dict(main_materials)
    secondary["glass"] = make_refined_glass_material(
        "CV_Mat_Glass_Secondary", (0.015, 0.036, 0.045), 0.115, 0.265,
        "Secondary Reactor Technical Glass")
    return secondary


def assign_dark_structural_bronze(material):
    """Reassign existing bronze faces only; no mesh data or transforms change."""
    exact_names = {
        "CV_Reactor_Base_LowerCollar",
        "CV_Reactor_Cap_LowerSlope",
        "CV_Reactor_Cap_MiddleDeck",
        "CV_Secondary_Base_Taper",
        "CV_Secondary_Cap_Slope",
    }
    for obj in bpy.data.objects:
        if obj.type != "MESH" or not obj.data.materials:
            continue
        structural_ring = (
            obj.name.startswith("CV_Reactor_Frame_") or obj.name.startswith("CV_Secondary_Frame_")
        ) and obj.name.endswith("Ring")
        structural_block = obj.name.startswith("CV_Reactor_Base_AnchorBlock_")
        if obj.name in exact_names or structural_ring or structural_block:
            current = obj.data.materials[0]
            if current and current.name == "CV_Mat_Bronze_Main":
                obj.data.materials[0] = material


def configure_scene():
    scene = er03.configure_scene()
    default_collection = bpy.data.collections.get("Collection")
    if default_collection and not default_collection.objects and not default_collection.children:
        bpy.data.collections.remove(default_collection)
    scene.name = "CV_EngineRoom_ER04b"
    scene["CV_ProductionStage"] = "ER-04b Material Refinement Pass"
    scene["CV_PreviousApprovedStage"] = "ER-04 Material Match"
    scene["CV_GeometryLocked"] = True
    scene["CV_HeroCameraLocked"] = True
    scene["CV_StageScope"] = "Material refinement only; ER-05 lighting, energy, export and runtime deferred"
    scene["CV_ExternalTextures"] = "None; project-owned procedural node materials only"
    scene["CV_UtilityLighting"] = "Unchanged from ER-04"
    scene.world.color = (0.012, 0.011, 0.010)
    return scene


def build_scene():
    scene = configure_scene()
    architecture_materials = make_architecture_materials()
    reactor_materials = make_reactor_materials()
    secondary_materials = make_secondary_materials(reactor_materials)
    console_materials = {
        "enclosure": make_refined_metal_material(
            "CV_Mat_Console_Enclosure", (0.004, 0.006, 0.008), (0.021, 0.025, 0.029),
            0.76, 0.48, 0.60, 3.0, 115.0, 0.009, 0.06, "Console Dark Enclosure"),
        "trim": make_refined_metal_material(
            "CV_Mat_Console_Trim", (0.020, 0.013, 0.006), (0.075, 0.047, 0.017),
            1.0, 0.36, 0.46, 2.1, 135.0, 0.009, 0.20, "Console Bronze Trim"),
        "screen": make_console_screen_material(),
    }

    root = er01.create_collection("CV_EngineRoom")
    er04.build_approved_architecture(root, architecture_materials, console_materials)
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
    assign_dark_structural_bronze(reactor_materials["bronze_dark"])

    hero_camera = er01.add_camera(
        "CV_HeroCamera", er02.HERO_CAMERA_POSITION, er02.HERO_CAMERA_TARGET,
        er02.HERO_FOCAL_LENGTH_MM, cameras)
    er04.add_reference_background(hero_camera, cameras)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-04b material refinement; approved geometry and hero camera locked"
    alternate_camera = er01.add_camera(
        "CV_MaterialReviewCamera", (7.55, -8.75, 4.55), (0.55, 2.70, 2.80), 36.0, cameras)
    reactor_closeup = er01.add_camera(
        "CV_ReactorMaterialCloseupCamera", (4.80, -8.10, 3.55), (0.10, 1.80, 3.05), 36.0, cameras)
    architecture_closeup = er01.add_camera(
        "CV_ArchitectureMaterialCloseupCamera", (1.40, -6.40, 2.75), (-6.65, 1.20, 2.85), 44.0, cameras)
    er04.add_material_review_lighting(lights)

    render_jobs = (
        (hero_camera, HERO_RENDER_PATH),
        (alternate_camera, ALTERNATE_RENDER_PATH),
        (reactor_closeup, REACTOR_CLOSEUP_PATH),
        (architecture_closeup, ARCHITECTURE_CLOSEUP_PATH),
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
    print(f"Saved ER-04b source: {BLEND_PATH}")
    print(f"Saved ER-04b hero review: {HERO_RENDER_PATH}")
    print(f"Saved ER-04b alternate review: {ALTERNATE_RENDER_PATH}")
    print(f"Saved ER-04b Reactor close-up: {REACTOR_CLOSEUP_PATH}")
    print(f"Saved ER-04b architecture close-up: {ARCHITECTURE_CLOSEUP_PATH}")


if __name__ == "__main__":
    build_scene()
