import { Component, Suspense, useMemo, type ErrorInfo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import type { Group, Material, Mesh } from "three";
import type { EngineRoomConnection } from "../../../adapters/nodeVisualState";
import { ENGINE_ROOM_ASSETS } from "../../../assets/assetManifest";
import {
  BronzeMaterial,
  clonePolishedAuthoredMaterial,
  EnergyMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
} from "../../../materials/WorldMaterials";

function CoolingManifoldFallback({ muted = false }: { muted?: boolean }) {
  return (
    <group name="cooling-manifold-procedural-fallback">
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.08, 1.2, 0.44, 32]} />
        <LimestoneMaterial tone={muted ? "shadow" : "base"} surface="hero" />
      </mesh>
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.72, 2.05, 32]} />
        <TechnicalGlassMaterial opacity={0.27} />
      </mesh>
      {[0.39, 1.42, 2.45].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.1, 12, 40]} />
          <BronzeMaterial finish="structural" />
        </mesh>
      ))}
    </group>
  );
}

interface LocalAssetBoundaryState {
  failed: boolean;
}

class LocalAssetBoundary extends Component<{ children: ReactNode }, LocalAssetBoundaryState> {
  state: LocalAssetBoundaryState = { failed: false };

  static getDerivedStateFromError(): LocalAssetBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // This passive art asset has no authority over NodeStatus or Bitcoin Core.
  }

  render() {
    return this.state.failed ? <CoolingManifoldFallback /> : this.props.children;
  }
}

function CoolingManifoldModel() {
  const { scene } = useGLTF(ENGINE_ROOM_ASSETS.coolingManifold.path);
  const model = useMemo(() => {
    const cloned = scene.clone(true) as Group;
    const materialCopies = new Map<Material, Material>();
    const polishMaterial = (source: Material) => {
      const existing = materialCopies.get(source);
      if (existing) return existing;
      const polished = clonePolishedAuthoredMaterial(source);
      materialCopies.set(source, polished);
      return polished;
    };

    cloned.traverse((child) => {
      if (!("isMesh" in child) || !child.isMesh) return;
      const mesh = child as Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(polishMaterial)
        : polishMaterial(mesh.material);
    });
    return cloned;
  }, [scene]);

  return <primitive object={model} />;
}

export function CoolingManifold() {
  return (
    <group position={[3.65, 0, -2.28]} rotation={[0, -0.28, 0]} scale={ENGINE_ROOM_ASSETS.coolingManifold.scaleMeters}>
      <LocalAssetBoundary>
        <Suspense fallback={<CoolingManifoldFallback muted />}>
          <CoolingManifoldModel />
        </Suspense>
      </LocalAssetBoundary>
    </group>
  );
}

export function CoolingManifoldEnergy({
  connection,
  active,
}: {
  connection: EngineRoomConnection;
  active: boolean;
}) {
  return (
    <group position={[3.65, 0, -2.28]} rotation={[0, -0.28, 0]} name="cooling-manifold-energy">
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.78, 24]} />
        <EnergyMaterial connection={connection} active={active} intensity={0.72} />
      </mesh>
      {[0.78, 1.42, 2.06].map((height) => (
        <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.018, 6, 40]} />
          <EnergyMaterial connection={connection} active={active} intensity={0.48} />
        </mesh>
      ))}
      <pointLight
        position={[0, 1.42, 0]}
        color="#43bce9"
        intensity={active ? 2.2 : 0.08}
        distance={2.8}
        decay={2}
      />
    </group>
  );
}

useGLTF.preload(ENGINE_ROOM_ASSETS.coolingManifold.path);
