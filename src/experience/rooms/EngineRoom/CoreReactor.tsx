import { useEffect, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group, MeshStandardMaterial } from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";

interface CoreReactorProps {
  visualState: EngineRoomVisualState;
  focused: boolean;
  reducedMotion: boolean;
  onFocus: () => void;
}

const BLUE = "#45bde8";
const BLUE_WHITE = "#d9f8ff";
const DORMANT = "#30434b";

export function CoreReactor({
  visualState,
  focused,
  reducedMotion,
  onFocus,
}: CoreReactorProps) {
  const reactorRef = useRef<Group>(null);
  const innerRingRef = useRef<Group>(null);
  const networkRingRef = useRef<Group>(null);
  const energyMaterialRef = useRef<MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const online = visualState.connection === "online";
  const networkActive = online && visualState.networkActive === true;
  const syncProgress = visualState.syncProgress ?? 0;
  const energyColor = online ? BLUE : DORMANT;
  const baseEnergy = online ? (visualState.activity === "syncing" ? 1.55 : 1.25) : 0.08;

  useEffect(() => {
    if (!hovered) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [hovered]);

  useFrame(({ clock }, delta) => {
    if (!reducedMotion) {
      if (innerRingRef.current && online) {
        const speed = visualState.activity === "syncing" ? 0.22 : 0.08;
        innerRingRef.current.rotation.y += delta * speed;
      }
      if (networkRingRef.current && networkActive) {
        networkRingRef.current.rotation.z -= delta * 0.12;
      }
      if (energyMaterialRef.current) {
        const cadence = visualState.activity === "syncing" ? 1.7 : 0.65;
        const pulse = Math.sin(clock.elapsedTime * cadence) * (online ? 0.16 : 0.02);
        energyMaterialRef.current.emissiveIntensity = baseEnergy + pulse;
      }
    } else if (energyMaterialRef.current) {
      energyMaterialRef.current.emissiveIntensity = baseEnergy;
    }
  });

  const stopAndFocus = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onFocus();
  };

  return (
    <group ref={reactorRef} position={[0, 0, -0.5]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[1.9, 2.15, 0.32, 48]} />
        <meshStandardMaterial color="#54412f" metalness={0.52} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.55, 1.72, 0.28, 48]} />
        <meshStandardMaterial color="#92704b" metalness={0.82} roughness={0.34} />
      </mesh>

      <group ref={innerRingRef}>
        <mesh position={[0, 1.82, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 2.45, 32]} />
          <meshStandardMaterial
            ref={energyMaterialRef}
            color={online ? BLUE_WHITE : DORMANT}
            emissive={energyColor}
            emissiveIntensity={baseEnergy}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 1.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.055, 12, 48]} />
          <meshStandardMaterial
            color={energyColor}
            emissive={energyColor}
            emissiveIntensity={online ? 0.9 : 0.04}
            metalness={0.35}
            roughness={0.28}
          />
        </mesh>
      </group>

      <mesh position={[0, 1.82, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 2.7, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#bde8f1"
          transparent
          opacity={0.18}
          roughness={0.12}
          metalness={0.05}
          depthWrite={false}
          side={2}
        />
      </mesh>

      {[0.68, 1.82, 2.96].map((height) => (
        <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.04, 0.105, 16, 48]} />
          <meshStandardMaterial color="#9a7449" metalness={0.88} roughness={0.3} />
        </mesh>
      ))}

      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 1.82, 0]}>
          <boxGeometry args={[0.11, 2.36, 0.16]} />
          <meshStandardMaterial color="#765737" metalness={0.82} roughness={0.36} />
        </mesh>
      ))}

      <mesh position={[0, 3.25, 0]}>
        <cylinderGeometry args={[1.26, 1.08, 0.34, 48]} />
        <meshStandardMaterial color="#624a33" metalness={0.76} roughness={0.4} />
      </mesh>

      <mesh position={[0, 3.46, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 0.18, 32]} />
        <meshStandardMaterial color="#92704b" metalness={0.85} roughness={0.32} />
      </mesh>

      <mesh position={[0, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.04, 12, 64]} />
        <meshStandardMaterial color="#26343a" metalness={0.65} roughness={0.42} />
      </mesh>
      {online && (
        <mesh position={[0, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[1.25, 0.057, 12, 64, Math.max(0.035, Math.PI * 2 * syncProgress)]}
          />
          <meshStandardMaterial
            color={BLUE}
            emissive={BLUE}
            emissiveIntensity={visualState.activity === "syncing" ? 1.15 : 0.72}
            roughness={0.3}
          />
        </mesh>
      )}

      <group ref={networkRingRef} position={[0, 1.82, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.43, 0.035, 10, 64]} />
          <meshStandardMaterial
            color={networkActive ? BLUE : "#38454a"}
            emissive={networkActive ? BLUE : "#101719"}
            emissiveIntensity={networkActive ? 0.95 : 0.04}
            metalness={0.45}
            roughness={0.36}
          />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.43, 0.035, 10, 64]} />
          <meshStandardMaterial
            color={networkActive ? BLUE : "#38454a"}
            emissive={networkActive ? BLUE : "#101719"}
            emissiveIntensity={networkActive ? 0.7 : 0.03}
            metalness={0.45}
            roughness={0.36}
          />
        </mesh>
      </group>

      {(focused || hovered) && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.35, 0.045, 10, 64]} />
          <meshStandardMaterial
            color={focused ? BLUE_WHITE : BLUE}
            emissive={BLUE}
            emissiveIntensity={focused ? 0.8 : 0.38}
            roughness={0.42}
          />
        </mesh>
      )}

      <mesh
        position={[0, 1.8, 0]}
        onClick={stopAndFocus}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[1.75, 1.95, 3.55, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
