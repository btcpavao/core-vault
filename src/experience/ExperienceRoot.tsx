import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { adaptNodeStatusToEngineRoom } from "./adapters/nodeVisualState";
import {
  INITIAL_BLOCK_PULSE_STATE,
  reduceBlockPulse,
} from "./energy/reactorEnergyState";
import { ENGINE_ROOM_CAMERA_POSES } from "./camera/engineRoomCamera";
import {
  hasSpatialFocus,
  INITIAL_SPATIAL_FOCUS,
  reduceSpatialFocus,
  type SpatialFocusTarget,
} from "./interaction/spatialFocus";
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

const networkLabel = (networkActive: boolean | null) => {
  if (networkActive === null) return "Unknown";
  return networkActive ? "Active" : "Disabled";
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
  const [blockPulse, observeBlockHeight] = useReducer(
    reduceBlockPulse,
    INITIAL_BLOCK_PULSE_STATE,
  );
  const [focus, dispatchFocus] = useReducer(reduceSpatialFocus, INITIAL_SPATIAL_FOCUS);
  const [presentationFailure, setPresentationFailure] = useState<string | null>(null);

  useEffect(() => {
    observeBlockHeight(visualState.blockHeight);
  }, [visualState.blockHeight]);

  const focusTarget = useCallback((target: Exclude<SpatialFocusTarget, "overview">) => {
    dispatchFocus({ type: "focus", target });
    window.requestAnimationFrame(() => {
      document.getElementById("engine-room-precision-panel")?.focus({ preventScroll: true });
    });
  }, []);

  const clearFocus = useCallback(() => dispatchFocus({ type: "back" }), []);

  const returnToOverview = useCallback(() => {
    const returnTarget = focus;
    dispatchFocus({ type: "back" });
    window.requestAnimationFrame(() => {
      document
        .getElementById(
          returnTarget === "network-console" ? "focus-network-console" : "focus-reactor",
        )
        ?.focus({ preventScroll: true });
    });
  }, [focus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hasSpatialFocus(focus)) {
        event.preventDefault();
        returnToOverview();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focus, returnToOverview]);

  const statusText = nodeRead.reading
    ? "Reading the local node"
    : connectionLabel(visualState.connection);
  const selectedContext = focus === "network-console" ? "network" : "reactor";
  const initialCamera = ENGINE_ROOM_CAMERA_POSES.overview;

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
              shadows
              dpr={[1, 1.5]}
              frameloop={visible ? "always" : "never"}
              camera={{
                position: [...initialCamera.position],
                fov: initialCamera.fov,
                near: 0.1,
                far: 70,
              }}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
              onPointerMissed={clearFocus}
              fallback={
                <span className="experience-canvas-fallback">
                  This WebView does not support the Canvas presentation surface.
                </span>
              }
              onCreated={({ gl }) => {
                gl.outputColorSpace = SRGBColorSpace;
                gl.toneMapping = ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.04;
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
                validationPulseSerial={blockPulse.pulseSerial}
                focus={focus}
                reducedMotion={reducedMotion}
                onFocus={focusTarget}
                onClearFocus={clearFocus}
              />
            </Canvas>
          </PresentationBoundary>
        )}
      </section>

      {!presentationFailure && (
        <>
          <header className="experience-room-identity">
            <p className="experience-kicker">Operational environment</p>
            <h1>Engine Room</h1>
            <p>The visible home of the local Bitcoin Core node.</p>
          </header>

          <div className="experience-status" aria-live="polite">
            <span className={`experience-state-dot is-${visualState.connection}`} aria-hidden="true" />
            <span>{statusText}</span>
            <strong>{chainLabel(visualState.chain)}</strong>
          </div>

          <nav className="experience-exit" aria-label="Engine Room navigation">
            <a href="/">Return to existing interface</a>
            <span aria-hidden="true">·</span>
            <span>Exit passage reserved for the next room</span>
          </nav>

          <div id="engine-room-access" className="experience-access-control" aria-label="Room focus controls">
            <button
              id="focus-reactor"
              type="button"
              className={focus === "reactor" ? "is-active" : undefined}
              aria-pressed={focus === "reactor"}
              aria-controls="engine-room-precision-panel"
              onClick={() => focusTarget("reactor")}
            >
              Inspect Core Reactor
            </button>
            <button
              id="focus-network-console"
              type="button"
              className={focus === "network-console" ? "is-active" : undefined}
              aria-pressed={focus === "network-console"}
              aria-controls="engine-room-precision-panel"
              onClick={() => focusTarget("network-console")}
            >
              Inspect Network Console
            </button>
          </div>

          {hasSpatialFocus(focus) && (
            <aside
              id="engine-room-precision-panel"
              className="experience-precision-panel"
              aria-label={selectedContext === "reactor" ? "Bitcoin Core reactor details" : "Bitcoin Core network details"}
              tabIndex={-1}
            >
              <div>
                <p className="experience-kicker">
                  {selectedContext === "reactor" ? "Core Reactor" : "Network Console"}
                </p>
                <h2>
                  {selectedContext === "reactor"
                    ? activityLabel(visualState.activity)
                    : networkLabel(visualState.networkActive)}
                </h2>
              </div>
              <button type="button" className="panel-close" onClick={returnToOverview}>
                Back <span aria-hidden="true">×</span>
              </button>
              <dl>
                {selectedContext === "reactor" ? (
                  <>
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
                      <dt>Core connection</dt>
                      <dd>{connectionLabel(visualState.connection)}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Networking</dt>
                      <dd>{networkLabel(visualState.networkActive)}</dd>
                    </div>
                    <div>
                      <dt>Connected peers</dt>
                      <dd>{visualState.peerCount?.toLocaleString() ?? "Unknown"}</dd>
                    </div>
                    <div>
                      <dt>Core connection</dt>
                      <dd>{connectionLabel(visualState.connection)}</dd>
                    </div>
                    <div>
                      <dt>Chain</dt>
                      <dd>{chainLabel(visualState.chain)}</dd>
                    </div>
                  </>
                )}
              </dl>
              {nodeRead.message && (
                <p className="experience-read-note">Live node status could not be read in this runtime.</p>
              )}
              <p className="panel-escape">Press Escape or Back to return to Room Overview.</p>
            </aside>
          )}
        </>
      )}
    </main>
  );
}
