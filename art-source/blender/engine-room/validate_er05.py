"""Read-only ER-05 validation, including an in-memory ER-04c locked-state rebuild."""

from pathlib import Path
import json
import math
import sys

import bpy
from mathutils import Vector


SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

import build_er01 as er01
import build_er02 as er02
import build_er03 as er03
import build_er04 as er04
import build_er04b as er04b
import build_er04c as er04c
from er04c_state_signature import digest, modifier_state, node_state, plain


EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
EXPECTED_REVIEW_FILES = (
    "er-05-lighting-hero.png",
    "er-05-lighting-alternate.png",
    "er-05-reactor-energy-closeup.png",
)


def locked_geometry_state():
    rows = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        mesh = obj.data
        rows.append({
            "name": obj.name,
            "mesh": mesh.name,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
            "scale": plain(obj.scale),
            "parent": obj.parent.name if obj.parent else None,
            "collections": sorted(collection.name for collection in obj.users_collection),
            "vertices": [[vertex.index, plain(vertex.co)] for vertex in mesh.vertices],
            "edges": [[edge.index, list(edge.vertices), edge.use_edge_sharp] for edge in mesh.edges],
            "polygons": [
                [polygon.index, list(polygon.vertices), polygon.use_smooth]
                for polygon in mesh.polygons
            ],
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "modifiers": [modifier_state(modifier) for modifier in obj.modifiers],
        })
    return rows


def locked_material_state():
    rows = []
    materials = [
        material for material in bpy.data.materials
        if material.name.startswith("CV_Mat_") and not material.name.startswith("CV_Mat_Energy_")
    ]
    for material in sorted(materials, key=lambda item: item.name):
        row = {
            "name": material.name,
            "diffuse_color": plain(material.diffuse_color),
            "custom": {key: plain(material[key]) for key in sorted(material.keys())},
            "surface_render_method": getattr(material, "surface_render_method", None),
            "nodes": [],
            "links": [],
        }
        if material.node_tree:
            row["nodes"] = [
                node_state(node) for node in sorted(material.node_tree.nodes, key=lambda item: item.name)
            ]
            row["links"] = sorted([
                [link.from_node.name, link.from_socket.name, link.to_node.name, link.to_socket.name]
                for link in material.node_tree.links
            ])
        rows.append(row)
    return rows


def make_console_materials():
    return {
        "enclosure": er04b.make_refined_metal_material(
            "CV_Mat_Console_Enclosure", (0.004, 0.006, 0.008), (0.021, 0.025, 0.029),
            0.76, 0.48, 0.60, 3.0, 115.0, 0.009, 0.06, "Console Dark Enclosure"),
        "trim": er04b.make_refined_metal_material(
            "CV_Mat_Console_Trim", (0.020, 0.013, 0.006), (0.075, 0.047, 0.017),
            1.0, 0.36, 0.46, 2.1, 135.0, 0.009, 0.20, "Console Bronze Trim"),
        "screen": er04b.make_console_screen_material(),
    }


def rebuild_approved_er04c_state():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new("CV_ER04c_ValidationWorld")
    er04c.configure_scene()
    architecture_materials = er04b.make_architecture_materials()
    reactor_materials = er04b.make_reactor_materials()
    secondary_materials = er04b.make_secondary_materials(reactor_materials)
    console_materials = make_console_materials()

    root = er01.create_collection("CV_EngineRoom")
    er04.build_approved_architecture(root, architecture_materials, console_materials)
    reactor_root = er01.create_collection("CV_Reactor", root)
    secondary_root = er01.create_collection("CV_Reactor_Secondary", root)
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


def close_vector(actual, expected, tolerance=1e-6):
    return all(abs(float(a) - float(b)) <= tolerance for a, b in zip(actual, expected))


