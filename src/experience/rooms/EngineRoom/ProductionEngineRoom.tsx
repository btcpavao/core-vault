import { useEffect, useMemo, useRef, useState } from "react";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  FrontSide,
  LinearFilter,
  LightProbe,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  Sprite,
  SphericalHarmonics3,
  SRGBColorSpace,
  Vector2,
} from "three";
import type { EngineRoomVisualState } from "../../adapters/nodeVisualState";
import type { EngineRoomReviewView } from "../../camera/engineRoomCamera";
import { CuratedCameraRig } from "../../camera/CuratedCameraRig";
import type { SpatialFocusTarget } from "../../interaction/spatialFocus";
import { SpatialHitTarget } from "../../interaction/SpatialHitTarget";
import { ENGINE_ROOM_ASSETS } from "../../assets/assetManifest";
import { WORLD_TEXTURES } from "../../materials/proceduralTextures";
import {
  deriveProductionEnergyRuntimeState,
  productionMaterialFamily,
  productionSemanticRole,
  validateProductionNodeNames,
} from "./productionSceneContract";

interface ProductionEngineRoomProps {
  visualState: EngineRoomVisualState;
  validationPulseSerial: number;
  focus: SpatialFocusTarget;
  reducedMotion: boolean;
  reviewView: EngineRoomReviewView | null;
  onFocus: (target: Exclude<SpatialFocusTarget, "overview">) => void;
  onClearFocus: () => void;
}

interface RuntimeScene {
  root: Object3D;
  geometries: Set<BufferGeometry>;
  materials: Set<Material>;
  mainEnergy: MeshStandardMaterial[];
  secondaryEnergy: MeshStandardMaterial[];
  mainAccent: MeshStandardMaterial | null;
}

export interface Er09AssetMetrics {
  path: string;
  resourceDurationMs: number | null;
  transferSizeBytes: number | null;
  decodedBodySizeBytes: number | null;
  modelReadySinceNavigationMs: number;
  firstRenderSinceNavigationMs: number | null;
}

export interface Er11LifecycleCounters {
  productionMounts: number;
  productionUnmounts: number;
  runtimeScenesBuilt: number;
  consoleSurfacesCreated: number;
  consoleTexturesDisposed: number;
  runtimeGeometriesDisposed: number;
  runtimeMaterialsDisposed: number;
  environmentMounts: number;
  environmentUnmounts: number;
  lightProbeMounts: number;
  lightProbeUnmounts: number;
}

declare global {
  interface Window {
    __CV_ER09_ASSET__?: Er09AssetMetrics;
    __CV_ER11_LIFECYCLE__?: Er11LifecycleCounters;
  }
}

const MAIN_BLUE = new Color("#31b8ff");
const MAIN_BLUE_SURFACE = new Color("#0b72b8");
const SECONDARY_BLUE = new Color("#238fd4");
const SECONDARY_SURFACE = new Color("#0c4a75");
const DORMANT = new Color("#050b0e");
const BLOCK_GOLD = new Color("#e7a744");
const BRONZE_NORMAL_SCALE = new Vector2(0.34, 0.34);
const STONE_NORMAL_SCALE = new Vector2(0.22, 0.22);
const FLOOR_NORMAL_SCALE = new Vector2(0.3, 0.3);
const PULSE_SECONDS = 1.35;
const STATIC_INDIRECT_ENABLED = import.meta.env.VITE_CV_ER10B_STATIC_INDIRECT !== "0";
const SELECTIVE_SHADOWS_ENABLED = import.meta.env.VITE_CV_ER10B_SHADOWS !== "0";
const LOCAL_ENVIRONMENT_ENABLED = import.meta.env.VITE_CV_ER11_ENVIRONMENT !== "0";
const ER11_QA_ENABLED = import.meta.env.VITE_CV_ER10B_QA === "1";
const ER11_LIFECYCLE_INITIAL: Er11LifecycleCounters = {
  productionMounts: 0,
  productionUnmounts: 0,
  runtimeScenesBuilt: 0,
  consoleSurfacesCreated: 0,
  consoleTexturesDisposed: 0,
  runtimeGeometriesDisposed: 0,
  runtimeMaterialsDisposed: 0,
  environmentMounts: 0,
  environmentUnmounts: 0,
  lightProbeMounts: 0,
  lightProbeUnmounts: 0,
};

