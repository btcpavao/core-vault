export type PhaseId = "core" | "signers" | "vault" | "backup" | "receive" | "spend";

export interface ConnectionSettings {
  host: string;
  port: number;
  cookiePath: string;
}

export interface RpcTrace {
  method: string;
  wallet?: string | null;
  arguments: unknown;
  result: unknown;
  explanation: string;
  durationMs: number;
  timestampMs: number;
}

export interface Operation<T> {
  data: T;
  rpc: RpcTrace[];
}

export interface FileCapabilityGrant {
  capabilityId: string;
  displayPath: string;
  displayName: string;
}

export interface CoreStatus {
  connected: boolean;
  supported: boolean;
  chain?: string | null;
  version?: number | null;
  versionLabel?: string | null;
  subversion?: string | null;
  walletRpcAvailable: boolean;
  cookiePath?: string | null;
  blocks: number;
  headers: number;
  verificationProgress: number;
  initialBlockDownload: boolean;
  pruned: boolean;
  sizeOnDisk: number;
  networkActive: boolean;
  connections: number;
  mempoolSize: number;
  mempoolBytes: number;
  mempoolTotalFeeBtc: number;
  mempoolMinFeeBtcKvb: number;
  lastBlockTime?: number | null;
  loadedWallets: string[];
  message: string;
}

export type SceneId =
  | "hall"
  | "workshop"
  | "vault"
  | "archive"
  | "communications"
  | "engine"
  | "observatory"
  | "library";

export interface VaultListItem {
  walletName: string;
  displayName: string;
  role: string;
  vaultType: string;
  loaded: boolean;
  descriptors?: boolean | null;
  privateKeysEnabled?: boolean | null;
  locked?: boolean | null;
  balanceSats?: number | null;
  balanceBtc?: number | null;
}

export interface PersonalVault {
  walletName: string;
  displayName: string;
  network: string;
  descriptors: boolean;
  privateKeysEnabled: boolean;
  encrypted: boolean;
  locked: boolean;
  balanceSats: number;
  balanceBtc: number;
  publicFingerprint: string;
  backupRequired: boolean;
}

export interface BackupReceipt {
  walletName: string;
  path: string;
  createdAtUnix: number;
  sizeBytes: number;
  sha256: string;
}

export interface RestoreReceipt {
  originalWalletName: string;
  restoredWalletName: string;
  publicFingerprint: string;
  fingerprintsMatch: boolean;
  warnings: string[];
}

export interface PersonalReceive {
  walletName: string;
  address: string;
  label: string;
  network: string;
  addressType: string;
  walletOwned: boolean;
}

export interface ActivityItem {
  txid: string;
  category: string;
  amountSats: number;
  confirmations: number;
  timestamp?: number | null;
  label?: string | null;
  address?: string | null;
}

export interface PersonalVaultSnapshot {
  vault: PersonalVault;
  activity: ActivityItem[];
}

export interface SpendOutputView {
  address?: string | null;
  amountSats: number;
  isChange: boolean;
}

export type MempoolPreflight =
  | { state: "not-run" }
  | { state: "accepted" }
  | { state: "rejected"; reason: string | null }
  | { state: "indeterminate"; reason: string };

export interface PersonalSpendView {
  draftId: string;
  walletName: string;
  network: string;
  destination: string;
  amountSats: number;
  feeSats: number;
  feeRateSatVb: number;
  totalDebitSats: number;
  outputs: SpendOutputView[];
  replaceable: boolean;
  state: string;
  complete: boolean;
  mempoolPreflight: MempoolPreflight;
}

export interface PersonalBroadcast {
  txid: string;
  walletName: string;
  network: string;
  sentSats: number;
  feeSats: number;
}

export interface SigningWallet {
  label: string;
  name: string;
  descriptors: boolean;
  privateKeysEnabled: boolean;
  encrypted: boolean;
  backupPath?: string | null;
}

export interface SignerPublic {
  label: string;
  walletName: string;
  fingerprint: string;
  derivationPath: string;
  tpub: string;
}

export interface PublicVaultBackup {
  schemaVersion: number;
  exportedAtUnix: number;
  network: "signet";
  policyType: "wsh-sortedmulti";
  threshold: 2;
  participants: 3;
  signers: SignerPublic[];
  receiveDescriptor: string;
  changeDescriptor: string;
  coordinatorName: string;
  coordinatorPrivateKeys: false;
}

export interface VaultSummary {
  policy: "2-of-3";
  addressType: "Native SegWit";
  network: "Signet";
  coordinatorName: string;
  coordinatorHasPrivateKeys: false;
  signers: SignerPublic[];
  receiveDescriptor: string;
  changeDescriptor: string;
  publicBackup: PublicVaultBackup;
}

export interface ReceiveSnapshot {
  address: string;
  balanceBtc: number;
  balanceSats: number;
  solvable: boolean;
  watchOnly: boolean;
}

export interface SpendDraft {
  draftId: string;
  destination: string;
  amountSats: number;
  feeBtc: number;
  feeSats: number;
  signedBy: string[];
  complete: boolean;
}

export interface BroadcastResult {
  txid: string;
  startingBalanceSats: number;
  sentSats: number;
  feeSats: number;
  remainingSats: number;
  balanceRefreshed: boolean;
}
