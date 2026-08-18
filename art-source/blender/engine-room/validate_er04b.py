"""Read-only QA checks for a reloaded ER-04b Engine Room blend."""

import json
import math
import re

import bpy
from mathutils import Vector


EXPECTED_CAMERA_POSITION = Vector((-0.25, -13.5, 2.1))
EXPECTED_CAMERA_TARGET = Vector((0.10, 1.8, 1.75))
EXPECTED_LIGHTS = {
    "CV_Utility_MaterialKey": ((-6.8, -0.8, 6.5), 2450.0, 5.4, (1.0, 0.94, 0.86)),
    "CV_Utility_MaterialFrontFill": ((2.8, -7.8, 5.2), 780.0, 4.6, (0.88, 0.93, 1.0)),
    "CV_Utility_MaterialRear": ((0.0, 13.5, 5.5), 1080.0, 4.4, (1.0, 0.90, 0.79)),
    "CV_Utility_MaterialRightStrip": ((7.2, 3.8, 5.2), 820.0, 3.0, (0.82, 0.90, 1.0)),
    "CV_Utility_MaterialReactorInspect": ((-1.8, -4.8, 4.4), 540.0, 2.7, (1.0, 0.95, 0.88)),
}


def close_vector(actual, expected, tolerance=1e-5):
    return all(abs(float(a) - float(b)) <= tolerance for a, b in zip(actual, expected))


def main():
    scene = bpy.context.scene
    camera = bpy.data.objects.get("CV_HeroCamera")
    expected_rotation = (EXPECTED_CAMERA_TARGET - EXPECTED_CAMERA_POSITION).to_track_quat("-Z", "Y")
    rotation_error = camera.rotation_euler.to_quaternion().rotation_difference(expected_rotation).angle if camera else math.inf

    semantic_materials = [material for material in bpy.data.materials if material.name.startswith("CV_Mat_")]
    emission_nodes = []
    nonblack_principled_emission = []
    for material in semantic_materials:
        if not material.use_nodes:
            continue
        for node in material.node_tree.nodes:
            if node.bl_idname == "ShaderNodeEmission":
                emission_nodes.append(f"{material.name}:{node.name}")
            if (
                node.bl_idname == "ShaderNodeBsdfPrincipled"
                and "Emission Color" in node.inputs
                and "Emission Strength" in node.inputs
                and float(node.inputs["Emission Strength"].default_value) > 1e-7
            ):
                color = node.inputs["Emission Color"].default_value
                if any(float(channel) > 1e-7 for channel in color[:3]):
                    nonblack_principled_emission.append(material.name)

    default_pattern = re.compile(r"^(Cube|Cylinder|Material|Collection)(\.\d+)?$")
    default_names = sorted(
        [obj.name for obj in bpy.data.objects if default_pattern.match(obj.name)]
        + [collection.name for collection in bpy.data.collections if default_pattern.match(collection.name)]
        + [material.name for material in bpy.data.materials if default_pattern.match(material.name)]
    )

    light_results = {}
    for name, (location, energy, size, color) in EXPECTED_LIGHTS.items():
        light = bpy.data.objects.get(name)
        light_results[name] = bool(
            light
            and light.type == "LIGHT"
            and close_vector(light.location, location)
            and abs(light.data.energy - energy) <= 1e-5
            and abs(light.data.size - size) <= 1e-5
            and close_vector(light.data.color, color)
        )

    image_paths = sorted({image.filepath for image in bpy.data.images if image.filepath})
    result = {
        "scene": scene.name,
        "production_stage": scene.get("CV_ProductionStage"),
        "active_camera": scene.camera.name if scene.camera else None,
        "hero_camera_position": [round(float(v), 6) for v in camera.location] if camera else None,
        "hero_camera_lens_mm": float(camera.data.lens) if camera else None,
        "hero_camera_target_rotation_error_radians": rotation_error,
        "hero_camera_valid": bool(
            camera
            and scene.camera == camera
            and close_vector(camera.location, EXPECTED_CAMERA_POSITION)
            and abs(camera.data.lens - 38.0) <= 1e-7
            and rotation_error <= 1e-6
        ),
        "geometry_locked": bool(scene.get("CV_GeometryLocked")),
        "hero_camera_locked": bool(scene.get("CV_HeroCameraLocked")),
        "architecture_objects": len(bpy.data.collections["CV_Architecture"].all_objects),
        "main_reactor_objects": len(bpy.data.collections["CV_Reactor"].all_objects),
        "secondary_reactor_objects": len(bpy.data.collections["CV_Reactor_Secondary"].all_objects),
        "mesh_objects": sum(1 for obj in bpy.data.objects if obj.type == "MESH"),
        "semantic_materials": len(semantic_materials),
        "emission_shader_nodes": emission_nodes,
        "nonblack_principled_emission": nonblack_principled_emission,
        "default_names": default_names,
        "utility_lights_match_er04": all(light_results.values()),
        "utility_light_checks": light_results,
        "image_paths": image_paths,
        "blend_file": bpy.data.filepath,
    }
    print("CV_ER04B_VALIDATION=" + json.dumps(result, sort_keys=True))

    failures = []
    if not result["hero_camera_valid"]:
        failures.append("hero camera")
    if not result["geometry_locked"] or not result["hero_camera_locked"]:
        failures.append("lock flags")
    if (result["architecture_objects"], result["main_reactor_objects"], result["secondary_reactor_objects"], result["mesh_objects"]) != (247, 246, 72, 571):
        failures.append("geometry counts")
    if emission_nodes or nonblack_principled_emission:
        failures.append("emission")
    if default_names:
        failures.append("default names")
    if not result["utility_lights_match_er04"]:
        failures.append("utility lights")
    if failures:
        raise RuntimeError("ER-04b validation failed: " + ", ".join(failures))


if __name__ == "__main__":
    main()
