"""Deterministic ER-04b/ER-04c state signatures for read-only validation.

Geometry excludes polygon smooth flags and edge sharp flags by design: those are
the only attributes ER-04c is allowed to change. Material, camera, light and
render signatures remain exact.
"""

import hashlib
import json

import bpy


def plain(value):
    if isinstance(value, (bool, int, str)) or value is None:
        return value
    if isinstance(value, float):
        return round(value, 12)
    try:
        return [plain(item) for item in value]
    except TypeError:
        return str(value)


def digest(value):
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def modifier_state(modifier):
    state = {
        "name": modifier.name,
        "type": modifier.type,
        "show_render": modifier.show_render,
        "show_viewport": modifier.show_viewport,
    }
    for attribute in (
        "width", "segments", "limit_method", "angle_limit", "harden_normals",
        "affect", "offset_type", "profile", "use_clamp_overlap",
    ):
        if hasattr(modifier, attribute):
            state[attribute] = plain(getattr(modifier, attribute))
    return state


def geometry_state():
    rows = []
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        row = {
            "name": obj.name,
            "type": obj.type,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
            "scale": plain(obj.scale),
            "parent": obj.parent.name if obj.parent else None,
        }
        if obj.type == "MESH":
            mesh = obj.data
            row.update({
                "mesh": mesh.name,
                "vertices": [[vertex.index, plain(vertex.co)] for vertex in mesh.vertices],
                "edges": [[edge.index, list(edge.vertices)] for edge in mesh.edges],
                "polygons": [[polygon.index, list(polygon.vertices)] for polygon in mesh.polygons],
                "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
                "modifiers": [modifier_state(modifier) for modifier in obj.modifiers],
            })
        rows.append(row)
    return rows


def node_state(node):
    state = {
        "name": node.name,
        "label": node.label,
        "type": node.bl_idname,
        "location": plain(node.location),
        "mute": node.mute,
        "inputs": [],
    }
    for socket in node.inputs:
        entry = {"name": socket.name, "linked": socket.is_linked}
        if hasattr(socket, "default_value"):
            entry["default"] = plain(socket.default_value)
        state["inputs"].append(entry)
    for attribute in (
        "operation", "blend_type", "noise_dimensions", "rotation_type",
        "interpolation_type", "clamp", "invert",
    ):
        if hasattr(node, attribute):
            state[attribute] = plain(getattr(node, attribute))
    if node.bl_idname == "ShaderNodeValToRGB":
        state["color_ramp"] = {
            "interpolation": node.color_ramp.interpolation,
            "elements": [
                {"position": plain(element.position), "color": plain(element.color)}
                for element in node.color_ramp.elements
            ],
        }
    return state


def material_state():
    rows = []
    for material in sorted(bpy.data.materials, key=lambda item: item.name):
        row = {
            "name": material.name,
            "diffuse_color": plain(material.diffuse_color),
            "custom": {key: plain(material[key]) for key in sorted(material.keys())},
            "surface_render_method": getattr(material, "surface_render_method", None),
            "nodes": [],
            "links": [],
        }
        if material.node_tree:
            row["nodes"] = [node_state(node) for node in sorted(material.node_tree.nodes, key=lambda item: item.name)]
            row["links"] = sorted([
                [link.from_node.name, link.from_socket.name, link.to_node.name, link.to_socket.name]
                for link in material.node_tree.links
            ])
        rows.append(row)
    return rows


def camera_light_state():
    rows = []
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        if obj.type not in {"CAMERA", "LIGHT"}:
            continue
        row = {
            "name": obj.name,
            "type": obj.type,
            "location": plain(obj.location),
            "rotation_euler": plain(obj.rotation_euler),
        }
        if obj.type == "CAMERA":
            row.update({
                "lens": plain(obj.data.lens),
                "sensor_width": plain(obj.data.sensor_width),
                "sensor_fit": obj.data.sensor_fit,
                "clip_start": plain(obj.data.clip_start),
                "clip_end": plain(obj.data.clip_end),
            })
        else:
            row.update({
                "light_type": obj.data.type,
                "energy": plain(obj.data.energy),
                "shape": obj.data.shape,
                "size": plain(obj.data.size),
                "color": plain(obj.data.color),
            })
        rows.append(row)
    scene = bpy.context.scene
    return {
        "objects": rows,
        "active_camera": scene.camera.name if scene.camera else None,
        "world_color": plain(scene.world.color),
        "render": {
            "engine": scene.render.engine,
            "resolution_x": scene.render.resolution_x,
            "resolution_y": scene.render.resolution_y,
            "resolution_percentage": scene.render.resolution_percentage,
            "look": scene.view_settings.look,
        },
    }


def signature_report():
    return {
        "geometry": digest(geometry_state()),
        "materials": digest(material_state()),
        "cameras_lights": digest(camera_light_state()),
    }


if __name__ == "__main__":
    print("CV_ER04C_SIGNATURES=" + json.dumps(signature_report(), sort_keys=True))
