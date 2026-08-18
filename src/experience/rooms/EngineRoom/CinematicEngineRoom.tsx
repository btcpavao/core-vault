import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import type { SpatialFocusTarget } from "../../interaction/spatialFocus";
import {
  CINEMATIC_SCENE_ASSETS,
  cinematicPlateForPulse,
  deriveCinematicSceneState,
  type CinematicReviewState,
  type CinematicScenePlate,
} from "./cinematicSceneContract";

interface CinematicEngineRoomProps {
  visualState: EngineRoomVisualState;
  validationPulseSerial: number;
  focus: SpatialFocusTarget;
  reducedMotion: boolean;
  reviewState: CinematicReviewState;
  onFocus: (target: Exclude<SpatialFocusTarget, "overview">) => void;
  onClearFocus: () => void;
  onPresentationFailure: (message: string) => void;
}

const PLATES = Object.keys(CINEMATIC_SCENE_ASSETS) as CinematicScenePlate[];
const FULL_PULSE_MS = 1_250;
const REDUCED_PULSE_MS = 360;

export function CinematicEngineRoom({
  visualState,
  validationPulseSerial,
  focus,
  reducedMotion,
  reviewState,
  onFocus,
  onClearFocus,
  onPresentationFailure,
}: CinematicEngineRoomProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousPulseRef = useRef(validationPulseSerial);
  const [pulseActive, setPulseActive] = useState(reviewState === "new-block");
  const [hovered, setHovered] = useState<SpatialFocusTarget>("overview");
  const semanticState = useMemo(
    () => deriveCinematicSceneState(visualState, reducedMotion),
    [reducedMotion, visualState],
  );
  const reviewPulseHeld = reviewState === "new-block";
  const activePlate: CinematicScenePlate = cinematicPlateForPulse(
    semanticState.plate,
    pulseActive,
  );

  useEffect(() => {
    if (reviewPulseHeld) {
      setPulseActive(true);
      previousPulseRef.current = validationPulseSerial;
      return;
    }
    if (validationPulseSerial === previousPulseRef.current) return;
    previousPulseRef.current = validationPulseSerial;
    setPulseActive(true);
    const timer = window.setTimeout(
      () => setPulseActive(false),
      reducedMotion ? REDUCED_PULSE_MS : FULL_PULSE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion, reviewPulseHeld, validationPulseSerial]);

  const moveDepth = (event: PointerEvent<HTMLDivElement>) => {
    if (!semanticState.continuousDepth || focus !== "overview") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    rootRef.current?.style.setProperty("--cinematic-depth-x", `${(-x * 5).toFixed(2)}px`);
    rootRef.current?.style.setProperty("--cinematic-depth-y", `${(-y * 3).toFixed(2)}px`);
  };

  const resetDepth = () => {
    rootRef.current?.style.setProperty("--cinematic-depth-x", "0px");
    rootRef.current?.style.setProperty("--cinematic-depth-y", "0px");
    setHovered("overview");
  };

  return (
    <div
      ref={rootRef}
      className="cinematic-engine-room"
      data-plate={activePlate}
      data-focus={focus}
      data-hover={hovered}
      data-review-state={reviewState ?? undefined}
      style={{ "--cinematic-transition-ms": `${semanticState.transitionMs}ms` } as CSSProperties}
      onPointerMove={moveDepth}
      onPointerLeave={resetDepth}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClearFocus();
      }}
    >
      <div className="cinematic-engine-room__plates" aria-hidden="true">
        {PLATES.map((plate) => (
          <img
            key={plate}
            className={`cinematic-engine-room__plate${plate === activePlate ? " is-active" : ""}`}
            src={CINEMATIC_SCENE_ASSETS[plate]}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority={plate === semanticState.plate ? "high" : "low"}
            onError={() =>
              onPresentationFailure(`Local cinematic Engine Room plate failed to load: ${plate}`)
            }
          />
        ))}
      </div>

      <button
        id="cinematic-reactor-control"
        className="cinematic-engine-room__hit cinematic-engine-room__hit--reactor"
        type="button"
        aria-label={`Inspect Core Reactor. ${pulseActive ? "New block validated." : semanticState.status}.`}
        aria-pressed={focus === "reactor"}
        aria-controls="engine-room-precision-panel"
        onPointerEnter={() => setHovered("reactor")}
        onPointerLeave={() => setHovered("overview")}
        onClick={(event) => {
          event.stopPropagation();
          onFocus("reactor");
        }}
      >
        <span className="experience-visually-hidden">Inspect Core Reactor</span>
      </button>

      <button
        id="cinematic-network-console-control"
        className="cinematic-engine-room__hit cinematic-engine-room__hit--network"
        type="button"
        aria-label="Inspect Network Console"
        aria-pressed={focus === "network-console"}
        aria-controls="engine-room-precision-panel"
        onPointerEnter={() => setHovered("network-console")}
        onPointerLeave={() => setHovered("overview")}
        onClick={(event) => {
          event.stopPropagation();
          onFocus("network-console");
        }}
      >
        <span className="experience-visually-hidden">Inspect Network Console</span>
      </button>

      <p className="experience-visually-hidden" aria-live="polite">
        {pulseActive ? "New block validated" : semanticState.status}
      </p>
    </div>
  );
}