function incrementEr11Lifecycle(
  key: keyof Er11LifecycleCounters,
  amount = 1,
) {
  if (!ER11_QA_ENABLED) return;
  const counters = window.__CV_ER11_LIFECYCLE__ ?? { ...ER11_LIFECYCLE_INITIAL };
  counters[key] += amount;
  window.__CV_ER11_LIFECYCLE__ = counters;
  window.dispatchEvent(new CustomEvent("cv:er11-lifecycle-counters", { detail: counters }));
}

function createEnergyGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Energy glow canvas is unavailable");
  const gradient = context.createRadialGradient(96, 96, 3, 96, 96, 92);
  gradient.addColorStop(0, "rgba(210,246,255,1)");
  gradient.addColorStop(0.14, "rgba(55,186,255,0.94)");
  gradient.addColorStop(0.46, "rgba(24,126,222,0.32)");
  gradient.addColorStop(1, "rgba(0,74,170,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 192, 192);
  const texture = new CanvasTexture(canvas);
  texture.name = "CV_ER12A_EnergyGlow";
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createConsoleSurface() {
  incrementEr11Lifecycle("consoleSurfacesCreated");
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const texture = new CanvasTexture(canvas);
  texture.name = "CV_ER09_RuntimeConsoleTexture";
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  const material = new MeshStandardMaterial({
    name: "CV_ER09_RuntimeConsoleMaterial",
    color: "#ffffff",
    map: texture,
    emissive: "#0c3340",
    emissiveMap: texture,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.08,
    toneMapped: true,
  });
  return { canvas, texture, material };
}

function drawConsole(
  canvas: HTMLCanvasElement,
  material: MeshStandardMaterial,
  visualState: EngineRoomVisualState,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const online = visualState.connection === "online";
  const active = online && visualState.networkActive === true;
  const accent = active ? "#53d7f5" : online ? "#87aab1" : "#44565b";
  const text = online ? "#d9eef0" : "#8b999c";
  const muted = online ? "#779aa1" : "#526166";

  const gradient = context.createLinearGradient(0, 0, 1024, 512);
  gradient.addColorStop(0, "#061116");
  gradient.addColorStop(1, "#0b1d22");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 512);
  context.strokeStyle = "rgba(118, 210, 226, 0.16)";
  context.lineWidth = 2;
  for (let x = 48; x < 1024; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 512);
    context.stroke();
  }

  context.fillStyle = accent;
  context.font = "600 26px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("CORE VAULT / NETWORK CONSOLE", 58, 64);
  context.fillStyle = muted;
  context.font = "500 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(online ? "LOCAL BITCOIN CORE" : "STANDBY — CORE UNAVAILABLE", 58, 104);

  const rows = [
    ["CONNECTION", visualState.connection.toUpperCase()],
    ["CHAIN", visualState.chain?.toUpperCase() ?? "UNKNOWN"],
    ["BLOCK", visualState.blockHeight?.toLocaleString() ?? "UNKNOWN"],
    [
      "SYNC",
      visualState.syncProgress === null
        ? "UNKNOWN"
        : `${(visualState.syncProgress * 100).toFixed(2)}%`,
    ],
    [
      "NETWORK",
      visualState.networkActive === null
        ? "UNKNOWN"
        : visualState.networkActive
          ? "ENABLED"
          : "DISABLED",
    ],
  ] as const;

  context.font = "500 23px ui-monospace, SFMono-Regular, Menlo, monospace";
  rows.forEach(([label, value], index) => {
    const y = 174 + index * 58;
    context.fillStyle = muted;
    context.fillText(label, 58, y);
    context.fillStyle = text;
    context.fillText(value, 360, y);
    context.fillStyle = "rgba(255,255,255,0.08)";
    context.fillRect(58, y + 18, 856, 1);
  });

  material.emissive.set(accent);
  material.emissiveIntensity = active ? 0.34 : online ? 0.2 : 0.08;
  material.map!.needsUpdate = true;
}

