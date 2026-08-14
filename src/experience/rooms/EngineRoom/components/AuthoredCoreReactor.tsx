import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { MeshStandardMaterial, type Group, type Material, type Mesh } from "three";
import { ENGINE_ROOM_ASSETS } from "../../../assets/assetManifest";
import type { ReactorEnergyState } from "../../../energy/reactorEnergyState";
import {
  BronzeMaterial,
  clonePolishedAuthoredMaterial,
  LimestoneMaterial,
  TechnicalGlassMaterial,
  WORLD_MATERIALS,
} from "../../../materials/WorldMaterials";

interface AuthoredCoreReactorProps {
  energyState: ReactorEnergyState;
  reducedMotion: boolean;
}

function CoreReactorFallback({ energyState }: { energyState: ReactorEnergyState }) {
  const energyColor = energyState.coreActive
    ? WORLD_MATERIALS.energy.active
    : WORLD_MATERIALS.energy.offline;

  return (
    <group name="core-reactor-procedural-fallback">
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.02, 2.22, 0.34, 48]} />
        <LimestoneMaterial tone="base" surface="hero" />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.52, 1.72, 0.24, 48]} />
        <BronzeMaterial finish="structural" />
      </mesh>
      <mesh position={[0, 2.12, 0]} castShadow>
        <cylinderGeometry args={[1.03, 1.03, 2.7, 56, 1, true]} />
        <TechnicalGlassMaterial opacity={0.2} />
      </mesh>
      {[0.8, 1.62, 2.62, 3.48].map((height) => (
        <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.12, 0.095, 12, 48]} />
          <BronzeMaterial finish="structural" />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 1.08, 2.13, Math.sin(angle) * 1.08]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.14, 2.58, 0.2]} />
            <BronzeMaterial finish={index % 2 === 0 ? "structural" : "dark"} />
          </mesh>
        );
      })}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 2.22, 32]} />
        <meshStandardMaterial
          color={energyColor}
          emissive={energyColor}
          emissiveIntensity={energyState.coreActive ? energyState.blueIntensity : 0.025}
          metalness={0.12}
          roughness={0.26}
        />
      </mesh>
    </group>
  );
}

interface ReactorAssetBoundaryState {
  failed: boolean;
}

class ReactorAssetBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ReactorAssetBoundaryState
> {
  state: ReactorAssetBoundaryState = { failed: false };

  static getDerivedStateFromError(): ReactorAssetBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Authored presentation assets have no NodeStatus or Bitcoin Core authority.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function AuthoredCoreReactorModel({
  energyState,
  reducedMotion,
}: AuthoredCoreReactorProps) {
  const { scene } = useGLTF(ENGINE_ROOM_ASSETS.coreReactor.path);
  const { model, energyMaterials, ownedMaterials } = useMemo(() => {
    const cloned = scene.clone(true) as Group;
    const materialCopies = new Map<Material, Material>();
    const animatedMaterials: MeshStandardMaterial[] = [];
    const copies = new Set<Material>();

    const cloneMaterial = (source: Material) => {
      const existing = materialCopies.get(source);
      if (existing) return existing;

      const material = source.name.includes("Energy_Surface")
        ? source.clone()
        : clonePolishedAuthoredMaterial(source);
      materialCopies.set(source, material);
      copies.add(material);

      if (material instanceof MeshStandardMaterial && source.name.includes("Energy_Surface")) {
        material.color.set(WORLD_MATERIALS.energy.offline);
        material.emissive.set(WORLD_MATERIALS.energy.offline);
        material.emissiveIntensity = 0.025;
        material.metalness = 0.12;
        material.roughness = 0.26;
        animatedMaterials.push(material);
      }
      return material;
    };

    cloned.traverse((child) => {
      if (!("isMesh" in child) || !child.isMesh) return;
      const mesh = child as Mesh;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(cloneMaterial)
        : cloneMaterial(mesh.material);
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const glass = materials.some((material) => material.name.includes("Technical_Glass"));
      mesh.castShadow = !glass;
      mesh.receiveShadow = !glass;
      if (glass) mesh.renderOrder = 2;
    });

    return {
      model: cloned,
      energyMaterials: animatedMaterials,
      ownedMaterials: [...copies],
    };
  }, [scene]);

  useEffect(
    () => () => {
      ownedMaterials.forEach((material) => material.dispose());
    },
    [ownedMaterials],
  );

  useEffect(() => {
    const color = energyState.coreActive
      ? WORLD_MATERIALS.energy.active
      : WORLD_MATERIALS.energy.offline;
    energyMaterials.forEach((material) => {
      material.color.set(color);
      material.emissive.set(color);
    });
  }, [energyMaterials, energyState.coreActive]);

  useFrame(({ clock }) => {
    const cadence = energyState.mode === "syncing" ? 1.35 : 0.48;
    const breathing = reducedMotion ? 0 : Math.sin(clock.elapsedTime * cadence) * 0.08;
    const intensity = energyState.coreActive
      ? 0.4 + energyState.blueIntensity * 0.78 + breathing
      : 0.025;
    energyMaterials.forEach((material) => {
      material.emissiveIntensity = intensity;
    });
  });

  return <primitive object={model} />;
}

export function AuthoredCoreReactor(props: AuthoredCoreReactorProps) {
  const fallback = <CoreReactorFallback energyState={props.energyState} />;

  return (
    <ReactorAssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AuthoredCoreReactorModel {...props} />
      </Suspense>
    </ReactorAssetBoundary>
  );
}

useGLTF.preload(ENGINE_ROOM_ASSETS.coreReactor.path);
