import { describe, expect, it } from "vitest";
import {
  hasSpatialFocus,
  INITIAL_SPATIAL_FOCUS,
  reduceSpatialFocus,
} from "../../src/experience/interaction/spatialFocus";

describe("Engine Room spatial focus", () => {
  it("starts in Room Overview and selects either authored inspection target", () => {
    expect(INITIAL_SPATIAL_FOCUS).toBe("overview");
    expect(reduceSpatialFocus("overview", { type: "focus", target: "reactor" })).toBe(
      "reactor",
    );
    expect(
      reduceSpatialFocus("reactor", { type: "focus", target: "network-console" }),
    ).toBe("network-console");
  });

  it("uses one idempotent back path for Escape, panel Back, and background clicks", () => {
    expect(reduceSpatialFocus("reactor", { type: "back" })).toBe("overview");
    expect(reduceSpatialFocus("network-console", { type: "back" })).toBe("overview");
    expect(reduceSpatialFocus("overview", { type: "back" })).toBe("overview");
  });

  it("reports focus only for a real inspection target", () => {
    expect(hasSpatialFocus("overview")).toBe(false);
    expect(hasSpatialFocus("reactor")).toBe(true);
    expect(hasSpatialFocus("network-console")).toBe(true);
  });
});