function tuneStandardMaterial(material: MeshStandardMaterial) {
  const family = productionMaterialFamily(material.name);
  material.envMapIntensity = 1.18;

  switch (family) {
    case "bronze-main":
      material.color.set("#8a6040");
      material.map = WORLD_TEXTURES.bronze.baseColor;
      material.roughnessMap = WORLD_TEXTURES.bronze.roughness;
      material.normalMap = WORLD_TEXTURES.bronze.normal;
      material.normalScale.copy(BRONZE_NORMAL_SCALE);
      material.metalnessMap = WORLD_TEXTURES.bronze.metalness;
      material.metalness = 0.82;
      material.roughness = 0.37;
      material.envMapIntensity = 1.2;
      break;
    case "bronze-dark":
      material.color.set("#533a29");
      material.map = WORLD_TEXTURES.bronze.baseColor;
      material.roughnessMap = WORLD_TEXTURES.bronze.roughness;
      material.normalMap = WORLD_TEXTURES.bronze.normal;
      material.normalScale.copy(BRONZE_NORMAL_SCALE).multiplyScalar(0.72);
      material.metalnessMap = WORLD_TEXTURES.bronze.metalness;
      material.metalness = 0.78;
      material.roughness = 0.44;
      material.envMapIntensity = 1.05;
      break;
    case "bronze-machined":
      material.color.set("#9a7248");
      material.map = WORLD_TEXTURES.bronze.baseColor;
      material.roughnessMap = WORLD_TEXTURES.bronze.roughness;
      material.normalMap = WORLD_TEXTURES.bronze.normal;
      material.normalScale.copy(BRONZE_NORMAL_SCALE).multiplyScalar(0.48);
      material.metalnessMap = WORLD_TEXTURES.bronze.metalness;
      material.metalness = 0.88;
      material.roughness = 0.3;
      material.envMapIntensity = 1.25;
      break;
    case "engineering-dark":
      material.color.set("#252c2f");
      material.metalness = 0.74;
      material.roughness = 0.38;
      material.envMapIntensity = 1.58;
      break;
    case "engineering-machined":
      material.color.set("#3a4142");
      material.metalness = 0.9;
      material.roughness = 0.23;
      material.envMapIntensity = 1.66;
      break;
    case "stone-warm":
      material.color.set("#cbb99f");
      material.map = WORLD_TEXTURES.limestone.baseColor;
      material.roughnessMap = WORLD_TEXTURES.limestone.roughness;
      material.normalMap = WORLD_TEXTURES.limestone.normal;
      material.normalScale.copy(STONE_NORMAL_SCALE);
      material.metalness = 0;
      material.roughness = 0.78;
      material.envMapIntensity = 0.78;
      break;
    case "stone-floor":
      material.color.set("#c5b59f");
      material.map = WORLD_TEXTURES.floor.baseColor;
      material.roughnessMap = WORLD_TEXTURES.floor.roughness;
      material.normalMap = WORLD_TEXTURES.floor.normal;
      material.normalScale.copy(FLOOR_NORMAL_SCALE);
      material.metalness = 0;
      material.roughness = 0.7;
      material.envMapIntensity = 0.82;
      break;
    case "stone-recess":
      material.color.set("#74695b");
      material.map = WORLD_TEXTURES.limestoneHero.baseColor;
      material.roughnessMap = WORLD_TEXTURES.limestoneHero.roughness;
      material.normalMap = WORLD_TEXTURES.limestoneHero.normal;
      material.normalScale.copy(STONE_NORMAL_SCALE).multiplyScalar(0.7);
      material.metalness = 0;
      material.roughness = 0.82;
      material.envMapIntensity = 0.52;
      break;
    case "console":
      material.color.set("#182226");
      material.metalness = 0.54;
      material.roughness = 0.4;
      break;
    case "practical":
      material.color.set("#bd8148");
      material.emissive.set("#ffc16c");
      material.emissiveIntensity = 0.88;
      break;
    case "vegetation":
      material.color.set("#34412d");
      material.roughness = 0.88;
      material.metalness = 0;
      break;
    case "exterior":
      material.color.set("#c6d0cf");
      material.roughness = 1;
      material.metalness = 0;
      material.envMapIntensity = 0;
      material.emissive.set("#526b78");
      material.emissiveIntensity = 0.16;
      if (material.map) {
        material.map.repeat.set(1, 0.82);
        material.map.offset.set(0, 0.02);
        material.map.needsUpdate = true;
      }
      break;
    default:
      break;
  }
  material.needsUpdate = true;
}

