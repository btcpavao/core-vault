import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        this.result = result;
        this.onloadend?.({ target: this });
      })
      .catch((error) => this.onerror?.(error));
  }

  readAsDataURL(blob) {
    blob
      .arrayBuffer()
      .then((result) => {
        this.result = `data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;
        this.onloadend?.({ target: this });
      })
      .catch((error) => this.onerror?.(error));
  }
}

globalThis.FileReader = NodeFileReader;

const bronze = new MeshStandardMaterial({
  name: "CV_Bronze_Structural",
  color: "#66513f",
  metalness: 0.78,
  roughness: 0.4,
});
const precisionBronze = new MeshStandardMaterial({
  name: "CV_Bronze_Precision",
  color: "#8a6c4d",
  metalness: 0.82,
  roughness: 0.31,
});
const darkMetal = new MeshStandardMaterial({
  name: "CV_Dark_Metal",
  color: "#372f2a",
  metalness: 0.68,
  roughness: 0.43,
});
const glass = new MeshPhysicalMaterial({
  name: "CV_Technical_Glass",
  color: "#9dc4c5",
  transparent: true,
  opacity: 0.28,
  roughness: 0.12,
  metalness: 0.02,
});
const limestone = new MeshStandardMaterial({
  name: "CV_Limestone_Base",
  color: "#b9ad97",
  metalness: 0.02,
  roughness: 0.88,
});
const dormantEnergy = new MeshStandardMaterial({
  name: "CV_Energy_Passive",
  color: "#263a42",
  emissive: "#102126",
  emissiveIntensity: 0.045,
  metalness: 0.18,
  roughness: 0.3,
});

function part(parent, name, geometry, material, position, rotation = [0, 0, 0]) {
  const object = new Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

const root = new Group();
root.name = "CV_EngineRoom_CoolingManifold";
root.userData = {
  assetId: "cv_engine_room_cooling_manifold",
  units: "meters",
  license: "Core Vault original",
  purpose: "Passive cooling and energy-distribution anchor",
};

part(root, "Stone_Plinth", new CylinderGeometry(1.06, 1.18, 0.42, 40), limestone, [0, 0.21, 0]);
part(root, "Lower_Collar", new CylinderGeometry(0.9, 1, 0.24, 40), bronze, [0, 0.5, 0]);
part(root, "Glass_Reservoir", new CylinderGeometry(0.7, 0.7, 1.9, 40, 1, true), glass, [0, 1.53, 0]);
part(root, "Inner_Core", new CylinderGeometry(0.17, 0.23, 1.62, 20), dormantEnergy, [0, 1.53, 0]);
part(root, "Upper_Collar", new CylinderGeometry(0.88, 0.8, 0.28, 40), bronze, [0, 2.54, 0]);
part(root, "Top_Cap", new CylinderGeometry(0.48, 0.64, 0.28, 32), precisionBronze, [0, 2.82, 0]);

for (const y of [0.59, 1.54, 2.48]) {
  part(root, `Precision_Ring_${y}`, new TorusGeometry(0.74, 0.075, 12, 48), precisionBronze, [0, y, 0], [Math.PI / 2, 0, 0]);
}

for (const x of [-0.56, 0.56]) {
  for (const z of [-0.34, 0.34]) {
    part(root, `Vertical_Support_${x}_${z}`, new BoxGeometry(0.09, 1.82, 0.09), darkMetal, [x, 1.53, z]);
  }
}

for (let index = 0; index < 6; index += 1) {
  const angle = (index / 6) * Math.PI * 2;
  part(
    root,
    `Distribution_Node_${index + 1}`,
    new SphereGeometry(0.075, 16, 12),
    dormantEnergy,
    [Math.cos(angle) * 0.44, 1.53 + (index % 2 === 0 ? 0.38 : -0.38), Math.sin(angle) * 0.44],
  );
}

const outlet = new Group();
outlet.name = "Outlet_Assembly";
outlet.position.set(-0.88, 1.02, 0);
outlet.rotation.z = Math.PI / 2;
part(outlet, "Outlet_Pipe", new CylinderGeometry(0.13, 0.13, 0.78, 20), darkMetal, [0, 0, 0]);
part(outlet, "Outlet_Collar", new TorusGeometry(0.19, 0.06, 10, 28), precisionBronze, [0, -0.4, 0], [Math.PI / 2, 0, 0]);
root.add(outlet);

const exporter = new GLTFExporter();
const result = await new Promise((resolveExport, rejectExport) => {
  exporter.parse(root, resolveExport, rejectExport, {
    binary: true,
    onlyVisible: true,
    trs: false,
  });
});

if (!(result instanceof ArrayBuffer)) {
  throw new Error("Expected binary glTF output.");
}

const destination = resolve(
  process.cwd(),
  "public/assets/experience/engine-room/cv_engine_room_cooling_manifold.glb",
);
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, Buffer.from(result));
console.log(`Wrote ${destination} (${result.byteLength} bytes)`);
