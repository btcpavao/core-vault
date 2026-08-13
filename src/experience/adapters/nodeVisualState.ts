import type { CoreStatus } from "../../types";

export type EngineRoomConnection = "unknown" | "offline" | "online";
export type EngineRoomActivity = "idle" | "syncing" | "ready" | "attention";

export interface EngineRoomVisualState {
  connection: EngineRoomConnection;
  chain: string | null;
  syncProgress: number | null;
  blockHeight: number | null;
  peerCount: number | null;
  networkActive: boolean | null;
  activity: EngineRoomActivity;
}

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

/**
 * Projects safe, typed node status into the small semantic vocabulary understood
 * by the real-time room. Bitcoin Core remains authoritative; this adapter neither
 * performs I/O nor infers values that are absent from CoreStatus.
 */
export function adaptNodeStatusToEngineRoom(
  status: CoreStatus | null,
): EngineRoomVisualState {
  if (status === null) {
    return {
      connection: "unknown",
      chain: null,
      syncProgress: null,
      blockHeight: null,
      peerCount: null,
      networkActive: null,
      activity: "idle",
    };
  }

  if (!status.connected) {
    return {
      connection: "offline",
      chain: status.chain ?? null,
      syncProgress: null,
      blockHeight: null,
      peerCount: null,
      networkActive: null,
      activity: "attention",
    };
  }

  const syncProgress = clampProgress(status.verificationProgress);
  const isSyncing =
    status.initialBlockDownload || status.headers > status.blocks || syncProgress < 0.999_999;

  return {
    connection: "online",
    chain: status.chain ?? null,
    syncProgress,
    blockHeight: status.blocks,
    peerCount: status.connections,
    networkActive: status.networkActive,
    activity: status.supported ? (isSyncing ? "syncing" : "ready") : "attention",
  };
}
