import { describe, expect, it } from "vitest";
import type { EngineRoomVisualState } from "../../src/experience/adapters/nodeVisualState";
import {
  INITIAL_BLOCK_PULSE_STATE,
  deriveReactorEnergyState,
  reduceBlockPulse,
} from "../../src/experience/energy/reactorEnergyState";

const state = (
  overrides: Partial<EngineRoomVisualState> = {},
): EngineRoomVisualState => ({
  connection: "online",
  chain: "regtest",
  syncProgress: 1,
  blockHeight: 121,
  peerCount: 0,
  networkActive: true,
  activity: "ready",
  ...overrides,
});

describe("Reactor energy projection", () => {
  it("maps unavailable Core to faint dormant energy", () => {
    expect(
      deriveReactorEnergyState(
        state({ connection: "offline", activity: "attention", networkActive: null }),
      ),
    ).toMatchObject({
      mode: "dormant",
      coreActive: false,
      networkFlowActive: false,
      blueIntensity: 0.028,
      goldBaseline: 0,
    });
  });

  it("maps syncing to active, turbulent blue energy", () => {
    const energy = deriveReactorEnergyState(
      state({ activity: "syncing", syncProgress: 0.42 }),
    );

    expect(energy.mode).toBe("syncing");
    expect(energy.blueIntensity).toBeGreaterThan(1);
    expect(energy.turbulence).toBeGreaterThan(0.16);
    expect(energy.goldBaseline).toBe(0);
  });

  it("maps ready to calmer stable blue energy", () => {
    const energy = deriveReactorEnergyState(state());

    expect(energy.mode).toBe("stable");
    expect(energy.coreActive).toBe(true);
    expect(energy.flowRate).toBeLessThan(0.1);
    expect(energy.goldBaseline).toBe(0);
  });

  it("keeps the local Reactor alive while external network conduits are inactive", () => {
    expect(deriveReactorEnergyState(state({ networkActive: false }))).toMatchObject({
      mode: "stable",
      coreActive: true,
      networkFlowActive: false,
    });
  });
});

describe("real block validation pulse", () => {
  it("does not pulse on baseline or unchanged height and pulses once on an increase", () => {
    const baseline = reduceBlockPulse(INITIAL_BLOCK_PULSE_STATE, 121);
    expect(baseline.pulseSerial).toBe(0);

    const unchanged = reduceBlockPulse(baseline, 121);
    expect(unchanged).toBe(baseline);

    const increased = reduceBlockPulse(unchanged, 122);
    expect(increased.pulseSerial).toBe(1);

    const sameReadingAgain = reduceBlockPulse(increased, 122);
    expect(sameReadingAgain).toBe(increased);
    expect(sameReadingAgain.pulseSerial).toBe(1);
  });

  it("does not invent a pulse for missing or lower replacement heights", () => {
    const baseline = reduceBlockPulse(INITIAL_BLOCK_PULSE_STATE, 121);
    expect(reduceBlockPulse(baseline, null)).toBe(baseline);
    expect(reduceBlockPulse(baseline, 100).pulseSerial).toBe(0);
  });
});
