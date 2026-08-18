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
      <RoundedBox args={[2.55, 0.5, 1.7]} radius={0.07} smoothness={3} position={[0, 0.24, 0]} castShadow receiveShadow>
        <LimestoneMaterial tone="shadow" surface="hero" />
      </RoundedBox>
      <RoundedBox args={[2.18, 0.18, 1.42]} radius={0.045} smoothness={3} position={[0, 0.57, 0]} castShadow receiveShadow>
        <BronzeMaterial finish="structural" />
      </RoundedBox>
      <RoundedBox args={[2.06, 0.92, 1.3]} radius={0.08} smoothness={3} position={[0, 1.03, -0.08]} castShadow>
        <BronzeMaterial finish="dark" />
      </RoundedBox>
      <RoundedBox args={[1.82, 0.13, 0.92]} radius={0.035} smoothness={3} position={[0, 1.55, 0.06]} rotation={[-0.24, 0, 0]} castShadow>
        <BronzeMaterial finish="precision" />
      </RoundedBox>
      <group position={[0, 1.63, 0.12]} rotation={[-0.24, 0, 0]} name="network-console-display">
        <mesh>
          <planeGeometry args={[1.62, 0.7]} />
          <meshStandardMaterial color="#101d22" roughness={0.32} metalness={0.22} />
        </mesh>
        <mesh position={[0, 0, 0.008]}>
          <planeGeometry args={[1.48, 0.58]} />
          <EnergyMaterial connection={visualState.connection} active={active} intensity={0.2} />
        </mesh>
        {[-0.19, -0.06, 0.07, 0.2].map((y, index) => (
          <mesh key={y} position={[-0.18 + index * 0.07, y, 0.016]}>
            <boxGeometry args={[1.02 - index * 0.12, 0.012, 0.008]} />
            <EnergyMaterial
              connection={visualState.connection}
              active={active}
              highlight={index === 0}
              intensity={0.42}
            />
          </mesh>
        ))}
        {[-0.61, -0.43, 0.48, 0.64].map((x) => (
          <mesh key={x} position={[x, 0, 0.017]}>
            <boxGeometry args={[0.009, 0.48, 0.008]} />
            <EnergyMaterial connection={visualState.connection} active={active} intensity={0.24} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[1.64, 0.72]} />
          <TechnicalGlassMaterial opacity={0.22} />
        </mesh>
      </group>
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
