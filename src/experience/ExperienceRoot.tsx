import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { adaptNodeStatusToEngineRoom } from "./adapters/nodeVisualState";
import {
  INITIAL_BLOCK_PULSE_STATE,
  reduceBlockPulse,
} from "./energy/reactorEnergyState";
import {
  ENGINE_ROOM_CAMERA_POSES,
  ER09_PRODUCTION_CAMERA_POSES,
  productionReviewViewFromSearch,
  type EngineRoomReviewView,
} from "./camera/engineRoomCamera";
import {
  hasSpatialFocus,
  INITIAL_SPATIAL_FOCUS,
  reduceSpatialFocus,
  type SpatialFocusTarget,
} from "./interaction/spatialFocus";
import { EngineRoomPerformanceSampler } from "./rooms/EngineRoom/EngineRoomPerformanceSampler";
import { CinematicEngineRoom } from "./rooms/EngineRoom/CinematicEngineRoom";
import { CinematicEngineRoomPerformanceSampler } from "./rooms/EngineRoom/CinematicEngineRoomPerformanceSampler";
import {
  applyCinematicReviewState,
  resolveCinematicReviewState,
} from "./rooms/EngineRoom/cinematicSceneContract";
import {
  EngineRoomResourceProbe,
  type EngineRoomResourceSnapshot,
} from "./rooms/EngineRoom/EngineRoomResourceProbe";
import { EngineRoomRuntime } from "./rooms/EngineRoom/EngineRoomRuntime";
import type {
  Er09AssetMetrics,
  Er11LifecycleCounters,
} from "./rooms/EngineRoom/ProductionEngineRoom";
import { ProductionStaticEnvironment } from "./rooms/EngineRoom/ProductionEngineRoom";
import type { EngineRoomPerformanceResult } from "./rooms/EngineRoom/productionPerformance";
import { resolveEngineRoomSceneMode } from "./rooms/EngineRoom/productionSceneContract";
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
    import.meta.env.DEV &&
    (import.meta.env.VITE_REDUCED_MOTION === "true" ||
      import.meta.env.VITE_CV_ER10_PERF_SCENARIO === "E" ||
      new URLSearchParams(window.location.search).get("reducedMotion") === "1");
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

const ER09_CAPTURE_JOBS: Array<{
  view: EngineRoomReviewView;
  filename: string;
}> = [
  { view: "hero", filename: "er-09-runtime-hero.png" },
  { view: "alternate", filename: "er-09-runtime-alternate.png" },
  { view: "reactor", filename: "er-09-runtime-reactor-closeup.png" },
  { view: "console", filename: "er-09-runtime-console.png" },
];

const ER10_CAPTURE_JOBS: Array<{
  view: EngineRoomReviewView;
  filename: string;
}> = [
  { view: "hero", filename: "er-10-runtime-hero.png" },
  { view: "alternate", filename: "er-10-runtime-alternate.png" },
  { view: "reactor", filename: "er-10-runtime-reactor-closeup.png" },
  { view: "console", filename: "er-10-runtime-console.png" },
  { view: "exterior", filename: "er-10-runtime-exterior.png" },
];

const ER10B_CAPTURE_JOBS: Array<{
  view: EngineRoomReviewView;
  filename: string;
}> = [
  { view: "hero", filename: "er-10b-runtime-hero.png" },
  { view: "alternate", filename: "er-10b-runtime-alternate.png" },
  { view: "reactor", filename: "er-10b-runtime-reactor-closeup.png" },
  { view: "console", filename: "er-10b-runtime-console.png" },
];

const ER12A_CAPTURE_JOBS: Array<{
  view: EngineRoomReviewView;
  filename: string;
}> = [
  { view: "hero", filename: "er-12a-runtime-hero.png" },
  { view: "alternate", filename: "er-12a-runtime-alternate.png" },
  { view: "reactor", filename: "er-12a-runtime-reactor-closeup.png" },
  { view: "console", filename: "er-12a-runtime-console.png" },
];

