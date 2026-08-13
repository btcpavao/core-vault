import { forwardRef } from "react";
import {
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Material,
} from "three";
import type { EngineRoomConnection } from "../adapters/nodeVisualState";
import { WORLD_TEXTURES } from "./proceduralTextures";

export const WORLD_MATERIALS = {
  limestone: {
    pale: "#e5dece",
    base: "#cabea7",
    shadow: "#928775",
    inset: "#625f57",
  },
  bronze: {
    structural: "#745945",
    precision: "#92704c",
    dark: "#403731",
  },
  technicalGlass: "#c3d2cd",
  energy: {
    active: "#3da8ce",
    highlight: "#c7edf3",
    dormant: "#2b3e45",
    offline: "#1b272c",
  },
} as const;

type LimestoneTone = keyof typeof WORLD_MATERIALS.limestone;
type BronzeFinish = keyof typeof WORLD_MATERIALS.bronze;
export type LimestoneSurface = "architectural" | "floor";

const STONE_NORMAL_SCALE = new Vector2(0.11, 0.11);
const FLOOR_NORMAL_SCALE = new Vector2(0.14, 0.14);
const BRONZE_NORMAL_SCALE = {
  structural: new Vector2(0.13, 0.06),
  precision: new Vector2(0.1, 0.045),
  dark: new Vector2(0.085, 0.05),
} as const;

export function LimestoneMaterial({
  tone = "base",
  surface = "architectural",
}: {
  tone?: LimestoneTone;
  surface?: LimestoneSurface;
}) {
  const textures = surface === "floor" ? WORLD_TEXTURES.floor : WORLD_TEXTURES.limestone;

  return (
    <meshStandardMaterial
      color={WORLD_MATERIALS.limestone[tone]}
      map={textures.baseColor}
      roughnessMap={textures.roughness}
      normalMap={textures.normal}
      normalScale={surface === "floor" ? FLOOR_NORMAL_SCALE : STONE_NORMAL_SCALE}
      metalness={0.01}
      roughness={tone === "pale" ? 0.9 : 0.97}
      envMapIntensity={0.58}
    />
  );
}

export function BronzeMaterial({ finish = "structural" }: { finish?: BronzeFinish }) {
  return (
    <meshStandardMaterial
      color={WORLD_MATERIALS.bronze[finish]}
      map={WORLD_TEXTURES.bronze.baseColor}
      roughnessMap={WORLD_TEXTURES.bronze.roughness}
      normalMap={WORLD_TEXTURES.bronze.normal}
      normalScale={BRONZE_NORMAL_SCALE[finish]}
      metalnessMap={WORLD_TEXTURES.bronze.metalness}
      metalness={finish === "dark" ? 0.8 : finish === "precision" ? 0.96 : 0.92}
      roughness={finish === "precision" ? 0.58 : finish === "dark" ? 0.82 : 0.72}
      envMapIntensity={0.9}
    />
  );
}

export function TechnicalGlassMaterial({ opacity = 0.27 }: { opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color={WORLD_MATERIALS.technicalGlass}
      roughnessMap={WORLD_TEXTURES.glassRoughness}
      transparent
      opacity={opacity}
      transmission={0.38}
      thickness={0.3}
      ior={1.47}
      roughness={0.34}
      metalness={0.01}
      specularIntensity={0.72}
      clearcoat={0.62}
      clearcoatRoughness={0.2}
      attenuationColor="#d8e4df"
      attenuationDistance={1.4}
      depthWrite={false}
      side={DoubleSide}
    />
  );
}

export function clonePolishedAuthoredMaterial(source: Material) {
  const material = source.clone();
  if (!(material instanceof MeshStandardMaterial)) return material;

  if (material.name.includes("Limestone")) {
    material.color.set(WORLD_MATERIALS.limestone.base);
    material.map = WORLD_TEXTURES.limestone.baseColor;
    material.roughnessMap = WORLD_TEXTURES.limestone.roughness;
    material.normalMap = WORLD_TEXTURES.limestone.normal;
    material.normalScale.copy(STONE_NORMAL_SCALE);
    material.metalness = 0.01;
    material.roughness = 0.97;
    material.envMapIntensity = 0.58;
  } else if (material.name.includes("Bronze") || material.name.includes("Dark_Metal")) {
    const precision = material.name.includes("Precision");
    const dark = material.name.includes("Dark_Metal");
    const finish: BronzeFinish = precision ? "precision" : dark ? "dark" : "structural";
    material.color.set(WORLD_MATERIALS.bronze[finish]);
    material.map = WORLD_TEXTURES.bronze.baseColor;
    material.roughnessMap = WORLD_TEXTURES.bronze.roughness;
    material.normalMap = WORLD_TEXTURES.bronze.normal;
    material.normalScale.copy(BRONZE_NORMAL_SCALE[finish]);
    material.metalnessMap = WORLD_TEXTURES.bronze.metalness;
    material.metalness = finish === "dark" ? 0.8 : finish === "precision" ? 0.96 : 0.92;
    material.roughness = finish === "precision" ? 0.58 : finish === "dark" ? 0.82 : 0.72;
    material.envMapIntensity = 0.9;
  } else if (material.name.includes("Technical_Glass")) {
    material.color.set(WORLD_MATERIALS.technicalGlass);
    material.roughnessMap = WORLD_TEXTURES.glassRoughness;
    material.metalness = 0.01;
    material.roughness = 0.34;
    material.transparent = true;
    material.opacity = 0.27;
    material.depthWrite = false;
    material.side = DoubleSide;

    if (material instanceof MeshPhysicalMaterial) {
      material.transmission = 0.38;
      material.thickness = 0.3;
      material.ior = 1.47;
      material.specularIntensity = 0.72;
      material.clearcoat = 0.62;
      material.clearcoatRoughness = 0.2;
      material.attenuationColor.set("#d8e4df");
      material.attenuationDistance = 1.4;
    }
  }

  material.needsUpdate = true;
  return material;
}

interface EnergyMaterialProps {
  connection: EngineRoomConnection;
  active?: boolean;
  intensity?: number;
  highlight?: boolean;
}

export const EnergyMaterial = forwardRef<MeshStandardMaterial, EnergyMaterialProps>(
  function EnergyMaterial(
    { connection, active = true, intensity = 0.8, highlight = false },
    ref,
  ) {
    const energized = connection === "online" && active;
    const color = energized
      ? highlight
        ? WORLD_MATERIALS.energy.highlight
        : WORLD_MATERIALS.energy.active
      : connection === "offline"
        ? WORLD_MATERIALS.energy.offline
        : WORLD_MATERIALS.energy.dormant;

    return (
      <meshStandardMaterial
        ref={ref}
        color={color}
        emissive={color}
        emissiveIntensity={energized ? intensity : 0.035}
        metalness={0.18}
        roughness={0.3}
      />
    );
  },
);
