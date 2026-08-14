# Core Reactor v1 source

`build_core_reactor_v1.py` is the deterministic Blender source of truth for the first authored Core Vault hero asset. No downloaded model, texture, or other third-party asset is used.

From the repository root:

```sh
npm run asset:reactor
```

The command overwrites only:

`public/assets/experience/engine-room/cv_core_reactor_v1.glb`

The script models in metres with Blender Z-up. Blender's glTF exporter converts the runtime asset to glTF Y-up. The origin remains at the centre of the plinth's floor contact patch.

The generated GLB, rather than a checked-in `.blend`, is committed beside this script. A `.blend` can be created locally for exploratory art work, but durable geometry changes must be reflected in the deterministic build script before export.
