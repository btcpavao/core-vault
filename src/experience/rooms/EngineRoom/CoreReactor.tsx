import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshStandardMaterial } from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { deriveReactorEnergyState } from "../../energy/reactorEnergyState";
import { SpatialHitTarget } from "../../interaction/SpatialHitTarget";
import { ReactorEnergyField } from "./components/ReactorEnergyField";
import { BeveledCylinder } from "./components/BeveledCylinder";
import {
  BronzeMaterial,
  EnergyMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
} from "../../materials/WorldMaterials";

interface CoreReactorProps {
  visualState: EngineRoomVisualState;
  validationPulseSerial: number;
  focused: boolean;
  reducedMotion: boolean;
  onFocus: () => void;
}

function ReactorFoundation() {
  return (
    <group>
      <BeveledCylinder
        position={[0, 0.18, 0]}
        radiusTop={2.02}
        radiusBottom={2.22}
        height={0.36}
        bevel={0.075}
        castShadow
        receiveShadow
      >
        <LimestoneMaterial tone="base" surface="hero" />
      </BeveledCylinder>
      <BeveledCylinder
        position={[0, 0.43, 0]}
        radiusTop={1.7}
        radiusBottom={1.87}
        height={0.22}
        bevel={0.045}
        castShadow
        receiveShadow
      >
        <BronzeMaterial finish="structural" />
      </BeveledCylinder>
      <BeveledCylinder
        position={[0, 0.58, 0]}
        radiusTop={1.42}
        radiusBottom={1.55}
        height={0.14}
        bevel={0.025}
        castShadow
      >
        <BronzeMaterial finish="precision" />
      </BeveledCylinder>
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
      {[0.79, 1.61, 2.71, 3.48].map((height) => (
        <mesh key={`gasket-${height}`} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.015, 0.025, 8, 56]} />
          <BronzeMaterial finish="dark" />
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
      {[0.78, 3.5].flatMap((height) =>
        Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <mesh
              key={`collar-bolt-${height}-${index}`}
              position={[Math.cos(angle) * 1.09, height, Math.sin(angle) * 1.09]}
              rotation={[0, -angle, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.034, 0.034, 0.045, 8]} />
              <BronzeMaterial finish="dark" />
            </mesh>
          );
        }),
      )}
      <BeveledCylinder
        position={[0, 3.75, 0]}
        radiusTop={0.75}
        radiusBottom={1.03}
        height={0.34}
        bevel={0.055}
        segments={56}
        castShadow
      >
        <BronzeMaterial finish="structural" />
      </BeveledCylinder>
      <BeveledCylinder
        position={[0, 4.01, 0]}
        radiusTop={0.39}
        radiusBottom={0.58}
        height={0.2}
        bevel={0.04}
        segments={48}
        castShadow
      >
        <BronzeMaterial finish="precision" />
      </BeveledCylinder>
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
          intensity={visualState.activity === "syncing" ? 1.12 : 0.78}
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
  validationPulseSerial,
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
  const energyState = deriveReactorEnergyState(visualState);
  const baseEnergy = online ? (visualState.activity === "syncing" ? 1.12 : 0.78) : 0.035;

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
      <ReactorEnergyField
        energyState={energyState}
        pulseSerial={validationPulseSerial}
        reducedMotion={reducedMotion}
      />
      <mesh position={[0, 2.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.99, 0.99, 2.95, 72, 1, true]} />
        <TechnicalGlassMaterial opacity={0.2} />
      </mesh>
      <mesh position={[0, 2.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.945, 0.945, 2.87, 72, 1, true]} />
        <TechnicalGlassMaterial opacity={0.075} />
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
