import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { EngineRoomSceneMode } from "./productionSceneContract";
import {
  summarizeFrameSamples,
  type EngineRoomPerformanceResult,
  type FrameSample,
} from "./productionPerformance";

interface EngineRoomPerformanceSamplerProps {
  enabled: boolean;
  scene: EngineRoomSceneMode;
  scenario: string;
  warmupSeconds?: number;
  sampleSeconds?: number;
}

declare global {
  interface Window {
    __CV_ER09_PERFORMANCE__?: Record<string, EngineRoomPerformanceResult>;
  }
}

const STORAGE_KEY = "cv:er09:performance:v1";

export function EngineRoomPerformanceSampler({
  enabled,
  scene,
  scenario,
  warmupSeconds = 1.5,
  sampleSeconds = 8,
}: EngineRoomPerformanceSamplerProps) {
  const elapsedRef = useRef(0);
  const samplesRef = useRef<FrameSample[]>([]);
  const completeRef = useRef(false);

  useFrame(({ gl }, delta) => {
    if (!enabled || completeRef.current) return;
    // A backgrounded WebView may resume with one wall-clock-sized RAF delta.
    // It is a lifecycle pause, not a rendered frame, so restart the warm-up.
    if (delta > 0.25) {
      elapsedRef.current = 0;
      samplesRef.current = [];
      return;
    }
    elapsedRef.current += delta;
    if (elapsedRef.current < warmupSeconds) return;

    samplesRef.current.push({
      frameTimeMs: delta * 1_000,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    });

    if (elapsedRef.current < warmupSeconds + sampleSeconds) return;
    completeRef.current = true;
    const key = `${scene}:${scenario}`;
    const result = summarizeFrameSamples(key, scene, samplesRef.current);
    window.__CV_ER09_PERFORMANCE__ = {
      ...(window.__CV_ER09_PERFORMANCE__ ?? {}),
      [key]: result,
    };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(window.__CV_ER09_PERFORMANCE__),
    );
    window.dispatchEvent(new CustomEvent("cv:er09-performance", { detail: result }));
    console.info("[ER-09 performance]", result);
  });

  return null;
}
