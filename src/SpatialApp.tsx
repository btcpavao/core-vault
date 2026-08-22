import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  Eye,
  Gauge,
  Hammer,
  KeyRound,
  Landmark,
  LockKeyhole,
  Network,
  Radio,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  WalletCards,
  X,
} from "lucide-react";
import LegacyApp from "./App";
import { t, type CopyKey } from "./i18n";
import { playInteraction, setAmbient } from "./lib/audio";
import {
  choosePersonalBackupDestination,
  choosePersonalRestoreSource,
  coreApi,
  isTauriRuntime,
} from "./lib/tauri";
import {
  demoBroadcast,
  demoReceive,
  demoSnapshot,
  demoSpatialCore,
  demoSpend,
  demoVaultItem,
} from "./lib/spatialDemo";
import { loadPreferences, savePreferences, type Preferences } from "./lib/preferences";
import { clearPasswordInputs } from "./lib/secretInputs";
import { deriveCoreState } from "./state/machines";
import {
  ArtifactButton,
  ContextOverlay,
  EnergyCore,
  ObservationBasin,
  RecessedLedger,
  WorldScene,
} from "./components/world";
import type {
  BackupReceipt,
  CoreStatus,
  PersonalBroadcast,
  PersonalReceive,
  PersonalSpendView,
  PersonalVaultSnapshot,
  RestoreReceipt,
  RpcTrace,
  SceneId,
  VaultListItem,
} from "./types";

type Mode = "real" | "demo";

const sceneMeta: Array<{ id: SceneId; label: CopyKey; icon: typeof Archive }> = [
  { id: "hall", label: "mainHall", icon: Landmark },
  { id: "workshop", label: "workshop", icon: Hammer },
  { id: "vault", label: "vault", icon: LockKeyhole },
  { id: "archive", label: "archive", icon: Archive },
  { id: "communications", label: "communications", icon: Radio },
  { id: "engine", label: "engine", icon: Gauge },
  { id: "observatory", label: "observatory", icon: Eye },
  { id: "library", label: "library", icon: BookOpen },
];

const formatSats = (value: number | null | undefined) =>
  `${new Intl.NumberFormat("en-US").format(value ?? 0)} sats`;

