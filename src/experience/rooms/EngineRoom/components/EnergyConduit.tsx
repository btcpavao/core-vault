import { memo, useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import type { EngineRoomConnection } from "../../../adapters/nodeVisualState";
import { BronzeMaterial, EnergyMaterial } from "../../../materials/WorldMaterials";

interface EnergyConduitProps {
  points: readonly (readonly [number, number, number])[];
  connection: EngineRoomConnection;
  active: boolean;
  radius?: number;
}

function EnergyConduitComponent({
  points,
  connection,
  active,
  radius = 0.04,
}: EnergyConduitProps) {
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
        <EnergyMaterial connection={connection} active={active} intensity={0.9} />
      </mesh>
    </group>
  );
}

export const EnergyConduit = memo(EnergyConduitComponent);
