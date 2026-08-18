import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import type { EngineRoomReviewView } from "../../camera/engineRoomCamera";
import type { SpatialFocusTarget } from "../../interaction/spatialFocus";
import { EngineRoom } from "./EngineRoom";
import { ProductionEngineRoom } from "./ProductionEngineRoom";
import type { EngineRoomSceneMode } from "./productionSceneContract";

interface EngineRoomRuntimeProps {
  mode: EngineRoomSceneMode;
  visualState: EngineRoomVisualState;
  validationPulseSerial: number;
  focus: SpatialFocusTarget;
  reducedMotion: boolean;
  reviewView: EngineRoomReviewView | null;
  onFocus: (target: Exclude<SpatialFocusTarget, "overview">) => void;
  onClearFocus: () => void;
  onProductionFailure: (message: string) => void;
}

interface ProductionBoundaryProps {
  fallback: ReactNode;
  onFailure: (message: string) => void;
  children: ReactNode;
}

interface ProductionBoundaryState {
  failed: boolean;
}

class ProductionSceneBoundary extends Component<
  ProductionBoundaryProps,
  ProductionBoundaryState
> {
  state: ProductionBoundaryState = { failed: false };

  static getDerivedStateFromError(): ProductionBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    const message = error.message || "ER-09 production scene failed to load.";
    console.error("[ER-09 production fallback]", error);
    this.props.onFailure(message);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function EngineRoomRuntime({
  mode,
  visualState,
  validationPulseSerial,
  focus,
  reducedMotion,
  reviewView,
  onFocus,
  onClearFocus,
  onProductionFailure,
}: EngineRoomRuntimeProps) {
  const legacy = (
    <EngineRoom
      visualState={visualState}
      validationPulseSerial={validationPulseSerial}
      focus={focus}
      reducedMotion={reducedMotion}
      onFocus={onFocus}
      onClearFocus={onClearFocus}
    />
  );

  if (mode === "legacy") return legacy;

  return (
    <ProductionSceneBoundary fallback={legacy} onFailure={onProductionFailure}>
      <Suspense fallback={legacy}>
        <ProductionEngineRoom
          visualState={visualState}
          validationPulseSerial={validationPulseSerial}
          focus={focus}
          reducedMotion={reducedMotion}
          reviewView={reviewView}
          onFocus={onFocus}
          onClearFocus={onClearFocus}
        />
      </Suspense>
    </ProductionSceneBoundary>
  );
}
