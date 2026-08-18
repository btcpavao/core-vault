import { memo } from "react";
import {
  BronzeMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
  type LimestoneSurface,
} from "../../../materials/WorldMaterials";
import { BeveledCylinder } from "./BeveledCylinder";

interface StoneBlockProps {
  position: [number, number, number];
  scale: [number, number, number];
  tone?: "pale" | "base" | "shadow" | "inset";
  surface?: LimestoneSurface;
  rotation?: [number, number, number];
  castShadow?: boolean;
}

function StoneBlock({
  position,
  scale,
  tone = "base",
  surface = "architectural",
  rotation,
  castShadow = false,
}: StoneBlockProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow>
      <boxGeometry args={scale} />
      <LimestoneMaterial tone={tone} surface={surface} />
    </mesh>
  );
}

function MediterraneanExterior() {
  return (
    <group name="mediterranean-exterior" position={[0, 0, -0.4]}>
      <mesh position={[-8.7, 3.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[18, 9]} />
        <meshBasicMaterial color="#b9d8df" fog={false} />
      </mesh>
      <mesh position={[-8.62, 1.12, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[18, 2.25]} />
        <meshBasicMaterial color="#5f9cac" fog={false} />
      </mesh>
      <mesh position={[-8.35, 0.07, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.1, 13]} />
        <meshStandardMaterial color="#4e91a5" metalness={0.08} roughness={0.34} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[-8.48, 0.56, -4.4]} scale={[0.48, 0.62, 2.2]}>
        <sphereGeometry args={[1.35, 28, 14]} />
        <meshStandardMaterial color="#7f9792" roughness={0.93} />
      </mesh>
      <mesh position={[-8.5, 0.3, 3.3]} scale={[0.34, 0.28, 1.45]}>
        <sphereGeometry args={[1.18, 24, 12]} />
        <meshStandardMaterial color="#91a29b" roughness={0.94} />
      </mesh>
      <mesh position={[-8.42, 4.82, -4.85]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.4, 40]} />
        <meshBasicMaterial color="#fff0c4" fog={false} />
      </mesh>
    </group>
  );
}

