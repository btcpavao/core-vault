"""Deterministically build and export the Core Vault Core Reactor v1."""

from __future__ import annotations

import argparse
import math
import struct
import sys
from pathlib import Path

import bpy


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = REPOSITORY_ROOT / "public/assets/experience/engine-room/cv_core_reactor_v1.glb"


def arguments() -> argparse.Namespace:
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build Core Reactor v1")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args(values)


def rgba(hex_color: str, alpha: float = 1.0):
    value = hex_color.removeprefix("#")
    return tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


def set_input(shader, names: tuple[str, ...], value) -> None:
    for name in names:
        socket = shader.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def make_material(
    name: str,
    color: str,
    *,
    metallic: float,
    roughness: float,
    alpha: float = 1.0,
    transmission: float = 0.0,
    emission: str | None = None,
    emission_strength: float = 0.0,
):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.diffuse_color = rgba(color, alpha)
    shader = material.node_tree.nodes.get("Principled BSDF")
    set_input(shader, ("Base Color",), rgba(color))
    set_input(shader, ("Metallic",), metallic)
    set_input(shader, ("Roughness",), roughness)
    set_input(shader, ("Alpha",), alpha)
    set_input(shader, ("IOR",), 1.49)
    set_input(shader, ("Transmission Weight", "Transmission"), transmission)
    if emission:
        set_input(shader, ("Emission Color", "Emission"), rgba(emission))
        set_input(shader, ("Emission Strength",), emission_strength)
    if alpha < 1:
        if hasattr(material, "surface_render_method"):
            material.surface_render_method = "DITHERED"
        elif hasattr(material, "blend_method"):
            material.blend_method = "BLEND"
        if hasattr(material, "use_transparency_overlap"):
            material.use_transparency_overlap = False
    return material


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for item in list(collection):
            collection.remove(item)


def empty(name: str, parent=None):
    item = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(item)
    item.parent = parent
    return item


def finish(item, material, parent, *, bevel: float = 0, smooth: bool = False):
    item.parent = parent
    item.data.materials.append(material)
    if bevel:
        bpy.context.view_layer.objects.active = item
        item.select_set(True)
        modifier = item.modifiers.new(name="Authored_Edge_Bevel", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        item.select_set(False)
    if smooth:
        for polygon in item.data.polygons:
            polygon.use_smooth = True
    return item


def cylinder(name, radius, depth, location, material, parent, *, vertices=64, rotation=(0, 0, 0), bevel=0):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation
    )
    item = bpy.context.object
    item.name = name
    return finish(item, material, parent, bevel=bevel, smooth=True)


