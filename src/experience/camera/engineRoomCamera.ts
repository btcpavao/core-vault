import type { SpatialFocusTarget } from "../interaction/spatialFocus";

export type CameraPoseName =
  | "RoomOverview"
  | "ReactorFocus"
  | "NetworkConsoleFocus"
  | "ProductionHero"
  | "ProductionAlternate"
  | "ProductionReactor"
  | "ProductionConsole"
  | "ProductionExterior";

export type EngineRoomReviewView =
  | "hero"
  | "alternate"
  | "reactor"
  | "console"
  | "exterior";

export interface CuratedCameraPose {
  name: CameraPoseName;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
}

export const ENGINE_ROOM_CAMERA_POSES: Record<SpatialFocusTarget, CuratedCameraPose> = {
  overview: {
    name: "RoomOverview",
    position: [5.15, 4.55, 10.65],
    target: [-0.15, 1.7, -1.35],
    fov: 43,
  },
  reactor: {
    name: "ReactorFocus",
    position: [4.5, 3.5, 6.85],
    target: [0.1, 1.78, -0.72],
    fov: 34,
  },
  "network-console": {
    name: "NetworkConsoleFocus",
    position: [0.1, 3.05, 5.85],
    target: [-4.15, 1.18, -1.45],
    fov: 33,
  },
};

export const ER09_PRODUCTION_CAMERA_POSES: Record<
  EngineRoomReviewView,
  CuratedCameraPose
> = {
  hero: {
    name: "ProductionHero",
    position: [-0.25, 2.2, 13.25],
    target: [0.1, 1.85, -1.8],
    fov: 34.5,
  },
  alternate: {
    name: "ProductionAlternate",
    position: [6.75, 4.25, 8.35],
    target: [1.72, 2.55, -1.18],
    fov: 34.5,
  },
  reactor: {
    name: "ProductionReactor",
    position: [4.45, 3.45, 7.55],
    target: [0.24, 2.82, -1.5],
    fov: 31.8908,
  },
  console: {
    name: "ProductionConsole",
    position: [-4.9, 2.45, 5.75],
    target: [-4.95, 1.3, -1.45],
    fov: 26.9915,
  },
  exterior: {
    name: "ProductionExterior",
    position: [0.65, 3.35, 10.25],
    target: [-3.7, 2.3, -1.35],
    fov: 33.5,
  },
};

export const productionCameraPoseForFocus = (
  focus: SpatialFocusTarget,
): CuratedCameraPose => {
  if (focus === "reactor") return ER09_PRODUCTION_CAMERA_POSES.reactor;
  if (focus === "network-console") return ER09_PRODUCTION_CAMERA_POSES.console;
  return ER09_PRODUCTION_CAMERA_POSES.hero;
};

export const productionReviewViewFromSearch = (
  development: boolean,
  search: string,
): EngineRoomReviewView | null => {
  if (!development) return null;
  const value = new URLSearchParams(search).get("er09View");
  return value === "hero" ||
    value === "alternate" ||
    value === "reactor" ||
    value === "console" ||
    value === "exterior"
    ? value
    : null;
};

export type CameraTransitionPolicy = "damped" | "immediate";

export const cameraTransitionPolicy = (reducedMotion: boolean): CameraTransitionPolicy =>
  reducedMotion ? "immediate" : "damped";

export const cameraPoseForFocus = (focus: SpatialFocusTarget): CuratedCameraPose =>
  ENGINE_ROOM_CAMERA_POSES[focus];
