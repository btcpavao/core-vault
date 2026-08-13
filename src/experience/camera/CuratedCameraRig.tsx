import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { SpatialFocusTarget } from "../interaction/spatialFocus";
import { cameraPoseForFocus, cameraTransitionPolicy } from "./engineRoomCamera";

interface CuratedCameraRigProps {
  focus: SpatialFocusTarget;
  reducedMotion: boolean;
}

export function CuratedCameraRig({ focus, reducedMotion }: CuratedCameraRigProps) {
  const { camera } = useThree();
  const pose = cameraPoseForFocus(focus);
  const destination = useMemo(() => new Vector3(), []);
  const targetDestination = useMemo(() => new Vector3(), []);
  const currentTarget = useRef(new Vector3(...cameraPoseForFocus("overview").target));

  destination.fromArray(pose.position);
  targetDestination.fromArray(pose.target);

  useEffect(() => {
    if (cameraTransitionPolicy(reducedMotion) !== "immediate") return;
    camera.position.fromArray(pose.position);
    currentTarget.current.fromArray(pose.target);
    if (camera instanceof PerspectiveCamera) camera.fov = pose.fov;
    camera.lookAt(currentTarget.current);
    camera.updateProjectionMatrix();
  }, [camera, pose, reducedMotion]);

  useFrame((_, delta) => {
    if (cameraTransitionPolicy(reducedMotion) === "immediate") return;
    const positionFactor = 1 - Math.exp(-3.8 * delta);
    const targetFactor = 1 - Math.exp(-4.8 * delta);
    camera.position.lerp(destination, positionFactor);
    currentTarget.current.lerp(targetDestination, targetFactor);
    if (camera instanceof PerspectiveCamera) {
      camera.fov = MathUtils.damp(camera.fov, pose.fov, 4.2, delta);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(currentTarget.current);
  });

  return null;
}
