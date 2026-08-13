import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Eye,
  EyeOff,
  FileDown,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  AppMark,
  CheckRow,
  ErrorNotice,
  PhaseSidebar,
  RpcPanel,
  SecurityNotice,
  StatusBadge,
  StepHeader,
  TrustFacts,
  VaultDiagram,
} from "./components/ui";
import { demoBroadcast, demoCoreStatus, demoReceive, demoSigner, demoSpend, demoVault } from "./lib/demo";
import {
  choosePublicBackupExportDestination,
  chooseSignerBackupDestination,
  coreApi,
  isTauriRuntime,
} from "./lib/tauri";
import type {
  BroadcastResult,
  ConnectionSettings,
  CoreStatus,
  Operation,
  PhaseId,
  ReceiveSnapshot,
  RpcTrace,
  SigningWallet,
  SpendDraft,
  VaultSummary,
} from "./types";

interface SignerState {
  label: "K1" | "K2" | "K3";
  name: string;
  wallet?: SigningWallet;
}

const initialSigners: SignerState[] = [
  { label: "K1", name: "CoreVault-K1" },
  { label: "K2", name: "CoreVault-K2" },
  { label: "K3", name: "CoreVault-K3" },
];

const waitForDemo = () => new Promise((resolve) => window.setTimeout(resolve, 280));

const offlineCoreStatus = (message: string): CoreStatus => ({
  connected: false,
  supported: false,
  chain: null,
  version: null,
  versionLabel: null,
  subversion: null,
  walletRpcAvailable: false,
  cookiePath: null,
  blocks: 0,
  headers: 0,
  verificationProgress: 0,
  initialBlockDownload: false,
  pruned: false,
  sizeOnDisk: 0,
  networkActive: false,
  connections: 0,
  mempoolSize: 0,
  mempoolBytes: 0,
  mempoolTotalFeeBtc: 0,
  mempoolMinFeeBtcKvb: 0,
  lastBlockTime: null,
  loadedWallets: [],
  message,
});

