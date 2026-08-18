import type { EngineRoomVisualState } from "../adapters/nodeVisualState";

export type ReactorEnergyMode = "dormant" | "syncing" | "stable";

export interface ReactorEnergyState {
  mode: ReactorEnergyMode;
  coreActive: boolean;
  networkFlowActive: boolean;
  blueIntensity: number;
  flowRate: number;
  turbulence: number;
  goldBaseline: number;
}

export function deriveReactorEnergyState(
  visualState: EngineRoomVisualState,
): ReactorEnergyState {
  const coreActive = visualState.connection === "online";
  const syncing = coreActive && visualState.activity === "syncing";
  const stable = coreActive && visualState.activity === "ready";
  const progress = visualState.syncProgress ?? 0;

  return {
    mode: syncing ? "syncing" : stable ? "stable" : "dormant",
    coreActive,
    networkFlowActive: coreActive && visualState.networkActive === true,
    blueIntensity: syncing ? 1.22 : stable ? 1.02 : 0.028,
    flowRate: syncing ? 0.24 : stable ? 0.072 : 0,
    turbulence: syncing ? 0.12 + (1 - progress) * 0.12 : stable ? 0.035 : 0.01,
    goldBaseline: 0,
  };
}

export interface BlockPulseState {
  observedBlockHeight: number | null;
  pulseSerial: number;
}

export const INITIAL_BLOCK_PULSE_STATE: BlockPulseState = {
  observedBlockHeight: null,
  pulseSerial: 0,
};

/**
 * A first observation establishes the baseline. Only a later, real increase in
 * the node-reported height advances the pulse serial, exactly once per reading.
 */
export function reduceBlockPulse(
  state: BlockPulseState,
  observedBlockHeight: number | null,
): BlockPulseState {
  if (observedBlockHeight === null) return state;
  if (state.observedBlockHeight === observedBlockHeight) return state;

  return {
    observedBlockHeight,
    pulseSerial:
      state.observedBlockHeight !== null && observedBlockHeight > state.observedBlockHeight
        ? state.pulseSerial + 1
        : state.pulseSerial,
  };
}
