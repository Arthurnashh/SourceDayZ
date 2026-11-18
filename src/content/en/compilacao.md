# How the game is compiled

> Everything here comes from the project files themselves in
> `D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252`. There is no CMake, premake or
> magic script: the build is **Visual Studio 2010** (`.sln` + `.vcxproj`) and, as legacy,
> a GNU `Makefile`.

## 1. Main program: Visual Studio 2010

| Item | Value | Evidence |
|---|---|---|
| Solution | `DayZ.sln` / `DayZ2010.sln` | `DayZ.sln:1-2` |
| Format | `Format Version 12.00`, `# Visual Studio 2010` | `DayZ.sln:1-2` |
| Game toolset | **v100** (MSVC 10.0 / VS2010) | `lib/lib2010.vcxproj:118,123` |
| Toolset used in this build | **v141** (MSVC 14.16) via override | `build/inventory-menu-v10/cpp-build-release-v31.log` |
| Platforms | `Win32` and `Xbox 360` | `DayZ.sln` (SolutionConfigurationPlatforms) |
| Configurations | 12 (Debug, Release, Retail, Retail Server, Retail Steam, Retail Demo, Release Demo, ReleaseNoOpt, Profile, Testing, Debug Server, Buldozer) | `DayZ.sln` |
| Output | `..\dist\` | `lib/lib2010.vcxproj:345-383` |

The toolset **is not uniform**: `BankRev` was upgraded to **v110** (VS2012)
(`BankRev/BankRev.vcxproj`), while the game stays on v100. `cfg`, `binarize` and
`FileBank` are old `.vcxproj` files **without** a declared `PlatformToolset` — they inherit
the installation default.

In practice, this machine **compiles**: MSBuild 15.9.30 (VS2017) with
`PlatformToolset=v141` via override. The `cpp-build-release-v31.log` ends with
`lib2010.vcxproj -> ...\cpp-out-v31\DayZInt.exe`, with linker `14.16.27054.0` and Windows
SDK `10.0.19041`. Compiling 2001 code in MSVC 14.16 required adjustments to old headers
(`El/Math/math3dp.hpp`, `Es/Containers/typeopts.hpp`, `Enfusion/include/common/enf_mathlib.h`,
`lib/appName.h`, `lib/wpch.hpp`), stored in `backup-v141-compat-20261116/`.

## 2. The 6 projects

`DayZ.sln:3-14`:

| Project | Path | Type |
|---|---|---|
| `cfg` | `cfg\cfg2010.vcxproj` | game config compiled into C++ |
| `lib` | `lib\lib2010.vcxproj` | **the executable** (engine + gameplay) |
| `LaunchServer` | `LaunchServer\LaunchServer.vcxproj` | dedicated server launcher |
| `BulletCollision` | `extern\bullet2.76\msvc\2010\...` | physics |
| `BulletDynamics` | `extern\bullet2.76\msvc\2010\...` | physics |
| `LinearMath` | `extern\bullet2.76\msvc\2010\...` | Bullet math |

## 3. What each configuration produces

`lib/lib2010.vcxproj:448-452` — the binary name changes per configuration:

| Configuration | TargetName | Use |
|---|---|---|
| `Release\|Win32` | `DayZInt` | internal development build |
| `Retail\|Win32` | `DayZ` | production client |
| `Retail Server\|Win32` | `DayZServer` | dedicated server |
| `Retail Steam\|Win32` | `DayZSteam` | Steam variant |
| `Retail Demo\|Win32` | `DayZDemo` | demo |
| others | `DayZ$(Configuration)` | Debug, Profile, Testing, Buldozer… |

Actual output in `dist/` (measured):

```text
dist\DayZ.exe        11,230 KB
dist\DayZInt.exe     13,517 KB
dist\DayZ.pdb        69,491 KB   (symbols)
dist\DayZ.map        12,109 KB   (address -> symbol)
dist\binarize.exe    13,517 KB
dist\steam_api.dll      104 KB
```

The 69 MB `.pdb` and the 12 MB `.map` are what allow *resolving* a crash to
`file:line` — the same reason this study can cite lines.

## 4. Include directories and defines

`lib/lib2010.vcxproj:474` (Debug\|Win32):

```text
$(SolutionDir)
$(SolutionDir)PhysicalLibs\RigidBody\ODE
$(SolutionDir)extern
$(SolutionDir)extern\dxsdk\include
$(SolutionDir)extern\SimulWeather
$(SolutionDir)Enfusion\include
```

Main defines (`lib2010.vcxproj:475` and `:534`):

| Define | Meaning |
|---|---|
| `_ENABLE_PHYSICS=1` | physics enabled |
| `_ENABLE_PBO_PROTECTION=1` | PBOs with protected header (AES) |
| `_ENABLE_DLC_SUPPORT=1` | DLC support |
| `_SERVER=1` | server variant (Retail Server config) |
| `_SUPER_RELEASE=1`, `_SECUROM=1` | production build |
| `_GAMES_FOR_WINDOWS=0` | no GFWL |
| `_DEBUG` / `_RELEASE=1` / `NDEBUG` | build mode |

## 5. Linked libraries

`lib/lib2010.vcxproj:499` (actual list, summarized):

```text
ddraw.lib dxguid.lib winmm.lib version.lib Iphlpapi.lib
vorbisfilemtd.lib libspeexMtd.lib libspeexdspMtd.lib
rsamt.lib libbulletcollision_d.lib libbulletdynamics_d.lib ...
```

`ddraw.lib` and `dxguid.lib` appear because the code still carries DirectDraw/DX9 paths.
`legacy_stdio_definitions.lib` is the patch to compile 2001 code with the modern CRT.

## 6. The programs that compile and pack

| Program | Where | Function |
|---|---|---|
| **MSVC 10.0 (`cl.exe`, v100)** | VS2010 | compiles `lib`, `cfg`, `LaunchServer` |
| **MSBuild / `devenv`** | VS2010 | orchestrates the `.sln` |
| **Windows SDK 7.1** | VS2010 | Windows headers/libs (`winmm`, `version`, `Iphlpapi`) |
| **DirectX SDK 2010** | `extern/DXSDK` | `d3dx9`, `dxguid`, shaders |
| **Bullet 2.76** | `extern/bullet2.76` | physics, built as 3 projects |
| **`binarize.exe`** | `binarize/` → `dist/` | optimizes `.p3d`/`.wrp` (LOD, textures, meshes) |
| **`FileBank`** | `FileBank/` | **creates the PBOs** |
| **`BankRev`** | `BankRev/` | lists/extracts PBO |
| **`CheckBank`** | `CheckBank/` | verifies PBO integrity |
| **`XBOXPBORepack`** | `XBOXPBORepack/` | repacks PBO for Xbox 360 |
| **`texMerge`** | `texMerge/` | merges textures into atlases |
| **`buldozer`** | `buldozer/` | model editor/viewer |
| **`CfgEdit`** | `CfgEdit/` | edits `config.cpp` (ParamFile) |
| **`OFPPatch` / `OPFCreatePatch`** | folders of the same name | OFP addon patch |
| **GNU `make` + gcc/g++** | `Makefiles/Makefile` | legacy Linux build |

Evidence of the legacy build: `Makefiles/Makefile:34-58` defines `CC=gcc`, `CCC=g++`,
`CPUFLAGS = -m32 -msse2` — before the migration to Windows/VS.

## 7. Actual build sequence (model)

1. **Compile** `lib` + `cfg` + Bullet in the desired configuration → `dist\DayZ*.exe`.
2. **Binarize** models and worlds with `binarize.exe` (`binarize/ReadMe.txt` has the
   actual command lines, e.g. `-textures=Optimize -exclude=… Data3D Optimize\Data3D *.p3d`).
3. **Pack** the folders into PBO with `FileBank` (or `binarize` in addon mode).
4. **Sign** each PBO, generating the `.bisign` next to it.
5. **Distribute** `DayZ.exe` + `Addons/*.pbo` + `Addons/*.bisign` + keys.

`binarize/deploy.bat` and `FileBank/deploy.bat` automate steps 2–3 on the BI machine.

## 8. Known limits of this snapshot

- `lib/lib2010.vcxproj` declares **v100**; opening it in VS2019/2022 without retargeting fails with
  `MSB8020`. Here the retarget is done by overriding `PlatformToolset=v141` (VS2017), and
  it works — but it requires the compatibility adjustments listed in section 1.
- `BankRev` is already on v110: a sign of a partial upgrade, not of a modern build.
- Warnings that remain in the log: `C4005` (`DXGI_ERROR_*` between `extern/DXSDK` and Windows
  SDK 10), `C4477` in `lib/d3d9/txtd3D9.cpp:3843` and `LNK4217` (`_floor` via `xapobased.lib`).
- `[pending]` confirm the exact Windows SDK version used on the BI machine (the project
  does not pin `WindowsTargetPlatformVersion`).