function buildRuntimeScene(
  source: Object3D,
  consoleMaterial: MeshStandardMaterial,
): RuntimeScene {
  incrementEr11Lifecycle("runtimeScenesBuilt");
  const names: string[] = [];
  source.traverse((object) => names.push(object.name));
  const validation = validateProductionNodeNames(names);
  if (!validation.valid) {
    throw new Error(`ER-09 production asset is missing: ${validation.missing.join(", ")}`);
  }

  const root = source.clone(true);
  root.name = "CV_ER09_ProductionEngineRoom";
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const materialCache = new Map<string, Material>();
  const mainEnergy: MeshStandardMaterial[] = [];
  const secondaryEnergy: MeshStandardMaterial[] = [];
  let mainAccent: MeshStandardMaterial | null = null;

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const role = productionSemanticRole(object.name);
    if (role === "console-screen") {
      const geometry = object.geometry.clone();
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      const position = geometry.attributes.position;
      if (bounds && position) {
        const width = Math.max(0.0001, bounds.max.x - bounds.min.x);
        const height = Math.max(0.0001, bounds.max.y - bounds.min.y);
        const uv = new Float32Array(position.count * 2);
        for (let index = 0; index < position.count; index += 1) {
          uv[index * 2] = (position.getX(index) - bounds.min.x) / width;
          uv[index * 2 + 1] = (position.getY(index) - bounds.min.y) / height;
        }
        geometry.setAttribute("uv", new BufferAttribute(uv, 2));
      }
      object.geometry = geometry;
      geometries.add(geometry);
    }
    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const runtimeMaterials = sourceMaterials.map((sourceMaterial) => {
      if (role === "console-screen") return consoleMaterial;
      const cacheKey = `${sourceMaterial.uuid}:${role ?? "static"}`;
      const cached = materialCache.get(cacheKey);
      if (cached) return cached;

      let runtimeMaterial: Material;
      if (role === "main-glass" || role === "secondary-glass") {
        runtimeMaterial = new MeshPhysicalMaterial({
          name: sourceMaterial.name,
          color: role === "main-glass" ? "#b8d3d6" : "#9dbbc2",
          metalness: 0,
          roughness: role === "main-glass" ? 0.09 : 0.14,
          roughnessMap: WORLD_TEXTURES.glassRoughness,
          transmission: 0,
          thickness: role === "main-glass" ? 0.24 : 0.16,
          ior: 1.47,
          transparent: true,
          opacity: role === "main-glass" ? 0.17 : 0.13,
          depthWrite: false,
          depthTest: true,
          side: FrontSide,
          envMapIntensity: role === "main-glass" ? 1.62 : 1.4,
          clearcoat: 1,
          clearcoatRoughness: role === "main-glass" ? 0.1 : 0.14,
          reflectivity: 0.72,
        });
      } else {
        runtimeMaterial = sourceMaterial.clone();
        if (runtimeMaterial instanceof MeshStandardMaterial) {
          if (role === "main-energy" || role === "secondary-energy") {
            runtimeMaterial.transparent = true;
            runtimeMaterial.depthWrite = false;
            runtimeMaterial.blending = AdditiveBlending;
            runtimeMaterial.side = FrontSide;
            runtimeMaterial.toneMapped = false;
            runtimeMaterial.metalness = 0.02;
            runtimeMaterial.roughness = 0.24;
            runtimeMaterial.opacity = 0.08;
            runtimeMaterial.color.copy(DORMANT);
            runtimeMaterial.emissive.copy(DORMANT);
            runtimeMaterial.emissiveIntensity = 0;
          } else {
            tuneStandardMaterial(runtimeMaterial);
          }
        }
      }

      materialCache.set(cacheKey, runtimeMaterial);
      materials.add(runtimeMaterial);
      return runtimeMaterial;
    });

    object.material = Array.isArray(object.material)
      ? runtimeMaterials
      : runtimeMaterials[0];
    object.receiveShadow = role !== "main-energy" && role !== "secondary-energy";
    object.castShadow = SELECTIVE_SHADOWS_ENABLED && (
      role === "main-reactor" ||
      role === "secondary-reactor" ||
      role === "console" ||
      role === "interactive"
    );
    if (role === "main-glass") object.renderOrder = 3;
    if (role === "secondary-glass") object.renderOrder = 2;
    if (role === "main-energy") {
      object.renderOrder = 4;
      runtimeMaterials.forEach((material) => {
        if (material instanceof MeshStandardMaterial && !mainEnergy.includes(material)) {
          mainEnergy.push(material);
          if (!mainAccent || material.name.includes("HotCore")) mainAccent = material;
        }
      });
    }
    if (role === "secondary-energy") {
      object.renderOrder = 4;
      runtimeMaterials.forEach((material) => {
        if (material instanceof MeshStandardMaterial && !secondaryEnergy.includes(material)) {
          secondaryEnergy.push(material);
        }
      });
    }
  });

  return { root, geometries, materials, mainEnergy, secondaryEnergy, mainAccent };
}

