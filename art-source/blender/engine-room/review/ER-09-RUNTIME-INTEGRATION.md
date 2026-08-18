# ER-09 Runtime Integration

## Asset and loader architecture

The production asset is `public/assets/experience/engine-room/production/cv_engine_room_er09.glb`. It is a byte-identical versioned copy of the approved ER-08 candidate; the candidate and locked Blender master were not modified.

`EngineRoomRuntime` keeps legacy and production implementations side by side. `ProductionEngineRoom` uses the existing Drei `useGLTF` convention, validates semantic nodes, clones the scene hierarchy while sharing cached geometry, creates stable runtime materials once, and exposes lightweight interaction volumes. A local Suspense fallback displays the legacy room while loading. An asset-local error boundary reports malformed/load errors in development and returns to the legacy room without crashing the application.

## Semantic group mapping

The maintainable contract lives in `productionSceneContract.ts` and preserves:

- `CV_Runtime_StaticArchitecture_Group` → static architecture
- `CV_Runtime_StaticReactor_Group` → main Reactor structure
- `CV_Runtime_SecondaryChamber_Group` → subordinate chamber
- `CV_Runtime_GlassMain_Glass_Reactor` → main controlled glass
- `CV_Runtime_GlassSecondary_Glass_Secondary` → secondary controlled glass
- `CV_Runtime_EnergyMain_*` → four independently addressable main guides
- `CV_Runtime_EnergySecondary_*` → two independently addressable secondary guides
- `CV_Runtime_Console_Group` and `CV_Runtime_ConsoleScreen` → physical console and runtime screen
- `CV_Runtime_Exterior_Group` → Mediterranean matte
- `CV_Runtime_Interactive_Group` plus runtime hit volumes → focus integration

The loader rejects missing exact groups and fewer than four main/two secondary energy guides.

## State binding and energy

The production scene consumes the existing `EngineRoomVisualState`, `deriveReactorEnergyState`, block pulse serial, focus reducer and reduced-motion policy. No second Bitcoin/application state system was introduced.

- Connection online controls main energy availability.
- Existing ready/syncing semantics control calm versus increased pulse rate/intensity.
- Existing `networkActive` controls the secondary chamber independently.
- Offline/unknown turns emission down and both dynamic blue spill lights off.
- A real later block-height increase triggers the existing one-shot gold validation pulse.
- Reduced motion disables continuous breathing while preserving the blue active/inactive distinction.

The six guide meshes do not expose a justified flow-coordinate contract, so ER-09 uses stable geometry plus emissive intensity modulation. It performs no per-frame geometry edits and does not bake a fake active state into static materials.

## Glass

Both semantic glass objects use centrally constructed `MeshPhysicalMaterial` instances:

- IOR 1.47
- transmission 0 (performance-tested alpha strategy)
- main/secondary opacity 0.20 / 0.16
- main/secondary roughness 0.16 / 0.20
- main/secondary thickness 0.20 / 0.14
- transparent true, depth test true, depth write false
- FrontSide only
- explicit render order: secondary 2, main 3, energy 4

Hero, alternate, Reactor close-up and console views show stable front-glass → machinery → energy → depth ordering without obvious sorting pops. Full transmission was rejected after measurement because it reduced this M1 runtime to about 42 FPS and doubled render calls.

## Lighting and environment

The active source budget is at most five: one warm directional key, one restrained rear directional source, one hemisphere fill, one state-controlled main blue point light and one independently controlled secondary blue point light. Energy lights cast no shadows and are zero intensity when inactive.

A local, runtime-generated Drei environment with three Lightformers supplies bronze/dark-metal/glass reflections without any network-fetched HDR. ACES Filmic and sRGB remain the renderer policy; only the production scene uses an explicitly tested exposure of 0.78. Runtime DPR is 1 and power preference remains high-performance.

## Material translation

One centralized family mapper tunes bronze main/dark/machined, engineering dark/machined, warm/floor/recess stone, console, practical, vegetation, exterior, energy and glass families. The asset's existing PBR cores remain the baseline. No baking project or new procedural texture system was introduced.

