import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { adaptNodeStatusToEngineRoom } from "./adapters/nodeVisualState";
import { EngineRoom } from "./rooms/EngineRoom/EngineRoom";
import { useDocumentVisibility, useNodeStatus } from "./useNodeStatus";
import { loadPreferences } from "../lib/preferences";
import "./experience.css";

interface PresentationBoundaryProps {
  children: ReactNode;
  onFailure: (message: string) => void;
}

interface PresentationBoundaryState {
  failed: boolean;
}

class PresentationBoundary extends Component<
  PresentationBoundaryProps,
  PresentationBoundaryState
> {
  state: PresentationBoundaryState = { failed: false };

  static getDerivedStateFromError(): PresentationBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onFailure(error.message || "The React Three Fiber scene failed to render.");
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function useReducedMotion() {
  const developmentOverride =
    import.meta.env.DEV && import.meta.env.VITE_REDUCED_MOTION === "true";
  const [reduced, setReduced] = useState(() => {
    const mediaReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    return developmentOverride || loadPreferences().reducedMotion || mediaReduced;
  });

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;

    const update = () =>
      setReduced(developmentOverride || loadPreferences().reducedMotion || media.matches);
    media.addEventListener("change", update);
    window.addEventListener("storage", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("storage", update);
    };
  }, [developmentOverride]);

  return reduced;
}

const chainLabel = (chain: string | null) => {
  if (chain === null) return "Chain unknown";
  if (chain === "main") return "Mainnet";
  if (chain === "test" || chain === "testnet") return "Testnet";
  if (chain === "testnet4") return "Testnet4";
  if (chain === "signet") return "Signet";
  if (chain === "regtest") return "Regtest";
  return chain;
};

const connectionLabel = (connection: "unknown" | "offline" | "online") => {
  if (connection === "online") return "Core available";
  if (connection === "offline") return "Core unavailable";
  return "Core status unknown";
};

const activityLabel = (activity: "idle" | "syncing" | "ready" | "attention") => {
  if (activity === "syncing") return "Synchronizing";
  if (activity === "ready") return "Ready";
  if (activity === "attention") return "Attention";
  return "Waiting for status";
};

const formatProgress = (progress: number | null) =>
  progress === null
    ? "Unknown"
    : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(progress * 100)}%`;

export default function ExperienceRoot() {
  const nodeRead = useNodeStatus();
  const visible = useDocumentVisibility();
  const reducedMotion = useReducedMotion();
  const visualState = useMemo(
    () => adaptNodeStatusToEngineRoom(nodeRead.status),
    [nodeRead.status],
  );
  const [reactorFocused, setReactorFocused] = useState(false);
  const [presentationFailure, setPresentationFailure] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && reactorFocused) {
        event.preventDefault();
        setReactorFocused(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactorFocused]);

  const focusReactor = () => setReactorFocused(true);
  const clearFocus = () => setReactorFocused(false);
  const statusText = nodeRead.reading
    ? "Reading the local node"
    : connectionLabel(visualState.connection);

  return (
    <main className="experience-root" data-motion={reducedMotion ? "reduced" : "full"}>
      <a className="experience-skip-link" href="#engine-room-access">
        Skip real-time room
      </a>

      <section className="experience-viewport" aria-label="Real-time Engine Room">
        {presentationFailure ? (
          <div className="experience-fallback" role="alert">
            <p className="experience-kicker">Presentation unavailable</p>
            <h1>Real-time environment could not start.</h1>
            <p>
              This is a WebGL presentation failure. It does not mean Bitcoin Core failed, and no
              wallet or node state was changed.
            </p>
            {import.meta.env.DEV && (
              <p className="experience-diagnostic">Diagnostic: {presentationFailure}</p>
            )}
            <a href="/">Return to the existing Core Vault interface</a>
          </div>
        ) : (
          <PresentationBoundary onFailure={setPresentationFailure}>
            <Canvas
              dpr={[1, 1.5]}
              frameloop={visible ? "always" : "never"}
              camera={{ position: [7.6, 4.65, 10.8], fov: 42, near: 0.1, far: 70 }}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
              onPointerMissed={clearFocus}
              fallback={
                <span className="experience-canvas-fallback">
                  This WebView does not support the Canvas presentation surface.
                </span>
              }
              onCreated={({ gl }) => {
                const canvas = gl.domElement;
                const onContextLost = (event: Event) => {
                  event.preventDefault();
                  setPresentationFailure("The WebGL rendering context was lost.");
                };
                canvas.addEventListener("webglcontextlost", onContextLost, { once: true });
              }}
            >
              <EngineRoom
                visualState={visualState}
                reactorFocused={reactorFocused}
                reducedMotion={reducedMotion}
                onFocusReactor={focusReactor}
                onClearFocus={clearFocus}
              />
            </Canvas>
          </PresentationBoundary>
        )}
      </section>

      {!presentationFailure && (
        <>
          <header className="experience-room-identity">
            <p className="experience-kicker">Real-time architecture proof</p>
            <h1>Engine Room</h1>
            <p>The visible home of the local Bitcoin Core node.</p>
          </header>

          <div className="experience-status" aria-live="polite">
            <span className={`experience-state-dot is-${visualState.connection}`} aria-hidden="true" />
            <span>{statusText}</span>
            <strong>{chainLabel(visualState.chain)}</strong>
          </div>

          <nav className="experience-exit" aria-label="Experience proof navigation">
            <a href="/">Return to existing interface</a>
            <span aria-hidden="true">·</span>
            <span>Exit passage is a future room seam</span>
          </nav>

          <div id="engine-room-access" className="experience-access-control">
            <button
              type="button"
              aria-expanded={reactorFocused}
              aria-controls="reactor-precision-panel"
              onClick={() => setReactorFocused((focused) => !focused)}
            >
              {reactorFocused ? "Close reactor inspection" : "Inspect Core Reactor"}
            </button>
          </div>

          {reactorFocused && (
            <aside
              id="reactor-precision-panel"
              className="reactor-precision-panel"
              aria-label="Bitcoin Core reactor details"
            >
              <div>
                <p className="experience-kicker">Core Reactor</p>
                <h2>{activityLabel(visualState.activity)}</h2>
              </div>
              <button type="button" className="panel-close" onClick={clearFocus}>
                Close <span aria-hidden="true">×</span>
              </button>
              <dl>
                <div>
                  <dt>Chain</dt>
                  <dd>{chainLabel(visualState.chain)}</dd>
                </div>
                <div>
                  <dt>Block height</dt>
                  <dd>{visualState.blockHeight?.toLocaleString() ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt>Synchronization</dt>
                  <dd>{formatProgress(visualState.syncProgress)}</dd>
                </div>
                <div>
                  <dt>Peers</dt>
                  <dd>{visualState.peerCount?.toLocaleString() ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt>Networking</dt>
                  <dd>
                    {visualState.networkActive === null
                      ? "Unknown"
                      : visualState.networkActive
                        ? "Active"
                        : "Disabled"}
                  </dd>
                </div>
              </dl>
              {nodeRead.message && (
                <p className="reactor-read-note">Live node status could not be read in this runtime.</p>
              )}
              <p className="panel-escape">Press Escape to return to the neutral room view.</p>
            </aside>
          )}
        </>
      )}
    </main>
  );
}
