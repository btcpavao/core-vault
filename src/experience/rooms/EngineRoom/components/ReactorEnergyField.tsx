import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Mesh,
  type PointLight,
} from "three";
import type { ReactorEnergyState } from "../../../energy/reactorEnergyState";

interface ReactorEnergyFieldProps {
  energyState: ReactorEnergyState;
  pulseSerial: number;
  reducedMotion: boolean;
}

const BLUE = "#31baf2";
const BLUE_CORE = "#d5f7ff";
const GOLD = "#e2a13d";
const PULSE_SECONDS = 1.35;
const STRAND_COUNT = 16;
const PACKET_COUNT = 8;

function buildHelixStrands(count: number, turbulence: number, gold = false) {
  return Array.from({ length: count }, (_, strandIndex) => {
    const phase = (strandIndex / count) * Math.PI * 2;
    const turns = gold ? 2.15 : 2.55 + (strandIndex % 3) * 0.18;
    const points = Array.from({ length: 25 }, (_, pointIndex) => {
      const progress = pointIndex / 24;
      const angle = phase + progress * Math.PI * 2 * turns;
      const weave = Math.sin(progress * Math.PI * 4 + phase * 1.7);
      const radius =
        (gold ? 0.44 : 0.32 + (strandIndex % 4) * 0.09) + weave * turbulence;
      const verticalDrift =
        Math.sin(progress * Math.PI * 3 + phase) * turbulence * (gold ? 0.24 : 0.48);

      return new Vector3(
        Math.cos(angle) * radius,
        0.82 + progress * 2.66 + verticalDrift,
        Math.sin(angle) * radius,
      );
    });

    return new CatmullRomCurve3(points, false, "centripetal");
  });
}

function createEnergyMaterial(color: string, opacity: number) {
  return new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1,
    metalness: 0.05,
    roughness: 0.2,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
}

