"""Read-only ER-06 validation against a fresh approved ER-04c/ER-05 rebuild."""

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
import build_er05 as er05
from er04c_state_signature import digest, modifier_state, node_state, plain


EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
EXPECTED_REVIEW_FILES = (
    "er-06-detail-hero.png",
    "er-06-detail-alternate.png",
    "er-06-reactor-detail-closeup.png",
    "er-06-console-closeup.png",
    "er-06-exterior-depth.png",
    "er-06-reference-comparison.png",
    "er-05-vs-er-06.png",
)


def approved_geometry_state():
    rows = []
    objects = [
        obj for obj in bpy.data.objects
        if obj.type == "MESH" and not obj.name.startswith("CV_ER06_")
    ]
    for obj in sorted(objects, key=lambda item: item.name):
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


def approved_material_state():
    rows = []
    materials = [
        material for material in bpy.data.materials
        if material.name.startswith("CV_Mat_")
        and not material.name.startswith("CV_Mat_Energy_")
        and material.get("CV_ProductionStage") != "ER-06 detail-only addition"
        and material.get("CV_ProductionStage") != "ER-06 lightweight exterior depth"
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


def final_light_state():
    rows = []
    for name in sorted((
        "CV_Light_Daylight_LeftKey",
        "CV_Light_Daylight_LeftSky",
        "CV_Light_Interior_WarmBounce",
        "CV_Light_Reactor_Sculpt",
        "CV_Light_Rear_Depth",
        "CV_Light_Secondary_Separation",
    )):
        obj = bpy.data.objects.get(name)
        if not obj:
            rows.append({"name": name, "missing": True})
            continue
        rows.append({
            "name": name,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
            "type": obj.data.type,
            "energy": plain(obj.data.energy),
            "shape": obj.data.shape,
            "size": plain(obj.data.size),
            "color": plain(obj.data.color),
            "use_shadow": obj.data.use_shadow,
        })
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


def rebuild_approved_state():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new("CV_ER06_ValidationWorld")
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

    light_collection = er01.create_collection("CV_Lights_Final", root)
    er05.add_final_lighting(light_collection)


def close_vector(actual, expected, tolerance=1e-6):
    return all(abs(float(a) - float(b)) <= tolerance for a, b in zip(actual, expected))


def mesh_budget(collection):
    meshes = [obj for obj in collection.all_objects if obj.type == "MESH"] if collection else []
    return {
        "mesh_objects": len(meshes),
        "vertices": sum(len(obj.data.vertices) for obj in meshes),
        "polygons": sum(len(obj.data.polygons) for obj in meshes),
        "unique_mesh_datablocks": len({obj.data.name for obj in meshes}),
    }


def main():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = (
        camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle
        if camera else math.inf
    )

    current_geometry = approved_geometry_state()
    current_materials = approved_material_state()
    current_lights = final_light_state()
    detail_collection = bpy.data.collections.get("CV_Detail_ER06")
    energy_collection = bpy.data.collections.get("CV_Reactor_Energy")
    review_dir = SOURCE_DIR / "review"
    total_meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    detail_materials = [
        material.name for material in bpy.data.materials
        if material.get("CV_ProductionStage") in {
            "ER-06 detail-only addition", "ER-06 lightweight exterior depth"
        }
    ]

    current_summary = {
        "blend_file": bpy.data.filepath,
        "scene": scene.name,
        "production_stage": scene.get("CV_ProductionStage"),
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
        "approved_mesh_objects": len(current_geometry),
        "total_mesh_objects": len(total_meshes),
        "approved_materials": len(current_materials),
        "detail_materials": sorted(detail_materials),
        "energy_materials": sum(1 for material in bpy.data.materials if material.name.startswith("CV_Mat_Energy_")),
        "energy_curves": sum(1 for obj in energy_collection.all_objects if obj.type == "CURVE") if energy_collection else 0,
        "conduit_curves": sum(1 for obj in bpy.data.objects if obj.type == "CURVE" and obj.name.startswith("CV_ER06_Conduit_")),
        "detail_budget": mesh_budget(detail_collection),
        "linked_detail_mesh_instances": (
            mesh_budget(detail_collection)["mesh_objects"] - mesh_budget(detail_collection)["unique_mesh_datablocks"]
        ),
        "er05_lighting_locked": scene.get("CV_ER05LightingLocked"),
        "major_geometry_locked": scene.get("CV_MajorGeometryLocked"),
        "glb_exported": scene.get("CV_GLBExported"),
        "practical_light_energy": bpy.data.lights["CV_Light_Practical_ER06"].energy if "CV_Light_Practical_ER06" in bpy.data.lights else None,
        "review_files_present": {name: (review_dir / name).is_file() for name in EXPECTED_REVIEW_FILES},
    }

    current_geometry_hash = digest(current_geometry)
    current_material_hash = digest(current_materials)
    current_light_hash = digest(current_lights)
    rebuild_approved_state()
    expected_geometry_hash = digest(approved_geometry_state())
    expected_material_hash = digest(approved_material_state())
    expected_light_hash = digest(final_light_state())

    result = {
        **current_summary,
        "approved_geometry_hash": current_geometry_hash,
        "expected_approved_geometry_hash": expected_geometry_hash,
        "approved_geometry_unchanged": current_geometry_hash == expected_geometry_hash,
        "approved_material_hash": current_material_hash,
        "expected_approved_material_hash": expected_material_hash,
        "approved_materials_unchanged": current_material_hash == expected_material_hash,
        "er05_final_light_hash": current_light_hash,
        "expected_er05_final_light_hash": expected_light_hash,
        "er05_final_lights_unchanged": current_light_hash == expected_light_hash,
    }
    print("CV_ER06_VALIDATION=" + json.dumps(result, sort_keys=True))

    failures = []
    if not result["hero_camera_valid"]:
        failures.append("hero camera")
    if not result["approved_geometry_unchanged"] or result["approved_mesh_objects"] != 571:
        failures.append("approved geometry")
    if not result["approved_materials_unchanged"] or result["approved_materials"] != 23:
        failures.append("approved materials")
    if not result["er05_final_lights_unchanged"]:
        failures.append("ER-05 final lights")
    if (result["energy_materials"], result["energy_curves"], result["conduit_curves"]) != (3, 16, 4):
        failures.append("ER-06 energy/conduit structure")
    if result["practical_light_energy"] != 22.0:
        failures.append("physical practical")
    if result["glb_exported"] is not False:
        failures.append("GLB export state")
    if not all(result["review_files_present"].values()):
        failures.append("review outputs")
    if failures:
        raise RuntimeError("ER-06 validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
