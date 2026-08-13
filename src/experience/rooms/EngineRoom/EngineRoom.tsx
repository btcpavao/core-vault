import { memo } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { CuratedCameraRig } from "../../camera/CuratedCameraRig";
import type { SpatialFocusTarget } from "../../interaction/spatialFocus";
import { WORLD_MATERIALS } from "../../materials/WorldMaterials";
import { CoreReactor } from "./CoreReactor";
import { CoolingManifold } from "./components/CoolingManifold";
import { EnergyConduit } from "./components/EnergyConduit";
import { NetworkConsole } from "./components/NetworkConsole";
import { RoomArchitecture } from "./components/RoomArchitecture";

interface EngineRoomProps {
  visualState: EngineRoomVisualState;
  focus: SpatialFocusTarget;
  reducedMotion: boolean;
  onFocus: (target: Exclude<SpatialFocusTarget, "overview">) => void;
  onClearFocus: () => void;
}

const CONSOLE_ROUTE = [
  [-1.55, 0.16, -0.72],
  [-2.25, 0.12, -0.86],
  [-3.1, 0.16, -1.18],
  [-3.74, 0.54, -1.48],
] as const;

const MANIFOLD_ROUTE = [
  [1.55, 0.16, -0.72],
  [2.18, 0.13, -1.02],
  [2.78, 0.24, -1.62],
  [3.25, 0.93, -2.12],
] as const;

const BACKPLANE_ROUTE = [
  [0.25, 0.14, -2.75],
  [0.8, 0.18, -3.6],
  [1.35, 0.54, -4.45],
  [1.55, 1.25, -5.72],
] as const;

const StaticRoomLayer = memo(function StaticRoomLayer({
  onClearFocus,
}: {
  onClearFocus: () => void;
}) {
  return (
    <>
      <RoomArchitecture onClearFocus={onClearFocus} />
      <CoolingManifold />
    </>
  );
});

function MaterialEnvironment() {
  return (
    <Environment background={false} frames={1} resolution={64}>
      <Lightformer
        form="rect"
        color="#f0d7b1"
        intensity={1.15}
        position={[4, 5, 5]}
        rotation={[0, -0.65, 0]}
        scale={[5, 3, 1]}
      />
      <Lightformer
        form="rect"
        color="#b9d0d0"
        intensity={0.58}
        position={[-4, 2.5, 4]}
        rotation={[0, 0.7, 0]}
        scale={[3, 4, 1]}
      />
      <Lightformer
        form="ring"
        color="#eee3cc"
        intensity={0.42}
        position={[0, 6, -4]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[2.5, 2.5, 1]}
      />
    </Environment>
  );
}

function RoomLighting({ visualState }: { visualState: EngineRoomVisualState }) {
  const reactorLight =
    visualState.connection === "online"
      ? visualState.activity === "syncing"
        ? 14
        : 10
      : 0.65;

  return (
    <>
      <ambientLight intensity={0.54} color="#c8c0ae" />
      <hemisphereLight args={["#dce6df", "#504638", 1.62]} />
      <directionalLight
        position={[8.5, 12, 10]}
        intensity={1.95}
        color="#f2d3a7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
        shadow-radius={7}
      />
      <spotLight
        position={[-5, 6, 3.5]}
        target-position={[-2.5, 0, -2]}
        intensity={16}
        distance={18}
        angle={0.5}
        penumbra={0.85}
        color="#b6d5d7"
      />
      <pointLight
        position={[0, 2.15, -0.72]}
        color={WORLD_MATERIALS.energy.active}
        intensity={reactorLight}
        distance={7}
        decay={2}
      />
      <pointLight position={[4.65, 4.2, -5]} color="#efbe7d" intensity={4.4} distance={7} decay={2} />
    </>
  );
}

function EngineRoomComponent({
  visualState,
  focus,
  reducedMotion,
  onFocus,
  onClearFocus,
}: EngineRoomProps) {
  const networkEnabled =
    visualState.connection === "online" && visualState.networkActive === true;

  return (
    <>
      <color attach="background" args={["#24343b"]} />
      <fog attach="fog" args={["#2d4148", 17, 34]} />
      <CuratedCameraRig focus={focus} reducedMotion={reducedMotion} />
      <MaterialEnvironment />
      <RoomLighting visualState={visualState} />
      <StaticRoomLayer onClearFocus={onClearFocus} />
      <EnergyConduit
        points={CONSOLE_ROUTE}
        connection={visualState.connection}
        active={networkEnabled}
      />
      <EnergyConduit
        points={MANIFOLD_ROUTE}
        connection={visualState.connection}
        active={networkEnabled}
      />
      <EnergyConduit
        points={BACKPLANE_ROUTE}
        connection={visualState.connection}
        active={visualState.connection === "online"}
        radius={0.035}
      />
      <NetworkConsole
        visualState={visualState}
        focused={focus === "network-console"}
        onFocus={() => onFocus("network-console")}
      />
      <CoreReactor
        visualState={visualState}
        focused={focus === "reactor"}
        reducedMotion={reducedMotion}
        onFocus={() => onFocus("reactor")}
      />
    </>
  );
}

export const EngineRoom = memo(EngineRoomComponent);