const ER10B_QA_ENABLED = import.meta.env.VITE_CV_ER10B_QA === "1";
const CINEMATIC_QA_ENABLED = import.meta.env.VITE_CV_CINEMATIC_QA === "1";
const ER11B_AUTORUN_ENABLED = import.meta.env.VITE_CV_ER11B_AUTORUN === "1";
const ER12A_QA_VIEW = productionReviewViewFromSearch(
  true,
  `?er09View=${encodeURIComponent(import.meta.env.VITE_CV_ER12A_QA_VIEW ?? "")}`,
);
const ER10B_QA_SCENARIOS = ["A", "B", "C", "D", "E", "F"] as const;
type Er10bQaScenario = (typeof ER10B_QA_SCENARIOS)[number];
const ER11B_AUTORUN_SEQUENCE: ReadonlyArray<{
  label: string;
  scenario: Er10bQaScenario;
}> = [
  { label: "A", scenario: "A" },
  { label: "B-first", scenario: "B" },
  { label: "B-warm", scenario: "B" },
  { label: "C", scenario: "C" },
  { label: "D", scenario: "D" },
  { label: "E", scenario: "E" },
  { label: "F", scenario: "F" },
];
const ER11B_AUTORUN_STORAGE_KEY = "cv:er11b:autorun:v1";

interface Er11bAutorunRecord {
  order: number;
  label: string;
  result: EngineRoomPerformanceResult;
}

interface Er11LifecycleRecord extends EngineRoomResourceSnapshot {
  label: string;
  cycle: number;
  roomMounted: boolean;
  capturedAt: string;
}

const er10bQaReviewView = (
  scenario: Er10bQaScenario,
): EngineRoomReviewView | null => {
  if (scenario === "C") return "reactor";
  if (scenario === "F") return "console";
  if (scenario === "B") return null;
  return "hero";
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolvePromise) => window.setTimeout(resolvePromise, milliseconds));

async function postEr09Capture(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  filename: string,
) {
  await new Promise<void>((resolvePromise) =>
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolvePromise())),
  );
  const canvas = canvasRef.current;
  if (!canvas) throw new Error("Runtime capture canvas is unavailable");
  const response = await fetch("/__er09_capture", {
    method: "POST",
    headers: { "x-er09-filename": filename },
    body: canvas.toDataURL("image/png"),
  });
  if (!response.ok) throw new Error(`Runtime capture failed: ${response.status}`);
}

async function postEr10Performance(
  scenario: string,
  result: EngineRoomPerformanceResult,
) {
  const response = await fetch("/__er10_performance", {
    method: "POST",
    headers: { "x-er10-scenario": scenario },
    body: JSON.stringify(result, null, 2),
  });
  if (!response.ok) throw new Error(`ER-10 performance export failed: ${response.status}`);
}

