export type CoreMachineState =
  | "disconnected"
  | "connecting"
  | "connected-network-active"
  | "connected-network-disabled"
  | "syncing"
  | "synced"
  | "error";

export type VaultMachineState =
  | "loading"
  | "ready"
  | "backup-required"
  | "locked"
  | "temporarily-unlocked"
  | "watch-only"
  | "error";

export type BackupMachineState =
  | "not-created"
  | "creating"
  | "created"
  | "verification-pending"
  | "restore-tested"
  | "failed";

export type PsbtMachineState =
  | "draft"
  | "funded"
  | "awaiting-review"
  | "unsigned"
  | "partially-signed"
  | "threshold-reached"
  | "finalized"
  | "ready-to-broadcast"
  | "broadcast"
  | "failed";

export const deriveCoreState = (input: {
  connected: boolean;
  networkActive: boolean;
  initialBlockDownload: boolean;
  verificationProgress: number;
}): CoreMachineState => {
  if (!input.connected) return "disconnected";
  if (!input.networkActive) return "connected-network-disabled";
  if (input.initialBlockDownload || input.verificationProgress < 0.9999) return "syncing";
  return "synced";
};

export const canTransitionPsbt = (from: PsbtMachineState, to: PsbtMachineState): boolean => {
  const allowed: Partial<Record<PsbtMachineState, PsbtMachineState[]>> = {
    draft: ["funded", "failed"],
    funded: ["awaiting-review", "failed"],
    "awaiting-review": ["unsigned", "failed"],
    unsigned: ["partially-signed", "threshold-reached", "failed"],
    "partially-signed": ["threshold-reached", "failed"],
    "threshold-reached": ["finalized", "failed"],
    finalized: ["ready-to-broadcast", "failed"],
    "ready-to-broadcast": ["broadcast", "failed"],
  };
  return allowed[from]?.includes(to) ?? false;
};
