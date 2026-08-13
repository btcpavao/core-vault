import { memo, useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { CoreReactor } from "./CoreReactor";

interface EngineRoomProps {
  visualState: EngineRoomVisualState;
  reactorFocused: boolean;
  reducedMotion: boolean;
  onFocusReactor: () => void;
  onClearFocus: () => void;
}

const STONE = "#c9b99e";
const STONE_SHADOW = "#756b5e";
const BRONZE = "#806044";
const BLUE = "#45bde8";

function CameraRig({ focused, reducedMotion }: { focused: boolean; reducedMotion: boolean }) {
  const { camera } = useThree();
  const roomPosition = useMemo(() => new Vector3(7.6, 4.65, 10.8), []);
  const focusPosition = useMemo(() => new Vector3(5.45, 3.72, 7.65), []);
  const lookAt = useMemo(() => new Vector3(0, 1.65, -0.5), []);

  useEffect(() => {
    if (!reducedMotion) return;
    camera.position.copy(focused ? focusPosition : roomPosition);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
  }, [camera, focusPosition, focused, lookAt, reducedMotion, roomPosition]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const destination = focused ? focusPosition : roomPosition;
    const factor = 1 - Math.exp(-4.2 * delta);
    camera.position.lerp(destination, factor);
    camera.lookAt(lookAt);
  });

  return null;
}

function RoomArchitecture({ onClearFocus }: { onClearFocus: () => void }) {
  return (
    <group>
      <mesh position={[0, -0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClearFocus}>
        <planeGeometry args={[13, 12]} />
        <meshStandardMaterial color="#a99a83" roughness={0.92} />
      </mesh>

      <mesh position={[0, 3.4, -5.75]}>
        <boxGeometry args={[13, 7.1, 0.5]} />
        <meshStandardMaterial color={STONE} roughness={0.88} />
      </mesh>
      <mesh position={[-6.25, 3.4, -0.2]}>
        <boxGeometry args={[0.5, 7.1, 11.6]} />
        <meshStandardMaterial color="#b6a88f" roughness={0.9} />
      </mesh>
      <mesh position={[6.25, 3.4, -0.2]}>
        <boxGeometry args={[0.5, 7.1, 11.6]} />
        <meshStandardMaterial color="#d2c4ac" roughness={0.9} />
      </mesh>

      {[-4.7, -2.35, 0, 2.35, 4.7].map((x) => (
        <mesh key={x} position={[x, 5.75, -5.35]}>
          <boxGeometry args={[0.32, 1.9, 0.7]} />
          <meshStandardMaterial color="#8e806d" roughness={0.82} />
        </mesh>
      ))}

      <mesh position={[0, 0.16, -0.45]}>
        <cylinderGeometry args={[3.2, 3.55, 0.34, 64]} />
        <meshStandardMaterial color="#cfc1a7" roughness={0.84} />
      </mesh>
      <mesh position={[0, 0.23, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.25, 0.055, 10, 64]} />
        <meshStandardMaterial color={BRONZE} metalness={0.72} roughness={0.38} />
      </mesh>

      <mesh position={[0, 5.85, -5.42]}>
        <boxGeometry args={[12.25, 0.44, 0.72]} />
        <meshStandardMaterial color={STONE_SHADOW} roughness={0.78} />
      </mesh>
    </group>
  );
}

function NetworkConsole({ visualState }: { visualState: EngineRoomVisualState }) {
  const active = visualState.connection === "online" && visualState.networkActive === true;
  const online = visualState.connection === "online";

  return (
    <group position={[-4.25, 0.78, -1.2]} rotation={[0, 0.38, 0]}>
      <RoundedBox args={[2.05, 0.95, 1.35]} radius={0.12} smoothness={3}>
        <meshStandardMaterial color="#463c34" metalness={0.62} roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, 0.58, 0]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.55, 0.08, 0.82]} />
        <meshStandardMaterial color="#74583e" metalness={0.78} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.64, 0.01]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[1.12, 0.5]} />
        <meshStandardMaterial
          color={active ? "#9ae9fa" : "#27343a"}
          emissive={active ? BLUE : "#101719"}
          emissiveIntensity={active ? 0.85 : online ? 0.08 : 0.02}
          roughness={0.42}
        />
      </mesh>
      {[-0.46, 0, 0.46].map((x) => (
        <mesh key={x} position={[x, 0.01, 0.7]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial
            color={active ? BLUE : "#4d5557"}
            emissive={active ? BLUE : "#111719"}
            emissiveIntensity={active ? 0.8 : 0.02}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.72, 0.9, 0.32, 32]} />
        <meshStandardMaterial color="#8a6a49" metalness={0.72} roughness={0.42} />
      </mesh>
    </group>
  );
}

function NetworkConduits({ visualState }: { visualState: EngineRoomVisualState }) {
  const active = visualState.connection === "online" && visualState.networkActive === true;
  const energy = active ? BLUE : "#343e41";

  return (
    <group>
      <mesh position={[-2.75, 0.08, -0.9]} rotation={[0, 0.1, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 3.2, 12]} />
        <meshStandardMaterial
          color={energy}
          emissive={energy}
          emissiveIntensity={active ? 0.85 : 0.025}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[2.9, 0.08, -1.1]} rotation={[0, -0.16, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 3.45, 12]} />
        <meshStandardMaterial
          color={energy}
          emissive={energy}
          emissiveIntensity={active ? 0.72 : 0.025}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function ExitPlaceholder() {
  return (
    <group position={[4.35, 0, -5.4]}>
      <mesh position={[0, 1.55, 0.18]}>
        <planeGeometry args={[2.15, 3.1]} />
        <meshStandardMaterial color="#263137" roughness={0.82} />
      </mesh>
      {[-1.28, 1.28].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.34]}>
          <boxGeometry args={[0.46, 3.55, 0.65]} />
          <meshStandardMaterial color={STONE_SHADOW} roughness={0.86} />
        </mesh>
      ))}
      <mesh position={[0, 3.37, 0.34]}>
        <boxGeometry args={[3.02, 0.5, 0.65]} />
        <meshStandardMaterial color={STONE_SHADOW} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.04, 0.55]}>
        <boxGeometry args={[2.2, 0.06, 1.1]} />
        <meshStandardMaterial color="#705438" metalness={0.66} roughness={0.4} />
      </mesh>
    </group>
  );
}

function EngineRoomComponent({
  visualState,
  reactorFocused,
  reducedMotion,
  onFocusReactor,
  onClearFocus,
}: EngineRoomProps) {
  const reactorLight =
    visualState.connection === "online"
      ? visualState.activity === "syncing"
        ? 16
        : 12
      : 1.2;

  return (
    <>
      <color attach="background" args={["#26363e"]} />
      <fog attach="fog" args={["#34464d", 15, 31]} />
      <hemisphereLight args={["#cce7f2", "#4a4035", 1.65]} />
      <directionalLight position={[6, 9, 7]} intensity={3.1} color="#ffe2b4" />
      <pointLight
        position={[0, 2.05, -0.5]}
        color={BLUE}
        intensity={reactorLight}
        distance={8}
        decay={2}
      />

      <CameraRig focused={reactorFocused} reducedMotion={reducedMotion} />
      <RoomArchitecture onClearFocus={onClearFocus} />
      <NetworkConduits visualState={visualState} />
      <NetworkConsole visualState={visualState} />
      <ExitPlaceholder />
      <CoreReactor
        visualState={visualState}
        focused={reactorFocused}
        reducedMotion={reducedMotion}
        onFocus={onFocusReactor}
      />
    </>
  );
}

export const EngineRoom = memo(EngineRoomComponent);