function ProductionEnvironment() {
  useEffect(() => {
    incrementEr11Lifecycle("environmentMounts");
    return () => incrementEr11Lifecycle("environmentUnmounts");
  }, []);
  return (
    <Environment background={false} frames={1} resolution={256}>
      <Lightformer
        form="rect"
        color="#ffd59a"
        intensity={1.62}
        position={[-7, 5.2, 4.5]}
        rotation={[0, 0.92, 0]}
        scale={[9, 6, 1]}
      />
      <Lightformer
        form="rect"
        color="#e7f2f0"
        intensity={0.9}
        position={[0, 4.5, 6]}
        rotation={[0, Math.PI, 0]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        form="rect"
        color="#a9c6d2"
        intensity={0.58}
        position={[5.5, 3.4, -5]}
        rotation={[0, -0.9, 0]}
        scale={[4, 4, 1]}
      />
    </Environment>
  );
}

function StaticIndirectLighting() {
  const probe = useMemo(() => {
    const irradiance = new SphericalHarmonics3();
    irradiance.coefficients[0].set(0.88, 0.67, 0.47);
    irradiance.coefficients[1].set(0.07, 0.1, 0.14);
    irradiance.coefficients[2].set(-0.05, -0.035, 0.005);
    irradiance.coefficients[3].set(0.26, 0.15, 0.07);
    return new LightProbe(irradiance, 0.72);
  }, []);

  useEffect(() => {
    incrementEr11Lifecycle("lightProbeMounts");
    return () => incrementEr11Lifecycle("lightProbeUnmounts");
  }, []);

  return STATIC_INDIRECT_ENABLED ? <primitive object={probe} /> : null;
}

/** Canvas-owned resources that must survive room-content re-entry. */
export function ProductionStaticEnvironment() {
  return (
    <>
      {LOCAL_ENVIRONMENT_ENABLED && <ProductionEnvironment />}
      <StaticIndirectLighting />
    </>
  );
}

export function ProductionEngineRoom({
  visualState,
  validationPulseSerial,
  focus,
  reducedMotion,
  reviewView,
  onFocus,
  onClearFocus,
}: ProductionEngineRoomProps) {
  const { scene } = useGLTF(ENGINE_ROOM_ASSETS.productionEngineRoom.path);
  const console = useMemo(createConsoleSurface, []);
  const energyGlowTexture = useMemo(createEnergyGlowTexture, []);
  const runtime = useMemo(
    () => buildRuntimeScene(scene, console.material),
    [console.material, scene],
  );
  const mainLightRef = useRef<PointLight>(null);
  const secondaryLightRef = useRef<PointLight>(null);
  const keyLightRef = useRef<DirectionalLight>(null);
  const mainGlowRef = useRef<Sprite>(null);
  const secondaryGlowRef = useRef<Sprite>(null);
  const keyShadowRef = useRef<DirectionalLight["shadow"] | null>(null);
  const previousPulseSerialRef = useRef(validationPulseSerial);
  const pulseRemainingRef = useRef(0);
  const firstRenderRecordedRef = useRef(false);
  const [reactorHovered, setReactorHovered] = useState(false);
  const [consoleHovered, setConsoleHovered] = useState(false);
  const energy = deriveProductionEnergyRuntimeState(visualState, reducedMotion);

  useEffect(() => {
    incrementEr11Lifecycle("productionMounts");
    return () => incrementEr11Lifecycle("productionUnmounts");
  }, []);

  useEffect(() => {
    drawConsole(console.canvas, console.material, visualState);
  }, [console.canvas, console.material, visualState]);

  useEffect(() => {
    if (validationPulseSerial > previousPulseSerialRef.current) {
      pulseRemainingRef.current = PULSE_SECONDS;
    }
    previousPulseSerialRef.current = validationPulseSerial;
  }, [validationPulseSerial]);

  useEffect(() => {
    const entry = performance
      .getEntriesByType("resource")
      .find((candidate) => candidate.name.endsWith(ENGINE_ROOM_ASSETS.productionEngineRoom.path)) as
      | PerformanceResourceTiming
      | undefined;
    const metrics: Er09AssetMetrics = {
      path: ENGINE_ROOM_ASSETS.productionEngineRoom.path,
      resourceDurationMs: entry?.duration ?? null,
      transferSizeBytes: entry?.transferSize ?? null,
      decodedBodySizeBytes: entry?.decodedBodySize ?? null,
      modelReadySinceNavigationMs: performance.now(),
      firstRenderSinceNavigationMs: null,
    };
    window.__CV_ER09_ASSET__ = metrics;
    window.dispatchEvent(new CustomEvent("cv:er09-asset", { detail: metrics }));
  }, []);

  useEffect(
    () => () => {
      runtime.geometries.forEach((geometry) => geometry.dispose());
      runtime.materials.forEach((material) => material.dispose());
      console.material.dispose();
      console.texture.dispose();
      energyGlowTexture.dispose();
      incrementEr11Lifecycle("runtimeGeometriesDisposed", runtime.geometries.size);
      incrementEr11Lifecycle("runtimeMaterialsDisposed", runtime.materials.size + 1);
      incrementEr11Lifecycle("consoleTexturesDisposed");
    },
    [console.material, console.texture, energyGlowTexture, runtime.geometries, runtime.materials],
  );

  useEffect(
    () => () => {
      const shadow = keyShadowRef.current;
      shadow?.map?.dispose();
      shadow?.mapPass?.dispose();
      if (shadow) {
        shadow.map = null;
        shadow.mapPass = null;
      }
    },
    [],
  );

  useFrame(({ clock }, delta) => {
    if (keyLightRef.current) keyShadowRef.current = keyLightRef.current.shadow;
    if (!firstRenderRecordedRef.current) {
      firstRenderRecordedRef.current = true;
      if (window.__CV_ER09_ASSET__) {
        window.__CV_ER09_ASSET__.firstRenderSinceNavigationMs = performance.now();
        window.dispatchEvent(
          new CustomEvent("cv:er09-asset", { detail: window.__CV_ER09_ASSET__ }),
        );
      }
    }

    pulseRemainingRef.current = Math.max(0, pulseRemainingRef.current - delta);
    const pulseProgress = 1 - pulseRemainingRef.current / PULSE_SECONDS;
    const blockPulse = pulseRemainingRef.current > 0 ? Math.sin(pulseProgress * Math.PI) : 0;
    const breathing = energy.animate
      ? 0.88 + Math.sin(clock.elapsedTime * energy.pulseRate * Math.PI * 2) * 0.12
      : 1;

    runtime.mainEnergy.forEach((material) => {
      material.color.copy(energy.mainActive ? MAIN_BLUE_SURFACE : DORMANT);
      material.emissive.copy(energy.mainActive ? MAIN_BLUE : DORMANT);
      material.emissiveIntensity = energy.mainIntensity * breathing;
      material.opacity = energy.mainActive ? 0.68 : 0.08;
    });
    runtime.secondaryEnergy.forEach((material) => {
      material.color.copy(energy.secondaryActive ? SECONDARY_SURFACE : DORMANT);
      material.emissive.copy(energy.secondaryActive ? SECONDARY_BLUE : DORMANT);
      material.emissiveIntensity = energy.secondaryIntensity * breathing;
      material.opacity = energy.secondaryActive ? 0.52 : 0.06;
    });
    if (runtime.mainAccent && energy.mainActive) {
      runtime.mainAccent.emissive.lerpColors(MAIN_BLUE, BLOCK_GOLD, blockPulse * 0.88);
      runtime.mainAccent.emissiveIntensity = energy.mainIntensity * (1 + blockPulse * 1.4);
    }
    if (mainLightRef.current) {
      mainLightRef.current.intensity = energy.mainActive
        ? (energy.mode === "syncing" ? 3.4 : 2.6) * (1 + blockPulse * 0.28)
        : 0;
    }
    if (secondaryLightRef.current) {
      secondaryLightRef.current.intensity = energy.secondaryActive
        ? energy.mode === "syncing"
          ? 1.45
          : 1.05
        : 0;
    }
    if (mainGlowRef.current) {
      mainGlowRef.current.visible = energy.mainActive;
      const scale = 2.7 * breathing * (1 + blockPulse * 0.1);
      mainGlowRef.current.scale.set(scale, scale * 1.48, 1);
      mainGlowRef.current.material.opacity = energy.mainActive
        ? 0.48 + energy.mainIntensity * 0.065 + blockPulse * 0.12
        : 0;
    }
    if (secondaryGlowRef.current) {
      secondaryGlowRef.current.visible = energy.secondaryActive;
      const scale = 1.32 * breathing;
      secondaryGlowRef.current.scale.set(scale, scale * 1.55, 1);
      secondaryGlowRef.current.material.opacity = energy.secondaryActive
        ? 0.36 + energy.secondaryIntensity * 0.055
        : 0;
    }
  });

  return (
    <>
      <color attach="background" args={["#5c6769"]} />
      <fog attach="fog" args={["#756f65", 25, 58]} />
      <CuratedCameraRig
        focus={focus}
        reducedMotion={reducedMotion}
        reviewView={reviewView}
        production
      />
      <hemisphereLight args={["#e9eee9", "#63554a", 0.48]} />
      <directionalLight
        ref={keyLightRef}
        position={[-9, 11, 8]}
        color="#ffd092"
        intensity={1.02}
        castShadow={SELECTIVE_SHADOWS_ENABLED}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={38}
        shadow-bias={-0.00015}
        shadow-normalBias={0.035}
        shadow-radius={8}
      />
      <directionalLight position={[5, 6, -7]} color="#aac8d5" intensity={0.32} />
      <pointLight
        ref={mainLightRef}
        position={[0, 2.1, -1.8]}
        color="#28aff2"
        intensity={0}
        distance={5.2}
        decay={2}
      />
      <pointLight
        ref={secondaryLightRef}
        position={[4.2, 1.55, -2.35]}
        color="#258dd0"
        intensity={0}
        distance={3.6}
        decay={2}
      />
      <sprite ref={mainGlowRef} position={[0, 2.15, -1.58]} renderOrder={3}>
        <spriteMaterial
          map={energyGlowTexture}
          color="#42bfff"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={secondaryGlowRef} position={[4.2, 1.6, -2.18]} renderOrder={3}>
        <spriteMaterial
          map={energyGlowTexture}
          color="#2d9fe3"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      <primitive object={runtime.root} />
      {(focus === "reactor" || reactorHovered) && (
        <mesh position={[0, 0.05, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.55, 2.62, 72]} />
          <meshBasicMaterial
            color="#45c8ef"
            transparent
            opacity={focus === "reactor" ? 0.7 : 0.3}
            depthWrite={false}
          />
        </mesh>
      )}
      {(focus === "network-console" || consoleHovered) && (
        <mesh position={[-4.1, 0.05, -1.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.37, 56]} />
          <meshBasicMaterial
            color="#45c8ef"
            transparent
            opacity={focus === "network-console" ? 0.68 : 0.28}
            depthWrite={false}
          />
        </mesh>
      )}
      <SpatialHitTarget
        position={[0, 2.1, -1.8]}
        scale={[4.6, 4.8, 4.6]}
        onActivate={() => onFocus("reactor")}
        onHoverChange={setReactorHovered}
      />
      <SpatialHitTarget
        position={[-4.1, 1.15, -1.45]}
        scale={[2.8, 2.3, 2.1]}
        onActivate={() => onFocus("network-console")}
        onHoverChange={setConsoleHovered}
      />
      <mesh
        position={[0, -0.2, 8]}
        visible={false}
        onPointerDown={(event) => {
          event.stopPropagation();
          onClearFocus();
        }}
      >
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}

useGLTF.preload(ENGINE_ROOM_ASSETS.productionEngineRoom.path);
