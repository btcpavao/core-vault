"""Read-only QA validation for a reloaded ER-04c Engine Room blend."""

import json
import math
from pathlib import Path
import re
import sys

import bpy
from mathutils import Vector

SOURCE_DIR = Path(__file__).resolve().parent
if str(SOURCE_DIR) not in sys.path:
    sys.path.insert(0, str(SOURCE_DIR))

from er04c_state_signature import signature_report


EXPECTED_SIGNATURES = {
    "geometry": "baf65bd88ef7f14727c18a8045d6054c022b10628e06793614faf37a3a46447a",
    "materials": "de7d974873551c1174f00fb484779f09d2157d3d0ceae57c74f247195c03ebb4",
    "cameras_lights": "8fcacb12d823c72a3720306872adee28db196635916b8e273941ae0c71b7a875",
}
EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
CURVED_SUFFIXES = (
    "_Base_Lower",
    "_Base_Upper",
    "_Tapered_Shaft",
    "_Neck",
    "_Capital_Round",
)


def close_vector(actual, expected, tolerance=1e-6):
    return all(abs(float(a) - float(b)) <= tolerance for a, b in zip(actual, expected))


def main():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle if camera else math.inf
    signatures = signature_report()

    targets = sorted(
        [
            obj for obj in bpy.data.collections["CV_Architecture"].all_objects
            if obj.type == "MESH" and obj.name.endswith(CURVED_SUFFIXES)
        ],
        key=lambda obj: obj.name,
    )
    target_checks = {
        obj.name: {
            "smooth_polygons": sum(1 for polygon in obj.data.polygons if polygon.use_smooth),
            "total_polygons": len(obj.data.polygons),
            "sharp_edges": sum(1 for edge in obj.data.edges if edge.use_edge_sharp),
            "method": obj.get("CV_ER04cNormalCorrection"),
        }
        for obj in targets
    }
    corrected_objects = [obj for obj in bpy.data.objects if obj.get("CV_ER04cNormalCorrection")]
    reactor_corrections = [obj.name for obj in corrected_objects if obj.name.startswith(("CV_Reactor", "CV_Secondary"))]

    semantic_materials = [material for material in bpy.data.materials if material.name.startswith("CV_Mat_")]
    emission_nodes = []
    active_principled_emission = []
    for material in semantic_materials:
        if not material.node_tree:
            continue
        for node in material.node_tree.nodes:
            if node.bl_idname == "ShaderNodeEmission":
                emission_nodes.append(f"{material.name}:{node.name}")
            if (
                node.bl_idname == "ShaderNodeBsdfPrincipled"
                and "Emission Strength" in node.inputs
                and float(node.inputs["Emission Strength"].default_value) > 1e-7
            ):
                active_principled_emission.append(material.name)

    default_pattern = re.compile(r"^(Cube|Cylinder|Material|Collection)(\.\d+)?$")
    default_names = sorted(
        [obj.name for obj in bpy.data.objects if default_pattern.match(obj.name)]
        + [collection.name for collection in bpy.data.collections if default_pattern.match(collection.name)]
        + [material.name for material in bpy.data.materials if default_pattern.match(material.name)]
    )

    result = {
        "scene": scene.name,
        "production_stage": scene.get("CV_ProductionStage"),
        "active_camera": scene.camera.name if scene.camera else None,
        "hero_camera_position": [round(float(value), 6) for value in camera.location] if camera else None,
        "hero_camera_lens_mm": float(camera.data.lens) if camera else None,
        "hero_camera_target_rotation_error_radians": rotation_error,
        "hero_camera_valid": bool(
            camera
            and scene.camera == camera
            and close_vector(camera.location, EXPECTED_CAMERA_POSITION)
            and abs(camera.data.lens - 38.0) <= 1e-7
            and rotation_error <= 1e-6
        ),
        "signatures": signatures,
        "signatures_match_er04b": signatures == EXPECTED_SIGNATURES,
        "corrected_object_count": len(corrected_objects),
        "target_object_count": len(targets),
        "all_targets_smooth": all(
            row["smooth_polygons"] == row["total_polygons"] for row in target_checks.values()
        ),
        "hard_boundary_edges_preserved": all(row["sharp_edges"] == 128 for row in target_checks.values()),
        "reactor_corrections": reactor_corrections,
        "architecture_objects": len(bpy.data.collections["CV_Architecture"].all_objects),
        "main_reactor_objects": len(bpy.data.collections["CV_Reactor"].all_objects),
        "secondary_reactor_objects": len(bpy.data.collections["CV_Reactor_Secondary"].all_objects),
        "mesh_objects": sum(1 for obj in bpy.data.objects if obj.type == "MESH"),
        "semantic_materials": len(semantic_materials),
        "emission_shader_nodes": emission_nodes,
        "active_principled_emission": active_principled_emission,
        "default_names": default_names,
        "image_paths": sorted({image.filepath for image in bpy.data.images if image.filepath}),
        "blend_file": bpy.data.filepath,
    }
    print("CV_ER04C_VALIDATION=" + json.dumps(result, sort_keys=True))

    failures = []
    if not result["hero_camera_valid"]:
        failures.append("hero camera")
    if not result["signatures_match_er04b"]:
        failures.append("approved state signature")
    if result["target_object_count"] != 50 or result["corrected_object_count"] != 50:
        failures.append("corrected target count")
    if not result["all_targets_smooth"] or not result["hard_boundary_edges_preserved"]:
        failures.append("smooth/sharp state")
    if reactor_corrections:
        failures.append("Reactor scope")
    if (result["architecture_objects"], result["main_reactor_objects"], result["secondary_reactor_objects"], result["mesh_objects"]) != (247, 246, 72, 571):
        failures.append("geometry counts")
    if emission_nodes or active_principled_emission:
        failures.append("emission")
    if default_names:
        failures.append("default names")
    if failures:
        raise RuntimeError("ER-04c validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
