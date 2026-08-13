import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshStandardMaterial } from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { SpatialHitTarget } from "../../interaction/SpatialHitTarget";
import {
  BronzeMaterial,
  EnergyMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
} from "../../materials/WorldMaterials";

interface CoreReactorProps {
  visualState: EngineRoomVisualState;
  focused: boolean;
  reducedMotion: boolean;
  onFocus: () => void;
}

function ReactorFoundation() {
  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.02, 2.22, 0.36, 56]} />
        <LimestoneMaterial tone="base" />
      </mesh>
      <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.87, 0.22, 56]} />
        <BronzeMaterial finish="structural" />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[1.42, 1.55, 0.14, 48]} />
        <BronzeMaterial finish="precision" />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 1.74, 0.55, Math.sin(angle) * 1.74]}
            castShadow
          >
            <cylinderGeometry args={[0.065, 0.065, 0.12, 12]} />
            <BronzeMaterial finish="dark" />
          </mesh>
        );
      })}
    </group>
  );
}

function ReactorCage() {
  return (
    <group>
      {[0.72, 1.68, 2.64, 3.55].map((height, index) => (
        <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.12 - index * 0.015, 0.1, 14, 56]} />
          <BronzeMaterial finish={index === 1 || index === 2 ? "precision" : "structural"} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 1.04, 2.12, Math.sin(angle) * 1.04]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.11, 2.76, 0.15]} />
            <BronzeMaterial finish={index % 2 === 0 ? "structural" : "dark"} />
          </mesh>
        );
      })}
      <mesh position={[0, 3.75, 0]} castShadow>
        <cylinderGeometry args={[0.75, 1.03, 0.34, 48]} />
        <BronzeMaterial finish="structural" />
      </mesh>
      <mesh position={[0, 4.01, 0]} castShadow>
        <cylinderGeometry args={[0.39, 0.58, 0.2, 32]} />
        <BronzeMaterial finish="precision" />
      </mesh>
      <mesh position={[0, 4.18, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
        <BronzeMaterial finish="dark" />
      </mesh>
    </group>
  );
}

function ComputationalCore({
  visualState,
  energyMaterialRef,
}: {
  visualState: EngineRoomVisualState;
  energyMaterialRef: RefObject<MeshStandardMaterial>;
}) {
  const online = visualState.connection === "online";
  const syncProgress = visualState.syncProgress ?? 0;

  return (
    <group>
      <mesh position={[0, 2.08, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.46, 2.74, 24]} />
        <EnergyMaterial
          ref={energyMaterialRef}
          connection={visualState.connection}
          active={online}
          intensity={visualState.activity === "syncing" ? 1.5 : 1.14}
          highlight
        />
      </mesh>
      {[-0.78, 0, 0.78].map((offset, ringIndex) => (
        <group key={offset} position={[0, 2.08 + offset, 0]} rotation={[0, ringIndex * 0.38, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.68, 0.045, 10, 44]} />
            <EnergyMaterial connection={visualState.connection} active={online} intensity={0.82} />
          </mesh>
          {Array.from({ length: 8 }, (_, index) => {
            const angle = (index / 8) * Math.PI * 2;
            return (
              <mesh
                key={index}
                position={[Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62]}
                rotation={[0, -angle, 0]}
              >
                <boxGeometry args={[0.13, 0.2, 0.08]} />
                <EnergyMaterial
                  connection={visualState.connection}
                  active={online && (ringIndex + index) % 3 !== 0}
                  intensity={0.58}
                />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh position={[0, 3.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.84, 0.032, 10, 64]} />
        <BronzeMaterial finish="dark" />
      </mesh>
      {online && (
        <mesh position={[0, 3.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[0.84, 0.052, 10, 64, Math.max(0.04, Math.PI * 2 * syncProgress)]}
          />
          <EnergyMaterial
            connection={visualState.connection}
            active
            intensity={visualState.activity === "syncing" ? 1.16 : 0.74}
          />
        </mesh>
      )}
    </group>
  );
}

function ReactorConnectors({ visualState }: { visualState: EngineRoomVisualState }) {
  const active = visualState.connection === "online" && visualState.networkActive === true;

  return (
    <group position={[0, 1.02, 0]}>
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh position={[0, 0, 1.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.58, 20]} />
            <BronzeMaterial finish="dark" />
          </mesh>
          <mesh position={[0, 0, 1.63]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.06, 10, 24]} />
            <BronzeMaterial finish="precision" />
          </mesh>
          <mesh position={[0, 0, 1.68]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <EnergyMaterial connection={visualState.connection} active={active} intensity={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function CoreReactor({
  visualState,
  focused,
  reducedMotion,
  onFocus,
}: CoreReactorProps) {
  const innerAssemblyRef = useRef<Group>(null);
  const networkAssemblyRef = useRef<Group>(null);
  const energyMaterialRef = useRef<MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const online = visualState.connection === "online";
  const networkActive = online && visualState.networkActive === true;
  const baseEnergy = online ? (visualState.activity === "syncing" ? 1.5 : 1.14) : 0.035;

  useFrame(({ clock }, delta) => {
    if (reducedMotion) {
      if (energyMaterialRef.current) energyMaterialRef.current.emissiveIntensity = baseEnergy;
      return;
    }
    if (innerAssemblyRef.current && online) {
      innerAssemblyRef.current.rotation.y += delta * (visualState.activity === "syncing" ? 0.18 : 0.065);
    }
    if (networkAssemblyRef.current && networkActive) {
      networkAssemblyRef.current.rotation.z -= delta * 0.09;
    }
    if (energyMaterialRef.current) {
      const cadence = visualState.activity === "syncing" ? 1.45 : 0.55;
      energyMaterialRef.current.emissiveIntensity =
        baseEnergy + Math.sin(clock.elapsedTime * cadence) * (online ? 0.12 : 0.01);
    }
  });

  return (
    <group position={[0, 0, -0.72]} name="core-reactor">
      <ReactorFoundation />
      <group ref={innerAssemblyRef}>
        <ComputationalCore visualState={visualState} energyMaterialRef={energyMaterialRef} />
      </group>
      <mesh position={[0, 2.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.98, 0.98, 2.95, 48, 1, true]} />
        <TechnicalGlassMaterial opacity={0.26} />
      </mesh>
      <ReactorCage />
      <ReactorConnectors visualState={visualState} />
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
