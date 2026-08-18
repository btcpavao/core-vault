import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { EngineRoomVisualState } from "../../src/experience/adapters/nodeVisualState";
import { ENGINE_ROOM_CINEMATIC_ASSETS } from "../../src/experience/assets/assetManifest";
import {
  applyCinematicReviewState,
  cinematicPlateForPulse,
  deriveCinematicSceneState,
  resolveCinematicReviewState,
} from "../../src/experience/rooms/EngineRoom/cinematicSceneContract";

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

describe("Engine Room cinematic semantic scene", () => {
  it("maps the shared EngineRoomVisualState to authored physical states", () => {
    expect(
      deriveCinematicSceneState(
        visualState({ connection: "offline", activity: "attention", networkActive: null }),
        false,
      ).plate,
    ).toBe("offline");
    expect(
      deriveCinematicSceneState(
        visualState({ activity: "syncing", syncProgress: 0.72 }),
        false,
      ).plate,
    ).toBe("syncing");
    expect(deriveCinematicSceneState(visualState(), false).plate).toBe("ready");
    expect(
      deriveCinematicSceneState(visualState({ networkActive: false }), false).plate,
    ).toBe("network-disabled");
  });

  it("maps only an explicit block pulse to the transient gold plate", () => {
    expect(cinematicPlateForPulse("ready", false)).toBe("ready");
    expect(cinematicPlateForPulse("ready", true)).toBe("new-block");
    const componentSource = source(
      "src/experience/rooms/EngineRoom/CinematicEngineRoom.tsx",
    );
    expect(componentSource).toContain("validationPulseSerial");
    expect(componentSource).not.toMatch(/Math\.random|setInterval/);
  });

  it("preserves state while removing parallax and minimizing transitions for Reduced Motion", () => {
    const full = deriveCinematicSceneState(visualState(), false);
    const reduced = deriveCinematicSceneState(visualState(), true);
    expect(reduced.plate).toBe(full.plate);
    expect(full.continuousDepth).toBe(true);
    expect(reduced.continuousDepth).toBe(false);
    expect(reduced.transitionMs).toBeLessThan(full.transitionMs);
  });

  it("keeps deterministic capture overrides development-only and typed as visual state", () => {
    expect(resolveCinematicReviewState(false, "?cinematicState=offline")).toBeNull();
    expect(resolveCinematicReviewState(true, "", "ready")).toBe("ready");
    expect(resolveCinematicReviewState(true, "?cinematicState=network-disabled")).toBe(
      "network-disabled",
    );
    expect(
      applyCinematicReviewState(visualState(), "network-disabled"),
    ).toMatchObject({ connection: "online", activity: "ready", networkActive: false });
  });

  it("ships sharp local state plates through the central asset manifest", () => {
    for (const asset of Object.values(ENGINE_ROOM_CINEMATIC_ASSETS)) {
      expect(asset.path).toMatch(/^\/assets\/experience\/engine-room\/cinematic\//);
      expect(asset.path).not.toMatch(/^https?:|\/\//);
      expect(asset.width).toBe(1672);
      expect(asset.height).toBe(941);
      const bytes = readFileSync(resolve(process.cwd(), `public${asset.path}`));
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
    }
  });

  it("exposes semantic Reactor controls and reuses the contextual panel", () => {
    const componentSource = source(
      "src/experience/rooms/EngineRoom/CinematicEngineRoom.tsx",
    );
    const rootSource = source("src/experience/ExperienceRoot.tsx");
    expect(componentSource).toContain('id="cinematic-reactor-control"');
    expect(componentSource).toContain('aria-label={`Inspect Core Reactor.');
    expect(componentSource).toContain('aria-controls="engine-room-precision-panel"');
    expect(componentSource).toContain('onFocus("reactor")');
    expect(rootSource).toContain('id="engine-room-precision-panel"');
    expect(rootSource).toContain('event.key === "Escape"');
  });

  it("introduces no RPC authority or runtime remote image loading", () => {
    const cinematicSource = [
      "src/experience/rooms/EngineRoom/CinematicEngineRoom.tsx",
      "src/experience/rooms/EngineRoom/cinematicSceneContract.ts",
    ]
      .map(source)
      .join("\n");
    expect(cinematicSource).not.toMatch(/@tauri-apps|coreApi|\binvoke\s*\(|getblockchaininfo/i);
    expect(cinematicSource).not.toMatch(/https?:\/\//i);
  });
});
