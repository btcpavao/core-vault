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
    pale: "#eadfcd",
    base: "#d8c7ae",
    shadow: "#b6a288",
    inset: "#918371",
  },
  bronze: {
    structural: "#9f6534",
    precision: "#c98a45",
    dark: "#3b342e",
  },
  technicalGlass: "#e0f3f1",
  energy: {
    active: "#35bdf2",
    highlight: "#d2f5ff",
    dormant: "#31464d",
    offline: "#1e2d32",
  },
} as const;

type LimestoneTone = keyof typeof WORLD_MATERIALS.limestone;
type BronzeFinish = keyof typeof WORLD_MATERIALS.bronze;
export type LimestoneSurface = "architectural" | "hero" | "floor";

const STONE_NORMAL_SCALE = new Vector2(0.15, 0.15);
const HERO_STONE_NORMAL_SCALE = new Vector2(0.22, 0.22);
const FLOOR_NORMAL_SCALE = new Vector2(0.18, 0.18);
const BRONZE_NORMAL_SCALE = {
  structural: new Vector2(0.16, 0.07),
  precision: new Vector2(0.12, 0.05),
  dark: new Vector2(0.1, 0.055),
} as const;

export function LimestoneMaterial({
  tone = "base",
  surface = "architectural",
}: {
  tone?: LimestoneTone;
  surface?: LimestoneSurface;
}) {
  const textures =
    surface === "floor"
      ? WORLD_TEXTURES.floor
      : surface === "hero"
        ? WORLD_TEXTURES.limestoneHero
        : WORLD_TEXTURES.limestone;

  return (
    <meshPhysicalMaterial
      color={WORLD_MATERIALS.limestone[tone]}
      map={textures.baseColor}
      roughnessMap={textures.roughness}
      normalMap={textures.normal}
      normalScale={
        surface === "floor"
          ? FLOOR_NORMAL_SCALE
          : surface === "hero"
            ? HERO_STONE_NORMAL_SCALE
            : STONE_NORMAL_SCALE
      }
      metalness={0.01}
      roughness={
        surface === "floor"
          ? 0.63
          : tone === "pale"
            ? 0.74
            : tone === "inset"
              ? 0.89
              : 0.79
      }
      envMapIntensity={surface === "architectural" ? 0.78 : surface === "floor" ? 1.04 : 0.94}
      clearcoat={surface === "floor" ? 0.16 : surface === "hero" ? 0.1 : 0.04}
      clearcoatRoughness={surface === "floor" ? 0.48 : 0.64}
    />
  );
}

export function BronzeMaterial({ finish = "structural" }: { finish?: BronzeFinish }) {
  return (
    <meshPhysicalMaterial
      color={WORLD_MATERIALS.bronze[finish]}
      map={WORLD_TEXTURES.bronze.baseColor}
      roughnessMap={WORLD_TEXTURES.bronze.roughness}
      normalMap={WORLD_TEXTURES.bronze.normal}
      normalScale={BRONZE_NORMAL_SCALE[finish]}
      metalnessMap={WORLD_TEXTURES.bronze.metalness}
      metalness={finish === "dark" ? 0.82 : finish === "precision" ? 0.96 : 0.92}
      roughness={finish === "precision" ? 0.28 : finish === "dark" ? 0.56 : 0.38}
      envMapIntensity={finish === "precision" ? 1.92 : finish === "dark" ? 1.18 : 1.58}
      anisotropy={finish === "dark" ? 0.22 : finish === "precision" ? 0.62 : 0.48}
      anisotropyRotation={Math.PI / 2}
      clearcoat={finish === "precision" ? 0.18 : 0.07}
      clearcoatRoughness={0.2}
    />
  );
}

export function TechnicalGlassMaterial({ opacity = 0.27 }: { opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color={WORLD_MATERIALS.technicalGlass}
      roughnessMap={WORLD_TEXTURES.glassRoughness}
      transparent
      opacity={Math.max(opacity, 0.31)}
      transmission={0.94}
      thickness={0.5}
      ior={1.49}
      roughness={0.085}
      metalness={0.01}
      specularIntensity={1}
      envMapIntensity={2.15}
      clearcoat={1}
      clearcoatRoughness={0.045}
      attenuationColor="#cde9e8"
      attenuationDistance={3.2}
      depthWrite={false}
      side={DoubleSide}
    />
  );
}

export function clonePolishedAuthoredMaterial(source: Material) {
  let material: Material;

  if (source.name.includes("Limestone")) {
    const hero = source.name.includes("Hero");
    const textures = hero ? WORLD_TEXTURES.limestoneHero : WORLD_TEXTURES.limestone;
    material = new MeshPhysicalMaterial({
      name: source.name,
      color: WORLD_MATERIALS.limestone.base,
      map: textures.baseColor,
      roughnessMap: textures.roughness,
      normalMap: textures.normal,
      normalScale: hero ? HERO_STONE_NORMAL_SCALE : STONE_NORMAL_SCALE,
      metalness: 0.01,
      roughness: hero ? 0.75 : 0.81,
      envMapIntensity: hero ? 0.98 : 0.78,
      clearcoat: hero ? 0.11 : 0.04,
      clearcoatRoughness: 0.58,
    });
  } else if (source.name.includes("Bronze") || source.name.includes("Dark_Metal")) {
    const precision = source.name.includes("Precision");
    const dark = source.name.includes("Dark_Metal");
    const finish: BronzeFinish = precision ? "precision" : dark ? "dark" : "structural";
    material = new MeshPhysicalMaterial({
      name: source.name,
      color: WORLD_MATERIALS.bronze[finish],
      map: WORLD_TEXTURES.bronze.baseColor,
      roughnessMap: WORLD_TEXTURES.bronze.roughness,
      normalMap: WORLD_TEXTURES.bronze.normal,
      normalScale: BRONZE_NORMAL_SCALE[finish],
      metalnessMap: WORLD_TEXTURES.bronze.metalness,
      metalness: dark ? 0.82 : precision ? 0.96 : 0.92,
      roughness: precision ? 0.28 : dark ? 0.56 : 0.38,
      envMapIntensity: precision ? 1.92 : dark ? 1.18 : 1.58,
      anisotropy: dark ? 0.22 : precision ? 0.62 : 0.48,
      anisotropyRotation: Math.PI / 2,
      clearcoat: precision ? 0.18 : 0.07,
      clearcoatRoughness: 0.2,
    });
  } else if (source.name.includes("Technical_Glass")) {
    material = new MeshPhysicalMaterial({
      name: source.name,
      color: WORLD_MATERIALS.technicalGlass,
      roughnessMap: WORLD_TEXTURES.glassRoughness,
      metalness: 0.01,
      roughness: 0.085,
      transparent: true,
      opacity: 0.34,
      transmission: 0.94,
      thickness: 0.5,
      ior: 1.49,
      specularIntensity: 1,
      envMapIntensity: 2.15,
      clearcoat: 1,
      clearcoatRoughness: 0.045,
      attenuationColor: "#cde9e8",
      attenuationDistance: 3.2,
      depthWrite: false,
      side: DoubleSide,
    });
  } else {
    material = source.clone();
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
