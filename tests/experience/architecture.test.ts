import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const roomFiles = [
  "src/experience/rooms/EngineRoom/EngineRoom.tsx",
  "src/experience/rooms/EngineRoom/CoreReactor.tsx",
  "src/experience/rooms/EngineRoom/components/CoolingManifold.tsx",
  "src/experience/rooms/EngineRoom/components/EnergyConduit.tsx",
  "src/experience/rooms/EngineRoom/components/NetworkConsole.tsx",
  "src/experience/rooms/EngineRoom/components/RoomArchitecture.tsx",
];

describe("real-time experience boundary", () => {
  it("keeps the Engine Room free of Tauri and RPC authority", () => {
    const roomSource = roomFiles.map(source).join("\n");

    expect(roomSource).not.toMatch(/@tauri-apps|coreApi|\binvoke\s*\(|getblockchaininfo/i);
    expect(roomSource).not.toMatch(/passphrase|private descriptor|rpc cookie|raw private key/i);
  });

  it("projects typed node status through the Visual State Adapter before R3F", () => {
    const rootSource = source("src/experience/ExperienceRoot.tsx");
    const roomSource = source("src/experience/rooms/EngineRoom/EngineRoom.tsx");

    expect(rootSource).toContain("adaptNodeStatusToEngineRoom(nodeRead.status)");
    expect(rootSource).toContain("visualState={visualState}");
    expect(roomSource).toContain("visualState: EngineRoomVisualState");
  });

  it("keeps mounted Canvas fallback content passive", () => {
    const rootSource = source("src/experience/ExperienceRoot.tsx");

    expect(rootSource).not.toContain("function WebGLFallback");
    expect(rootSource).toContain('className="experience-canvas-fallback"');
  });

  it("separates memoized room architecture from live NodeStatus visuals", () => {
    const roomSource = source("src/experience/rooms/EngineRoom/EngineRoom.tsx");
    const architectureSource = source(
      "src/experience/rooms/EngineRoom/components/RoomArchitecture.tsx",
    );

    expect(roomSource).toContain("const StaticRoomLayer = memo");
    expect(roomSource).toContain("<StaticRoomLayer onClearFocus={onClearFocus}");
    expect(architectureSource).toContain("export const RoomArchitecture = memo");
    expect(architectureSource).not.toContain("EngineRoomVisualState");
  });

  it("uses the shared semantic PBR material system across the vertical slice", () => {
    const materialsSource = source("src/experience/materials/WorldMaterials.tsx");
    const engineRoomSource = source("src/experience/rooms/EngineRoom/EngineRoom.tsx");
    const roomSource = roomFiles.map(source).join("\n");

    expect(materialsSource).toContain("WORLD_MATERIALS");
    expect(materialsSource).toContain("LimestoneMaterial");
    expect(materialsSource).toContain("BronzeMaterial");
    expect(materialsSource).toContain("TechnicalGlassMaterial");
    expect(materialsSource).toContain("EnergyMaterial");
    expect(roomSource).toMatch(/LimestoneMaterial/);
    expect(roomSource).toMatch(/BronzeMaterial/);
    expect(roomSource).toMatch(/TechnicalGlassMaterial/);
    expect(roomSource).toMatch(/EnergyMaterial/);
    expect(engineRoomSource).toContain('<Environment background={false} frames={1} resolution={64}>');
    expect(engineRoomSource).not.toMatch(/\.hdr|\.exr|preset=/i);
  });

  it("loads one central-manifest GLB with a room-local passive fallback", () => {
    const manifestSource = source("src/experience/assets/assetManifest.ts");
    const loaderSource = source(
      "src/experience/rooms/EngineRoom/components/CoolingManifold.tsx",
    );
    const asset = readFileSync(
      resolve(
        process.cwd(),
        "public/assets/experience/engine-room/cv_engine_room_cooling_manifold.glb",
      ),
    );

    expect(manifestSource).toContain("cv_engine_room_cooling_manifold.glb");
    expect(manifestSource).toContain('license: "Core Vault original"');
    expect(loaderSource).toContain("useGLTF(ENGINE_ROOM_ASSETS.coolingManifold.path)");
    expect(loaderSource).toContain("CoolingManifoldFallback");
    expect(asset.subarray(0, 4).toString("ascii")).toBe("glTF");
    expect(asset.readUInt32LE(4)).toBe(2);
  });

  it("provides keyboard-equivalent controls for both spatial targets", () => {
    const rootSource = source("src/experience/ExperienceRoot.tsx");

    expect(rootSource).toContain('id="focus-reactor"');
    expect(rootSource).toContain('id="focus-network-console"');
    expect(rootSource).toContain('event.key === "Escape"');
    expect(rootSource).toContain('className="panel-close"');
  });
});