const formatBytes = (value: number) => {
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1)} MB`;
  const gb = value / 1_000_000_000;
  return `${gb.toFixed(gb >= 10 ? 1 : 2)} GB`;
};

const shorten = (value: string, width = 11) =>
  value.length <= width * 2 + 1 ? value : `${value.slice(0, width)}…${value.slice(-width)}`;

function useQr(value?: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl("");
      return;
    }
    void QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 340,
      color: { dark: "#11253a", light: "#f4f1e8" },
    }).then((next) => active && setUrl(next));
    return () => {
      active = false;
    };
  }, [value]);
  return url;
}

function StatusPill({ tone, children }: { tone: "ok" | "warn" | "quiet"; children: ReactNode }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Panel({ eyebrow, title, children, className = "" }: { eyebrow?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`stone-panel ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function SpatialApp() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [scene, setScene] = useState<SceneId>("hall");
  const [mode, setMode] = useState<Mode>(isTauriRuntime() ? "real" : "demo");
  const [core, setCore] = useState<CoreStatus>(demoSpatialCore);
  const [vaults, setVaults] = useState<VaultListItem[]>(isTauriRuntime() ? [] : [demoVaultItem]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(isTauriRuntime() ? null : demoVaultItem.walletName);
  const [snapshot, setSnapshot] = useState<PersonalVaultSnapshot | null>(isTauriRuntime() ? null : demoSnapshot);
  const [receive, setReceive] = useState<PersonalReceive | null>(null);
  const [spend, setSpend] = useState<PersonalSpendView | null>(null);
  const [broadcast, setBroadcast] = useState<PersonalBroadcast | null>(null);
  const [backup, setBackup] = useState<BackupReceipt | null>(null);
  const [restore, setRestore] = useState<RestoreReceipt | null>(null);
  const [passphraseChanged, setPassphraseChanged] = useState(false);
  const [rpc, setRpc] = useState<RpcTrace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(preferences.walkthroughComplete ? -1 : 0);
  const [copied, setCopied] = useState(false);
  const [broadcastConfirmed, setBroadcastConfirmed] = useState(false);
  const [workshopStation, setWorkshopStation] = useState<"personal" | null>(null);
  const [archiveStation, setArchiveStation] = useState<"backup" | "restore" | null>(null);
  const [communicationStation, setCommunicationStation] = useState<"receive" | "send" | null>(null);
  const [libraryTopic, setLibraryTopic] = useState<"about" | "reference" | "limits" | null>(null);
  const lang = preferences.language;
  const tr = (key: CopyKey) => t(lang, key);
  const qrUrl = useQr(receive?.address);

  const displayNameRef = useRef<HTMLInputElement>(null);
  const walletNameRef = useRef<HTMLInputElement>(null);
  const passphraseRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const receiveLabelRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const feeRef = useRef<HTMLInputElement>(null);
  const signPassphraseRef = useRef<HTMLInputElement>(null);
  const restoredNameRef = useRef<HTMLInputElement>(null);
  const oldPassphraseRef = useRef<HTMLInputElement>(null);
  const newPassphraseRef = useRef<HTMLInputElement>(null);
  const newPassphraseConfirmRef = useRef<HTMLInputElement>(null);

  const clearCreatePassphrases = () => clearPasswordInputs(passphraseRef, confirmRef);
  const clearChangePassphrases = () => clearPasswordInputs(
    oldPassphraseRef,
    newPassphraseRef,
    newPassphraseConfirmRef,
  );
  const clearSigningPassphrase = () => clearPasswordInputs(signPassphraseRef);
  const clearPersonalPassphrases = () => {
    clearCreatePassphrases();
    clearChangePassphrases();
    clearSigningPassphrase();
  };

  const updatePreferences = (patch: Partial<Preferences>) =>
    setPreferences((current) => ({ ...current, ...patch }));

  useEffect(() => {
    savePreferences(preferences);
    document.documentElement.lang = preferences.language;
    document.documentElement.dataset.motion = preferences.reducedMotion ? "reduced" : "full";
    setAmbient(preferences.ambientSound && !preferences.muted, preferences.volume);
  }, [preferences]);

  const appendRpc = (next: RpcTrace[]) => setRpc((current) => [...next, ...current].slice(0, 24));

  const run = async (work: () => Promise<void>) => {
    setLoading(true);
    setError("");
    try {
      await work();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  };

  const refreshVaults = async () => {
    if (mode === "demo") {
      setVaults([demoVaultItem]);
      return;
    }
    const operation = await coreApi.listVaults();
    setVaults(operation.data);
    appendRpc(operation.rpc);
  };

  const connect = async () =>
    run(async () => {
      if (!isTauriRuntime()) {
        setMode("demo");
        setCore(demoSpatialCore);
        setVaults([demoVaultItem]);
        setSelectedWallet(demoVaultItem.walletName);
        setSnapshot(demoSnapshot);
        return;
      }
      setMode("real");
      const operation = await coreApi.discover();
      setCore(operation.data);
      appendRpc(operation.rpc);
      if (operation.data.supported) await refreshVaults();
    });

  useEffect(() => {
    if (isTauriRuntime()) void connect();
    // Initial Core discovery is intentionally performed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (next: SceneId) => {
    if (preferences.interactionSound && !preferences.muted) playInteraction(preferences.volume);
    clearPersonalPassphrases();
    setWorkshopStation(null);
    setArchiveStation(null);
    setCommunicationStation(null);
    setLibraryTopic(null);
    setScene(next);
    setError("");
  };

  const loadVault = async (walletName: string) =>
    run(async () => {
      setSelectedWallet(walletName);
      if (mode === "demo") {
        setSnapshot(demoSnapshot);
      } else {
        const operation = await coreApi.getPersonalVault(walletName);
        setSnapshot(operation.data);
        appendRpc(operation.rpc);
      }
      go("vault");
    });

  const createPersonal = (event: FormEvent) => {
    event.preventDefault();
    const displayName = displayNameRef.current?.value.trim() ?? "";
    const walletName = walletNameRef.current?.value.trim() ?? "";
    const passphrase = passphraseRef.current?.value ?? "";
    const confirm = confirmRef.current?.value ?? "";
    if (passphrase !== confirm) {
      setError("Passphrases do not match.");
      return;
    }
    clearCreatePassphrases();
    void run(async () => {
      try {
        if (mode === "demo") {
          const item = { ...demoVaultItem, displayName: displayName || "New Personal Vault", walletName: walletName || "new_personal" };
          const nextSnapshot = { ...demoSnapshot, vault: { ...demoSnapshot.vault, displayName: item.displayName, walletName: item.walletName } };
          setVaults([item]);
          setSelectedWallet(item.walletName);
          setSnapshot(nextSnapshot);
        } else {
          const operation = await coreApi.createPersonalVault(walletName, displayName, passphrase);
          appendRpc(operation.rpc);
          setSelectedWallet(operation.data.walletName);
          await refreshVaults();
          const detail = await coreApi.getPersonalVault(operation.data.walletName);
          setSnapshot(detail.data);
          appendRpc(detail.rpc);
        }
        go("archive");
      } finally {
        clearCreatePassphrases();
      }
    });
  };

  const createBackup = () => {
    if (!selectedWallet) return;
    void run(async () => {
      if (mode === "demo") {
        setBackup({
          walletName: selectedWallet,
          path: "/demonstration/CoreVault-demo.dat",
          createdAtUnix: Math.floor(Date.now() / 1000),
          sizeBytes: 1_458_176,
          sha256: "42".repeat(32),
        });
        return;
      }
      const destination = await choosePersonalBackupDestination(selectedWallet);
      if (!destination) return;
      const operation = await coreApi.backupPersonalVault(
        selectedWallet,
        destination.capabilityId,
      );
      setBackup(operation.data);
      appendRpc(operation.rpc);
      await refreshVaults();
    });
  };

  const testRestore = () => {
    if (!selectedWallet) return;
    void run(async () => {
      const restoredWalletName = restoredNameRef.current?.value.trim() || `${selectedWallet}_restore_test`;
      if (mode === "demo") {
        setRestore({
          originalWalletName: selectedWallet,
          restoredWalletName,
          publicFingerprint: demoSnapshot.vault.publicFingerprint,
          fingerprintsMatch: true,
          warnings: ["Demonstration result only. No wallet file was read."],
        });
        return;
      }
      const source = await choosePersonalRestoreSource();
      if (!source) return;
      const operation = await coreApi.restorePersonalVault(
        selectedWallet,
        restoredWalletName,
        source.capabilityId,
      );
      setRestore(operation.data);
      appendRpc(operation.rpc);
    });
  };

  const unloadRestored = () => {
    if (!restore) return;
    void run(async () => {
      if (mode !== "demo") {
        const operation = await coreApi.unloadWallet(restore.restoredWalletName);
        appendRpc(operation.rpc);
        await refreshVaults();
      }
      setRestore(null);
    });
  };

  const changePassphrase = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWallet) return;
    const oldPassphrase = oldPassphraseRef.current?.value ?? "";
    const newPassphrase = newPassphraseRef.current?.value ?? "";
    const confirmation = newPassphraseConfirmRef.current?.value ?? "";
    if (newPassphrase !== confirmation) {
      setError("New passphrases do not match.");
      return;
    }
    clearChangePassphrases();
    setPassphraseChanged(false);
    let succeeded = false;
    void run(async () => {
      try {
        if (mode !== "demo") {
          const operation = await coreApi.changePersonalPassphrase(selectedWallet, oldPassphrase, newPassphrase);
          appendRpc(operation.rpc);
        }
        succeeded = true;
        setPassphraseChanged(true);
      } finally {
        clearChangePassphrases();
      }
    }).finally(() => {
      if (!succeeded) oldPassphraseRef.current?.focus();
    });
  };

  const generateReceive = () => {
    if (!selectedWallet) return;
    void run(async () => {
      const label = receiveLabelRef.current?.value.trim() || "Core Vault receive";
      if (mode === "demo") setReceive({ ...demoReceive, walletName: selectedWallet, label });
      else {
        const operation = await coreApi.createPersonalReceiveAddress(selectedWallet, label);
        setReceive(operation.data);
        appendRpc(operation.rpc);
      }
    });
  };

  const createSpend = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWallet) return;
    const destination = destinationRef.current?.value.trim() ?? "";
    const amount = Number(amountRef.current?.value ?? 0);
    const feeRate = Number(feeRef.current?.value ?? 0);
    void run(async () => {
      if (mode === "demo") setSpend(demoSpend(destination || demoReceive.address, amount, feeRate));
      else {
        const operation = await coreApi.createPersonalSpend(selectedWallet, destination, amount, feeRate);
        setSpend(operation.data);
        appendRpc(operation.rpc);
      }
    });
  };

  const signSpend = () => {
    if (!spend) return;
    const passphrase = signPassphraseRef.current?.value ?? "";
    clearSigningPassphrase();
    let succeeded = false;
    void run(async () => {
      try {
        if (mode === "demo") setSpend({ ...spend, state: "threshold-reached", complete: true });
        else {
          const operation = await coreApi.signPersonalSpend(spend.draftId, passphrase);
          setSpend(operation.data);
          appendRpc(operation.rpc);
        }
        succeeded = true;
      } finally {
        clearSigningPassphrase();
      }
    }).finally(() => {
      if (!succeeded) signPassphraseRef.current?.focus();
    });
  };

  const finalizeSpend = () => {
    if (!spend) return;
    void run(async () => {
      setBroadcastConfirmed(false);
      if (mode === "demo") {
        setSpend({
          ...spend,
          state: "ready-to-broadcast",
          mempoolPreflight: { state: "accepted" },
        });
      } else {
        const finalized = await coreApi.finalizePersonalSpend(spend.draftId);
        setSpend(finalized.data);
        appendRpc(finalized.rpc);
        const preflight = await coreApi.preflightPersonalSpend(spend.draftId);
        setSpend(preflight.data);
        appendRpc(preflight.rpc);
      }
    });
  };

  const retryPreflight = () => {
    if (!spend) return;
    void run(async () => {
      setBroadcastConfirmed(false);
      if (mode === "demo") {
        setSpend({
          ...spend,
          state: "ready-to-broadcast",
          mempoolPreflight: { state: "accepted" },
        });
      } else {
        const operation = await coreApi.preflightPersonalSpend(spend.draftId);
        setSpend(operation.data);
        appendRpc(operation.rpc);
      }
    });
  };

  const broadcastSpend = () => {
    if (!spend || !broadcastConfirmed || spend.mempoolPreflight.state !== "accepted") return;
    void run(async () => {
      if (mode === "demo") setBroadcast({ ...demoBroadcast, walletName: spend.walletName, sentSats: spend.amountSats, feeSats: spend.feeSats });
      else {
        const authorization = await coreApi.requestPersonalBroadcastAuthorization(spend.draftId);
        if (!authorization) return;
        const operation = await coreApi.broadcastPersonalSpend(
          spend.draftId,
          authorization.authorizationId,
        );
        setBroadcast(operation.data);
        appendRpc(operation.rpc);
        if (selectedWallet) {
          const detail = await coreApi.getPersonalVault(selectedWallet);
          setSnapshot(detail.data);
          appendRpc(detail.rpc);
        }
      }
    });
  };

  const toggleNetwork = () => {
    void run(async () => {
      if (mode === "demo") setCore((current) => ({ ...current, networkActive: !current.networkActive }));
      else {
        const operation = await coreApi.setNetworkActive(!core.networkActive);
        setCore(operation.data);
        appendRpc(operation.rpc);
      }
    });
  };

  const finishWalkthrough = () => {
    updatePreferences({ walkthroughComplete: true });
    setOnboardingStep(-1);
  };

  if (legacyOpen) {
    return (
      <div className="legacy-wrapper">
        <button className="legacy-return" onClick={() => setLegacyOpen(false)}>
          <ArrowLeft size={16} /> {tr("back")}
        </button>
        <LegacyApp />
      </div>
    );
  }

  const chain = (core.chain ?? "unknown").toUpperCase();
  const coreState = deriveCoreState(core);
  const isDemo = mode === "demo";
  const mutationsAllowed = isDemo || ["signet", "test", "testnet4", "regtest"].includes(core.chain ?? "");

  return (
    <div className={`spatial-app scene-${scene}`} aria-busy={loading}>
      <a className="skip-link" href="#scene-main">Skip to room content</a>
      {isDemo && <div className="demo-ribbon">{tr("demo")}</div>}
      <header className="status-rail">
        <button className="brand" onClick={() => go("hall")} aria-label={tr("mainHall")}>
          <span className="brand-mark"><KeyRound size={17} /></span>
          <span>{tr("appName")}</span>
        </button>
        <div className="rail-status" aria-live="polite">
          <StatusPill tone={chain === "MAIN" ? "warn" : "quiet"}>{chain}</StatusPill>
          <StatusPill tone={core.connected || isDemo ? "ok" : "warn"}>
            <span className="signal-dot" /> {core.connected ? tr("connected") : isDemo ? tr("demoMode") : tr("disconnected")}
          </StatusPill>
          <StatusPill tone={core.networkActive ? "ok" : "warn"}>
            {core.networkActive ? tr("networkOn") : tr("networkOff")}
          </StatusPill>
        </div>
        <div className="rail-actions">
          <button
            className="icon-button"
            onClick={() => updatePreferences({ muted: !preferences.muted })}
            aria-label={preferences.muted ? "Unmute" : "Mute"}
            title={preferences.muted ? "Unmute" : "Mute"}
          >
            {preferences.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label={tr("settings")} title={tr("settings")}>
            <Settings size={18} />
          </button>
        </div>
      </header>

      <nav className="accessible-nav" aria-label="Rooms">
        {sceneMeta.map(({ id, label }) => (
          <button key={id} onClick={() => go(id)} aria-current={scene === id ? "page" : undefined}>{tr(label)}</button>
        ))}
      </nav>

      {scene !== "hall" && (
        <button className="back-hall" onClick={() => go("hall")}>
          <ArrowLeft size={16} /> {tr("back")}
        </button>
      )}

      <main id="scene-main" className="scene-stage">
        <div className="sky-glow" aria-hidden="true" />
        <div className="sea-line" aria-hidden="true" />
        {scene === "hall" && (
          <WorldScene scene="hall" eyebrow="LOCAL BITCOIN OPERATIONS" title={tr("mainHall")} description={tr("welcomeBody")}>
            {!isDemo && !core.supported && <div className="offline-gate" role="status">
              <CircleAlert size={22} />
              <span><strong>{tr("disconnected")}</strong><small>{core.message}</small></span>
              <button className="secondary-action" onClick={() => void connect()} disabled={loading}><RefreshCw size={16} /> {tr("reconnect")}</button>
              <button className="primary-action" onClick={() => { setMode("demo"); setCore(demoSpatialCore); setVaults([demoVaultItem]); setSelectedWallet(demoVaultItem.walletName); setSnapshot(demoSnapshot); }}>{tr("demoMode")}</button>
            </div>}
            <div className="hall-portals" aria-label="Architectural passages">
              <ArtifactButton kind="portal" title={tr("workshop")} description="Construct and configure" className="portal-workshop" onClick={() => go("workshop")} />
              <ArtifactButton kind="portal" title={tr("archive")} description="Protect and recover" className="portal-archive" onClick={() => go("archive")} />
              <ArtifactButton kind="portal" title={tr("communications")} description="Receive and send" className="portal-communications" onClick={() => go("communications")} />
              <ArtifactButton kind="portal" title={tr("engine")} description="Operate local Core" className="portal-engine" onClick={() => go("engine")} />
              <ArtifactButton kind="portal" title={tr("observatory")} description="Observe the chain" className="portal-observatory" onClick={() => go("observatory")} />
              <ArtifactButton kind="portal" title={tr("library")} description="Understand the system" className="portal-library" onClick={() => go("library")} />
            </div>
            <div className="hall-vault-gallery" aria-label="Vault chambers">
              {vaults.length === 0 ? (
                <ArtifactButton kind="empty" title={tr("noVault")} description={tr("createVault")} onClick={() => go("workshop")} />
              ) : vaults.map((item) => (
                <ArtifactButton key={item.walletName} kind="vault" title={item.displayName} description={item.vaultType} status={formatSats(item.balanceSats)} onClick={() => void loadVault(item.walletName)} />
              ))}
            </div>
          </WorldScene>
        )}

        {scene === "workshop" && (
          <WorldScene scene="workshop" eyebrow="DESCRIPTOR WALLET FOUNDRY" title={tr("workshop")} description="Choose the physical policy first. Precise wallet controls appear only at the active workbench.">
            <div className="workshop-floor">
              <div className="workbench-monument" aria-hidden="true"><span className="bench-slab" /><span className="bench-energy" /><span className="unfinished-vault"><i /><i /><i /></span></div>
              <div className="workshop-artifacts">
                <ArtifactButton kind="key" title={tr("personal")} description={tr("personalDesc")} status="One encrypted key" onClick={() => setWorkshopStation("personal")} />
                <ArtifactButton kind="keys" title={tr("multisig")} description={tr("multisigDesc")} status="Three keys · two required" onClick={() => setLegacyOpen(true)} />
                <ArtifactButton kind="empty" title="Time-lock module" description="Reserved workbench for a future, separately reviewed policy" status={tr("future")} disabled />
              </div>
            </div>
            {workshopStation === "personal" && <ContextOverlay eyebrow="ACTIVE WORKBENCH · SINGLE SIGNATURE" title={tr("createPersonal")} onClose={() => { clearCreatePassphrases(); setWorkshopStation(null); }}>
                <p>{tr("personalDesc")}</p>
                <form className="form-grid" onSubmit={createPersonal}>
                  <Field label={tr("displayName")}><input ref={displayNameRef} required minLength={2} placeholder="Harbour Vault" autoComplete="off" /></Field>
                  <Field label={tr("walletName")}><input ref={walletNameRef} required pattern="[A-Za-z0-9._-]+" placeholder="harbour_vault" autoComplete="off" /></Field>
                  <Field label={tr("passphrase")} hint={tr("passwordHint")}><input ref={passphraseRef} required minLength={12} type="password" autoComplete="new-password" /></Field>
                  <Field label={tr("confirmPassphrase")}><input ref={confirmRef} required minLength={12} type="password" autoComplete="new-password" /></Field>
                  <button className="primary-action" type="submit" disabled={loading || !mutationsAllowed}><ShieldCheck size={18} /> {tr("createEncrypted")}</button>
                  {!mutationsAllowed && <small className="stop-note">STOP: wallet mutations are available only on Signet, Testnet4, Testnet, or Regtest.</small>}
                </form>
            </ContextOverlay>}
          </WorldScene>
        )}

        {scene === "vault" && (
          <WorldScene scene="vault" eyebrow={tr("selectedVault")} title={snapshot?.vault.displayName ?? tr("vault")} description="A quiet chamber for one wallet identity, its balance, and its local history.">
            {snapshot ? (
              <div className="vault-sanctum">
                <div className="vault-monument" role="img" aria-label={`${snapshot.vault.displayName}, ${formatSats(snapshot.vault.balanceSats)}, ${snapshot.vault.locked ? "locked" : "unlocked"}`}>
                  <div className="vault-monument-shell" aria-hidden="true"><span className="vault-door-ring"><i /><i /><i /><i /></span><span className="vault-seal"><KeyRound /></span><span className="vault-blue-thread" /><span className="vault-gold-thread" /></div>
                  <div className="vault-inscription"><small>{snapshot.vault.network.toUpperCase()} · {tr("balance")}</small><strong>{formatSats(snapshot.vault.balanceSats)}</strong></div>
                  <div className="assurance-row vault-assurance">
                    <StatusPill tone={snapshot.vault.locked ? "ok" : "warn"}>{snapshot.vault.locked ? "Locked" : "Unlocked"}</StatusPill>
                    <StatusPill tone="quiet">Descriptor wallet</StatusPill>
                    <StatusPill tone={snapshot.vault.backupRequired ? "warn" : "ok"}>{snapshot.vault.backupRequired ? "Backup required" : "Backed up"}</StatusPill>
                  </div>
                </div>
                <div className="vault-artifact-actions">
                  <ArtifactButton kind="receive" title={tr("receive")} description="Open an inbound light channel" onClick={() => { go("communications"); window.setTimeout(() => setCommunicationStation("receive"), 0); }} />
                  <ArtifactButton kind="send" title={tr("send")} description="Prepare a reviewed PSBT proposal" onClick={() => { go("communications"); window.setTimeout(() => setCommunicationStation("send"), 0); }} />
                  <ArtifactButton kind="capsule" title={tr("backup")} description="Enter the recovery archive" onClick={() => go("archive")} />
                </div>
                <RecessedLedger title={tr("activity")} className="vault-activity-ledger">
                  <div className="activity-list">
                    {snapshot.activity.length === 0 ? <p>{tr("noActivity")}</p> : snapshot.activity.map((item) => (
                      <div className="activity-item" key={`${item.txid}-${item.category}`}>
                        <span className={`activity-icon ${item.amountSats >= 0 ? "in" : "out"}`}>{item.amountSats >= 0 ? "↓" : "↑"}</span>
                        <span><strong>{item.label || item.category}</strong><small>{shorten(item.txid)} · {item.confirmations} confirmations</small></span>
                        <b>{item.amountSats >= 0 ? "+" : ""}{formatSats(item.amountSats)}</b>
                      </div>
                    ))}
                  </div>
                </RecessedLedger>
                <details className="technical-card" onToggle={(event) => { if (!event.currentTarget.open) clearChangePassphrases(); }}><summary>{tr("technical")}</summary><dl><dt>Core wallet</dt><dd>{snapshot.vault.walletName}</dd><dt>Public fingerprint</dt><dd>{snapshot.vault.publicFingerprint}</dd><dt>Private keys</dt><dd>{snapshot.vault.privateKeysEnabled ? "Enabled, encrypted" : "Watch-only"}</dd></dl>{snapshot.vault.privateKeysEnabled && <form className="technical-form" onSubmit={changePassphrase}><h3>Change wallet passphrase</h3><div className="technical-fields"><Field label="Current passphrase"><input ref={oldPassphraseRef} type="password" autoComplete="current-password" required /></Field><Field label="New passphrase"><input ref={newPassphraseRef} type="password" autoComplete="new-password" minLength={12} required /></Field><Field label="Confirm new passphrase"><input ref={newPassphraseConfirmRef} type="password" autoComplete="new-password" minLength={12} required /></Field></div><button className="secondary-action" type="submit" disabled={loading}>Change passphrase locally</button>{passphraseChanged && <small className="inline-success"><Check size={14} /> Passphrase changed; fields cleared.</small>}</form>}</details>
              </div>
            ) : <EmptyVault tr={tr} go={go} />}
          </WorldScene>
        )}

        {scene === "archive" && (
          <WorldScene scene="archive" eyebrow="RECOVERY BEFORE FUNDS" title={tr("archive")} description="Back up first, then prove that the copy can restore the same public wallet identity.">
            <div className="archive-vault-wall">
              <div className="archive-niches" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <ArtifactButton kind="capsule" title={backup ? "Sealed backup capsule" : "Empty backup niche"} description={backup ? `${formatBytes(backup.sizeBytes)} verified locally` : "Create the first verified wallet backup"} status={backup ? new Date(backup.createdAtUnix * 1000).toLocaleString() : "Awaiting backup"} onClick={() => setArchiveStation("backup")} />
              <ArtifactButton kind="verification" title="Descriptor verification station" description="Restore a separate copy and compare its public fingerprint" status={restore?.fingerprintsMatch ? "Identity verified" : "Ready for restore test"} onClick={() => setArchiveStation("restore")} />
              <div className="archive-guardian"><ShieldCheck /><p>Wallet files never pass through the renderer. Bitcoin Core writes and restores them locally.</p></div>
            </div>
            {archiveStation === "backup" && <ContextOverlay eyebrow="ARCHIVE NICHE · BACKUP" title={tr("backupNow")} onClose={() => setArchiveStation(null)}>
                <p>Bitcoin Core writes an atomic wallet backup to the path you choose. Core Vault verifies that the file exists and records its local SHA-256 digest.</p>
                <button className="primary-action" onClick={createBackup} disabled={!selectedWallet || loading}><Archive size={18} /> {tr("backupNow")}</button>
                {backup && <div className="receipt success"><Check size={20} /><span><strong>{formatBytes(backup.sizeBytes)} backup verified</strong><small>{shorten(backup.sha256, 16)}</small></span></div>}
            </ContextOverlay>}
            {archiveStation === "restore" && <ContextOverlay eyebrow="ARCHIVE STATION · RESTORE PROOF" title={tr("restoreTest")} onClose={() => setArchiveStation(null)}>
                <p>The restored copy remains a separate wallet. Matching fingerprints compare public descriptors, not secret material.</p>
                <Field label={tr("restoredName")}><input ref={restoredNameRef} defaultValue={`${selectedWallet ?? "vault"}_restore_test`} /></Field>
                <button className="secondary-action" onClick={testRestore} disabled={!selectedWallet || loading}><RefreshCw size={17} /> {tr("chooseBackup")}</button>
                {restore && <><div className={`receipt ${restore.fingerprintsMatch ? "success" : "danger"}`}>{restore.fingerprintsMatch ? <Check size={20} /> : <CircleAlert size={20} />}<span><strong>{restore.fingerprintsMatch ? "Public fingerprint matches" : "Fingerprint mismatch. STOP"}</strong><small>{restore.restoredWalletName}</small></span></div><button className="text-action" onClick={unloadRestored}>{tr("unload")}</button></>}
            </ContextOverlay>}
          </WorldScene>
        )}

        {scene === "communications" && (
          <WorldScene scene="communications" eyebrow="ADDRESSES & PSBT PROPOSALS" title={tr("communications")} description="Two controlled light channels connect this vault to the Bitcoin network: one inward, one outward.">
            <div className="communications-conduits">
              <div className="signal-bridge" aria-hidden="true"><span className="signal-line inbound" /><span className="signal-node" /><span className="signal-line outbound" /></div>
              <ArtifactButton kind="receive" title={tr("receive")} description="Open a fresh wallet-owned bech32m channel" status={receive ? shorten(receive.address, 8) : "Inbound channel idle"} onClick={() => setCommunicationStation("receive")} />
              <ArtifactButton kind="send" title={tr("send")} description="Construct and inspect a local PSBT proposal" status={broadcast ? "Last proposal broadcast" : spend ? spend.state : "Outbound channel idle"} onClick={() => setCommunicationStation("send")} />
            </div>
            {communicationStation === "receive" && <ContextOverlay eyebrow="INBOUND LIGHT CHANNEL" title={tr("receive")} onClose={() => setCommunicationStation(null)} className="receive-console">
                <Field label={tr("addressLabel")}><input ref={receiveLabelRef} defaultValue="Test payment" /></Field>
                <button className="primary-action" onClick={generateReceive} disabled={!selectedWallet || loading}><Radio size={17} /> {tr("generateAddress")}</button>
                {receive && <div className="receive-card">
                  {qrUrl && <img src={qrUrl} alt={`QR code for ${receive.address}`} />}
                  <code>{receive.address}</code>
                  <div className="assurance-row"><StatusPill tone="ok">Wallet owned</StatusPill><StatusPill tone="quiet">{receive.addressType}</StatusPill><StatusPill tone="quiet">{receive.network}</StatusPill></div>
                  <button className="secondary-action" onClick={() => void navigator.clipboard.writeText(receive.address).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1400); })}><Copy size={16} /> {copied ? tr("copied") : tr("copy")}</button>
                </div>}
            </ContextOverlay>}
            {communicationStation === "send" && <ContextOverlay eyebrow="OUTBOUND CHANNEL · PSBT FIRST" title={tr("send")} onClose={() => { clearSigningPassphrase(); setCommunicationStation(null); }} className="send-console">
                {!spend && !broadcast && <form className="form-grid" onSubmit={createSpend}>
                  <Field label={tr("destination")}><input ref={destinationRef} required placeholder="tb1…" autoComplete="off" /></Field>
                  <div className="split-fields"><Field label={tr("amountSats")}><input ref={amountRef} required type="number" min={1} step={1} defaultValue={25000} /></Field><Field label={tr("feeRate")}><input ref={feeRef} required type="number" min={0.1} step={0.1} defaultValue={2} /></Field></div>
                  <button className="primary-action" disabled={!selectedWallet || loading} type="submit"><Send size={17} /> {tr("createProposal")}</button>
                </form>}
                {spend && !broadcast && <SpendReview spend={spend} tr={tr} passphraseRef={signPassphraseRef} loading={loading} confirmed={broadcastConfirmed} setConfirmed={setBroadcastConfirmed} onSign={signSpend} onFinalize={finalizeSpend} onPreflight={retryPreflight} onBroadcast={broadcastSpend} onCancel={() => { clearSigningPassphrase(); setSpend(null); setBroadcastConfirmed(false); }} core={core} />}
                {broadcast && <div className="broadcast-result"><ShieldCheck size={34} /><h3>Transaction broadcast</h3><code>{broadcast.txid}</code><p>{formatSats(broadcast.sentSats)} + {formatSats(broadcast.feeSats)} fee</p><button className="secondary-action" onClick={() => { setSpend(null); setBroadcast(null); setBroadcastConfirmed(false); }}>New proposal</button></div>}
            </ContextOverlay>}
          </WorldScene>
        )}

        {scene === "engine" && (
          <WorldScene scene="engine" eyebrow="LOCAL NODE ENGINE" title={tr("engine")} description={tr("networkTruth")}>
            <div className="engine-chamber">
              <EnergyCore active={core.networkActive} progress={core.verificationProgress * 100} label={core.networkActive ? tr("networkOn") : tr("networkOff")} detail={coreState.replaceAll("-", " ")} />
              <div className="engine-conduit-rack" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
              <div className="engine-instruments">
                <Metric label={tr("sync")} value={`${(core.verificationProgress * 100).toFixed(2)}%`} detail={core.initialBlockDownload ? "Initial block download" : "Current"} />
                <Metric label={tr("peers")} value={String(core.connections)} detail={core.networkActive ? "P2P enabled" : "P2P disabled"} />
                <Metric label={tr("blocks")} value={`${core.blocks.toLocaleString()} / ${core.headers.toLocaleString()}`} detail={core.pruned ? "Pruned" : "Full chain data"} />
                <Metric label={tr("mempool")} value={`${core.mempoolSize.toLocaleString()} tx`} detail={formatBytes(core.mempoolBytes)} />
                <Metric label={tr("disk")} value={formatBytes(core.sizeOnDisk)} detail="Reported by Bitcoin Core" />
                <Metric label="Core version" value={core.versionLabel ?? "Unknown"} detail={core.subversion ?? ""} />
              </div>
              <div className="engine-control-plinth">
                <span><strong>{core.networkActive ? "Peer conduits flowing" : "Peer conduits still"}</strong><small>{tr("networkTruth")}</small></span>
                <button className={core.networkActive ? "danger-action" : "primary-action"} onClick={toggleNetwork} disabled={loading || (!core.supported && !isDemo)}>{core.networkActive ? tr("disableNetwork") : tr("enableNetwork")}</button>
              </div>
            </div>
          </WorldScene>
        )}

        {scene === "observatory" && (
          <WorldScene scene="observatory" eyebrow="VERIFY, DO NOT GUESS" title={tr("observatory")} description="A calm horizon for local blocks, mempool movement, and authenticated RPC evidence.">
            <div className="observatory-terrace">
              <ObservationBasin blocks={core.blocks} mempool={core.mempoolSize} progress={core.verificationProgress} />
              <div className="observatory-inscriptions">
                <RecessedLedger title="Chain horizon"><dl><dt>Chain</dt><dd>{chain}</dd><dt>Latest block</dt><dd>{core.blocks.toLocaleString()}</dd><dt>Headers</dt><dd>{core.headers.toLocaleString()}</dd><dt>Last block time</dt><dd>{core.lastBlockTime ? new Date(core.lastBlockTime * 1000).toLocaleString() : "Unknown"}</dd></dl></RecessedLedger>
                <RecessedLedger title="Wallet horizon"><dl><dt>Loaded wallets</dt><dd>{core.loadedWallets.length}</dd><dt>Selected wallet</dt><dd>{selectedWallet ?? "None"}</dd><dt>Wallet RPC</dt><dd>{core.walletRpcAvailable ? "Available" : "Unavailable"}</dd><dt>Mode</dt><dd>{isDemo ? "Local demonstration" : "Local Bitcoin Core"}</dd></dl></RecessedLedger>
              </div>
              <RecessedLedger title={tr("rpcTrace")} className="rpc-observation-ledger"><div className="rpc-list">{rpc.length === 0 ? <p>No RPC calls recorded in this session.</p> : rpc.slice(0, 8).map((trace, index) => <div key={`${trace.timestampMs}-${index}`}><code>{trace.method}</code><span>{trace.durationMs} ms</span><small>{trace.explanation}</small></div>)}</div></RecessedLedger>
            </div>
          </WorldScene>
        )}

        {scene === "library" && (
          <WorldScene scene="library" eyebrow="PRIMARY SOURCES & LIMITS" title={tr("library")} description="Knowledge lives in illuminated stone niches. Open only the tablet you need.">
            <div className="library-nave">
              <div className="library-wall" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <ArtifactButton kind="stele" title={tr("about")} description="Independence, privacy, and experimental status" onClick={() => setLibraryTopic("about")} />
              <ArtifactButton kind="stele" title={tr("docs")} description="Bitcoin Core and Bitcoin Design primary sources" onClick={() => setLibraryTopic("reference")} />
              <ArtifactButton kind="stele" title="Boundaries" description="What this prototype intentionally does not claim" onClick={() => setLibraryTopic("limits")} />
            </div>
            {libraryTopic === "about" && <ContextOverlay eyebrow="FOUNDATION TABLET" title={tr("about")} onClose={() => setLibraryTopic(null)}><p className="independent-notice">{tr("independent")}</p><p>{tr("testOnly")}</p><p>{tr("privacy")}</p></ContextOverlay>}
            {libraryTopic === "reference" && <ContextOverlay eyebrow="PRIMARY SOURCE TABLET" title={tr("docs")} onClose={() => setLibraryTopic(null)}><ul className="reference-list"><li><a href="https://bitcoincore.org/en/doc/31.0.0/" target="_blank" rel="noreferrer">Bitcoin Core RPC documentation</a></li><li><a href="https://bitcoin.design/guide/" target="_blank" rel="noreferrer">Bitcoin Design Guide</a></li><li><span>Personal vault lifecycle</span><small>Create → encrypt → backup → restore-test → receive → PSBT review</small></li><li><span>Shared vault lifecycle</span><small>Three signers → public coordinator → two signatures → broadcast</small></li></ul></ContextOverlay>}
            {libraryTopic === "limits" && <ContextOverlay eyebrow="BOUNDARY TABLET" title="What this prototype is not" onClose={() => setLibraryTopic(null)}><ul className="plain-list"><li>Not production-ready wallet software</li><li>No hardware-wallet integration</li><li>No mainnet wallet mutations</li><li>No cloud backup, analytics, or remote RPC</li><li>No claim that disabled P2P networking creates an air gap</li></ul></ContextOverlay>}
          </WorldScene>
        )}
      </main>

      {error && <div className="error-toast" role="alert"><CircleAlert size={20} /><span><strong>{tr("error")}</strong>{error}</span><button onClick={() => setError("")} aria-label={tr("close")}><X size={18} /></button></div>}
      {loading && <div className="busy-indicator" role="status"><RefreshCw size={17} /> Working with local Core…</div>}

      {settingsOpen && <SettingsDialog preferences={preferences} update={updatePreferences} close={() => setSettingsOpen(false)} replay={() => { setSettingsOpen(false); setOnboardingStep(0); }} tr={tr} />}
      {onboardingStep >= 0 && <Walkthrough step={onboardingStep} setStep={setOnboardingStep} finish={finishWalkthrough} preferences={preferences} update={updatePreferences} tr={tr} />}

      <footer className="prototype-footer">{tr("testOnly")}</footer>
    </div>
  );
}

