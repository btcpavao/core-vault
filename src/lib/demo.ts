import type {
  BroadcastResult,
  CoreStatus,
  Operation,
  PublicVaultBackup,
  ReceiveSnapshot,
  RpcTrace,
  SigningWallet,
  SpendDraft,
  VaultSummary,
} from "../types";

const fakeTpub = (letter: string) => `tpubD6NzVbkrYhZ4${letter.repeat(94)}`;
const fakeKey = (label: string, index: number) => ({
  label,
  walletName: `CoreVault-${label}`,
  fingerprint: `a1b2c3d${index}`,
  derivationPath: "/84h/1h/0h",
  tpub: fakeTpub(String.fromCharCode(64 + index)),
});

const trace = (method: string, explanation: string, result: unknown): RpcTrace => ({
  method,
  wallet: method === "getblockchaininfo" ? null : "Demo wallet",
  arguments: {},
  result,
  explanation,
  durationMs: 18,
  timestampMs: Date.now(),
});

export const demoCoreStatus: Operation<CoreStatus> = {
  data: {
    connected: false,
    supported: false,
    chain: "signet",
    version: 280000,
    versionLabel: "28.0",
    subversion: "/Satoshi:28.0.0/",
    walletRpcAvailable: true,
    cookiePath: "/local/demo/signet/.cookie",
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
    loadedWallets: ["CoreVault-2of3"],
    message: "Safe demo data is ready. No Bitcoin Core connection is being simulated as real.",
  },
  rpc: [
    trace("getblockchaininfo", "Provjerava mrežu lokalnog Bitcoin Corea.", { chain: "signet" }),
    trace("getnetworkinfo", "Čita verziju lokalnog Bitcoin Corea.", { version: 280000 }),
  ],
};

export const demoSigner = (label: string, encrypted = true, backupPath?: string): Operation<SigningWallet> => ({
  data: {
    label,
    name: `CoreVault-${label}`,
    descriptors: true,
    privateKeysEnabled: true,
    encrypted,
    locked: encrypted,
    publicIdentity: fakeKey(label, Number(label.slice(1))),
    backupPath: backupPath ?? null,
  },
  rpc: [
    trace(backupPath ? "backupwallet" : "createwallet", `Bitcoin Core ${backupPath ? "sigurno kopira" : "atomski stvara i šifrira"} ${label}.`, {
      descriptors: true,
      private_keys_enabled: true,
      encrypted,
      locked: encrypted,
    }),
  ],
});

const signers = [fakeKey("K1", 1), fakeKey("K2", 2), fakeKey("K3", 3)];
const receiveDescriptor = `wsh(sortedmulti(2,[a1b2c3d1/84h/1h/0h]${fakeTpub("A")}/0/*,[a1b2c3d2/84h/1h/0h]${fakeTpub("B")}/0/*,[a1b2c3d3/84h/1h/0h]${fakeTpub("C")}/0/*))#demo0001`;
const changeDescriptor = receiveDescriptor.replaceAll("/0/*", "/1/*").replace("demo0001", "demo0002");

export const demoPublicBackup: PublicVaultBackup = {
  schemaVersion: 1,
  exportedAtUnix: Math.floor(Date.now() / 1000),
  network: "signet",
  policyType: "wsh-sortedmulti",
  threshold: 2,
  participants: 3,
  signers,
  receiveDescriptor,
  changeDescriptor,
  coordinatorName: "CoreVault-2of3",
  coordinatorPrivateKeys: false,
};

export const demoVault: Operation<VaultSummary> = {
  data: {
    policy: "2-of-3",
    addressType: "Native SegWit",
    network: "Signet",
    coordinatorName: "CoreVault-2of3",
    coordinatorHasPrivateKeys: false,
    signers,
    receiveDescriptor,
    changeDescriptor,
    publicBackup: demoPublicBackup,
  },
  rpc: [
    trace("listdescriptors", "Prikuplja samo javne receive i change podatke.", { private: false }),
    trace("getdescriptorinfo", "Bitcoin Core validira 2-of-3 policy i checksum.", {
      isrange: true,
      issolvable: true,
      hasprivatekeys: false,
    }),
    trace("importdescriptors", "Aktivira receive i change policy u watch-only coordinatoru.", [
      { success: true },
      { success: true },
    ]),
  ],
};

export const demoReceive: Operation<ReceiveSnapshot> = {
  data: {
    address: "tb1qcorevaultdemo8m5l9rm35d3f5n4q7p8s2example",
    balanceBtc: 0.0001,
    balanceSats: 10_000,
    solvable: true,
    watchOnly: true,
  },
  rpc: [
    trace("getnewaddress", "Generira novu Signet adresu iz vault policyja.", "tb1q…example"),
    trace("getbalances", "Čita balance samo iz lokalnog coordinatora.", { mine: { trusted: 0.0001 } }),
  ],
};

export const demoSpend = (signedBy: string[] = []): Operation<SpendDraft> => ({
  data: {
    draftId: "demo-draft-1",
    destination: "tb1qrecipient7p4hn0m8a2n6n8d4k6example",
    amountSats: 5_000,
    feeBtc: 0.00000189,
    feeSats: 189,
    signedBy,
    complete: signedBy.length >= 2,
    relockRequired: null,
    state: signedBy.length >= 2 ? "threshold-reached" : signedBy.length === 1 ? "partially-signed" : "awaiting-signatures",
    finalized: false,
    mempoolPreflight: { state: "not-run" },
  },
  rpc: [
    trace(signedBy.length ? "walletprocesspsbt" : "walletcreatefundedpsbt", signedBy.length ? "Bitcoin Core dodaje lokalni potpis." : "Coordinator priprema transakciju bez potpisa.", {
      psbt: "[REDACTED]",
      complete: signedBy.length >= 2,
    }),
  ],
});

export const demoFinalizeSpend = (draft: SpendDraft): Operation<SpendDraft> => ({
  data: {
    ...draft,
    state: "finalized",
    finalized: true,
    mempoolPreflight: { state: "not-run" },
  },
  rpc: [
    trace("finalizepsbt", "Bitcoin Core lokalno finalizira potpisani PSBT bez broadcasta.", {
      complete: true,
      hex: "[REDACTED]",
    }),
  ],
});

export const demoPreflightSpend = (draft: SpendDraft): Operation<SpendDraft> => ({
  data: {
    ...draft,
    state: "ready-to-broadcast",
    finalized: true,
    mempoolPreflight: { state: "accepted" },
  },
  rpc: [
    trace("testmempoolaccept", "Bitcoin Core lokalno provjerava mempool pravila bez broadcasta.", [
      { allowed: true },
    ]),
  ],
});

export const demoBroadcast = (): Operation<BroadcastResult> => ({
  data: {
    txid: "7f3ab846be20a41a9564231ba57e0f3f6e12c9c92a2a58c2b98b7e4f4d3a1c00",
    startingBalanceSats: 10_000,
    sentSats: 5_000,
    feeSats: 189,
    remainingSats: 4_811,
    balanceRefreshed: true,
  },
  rpc: [
    trace(
      "sendrawtransaction",
      "Lokalni Bitcoin Core broadcasta finaliziranu transakciju na Signet.",
      "7f3a…1c00",
    ),
  ],
});
