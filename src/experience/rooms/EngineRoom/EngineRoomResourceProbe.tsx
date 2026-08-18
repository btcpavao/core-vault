import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export interface EngineRoomResourceSnapshot {
  elapsedMs: number;
  geometries: number;
  textures: number;
  programs: number;
  calls: number;
  triangles: number;
}

interface EngineRoomResourceProbeProps {
  enabled: boolean;
  onSnapshot: (snapshot: EngineRoomResourceSnapshot) => void;
}

/**
 * Compile-time QA observer. It owns no Three.js resources and only reads the
 * renderer's public counters at a low cadence while ER-11 is active.
 */
export function EngineRoomResourceProbe({
  enabled,
  onSnapshot,
}: EngineRoomResourceProbeProps) {
  const lastSnapshotRef = useRef(-Infinity);

  useFrame(({ clock, gl }) => {
    if (!enabled || clock.elapsedTime - lastSnapshotRef.current < 0.25) return;
    lastSnapshotRef.current = clock.elapsedTime;
    onSnapshot({
      elapsedMs: clock.elapsedTime * 1_000,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    });
  });

  return null;
}
