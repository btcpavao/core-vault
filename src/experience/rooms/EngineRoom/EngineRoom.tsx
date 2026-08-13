import { memo } from "react";
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

function RoomLighting({ visualState }: { visualState: EngineRoomVisualState }) {
  const reactorLight =
    visualState.connection === "online"
      ? visualState.activity === "syncing"
        ? 18
        : 13
      : 0.9;

  return (
    <>
      <ambientLight intensity={0.5} color="#a9bec0" />
      <hemisphereLight args={["#d0e5ea", "#554a3d", 1.42]} />
      <directionalLight
        position={[8.5, 12, 10]}
        intensity={2.35}
        color="#f6d5a6"
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
        shadow-radius={4}
      />
      <spotLight
        position={[-5, 6, 3.5]}
        target-position={[-2.5, 0, -2]}
        intensity={32}
        distance={20}
        angle={0.48}
        penumbra={0.85}
        color="#9fd9e4"
      />
      <pointLight
        position={[0, 2.15, -0.72]}
        color={WORLD_MATERIALS.energy.active}
        intensity={reactorLight}
        distance={8.5}
        decay={2}
      />
      <pointLight position={[4.65, 4.2, -5]} color="#efbe7d" intensity={5.5} distance={7} decay={2} />
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