function RoomHotspot({ icon: Icon, label, hint, className, onClick }: { icon: typeof Archive; label: string; hint: string; className: string; onClick: () => void }) {
  return <button className={`room-hotspot ${className}`} onClick={onClick}><span><Icon size={19} /></span><strong>{label}</strong><small>{hint}</small></button>;
}

function EmptyVault({ tr, go }: { tr: (key: CopyKey) => string; go: (scene: SceneId) => void }) {
  return <Panel title={tr("noVault")}><p>Connect a supported test network and create an encrypted Personal Vault in the Workshop.</p><button className="primary-action" onClick={() => go("workshop")}>{tr("createVault")}</button></Panel>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}

function SpendReview({ spend, tr, passphraseRef, loading, confirmed, setConfirmed, onSign, onFinalize, onPreflight, onBroadcast, onCancel, core }: {
  spend: PersonalSpendView;
  tr: (key: CopyKey) => string;
  passphraseRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
  confirmed: boolean;
  setConfirmed: (value: boolean) => void;
  onSign: () => void;
  onFinalize: () => void;
  onPreflight: () => void;
  onBroadcast: () => void;
  onCancel: () => void;
  core: CoreStatus;
}) {
  const ready = spend.state === "ready-to-broadcast" && spend.mempoolPreflight.state === "accepted";
  const preflightBlocked = spend.state === "preflight-required";
  const preflightMessage = spend.mempoolPreflight.state === "rejected"
    ? `Bitcoin Core would not accept this transaction into its mempool${spend.mempoolPreflight.reason ? `: ${spend.mempoolPreflight.reason}` : "."}`
    : spend.mempoolPreflight.state === "indeterminate"
      ? "Core Vault could not verify that Bitcoin Core would accept this transaction. Broadcast is disabled until preflight succeeds."
      : "Mempool preflight has not succeeded. Broadcast remains disabled.";
  return <div className="spend-review">
    <div className="review-header"><span className="step-number">1</span><span><small>{tr("review")}</small><strong>{formatSats(spend.amountSats)} to {shorten(spend.destination, 14)}</strong></span><StatusPill tone="quiet">{spend.network.toUpperCase()}</StatusPill></div>
    <dl className="review-ledger"><dt>Destination</dt><dd><code>{spend.destination}</code></dd><dt>Amount</dt><dd>{formatSats(spend.amountSats)}</dd><dt>Network fee</dt><dd>{formatSats(spend.feeSats)} · {spend.feeRateSatVb} sat/vB</dd><dt>Total debit</dt><dd><strong>{formatSats(spend.totalDebitSats)}</strong></dd><dt>Change outputs</dt><dd>{spend.outputs.filter((output) => output.isChange).length}</dd><dt>Replaceable</dt><dd>{spend.replaceable ? "Yes (RBF)" : "No"}</dd></dl>
    {spend.state === "awaiting-review" && <div className="sign-box"><span className="step-number">2</span><Field label={tr("passphrase")}><input ref={passphraseRef} type="password" autoComplete="current-password" /></Field><button className="primary-action" onClick={onSign} disabled={loading}>{tr("sign")}</button><small>Bitcoin Core unlocks only briefly; Core Vault calls walletlock immediately afterward, including on error.</small></div>}
    {spend.state === "threshold-reached" && <button className="primary-action" onClick={onFinalize} disabled={loading}><ShieldCheck size={17} /> {tr("finalize")}</button>}
    {preflightBlocked && <div className="broadcast-gate"><CircleAlert size={24} /><div><strong>Mempool preflight required</strong><p>{preflightMessage}</p><button className="secondary-action" onClick={onPreflight} disabled={loading}>Retry mempool preflight</button></div></div>}
    {ready && <div className="broadcast-gate"><CircleAlert size={24} /><div><strong>{tr("broadcastWarning")}</strong><p>Bitcoin Core explicitly accepted this transaction for its mempool. Network: {spend.network.toUpperCase()}.</p><label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> {tr("confirmBroadcast")}</label><button className="danger-action" onClick={onBroadcast} disabled={!confirmed || !core.networkActive || loading || spend.mempoolPreflight.state !== "accepted"}>{tr("broadcast")}</button>{!core.networkActive && <small>Enable Bitcoin Core P2P networking in the Engine Room before broadcast.</small>}</div></div>}
    <button className="text-action" onClick={onCancel}>Discard this in-memory proposal</button>
  </div>;
}