function BackWallBays() {
  const bayCenters = [-4.7, -2.35, 0, 2.35, 4.7] as const;

  return (
    <group>
      <StoneBlock position={[0, 0.4, -6.25]} scale={[13.2, 0.8, 0.75]} tone="shadow" />
      <StoneBlock position={[0, 5.35, -6.25]} scale={[13.2, 2.25, 0.75]} tone="base" />
      {bayCenters.map((x) => (
        <group key={x}>
          <StoneBlock position={[x - 0.95, 2.8, -6.18]} scale={[0.34, 4.4, 0.88]} tone="shadow" castShadow />
          <StoneBlock position={[x + 0.95, 2.8, -6.18]} scale={[0.34, 4.4, 0.88]} tone="shadow" castShadow />
          <StoneBlock position={[x, 4.92, -6.15]} scale={[2.25, 0.28, 0.92]} tone="pale" castShadow />
          <mesh position={[x, 2.75, -5.85]} receiveShadow>
            <planeGeometry args={[1.78, 3.9]} />
            <LimestoneMaterial tone={x === 0 ? "inset" : "base"} />
          </mesh>
          <mesh position={[x, 1.02, -5.72]} castShadow receiveShadow>
            <boxGeometry args={[1.64, 0.12, 0.48]} />
            <LimestoneMaterial tone="pale" surface="hero" />
          </mesh>
          <mesh position={[x, 4.58, -5.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.76, 0.08, 10, 40, Math.PI]} />
            <BronzeMaterial finish="dark" />
          </mesh>
          {[1.72, 2.58, 3.44].map((height) => (
            <mesh key={height} position={[x, height, -5.7]}>
              <boxGeometry args={[1.62, 0.026, 0.06]} />
              <LimestoneMaterial tone="inset" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function CeilingStructure() {
  return (
    <group>
      <StoneBlock position={[0, 6.55, -0.3]} scale={[13.4, 0.36, 12.6]} tone="shadow" />
      {[-5.45, -2.72, 0, 2.72, 5.45].map((x) => (
        <group key={x}>
          <StoneBlock position={[x, 6.18, -0.2]} scale={[0.36, 0.54, 12]} tone="base" castShadow />
          <mesh position={[x, 5.87, -0.2]} castShadow>
            <boxGeometry args={[0.16, 0.13, 11.7]} />
            <BronzeMaterial finish="structural" />
          </mesh>
        </group>
      ))}
      {[-4.7, -1.9, 0.9, 3.7].map((z) => (
        <StoneBlock key={z} position={[0, 6.04, z]} scale={[12.7, 0.3, 0.34]} tone="pale" castShadow />
      ))}
    </group>
  );
}

function SideColonnades() {
  const columnDepths = [-4.65, -1.5, 1.65, 4.8] as const;
  const archCenters = [-3.075, 0.075, 3.225] as const;

  return (
    <group>
      <StoneBlock position={[-5.72, 0.52, -0.2]} scale={[0.72, 1.04, 12]} tone="pale" />
      <StoneBlock position={[-5.72, 5.72, -0.2]} scale={[0.72, 1.3, 12]} tone="base" castShadow />
      <StoneBlock position={[5.72, 3.15, -0.2]} scale={[0.72, 6.3, 12]} tone="shadow" />
      {[-5.72, 5.72].map((x) => (
        <group key={x}>
          {columnDepths.map((z) => (
            <group key={z}>
              <mesh position={[x * 0.94, 2.72, z]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.37, 4.9, 40]} />
                <LimestoneMaterial tone={x < 0 ? "pale" : "base"} surface="hero" />
              </mesh>
              <BeveledCylinder
                position={[x * 0.94, 0.23, z]}
                radiusTop={0.48}
                radiusBottom={0.54}
                height={0.3}
                bevel={0.045}
                segments={32}
                castShadow
                receiveShadow
              >
                <LimestoneMaterial tone="base" />
              </BeveledCylinder>
              <BeveledCylinder
                position={[x * 0.94, 5.18, z]}
                radiusTop={0.3}
                radiusBottom={0.46}
                height={0.34}
                bevel={0.045}
                segments={32}
                castShadow
              >
                <LimestoneMaterial tone="base" />
              </BeveledCylinder>
            </group>
          ))}
          {x < 0 &&
            archCenters.map((z) => (
              <group key={z} position={[x * 0.94, 3.7, z]} rotation={[0, Math.PI / 2, 0]}>
                <mesh castShadow receiveShadow>
                  <torusGeometry args={[1.46, 0.25, 12, 56, Math.PI]} />
                  <LimestoneMaterial tone="pale" surface="hero" />
                </mesh>
                <mesh position={[0.01, 0, 0]}>
                  <torusGeometry args={[1.24, 0.035, 8, 48, Math.PI]} />
                  <BronzeMaterial finish="precision" />
                </mesh>
              </group>
            ))}
        </group>
      ))}
    </group>
  );
}

function WallLanterns() {
  return (
    <group name="architectural-wall-lanterns">
      {[-3.9, 0.1, 4.1].map((z) => (
        <group key={z} position={[5.22, 3.45, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.54, 20]} />
            <BronzeMaterial finish="dark" />
          </mesh>
          <mesh position={[-0.34, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.19, 0.62, 24]} />
            <TechnicalGlassMaterial opacity={0.42} />
          </mesh>
          <mesh position={[-0.34, -0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.48, 16]} />
            <meshStandardMaterial color="#ffe0a2" emissive="#efb65f" emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[-0.34, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.17, 0.035, 8, 24]} />
            <BronzeMaterial finish="precision" />
          </mesh>
          <pointLight position={[-0.48, -0.22, 0]} color="#ffd39a" intensity={2.1} distance={4.2} decay={2} />
        </group>
      ))}
    </group>
  );
}

function DeepExitPassage() {
  return (
    <group position={[4.25, 0, -6.02]}>
      <mesh position={[0, 2.2, -0.58]}>
        <planeGeometry args={[2.35, 4.35]} />
        <meshStandardMaterial color="#101a1e" roughness={0.96} />
      </mesh>
      <StoneBlock position={[-1.35, 1.7, 0.3]} scale={[0.58, 3.4, 1.65]} tone="shadow" castShadow />
      <StoneBlock position={[1.35, 1.7, 0.3]} scale={[0.58, 3.4, 1.65]} tone="shadow" castShadow />
      <mesh position={[0, 3.43, 0.3]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[1.35, 0.29, 12, 48, Math.PI]} />
        <LimestoneMaterial tone="shadow" />
      </mesh>
      <mesh position={[0, 3.43, 0.29]}>
        <torusGeometry args={[1.08, 0.055, 10, 48, Math.PI]} />
        <BronzeMaterial finish="structural" />
      </mesh>
      <StoneBlock position={[0, 0.09, 0.58]} scale={[2.45, 0.18, 1.85]} tone="inset" />
      {[-0.68, 0, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.22]}>
          <boxGeometry args={[0.04, 0.04, 1.35]} />
          <BronzeMaterial finish="dark" />
        </mesh>
      ))}
    </group>
  );
}

function ReactorDais() {
  return (
    <group position={[0, 0, -0.72]}>
      <BeveledCylinder
        position={[0, 0.015, 0]}
        radiusTop={4.05}
        radiusBottom={4.28}
        height={0.16}
        bevel={0.055}
        receiveShadow
      >
        <LimestoneMaterial tone="shadow" surface="floor" />
      </BeveledCylinder>
      <BeveledCylinder
        position={[0, 0.13, 0]}
        radiusTop={3.45}
        radiusBottom={3.68}
        height={0.3}
        bevel={0.07}
        receiveShadow
      >
        <LimestoneMaterial tone="base" surface="floor" />
      </BeveledCylinder>
      <BeveledCylinder
        position={[0, 0.3, 0]}
        radiusTop={2.92}
        radiusBottom={3.1}
        height={0.18}
        bevel={0.045}
        receiveShadow
      >
        <LimestoneMaterial tone="pale" surface="floor" />
      </BeveledCylinder>
      {[2.98, 3.5].map((radius) => (
        <mesh key={radius} position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.045, 10, 72]} />
          <BronzeMaterial finish={radius < 3.2 ? "precision" : "dark"} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 3.82, 0.105, Math.sin(angle) * 3.82]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.28, 0.08, 0.62]} />
            <BronzeMaterial finish={index % 3 === 0 ? "precision" : "dark"} />
          </mesh>
        );
      })}
    </group>
  );
}