export default function ExperienceRoot() {
  const nodeRead = useNodeStatus();
  const visible = useDocumentVisibility();
  const reducedMotion = useReducedMotion();
  const authoritativeVisualState = useMemo(
    () => adaptNodeStatusToEngineRoom(nodeRead.status),
    [nodeRead.status],
  );
  const [blockPulse, observeBlockHeight] = useReducer(
    reduceBlockPulse,
    INITIAL_BLOCK_PULSE_STATE,
  );
  const [focus, dispatchFocus] = useReducer(reduceSpatialFocus, INITIAL_SPATIAL_FOCUS);
  const [presentationFailure, setPresentationFailure] = useState<string | null>(null);
  const [productionFallback, setProductionFallback] = useState<string | null>(null);
  const [er09AssetMetrics, setEr09AssetMetrics] = useState<Er09AssetMetrics | null>(null);
  const [er09Performance, setEr09Performance] =
    useState<EngineRoomPerformanceResult | null>(null);
  const [captureReviewView, setCaptureReviewView] =
    useState<EngineRoomReviewView | null>(null);
  const [er10bQaScenario, setEr10bQaScenario] = useState<Er10bQaScenario>("A");
  const [er10bQaRun, setEr10bQaRun] = useState(0);
  const [er10bQaAssetProbe, setEr10bQaAssetProbe] = useState("pending");
  const [er11bAutorunResults, setEr11bAutorunResults] =
    useState<Er11bAutorunRecord[]>([]);
  const [er11RoomMounted, setEr11RoomMounted] = useState(true);
  const [er11SceneOverride, setEr11SceneOverride] =
    useState<"legacy" | "production" | null>(null);
  const [er11ResourceSnapshot, setEr11ResourceSnapshot] =
    useState<EngineRoomResourceSnapshot | null>(null);
  const [er11LifecycleCounters, setEr11LifecycleCounters] =
    useState<Er11LifecycleCounters | null>(null);
  const [er11LifecycleRecords, setEr11LifecycleRecords] =
    useState<Er11LifecycleRecord[]>([]);
  const [er11LifecycleStatus, setEr11LifecycleStatus] = useState("idle");
  const [er11CleanCapture, setEr11CleanCapture] = useState(false);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureStartedRef = useRef(false);
  const er11ResourceRef = useRef<EngineRoomResourceSnapshot | null>(null);
  const er11bAutorunResultsRef = useRef<Er11bAutorunRecord[]>([]);
  const er11bAutorunTimerRef = useRef<number | null>(null);
  const sceneMode = useMemo(
    () =>
      resolveEngineRoomSceneMode({
        development: import.meta.env.DEV || ER10B_QA_ENABLED,
        environmentValue: import.meta.env.VITE_CV_ENGINE_ROOM_PRODUCTION,
        search: window.location.search,
      }),
    [],
  );
  const activeSceneMode = ER10B_QA_ENABLED
    ? er11SceneOverride ?? sceneMode
    : sceneMode;
  const cinematicReviewState = useMemo(
    () =>
      resolveCinematicReviewState(
        import.meta.env.DEV || CINEMATIC_QA_ENABLED,
        window.location.search,
        import.meta.env.VITE_CV_CINEMATIC_REVIEW_STATE,
      ),
    [],
  );
  const visualState = useMemo(
    () =>
      activeSceneMode === "cinematic"
        ? applyCinematicReviewState(authoritativeVisualState, cinematicReviewState)
        : authoritativeVisualState,
    [activeSceneMode, authoritativeVisualState, cinematicReviewState],
  );
  const reviewView = useMemo(
    () => {
      const searchView = productionReviewViewFromSearch(
        import.meta.env.DEV || ER10B_QA_ENABLED,
        window.location.search,
      );
      if (searchView) return searchView;
      const environmentView = import.meta.env.VITE_CV_ER10_PERF_VIEW;
      return productionReviewViewFromSearch(
        import.meta.env.DEV || ER10B_QA_ENABLED,
        `?er09View=${encodeURIComponent(environmentView ?? "")}`,
      );
    },
    [],
  );
  const er10PerformanceScenario = import.meta.env.VITE_CV_ER10_PERF_SCENARIO;
  const nonQaPerformanceEnabled =
    (import.meta.env.DEV || CINEMATIC_QA_ENABLED) &&
    (new URLSearchParams(window.location.search).get("er09Perf") === "1" ||
      Boolean(er10PerformanceScenario));
  const performanceEnabled = ER10B_QA_ENABLED || nonQaPerformanceEnabled;
  const er10CaptureEnabled =
    import.meta.env.DEV && import.meta.env.VITE_CV_ER10_CAPTURE === "1";
  const er10bCaptureEnabled =
    import.meta.env.DEV && import.meta.env.VITE_CV_ER10B_CAPTURE === "1";
  const er12aCaptureEnabled =
    import.meta.env.DEV && import.meta.env.VITE_CV_ER12A_CAPTURE === "1";
  const captureEnabled =
    import.meta.env.DEV &&
    (import.meta.env.VITE_CV_ER09_CAPTURE === "1" ||
      er10CaptureEnabled ||
      er10bCaptureEnabled ||
      er12aCaptureEnabled);
  const captureJobs = er12aCaptureEnabled
    ? ER12A_CAPTURE_JOBS
    : er10bCaptureEnabled
    ? ER10B_CAPTURE_JOBS
    : er10CaptureEnabled
      ? ER10_CAPTURE_JOBS
      : ER09_CAPTURE_JOBS;
  const captureAssetReady = Boolean(er09AssetMetrics?.firstRenderSinceNavigationMs);
  const effectiveReducedMotion =
    reducedMotion || (ER10B_QA_ENABLED && er10bQaScenario === "E");
  const effectiveReviewView =
    ER12A_QA_VIEW ??
    (ER10B_QA_ENABLED ? er10bQaReviewView(er10bQaScenario) : reviewView);
  const performanceScenario =
    (ER10B_QA_ENABLED ? er10bQaScenario : null) ??
    er10PerformanceScenario ??
    new URLSearchParams(window.location.search).get("er09Scenario") ??
    `${focus}-${effectiveReducedMotion ? "reduced" : "full"}`;

  useEffect(() => {
    if (!ER10B_QA_ENABLED) return;
    const controller = new AbortController();
    void fetch("/assets/experience/engine-room/production/cv_engine_room_er09.glb", {
      method: "HEAD",
      signal: controller.signal,
    })
      .then((response) =>
        setEr10bQaAssetProbe(
          `${response.status}:${response.headers.get("content-length") ?? "unknown"}`,
        ),
      )
      .catch((error: unknown) =>
        setEr10bQaAssetProbe(error instanceof Error ? error.message : String(error)),
      );
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!ER11B_AUTORUN_ENABLED) return;
    window.localStorage.removeItem(ER11B_AUTORUN_STORAGE_KEY);
    er11bAutorunResultsRef.current = [];
    setEr11bAutorunResults([]);
    return () => {
      if (er11bAutorunTimerRef.current !== null) {
        window.clearTimeout(er11bAutorunTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV && !ER10B_QA_ENABLED && !CINEMATIC_QA_ENABLED) return;
    const onAsset = (event: Event) =>
      setEr09AssetMetrics((event as CustomEvent<Er09AssetMetrics>).detail);
    const onPerformance = (event: Event) => {
      const result = (event as CustomEvent<EngineRoomPerformanceResult>).detail;
      setEr09Performance(result);
      if (ER11B_AUTORUN_ENABLED) {
        const order = er11bAutorunResultsRef.current.length;
        const step = ER11B_AUTORUN_SEQUENCE[order];
        if (step) {
          const nextResults = [
            ...er11bAutorunResultsRef.current,
            { order, label: step.label, result },
          ];
          er11bAutorunResultsRef.current = nextResults;
          setEr11bAutorunResults(nextResults);
          window.localStorage.setItem(
            ER11B_AUTORUN_STORAGE_KEY,
            JSON.stringify(nextResults),
          );
          const nextStep = ER11B_AUTORUN_SEQUENCE[nextResults.length];
          if (nextStep) {
            er11bAutorunTimerRef.current = window.setTimeout(() => {
              setEr10bQaScenario(nextStep.scenario);
              setEr10bQaRun((run) => run + 1);
            }, 1_000);
          }
        }
      }
      if (er10PerformanceScenario && import.meta.env.DEV) {
        void postEr10Performance(er10PerformanceScenario, result).catch((error) => {
          console.error("[ER-10 performance export]", error);
        });
      }
    };
    const onLifecycleCounters = (event: Event) =>
      setEr11LifecycleCounters(
        { ...(event as CustomEvent<Er11LifecycleCounters>).detail },
      );
    window.addEventListener("cv:er09-asset", onAsset);
    window.addEventListener("cv:er09-performance", onPerformance);
    window.addEventListener("cv:er11-lifecycle-counters", onLifecycleCounters);
    return () => {
      window.removeEventListener("cv:er09-asset", onAsset);
      window.removeEventListener("cv:er09-performance", onPerformance);
      window.removeEventListener("cv:er11-lifecycle-counters", onLifecycleCounters);
    };
  }, [er10PerformanceScenario]);

  useEffect(() => {
    if (!ER10B_QA_ENABLED) return;
    setEr09Performance(null);
    dispatchFocus({ type: "back" });
    if (er10bQaScenario === "C") {
      dispatchFocus({ type: "focus", target: "reactor" });
      return;
    }
    if (er10bQaScenario === "F") {
      dispatchFocus({ type: "focus", target: "network-console" });
      return;
    }
    if (er10bQaScenario !== "B") return;
    const timer = window.setTimeout(
      () => dispatchFocus({ type: "focus", target: "reactor" }),
      1_600,
    );
    return () => window.clearTimeout(timer);
  }, [er10bQaRun, er10bQaScenario]);

  useEffect(() => {
    if (
      !captureEnabled ||
      captureStartedRef.current ||
      sceneMode !== "production" ||
      productionFallback ||
      !captureAssetReady ||
      visualState.connection !== "online"
    ) {
      return;
    }
    captureStartedRef.current = true;
    let cancelled = false;

    const capture = async () => {
      for (const job of captureJobs) {
        if (cancelled) return;
        setCaptureReviewView(job.view);
        await wait(reducedMotion ? 180 : 3_200);
        if (cancelled) return;
        await postEr09Capture(captureCanvasRef, job.filename);
      }
      setCaptureReviewView(null);
    };

    void capture().catch((error) => {
      console.error("[runtime capture]", error);
    });
    return () => {
      cancelled = true;
    };
  }, [
    captureEnabled,
    captureJobs,
    captureAssetReady,
    productionFallback,
    reducedMotion,
    sceneMode,
    visualState.connection,
  ]);

  useEffect(() => {
    observeBlockHeight(authoritativeVisualState.blockHeight);
  }, [authoritativeVisualState.blockHeight]);

  const focusTarget = useCallback((target: Exclude<SpatialFocusTarget, "overview">) => {
    dispatchFocus({ type: "focus", target });
    window.requestAnimationFrame(() => {
      document.getElementById("engine-room-precision-panel")?.focus({ preventScroll: true });
    });
  }, []);

  const clearFocus = useCallback(() => dispatchFocus({ type: "back" }), []);

  const observeEr11Resource = useCallback((snapshot: EngineRoomResourceSnapshot) => {
    er11ResourceRef.current = snapshot;
  }, []);

  const runEr11Lifecycle = useCallback(async () => {
    if (!ER10B_QA_ENABLED || er11LifecycleStatus === "running") return;
    setEr11LifecycleStatus("running");
    setEr11LifecycleRecords([]);
    setEr11CleanCapture(false);
    setEr11SceneOverride("production");
    const records: Er11LifecycleRecord[] = [];
    const capture = (label: string, cycle: number, roomMounted: boolean) => {
      const snapshot = er11ResourceRef.current;
      if (!snapshot) return;
      setEr11ResourceSnapshot(snapshot);
      records.push({
        ...snapshot,
        label,
        cycle,
        roomMounted,
        capturedAt: new Date().toISOString(),
      });
      setEr11LifecycleRecords([...records]);
    };

    dispatchFocus({ type: "back" });
    setEr11RoomMounted(false);
    await wait(1_250);
    capture("before-entry", 0, false);

    for (let cycle = 1; cycle <= 10; cycle += 1) {
      setEr11RoomMounted(true);
      await wait(1_250);
      dispatchFocus({ type: "focus", target: "reactor" });
      await wait(350);
      dispatchFocus({ type: "focus", target: "network-console" });
      await wait(350);
      dispatchFocus({ type: "back" });
      await wait(350);
      capture("after-entry-and-inspection", cycle, true);
      setEr11RoomMounted(false);
      await wait(1_250);
      capture("after-leave", cycle, false);
    }

    setEr11RoomMounted(true);
    await wait(1_250);
    capture("final-return", 10, true);
    setEr11LifecycleStatus("complete");
  }, [er11LifecycleStatus]);

  useEffect(() => {
    if (!import.meta.env.DEV || er10PerformanceScenario !== "B") return;
    const timer = window.setTimeout(
      () => dispatchFocus({ type: "focus", target: "reactor" }),
      1_600,
    );
    return () => window.clearTimeout(timer);
  }, [er10PerformanceScenario]);

  const returnToOverview = useCallback(() => {
    const returnTarget = focus;
    dispatchFocus({ type: "back" });
    window.requestAnimationFrame(() => {
      document
        .getElementById(
          activeSceneMode === "cinematic"
            ? returnTarget === "network-console"
              ? "cinematic-network-console-control"
              : "cinematic-reactor-control"
            : returnTarget === "network-console"
              ? "focus-network-console"
              : "focus-reactor",
        )
        ?.focus({ preventScroll: true });
    });
  }, [activeSceneMode, focus]);

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
  const cinematicActive = activeSceneMode === "cinematic" && !productionFallback;
  const canvasSceneMode = activeSceneMode === "cinematic" ? "legacy" : activeSceneMode;
  const initialCamera =
    canvasSceneMode === "production"
      ? ER09_PRODUCTION_CAMERA_POSES[effectiveReviewView ?? "hero"]
      : ENGINE_ROOM_CAMERA_POSES.overview;

  return (
    <main
      className="experience-root"
      data-motion={effectiveReducedMotion ? "reduced" : "full"}
      data-engine-room-scene={
        productionFallback
          ? activeSceneMode === "cinematic"
            ? "cinematic-fallback"
            : "legacy-fallback"
          : activeSceneMode
      }
      data-cinematic-review-state={cinematicReviewState ?? undefined}
    >
      <a
        className="experience-skip-link"
        href={cinematicActive ? "#cinematic-reactor-control" : "#engine-room-access"}
      >
        Skip real-time room
      </a>

      <section className="experience-viewport" aria-label="Real-time Engine Room">
        {presentationFailure ? (
          <div className="experience-fallback" role="alert">
            <p className="experience-kicker">Presentation unavailable</p>
            <h1>Real-time environment could not start.</h1>
            <p>
              This is a presentation-layer failure. It does not mean Bitcoin Core failed, and no
              wallet or node state was changed.
            </p>
            {import.meta.env.DEV && (
              <p className="experience-diagnostic">Diagnostic: {presentationFailure}</p>
            )}
            <a href="/">Return to the existing Core Vault interface</a>
          </div>
        ) : cinematicActive ? (
          <>
            <CinematicEngineRoom
              visualState={visualState}
              validationPulseSerial={blockPulse.pulseSerial}
              focus={focus}
              reducedMotion={effectiveReducedMotion}
              reviewState={cinematicReviewState}
              onFocus={focusTarget}
              onClearFocus={clearFocus}
              onPresentationFailure={setProductionFallback}
            />
            <CinematicEngineRoomPerformanceSampler
              key={`cinematic-${performanceScenario}`}
              enabled={performanceEnabled}
              scenario={performanceScenario}
            />
          </>
        ) : (
          <PresentationBoundary onFailure={setPresentationFailure}>
            <Canvas
              shadows
              dpr={canvasSceneMode === "production" ? 1 : [1, 1.5]}
              frameloop={performanceEnabled || visible ? "always" : "never"}
              camera={{
                position: [...initialCamera.position],
                fov: initialCamera.fov,
                near: 0.1,
                far: 70,
              }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                preserveDrawingBuffer: captureEnabled,
              }}
              onPointerMissed={clearFocus}
              fallback={
                <span className="experience-canvas-fallback">
                  This WebView does not support the Canvas presentation surface.
                </span>
              }
              onCreated={({ gl }) => {
                gl.outputColorSpace = SRGBColorSpace;
                gl.toneMapping = ACESFilmicToneMapping;
                gl.toneMappingExposure = canvasSceneMode === "production" ? 0.9 : 1;
                captureCanvasRef.current = gl.domElement;
                const canvas = gl.domElement;
                const onContextLost = (event: Event) => {
                  event.preventDefault();
                  setPresentationFailure("The WebGL rendering context was lost.");
                };
                canvas.addEventListener("webglcontextlost", onContextLost, { once: true });
              }}
            >
              {canvasSceneMode === "production" && !productionFallback && (
                <ProductionStaticEnvironment />
              )}
              {er11RoomMounted && (
                <EngineRoomRuntime
                  mode={canvasSceneMode}
                  visualState={visualState}
                  validationPulseSerial={blockPulse.pulseSerial}
                  focus={focus}
                  reducedMotion={effectiveReducedMotion}
                  reviewView={captureReviewView ?? effectiveReviewView}
                  onFocus={focusTarget}
                  onClearFocus={clearFocus}
                  onProductionFailure={setProductionFallback}
                />
              )}
              <EngineRoomPerformanceSampler
                key={`er10b-${er10bQaRun}-${performanceScenario}`}
                enabled={performanceEnabled}
                scene={productionFallback ? "legacy" : canvasSceneMode}
                scenario={performanceScenario}
              />
              <EngineRoomResourceProbe
                enabled={ER10B_QA_ENABLED}
                onSnapshot={observeEr11Resource}
              />
            </Canvas>
          </PresentationBoundary>
        )}
      </section>

      {!presentationFailure && !er11CleanCapture && (
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

          {import.meta.env.DEV && productionFallback && (
            <div className="experience-production-diagnostic" role="status">
              ER-09 asset fallback: {productionFallback}
            </div>
          )}

          {(import.meta.env.DEV || CINEMATIC_QA_ENABLED) && (
            <output
              id="er09-runtime-metrics"
              hidden
              data-asset={er09AssetMetrics ? JSON.stringify(er09AssetMetrics) : undefined}
              data-performance={er09Performance ? JSON.stringify(er09Performance) : undefined}
            />
          )}

          {(import.meta.env.DEV || CINEMATIC_QA_ENABLED) && er10PerformanceScenario && (
            <output
              id="er10-runtime-performance-result"
              style={{ position: "fixed", left: 0, top: 0, zIndex: 9999, fontSize: "1px" }}
            >
              {er09Performance ? JSON.stringify(er09Performance) : "ER10_PERFORMANCE_PENDING"}
            </output>
          )}

          {ER10B_QA_ENABLED && (
            <section
              aria-label="ER-10b foreground Tauri QA"
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 10000,
                padding: "4px",
                background: "rgba(0,0,0,0.82)",
                color: "white",
                fontSize: "10px",
              }}
            >
              <div>
                {ER10B_QA_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    aria-label={`Run ER-10b scenario ${scenario}`}
                    aria-pressed={er10bQaScenario === scenario}
                    onClick={() => {
                      setEr11SceneOverride("production");
                      setEr11RoomMounted(true);
                      setEr10bQaScenario(scenario);
                      setEr10bQaRun((run) => run + 1);
                    }}
                  >
                    {scenario}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Run ER-11 ten-cycle lifecycle"
                  onClick={() => void runEr11Lifecycle()}
                  disabled={er11LifecycleStatus === "running"}
                >
                  10x
                </button>
                <button
                  type="button"
                  aria-label="Switch to ER-11 legacy fallback audit"
                  onClick={() => {
                    setEr11RoomMounted(true);
                    setEr11SceneOverride("legacy");
                  }}
                >
                  Legacy
                </button>
                <button
                  type="button"
                  aria-label="Switch to ER-11 production audit"
                  onClick={() => {
                    setEr11RoomMounted(true);
                    setEr11SceneOverride("production");
                  }}
                >
                  Production
                </button>
                <button
                  type="button"
                  aria-label="Hide ER-11 QA chrome for clean capture"
                  onClick={() => setEr11CleanCapture(true)}
                >
                  Clean
                </button>
                <button
                  type="button"
                  aria-label="Capture ER-11 renderer resource snapshot"
                  onClick={() => setEr11ResourceSnapshot(er11ResourceRef.current)}
                >
                  Snapshot
                </button>
              </div>
              <output id="er10b-qa-result" aria-live="polite">
                <span>qa-scenario:{er10bQaScenario}</span>{" "}
                <span>qa-run:{er10bQaRun}</span>{" "}
                <span>qa-connection:{visualState.connection}</span>{" "}
                <span>qa-asset-probe:{er10bQaAssetProbe}</span>{" "}
                <span>qa-model-ready-ms:{er09AssetMetrics?.modelReadySinceNavigationMs ?? "pending"}</span>{" "}
                <span>qa-first-render-ms:{er09AssetMetrics?.firstRenderSinceNavigationMs ?? "pending"}</span>{" "}
                <span>qa-duration-ms:{er09Performance?.durationMs ?? "pending"}</span>{" "}
                <span>qa-frames:{er09Performance?.frames ?? "pending"}</span>{" "}
                <span>qa-average-fps:{er09Performance?.averageFps ?? "pending"}</span>{" "}
                <span>qa-average-frame-ms:{er09Performance?.averageFrameTimeMs ?? "pending"}</span>{" "}
                <span>qa-median-ms:{er09Performance?.medianFrameTimeMs ?? "pending"}</span>{" "}
                <span>qa-p95-ms:{er09Performance?.p95FrameTimeMs ?? "pending"}</span>{" "}
                <span>qa-p99-ms:{er09Performance?.p99FrameTimeMs ?? "pending"}</span>{" "}
                <span>qa-max-ms:{er09Performance?.maxFrameTimeMs ?? "pending"}</span>{" "}
                <span>qa-over-20:{er09Performance?.framesOver20Ms ?? "pending"}</span>{" "}
                <span>qa-over-33-3:{er09Performance?.framesOver33_3Ms ?? "pending"}</span>{" "}
                <span>qa-over-50:{er09Performance?.framesOver50Ms ?? "pending"}</span>{" "}
                <span>qa-average-calls:{er09Performance?.averageRenderCalls ?? "pending"}</span>{" "}
                <span>qa-average-triangles:{er09Performance?.averageTriangles ?? "pending"}</span>{" "}
                <span>qa-max-geometries:{er09Performance?.maxGeometries ?? "pending"}</span>{" "}
                <span>qa-max-textures:{er09Performance?.maxTextures ?? "pending"}</span>{" "}
                <span>qa-room-mounted:{String(er11RoomMounted)}</span>{" "}
                <span>qa-scene-mode:{activeSceneMode}</span>{" "}
                <span>qa-block-height:{visualState.blockHeight ?? "unknown"}</span>{" "}
                <span>qa-block-pulse-serial:{blockPulse.pulseSerial}</span>{" "}
                <span>qa-resource-geometries:{er11ResourceSnapshot?.geometries ?? "pending"}</span>{" "}
                <span>qa-resource-textures:{er11ResourceSnapshot?.textures ?? "pending"}</span>{" "}
                <span>qa-resource-programs:{er11ResourceSnapshot?.programs ?? "pending"}</span>{" "}
                <span>qa-lifecycle-status:{er11LifecycleStatus}</span>{" "}
                <span>qa-lifecycle-records:{er11LifecycleRecords.length}</span>{" "}
                <span>qa-lifecycle-geometries-min:{er11LifecycleRecords.length ? Math.min(...er11LifecycleRecords.map((record) => record.geometries)) : "pending"}</span>{" "}
                <span>qa-lifecycle-geometries-max:{er11LifecycleRecords.length ? Math.max(...er11LifecycleRecords.map((record) => record.geometries)) : "pending"}</span>{" "}
                <span>qa-lifecycle-textures-min:{er11LifecycleRecords.length ? Math.min(...er11LifecycleRecords.map((record) => record.textures)) : "pending"}</span>{" "}
                <span>qa-lifecycle-textures-max:{er11LifecycleRecords.length ? Math.max(...er11LifecycleRecords.map((record) => record.textures)) : "pending"}</span>{" "}
                <span>qa-lifecycle-programs-min:{er11LifecycleRecords.length ? Math.min(...er11LifecycleRecords.map((record) => record.programs)) : "pending"}</span>{" "}
                <span>qa-lifecycle-programs-max:{er11LifecycleRecords.length ? Math.max(...er11LifecycleRecords.map((record) => record.programs)) : "pending"}</span>{" "}
                <span>qa-production-mounts:{er11LifecycleCounters?.productionMounts ?? "pending"}</span>{" "}
                <span>qa-production-unmounts:{er11LifecycleCounters?.productionUnmounts ?? "pending"}</span>{" "}
                <span>qa-runtime-scenes-built:{er11LifecycleCounters?.runtimeScenesBuilt ?? "pending"}</span>{" "}
                <span>qa-console-surfaces-created:{er11LifecycleCounters?.consoleSurfacesCreated ?? "pending"}</span>{" "}
                <span>qa-console-textures-disposed:{er11LifecycleCounters?.consoleTexturesDisposed ?? "pending"}</span>{" "}
                <span>qa-runtime-geometries-disposed:{er11LifecycleCounters?.runtimeGeometriesDisposed ?? "pending"}</span>{" "}
                <span>qa-runtime-materials-disposed:{er11LifecycleCounters?.runtimeMaterialsDisposed ?? "pending"}</span>{" "}
                <span>qa-environment-mounts:{er11LifecycleCounters?.environmentMounts ?? "pending"}</span>{" "}
                <span>qa-environment-unmounts:{er11LifecycleCounters?.environmentUnmounts ?? "pending"}</span>{" "}
                <span>qa-light-probe-mounts:{er11LifecycleCounters?.lightProbeMounts ?? "pending"}</span>{" "}
                <span>qa-light-probe-unmounts:{er11LifecycleCounters?.lightProbeUnmounts ?? "pending"}</span>{" "}
                <span>qa-er11b-autorun-count:{er11bAutorunResults.length}</span>{" "}
                <span>qa-er11b-autorun-complete:{String(er11bAutorunResults.length === ER11B_AUTORUN_SEQUENCE.length)}</span>{" "}
                {JSON.stringify({
                  scenario: er10bQaScenario,
                  run: er10bQaRun,
                  connection: visualState.connection,
                  assetProbe: er10bQaAssetProbe,
                  asset: er09AssetMetrics,
                  performance: er09Performance,
                  roomMounted: er11RoomMounted,
                  sceneMode: activeSceneMode,
                  blockHeight: visualState.blockHeight,
                  blockPulseSerial: blockPulse.pulseSerial,
                  resource: er11ResourceSnapshot,
                  lifecycleStatus: er11LifecycleStatus,
                  lifecycleRecords: er11LifecycleRecords,
                  lifecycleCounters: er11LifecycleCounters,
                  er11bAutorunCount: er11bAutorunResults.length,
                  er11bAutorunComplete:
                    er11bAutorunResults.length === ER11B_AUTORUN_SEQUENCE.length,
                  er11bAutorunSummary: er11bAutorunResults.map(({ label, result }) => ({
                    label,
                    averageFps: result.averageFps,
                    averageFrameTimeMs: result.averageFrameTimeMs,
                    medianFrameTimeMs: result.medianFrameTimeMs,
                    p95FrameTimeMs: result.p95FrameTimeMs,
                    p99FrameTimeMs: result.p99FrameTimeMs,
                    maxFrameTimeMs: result.maxFrameTimeMs,
                    framesOver33_3Ms: result.framesOver33_3Ms,
                    averageRenderCalls: result.averageRenderCalls,
                    maxGeometries: result.maxGeometries,
                    maxTextures: result.maxTextures,
                  })),
                })}
              </output>
            </section>
          )}

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
