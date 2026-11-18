# How the DayZ engine works

> Architecture of the Real Virtuality / Enfusion engine in build 0.45.124252, with evidence
> taken from `lib/world.cpp`, `lib/scene.cpp`, `lib/object.cpp`, `lib/d3d9/` and `lib/d3d11/`.
> Every strong claim points to a file and line.

## 1. Overview in 30 seconds

The engine is a **single simulation loop** that budgets time per frame and distributes the slack
among subsystems. There is no rigid "update / render" split: scripts, physics, terrain,
AI and drawing run in the same frame, and whoever spends more steals time from whoever comes after.

- The world simulates in `World::Simulate` (`lib/world.cpp:11795`).
- The frame is budgeted by `GTimeManager.Frame(estimateReserve)` (`world.cpp:11899/11946/11950`).
- Drawing is prepared by `World::PrepareDraw` (`world.cpp:7926`) and executed by
  `Scene::Draw*` (`lib/scene.cpp`).
- Each object enters the graphics backend via `Object::Draw` (`lib/object.cpp:1968`).
- The legacy backend is `lib/d3d9/` (51,549 lines); the new one is `lib/d3d11/` (**1,211 lines**,
  2.3% of the size of D3D9).

## 2. Source map

| Folder | Files | What it is |
|---|---:|---|
| `lib/` | 2,407 | **the game and the engine**: `main.cpp`, `world.cpp`, `scene.cpp`, `Network/`, `UI/`, `AI/`, `d3d9/`, `d3d11/` |
| `El/` | 537 | base library: parser, archives, streams, network, math, threads |
| `Es/` | 116 | containers, strings, threads, files, memory |
| `Enfusion/` | 193 | new engine: Enforce script VM, render, physics, animation, audio |
| `extern/` | 10,144 | SDKs: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, ogg/vorbis |
| `cfg/` | 160 | configuration (ParamFile): inventory, weapons, vehicles, UI, worlds |
| `ComRef/` | 40 | SQF command reference (`comref.xml`, 1,340 commands) |
| `PerfLog/` | 27 | profile capture and analysis |

The four roots that matter: `lib/` (the game), `El/`+`Es/` (foundation), `Enfusion/` (new
engine) and `extern/` (technical ceiling). The rest are tools and historical variants.

## 3. The actual frame order

Extracted from `lib/world.cpp`, inside `World::Simulate`:

```text
World::Simulate
├─ 11815  GMatrixCache.Clear()
├─ 11816  ClearClutterDrawCache()
├─ 11821  FreeOnDemandGarbageCollectMain()
├─ 11899/11946/11950  GTimeManager.Frame(estimateReserve)   ← frame budget
├─ 12147  SimulateAllVehicles(deltaT)
├─ 12213  SimulateScripts(deltaT, timeLimit)                ← SQF/Enforce
├─ 12364  SimulateLandscape(deltaT)
├─ 12737  PrepareDraw(camInsideVehicle,false,FLT_MAX)       ← visibility/grid
├─ 12788  SimulateUI(deltaT)
├─ 12830  DrawScene(...)                                    ← Scene::Draw*
└─ 12848  DrawUI(...)
```

What those numbers reveal:

1. **`SimulateScripts` comes before `Draw`.** Script runs in the same frame and can change the
   world that will be drawn. There is no double state buffer.
2. **`SimulateLandscape` before `PrepareDraw`.** The terrain is simulated *and* visibility
   is prepared afterwards: potential duplicated grid scan.
3. **`SimulateUI` after `PrepareDraw`** (the call at `12421` is commented out) — the UI
   simulates over the already prepared state.
4. **Two caches are cleared every frame**: matrices (`GMatrixCache.Clear()`) and clutter already
   drawn (`ClearClutterDrawCache()`). It is a correctness decision, not a performance one — and a
   direct optimization candidate (H-03).

## 4. The frame budget

`World::Simulate` calculates how much time is left for "the rest" of the frame:

