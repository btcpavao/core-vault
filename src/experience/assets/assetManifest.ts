export interface ExperienceAssetDefinition {
  path: string;
  scaleMeters: number;
  license: "Core Vault original";
  purpose: string;
}

export const ENGINE_ROOM_ASSETS = {
  coreReactor: {
    path: "/assets/experience/engine-room/cv_core_reactor_v1.glb",
    scaleMeters: 1,
    license: "Core Vault original",
    purpose: "Blender-authored Engine Room hero reactor",
  },
  coolingManifold: {
    path: "/assets/experience/engine-room/cv_engine_room_cooling_manifold.glb",
    scaleMeters: 1,
    license: "Core Vault original",
    purpose: "Purpose-built passive cooling and energy-distribution anchor",
  },
} as const satisfies Record<string, ExperienceAssetDefinition>;