function FloorJointGrid() {
  return (
    <group name="precision-floor-joints">
      {[-5.2, -2.6, 0, 2.6, 5.2].map((x) => (
        <mesh key={`x-${x}`} position={[x, 0.006, -0.2]} receiveShadow>
          <boxGeometry args={[0.018, 0.012, 12.2]} />
          <LimestoneMaterial tone="inset" />
        </mesh>
      ))}
      {[-4.8, -2.4, 0, 2.4, 4.8].map((z) => (
        <mesh key={`z-${z}`} position={[0, 0.006, z]} receiveShadow>
          <boxGeometry args={[12.5, 0.012, 0.018]} />
          <LimestoneMaterial tone="inset" />
        </mesh>
      ))}
    </group>
  );
}

function RoomArchitectureComponent({ onClearFocus }: { onClearFocus: () => void }) {
  return (
    <group name="engine-room-static-architecture">
      <MediterraneanExterior />
      <mesh position={[0, -0.12, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClearFocus}>
        <planeGeometry args={[13.4, 13]} />
        <LimestoneMaterial tone="base" surface="floor" />
      </mesh>
      <StoneBlock position={[0, -0.27, -0.2]} scale={[13.5, 0.35, 13]} tone="inset" />
      <BackWallBays />
      <SideColonnades />
      <CeilingStructure />
      <WallLanterns />
      <FloorJointGrid />
      <ReactorDais />
      <DeepExitPassage />
      {[-3.25, 3.25].map((x) => (
        <mesh key={x} position={[x, 0.045, -0.65]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.18, 10.2]} />
          <BronzeMaterial finish="dark" />
        </mesh>
      ))}
    </group>
  );
}

export const RoomArchitecture = memo(RoomArchitectureComponent);
