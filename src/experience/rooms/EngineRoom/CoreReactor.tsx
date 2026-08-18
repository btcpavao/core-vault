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
      networkAssemblyRef.current.rotation.y -= delta * 0.07;
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
      <group ref={networkAssemblyRef} position={[0, 2.12, 0]} name="network-segment-assembly">
        {[-0.9, 0.9].map((height) =>
          Array.from({ length: 4 }, (_, index) => (
            <group key={`${height}-${index}`} position={[0, height, 0]} rotation={[0, index * Math.PI * 0.5, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.38, 0.025, 8, 28, Math.PI * 0.3]} />
                <EnergyMaterial
                  connection={visualState.connection}
                  active={networkActive}
                  intensity={height < 0 ? 0.5 : 0.38}
                />
              </mesh>
            </group>
          )),
        )}
      </group>
      {(focused || hovered) && (
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.26, 2.33, 64]} />
          <EnergyMaterial
            connection={visualState.connection}
            active={online}
            intensity={focused ? 0.62 : 0.28}
          />
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
