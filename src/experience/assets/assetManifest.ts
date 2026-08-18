export interface ExperienceAssetDefinition {
  path: string;
  scaleMeters: number;
  license: "Core Vault original";
  purpose: string;
}

export interface ExperienceImageAssetDefinition {
  path: string;
  width: number;
  height: number;
  license: "Core Vault original";
  purpose: string;
}

export const ENGINE_ROOM_ASSETS = {
  productionEngineRoom: {
    path: "/assets/experience/engine-room/production/cv_engine_room_er09.glb",
    scaleMeters: 1,
    license: "Core Vault original",
    purpose: "ER-09 production Engine Room derived from the locked ER-08 candidate",
  },
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

export const ENGINE_ROOM_CINEMATIC_ASSETS = {
  offline: {
    path: "/assets/experience/engine-room/cinematic/engine-room-offline.webp",
    width: 1672,
    height: 941,
    license: "Core Vault original",
    purpose: "Dormant Core Reactor state plate with environmental daylight preserved",
  },
  syncing: {
    path: "/assets/experience/engine-room/cinematic/engine-room-syncing.webp",
    width: 1672,
    height: 941,
    license: "Core Vault original",
    purpose: "Increased blue computational activity state plate",
  },
  ready: {
    path: "/assets/experience/engine-room/cinematic/engine-room-ready.webp",
    width: 1672,
    height: 941,
    license: "Core Vault original",
    purpose: "Canonical stable Engine Room master scene",
  },
  "network-disabled": {
    path: "/assets/experience/engine-room/cinematic/engine-room-network-disabled.webp",
    width: 1672,
    height: 941,
    license: "Core Vault original",
    purpose: "Active local Core with inactive secondary network chamber",
  },
  "new-block": {
    path: "/assets/experience/engine-room/cinematic/engine-room-new-block.webp",
    width: 1672,
    height: 941,
    license: "Core Vault original",
    purpose: "Transient restrained gold validation event plate",
  },
} as const satisfies Record<string, ExperienceImageAssetDefinition>;
