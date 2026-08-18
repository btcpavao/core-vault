export interface FrameSample {
  frameTimeMs: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export interface EngineRoomPerformanceResult {
  scenario: string;
  scene: "legacy" | "production";
  durationMs: number;
  frames: number;
  averageFps: number;
  averageFrameTimeMs: number;
  medianFrameTimeMs: number;
  p95FrameTimeMs: number;
  p99FrameTimeMs: number;
  maxFrameTimeMs: number;
  framesOver20Ms: number;
  framesOver33_3Ms: number;
  framesOver50Ms: number;
  averageRenderCalls: number;
  averageTriangles: number;
  maxGeometries: number;
  maxTextures: number;
  capturedAt: string;
  frameTimeSamplesMs: number[];
}

const average = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);

const percentile = (sortedValues: number[], ratio: number) => {
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[index] ?? 0;
};

export function summarizeFrameSamples(
  scenario: string,
  scene: "legacy" | "production",
  samples: FrameSample[],
): EngineRoomPerformanceResult {
  const frameTimes = samples.map((sample) => sample.frameTimeMs).sort((a, b) => a - b);
  const averageFrameTimeMs = average(frameTimes);

  return {
    scenario,
    scene,
    durationMs: frameTimes.reduce((total, value) => total + value, 0),
    frames: samples.length,
    averageFps: averageFrameTimeMs > 0 ? 1_000 / averageFrameTimeMs : 0,
    averageFrameTimeMs,
    medianFrameTimeMs: percentile(frameTimes, 0.5),
    p95FrameTimeMs: percentile(frameTimes, 0.95),
    p99FrameTimeMs: percentile(frameTimes, 0.99),
    maxFrameTimeMs: frameTimes.at(-1) ?? 0,
    framesOver20Ms: frameTimes.filter((value) => value > 20).length,
    framesOver33_3Ms: frameTimes.filter((value) => value > 33.3).length,
    framesOver50Ms: frameTimes.filter((value) => value > 50).length,
    averageRenderCalls: average(samples.map((sample) => sample.calls)),
    averageTriangles: average(samples.map((sample) => sample.triangles)),
    maxGeometries: Math.max(0, ...samples.map((sample) => sample.geometries)),
    maxTextures: Math.max(0, ...samples.map((sample) => sample.textures)),
    capturedAt: new Date().toISOString(),
    frameTimeSamplesMs: samples.map((sample) => sample.frameTimeMs),
  };
}
