import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { ENGINE_ROOM_CINEMATIC_ASSETS } from "../../assets/assetManifest";
import { deriveReactorEnergyState } from "../../energy/reactorEnergyState";

export type CinematicScenePlate =
  | "offline"
  | "syncing"
  | "ready"
  | "network-disabled"
  | "new-block";

export type CinematicReviewState = CinematicScenePlate | null;

export interface CinematicSceneState {
  plate: Exclude<CinematicScenePlate, "new-block">;
  continuousDepth: boolean;
  transitionMs: number;
  status: string;
}

export const CINEMATIC_SCENE_ASSETS: Readonly<Record<CinematicScenePlate, string>> =
  Object.fromEntries(
    Object.entries(ENGINE_ROOM_CINEMATIC_ASSETS).map(([state, asset]) => [state, asset.path]),
  ) as Record<CinematicScenePlate, string>;

export function deriveCinematicSceneState(
  visualState: EngineRoomVisualState,
  reducedMotion: boolean,
): CinematicSceneState {
  const energy = deriveReactorEnergyState(visualState);

  if (!energy.coreActive) {
    return {
      plate: "offline",
      continuousDepth: false,
      transitionMs: reducedMotion ? 80 : 520,
      status: "Core Reactor dormant",
    };
  }

  if (energy.mode === "syncing") {
    return {
      plate: "syncing",
      continuousDepth: !reducedMotion,
      transitionMs: reducedMotion ? 80 : 420,
      status: "Core Reactor synchronizing",
    };
  }

  if (visualState.networkActive === false) {
    return {
      plate: "network-disabled",
      continuousDepth: !reducedMotion,
      transitionMs: reducedMotion ? 80 : 480,
      status: "Core ready; networking disabled",
    };
  }

  return {
    plate: "ready",
    continuousDepth: !reducedMotion,
    transitionMs: reducedMotion ? 80 : 480,
    status: "Core Reactor ready",
  };
}

export function cinematicPlateForPulse(
  plate: Exclude<CinematicScenePlate, "new-block">,
  pulseActive: boolean,
): CinematicScenePlate {
  return pulseActive ? "new-block" : plate;
}

/** Development-only deterministic input for real WebView review captures. */
export function resolveCinematicReviewState(
  development: boolean,
  search: string,
  environmentValue?: string,
): CinematicReviewState {
  if (!development) return null;
  const value = new URLSearchParams(search).get("cinematicState") ?? environmentValue;
  return value === "offline" ||
    value === "syncing" ||
    value === "ready" ||
    value === "network-disabled" ||
    value === "new-block"
    ? value
    : null;
}

export function applyCinematicReviewState(
  visualState: EngineRoomVisualState,
  reviewState: CinematicReviewState,
): EngineRoomVisualState {
  if (reviewState === null) return visualState;
  if (reviewState === "offline") {
    return {
      ...visualState,
      connection: "offline",
      syncProgress: null,
      networkActive: null,
      activity: "attention",
    };
  }
  if (reviewState === "syncing") {
    return {
      ...visualState,
      connection: "online",
      syncProgress: 0.72,
      networkActive: true,
      activity: "syncing",
    };
  }
  return {
    ...visualState,
    connection: "online",
    chain: visualState.chain ?? "regtest",
    syncProgress: 1,
    blockHeight: visualState.blockHeight ?? 101,
    peerCount: visualState.peerCount ?? (reviewState === "network-disabled" ? 0 : 8),
    networkActive: reviewState !== "network-disabled",
    activity: "ready",
  };
}
