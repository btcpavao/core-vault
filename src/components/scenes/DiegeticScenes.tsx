import type { CSSProperties, ReactNode } from "react";

export type WorkshopBuildState = "empty" | "vault-placed" | "key-seated" | "forging" | "complete";

export function SceneShell({
  scene,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  scene: "hall" | "workshop" | "engine";
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = `${scene}-scene-title`;
  const descriptionId = `${scene}-scene-description`;

  return (
    <section
      className={`diegetic-scene diegetic-${scene} ${className}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <h1 id={titleId} className="sr-only">{title}</h1>
      <p id={descriptionId} className="sr-only">{description}</p>

      <div className="scene-depth" aria-hidden="true">
        <div className="scene-layer layer-sky"><i className="ambient-cloud cloud-one" /><i className="ambient-cloud cloud-two" /></div>
        <div className="scene-layer layer-sea"><i /><i /><i /></div>
        <div className="scene-layer layer-distant" />
        <div className="scene-layer layer-architecture" />
        <div className="scene-layer layer-light"><i className="light-sweep" /></div>
        <div className="scene-layer layer-dust">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
        <div className="scene-layer layer-foreground" />
      </div>

      <div className="scene-room-mark" aria-hidden="true">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div className="scene-interaction-layer">{children}</div>
    </section>
  );
}

export function HallPortal({
  room,
  label,
  hint,
  onActivate,
}: {
  room: "workshop" | "archive" | "engine" | "observatory" | "library" | "communications";
  label: string;
  hint: string;
  onActivate: () => void;
}) {
  return (
    <button className={`scene-hotspot hall-portal hall-portal-${room}`} onClick={onActivate} aria-label={`${label}. ${hint}`}>
      <span className="portal-structure" aria-hidden="true">
        <i className="portal-stone portal-outer" />
        <i className="portal-stone portal-inner" />
        <i className="portal-threshold" />
        <i className="portal-depth" />
        <i className="portal-signal" />
      </span>
      <span className="diegetic-callout"><strong>{label}</strong><small>{hint}</small></span>
    </button>
  );
}

export function VaultPedestal({
  label,
  detail,
  balance,
  empty = false,
  onActivate,
}: {
  label: string;
  detail: string;
  balance?: string;
  empty?: boolean;
  onActivate: () => void;
}) {
  return (
    <button className={`scene-hotspot vault-pedestal ${empty ? "is-empty" : "is-occupied"}`} onClick={onActivate} aria-label={`${label}. ${detail}${balance ? `. ${balance}` : ""}`}>
      <span className="vault-object" aria-hidden="true">
        <i className="vault-plinth" />
        <i className="vault-glass" />
        <i className="vault-frame" />
        <i className="vault-heart" />
        <i className="vault-keyline" />
      </span>
      <span className="vault-engraving"><strong>{label}</strong>{balance && <small>{balance}</small>}</span>
    </button>
  );
}

export function WorkshopArtifact({
  kind,
  label,
  hint,
  active = false,
  disabled = false,
  onActivate,
}: {
  kind: "vault" | "key" | "multisig" | "timelock";
  label: string;
  hint: string;
  active?: boolean;
  disabled?: boolean;
  onActivate?: () => void;
}) {
  return (
    <button
      className={`scene-hotspot workshop-artifact workshop-artifact-${kind} ${active ? "is-active" : ""}`}
      disabled={disabled}
      onClick={onActivate}
      aria-label={`${label}. ${hint}`}
    >
      <span className="artifact-pedestal" aria-hidden="true"><i /><i /></span>
      <span className="workshop-object" aria-hidden="true">
        <i className="object-shell" />
        <i className="object-glass" />
        <i className="object-energy" />
        <i className="object-detail detail-a" />
        <i className="object-detail detail-b" />
        <i className="object-detail detail-c" />
      </span>
      <span className="diegetic-callout"><strong>{label}</strong><small>{hint}</small></span>
    </button>
  );
}

export function WorkshopForge({
  state,
  onActivate,
}: {
  state: WorkshopBuildState;
  onActivate: () => void;
}) {
  const copy = {
    empty: ["Empty forge", "Choose a vault frame"],
    "vault-placed": ["Vault frame seated", "Choose one signing key"],
    "key-seated": ["1 key → 1 required", "Seal this construction"],
    forging: ["Core is forging the vault", "Local RPC operation in progress"],
    complete: ["Vault energized", "Continue to the backup archive"],
  }[state];

  return (
    <button
      className={`workshop-forge forge-${state}`}
      onClick={onActivate}
      disabled={state === "empty" || state === "vault-placed" || state === "forging"}
      aria-label={`${copy[0]}. ${copy[1]}`}
    >
      <span className="forge-canopy" aria-hidden="true"><i /><i /><i /></span>
      <span className="forge-chamber" aria-hidden="true">
        <i className="forge-ring ring-outer" />
        <i className="forge-ring ring-inner" />
        <i className="forge-vault-frame" />
        <i className="forge-key-socket" />
        <i className="forge-energy energy-one" />
        <i className="forge-energy energy-two" />
        <i className="forge-flare" />
      </span>
      <span className="forge-slab"><strong>{copy[0]}</strong><small>{copy[1]}</small></span>
    </button>
  );
}

export function CoreReactor({
  connected,
  networkActive,
  syncing,
  progress,
  peers,
  blocks,
  blockPulse,
  onInspectCore,
  onInspectNetwork,
  onToggleNetwork,
  toggleDisabled,
}: {
  connected: boolean;
  networkActive: boolean;
  syncing: boolean;
  progress: number;
  peers: number;
  blocks: number;
  blockPulse: boolean;
  onInspectCore: () => void;
  onInspectNetwork: () => void;
  onToggleNetwork: () => void;
  toggleDisabled: boolean;
}) {
  const style = {
    "--sync-angle": `${Math.max(0, Math.min(1, progress)) * 360}deg`,
    "--peer-energy": Math.max(.25, Math.min(1, peers / 10)),
  } as CSSProperties;

  return (
    <div
      className={`core-reactor ${connected ? "is-running" : "is-dormant"} ${networkActive ? "network-open" : "network-closed"} ${syncing ? "is-syncing" : "is-synced"} ${blockPulse ? "has-block-pulse" : ""}`}
      style={style}
    >
      <div className="reactor-gantry" aria-hidden="true"><i /><i /><i /><i /></div>

      <button className="reactor-chamber" onClick={onInspectCore} aria-label={`Inspect Bitcoin Core reactor. ${blocks} blocks. ${(progress * 100).toFixed(2)} percent synchronized.`}>
        <span className="reactor-glass" aria-hidden="true">
          <i className="reactor-ring sync-ring-outer" />
          <i className="reactor-ring sync-ring-inner" />
          <i className="reactor-helix helix-blue" />
          <i className="reactor-helix helix-gold" />
          <i className="reactor-heart" />
          <i className="block-pulse" />
        </span>
        <span className="reactor-reading"><strong>{(progress * 100).toFixed(2)}%</strong><small>{syncing ? "synchronizing" : "local chain current"}</small></span>
      </button>

      <button className="network-manifold" onClick={onInspectNetwork} aria-label={`Inspect network manifold. ${peers} peers. Network ${networkActive ? "active" : "disabled"}.`}>
        <span className="manifold-hub" aria-hidden="true" />
        <span className="peer-conduit conduit-one" aria-hidden="true" />
        <span className="peer-conduit conduit-two" aria-hidden="true" />
        <span className="peer-conduit conduit-three" aria-hidden="true" />
        <span className="peer-conduit conduit-four" aria-hidden="true" />
        <span className="network-engraving"><strong>{networkActive ? "Peer manifold open" : "Peer manifold closed"}</strong><small>Inspect exact network state</small></span>
      </button>

      <button
        className={`network-breaker ${networkActive ? "is-on" : "is-off"}`}
        onClick={onToggleNetwork}
        disabled={toggleDisabled}
        aria-label={networkActive ? "Disable Bitcoin Core P2P network" : "Enable Bitcoin Core P2P network"}
      >
        <span className="breaker-track" aria-hidden="true"><i className="breaker-handle" /></span>
        <span><strong>P2P</strong><small>{networkActive ? "open" : "closed"}</small></span>
      </button>
    </div>
  );
}
