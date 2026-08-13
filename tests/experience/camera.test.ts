import { describe, expect, it } from "vitest";
import {
  cameraPoseForFocus,
  cameraTransitionPolicy,
  ENGINE_ROOM_CAMERA_POSES,
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
});