export function ReactorEnergyField({
  energyState,
  pulseSerial,
  reducedMotion,
}: ReactorEnergyFieldProps) {
  const fieldRef = useRef<Group>(null);
  const counterFieldRef = useRef<Group>(null);
  const blueLightRef = useRef<PointLight>(null);
  const goldLightRef = useRef<PointLight>(null);
  const validationRingRef = useRef<Mesh>(null);
  const packetRefs = useRef<Array<Mesh | null>>([]);
  const pulseRemainingRef = useRef(0);
  const previousPulseSerialRef = useRef(pulseSerial);
  const blueStrands = useMemo(
    () => buildHelixStrands(STRAND_COUNT, energyState.turbulence),
    [energyState.turbulence],
  );
  const goldStrands = useMemo(
    () => buildHelixStrands(3, Math.min(0.055, energyState.turbulence * 0.32), true),
    [energyState.turbulence],
  );
  const blueMaterial = useMemo(() => createEnergyMaterial(BLUE, 0.34), []);
  const blueCoreMaterial = useMemo(() => createEnergyMaterial(BLUE_CORE, 0.16), []);
  const blueVeilMaterial = useMemo(() => createEnergyMaterial(BLUE, 0.02), []);
  const goldMaterial = useMemo(() => createEnergyMaterial(GOLD, 0), []);

  useEffect(
    () => () => {
      blueMaterial.dispose();
      blueCoreMaterial.dispose();
      blueVeilMaterial.dispose();
      goldMaterial.dispose();
    },
    [blueCoreMaterial, blueMaterial, blueVeilMaterial, goldMaterial],
  );

  useEffect(() => {
    if (pulseSerial > previousPulseSerialRef.current) pulseRemainingRef.current = PULSE_SECONDS;
    previousPulseSerialRef.current = pulseSerial;
  }, [pulseSerial]);

  useFrame(({ clock }, delta) => {
    const activeOpacity = energyState.coreActive ? energyState.blueIntensity : 0.035;
    blueMaterial.opacity = 0.06 + activeOpacity * 0.27;
    blueMaterial.emissiveIntensity = 0.55 + activeOpacity * 1.15;
    blueCoreMaterial.opacity = 0.025 + activeOpacity * 0.12;
    blueCoreMaterial.emissiveIntensity = 0.7 + activeOpacity * 1.35;
    blueVeilMaterial.opacity = 0.008 + activeOpacity * 0.028;
    blueVeilMaterial.emissiveIntensity = 0.36 + activeOpacity * 0.48;

    const motionScale = reducedMotion ? 0 : 1;
    if (fieldRef.current) {
      fieldRef.current.rotation.y += delta * energyState.flowRate * motionScale;
    }
    if (counterFieldRef.current) {
      counterFieldRef.current.rotation.y -= delta * energyState.flowRate * 0.34 * motionScale;
    }

    packetRefs.current.forEach((packet, index) => {
      if (!packet) return;
      packet.visible = energyState.coreActive;
      const cadence = energyState.mode === "syncing" ? 0.12 : 0.036;
      const progress = reducedMotion
        ? (index + 1) / (PACKET_COUNT + 1)
        : (clock.elapsedTime * cadence + index / PACKET_COUNT) % 1;
      blueStrands[index].getPointAt(progress, packet.position);
      const breathing = reducedMotion ? 0.78 : 0.78 + Math.sin(progress * Math.PI) * 0.28;
      packet.scale.setScalar(breathing);
    });

    if (blueLightRef.current) {
      blueLightRef.current.intensity = energyState.coreActive
        ? energyState.mode === "syncing"
          ? 8.2
          : 6.8
        : 0.14;
    }

    pulseRemainingRef.current = Math.max(0, pulseRemainingRef.current - delta);
    const pulseProgress = 1 - pulseRemainingRef.current / PULSE_SECONDS;
    const pulse = pulseRemainingRef.current > 0 ? Math.sin(pulseProgress * Math.PI) : 0;
    goldMaterial.opacity = energyState.goldBaseline + pulse * 0.86;
    goldMaterial.emissiveIntensity = 0.7 + pulse * 1.7;
    if (counterFieldRef.current && !reducedMotion) {
      counterFieldRef.current.scale.setScalar(1 + pulse * 0.018);
    }
    if (goldLightRef.current) goldLightRef.current.intensity = pulse * 6.8;
    if (validationRingRef.current) {
      validationRingRef.current.visible = pulseRemainingRef.current > 0;
      validationRingRef.current.position.y = 0.8 + pulseProgress * 2.55;
      validationRingRef.current.scale.setScalar(0.96 + pulse * 0.07);
    }
  });

  return (
    <group name={`reactor-energy-${energyState.mode}`}>
      <group ref={fieldRef}>
        <mesh position={[0, 2.12, 0]}>
          <cylinderGeometry args={[0.76, 0.76, 2.48, 48, 1, true]} />
          <primitive object={blueVeilMaterial} attach="material" />
        </mesh>
        {blueStrands.map((curve, index) => (
          <mesh key={`blue-${index}`}>
            <tubeGeometry
              args={[curve, 64, index % 4 === 0 ? 0.018 : 0.01, 6, false]}
            />
            <primitive
              object={index % 4 === 0 ? blueCoreMaterial : blueMaterial}
              attach="material"
            />
          </mesh>
        ))}
        {[1.14, 1.62, 2.12, 2.62, 3.1].map((height, index) => (
          <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.56 + (index % 2) * 0.08, 0.009, 5, 52]} />
            <primitive object={blueMaterial} attach="material" />
          </mesh>
        ))}
      </group>

      <group ref={counterFieldRef}>
        {goldStrands.map((curve, index) => (
          <mesh key={`gold-${index}`}>
            <tubeGeometry args={[curve, 56, 0.012 + index * 0.002, 5, false]} />
            <primitive object={goldMaterial} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 3.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.73, 0.016, 6, 64]} />
          <primitive object={goldMaterial} attach="material" />
        </mesh>
      </group>

      <mesh ref={validationRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.024, 8, 72]} />
        <primitive object={goldMaterial} attach="material" />
      </mesh>

      {Array.from({ length: PACKET_COUNT }, (_, index) => (
        <mesh
          key={`packet-${index}`}
          ref={(packet) => {
            packetRefs.current[index] = packet;
          }}
        >
          <sphereGeometry args={[0.045, 10, 8]} />
          <primitive object={blueCoreMaterial} attach="material" />
        </mesh>
      ))}

      <pointLight
        ref={blueLightRef}
        position={[0, 2.1, 0]}
        color={BLUE}
        intensity={0}
        distance={3.5}
        decay={2}
      />
      <pointLight
        ref={goldLightRef}
        position={[0, 2.35, 0]}
        color={GOLD}
        intensity={0}
        distance={3.2}
        decay={2}
      />
    </group>
  );
}
