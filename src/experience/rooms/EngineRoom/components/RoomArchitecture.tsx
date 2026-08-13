import { memo } from "react";
import {
  BronzeMaterial,
  LimestoneMaterial,
  type LimestoneSurface,
} from "../../../materials/WorldMaterials";

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
  return (
    <group>
      {[-5.72, 5.72].map((x) => (
        <group key={x}>
          <StoneBlock position={[x, 3.15, -3.55]} scale={[0.72, 6.3, 5.45]} tone={x < 0 ? "shadow" : "base"} />
          {[-4.65, -1.5, 1.65, 4.8].map((z) => (
            <group key={z}>
              <mesh position={[x * 0.94, 2.72, z]} castShadow receiveShadow>
                <cylinderGeometry args={[0.28, 0.34, 4.9, 20]} />
                <LimestoneMaterial tone={x < 0 ? "shadow" : "pale"} />
              </mesh>
              <mesh position={[x * 0.94, 0.23, z]} castShadow receiveShadow>
                <cylinderGeometry args={[0.48, 0.54, 0.3, 20]} />
                <LimestoneMaterial tone="base" />
              </mesh>
              <mesh position={[x * 0.94, 5.18, z]} castShadow>
                <cylinderGeometry args={[0.46, 0.3, 0.34, 20]} />
                <LimestoneMaterial tone="base" />
              </mesh>
            </group>
          ))}
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
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[3.45, 3.68, 0.3, 64]} />
        <LimestoneMaterial tone="base" surface="floor" />
      </mesh>
      <mesh position={[0, 0.26, 0]} receiveShadow>
        <cylinderGeometry args={[2.92, 3.1, 0.18, 64]} />
        <LimestoneMaterial tone="pale" surface="floor" />
      </mesh>
      {[2.98, 3.5].map((radius) => (
        <mesh key={radius} position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.045, 10, 72]} />
          <BronzeMaterial finish={radius < 3.2 ? "precision" : "dark"} />
        </mesh>
      ))}
    </group>
  );
}

function RoomArchitectureComponent({ onClearFocus }: { onClearFocus: () => void }) {
  return (
    <group name="engine-room-static-architecture">
      <mesh position={[0, -0.12, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClearFocus}>
        <planeGeometry args={[13.4, 13]} />
        <LimestoneMaterial tone="base" surface="floor" />
      </mesh>
      <StoneBlock position={[0, -0.27, -0.2]} scale={[13.5, 0.35, 13]} tone="inset" />
      <BackWallBays />
      <SideColonnades />
      <CeilingStructure />
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
