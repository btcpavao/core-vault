import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { EngineRoomVisualState } from "../../src/experience/adapters/nodeVisualState";
import {
  deriveProductionEnergyRuntimeState,
  productionMaterialFamily,
  resolveEngineRoomSceneMode,
  validateProductionNodeNames,
} from "../../src/experience/rooms/EngineRoom/productionSceneContract";
import { summarizeFrameSamples } from "../../src/experience/rooms/EngineRoom/productionPerformance";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const visualState = (
  overrides: Partial<EngineRoomVisualState> = {},
): EngineRoomVisualState => ({
  connection: "online",
  chain: "regtest",
  syncProgress: 1,
  blockHeight: 121,
  peerCount: 2,
  networkActive: true,
  activity: "ready",
  ...overrides,
});

function productionGltf() {
  const asset = readFileSync(
    resolve(
      process.cwd(),
      "public/assets/experience/engine-room/production/cv_engine_room_er09.glb",
    ),
  );
  const jsonChunkLength = asset.readUInt32LE(12);
  return JSON.parse(asset.subarray(20, 20 + jsonChunkLength).toString("utf8"));
}

describe("ER-09 production scene selection", () => {
  it("defaults safely to legacy and allows a development-only query override", () => {
    expect(
      resolveEngineRoomSceneMode({ development: true, search: "", environmentValue: undefined }),
    ).toBe("legacy");
    expect(
      resolveEngineRoomSceneMode({
        development: true,
        search: "?engineRoom=production",
        environmentValue: undefined,
      }),
    ).toBe("production");
    expect(
      resolveEngineRoomSceneMode({
        development: true,
        search: "?engineRoom=cinematic",
        environmentValue: undefined,
      }),
    ).toBe("cinematic");
    expect(
      resolveEngineRoomSceneMode({
        development: true,
        search: "?engineRoom=legacy",
        environmentValue: "1",
      }),
    ).toBe("legacy");
    expect(
      resolveEngineRoomSceneMode({
        development: false,
        search: "?engineRoom=production",
        environmentValue: undefined,
      }),
    ).toBe("legacy");
  });

  it("falls back through a production-local boundary instead of crashing the app", () => {
    const runtimeSource = source(
      "src/experience/rooms/EngineRoom/EngineRoomRuntime.tsx",
    );
    expect(runtimeSource).toContain("ProductionSceneBoundary");
    expect(runtimeSource).toContain("fallback={legacy}");
    expect(runtimeSource).toContain("onProductionFailure");
  });
});