function SettingsDialog({ preferences, update, close, replay, tr }: { preferences: Preferences; update: (patch: Partial<Preferences>) => void; close: () => void; replay: () => void; tr: (key: CopyKey) => string }) {
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><div><p className="eyebrow">INTERFACE</p><h2 id="settings-title">{tr("settings")}</h2></div><button className="icon-button" onClick={close} aria-label={tr("close")}><X size={19} /></button></header><div className="settings-list"><label><span>{tr("reducedMotion")}</span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /></label><label><span>{tr("ambientSound")}</span><input type="checkbox" checked={preferences.ambientSound} onChange={(event) => update({ ambientSound: event.target.checked, soundChoiceMade: true, muted: event.target.checked ? false : preferences.muted })} /></label><label><span>{tr("interactionSound")}</span><input type="checkbox" checked={preferences.interactionSound} onChange={(event) => update({ interactionSound: event.target.checked, soundChoiceMade: true, muted: event.target.checked ? false : preferences.muted })} /></label><label className="volume-setting"><span>{tr("volume")}</span><input type="range" min="0" max="1" step="0.01" value={preferences.volume} onChange={(event) => update({ volume: Number(event.target.value) })} /></label></div><button className="secondary-action" onClick={replay}>{tr("replay")}</button></section></div>;
}

