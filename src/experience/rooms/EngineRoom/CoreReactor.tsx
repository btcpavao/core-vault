import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { deriveReactorEnergyState } from "../../energy/reactorEnergyState";
import { SpatialHitTarget } from "../../interaction/SpatialHitTarget";
import { EnergyMaterial } from "../../materials/WorldMaterials";
import { AuthoredCoreReactor } from "./components/AuthoredCoreReactor";
import { ReactorEnergyField } from "./components/ReactorEnergyField";

interface CoreReactorProps {
  visualState: EngineRoomVisualState;
  validationPulseSerial: number;
  focused: boolean;
  reducedMotion: boolean;
  onFocus: () => void;
}

export function CoreReactor({
  visualState,
  validationPulseSerial,
  focused,
  reducedMotion,
  onFocus,
}: CoreReactorProps) {
  const networkAssemblyRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const online = visualState.connection === "online";
  const networkActive = online && visualState.networkActive === true;
  const energyState = deriveReactorEnergyState(visualState);

  useFrame((_, delta) => {
    if (!reducedMotion && networkAssemblyRef.current && networkActive) {
      networkAssemblyRef.current.rotation.z -= delta * 0.09;
    }
  });

  return (
    <group position={[0, 0, -0.72]} name="core-reactor">
      <AuthoredCoreReactor energyState={energyState} reducedMotion={reducedMotion} />
      <ReactorEnergyField
        energyState={energyState}
        pulseSerial={validationPulseSerial}
        reducedMotion={reducedMotion}
      />
      <group ref={networkAssemblyRef} position={[0, 2.12, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.46, 0.032, 10, 64]} />
          <EnergyMaterial connection={visualState.connection} active={networkActive} intensity={0.76} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.46, 0.032, 10, 64]} />
          <EnergyMaterial connection={visualState.connection} active={networkActive} intensity={0.58} />
        </mesh>
      </group>
      {(focused || hovered) && (
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.26, 2.33, 64]} />
          <EnergyMaterial connection="online" active intensity={focused ? 0.72 : 0.32} />
        </mesh>
      )}
      <SpatialHitTarget
        position={[0, 2.05, 0]}
        scale={[3.8, 4.4, 3.8]}
        onActivate={onFocus}
        onHoverChange={setHovered}
      />
    </group>
  );
}