- With vsync: `vsyncTime = 1/RefreshRate()`, then `CalculateFrameDuration(...)` and
  `restFrame = 0.045f` (45 ms) reserved.
- Without vsync: `GetSmoothFrameDuration()` and an estimate of `totalDuration - timeManaged`.

`restFrame = 0.045f` corresponds to **~22 FPS**. It is a constant from 2013, in
`world.cpp:11894`, and it is still there in 2026. On modern hardware that premise underestimates the
available slack — recorded as **H-01**.

Architectural consequence: the engine **budgets time** and distributes it among activities. A system
that overruns the budget delays everything after it. That is why low FPS "contaminates"
AI, network and script: they receive less time, not because they are slow by themselves.

## 5. Thread model

The engine is **multi-threaded with explicit locks**, not *lock-free*.

| Evidence | What it means |
|---|---|
| `main.cpp:11657-11660` `SetThreadName(-1,"Main"); RegisterMainThread();` | there is a main-thread notion verified by assert |
| `scene.cpp:11189` `DoAssert(CheckMainThread())` | drawing can be main-only in certain modes |
| `Dx11EngineCore.hpp:87` `CriticalSection _meshSequenceLock` | the render worker can call `BeginMeshTL/DrawSectionTL/EndMeshTL` |
| `scene.cpp:11252` `GEngine->FlushBackgroundScope()` | a background render scope exists |
| `networkClient.cpp:1265` `BankList::ReadAccess banks(GFileBanks)` | concurrent reading of banks |
| `shapeDraw.cpp:139-153` | geometry list protected by synchronization |

Each lock on the drawing path (`ShapeGeometryLock`, `VertexBufferLock`,
`_meshSequenceLock`, `BankList::ReadAccess`) is a serialization point. In a city, with
many objects, the probability of contention grows — and contention shows up as **high frame time
without 100% CPU**, the classic symptom of waiting on a lock.

## 6. From object to pixel

The complete path, in the order the cost happens:

```text
World::PrepareDraw            (world.cpp:7926)
  └─ computes distances, grid rectangle, streaming locks
Scene::DrawObject             (scene.cpp:11186)   ← just a forwarder
  └─ Object::Draw             (object.cpp:1968)
       ├─ ShapeGeometryLock            (2036-2040)
       ├─ AnimationContext + Animate() (2043-2047)
       ├─ SelectAggLights()            (2091-2093)
       ├─ VertexBufferLock             (2122)
       ├─ PrepareTextures()            (2126)
       ├─ OptimizeLevelRendering()     (2129)  ← mutating, per object
       ├─ Shape::Draw()                (2139)
       ├─ CheckCraterDrawing()         (2143-2163)
       └─ shadowCache.Split()          (2165-2186)  ← only OnSurface
Scene::DrawObjectsInstanced   (scene.cpp:6108)   ← batch of up to 512
  └─ GetLandShadowSmooth() per instance (6169/6188/6211)
Backend: EngineDD9 (d3d9) or Dx11EngineCore (d3d11)
```

The central point: **6 of 7 expensive operations in `Object::Draw` are per object and per frame**, and
have nothing to do with "drawing triangles". In a city with thousands of objects, the cost is
linear in the number of objects, not in the number of pixels.

`Scene::DrawObject` (`scene.cpp:11186`) is 13 lines and is only a *forwarder*: whoever
optimizes there is optimizing the wrong place.

## 7. The two graphics backends

| Backend | Files | Functions | Lines |
|---|---:|---:|---:|
| `lib/d3d9/` | 42 | 1,985 | 51,549 |
| `lib/d3d11/` | 24 | **117** | **1,211** |
| `lib/d3dT/` (legacy T&L) | — | 709 | 18,289 |
| `lib/d3dXB/` (Xbox) | — | 604 | 17,313 |

The DX11 backend covers **2.3% of the lines** and **5.9% of the functions** of D3D9. Saying "DX11
is ready" is false by a factor of ~42× in code surface.