## Console integration

`CV_Runtime_ConsoleScreen` is replaced by a runtime-owned CanvasTexture. A runtime-only planar UV clone corrects the exported screen island without mutating the GLB; the clone is explicitly disposed with the scene. Its rows are derived only from actual `EngineRoomVisualState`: connection, chain, block height, sync progress and network state. Unknown/offline fields display unknown/standby values; no decorative block heights, percentages or network activity are generated.

## Interaction and camera envelope

Existing room overview, Inspect Core Reactor, Inspect Network Console, Back/Escape and focus transitions are preserved through invisible hit volumes. Detailed meshes are not used for complex hit testing.

The Blender camera was converted and visually reviewed in Three.js coordinates. The authored numeric envelope is:

- position x: -4.90…7.55, y: 2.10…4.55, z: 5.75…13.50
- target x: -4.95…2.38, y: 1.30…3.26, z: -1.80…0.29
- yaw: -31.43°…1.31°
- pitch: -9.07°…-1.31°
- stops: hero/overview, Reactor inspection, console inspection; alternate is a development-only review stop

The existing damped camera rig interpolates only among these authored stops. There is no unlimited free orbit, keeping transitions inside the exterior matte's safe parallax envelope.

## Exterior strategy

The approved local exterior matte remains part of the GLB. It uses an unlit-by-environment material family (`metalness = 0`, `roughness = 1`, environment intensity 0) so it does not glow as a metallic surface. Hero and alternate runtime captures retain readable water/mountain depth without an exposed card edge. Runtime color is flatter and cooler than the Blender composite, which is a fidelity item for ER-10; no open-world geometry or unjustified depth cards were added.

## Feature flag and fallback

Safe default remains legacy. Production can be enabled with `VITE_CV_ENGINE_ROOM_PRODUCTION=1`; development query switches `?engineRoom=production` and `?engineRoom=legacy` support immediate A/B work without rebuilding. The legacy component and previous assets remain intact.

Expected semantic failures and asset loading errors are isolated to the production branch and fall back to legacy with a development diagnostic. The production asset was also loaded successfully in the actual Tauri application against a real isolated regtest node.

## Compression decision

ER-09 intentionally retains the 18.85 MB uncompressed baseline. No compression dependency or loader branch was added before measuring baseline load, parse, first render and renderer information. ER-10/ER-11 can decide whether package/load goals justify Meshopt or texture compression.

## Tests and boundaries

Focused tests cover feature selection, safe legacy default, semantic validation, main/secondary energy truth, offline/inactive behavior, reduced motion, centralized material names, console runtime ownership, versioned asset path and production camera poses. Existing architecture, camera, interaction, state and navigation tests remain enabled.

`npm run verify` passes TypeScript, Rust fmt/clippy, 80 Vitest tests, production build and 68 active Rust tests (4 explicitly ignored real-regtest lifecycle tests). No `src-tauri` source, Bitcoin RPC, wallet, signing, IPC, permission, network-policy or security boundary was changed.

## Remaining fidelity gaps

- Real-time lighting is harder and more contrasty than the Cycles baseline; Blender's soft bounce is not reproduced one-for-one.
- Energy guides remain crisp emissive geometry without offline bloom/compositor glow.
- Stone and bronze retain the hierarchy but lack some procedural micro-detail visible in the Blender render.
- The exterior matte reads acceptably inside the envelope but has less atmospheric depth than the offline composite.
- The console screenshot is limited by the approved camera stop and physical screen angle; data remains runtime-owned and legible during interaction.

These are renderer-specific refinement items for ER-10, not semantic or stability blockers.

## Remaining performance risks

- First uncached parse/first render is about 3.05 s for the 18.85 MB asset.
- The first camera transition can include a short shader/visibility hitch, though p95 remains within the 60 Hz budget and the window average stays above 45 FPS.
- Long-lived HMR sessions retain GLTF/dev cache entries; clean-load disposal should be re-audited during ER-11 packaging tests.
- The R3F experience chunk is about 1,001.8 kB minified (272.7 kB gzip), producing the existing Vite large-chunk warning.
