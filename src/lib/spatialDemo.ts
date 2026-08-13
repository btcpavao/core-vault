import type {
  CoreStatus,
  PersonalBroadcast,
  PersonalReceive,
  PersonalSpendView,
  PersonalVaultSnapshot,
  VaultListItem,
} from "../types";

export const demoSpatialCore: CoreStatus = {
  connected: false,
  supported: false,
  chain: "signet",
  version: 310100,
  versionLabel: "31.1 (demonstration)",
  subversion: "/Satoshi:31.1.0/",
  walletRpcAvailable: true,
  cookiePath: null,
  blocks: 281_442,
  headers: 281_442,
  verificationProgress: 1,
  initialBlockDownload: false,
  pruned: false,
  sizeOnDisk: 7_842_119_680,
  networkActive: true,
  connections: 8,
  mempoolSize: 14,
  mempoolBytes: 28_422,
  mempoolTotalFeeBtc: 0.0000114,
  mempoolMinFeeBtcKvb: 0.00001,
  lastBlockTime: 1_786_540_120,
  loadedWallets: ["demo_personal"],
  message: "Demonstration data only. No Bitcoin Core connection.",
};

export const demoVaultItem: VaultListItem = {
  walletName: "demo_personal",
  displayName: "Harbour Vault",
  role: "personal",
  vaultType: "Personal · Backup required",
  loaded: true,
  descriptors: true,
  privateKeysEnabled: true,
  locked: true,
  balanceSats: 1_250_000,
  balanceBtc: 0.0125,
};

export const demoSnapshot: PersonalVaultSnapshot = {
  vault: {
    walletName: demoVaultItem.walletName,
    displayName: demoVaultItem.displayName,
    network: "signet",
    descriptors: true,
    privateKeysEnabled: true,
    encrypted: true,
    locked: true,
    balanceSats: 1_250_000,
    balanceBtc: 0.0125,
    publicFingerprint: "9f3e72bce249df90",
    backupRequired: true,
  },
  activity: [
    {
      txid: "21".repeat(32),
      category: "receive",
      amountSats: 1_250_000,
      confirmations: 34,
      timestamp: 1_786_212_000,
      label: "Test funding",
      address: "tb1p4de77n5gc8q7y5f7y8y2jeyqlv2zuj5k6ywz9ux8aa3v8h3w7hhq5cm5u8",
    },
  ],
};

export const demoReceive: PersonalReceive = {
  walletName: demoVaultItem.walletName,
  address: "tb1p4de77n5gc8q7y5f7y8y2jeyqlv2zuj5k6ywz9ux8aa3v8h3w7hhq5cm5u8",
  label: "New test payment",
  network: "signet",
  addressType: "bech32m",
  walletOwned: true,
};

export const demoSpend = (destination = demoReceive.address, amountSats = 25_000, feeRateSatVb = 2): PersonalSpendView => ({
  draftId: "demo-spend-1",
  walletName: demoVaultItem.walletName,
  network: "signet",
  destination,
  amountSats,
  feeSats: 282,
  feeRateSatVb,
  totalDebitSats: amountSats + 282,
  outputs: [
    { address: destination, amountSats, isChange: false },
    { address: "tb1pdemonstrationchangeaddress", amountSats: 1_224_718, isChange: true },
  ],
  replaceable: true,
  state: "awaiting-review",
  complete: false,
  mempoolAllowed: null,
  mempoolRejectReason: null,
});

export const demoBroadcast: PersonalBroadcast = {
  txid: "b7".repeat(32),
  walletName: demoVaultItem.walletName,
  network: "signet",
  sentSats: 25_000,
  feeSats: 282,
};
