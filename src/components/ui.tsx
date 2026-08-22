import type { ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Eye,
  FileSearch,
  KeyRound,
  LockKeyhole,
  Radio,
  Server,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import type { PhaseId, RpcTrace } from "../types";

export const phaseMeta: Array<{ id: PhaseId; label: string }> = [
  { id: "core", label: "Bitcoin Core" },
  { id: "signers", label: "Signing wallets" },
  { id: "vault", label: "Multisig vault" },
  { id: "backup", label: "Backup check" },
  { id: "receive", label: "Receive test" },
  { id: "spend", label: "Spending test" },
];

export function AppMark() {
  return (
    <span className="app-mark" aria-hidden="true">
      <ShieldCheck size={20} />
    </span>
  );
}

export function StatusBadge({ connected, label }: { connected: boolean; label: string }) {
  return (
    <span className={`status-badge ${connected ? "is-good" : "is-muted"}`}>
      {connected ? <CheckCircle2 size={15} /> : <WifiOff size={15} />}
      {label}
    </span>
  );
}

export function PhaseSidebar({ current, completed }: { current: PhaseId; completed: Set<PhaseId> }) {
  const currentIndex = phaseMeta.findIndex((phase) => phase.id === current);
  return (
    <aside className="phase-sidebar" aria-label="Vault setup progress">
      <div className="sidebar-brand">
        <AppMark />
        <div>
          <strong>Core Vault</strong>
          <span>Signet prototype</span>
        </div>
      </div>
      <ol className="phase-list">
        {phaseMeta.map((phase, index) => {
          const done = completed.has(phase.id);
          const active = phase.id === current;
          return (
            <li className={active ? "is-active" : done ? "is-complete" : ""} key={phase.id} aria-current={active ? "step" : undefined}>
              <span className="phase-marker" aria-hidden="true">
                {done ? <Check size={14} /> : <span>{index + 1}</span>}
              </span>
              <span>{phase.label}</span>
              {active && <small>Current</small>}
              {!active && index < currentIndex && !done && <small>Pending</small>}
            </li>
          );
        })}
      </ol>
      <div className="sidebar-security">
        <LockKeyhole size={18} aria-hidden="true" />
        <p><strong>Local only</strong>Keys stay in Bitcoin Core.</p>
      </div>
    </aside>
  );
}

export function SecurityNotice({
  level = "info",
  title,
  children,
}: {
  level?: "info" | "warning" | "danger" | "success";
  title: string;
  children: ReactNode;
}) {
  const Icon = level === "danger" || level === "warning" ? AlertTriangle : level === "success" ? CheckCircle2 : ShieldCheck;
  return (
    <div className={`security-notice is-${level}`} role={level === "danger" ? "alert" : "note"}>
      <Icon size={20} aria-hidden="true" />
      <div><strong>{title}</strong><div>{children}</div></div>
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const blocking = message.includes("STOP") || message.includes("Bitcoin Signet only");
  return (
    <SecurityNotice level={blocking ? "danger" : "warning"} title={blocking ? "Security check stopped this step" : "This step was not completed"}>
      <p>{message}</p>
      <p>{message.toLowerCase().includes("not broadcast") ? "The transaction was not broadcast." : "Existing wallets and funds were not changed by this failed step."}</p>
      {onRetry && <button className="button button-quiet inline-action" onClick={onRetry}>Try again</button>}
    </SecurityNotice>
  );
}

export function VaultDiagram({ signedBy = [] }: { signedBy?: string[] }) {
  return (
    <div className="vault-diagram" role="img" aria-label={`Three signing wallets protect a 2 of 3 vault. ${signedBy.length} signatures collected.`}>
      <div className="signer-stack">
        {["K1", "K2", "K3"].map((label) => {
          const signed = signedBy.includes(`CoreVault-${label}`) || signedBy.includes(label);
          return (
            <div className={`diagram-signer ${signed ? "is-signed" : ""}`} key={label}>
              {signed ? <Check size={16} /> : <KeyRound size={16} />}
              <span>{label}</span>
              <small>{signed ? "Signed" : "Signing key"}</small>
            </div>
          );
        })}
      </div>
      <div className="diagram-connector" aria-hidden="true"><span /><span /><span /></div>
      <div className="policy-node"><strong>2 of 3</strong><span>Vault policy</span></div>
      <div className="diagram-arrow" aria-hidden="true" />
      <div className="vault-node"><ShieldCheck size={24} /><strong>Vault</strong><span>{signedBy.length >= 2 ? "Spend allowed" : "Protected"}</span></div>
    </div>
  );
}

export function TrustFacts({ connected, network, demo = false }: { connected: boolean; network?: string | null; demo?: boolean }) {
  const facts = [
    { icon: demo ? WifiOff : connected ? CheckCircle2 : WifiOff, label: "Bitcoin Core", value: demo ? "Not connected · demo data" : connected ? "Connected locally" : "Not connected" },
    { icon: Radio, label: "Network", value: demo ? "Simulated Signet" : network === "signet" ? "Signet" : network ?? "Unknown" },
    { icon: Server, label: "Remote servers", value: "None" },
    { icon: Eye, label: "Telemetry", value: "Off" },
    { icon: KeyRound, label: "Private keys", value: "Handled by Bitcoin Core" },
  ];
  return (
    <dl className="trust-facts">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label}><dt><Icon size={17} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}

export function RpcPanel({ traces }: { traces: RpcTrace[] }) {
  if (!traces.length) return null;
  return (
    <details className="rpc-panel">
      <summary><FileSearch size={18} aria-hidden="true" /><span>Show what Bitcoin Core is doing</span><ChevronDown size={17} className="summary-chevron" aria-hidden="true" /></summary>
      <div className="rpc-list">
        {traces.slice(-8).map((trace, index) => (
          <article className="rpc-entry" key={`${trace.method}-${index}`}>
            <div className="rpc-entry-head"><code>{trace.method}</code><span>{new Date(trace.timestampMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {trace.durationMs} ms</span></div>
            <p>{trace.explanation}</p>
            {trace.wallet && <div className="rpc-scope"><span>Wallet</span><code>{trace.wallet}</code></div>}
            <details>
              <summary>Arguments & result</summary>
              <div className="rpc-code-grid">
                <div><span>Arguments</span><pre>{JSON.stringify(trace.arguments, null, 2)}</pre></div>
                <div><span>Result</span><pre>{JSON.stringify(trace.result, null, 2)}</pre></div>
              </div>
            </details>
          </article>
        ))}
      </div>
    </details>
  );
}

export function StepHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="step-header"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><div className="step-lede">{children}</div></header>;
}

export function CheckRow({ done, children }: { done: boolean; children: ReactNode }) {
  return <li className={done ? "is-done" : ""}>{done ? <CheckCircle2 size={18} /> : <Circle size={18} />}<span>{children}</span></li>;
}