function App() {
  const [started, setStarted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [phase, setPhase] = useState<PhaseId>("core");
  const [completed, setCompleted] = useState<Set<PhaseId>>(new Set());
  const [coreStatus, setCoreStatus] = useState<CoreStatus | null>(null);
  const [traces, setTraces] = useState<RpcTrace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [signers, setSigners] = useState<SignerState[]>(initialSigners);
  const [signerIndex, setSignerIndex] = useState(0);
  const [vault, setVault] = useState<VaultSummary | null>(null);
  const [publicBackupExported, setPublicBackupExported] = useState(false);
  const [receive, setReceive] = useState<ReceiveSnapshot | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [spendStage, setSpendStage] = useState<"compose" | "review" | "sign" | "sent">("compose");
  const [destination, setDestination] = useState("");
  const [amountSats, setAmountSats] = useState("5000");
  const [feeRate, setFeeRate] = useState("2");
  const [draft, setDraft] = useState<SpendDraft | null>(null);
  const [selectedSigner, setSelectedSigner] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<BroadcastResult | null>(null);
  const didDiscover = useRef(false);
  const signerProgress = signers
    .map((signer) => `${Boolean(signer.wallet)}:${Boolean(signer.wallet?.encrypted)}:${Boolean(signer.wallet?.backupPath)}`)
    .join("|");

  const append = <T,>(operation: Operation<T>) => {
    setTraces((current) => [...current, ...operation.rpc]);
    return operation.data;
  };

  useEffect(() => {
    if (didDiscover.current) return;
    didDiscover.current = true;
    if (!isTauriRuntime()) {
      setCoreStatus(offlineCoreStatus(
        "Desktop RPC is available in the Tauri app. Use safe demo mode for a browser preview.",
      ));
      return;
    }
    setBusy("discover");
    coreApi
      .discover()
      .then((operation) => setCoreStatus(append(operation)))
      .catch((reason: unknown) => setCoreStatus(offlineCoreStatus(formatError(reason))))
      .finally(() => setBusy(null));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!started) return;
    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    });
  }, [
    started,
    phase,
    signerIndex,
    signerProgress,
    Boolean(vault),
    publicBackupExported,
    Boolean(receive),
    spendStage,
    draft?.signedBy.length,
    Boolean(draft?.relockRequired),
    Boolean(broadcast),
  ]);

  const markComplete = (id: PhaseId) =>
    setCompleted((current) => new Set([...current, id]));

  const enterLiveFlow = () => {
    setDemoMode(false);
    setStarted(true);
    setPhase("core");
  };

  const enterDemoFlow = () => {
    setDemoMode(true);
    setStarted(true);
    setPhase("core");
    setCoreStatus(append(demoCoreStatus));
    setDestination("tb1qrecipient7p4hn0m8a2n6n8d4k6example");
    setError(null);
  };

  const handleConnect = async (settings: ConnectionSettings) => {
    setBusy("connect");
    setError(null);
    try {
      setCoreStatus(append(await coreApi.connect(settings)));
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleCreateSigner = async (state: SignerState, passphrase: string) => {
    setBusy(`create-${state.label}`);
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const wallet = append(
        demoMode
          ? demoSigner(state.label, true)
          : await coreApi.createSigner(state.label, state.name, passphrase),
      );
      updateSigner(state.label, { ...state, wallet });
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleBuildVault = async () => {
    setBusy("build-vault");
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const result = demoMode ? demoVault : await coreApi.buildVault(signers.map((signer) => signer.name));
      setVault(append(result));
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleBackupSigner = async (state: SignerState) => {
    setBusy(`backup-${state.label}`);
    setError(null);
    try {
      let wallet: SigningWallet;
      if (demoMode) {
        const path = `/Demo/Backups/CoreVault-${state.label}.dat`;
        await waitForDemo();
        wallet = append(demoSigner(state.label, true, path));
      } else {
        const destination = await chooseSignerBackupDestination(state.name);
        if (!destination) return;
        wallet = append(
          await coreApi.backupSigner(state.label, state.name, destination.capabilityId),
        );
      }
      updateSigner(state.label, { ...state, wallet });
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handlePublicExport = async () => {
    if (!vault) return;
    setBusy("public-backup");
    setError(null);
    try {
      if (!demoMode) {
        const destination = await choosePublicBackupExportDestination();
        if (!destination) return;
        await coreApi.exportPublicBackup(destination.capabilityId, vault.publicBackup);
      } else {
        await waitForDemo();
      }
      setPublicBackupExported(true);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleReceive = async (refresh = false) => {
    if (!vault) return;
    setBusy("receive");
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const operation = demoMode
        ? demoReceive
        : await coreApi.receive(vault.coordinatorName, refresh ? receive?.address : undefined);
      setReceive(append(operation));
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleCreateSpend = async () => {
    if (!vault) return;
    setBusy("create-spend");
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const operation = demoMode
        ? demoSpend()
        : await coreApi.createSpend(
            vault.coordinatorName,
            destination,
            Number.parseInt(amountSats, 10),
            Number.parseFloat(feeRate),
          );
      setDraft(append(operation));
      setSpendStage("review");
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleSign = async (walletName: string, passphrase: string) => {
    if (!draft) return;
    setBusy(`sign-${walletName}`);
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const signedBy = [...draft.signedBy, walletName];
      const operation = demoMode
        ? demoSpend(signedBy)
        : await coreApi.signSpend(draft.draftId, walletName, passphrase);
      setDraft(append(operation));
      setSelectedSigner(null);
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleRetrySignerLock = async () => {
    if (!draft?.relockRequired) return;
    setBusy("retry-signer-lock");
    setError(null);
    try {
      const operation = await coreApi.retrySignerLock(draft.draftId);
      const updated = append(operation);
      setDraft(updated);
      if (updated.relockRequired) {
        setError("Bitcoin Core still did not confirm that the signer wallet was re-locked. Transaction progression remains paused.");
      }
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const handleBroadcast = async () => {
    if (!draft) return;
    setBusy("broadcast");
    setError(null);
    try {
      if (demoMode) await waitForDemo();
      const operation: Operation<BroadcastResult> = demoMode
        ? demoBroadcast()
        : await coreApi.broadcast(draft.draftId);
      setBroadcast(append(operation));
      setSpendStage("sent");
      markComplete("spend");
    } catch (reason) {
      setError(formatError(reason));
    } finally {
      setBusy(null);
    }
  };

  const updateSigner = (label: string, next: SignerState) =>
    setSigners((current) => current.map((signer) => (signer.label === label ? next : signer)));

  const updateSignerName = (label: string, name: string) =>
    setSigners((current) => current.map((signer) => (signer.label === label ? { ...signer, name } : signer)));

  if (!started) {
    return (
      <WelcomeScreen
        status={coreStatus}
        busy={busy === "discover"}
        onCreate={enterLiveFlow}
        onDemo={enterDemoFlow}
      />
    );
  }

  const currentSigner = signers[signerIndex];
  const backupTarget = signers.find((signer) => !signer.wallet?.backupPath);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to current step</a>
      <PhaseSidebar current={phase} completed={completed} />
      <div className="workspace">
        <header className="workspace-topbar">
          <div className="network-badge"><span />{demoMode ? "Simulated Signet · Demo data only" : "Signet test network · No real bitcoin"}</div>
          <div className="topbar-statuses">
            {demoMode ? (
              <span className="demo-badge"><Play size={14} />DEMO MODE — NO REAL BITCOIN CORE</span>
            ) : (
              <StatusBadge connected={Boolean(coreStatus?.connected)} label={coreStatus?.connected ? "Core connected" : "Core offline"} />
            )}
          </div>
        </header>
        <main id="main-content" className="workspace-main" tabIndex={-1}>
          {error && <ErrorNotice message={error} />}

          {phase === "core" && (
            <CoreStep
              status={coreStatus}
              busy={busy}
              demoMode={demoMode}
              onConnect={handleConnect}
              onContinue={() => {
                markComplete("core");
                setPhase("signers");
              }}
            />
          )}

          {phase === "signers" && currentSigner && (
            <SignerStep
              signer={currentSigner}
              position={signerIndex}
              busy={busy}
              onNameChange={(name) => updateSignerName(currentSigner.label, name)}
              onCreate={(passphrase) => handleCreateSigner(currentSigner, passphrase)}
              onContinue={() => {
                if (signerIndex < 2) {
                  setSignerIndex((value) => value + 1);
                  setError(null);
                } else {
                  markComplete("signers");
                  setPhase("vault");
                }
              }}
            />
          )}

          {phase === "vault" && (
            <VaultStep
              signers={signers}
              vault={vault}
              busy={busy}
              onBuild={handleBuildVault}
              onContinue={() => {
                markComplete("vault");
                setPhase("backup");
              }}
            />
          )}

          {phase === "backup" && vault && (
            <BackupStep
              signers={signers}
              target={backupTarget}
              publicExported={publicBackupExported}
              busy={busy}
              onBackup={handleBackupSigner}
              onExport={handlePublicExport}
              onContinue={() => {
                markComplete("backup");
                setPhase("receive");
              }}
            />
          )}

          {phase === "receive" && vault && (
            <ReceiveStep
              snapshot={receive}
              balanceHidden={balanceHidden}
              busy={busy}
              onGenerate={() => handleReceive(false)}
              onRefresh={() => handleReceive(true)}
              onToggleBalance={() => setBalanceHidden((value) => !value)}
              onContinue={() => {
                markComplete("receive");
                setPhase("spend");
              }}
            />
          )}

          {phase === "spend" && vault && (
            <SpendStep
              stage={spendStage}
              destination={destination}
              amountSats={amountSats}
              feeRate={feeRate}
              receive={receive}
              draft={draft}
              broadcast={broadcast}
              signers={signers}
              selectedSigner={selectedSigner}
              busy={busy}
              onDestination={setDestination}
              onAmount={setAmountSats}
              onFeeRate={setFeeRate}
              onCreate={handleCreateSpend}
              onReviewComplete={() => setSpendStage("sign")}
              onEdit={() => setSpendStage("compose")}
              onSelectSigner={setSelectedSigner}
              onSign={handleSign}
              onRetrySignerLock={handleRetrySignerLock}
              onBroadcast={handleBroadcast}
            />
          )}

          <RpcPanel traces={traces} />
        </main>
        <footer className="workspace-footer"><span>Localhost only</span><span>No cloud</span><span>No telemetry</span><span>Bitcoin Core is source of truth</span></footer>
      </div>
    </div>
  );
}

function WelcomeScreen({
  status,
  busy,
  onCreate,
  onDemo,
}: {
  status: CoreStatus | null;
  busy: boolean;
  onCreate: () => void;
  onDemo: () => void;
}) {
  return (
    <main className="welcome-page">
      <header className="welcome-nav">
        <div className="welcome-brand"><AppMark /><strong>Core Vault</strong><span>V1 · Signet</span></div>
        <StatusBadge connected={Boolean(status?.connected)} label={busy ? "Checking Core…" : status?.connected ? "Bitcoin Core connected" : "Bitcoin Core not connected"} />
      </header>
      <section className="welcome-hero">
        <div className="welcome-copy stagger-item">
          <span className="eyebrow">Local Bitcoin security</span>
          <h1>Advanced Bitcoin Core wallets without the Debug Console.</h1>
          <p>Build and test a transparent 2-of-3 vault on Signet. Bitcoin Core keeps the keys; Core Vault guides the process.</p>
          <div className="welcome-actions">
            <button className="button button-primary" onClick={onCreate}>Create vault <ArrowRight size={18} /></button>
            <button className="button button-secondary" onClick={onDemo}><Play size={17} />Preview safe demo</button>
          </div>
          <div className="welcome-microcopy"><LockKeyhole size={16} /><span>No account · No cloud · No telemetry · Local Core only</span></div>
        </div>
        <article className="vault-story-card stagger-item">
          <div className="story-card-head"><div><span>Personal Vault</span><h2>2-of-3 Multisig</h2></div><ShieldCheck size={26} /></div>
          <p>Three separate signing wallets protect the funds. Any two can approve a transaction.</p>
          <VaultDiagram />
          <dl className="story-meta"><div><dt>Policy</dt><dd>2 of 3</dd></div><div><dt>Type</dt><dd>Native SegWit</dd></div><div><dt>Network</dt><dd>Signet only</dd></div></dl>
          <details className="how-it-works"><summary>How does this work?</summary><p>A signing wallet holds one key. The vault combines three keys under a 2-of-3 rule. A watch-only coordinator prepares transactions but cannot sign them.</p></details>
        </article>
      </section>
      <section className="welcome-trust" aria-label="Security facts">
        <TrustFacts connected={Boolean(status?.connected)} network={status?.chain} />
      </section>
    </main>
  );
}

function CoreStep({
  status,
  busy,
  demoMode,
  onConnect,
  onContinue,
}: {
  status: CoreStatus | null;
  busy: string | null;
  demoMode: boolean;
  onConnect: (settings: ConnectionSettings) => Promise<void>;
  onContinue: () => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const [settings, setSettings] = useState<ConnectionSettings>({ host: "127.0.0.1", port: 38332, cookiePath: status?.cookiePath ?? "" });
  const wrongNetwork = status?.connected && status.chain !== "signet";
  return (
    <section className="step-screen">
      <StepHeader eyebrow="Step 1 · Bitcoin Core" title="Connect to your local node">
        <p>Core Vault checks the network and wallet support before it can make any changes.</p>
      </StepHeader>
      {wrongNetwork && <SecurityNotice level="danger" title="STOP — wrong network"><p>Ova eksperimentalna verzija podržava isključivo Bitcoin Signet. Nemoj koristiti stvarni bitcoin.</p></SecurityNotice>}
      <TrustFacts connected={Boolean(status?.connected)} network={status?.chain} demo={demoMode} />
      <div className="status-summary">
        <div className={`large-status-icon ${demoMode || status?.supported ? "is-good" : ""}`}>{demoMode ? <Play /> : status?.supported ? <CheckCircle2 /> : <LoaderCircle className={busy ? "spin" : ""} />}</div>
        <div><strong>{demoMode ? "Safe demo is ready" : status?.supported ? "Bitcoin Core is ready" : "Bitcoin Core needs attention"}</strong><p>{status?.message ?? "Checking the local Signet setup…"}</p>{!demoMode && status?.versionLabel && <span>Bitcoin Core {status.versionLabel}</span>}</div>
      </div>
      {!demoMode && !status?.supported && !wrongNetwork && (
        <div className="advanced-connection">
          <button className="button button-quiet" onClick={() => setAdvanced((value) => !value)} aria-expanded={advanced}>Advanced connection settings</button>
          {advanced && (
            <form onSubmit={(event) => { event.preventDefault(); void onConnect(settings); }} className="connection-form">
              <label><span>RPC host</span><input value={settings.host} onChange={(event) => setSettings({ ...settings, host: event.target.value })} autoComplete="off" /><small>Only 127.0.0.1, localhost or ::1</small></label>
              <label><span>RPC port</span><input type="number" min="1" max="65535" value={settings.port} onChange={(event) => setSettings({ ...settings, port: Number(event.target.value) })} /></label>
              <label className="field-wide"><span>Signet cookie path</span><input className="mono-input" value={settings.cookiePath} onChange={(event) => setSettings({ ...settings, cookiePath: event.target.value })} autoComplete="off" spellCheck={false} /></label>
              <button className="button button-secondary field-wide" disabled={busy === "connect"}>{busy === "connect" ? "Checking…" : "Check connection"}</button>
            </form>
          )}
        </div>
      )}
      <div className="step-actions"><button className="button button-primary" onClick={onContinue} disabled={!demoMode && !status?.supported}>Continue to signing wallets <ArrowRight size={18} /></button></div>
    </section>
  );
}

function SignerStep({
  signer,
  position,
  busy,
  onNameChange,
  onCreate,
  onContinue,
}: {
  signer: SignerState;
  position: number;
  busy: string | null;
  onNameChange: (name: string) => void;
  onCreate: (passphrase: string) => Promise<void>;
  onContinue: () => void;
}) {
  const passphraseRef = useRef<HTMLInputElement>(null);
  const created = Boolean(signer.wallet);
  const ready = Boolean(signer.wallet?.encrypted && signer.wallet?.locked);
  const handleCreate = async () => {
    const input = passphraseRef.current;
    if (!input || input.value.length < 10) {
      input?.setCustomValidity("Use at least 10 characters.");
      input?.reportValidity();
      return;
    }
    input.setCustomValidity("");
    const value = input.value;
    input.value = "";
    await onCreate(value);
  };
  return (
    <section className="step-screen">
      <StepHeader eyebrow={`Step 2 · Signing wallets · ${position + 1} of 3`} title={ready ? `${signer.label} is ready` : `Create encrypted ${signer.label}`}>
        <p>{ready ? "Bitcoin Core confirmed that this signer is encrypted and locked." : "Bitcoin Core will create this key encrypted from the first wallet operation."}</p>
      </StepHeader>
      <article className={`signer-focus-card ${ready ? "is-ready" : ""}`}>
        <div className="signer-icon"><KeyRound /></div>
        <div className="signer-focus-content"><span>{signer.label}</span><h2>Signing wallet {position + 1}</h2><p>{created ? signer.name : "Holds one of the three keys"}</p></div>
        {ready && <div className="ready-stamp"><Check size={17} />Ready</div>}
      </article>
      <ul className="check-list">
        <CheckRow done={created}>Descriptor wallet created by Bitcoin Core</CheckRow>
        <CheckRow done={ready}>Wallet created encrypted and confirmed locked</CheckRow>
        <CheckRow done={false}>Backup will be checked before the receive test</CheckRow>
      </ul>
      {!created && (
        <>
          <label className="form-field"><span>Bitcoin Core wallet name</span><input value={signer.name} onChange={(event) => onNameChange(event.target.value)} autoComplete="off" /><small>Letters, numbers, dash, underscore and dot only.</small></label>
          <div className="password-block">
            <label className="form-field"><span>Wallet password</span><input ref={passphraseRef} type="password" minLength={10} autoComplete="new-password" /><small>The password is sent only to your local Bitcoin Core. Core Vault does not save it.</small></label>
            <SecurityNotice title="Remember this password"><p>Losing the password may make this signing wallet unusable even if you still have its backup. Store them separately.</p></SecurityNotice>
          </div>
        </>
      )}
      <div className="step-actions">
        {!created && <button className="button button-primary" onClick={() => void handleCreate()} disabled={busy !== null}>{busy === `create-${signer.label}` ? "Creating encrypted wallet in Bitcoin Core…" : "Create encrypted signing wallet"}</button>}
        {ready && <button className="button button-primary" onClick={onContinue}>{position < 2 ? `Continue to K${position + 2}` : "Review vault"}<ArrowRight size={18} /></button>}
      </div>
    </section>
  );
}

function VaultStep({ signers, vault, busy, onBuild, onContinue }: { signers: SignerState[]; vault: VaultSummary | null; busy: string | null; onBuild: () => void; onContinue: () => void }) {
  return (
    <section className="step-screen">
      <StepHeader eyebrow="Step 3 · Multisig vault" title={vault ? "Vault ready" : "Review your vault story"}>
        <p>{vault ? "Bitcoin Core validated the policy and created a watch-only coordinator." : "You are creating three independent signing wallets under one 2-of-3 rule."}</p>
      </StepHeader>
      <VaultDiagram />
      <div className="three-facts"><div><strong>Any 2 can spend</strong><span>K1 + K2, K1 + K3, or K2 + K3.</span></div><div><strong>Losing 1 is survivable</strong><span>The other two keys can still move funds.</span></div><div><strong>Losing 2 may lock funds</strong><span>Two usable keys are always required.</span></div></div>
      <div className="signer-summary-grid">{signers.map((signer) => <div key={signer.label}><span className="mini-key"><KeyRound size={16} />{signer.label}</span><strong>{signer.name}</strong><small><Check size={14} />Created and encrypted</small></div>)}</div>
      <article className="coordinator-card"><div><Eye size={20} /><span><strong>Watch-only coordinator</strong><small>Tracks the vault and prepares transactions</small></span></div><span className="no-keys"><ShieldCheck size={16} />Private keys: none</span></article>
      {vault && <SecurityNotice level="success" title="Bitcoin Core checks passed"><p>Policy: 2-of-3 · Type: Native SegWit · Network: Signet · Coordinator private keys: None.</p></SecurityNotice>}
      <div className="step-actions">{!vault ? <button className="button button-primary" onClick={onBuild} disabled={busy !== null}>{busy === "build-vault" ? "Bitcoin Core is building the vault…" : "I understand — create vault"}</button> : <button className="button button-primary" onClick={onContinue}>Continue to backup check <ArrowRight size={18} /></button>}</div>
    </section>
  );
}

function BackupStep({
  signers,
  target,
  publicExported,
  busy,
  onBackup,
  onExport,
  onContinue,
}: {
  signers: SignerState[];
  target?: SignerState;
  publicExported: boolean;
  busy: string | null;
  onBackup: (signer: SignerState) => void;
  onExport: () => void;
  onContinue: () => void;
}) {
  const signerBackupsDone = signers.every((signer) => Boolean(signer.wallet?.backupPath));
  return (
    <section className="step-screen">
      <StepHeader eyebrow="Step 4 · Backup check" title={publicExported ? "Vault backup complete" : target ? `Back up ${target.label}` : "Export public vault configuration"}>
        <p>{target ? "This backup contains the key capability needed to sign. Keep it separate from the wallet password." : "This public configuration cannot spend bitcoin, but it is needed to reconstruct the vault."}</p>
      </StepHeader>
      <div className="backup-types"><article><div className="backup-type-icon"><KeyRound /></div><div><h3>Signing wallet backups</h3><p>Can participate in spending when used with the wallet password.</p></div></article><span className="backup-plus">+</span><article><div className="backup-type-icon"><FileDown /></div><div><h3>Public vault configuration</h3><p>Cannot spend, but can reveal the entire wallet history.</p></div></article></div>
      <ul className="backup-checklist">
        {signers.map((signer) => <CheckRow key={signer.label} done={Boolean(signer.wallet?.backupPath)}>{signer.label} signing wallet backup</CheckRow>)}
        <CheckRow done={publicExported}>Public vault configuration</CheckRow>
      </ul>
      {!target && !publicExported && <SecurityNotice level="warning" title="Sensitive wallet metadata"><p>The public configuration contains descriptors and public keys. It cannot sign, but anyone who obtains it may monitor past and future vault activity.</p></SecurityNotice>}
      <div className="step-actions">
        {target && <button className="button button-primary" onClick={() => onBackup(target)} disabled={busy !== null}>{busy === `backup-${target.label}` ? "Creating backup…" : `Create ${target.label} backup`}</button>}
        {signerBackupsDone && !publicExported && <button className="button button-primary" onClick={onExport} disabled={busy !== null}>{busy === "public-backup" ? "Scanning and exporting…" : "Export public configuration"}</button>}
        {publicExported && <button className="button button-primary" onClick={onContinue}>Continue to receive test <ArrowRight size={18} /></button>}
      </div>
    </section>
  );
}

function ReceiveStep({ snapshot, balanceHidden, busy, onGenerate, onRefresh, onToggleBalance, onContinue }: { snapshot: ReceiveSnapshot | null; balanceHidden: boolean; busy: string | null; onGenerate: () => void; onRefresh: () => void; onToggleBalance: () => void; onContinue: () => void }) {
  return (
    <section className="step-screen">
      <StepHeader eyebrow="Step 5 · Receive test" title={snapshot ? "Fund the vault on Signet" : "Create a receive address"}>
        <p>{snapshot ? "Send test bitcoin to this new address, then ask your local coordinator to check the balance." : "Bitcoin Core will derive a fresh address from the validated 2-of-3 receive policy."}</p>
      </StepHeader>
      {!snapshot ? (
        <div className="receive-empty"><WalletCards size={36} /><strong>No address shown yet</strong><p>Addresses are sensitive wallet metadata. Core Vault generates and shows one only when you ask.</p></div>
      ) : (
        <div className="receive-card">
          <span className="eyebrow">Signet receive address</span><code>{snapshot.address}</code>
          <div className="receive-address-actions"><button className="button button-secondary" onClick={() => void navigator.clipboard.writeText(snapshot.address)}><Clipboard size={17} />Copy address</button><button className="button button-quiet" onClick={onGenerate} disabled={busy !== null}>New address</button></div>
          <div className="balance-row"><span>Vault balance</span><div className="balance-values"><strong aria-label={balanceHidden ? "Balance hidden" : `${snapshot.balanceSats} satoshis`}>{balanceHidden ? "•••••• sats" : `${snapshot.balanceSats.toLocaleString("en-US")} sats`}</strong><small>{balanceHidden ? "•••••••• BTC" : `${snapshot.balanceBtc.toFixed(8)} BTC`}</small></div><button className="icon-button" onClick={onToggleBalance} aria-label={balanceHidden ? "Show balance" : "Hide balance"}>{balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
        </div>
      )}
      {snapshot && snapshot.balanceSats === 0 && <SecurityNotice title="Waiting for a Signet payment"><p>No funds are visible yet. The address is valid and watch-only; refresh after the test payment reaches your local node.</p></SecurityNotice>}
      <div className="step-actions">
        {!snapshot && <button className="button button-primary" onClick={onGenerate} disabled={busy !== null}>{busy === "receive" ? "Generating in Bitcoin Core…" : "Generate receive address"}</button>}
        {snapshot && snapshot.balanceSats === 0 && <button className="button button-primary" onClick={onRefresh} disabled={busy !== null}><RefreshCw size={17} className={busy === "receive" ? "spin" : ""} />Check for payment</button>}
        {snapshot && snapshot.balanceSats > 0 && <button className="button button-primary" onClick={onContinue}>Continue to spending test <ArrowRight size={18} /></button>}
      </div>
    </section>
  );
}

function SpendStep({
  stage,
  destination,
  amountSats,
  feeRate,
  receive,
  draft,
  broadcast,
  signers,
  selectedSigner,
  busy,
  onDestination,
  onAmount,
  onFeeRate,
  onCreate,
  onReviewComplete,
  onEdit,
  onSelectSigner,
  onSign,
  onRetrySignerLock,
  onBroadcast,
}: {
  stage: "compose" | "review" | "sign" | "sent";
  destination: string;
  amountSats: string;
  feeRate: string;
  receive: ReceiveSnapshot | null;
  draft: SpendDraft | null;
  broadcast: BroadcastResult | null;
  signers: SignerState[];
  selectedSigner: string | null;
  busy: string | null;
  onDestination: (value: string) => void;
  onAmount: (value: string) => void;
  onFeeRate: (value: string) => void;
  onCreate: () => void;
  onReviewComplete: () => void;
  onEdit: () => void;
  onSelectSigner: (value: string | null) => void;
  onSign: (walletName: string, passphrase: string) => Promise<void>;
  onRetrySignerLock: () => Promise<void>;
  onBroadcast: () => void;
}) {
  if (stage === "compose") {
    return (
      <section className="step-screen"><StepHeader eyebrow="Step 6 · Spending test" title="Create a test transaction"><p>The watch-only coordinator prepares the transaction. It cannot sign or broadcast it by itself.</p></StepHeader>
        <div className="send-form"><label className="form-field"><span>Signet destination address</span><input className="mono-input" value={destination} onChange={(event) => onDestination(event.target.value)} autoComplete="off" spellCheck={false} /></label><label className="form-field"><span>Amount</span><div className="amount-input"><input type="number" min="1" step="1" value={amountSats} onChange={(event) => onAmount(event.target.value)} /><span>sats</span></div></label><label className="form-field"><span>Fee rate</span><div className="amount-input"><input type="number" min="1" max="1000" step="0.1" value={feeRate} onChange={(event) => onFeeRate(event.target.value)} /><span>sat/vB</span></div></label></div>
        <SecurityNotice title="No signature yet"><p>Creating the transaction only selects Signet funds and calculates change. You will review all details before adding signatures.</p></SecurityNotice>
        <div className="step-actions"><button className="button button-primary" onClick={onCreate} disabled={busy !== null || !destination || Number(amountSats) <= 0}>{busy === "create-spend" ? "Preparing in Bitcoin Core…" : "Review transaction"}<ArrowRight size={18} /></button></div>
      </section>
    );
  }
  if (stage === "sent" && broadcast) {
    return (
      <section className="step-screen success-screen"><div className="success-orb"><Check size={32} /></div><StepHeader eyebrow="Spending test complete" title="Broadcast on Signet"><p>Your local Bitcoin Core accepted and broadcast the transaction. No block explorer was contacted.</p></StepHeader><div className="txid-card"><span>Transaction ID</span><code>{broadcast.txid}</code><button className="button button-secondary" onClick={() => void navigator.clipboard.writeText(broadcast.txid)}><Clipboard size={17} />Copy txid</button></div><div className="change-summary"><div><span>Starting balance</span><strong>{broadcast.startingBalanceSats.toLocaleString("en-US")} sats</strong></div><div><span>Sent</span><strong>−{broadcast.sentSats.toLocaleString("en-US")} sats</strong></div><div><span>Network fee</span><strong>−{broadcast.feeSats.toLocaleString("en-US")} sats</strong></div><div className="is-total"><span>Remaining</span><strong>{broadcast.remainingSats.toLocaleString("en-US")} sats</strong></div></div><SecurityNotice level="success" title="Your change remains inside the vault"><p>The remaining funds return to an internal change address protected by the same 2-of-3 rule.{!broadcast.balanceRefreshed && " The displayed remainder is the transaction estimate because the immediate balance refresh was unavailable."}</p></SecurityNotice><SecurityNotice level="success" title="You completed the full 2-of-3 flow"><p>The coordinator prepared the transaction, two different signing wallets approved it, and local Bitcoin Core broadcast it.</p></SecurityNotice></section>
    );
  }
  if (!draft) return null;
  const remaining = Math.max(0, (receive?.balanceSats ?? 0) - draft.amountSats - draft.feeSats);
  if (stage === "review") {
    return (
      <section className="step-screen"><StepHeader eyebrow="Transaction review" title="Check every detail before signing"><p>A signature is your approval. The transaction cannot be edited after signing; a change creates a new draft.</p></StepHeader><TransactionReview draft={draft} remaining={remaining} /><div className="approval-summary"><VaultDiagram signedBy={draft.signedBy} /></div><div className="step-actions split-actions"><button className="button button-secondary" onClick={onEdit}>Edit details</button><button className="button button-primary" onClick={onReviewComplete}>Start approvals <ArrowRight size={18} /></button></div></section>
    );
  }
  return (
    <section className="step-screen">
      <StepHeader
        eyebrow="Add signature"
        title={draft.relockRequired
          ? "Signer wallet lock needs attention"
          : draft.complete
            ? "Two approvals collected"
            : draft.signedBy.length === 1
              ? "Transaction needs one more signature"
              : "Choose the first signing wallet"}
      >
        <p>{draft.relockRequired
          ? "Core Vault has paused signing and transaction progression until Bitcoin Core confirms the signer wallet is locked again."
          : draft.complete
            ? "Review the transaction once more before local broadcast."
            : "Each approval is added by Bitcoin Core. Core Vault never receives a private key."}</p>
      </StepHeader>
      <TransactionReview draft={draft} remaining={remaining} compact />
      <div className="signer-slots">{signers.map((signer) => { const signed = draft.signedBy.includes(signer.name); const selected = selectedSigner === signer.name; return <div className={`signer-slot ${signed ? "is-signed" : ""} ${selected ? "is-selected" : ""}`} key={signer.label}><div className="slot-main"><span className="signer-icon-small">{signed ? <Check size={17} /> : <KeyRound size={17} />}</span><div><strong>{signer.label} · {signer.name}</strong><small>{signed ? "Signature added" : "Local Bitcoin Core wallet"}</small></div></div>{signed ? <span className="slot-status"><CheckCircle2 size={16} />Signed</span> : <button className="button button-secondary" disabled={draft.complete || Boolean(draft.relockRequired) || busy !== null} onClick={() => onSelectSigner(selected ? null : signer.name)}>Add signature</button>}{selected && !signed && !draft.relockRequired && <SignerPassword walletName={signer.name} busy={busy} onCancel={() => onSelectSigner(null)} onSign={onSign} />}</div>; })}</div>
      {draft.relockRequired && (
        <SecurityNotice level="warning" title="Signer wallet could not be re-locked">
          <p>{draft.relockRequired.signatureAdded
            ? `The signature from ${draft.relockRequired.walletName} was added and remains preserved, but Bitcoin Core did not confirm that this signer wallet was re-locked.`
            : `No signature from ${draft.relockRequired.walletName} was added, and Bitcoin Core also did not confirm that this signer wallet was re-locked.`}</p>
          {draft.relockRequired.signingError && <p>Signing also failed: {draft.relockRequired.signingError}</p>}
          <p>Further signing, finalization and broadcast are paused. The wallet may remain temporarily unlocked until Bitcoin Core's five-second unlock timeout expires.</p>
          <p>Bitcoin Core response: {draft.relockRequired.relockError}</p>
          <button className="button button-primary" onClick={() => void onRetrySignerLock()} disabled={busy !== null}>{busy === "retry-signer-lock" ? "Retrying lock…" : "Retry lock"}</button>
        </SecurityNotice>
      )}
      {draft.complete && !draft.relockRequired && <SecurityNotice level="warning" title="Broadcast is the final action"><p>Bitcoin Core will send this transaction to the Signet network. Amount, destination and fee can no longer be changed without creating a new transaction.</p></SecurityNotice>}
      {draft.complete && !draft.relockRequired && <div className="step-actions"><button className="button button-primary" onClick={onBroadcast} disabled={busy !== null}>{busy === "broadcast" ? "Finalizing and broadcasting…" : "Broadcast on Signet"}</button></div>}
    </section>
  );
}

function TransactionReview({ draft, remaining, compact = false }: { draft: SpendDraft; remaining: number; compact?: boolean }) {
  return <div className={`transaction-review ${compact ? "is-compact" : ""}`}><div className="review-amount"><span>You are sending</span><strong>{draft.amountSats.toLocaleString("en-US")} sats</strong></div><div className="review-row"><span>To</span><code>{draft.destination}</code></div><div className="review-row"><span>Network fee</span><strong>{draft.feeSats.toLocaleString("en-US")} sats</strong></div><div className="review-row"><span>Remaining in vault</span><strong>{remaining.toLocaleString("en-US")} sats</strong></div><div className="review-row"><span>Required approvals</span><strong>2 of 3</strong></div></div>;
}

function SignerPassword({ walletName, busy, onCancel, onSign }: { walletName: string; busy: string | null; onCancel: () => void; onSign: (walletName: string, passphrase: string) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = async () => {
    const input = inputRef.current;
    if (!input) return;
    const passphrase = input.value;
    input.value = "";
    await onSign(walletName, passphrase);
  };
  return <div className="signer-unlock"><label><span>Wallet password</span><input ref={inputRef} type="password" autoComplete="current-password" /><small>Sent only to local Bitcoin Core, then cleared.</small></label><div><button className="button button-quiet" onClick={onCancel}>Cancel</button><button className="button button-primary" onClick={() => void submit()} disabled={busy !== null}>{busy === `sign-${walletName}` ? "Signing…" : `Sign with ${walletName}`}</button></div></div>;
}

function formatError(reason: unknown): string {
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return reason.message;
  return "An unexpected local error occurred. Existing wallets and funds were not changed by this step.";
}

export default App;