function Walkthrough({ step, setStep, finish, preferences, update, tr }: { step: number; setStep: (step: number) => void; finish: () => void; preferences: Preferences; update: (patch: Partial<Preferences>) => void; tr: (key: CopyKey) => string }) {
  const slides = [
    { icon: Landmark, title: tr("welcome"), body: tr("welcomeBody") },
    { icon: ShieldCheck, title: "Your Core remains the source of truth", body: "Core Vault reads node, wallet, and mempool state from local authenticated RPC. It does not invent a second wallet database." },
    { icon: Radio, title: "Review before action", body: "Receive addresses are verified as wallet-owned. Sends remain PSBT proposals until you sign, finalize, test, and separately confirm broadcast." },
  ];
  if (step >= slides.length) {
    return <div className="modal-layer onboarding-layer"><section className="walkthrough" role="dialog" aria-modal="true" aria-labelledby="sound-title"><span className="walk-icon"><Volume2 /></span><p className="eyebrow">OPTIONAL</p><h2 id="sound-title">{tr("soundQuestion")}</h2><p>{tr("soundBody")}</p><div className="walk-actions"><button className="secondary-action" onClick={() => { update({ soundChoiceMade: true, muted: true, ambientSound: false, interactionSound: false }); finish(); }}>{tr("keepMuted")}</button><button className="primary-action" onClick={() => { update({ soundChoiceMade: true, muted: false, interactionSound: true }); playInteraction(preferences.volume); finish(); }}>{tr("enableSound")}</button></div></section></div>;
  }
  const slide = slides[step];
  const Icon = slide.icon;
  return <div className="modal-layer onboarding-layer"><section className="walkthrough" role="dialog" aria-modal="true" aria-labelledby="walk-title"><div className="walk-progress" aria-label={`Step ${step + 1} of ${slides.length}`}>{slides.map((_, index) => <i key={index} className={index <= step ? "active" : ""} />)}</div><span className="walk-icon"><Icon /></span><p className="eyebrow">CORE VAULT · {step + 1}/{slides.length}</p><h2 id="walk-title">{slide.title}</h2><p>{slide.body}</p><div className="walk-actions"><button className="text-action" onClick={finish}>{tr("skip")}</button><button className="primary-action" onClick={() => setStep(step + 1)}>{step === slides.length - 1 ? tr("done") : tr("next")} <ChevronRight size={17} /></button></div></section></div>;
}
