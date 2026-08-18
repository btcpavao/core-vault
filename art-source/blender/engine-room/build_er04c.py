"""Build Core Vault Engine Room ER-04c: Surface Normals Correction.

Run with:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python build_er04c.py

ER-04c rebuilds the approved ER-04b state, then applies Blender 5.2 Shade
Smooth by Angle only to the 50 cylindrical/tapered parts of the architectural
column family.  The 30-degree threshold smooths adjacent radial faces while
keeping caps and designed hard transitions crisp.  No vertices, topology,
transforms, modifiers, materials, cameras or lights are changed.
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


REVIEW_DIR = SOURCE_DIR / "review"
BLEND_PATH = SOURCE_DIR / "engine-room.blend"
HERO_RENDER_PATH = REVIEW_DIR / "er-04c-materials-hero.png"
ARCHITECTURE_CLOSEUP_PATH = REVIEW_DIR / "er-04c-architecture-normal-closeup.png"
SMOOTH_ANGLE_RADIANS = math.radians(30.0)
CURVED_ARCHITECTURE_SUFFIXES = (
    "_Base_Lower",
    "_Base_Upper",
    "_Tapered_Shaft",
    "_Neck",
    "_Capital_Round",
)


def apply_architecture_surface_normal_corrections():
    """Smooth only confirmed curved column parts, preserving 30°+ hard edges."""
    architecture = bpy.data.collections["CV_Architecture"]
    targets = sorted(
        [
            obj for obj in architecture.all_objects
            if obj.type == "MESH" and obj.name.endswith(CURVED_ARCHITECTURE_SUFFIXES)
        ],
        key=lambda obj: obj.name,
    )
    if len(targets) != 50:
        raise RuntimeError(f"Expected 50 curved architecture targets, found {len(targets)}")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in targets:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_smooth_by_angle(
            angle=SMOOTH_ANGLE_RADIANS,
            keep_sharp_edges=True,
        )
        obj["CV_ER04cNormalCorrection"] = "Shade Smooth by Angle 30 degrees"
        obj.select_set(False)

    bpy.context.view_layer.objects.active = None
    return [obj.name for obj in targets]


def configure_scene():
    scene = er04b.configure_scene()
    scene.name = "CV_EngineRoom_ER04c"
    scene["CV_ProductionStage"] = "ER-04c Surface Normals / Smooth Shading Correction"
    scene["CV_PreviousApprovedStage"] = "ER-04b Material Refinement Pass"
    scene["CV_GeometryLocked"] = True
    scene["CV_HeroCameraLocked"] = True
    scene["CV_StageScope"] = "Surface normals only; ER-05 lighting, energy, export and runtime deferred"
    scene["CV_ER04cMethod"] = "Shade Smooth by Angle 30 degrees on 50 approved curved architecture parts"
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
    er04b.assign_dark_structural_bronze(reactor_materials["bronze_dark"])

    hero_camera = er01.add_camera(
        "CV_HeroCamera", er02.HERO_CAMERA_POSITION, er02.HERO_CAMERA_TARGET,
        er02.HERO_FOCAL_LENGTH_MM, cameras)
    er04.add_reference_background(hero_camera, cameras)
    marker = bpy.data.objects.get("CV_CanonicalReference_Marker")
    if marker:
        marker["CV_ReferenceUse"] = "ER-04c normal correction; composition and approved art state locked"
    er01.add_camera(
        "CV_MaterialReviewCamera", (7.55, -8.75, 4.55), (0.55, 2.70, 2.80), 36.0, cameras)
    er01.add_camera(
        "CV_ReactorMaterialCloseupCamera", (4.80, -8.10, 3.55), (0.10, 1.80, 3.05), 36.0, cameras)
    architecture_closeup = er01.add_camera(
        "CV_ArchitectureMaterialCloseupCamera", (1.40, -6.40, 2.75), (-6.65, 1.20, 2.85), 44.0, cameras)
    er04.add_material_review_lighting(lights)

    corrected = apply_architecture_surface_normal_corrections()
    scene["CV_ER04cCorrectedObjectCount"] = len(corrected)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)

    scene.camera = architecture_closeup
    scene.render.filepath = str(ARCHITECTURE_CLOSEUP_PATH)
    bpy.ops.render.render(write_still=True)

    scene.camera = hero_camera
    scene.render.filepath = str(HERO_RENDER_PATH)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Corrected ER-04c architecture objects: {len(corrected)}")
    print(f"Saved ER-04c source: {BLEND_PATH}")
    print(f"Saved ER-04c hero review: {HERO_RENDER_PATH}")
    print(f"Saved ER-04c architecture normal close-up: {ARCHITECTURE_CLOSEUP_PATH}")


if __name__ == "__main__":
    build_scene()
