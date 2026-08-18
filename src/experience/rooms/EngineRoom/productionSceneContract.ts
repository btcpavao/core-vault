import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import { deriveReactorEnergyState } from "../../energy/reactorEnergyState";

export type EngineRoomSceneMode = "legacy" | "production";
export type ProductionSemanticRole =
  | "architecture"
  | "main-reactor"
  | "secondary-reactor"
  | "main-glass"
  | "secondary-glass"
  | "main-energy"
  | "secondary-energy"
  | "console"
  | "console-screen"
  | "exterior"
  | "interactive";

export interface ProductionSceneSelectionInput {
  development: boolean;
  environmentValue?: string;
  search: string;
}

export interface ProductionSceneValidation {
  valid: boolean;
  missing: string[];
}

export interface ProductionEnergyRuntimeState {
  mainActive: boolean;
  secondaryActive: boolean;
  mainIntensity: number;
  secondaryIntensity: number;
  pulseRate: number;
  animate: boolean;
  mode: "dormant" | "stable" | "syncing";
}

export const PRODUCTION_NODE_CONTRACT = {
  architecture: "CV_Runtime_StaticArchitecture_Group",
  mainReactor: "CV_Runtime_StaticReactor_Group",
  secondaryReactor: "CV_Runtime_SecondaryChamber_Group",
  glass: "CV_Runtime_Glass_Group",
  mainGlass: "CV_Runtime_GlassMain_Glass_Reactor",
  secondaryGlass: "CV_Runtime_GlassSecondary_Glass_Secondary",
  energy: "CV_Runtime_EnergyGuides_Group",
  console: "CV_Runtime_Console_Group",
  consoleScreen: "CV_Runtime_ConsoleScreen",
  exterior: "CV_Runtime_Exterior_Group",
  interactive: "CV_Runtime_Interactive_Group",
  mainEnergyPrefix: "CV_Runtime_EnergyMain_",
  secondaryEnergyPrefix: "CV_Runtime_EnergySecondary_",
} as const;

const REQUIRED_EXACT_NODES = [
  PRODUCTION_NODE_CONTRACT.architecture,
  PRODUCTION_NODE_CONTRACT.mainReactor,
  PRODUCTION_NODE_CONTRACT.secondaryReactor,
  PRODUCTION_NODE_CONTRACT.glass,
  PRODUCTION_NODE_CONTRACT.mainGlass,
  PRODUCTION_NODE_CONTRACT.secondaryGlass,
  PRODUCTION_NODE_CONTRACT.energy,
  PRODUCTION_NODE_CONTRACT.console,
  PRODUCTION_NODE_CONTRACT.consoleScreen,
  PRODUCTION_NODE_CONTRACT.exterior,
  PRODUCTION_NODE_CONTRACT.interactive,
] as const;

export function resolveEngineRoomSceneMode({
  development,
  environmentValue,
  search,
}: ProductionSceneSelectionInput): EngineRoomSceneMode {
  const queryValue = development
    ? new URLSearchParams(search).get("engineRoom")
    : null;

  if (queryValue === "legacy") return "legacy";
  if (queryValue === "production") return "production";
  return environmentValue === "1" || environmentValue === "production"
    ? "production"
    : "legacy";
}

export function validateProductionNodeNames(
  names: Iterable<string>,
): ProductionSceneValidation {
  const available = new Set(names);
  const missing: string[] = REQUIRED_EXACT_NODES.filter((name) => !available.has(name));
  const mainEnergyCount = [...available].filter((name) =>
    name.startsWith(PRODUCTION_NODE_CONTRACT.mainEnergyPrefix),
  ).length;
  const secondaryEnergyCount = [...available].filter((name) =>
    name.startsWith(PRODUCTION_NODE_CONTRACT.secondaryEnergyPrefix),
  ).length;

  if (mainEnergyCount < 4) {
    missing.push(`${PRODUCTION_NODE_CONTRACT.mainEnergyPrefix}* (expected at least 4)`);
  }
  if (secondaryEnergyCount < 2) {
    missing.push(`${PRODUCTION_NODE_CONTRACT.secondaryEnergyPrefix}* (expected at least 2)`);
  }

  return { valid: missing.length === 0, missing };
}

export function productionSemanticRole(name: string): ProductionSemanticRole | null {
  if (name === PRODUCTION_NODE_CONTRACT.consoleScreen) return "console-screen";
  if (name === PRODUCTION_NODE_CONTRACT.mainGlass) return "main-glass";
  if (name === PRODUCTION_NODE_CONTRACT.secondaryGlass) return "secondary-glass";
  if (name.startsWith(PRODUCTION_NODE_CONTRACT.mainEnergyPrefix)) return "main-energy";
  if (name.startsWith(PRODUCTION_NODE_CONTRACT.secondaryEnergyPrefix)) {
    return "secondary-energy";
  }
  if (name.startsWith("CV_Runtime_StaticArchitecture_")) return "architecture";
  if (name.startsWith("CV_Runtime_StaticReactor_")) return "main-reactor";
  if (name.startsWith("CV_Runtime_SecondaryChamber_")) return "secondary-reactor";
  if (name.startsWith("CV_Runtime_Console_")) return "console";
  if (name.startsWith("CV_Runtime_Exterior_")) return "exterior";
  if (name.startsWith("CV_Runtime_Interactive_")) return "interactive";
  return null;
}

export function deriveProductionEnergyRuntimeState(
  visualState: EngineRoomVisualState,
  reducedMotion: boolean,
): ProductionEnergyRuntimeState {
  const energy = deriveReactorEnergyState(visualState);
  const mainActive = energy.coreActive;
  const secondaryActive = energy.networkFlowActive;

  return {
    mainActive,
    secondaryActive,
    mainIntensity: mainActive
      ? energy.mode === "syncing"
        ? 3.4
        : 2.7
      : 0,
    secondaryIntensity: secondaryActive
      ? energy.mode === "syncing"
        ? 2.05
        : 1.45
      : 0,
    pulseRate: energy.mode === "syncing" ? 2.2 : 0.72,
    animate: mainActive && !reducedMotion,
    mode: energy.mode,
  };
}

export type ProductionMaterialFamily =
  | "bronze-main"
  | "bronze-dark"
  | "bronze-machined"
  | "engineering-dark"
  | "engineering-machined"
  | "stone-warm"
  | "stone-floor"
  | "stone-recess"
  | "console"
  | "practical"
  | "vegetation"
  | "exterior"
  | "energy"
  | "glass"
  | "other";

export function productionMaterialFamily(name: string): ProductionMaterialFamily {
  if (name.includes("Glass")) return "glass";
  if (name.includes("Energy")) return "energy";
  if (name === "CV_Mat_Bronze_Main") return "bronze-main";
  if (name === "CV_Mat_Bronze_AgedDark") return "bronze-dark";
  if (name === "CV_Mat_Bronze_Machined" || name === "CV_Mat_Console_Trim") {
    return "bronze-machined";
  }
  if (name === "CV_Mat_Internal_Machined") return "engineering-machined";
  if (name.includes("Metal_Blackened") || name.includes("Internal_DarkSteel")) {
    return "engineering-dark";
  }
  if (name.includes("Floor") || name.includes("Platform")) return "stone-floor";
  if (name.includes("Recess") || name.includes("Ceiling_Deep")) return "stone-recess";
  if (name.includes("Stone") || name.includes("Ceiling_Warm")) return "stone-warm";
  if (name.includes("Console")) return "console";
  if (name.includes("Practical")) return "practical";
  if (name.includes("Vegetation")) return "vegetation";
  if (name.includes("ExteriorMatte")) return "exterior";
  return "other";
}
