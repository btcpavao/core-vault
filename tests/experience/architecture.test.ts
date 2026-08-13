import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("real-time experience boundary", () => {
  it("keeps the Engine Room free of Tauri and RPC authority", () => {
    const roomSource = [
      source("src/experience/rooms/EngineRoom/EngineRoom.tsx"),
      source("src/experience/rooms/EngineRoom/CoreReactor.tsx"),
    ].join("\n");

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
});