describe("ER-09 semantic GLB contract", () => {
  it("finds all required semantic groups and the six energy guides", () => {
    const gltf = productionGltf();
    const names = gltf.nodes.map((node: { name?: string }) => node.name ?? "");
    expect(validateProductionNodeNames(names)).toEqual({ valid: true, missing: [] });
    expect(names.filter((name: string) => name.startsWith("CV_Runtime_EnergyMain_"))).toHaveLength(4);
    expect(names.filter((name: string) => name.startsWith("CV_Runtime_EnergySecondary_"))).toHaveLength(2);
  });

  it("reports maintainable missing-node diagnostics", () => {
    const result = validateProductionNodeNames(["CV_Runtime_StaticArchitecture_Group"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("CV_Runtime_ConsoleScreen");
    expect(result.missing.join(" ")).toContain("EnergyMain");
  });
});

describe("ER-09 runtime truth bindings", () => {
  it("turns both blue spill paths fully off when Core is unavailable", () => {
    expect(
      deriveProductionEnergyRuntimeState(
        visualState({ connection: "offline", networkActive: null, activity: "attention" }),
        false,
      ),
    ).toMatchObject({
      mainActive: false,
      secondaryActive: false,
      mainIntensity: 0,
      secondaryIntensity: 0,
      mode: "dormant",
    });
  });

  it("keeps main and network-owned secondary energy independently controllable", () => {
    const networkDisabled = deriveProductionEnergyRuntimeState(
      visualState({ networkActive: false }),
      false,
    );
    expect(networkDisabled.mainActive).toBe(true);
    expect(networkDisabled.secondaryActive).toBe(false);
  });

  it("preserves state readability but disables continuous pulse in Reduced Motion", () => {
    const reduced = deriveProductionEnergyRuntimeState(visualState(), true);
    expect(reduced.mainActive).toBe(true);
    expect(reduced.mainIntensity).toBeGreaterThan(0);
    expect(reduced.animate).toBe(false);
  });

  it("keeps runtime material decisions centralized", () => {
    expect(productionMaterialFamily("CV_Mat_Bronze_Main")).toBe("bronze-main");
    expect(productionMaterialFamily("CV_Mat_Glass_Reactor")).toBe("glass");
    expect(productionMaterialFamily("CV_Mat_Energy_BlueCore")).toBe("energy");
  });

  it("renders console content only from the existing visual state", () => {
    const productionSource = source(
      "src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx",
    );
    expect(productionSource).toContain("visualState.blockHeight");
    expect(productionSource).toContain("visualState.syncProgress");
    expect(productionSource).toContain("visualState.networkActive");
    expect(productionSource).not.toMatch(/Math\.random|fake block|decorative busy/i);
  });

  it("keeps ER-10b static indirect and selective shadows local and switchable", () => {
    const productionSource = source(
      "src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx",
    );
    expect(productionSource).toContain("VITE_CV_ER10B_STATIC_INDIRECT");
    expect(productionSource).toContain("VITE_CV_ER10B_SHADOWS");
    expect(productionSource).toContain("new SphericalHarmonics3()");
    expect(productionSource).toContain("new LightProbe(irradiance, 0.72)");
    expect(productionSource).toContain("castShadow={SELECTIVE_SHADOWS_ENABLED}");
    expect(productionSource).toContain("WORLD_TEXTURES.bronze.baseColor");
    expect(productionSource).toContain("WORLD_TEXTURES.limestone.baseColor");
    expect(productionSource).toContain("createEnergyGlowTexture");
  });

  it("disposes the selective shadow targets on room unmount", () => {
    const productionSource = source(
      "src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx",
    );
    expect(productionSource).toContain("shadow?.map?.dispose()");
    expect(productionSource).toContain("shadow?.mapPass?.dispose()");
    expect(productionSource).toContain("shadow.map = null");
  });

  it("keeps the local Lightformer environment at stable Canvas ownership", () => {
    const rootSource = source("src/experience/ExperienceRoot.tsx");
    const productionSource = source(
      "src/experience/rooms/EngineRoom/ProductionEngineRoom.tsx",
    );
    expect(productionSource).toContain("export function ProductionStaticEnvironment");
    expect(rootSource).toContain("<ProductionStaticEnvironment />");
  });
});

describe("ER-09 performance sampler", () => {
  it("computes the ER-11 distribution and hitch thresholds from measured frames", () => {
    const result = summarizeFrameSamples("production:idle", "production", [
      { frameTimeMs: 16, calls: 52, triangles: 466_962, geometries: 50, textures: 3 },
      { frameTimeMs: 17, calls: 53, triangles: 466_962, geometries: 50, textures: 3 },
      { frameTimeMs: 25, calls: 54, triangles: 466_962, geometries: 50, textures: 3 },
    ]);
    expect(result.averageFps).toBeGreaterThan(50);
    expect(result.medianFrameTimeMs).toBe(17);
    expect(result.p95FrameTimeMs).toBe(25);
    expect(result.p99FrameTimeMs).toBe(25);
    expect(result.maxFrameTimeMs).toBe(25);
    expect(result.framesOver20Ms).toBe(1);
    expect(result.framesOver33_3Ms).toBe(0);
    expect(result.framesOver50Ms).toBe(0);
    expect(result.frameTimeSamplesMs).toEqual([16, 17, 25]);
    expect(result.averageRenderCalls).toBe(53);
    expect(result.maxGeometries).toBe(50);
  });

  it("keeps the ER-11b foreground matrix in explicit QA-only autorun instrumentation", () => {
    const rootSource = source("src/experience/ExperienceRoot.tsx");
    const performanceSource = source(
      "src/experience/rooms/EngineRoom/productionPerformance.ts",
    );
    expect(rootSource).toContain('VITE_CV_ER11B_AUTORUN === "1"');
    expect(rootSource).toContain('"B-first"');
    expect(rootSource).toContain('"B-warm"');
    expect(rootSource).toContain('cv:er11b:autorun:v1');
    expect(performanceSource).toContain("frameTimeSamplesMs");
  });
});