def box(name, dimensions, location, material, parent, *, rotation=(0, 0, 0), bevel=0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    item = bpy.context.object
    item.name = name
    item.dimensions = dimensions
    bpy.context.view_layer.objects.active = item
    item.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    item.select_set(False)
    return finish(item, material, parent, bevel=bevel)


def torus(
    name,
    major_radius,
    minor_radius,
    location,
    material,
    parent,
    *,
    rotation=(0, 0, 0),
    major_segments=64,
    minor_segments=12,
):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    item = bpy.context.object
    item.name = name
    return finish(item, material, parent, smooth=True)


def sphere(name, radius, location, material, parent, *, segments=16, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=radius, location=location
    )
    item = bpy.context.object
    item.name = name
    return finish(item, material, parent, smooth=True)


def open_cylinder(name, radius, depth, location, material, parent, *, segments=96):
    vertices = []
    faces = []
    for index in range(segments):
        angle = index / segments * math.tau
        x, y = math.cos(angle) * radius, math.sin(angle) * radius
        vertices.extend(((x, y, -depth / 2), (x, y, depth / 2)))
    for index in range(segments):
        following = (index + 1) % segments
        faces.append((index * 2, following * 2, following * 2 + 1, index * 2 + 1))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    item = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(item)
    item.location = location
    return finish(item, material, parent, smooth=True)


def radial(radius: float, angle: float, height: float):
    return (math.cos(angle) * radius, math.sin(angle) * radius, height)


def build_reactor():
    limestone = make_material("CV_Limestone_Hero", "#d9cdb7", metallic=0.01, roughness=0.86)
    bronze = make_material("CV_Bronze_Structural", "#9b6b3e", metallic=0.88, roughness=0.38)
    precision = make_material("CV_Bronze_Precision", "#c18a4d", metallic=0.94, roughness=0.24)
    dark = make_material("CV_Dark_Metal", "#312d2a", metallic=0.76, roughness=0.5)
    glass = make_material(
        "CV_Technical_Glass", "#b9dde0", metallic=0, roughness=0.12, alpha=0.22, transmission=0.86
    )
    energy = make_material(
        "CV_Energy_Surface_Blue",
        "#203942",
        metallic=0.12,
        roughness=0.26,
        emission="#183540",
        emission_strength=0.04,
    )

    root = empty("CV_Core_Reactor_v1")
    root["asset_id"] = "cv_core_reactor_v1"
    root["units"] = "meters"
    root["license"] = "Core Vault original"
    root["authoring_tool"] = "Blender 5.2 LTS Python"
    root["purpose"] = "Engine Room authored hero reactor"
    foundation = empty("Architectural_Base", root)
    lower = empty("Mechanical_Lower_Collar", root)
    chamber = empty("Technical_Glass_Containment", root)
    frame = empty("Structural_Frame", root)
    core = empty("Computational_Core_Assembly", root)
    conduits = empty("Radial_Conduit_Assembly", root)
    crown = empty("Upper_Housing", root)

    cylinder("Stone_Plinth_Lower", 2.22, 0.24, (0, 0, 0.12), limestone, foundation, bevel=0.055)
    cylinder("Stone_Plinth_Mid", 2.02, 0.18, (0, 0, 0.31), limestone, foundation, bevel=0.04)
    cylinder("Stone_Plinth_Upper", 1.78, 0.16, (0, 0, 0.47), limestone, foundation, bevel=0.035)
    for index in range(8):
        angle = index / 8 * math.tau
        box(
            f"Stone_Radial_Key_{index + 1:02d}",
            (0.42, 0.22, 0.11),
            radial(1.83, angle, 0.47),
            limestone,
            foundation,
            rotation=(0, 0, angle),
            bevel=0.025,
        )

    cylinder("Lower_Collar_Dark", 1.7, 0.17, (0, 0, 0.59), dark, lower, bevel=0.035)
    cylinder("Lower_Collar_Bronze", 1.56, 0.2, (0, 0, 0.73), bronze, lower, bevel=0.035)
    torus("Lower_Precision_Seat", 1.38, 0.085, (0, 0, 0.83), precision, lower)
    torus("Lower_Isolation_Gasket", 1.2, 0.035, (0, 0, 0.79), dark, lower)

    open_cylinder("Glass_Outer_Jacket", 1.03, 2.7, (0, 0, 2.12), glass, chamber)
    open_cylinder("Glass_Inner_Jacket", 0.96, 2.58, (0, 0, 2.12), glass, chamber, segments=80)
    for height in (0.8, 1.62, 2.62, 3.48):
        torus(f"Structural_Ring_{height:.2f}", 1.12, 0.095, (0, 0, height), bronze, frame)
        torus(f"Precision_Inlay_{height:.2f}", 1.12, 0.027, (0, 0, height + 0.035), precision, frame)

    for index in range(8):
        angle = index / 8 * math.tau
        box(
            f"Vertical_Load_Spine_{index + 1:02d}",
            (0.14, 0.2, 2.58),
            radial(1.08, angle, 2.13),
            bronze if index % 2 == 0 else dark,
            frame,
            rotation=(0, 0, angle),
            bevel=0.025,
        )
        for height, suffix in ((0.82, "Lower"), (3.46, "Upper")):
            box(
                f"{suffix}_Support_Block_{index + 1:02d}",
                (0.27, 0.34, 0.16),
                radial(1.08, angle, height),
                bronze,
                frame,
                rotation=(0, 0, angle),
                bevel=0.035,
            )
            cylinder(
                f"{suffix}_Collar_Bolt_{index + 1:02d}",
                0.045,
                0.075,
                radial(1.255, angle, height),
                precision,
                frame,
                vertices=12,
                rotation=(0, math.pi / 2, angle),
                bevel=0.008,
            )

    cylinder("Core_Dark_Spine", 0.24, 2.36, (0, 0, 2.1), dark, core, vertices=40, bevel=0.025)
    cylinder("Energy_Core_Surface", 0.155, 2.22, (0, 0, 2.1), energy, core, vertices=40, bevel=0.018)
    for level_index, height in enumerate((1.2, 2.1, 3.0), start=1):
        cylinder(f"Core_Disc_Dark_{level_index}", 0.62, 0.13, (0, 0, height), dark, core, bevel=0.025)
        cylinder(f"Core_Disc_Bronze_{level_index}", 0.52, 0.08, (0, 0, height + 0.04), bronze, core, bevel=0.018)
        torus(
            f"Energy_Halo_Surface_{level_index}",
            0.46,
            0.026,
            (0, 0, height + 0.075),
            energy,
            core,
            major_segments=48,
            minor_segments=8,
        )
        for spoke_index in range(8):
            angle = spoke_index / 8 * math.tau + level_index * 0.19
            box(
                f"Core_Spoke_{level_index}_{spoke_index + 1:02d}",
                (0.34, 0.055, 0.055),
                radial(0.3, angle, height + 0.045),
                precision if spoke_index % 2 == 0 else dark,
                core,
                rotation=(0, 0, angle),
                bevel=0.012,
            )
            sphere(
                f"Compute_Node_{level_index}_{spoke_index + 1:02d}",
                0.047,
                radial(0.49, angle, height + 0.075),
                energy,
                core,
            )

    for index in range(4):
        angle = index / 4 * math.tau
        cylinder(
            f"Radial_Conduit_{index + 1:02d}",
            0.13,
            0.86,
            radial(1.32, angle, 1.03),
            dark,
            conduits,
            vertices=28,
            rotation=(0, math.pi / 2, angle),
            bevel=0.018,
        )
        torus(
            f"Conduit_Outer_Collar_{index + 1:02d}",
            0.19,
            0.055,
            radial(1.73, angle, 1.03),
            precision,
            conduits,
            rotation=(0, math.pi / 2, angle),
            major_segments=32,
            minor_segments=10,
        )
        cylinder(
            f"Conduit_Energy_Port_{index + 1:02d}",
            0.09,
            0.045,
            radial(1.79, angle, 1.03),
            energy,
            conduits,
            vertices=24,
            rotation=(0, math.pi / 2, angle),
            bevel=0.008,
        )

    cylinder("Upper_Dark_Seal", 1.2, 0.16, (0, 0, 3.53), dark, crown, bevel=0.025)
    cylinder("Upper_Main_Housing", 1.07, 0.26, (0, 0, 3.7), bronze, crown, bevel=0.05)
    cylinder("Upper_Precision_Housing", 0.78, 0.22, (0, 0, 3.94), precision, crown, bevel=0.045)
    cylinder("Upper_Service_Cap", 0.44, 0.2, (0, 0, 4.14), dark, crown, vertices=40, bevel=0.04)
    cylinder("Upper_Cap_Key", 0.16, 0.16, (0, 0, 4.31), precision, crown, vertices=24, bevel=0.025)
    for index in range(4):
        angle = index / 4 * math.tau + math.pi / 4
        box(
            f"Crown_Brace_{index + 1:02d}",
            (0.13, 0.2, 0.52),
            radial(0.78, angle, 3.71),
            dark,
            crown,
            rotation=(0, 0, angle),
            bevel=0.025,
        )
    return root


def export_glb(root, destination: Path):
    destination = destination.resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(destination),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    payload = destination.read_bytes()
    magic, version, declared_length = struct.unpack("<4sII", payload[:12])
    if len(payload) < 20 or magic != b"glTF" or version != 2 or declared_length != len(payload):
        raise RuntimeError("Exported file is not a valid glTF 2.0 binary")
    triangles = sum(
        max(0, len(polygon.vertices) - 2)
        for mesh in bpy.data.meshes
        for polygon in mesh.polygons
    )
    return len(payload), triangles


def main() -> None:
    options = arguments()
    reset_scene()
    size, triangles = export_glb(build_reactor(), options.output)
    print(f"CORE_REACTOR_V1_EXPORT_OK path={options.output.resolve()} bytes={size} triangles={triangles}")


if __name__ == "__main__":
    main()
