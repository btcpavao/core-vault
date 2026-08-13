import { forwardRef } from "react";
import { DoubleSide, type MeshStandardMaterial } from "three";
import type { EngineRoomConnection } from "../adapters/nodeVisualState";

export const WORLD_MATERIALS = {
  limestone: {
    pale: "#d8cfbd",
    base: "#b9ad97",
    shadow: "#7f7668",
    inset: "#5e5a52",
  },
  bronze: {
    structural: "#66513f",
    precision: "#8a6c4d",
    dark: "#372f2a",
  },
  technicalGlass: "#9dc4c5",
  energy: {
    active: "#45bde8",
    highlight: "#d8f7ff",
    dormant: "#263a42",
    offline: "#1c282d",
  },
} as const;

type LimestoneTone = keyof typeof WORLD_MATERIALS.limestone;
type BronzeFinish = keyof typeof WORLD_MATERIALS.bronze;

export function LimestoneMaterial({ tone = "base" }: { tone?: LimestoneTone }) {
  return (
    <meshStandardMaterial
      color={WORLD_MATERIALS.limestone[tone]}
      metalness={0.02}
      roughness={tone === "pale" ? 0.76 : 0.88}
      envMapIntensity={0.45}
    />
  );
}

export function BronzeMaterial({ finish = "structural" }: { finish?: BronzeFinish }) {
  return (
    <meshStandardMaterial
      color={WORLD_MATERIALS.bronze[finish]}
      metalness={finish === "dark" ? 0.62 : 0.78}
      roughness={finish === "precision" ? 0.31 : 0.4}
      envMapIntensity={0.72}
    />
  );
}

export function TechnicalGlassMaterial({ opacity = 0.28 }: { opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color={WORLD_MATERIALS.technicalGlass}
      transparent
      opacity={opacity}
      transmission={0.22}
      thickness={0.18}
      ior={1.42}
      roughness={0.12}
      metalness={0.02}
      clearcoat={0.45}
      clearcoatRoughness={0.18}
      depthWrite={false}
      side={DoubleSide}
    />
  );
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
