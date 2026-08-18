import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3, type Mesh } from "three";
import type { EngineRoomConnection } from "../../../adapters/nodeVisualState";
import { BronzeMaterial, EnergyMaterial } from "../../../materials/WorldMaterials";

interface EnergyConduitProps {
  points: readonly (readonly [number, number, number])[];
  connection: EngineRoomConnection;
  active: boolean;
  radius?: number;
  reducedMotion: boolean;
}

const FLOW_PACKET_COUNT = 3;

function EnergyConduitComponent({
  points,
  connection,
  active,
  radius = 0.04,
  reducedMotion,
}: EnergyConduitProps) {
  const packetRefs = useRef<Array<Mesh | null>>([]);
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    [points],
  );
  const outerArgs = useMemo(
    (): [CatmullRomCurve3, number, number, number, boolean] => [
      curve,
      52,
      radius * 2.35,
      8,
      false,
    ],
    [curve, radius],
  );

  useFrame(({ clock }) => {
    packetRefs.current.forEach((packet, index) => {
      if (!packet) return;
      packet.visible = active;
      const progress = reducedMotion
        ? (index + 1) / (FLOW_PACKET_COUNT + 1)
        : (clock.elapsedTime * 0.075 + index / FLOW_PACKET_COUNT) % 1;
      curve.getPointAt(progress, packet.position);
    });
  });
  const innerArgs = useMemo(
    (): [CatmullRomCurve3, number, number, number, boolean] => [curve, 52, radius, 8, false],
    [curve, radius],
  );

  return (
    <group>
      <mesh receiveShadow>
        <tubeGeometry args={outerArgs} />
        <BronzeMaterial finish="dark" />
      </mesh>
      <mesh>
        <tubeGeometry args={innerArgs} />
        <EnergyMaterial connection={connection} active={active} intensity={0.78} />
      </mesh>
      {Array.from({ length: FLOW_PACKET_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(packet) => {
            packetRefs.current[index] = packet;
          }}
          visible={active}
        >
          <sphereGeometry args={[radius * 1.9, 10, 8]} />
          <EnergyMaterial connection={connection} active={active} highlight intensity={1.18} />
        </mesh>
      ))}
    </group>
  );
}

export const EnergyConduit = memo(EnergyConduitComponent);
