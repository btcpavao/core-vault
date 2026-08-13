import { memo, useMemo, type ReactNode } from "react";
import { Vector2 } from "three";

interface BeveledCylinderProps {
  radiusTop: number;
  radiusBottom?: number;
  height: number;
  bevel?: number;
  segments?: number;
  position?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  children: ReactNode;
}

function BeveledCylinderComponent({
  radiusTop,
  radiusBottom = radiusTop,
  height,
  bevel = Math.min(0.06, height * 0.22),
  segments = 64,
  position,
  castShadow = false,
  receiveShadow = false,
  children,
}: BeveledCylinderProps) {
  const profile = useMemo(() => {
    const halfHeight = height / 2;
    const safeBevel = Math.min(bevel, halfHeight * 0.82, radiusTop * 0.2, radiusBottom * 0.2);

    return [
      new Vector2(0, -halfHeight),
      new Vector2(radiusBottom - safeBevel, -halfHeight),
      new Vector2(radiusBottom - safeBevel * 0.28, -halfHeight + safeBevel * 0.18),
      new Vector2(radiusBottom, -halfHeight + safeBevel),
      new Vector2(radiusTop, halfHeight - safeBevel),
      new Vector2(radiusTop - safeBevel * 0.28, halfHeight - safeBevel * 0.18),
      new Vector2(radiusTop - safeBevel, halfHeight),
      new Vector2(0, halfHeight),
    ];
  }, [bevel, height, radiusBottom, radiusTop]);

  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <latheGeometry args={[profile, segments]} />
      {children}
    </mesh>
  );
}

export const BeveledCylinder = memo(BeveledCylinderComponent);
