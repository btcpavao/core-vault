import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import type { EngineRoomVisualState } from "../../../adapters/nodeVisualState";
import { SpatialHitTarget } from "../../../interaction/SpatialHitTarget";
import {
  BronzeMaterial,
  EnergyMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
} from "../../../materials/WorldMaterials";

interface NetworkConsoleProps {
  visualState: EngineRoomVisualState;
  focused: boolean;
  onFocus: () => void;
}

export function NetworkConsole({ visualState, focused, onFocus }: NetworkConsoleProps) {
  const [hovered, setHovered] = useState(false);
  const active = visualState.connection === "online" && visualState.networkActive === true;

  return (
    <group position={[-4.25, 0, -1.55]} rotation={[0, 0.28, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.5, 1.7]} />
        <LimestoneMaterial tone="shadow" />
      </mesh>
      <mesh position={[0, 0.57, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.18, 0.18, 1.42]} />
        <BronzeMaterial finish="structural" />
      </mesh>
      <RoundedBox args={[2.06, 0.92, 1.3]} radius={0.08} smoothness={3} position={[0, 1.03, -0.08]} castShadow>
        <BronzeMaterial finish="dark" />
      </RoundedBox>
      <mesh position={[0, 1.55, 0.06]} rotation={[-0.24, 0, 0]} castShadow>
        <boxGeometry args={[1.82, 0.13, 0.92]} />
        <BronzeMaterial finish="precision" />
      </mesh>
      <mesh position={[0, 1.62, 0.11]} rotation={[-0.24, 0, 0]}>
        <planeGeometry args={[1.48, 0.59]} />
        <EnergyMaterial connection={visualState.connection} active={active} intensity={0.72} />
      </mesh>
      <mesh position={[0, 1.64, 0.12]} rotation={[-0.24, 0, 0]}>
        <planeGeometry args={[1.62, 0.73]} />
        <TechnicalGlassMaterial opacity={0.16} />
      </mesh>
      {[-0.58, -0.29, 0, 0.29, 0.58].map((x, index) => (
        <mesh key={x} position={[x, 0.88, 0.61]}>
          <cylinderGeometry args={[0.045, 0.045, 0.035 + (index % 2) * 0.02, 16]} />
          <EnergyMaterial
            connection={visualState.connection}
            active={active && index < Math.min(5, Math.max(1, Math.ceil((visualState.peerCount ?? 0) / 2)))}
            intensity={0.58}
          />
        </mesh>
      ))}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.67]} castShadow>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <BronzeMaterial finish="structural" />
        </mesh>
      ))}
      {(focused || hovered) && (
        <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.58, 48]} />
          <EnergyMaterial connection="online" active intensity={focused ? 0.7 : 0.32} />
        </mesh>
      )}
      <SpatialHitTarget
        position={[0, 1.05, 0]}
        scale={[2.8, 2.25, 2.1]}
        onActivate={onFocus}
        onHoverChange={setHovered}
      />
    </group>
  );
}