def main():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = (
        camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle
        if camera else math.inf
    )

    current_geometry = locked_geometry_state()
    current_materials = locked_material_state()
    energy_collection = bpy.data.collections.get("CV_Reactor_Energy")
    final_light_collection = bpy.data.collections.get("CV_Lights_Final")
    energy_objects = list(energy_collection.all_objects) if energy_collection else []
    final_lights = list(final_light_collection.all_objects) if final_light_collection else []
    review_dir = SOURCE_DIR / "review"

    current_summary = {
        "blend_file": bpy.data.filepath,
        "scene": scene.name,
        "production_stage": scene.get("CV_ProductionStage"),
        "truth_state": scene.get("CV_TruthState"),
        "geometry_locked": scene.get("CV_GeometryLocked"),
        "materials_locked": scene.get("CV_MaterialsLocked"),
        "hero_camera_locked": scene.get("CV_HeroCameraLocked"),
        "hero_camera_position": plain(camera.location) if camera else None,
        "hero_camera_lens_mm": float(camera.data.lens) if camera else None,
        "hero_camera_target_rotation_error_radians": rotation_error,
        "hero_camera_valid": bool(
            camera
            and scene.camera == camera
            and close_vector(camera.location, EXPECTED_CAMERA_POSITION)
            and abs(camera.data.lens - 38.0) <= 1e-7
            and rotation_error <= 1e-6
        ),
        "architecture_objects": len(bpy.data.collections["CV_Architecture"].all_objects),
        "main_reactor_objects": len(bpy.data.collections["CV_Reactor"].all_objects),
        "secondary_reactor_objects": len(bpy.data.collections["CV_Reactor_Secondary"].all_objects),
        "mesh_objects": len(current_geometry),
        "locked_materials": len(current_materials),
        "energy_materials": sum(1 for material in bpy.data.materials if material.name.startswith("CV_Mat_Energy_")),
        "energy_curves": sum(1 for obj in energy_objects if obj.type == "CURVE"),
        "energy_point_lights": sum(1 for obj in energy_objects if obj.type == "LIGHT" and obj.data.type == "POINT"),
        "final_area_lights": sum(1 for obj in final_lights if obj.type == "LIGHT" and obj.data.type == "AREA"),
        "shadow_casting_final_lights": sorted(
            obj.name for obj in final_lights if obj.type == "LIGHT" and obj.data.use_shadow
        ),
        "review_files_present": {
            name: (review_dir / name).is_file() for name in EXPECTED_REVIEW_FILES
        },
    }

    current_geometry_hash = digest(current_geometry)
    current_material_hash = digest(current_materials)
    rebuild_approved_er04c_state()
    expected_geometry_hash = digest(locked_geometry_state())
    expected_material_hash = digest(locked_material_state())

    result = {
        **current_summary,
        "locked_geometry_hash": current_geometry_hash,
        "expected_er04c_geometry_hash": expected_geometry_hash,
        "locked_geometry_matches_er04c": current_geometry_hash == expected_geometry_hash,
        "locked_material_hash": current_material_hash,
        "expected_er04c_material_hash": expected_material_hash,
        "locked_materials_match_er04c": current_material_hash == expected_material_hash,
    }
    print("CV_ER05_VALIDATION=" + json.dumps(result, sort_keys=True))

    failures = []
    if not result["hero_camera_valid"]:
        failures.append("hero camera")
    if not result["locked_geometry_matches_er04c"]:
        failures.append("approved ER-04c geometry")
    if not result["locked_materials_match_er04c"]:
        failures.append("approved ER-04c materials")
    if (result["architecture_objects"], result["main_reactor_objects"], result["secondary_reactor_objects"], result["mesh_objects"]) != (247, 246, 72, 571):
        failures.append("geometry counts")
    if (result["locked_materials"], result["energy_materials"]) != (23, 3):
        failures.append("material counts")
    if (result["energy_curves"], result["energy_point_lights"], result["final_area_lights"]) != (12, 4, 6):
        failures.append("ER-05 authored lighting/energy counts")
    if result["shadow_casting_final_lights"] != ["CV_Light_Daylight_LeftKey"]:
        failures.append("final shadow hierarchy")
    if not all(result["review_files_present"].values()):
        failures.append("review files")
    if failures:
        raise RuntimeError("ER-05 validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
