import { useEffect } from "react";
import {
  summarizeFrameSamples,
  type EngineRoomPerformanceResult,
  type FrameSample,
} from "./productionPerformance";

interface CinematicEngineRoomPerformanceSamplerProps {
  enabled: boolean;
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

export function CinematicEngineRoomPerformanceSampler({
  enabled,
  scenario,
  warmupSeconds = 1.5,
  sampleSeconds = 8,
}: CinematicEngineRoomPerformanceSamplerProps) {
  useEffect(() => {
    if (!enabled) return;
    let frameRequest = 0;
    let previousTime = performance.now();
    let elapsedMs = 0;
    const samples: FrameSample[] = [];

    const sample = (now: number) => {
      const frameTimeMs = now - previousTime;
      previousTime = now;
      if (frameTimeMs > 250) {
        elapsedMs = 0;
        samples.length = 0;
      } else {
        elapsedMs += frameTimeMs;
        if (elapsedMs >= warmupSeconds * 1_000) {
          samples.push({
            frameTimeMs,
            calls: 0,
            triangles: 0,
            geometries: 0,
            textures: 5,
          });
        }
      }

      if (elapsedMs < (warmupSeconds + sampleSeconds) * 1_000) {
        frameRequest = window.requestAnimationFrame(sample);
        return;
      }

      const key = `cinematic:${scenario}`;
      const result = summarizeFrameSamples(key, "cinematic", samples);
      window.__CV_ER09_PERFORMANCE__ = {
        ...(window.__CV_ER09_PERFORMANCE__ ?? {}),
        [key]: result,
      };
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(window.__CV_ER09_PERFORMANCE__),
      );
      window.dispatchEvent(new CustomEvent("cv:er09-performance", { detail: result }));
      console.info("[Engine Room cinematic performance]", result);
    };

    frameRequest = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(frameRequest);
  }, [enabled, sampleSeconds, scenario, warmupSeconds]);

  return null;
}
