import type { SpatialFocusTarget } from "../interaction/spatialFocus";

export type CameraPoseName =
  | "RoomOverview"
  | "ReactorFocus"
  | "NetworkConsoleFocus";

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

export type CameraTransitionPolicy = "damped" | "immediate";

export const cameraTransitionPolicy = (reducedMotion: boolean): CameraTransitionPolicy =>
  reducedMotion ? "immediate" : "damped";

export const cameraPoseForFocus = (focus: SpatialFocusTarget): CuratedCameraPose =>
  ENGINE_ROOM_CAMERA_POSES[focus];
