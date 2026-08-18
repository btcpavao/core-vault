import { describe, expect, it } from "vitest";
import {
  cameraPoseForFocus,
  cameraTransitionPolicy,
  ENGINE_ROOM_CAMERA_POSES,
  ER09_PRODUCTION_CAMERA_POSES,
  productionCameraPoseForFocus,
  productionReviewViewFromSearch,
} from "../../src/experience/camera/engineRoomCamera";

describe("Engine Room curated camera", () => {
  it("maps every semantic focus to a named authored pose", () => {
    expect(cameraPoseForFocus("overview").name).toBe("RoomOverview");
    expect(cameraPoseForFocus("reactor").name).toBe("ReactorFocus");
    expect(cameraPoseForFocus("network-console").name).toBe("NetworkConsoleFocus");
  });

  it("keeps each focus composition distinct without exposing free camera state", () => {
    const poses = Object.values(ENGINE_ROOM_CAMERA_POSES);
    expect(new Set(poses.map((pose) => pose.name)).size).toBe(3);
    expect(new Set(poses.map((pose) => pose.position.join(","))).size).toBe(3);
    expect(poses.every((pose) => pose.fov > 0 && pose.fov < 90)).toBe(true);
  });

  it("makes Reduced Motion deterministic and immediate", () => {
    expect(cameraTransitionPolicy(true)).toBe("immediate");
    expect(cameraTransitionPolicy(false)).toBe("damped");
  });

  it("preserves the converted 38 mm Blender hero camera contract", () => {
    expect(ER09_PRODUCTION_CAMERA_POSES.hero).toMatchObject({
      position: [-0.25, 2.2, 13.25],
      target: [0.1, 1.85, -1.8],
      fov: 34.5,
    });
    expect(productionCameraPoseForFocus("reactor").name).toBe("ProductionReactor");
    expect(productionCameraPoseForFocus("network-console").name).toBe("ProductionConsole");
  });

  it("allows review-camera overrides only in development", () => {
    expect(productionReviewViewFromSearch(true, "?er09View=alternate")).toBe("alternate");
    expect(productionReviewViewFromSearch(true, "?er09View=exterior")).toBe("exterior");
    expect(productionReviewViewFromSearch(false, "?er09View=alternate")).toBeNull();
    expect(productionReviewViewFromSearch(true, "?er09View=free")).toBeNull();
  });
});
