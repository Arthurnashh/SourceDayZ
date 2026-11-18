# Source code structure

> **This is not reverse engineering.** This is the real source tree from Bohemia
> Interactive, delivered as a Visual Studio project:
> `D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252`.
> Every number below was measured by `tools/build_source_data.py` (file by
> file, no estimates), and each structural statement points to the file that proves it.

## 1. Project root

| Item | What it is |
|---|---|
| `DayZ.sln` | Visual Studio 2010 solution, **6 projects** |
| `DayZ2010.sln` | twin solution, the same 6 projects |
| `buildNo.h` | build number compiled into the binary |
| `rv.natvis` | debugger type visualizer (`Ref<>`, `RString`, `Vector3`) |
| `DayZ.smproj` | auxiliary build project, 36 MB, generated |

Solution evidence: `DayZ.sln:1-2` — `Format Version 12.00` / `# Visual Studio 2010`.
The six projects (`DayZ.sln:3-14`):

```text
cfg            -> cfg\cfg2010.vcxproj
lib            -> lib\lib2010.vcxproj        (the game)
LaunchServer   -> LaunchServer\LaunchServer.vcxproj
BulletCollision-> extern\bullet2.76\msvc\2010\BulletCollision.vcxproj
BulletDynamics -> extern\bullet2.76\msvc\2010\BulletDynamics.vcxproj
LinearMath     -> extern\bullet2.76\msvc\2010\LinearMath.vcxproj
```

## 2. The folders that matter

Real measurement, excluding `build/`, `dist/` and the working `backup-*` folders:

| Folder | Files | Size | Role |
|---|---:|---:|---|
| `Addons/` | 232 | 6,145 MB | 116 PBOs + 116 `.bisign` signatures |
| `lib/` | 5,480 | 3,000 MB | the game and the engine (includes `lib/obj/`, build objects) |
| `extern/` | 8,354 | 816 MB | third-party SDKs |
| `cfg/` | 1,655 | 33 MB | game configuration (Cfg*) |
| `ComRef/` | 40 | 6 MB | SQF command manual (`comref.xml`) |
| `El/` | 537 | 5 MB | base library (streams, parser, network, math) |
| `Enfusion/` | 191 | 4 MB | new engine (Enforce VM, render, physics, audio) |
| `Drobnosti/` | 188 | 2 MB | internal utilities |
| `RV/` | 177 | 2 MB | voice runtime and KBBase |
| `Es/` | 116 | 1 MB | containers, strings, threads |
| `bin/` | 58 | 2 MB | config compiled into C++ (`cfg*.hpp`) |
| `PerfLog/` | 27 | 1 MB | profile capture |
| **measured total** | **20,171** | **9.83 GB** | |

And the two generated folders, which **are not code**:

| Folder | Files | Size | What it is |
|---|---:|---:|---|
| `build/` | 18,162 | 187 GB | compilation output (`port-x64/`, `.obj`, `.pdb`, maps) |
| `dist/` | 690 | 1.4 GB | final binaries and client/server package |

## 3. `lib/` — the game

`lib/` is where 90% of DayZ's behavior lives. The `.cpp` files sit **at the root** of `lib/`
(361 `.cpp/.hpp/.h` files), and the subfolders hold the subsystems:

| Path | Files | What it is |
|---|---:|---|
| `lib/*.cpp` + `lib/*.hpp` | 718 sources | engine and gameplay (`world.cpp`, `scene.cpp`, `object.cpp`, `zombie.cpp`) |
| `lib/obj/` | 2,882 | **build output**, not source |
| `lib/lib/build/` | 1,657 | **build output** (1,454 `.obj`), with `zombie-collision-diag-v10*/` |
| `lib/GameSpy/` | 111 | legacy matchmaking SDK |
| `lib/d3d9/` | 42 | DirectX 9 backend (51,549 lines) |
| `lib/d3dT/` | 23 | legacy T&L pipeline |
| `lib/d3dXB/` | 107 | Xbox 360 backend |
| `lib/UI/` | 42 | HUD, menus, widgets |
| `lib/Network/` | 30 | client/server, packets, JIP |
| `lib/AI/` | 17 | navigation, sensors, behavior |
| `lib/Inventory/` | 20 | inventory and containers |
| `lib/Protect/` | 22 | data protection |
| `lib/Shape/` | 20 | geometry and LOD |
| `lib/Tools/` | 24 | internal tools |

The same pattern repeats in the other layers:

- `El/` has 62 subfolders — `QStream/` (PBO and streams), `ParamFile/`, `Evaluator/`
  (SQF interpreter), `PreprocC/`, `MultiThread/`, `Network/`.
- `Enfusion/` has `include/` (109) and `src/` (82) — `script/`, `render/`, `physics/`,
  `animation/`, `sound/`, `resources/`.
- `extern/` has 39 subfolders.

## 4. `extern/` — the technical ceiling

| Dependency | Files | Size | Version / use |
|---|---:|---:|---|
| `boost/` | 3,774 | 26 MB | containers and utilities, pre-C++11 |
| `Botan/` | 1,682 | 9 MB | cryptography |
| `bullet2.76/` | 585 | 23 MB | physics (Bullet **2.76**) |
| `SimulWeather/` | 591 | 259 MB | clouds/atmosphere |
| `RotorLib/` | 251 | 364 MB | helicopter AI |
| `DXSDK/` | 138 | 29 MB | DirectX SDK 2010 (`Include/`, `Lib/`) |
| `libcurl/` | 269 | 3 MB | HTTP |
| `Steamworks/` | 34 | 12 MB | Steam |
| `svn-win32-1.7.2/` | 574 | 41 MB | embedded SVN client |
| `ogg/`, `vorbis/`, `theora/`, `speex-*` | — | — | audio and video |

`cfg/Bin/` and `bin/` hold the **same** `cfg*.hpp` headers (e.g. `cfgVehicles.hpp`,
120 KB): the game configuration is **compiled into the executable**, not only read from
`config.cpp` at runtime.

## 5. `Addons/` — the packed content

`Addons/` has exactly **116 `.pbo` and 116 `.bisign`** (per-file signature), 6,145 MB.
It is proof that the game content is not in loose folders in this tree: it already comes
packed in the format described in the **PBOs** tab.

## 6. How to read the tree

1. `lib/*.cpp` — behavior (world, scene, object, zombie, network, AI).
2. `El/` + `Es/` — foundation (streams, containers, ParamFile, threads).
3. `Enfusion/` — new engine, incomplete in this snapshot.
4. `extern/` — dependencies and the limit on modernization (Bullet 2.76, DXSDK 2010).
5. `cfg/` + `Addons/` — data: compiled config and signed PBOs.

Where the code has already been changed, the **Changes** tab points to `file:line` for each patch.

> `[pending]` map each PBO's contents file by file (the function index only
> covers the C++ code, not the packed data).