What **already exists** in `lib/d3d11/`: device/swap chain, `Dx11EngineCore` (TL, textures,
text, mesh), shader cache, compiler, state translator, 2D and volume texture, text
bank, TL renderer, mesh, render target, alpha test, constant buffer, shape mesh and renderer.

What **does not exist**: post-processing (FXAA/SMAA/SSAO/SSR/glow), shadows (map and volume),
terrain, water, shore, grass/clutter, sprites, animation/skinning, complete materials, video,
occlusion queries, SRGB, MSAA and lost device restoration.

### 7.1 DX10 or DX11?

**Port to the D3D11 API with feature levels 10_0/10_1/11_0. Do not port to D3D10.**

1. D3D11 is a superset of the D3D10 API: an 11 device at `FEATURE_LEVEL_10_0` exposes the same
   hardware, with the same HLSL 4.0. Two backends would duplicate 100% of the code for zero gain.
2. `d3d10.dll` has had no runtime of its own since Windows 8 — it was replaced by downlevel
   in `d3d11.dll`.
3. The code **already does this**: `Dx11Device::Create` (`Dx11Device.cpp:48-50`) tries
   `11_0 → 10_1 → 10_0` in the same `D3D11CreateDeviceAndSwapChain` call.

## 8. Instrumentation available for free

| Tool | How to use it | What it answers |
|---|---|---|
| `PROFILE_SCOPE_EX(name,*)` | names `wSimu`, `wPrep`, `obDrw`, `obTxP`, `obShD`, `obLgt`, `nwCli`, `nwSer` | time per subsystem, per frame |
| `PerfLog/` | capture tool | hierarchical profile |
| `DayZ.pdb` (70.7 MB) | WinDbg/`cdb` | crash stack with function and line |
| `DayZ.map` (12.4 MB) | address → symbol | crash from a build without PDB |
| ETW + GPUView | Windows Performance Recorder | CPU vs GPU vs Present |
| PIX / RenderDoc | DX11 frame capture | draw calls, state, overdraw |
| `-dx11warp` | `Dx11Device.cpp:53` | separate engine bug from driver bug |

The scope names are a ready-made heat map: `wSimu` (simulation), `wPrep` (scene
preparation), `obDrw` (object drawing), `obShD` (shadow), `obLgt` (lights), `nwCli`/`nwSer`
(network). Just capture 30 s and look at who dominates.

## 9. Modding in this snapshot

This 0.45 does **not have** the `modded` keyword (grep = 0 across all of `Enfusion/`) nor `override` as
a keyword. Therefore:

- **it is not possible** to override a method with `modded void Foo()`;
- `modded class` does not work either — it depends on the same keyword;
- extension is only possible by (a) replacing the entire file in the PBO, (b) config in
  `cfg/` (`CfgVehicles`, `CfgWeapons`), or (c) `proto native` with recompiling the C++.

Any modern modding guide applied to this code **fails to compile**.

## 10. Technical ceiling imposed by `extern/`

| Dependency | Version | Consequence |
|---|---|---|
| Bullet | 2.76 | old physics; no modern SIMD, no multithreaded solver |
| DirectX SDK | 2010 | `D3DX9`/`D3DX11`; requires `d3dx9_41.dll` |
| Boost | old | `boost::` instead of `std::` |
| Steamworks | old | limited matchmaking |
| MSVC | v100 (VS2010) | **no C++11** in the main project |

The v100 toolset is the hardest limiter: no `std::atomic`, `std::thread`, `nullptr`,
`override` or `constexpr`. Modernizing the renderer (which needs atomics and `thread_local`)
requires **first** retargeting the project — which today fails with `MSB8020`.

## 11. What this explains

The engine is not "slow because DX9 is old". It is slow in cities because the **per-object
path** does CPU work that grows linearly with the number of objects, while the frame
budget (`restFrame = 0.045f`) was calibrated for 22 FPS in 2013. Swapping the graphics
API without attacking that path does not change the result — see the dossier in **Bugs → FPS in
cities**.
