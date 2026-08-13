export type SpatialFocusTarget = "overview" | "reactor" | "network-console";

export type SpatialFocusAction =
  | { type: "focus"; target: Exclude<SpatialFocusTarget, "overview"> }
  | { type: "back" };

export const INITIAL_SPATIAL_FOCUS: SpatialFocusTarget = "overview";

/**
 * Keeps spatial navigation semantic and independent from cameras or R3F objects.
 * A back action is deliberately idempotent so Escape and background clicks share
 * one predictable route to the neutral room overview.
 */
export function reduceSpatialFocus(
  _current: SpatialFocusTarget,
  action: SpatialFocusAction,
): SpatialFocusTarget {
  return action.type === "back" ? "overview" : action.target;
}

export const hasSpatialFocus = (target: SpatialFocusTarget) => target !== "overview";
