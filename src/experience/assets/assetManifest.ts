export interface ExperienceAssetDefinition {
  path: string;
  scaleMeters: number;
  license: "Core Vault original";
  purpose: string;
}

export const ENGINE_ROOM_ASSETS = {
  coolingManifold: {
    path: "/assets/experience/engine-room/cv_engine_room_cooling_manifold.glb",
    scaleMeters: 1,
    license: "Core Vault original",
    purpose: "Purpose-built passive cooling and energy-distribution anchor",
  },
} as const satisfies Record<string, ExperienceAssetDefinition>;
