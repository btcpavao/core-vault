import { describe, expect, it } from "vitest";
import { adaptNodeStatusToEngineRoom } from "../../src/experience/adapters/nodeVisualState";
import type { CoreStatus } from "../../src/types";

const readyStatus = (overrides: Partial<CoreStatus> = {}): CoreStatus => ({
  connected: true,
  supported: true,
  chain: "regtest",
  version: 310100,
  versionLabel: "31.1",
  subversion: "/Satoshi:31.1.0/",
  walletRpcAvailable: true,
  cookiePath: null,
  blocks: 121,
  headers: 121,
  verificationProgress: 1,
  initialBlockDownload: false,
  pruned: false,
  sizeOnDisk: 1_024,
  networkActive: true,
  connections: 2,
  mempoolSize: 0,
  mempoolBytes: 0,
  mempoolTotalFeeBtc: 0,
  mempoolMinFeeBtcKvb: 0.000_01,
  lastBlockTime: null,
  loadedWallets: [],
  message: "Bitcoin Core is ready.",
  ...overrides,
});

describe("adaptNodeStatusToEngineRoom", () => {
  it("keeps missing node data explicitly unknown", () => {
    expect(adaptNodeStatusToEngineRoom(null)).toEqual({
      connection: "unknown",
      chain: null,
      syncProgress: null,
      blockHeight: null,
      peerCount: null,
      networkActive: null,
      activity: "idle",
    });
  });

  it("maps an unavailable node to a dormant attention state without fake metrics", () => {
    const visual = adaptNodeStatusToEngineRoom(
      readyStatus({ connected: false, chain: null, message: "Bitcoin Core is unavailable." }),
    );

    expect(visual).toMatchObject({
      connection: "offline",
      chain: null,
      syncProgress: null,
      blockHeight: null,
      peerCount: null,
      networkActive: null,
      activity: "attention",
    });
  });

  it("maps a ready connected node and propagates its real chain and metrics", () => {
    expect(adaptNodeStatusToEngineRoom(readyStatus())).toEqual({
      connection: "online",
      chain: "regtest",
      syncProgress: 1,
      blockHeight: 121,
      peerCount: 2,
      networkActive: true,
      activity: "ready",
    });
  });

  it("keeps Core alive while representing disabled networking distinctly", () => {
    const visual = adaptNodeStatusToEngineRoom(
      readyStatus({ networkActive: false, connections: 0 }),
    );

    expect(visual.connection).toBe("online");
    expect(visual.activity).toBe("ready");
    expect(visual.networkActive).toBe(false);
    expect(visual.peerCount).toBe(0);
  });

  it("derives syncing only from real IBD, height, or verification progress fields", () => {
    const visual = adaptNodeStatusToEngineRoom(
      readyStatus({
        chain: "signet",
        blocks: 800,
        headers: 1_000,
        verificationProgress: 0.8,
        initialBlockDownload: true,
      }),
    );

    expect(visual).toMatchObject({
      chain: "signet",
      syncProgress: 0.8,
      blockHeight: 800,
      activity: "syncing",
    });
  });

  it("clamps an out-of-range progress value without inventing a new fact", () => {
    expect(
      adaptNodeStatusToEngineRoom(readyStatus({ verificationProgress: 1.4 })).syncProgress,
    ).toBe(1);
  });
});
