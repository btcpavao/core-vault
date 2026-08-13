import type { ReactNode } from "react";
import { X } from "lucide-react";

export type ArtifactKind =
  | "portal"
  | "vault"
  | "key"
  | "keys"
  | "capsule"
  | "verification"
  | "receive"
  | "send"
  | "engine"
  | "lens"
  | "stele"
  | "empty";

export function WorldScene({
  scene,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  scene: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = `${scene}-title`;
  return (
    <section className={`room world-scene world-${scene} ${className}`} aria-labelledby={titleId}>
      <div className="world-architecture" aria-hidden="true">
        <span className="world-ceiling" />
        <span className="world-column column-left" />
        <span className="world-column column-right" />
        <span className="world-arch arch-left" />
        <span className="world-arch arch-right" />
        <span className="sun-shaft shaft-one" />
        <span className="sun-shaft shaft-two" />
        <span className="dust-field">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
      </div>
      <header className="world-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      <div className="world-content">{children}</div>
    </section>
  );
}

export function ArtifactButton({
  kind,
  title,
  description,
  status,
  onClick,
  disabled = false,
  className = "",
}: {
  kind: ArtifactKind;
  title: string;
  description: string;
  status?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`artifact-button artifact-${kind} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${title}. ${description}`}
    >
      <span className="artifact-stage" aria-hidden="true">
        <span className="artifact-object">
          <i className="artifact-shell" />
          <i className="artifact-glass" />
          <i className="artifact-energy energy-blue" />
          <i className="artifact-energy energy-gold" />
          <i className="artifact-detail detail-one" />
          <i className="artifact-detail detail-two" />
          <i className="artifact-shadow" />
        </span>
      </span>
      <span className="artifact-label">
        <strong>{title}</strong>
        <small>{description}</small>
        {status && <em>{status}</em>}
      </span>
    </button>
  );
}

export function ContextOverlay({
  eyebrow,
  title,
  onClose,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`context-overlay ${className}`}>
      <section className="context-console" role="dialog" aria-modal="false" aria-label={title}>
        <header>
          <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
          <button className="console-close" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button>
        </header>
        <div className="context-console-body">{children}</div>
      </section>
    </div>
  );
}

export function EnergyCore({
  active,
  progress,
  label,
  detail,
}: {
  active: boolean;
  progress: number;
  label: string;
  detail: string;
}) {
  return (
    <div className={`energy-core ${active ? "is-active" : "is-idle"}`} aria-label={`${label}. ${detail}`} role="img">
      <div className="core-canopy" aria-hidden="true"><i /><i /><i /></div>
      <div className="core-chamber" aria-hidden="true">
        <span className="core-helix helix-blue" />
        <span className="core-helix helix-gold" />
        <span className="core-heart" />
        <span className="core-rings"><i /><i /><i /></span>
      </div>
      <div className="core-plinth"><strong>{label}</strong><small>{detail}</small><span>{Math.min(100, Math.max(0, progress)).toFixed(2)}%</span></div>
    </div>
  );
}

export function ObservationBasin({ blocks, mempool, progress }: { blocks: number; mempool: number; progress: number }) {
  const pulses = Array.from({ length: 10 }, (_, index) => index);
  return (
    <div className="observation-basin" role="img" aria-label={`${blocks} blocks, ${mempool} mempool transactions, ${(progress * 100).toFixed(2)} percent verified`}>
      <div className="basin-sky" aria-hidden="true">{pulses.map((pulse) => <i key={pulse} style={{ "--pulse": pulse } as React.CSSProperties} />)}</div>
      <div className="basin-rim" aria-hidden="true"><span /><span /><span /></div>
      <div className="basin-inscription"><strong>{blocks.toLocaleString()}</strong><small>local chain height</small></div>
    </div>
  );
}

export function RecessedLedger({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`recessed-ledger ${className}`}><h2>{title}</h2><div>{children}</div></section>;
}
