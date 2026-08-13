import { useEffect, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

interface SpatialHitTargetProps {
  position?: [number, number, number];
  scale: [number, number, number];
  onActivate: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

export function SpatialHitTarget({
  position = [0, 0, 0],
  scale,
  onActivate,
  onHoverChange,
}: SpatialHitTargetProps) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [hovered]);

  const updateHover = (next: boolean) => {
    setHovered(next);
    onHoverChange?.(next);
  };

  const activate = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onActivate();
  };

  return (
    <mesh
      position={position}
      scale={scale}
      onClick={activate}
      onPointerOver={(event) => {
        event.stopPropagation();
        updateHover(true);
      }}
      onPointerOut={() => updateHover(false)}
    >
      <boxGeometry />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}
