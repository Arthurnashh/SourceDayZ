# Changes made to this source

> This tree **is no longer untouched original code**: it has been modified, compiled and
> tested. The items below were read in the current code and compared with the snapshots in
> `backup-*`/`build/inventory-menu-v10/restore-point-*`. Where there is no in-game test
> record, it is marked `[pending validation]`.

## 1. The build actually happens (and is not v100)

The project declares `v100` (`lib/lib2010.vcxproj:118,123`), but on this machine the build runs
with **v141 via override**. Proof in the log: `build/inventory-menu-v10/cpp-build-release-v31.log:1`
— `Microsoft (R) Build Engine version 15.9.30` (VS2017 MSBuild) and, at the end of the same log,
`Microsoft (R) COFF/PE Editor Version 14.16.27054.0`, ending with:

```text
lib2010.vcxproj -> ...\build\inventory-menu-v10\cpp-out-v31\DayZInt.exe
```

| Item | Value |
|---|---|
| Compiler | MSVC 14.16 (v141), `cl.exe` in `VS2017\Community\VC\Tools\MSVC\14.16.27023` |
| Orchestrator | MSBuild 15.9.30 |
| SDK | Windows 10.0.19041 |
| DirectX | **still DX9** (`lib/d3d9/`), no migration to DX11 |
| Output | `build/inventory-menu-v10/cpp-out-v31/DayZInt.exe` |

For 2001 code to compile in v141, old headers had to be touched — all
preserved in `backup-v141-compat-20261116/`:

- `El/Math/math3dp.hpp` — 42 KB
- `Enfusion/include/common/enf_mathlib.h` — 105 KB
- `Es/Containers/typeopts.hpp`
- `lib/appName.h`, `lib/wpch.hpp`, `lib/SimulWeather/SimulWeatherDX9.hpp`
- `lib/fsmEntity.cpp`, `lib/gameDirs.cpp`, `lib/main.cpp`, `lib/person.cpp`,
  `lib/vehicleAI.cpp`, `lib/world.cpp`, `lib/winapp.cpp`
- `lib/Network/networkClient.cpp`, `networkMsg.cpp`, `networkObject.hpp`, `networkServer.cpp`
- `lib/UI/displayUI.cpp`, `lib/UI/inGameUIDraw.cpp`

Warnings that remain in the log (not errors):

- `C4005` — `DXGI_ERROR_*` redefined between `extern/DXSDK/include/dxgitype.h` and
  `Windows Kits\10\Include\10.0.19041.0\shared\winerror.h` (DXSDK 2010 vs SDK 10).
- `C4477` in `lib/d3d9/txtd3d9.cpp:3843` (`sprintf` with `%d` and an argument of another type).
- `LNK4217` — `_floor` imported locally by `xapobased.lib`.

## 2. Leaning while running with Q/E — done

`lib/soldierOld.cpp:17190-17250`, in `Man::RecalcLeaningTransform()`.

The problem: the fast-run/strafe animation maps **do not define** the lean
offsets (`GetLeanRRot`/`GetLeanRShift`), so holding Q/E while moving became a no-op.

The fix has two parts:

**Part 1 — fallback to the stop map** (`soldierOld.cpp:17212-17237`). If the offsets
of the current map are zero, take the `ManActStop` of the same movement family and reuse the offsets.

```cpp
// Some locomotion action maps (notably fast/strafe variants) omit the
// lean offsets even though the stop map for that same movement family
// defines them. Reuse those offsets so Q/E remain an additive pose while
// running instead of silently becoming a no-op.
if (fabs(leanRotAngle) < 1e-6f && fabs(leanShift) < 1e-6f)
{
  const MoveIdExt &stopMove = type->GetMove(map, ManActStop);
  ...
}
```

**Part 2 — preserve the player's request** (`soldierOld.cpp:17245-17250`). Fast
locomotion clips zero `LeaningFactor`; if Q/E is pressed, force the factor to 1.

```cpp
if (fabs(_leanZRot) > 0.01f && leaningFactor < 1e-4f)
  leaningFactor = 1.0f;
```

Previous state preserved in `backup-lean-strafe-20261116-065525/lib/soldierOld.cpp`
(actual diff: 24,115 → 24,148 lines). `lib/mainInput.cpp` and `lib/soldierOld.hpp` **did not**
change — leaning was already driven by `_leanZRot`, what was missing was the pose.

## 3. Zombie walking through walls — done

`lib/zombie.cpp:1068-1145` (`Man` movement sweep).

Three causes and three fixes:

| Cause | Fix | Line |
|---|---|---|
| `IsPassable()` is a **mass** threshold (<10), not a map rule — static buildings passed | zombie respects **any** static geometry hit (`obj->Static()`), even passable | `:1068-1077` |
| Movement start already overlapping produces `under == 0` and is not entry time; clamping at 1% held the overlapping zombie | initial overlap becomes an ambiguous case and is handed to the body solver | `:1082-1099` |
| 1% step margin still pushed inside on short steps | fixed margin of `0.005` and repositioning at `minT` | `:1138-1144` |

```cpp
const bool zombieStaticWorldBlock = isZombie && obj->Static();
if (obj->IsPassable() && !zombieStaticWorldBlock)
  continue;
```

Built-in diagnostics, limited to 1 log/s on the server:

- `[ZombieCollisionDiag]` — `zombie.cpp:1126-1137`
- `[ZombieCollisionStartOverlap]` — `zombie.cpp:1112-1124`

Test artifacts: `lib/lib/build/zombie-collision-diag-v102/`, `-v103`, `-v120`, `-v121`,
`-v123`; executables in `dist/server/` (`DayZServer-ZombieCollisionFix.exe`,
`DayZInt-ZombieCollisionFixV120.exe`, `DayZServer-ZombieStuckCollision.exe`).

## 4. Inventory: item rotation and hands

**Rotation** — space rotates the item, and the rotation is replicated by the server:

| Step | File:line |
|---|---|
| Player input | `lib/UI/uiMap.cpp:6544-6549` — `CItemBase::RotateInventoryItem` |
| Send to server | `lib/Network/networkClient.cpp:7669` — `AskForRotateInventoryItem` |
| Message definition | `lib/Network/networkImpl.hpp:370` — `DECLARE_NET_MESSAGE(AskForRotateInventoryItem, ...)` |
| Server handler | `lib/Network/networkServer.cpp:6796` |
| Replicated state | `lib/Network/networkClient.cpp:4519` — `IsInventoryRotated()` |
| Interface | `lib/Network/network.hpp:1093` (pure virtual), `:1411` (message table) |

**Space key in the inventory** — `lib/UI/uiContainers.cpp:2166-2175`:

```cpp
// Buttons activate on key release. Consume Space here too, otherwise a
// stale/default-button press can close the inventory after its keydown was
// already handled as an item-rotation request.
if (dikCode == DIK_SPACE && IsInventoryOpened())
  return true;
```

Without this, rotating the item with space closed the inventory via the default button.

**Hands (`Hands`)**: iterations to synchronize the slot item when moved to pants,
shirt, backpack or `Vicinity`, and to avoid repeating action cancellation when closing the screen.
Packages `package-v10` to `package-v13` in `build/inventory-menu-v10/`.

## 5. Main menu, pause and server browser

Work in progress, with 31 versioned packages (`package-v10` … `package-v31`) and a
`restore-point-*` before each step.

- `lib/UI/optionsUI.cpp:7409` — statistics are no longer fixed text
  (`"NOT SYNCED"` → `"0m"`/`"0"` values), still a placeholder until they become real data.
- `lib/UI/optionsUI.cpp:7518` — position/size of the mod launcher control in the menu layout.
- `cfg/Bin/rscScreen.hpp` — screen layout (`RscDisplayMultiplayer`, inventory).
- `ui.pbo` edited directly; without depending on `@MenuCleanup`.

`OFFICIAL` / `COMMUNITIES` / `LAN` tabs: V29 fixed the native tab type and the
back/join controls, and the `config` passed `CfgConvert -test`.

`[pending validation]` — check in game the three tabs, absence of legacy overlap,
3D background and connecting; and in the inventory, a single interface without a duplicated mockup.

## 6. Crash on entry (material/texture) — V30/V31

- V30: validations in `TextureD3D9::GetPixel`, `GetRect` and `RequestGetRect`
  (`lib/d3d9/txtD3D9.cpp`) to avoid dividing by zero with an invalid mip.
- V31: the remaining assert came from `TextBankD3D9::UseMipmap` — it now validates
  `_nMipmaps` and clamps `level`/`levelA` before the assert.
- Restore points: `restore-point-v30-before-texture-guard-20261116/` and
  `restore-point-v31-before-invalid-mip-level-20261117/`.

## 7. Version discipline (what makes this auditable)

- **Snapshots per change**: `backup-<theme>-<date-time>/` keeps only the touched files.
- **Restore points per build**: `build/inventory-menu-v10/restore-point-vNN-*/` keeps
  previous source + EXE + MAP (+ PDB).
- **Isolated packages**: each `package-vNN` is a separate playable installation, with its own launcher
  and profile — it does not overwrite the original `dist/` or `Addons/`.
- **Hashes**: `HISTORICO-CORRECOES-E-PENDENCIAS.md` records SHA-256 of EXE, `ui.pbo` and
  `worlds_chernarusplus.pbo` per version.

That answers the practical question: it is possible to work on this source safely because
there is measured rollback, not because the code is easy.

## 8. Server browser: the real cause of the 10 "Error loading control" — V34

The browser was not "without layout": the screen's 10 controls **were not even created**, because
a `sizeEx` value broke expression evaluation and the exception was swallowed.

**Chain measured in the code**

- `lib/UI/uiControls.cpp:5834` — the button constructor does `_size = cls >> "sizeEx"`
  (same at `:2536`, `:5171`, `:5878`).
- `El/ParamFile/paramFile.cpp:1772-1782` — if the value is not a number, it falls into
  `_file->EvaluateFloat(_value)`.
- `El/Evaluator/evaluatorExpress.cpp:46-56` — a null result triggers
  `LogF("Warning: Cannot evaluate '%s'")` + `ERROR_THROW(ErrorInfoText, "Cannot evaluate value")`.
- `lib/UI/uiContainers.cpp:497-508` — `LoadFromEntry` catches with `ERROR_CATCH_ANY`
  and only logs `Error loading control %s`; the display continues without that control.

**Proof in the runtime log**

`package-v32-terrain-menu-repair/profile-terrain-menu-v32/debug.log`:

| value | occurrences |
|---|---|
| `Size_Text_Very_Small` | 10 |
| `Size_Text_Small` | 8 |
| `Size_Text_Medium` | 2 |

There are 20 warnings because the screen is built twice (entry + mission return), and in
`DayZInt.RPT` this appears as 10 errors at `:1076-1085` and another 10 at `:1161-1170`:
`RscDisplayMultiplayer/controls/ButtonInternet`, `ButtonFavorite`,
`ButtonLAN`, `B_Cancel`, `B_Join`, `BrowserLabelName/Ping/Password/Full/BattlEye`.

The four `BrowserLabel*` have no `sizeEx` of their own: they inherit the broken value from
`BrowserLabelName`, which is why they fail together — 6 invalid values explain exactly
10 missing controls.

**Fix applied (V34)**

- `ui.pbo` → `RscDisplayMultiplayer`: `sizeEx` is a number again
  (`Very_Small=0.022`, `Small=0.027`, `Medium=0.033`).
- `dta/bin/config.bin` → `RscDisplayMain`: `DZ_MenuSlot*` used
  `idc="IDC_MAIN_MENU_SLOT_*"` (literal text, evaluated as a variable and nonexistent).
  Replaced with the values from `lib/UI/resincl.hpp:630-632`: `12025` (prev), `12027` (name),
  `12026` (next) — this removes the 3 errors from `DZ_MenuSlotPrev/Name/Next` and restores the
  controls used by `lib/UI/optionsUI.cpp:7399`.
- `prefix` of each PBO preserved (`DZ\ui\` and `bin\`), file lists checked
  (843 and 13 files), verification `CfgConvert -txt` without any trace of
  `Size_Text_*`/`IDC_MAIN_MENU_SLOT`.
- Package: `build/inventory-menu-v10/package-v34-sizefix/` (hardlinks from V33 + the two
  new PBOs), launcher `Start-DayZ-V34-SizeEx-Fix.bat`.

`[pending validation]` — open the browser in V34 and confirm the three tabs, the side
labels and the mission return without a frozen screen.

**Partial validation (17/11, 02:20)** — first V34 run:

- `profile-v34-sizefix/DayZInt.RPT` with **0** `Error loading control` (before: 10 per
  construction, 20 in the whole file) and **0** `Size_Text_*`.
- `debug.log` without any `Cannot evaluate 'Size_Text_*'` (before: 20).
- The client spent ~140 s compiling shaders (`D3DXCompileShader VSShaderPool`) and
  Windows marked it "not responding" — that is normal behavior for this DX9 build on
  first boot, not a freeze: `debug.log` keeps growing and the process becomes
  responsive again on its own (`Fill Objects took 12813 ms`, `Visibility set to 3000`).
- `Error: Binarize missed persistence for 'Land_A_FuelStation_Feed'` (10×) is art
  noise, already existed before and does not block the UI.

`[pending]` — confirm on screen the three tabs and the mission return.

`[strong hypothesis]` the "stuck character" is a consequence of this: in
`profile-terrain-menu-v32/DayZInt.RPT:1153` the client goes from `PLAYING` to
`MISSION ASKED` and rebuilds the browser; since every control failed, the display came up
empty over the frozen world — no HUD and no input.

## 9. Character animates but does not walk: `upDegree` read as a number — V35/V36

The symptom was as misleading as possible: **the character played the walk cycle and the
jump, the camera orbited, the inventory opened — but the position did not change**. No crash,
no on-screen error. Just a body animating in place.

### 9.1 What the log showed

Temporary instrumentation in `lib/soldierOld.cpp` and `lib/simul.cpp` (removed later),
writing one line per second to `DayZInt.RPT`:

```
DIAGMOVE t=... pos=13309.50,8.88,5356.29 pot=13309.50,8.88,5356.29 spd=0.00,0.00,0.00
         wW=0.00,0.00 fine=0 ctrl=1 land=1 obj=0 stat=1 rs=0 chg=1
DIAGANIM t=... move=-0.0000,-0.0000 info=-0.0000,-0.0000 adj=1.000 rel=-0.000,-0.000
         minmax=0.000,1000.000 pf=1.000 prim=<none> manual=1 dc=1
```

Three things screamed:

| field | value | reading |
|---|---|---|
| `prim` | `<none>` | no primary move in the queue |
| `info` | `0.0000,0.0000` | `AdvanceMoveQueue` returns no displacement |
| `minmax` | `0.000,1000.000` | default of `GetRelSpeedRange` **without** move info |

And the detail that closed the case: **in the menu the same log showed `prim=menu_idleunarmed0`**.
In other words, the move machine worked — it just could not find the standing player's move.

### 9.2 The cause: a string where the code expects `int`

The animation config writes the `upDegree` field as a **name**:

```cpp
// anims/CfgMovesMaleSdr2 (converted to text)
class KnockedDownActionsCivilLeft: NoActions
{
  ...
  upDegree="ManPosNoWeapon";
};
```

But the `ActionMap` constructor read it directly into `int`:

```cpp
// lib/motion.cpp:58 (before)
_upDegree = e >> "upDegree";
```

`ParamRawValue::GetInt()` only understands numbers (`El/ParamFile/paramFile.cpp:1784-1804`):
it tries `ScanInt`, then `ScanFloat`, and finally throws the string at the expression evaluator,
which does not know `ManPosNoWeapon` and returns **0**. Result: **every** action map
ended up with `_upDegree = 0`.

The proof was in the profile's `debug.log`, with **345** warnings:

| value | occurrences |
|---|---|
| `manposcombat` | 112 |
| `ManPosCrouch` | 93 |
| `ManPosNoWeapon` | 93 |
| `ManPosLying` | 25 |
| `ManPosLyingNoWeapon` | 13 |
| `ManPosSwimming` | 5 |
| `ManPosDead` | 2 |
| `ManPosHandGunStand` | 1 |
| `ManPosStand` | 1 |

### 9.3 The freeze chain

1. `Man::GetAutoUpDegree()` (`lib/soldierOld.cpp:15911-15918`) returns `ManPosNoWeapon`
   (value **12** in the `ManPos` enum, `lib/soldierOld.hpp:818-838`).
2. `MotionType::GetMove(upDegree, index)` (`lib/motion.cpp:758-776`) scans the action maps
   and only accepts `map->GetUpDegree() == upDegree`. Since all were `0`, it returns
   `MoveIdExt::none`.
3. `Man::ResetMovement` (`lib/soldierOld.cpp:4219-4250`) writes that `none` as the primary
   move — and `ResetMovement(0)` uses `ManActDefault` with `init = true`
   (`:4305-4311`), so the initial state was already born empty.
4. `KeyboardPilot` does `map = Type()->GetActionMap(primary)` (`:15561`). Without move info,
   `MovesTypeBase::GetActionMap` returns `NULL` (`lib/motion.cpp:1206-1211`).
5. With `map == NULL`, `moveWanted = GetDefaultMove()` (`:15820`), and `GetDefaultMove()`
   calls `GetMove(deg, ManActDefault)` — again `none`
   (`lib/soldierOld.hpp:388-393`).
6. `SetMoveQueue(none)` never leaves the empty state → `AdvanceMoveQueue` has no primary
   move → `info.moveX/moveZ = 0` → **no translation**. The animation continued because
   it comes from another path (direct control / blend).

It was not root motion: the 2,028 RTMs in `anims.pbo` were read in BMTR format and the speed
range was correct (walk 1.1–1.5 m/s; run 2.6–4.1 m/s). It was not static collision either
(`stat=1` is a pessimistic value from `CreatePotentialState`, read before the test), nor
`remoteState` (`rs=0`), nor the `frozen` block (`ctrl=1`).

### 9.4 The fix (V36)

A decode function in `lib/motion.cpp`, before the `ActionMap` constructor:

```cpp
static int DecodeUpDegree(RStringB value)
{
  static const char *names[] =
  {
    "Dead", "Weapon", "BinocLying", "LyingNoWeapon", "Lying",
    "HandGunLying", "Crouch", "HandGunCrouch", "Combat",
    "HandGunStand", "Stand", "Swimming", "NoWeapon", "Binoc", "BinocStand",
  };
  const char *text = value;
  if (!text || !*text) return 0;

  // accepts "ManPosXxx" and "Xxx", case-insensitively
  const char *shortName = text;
  if (!strnicmp(text, "ManPos", 6)) shortName = text + 6;
  for (int i = 0; i < (int)(sizeof(names) / sizeof(*names)); i++)
  {
    if (!strcmpi(shortName, names[i])) return i;
  }

  // numeric values (including -1 from NoActions) remain valid
  char first = text[0];
  if ((first >= '0' && first <= '9') || first == '-') return atoi(text);

  RptF("Unknown upDegree '%s'", text);
  return 0;
}
```

and the read becomes:

```cpp
_upDegree = DecodeUpDegree(e >> "upDegree");
```

Details that matter:

- The array order **is** the `ManPos` enum (`soldierOld.hpp:818-838`): `Dead=0`, `Weapon=1`,
  …, `NoWeapon=12`, `BinocStand=14`.
- `strcmpi`/`strnicmp` already existed in `El/platform.hpp:174-176` and are the same pattern used
  for `bodyPosition` in `soldierOld.cpp:12999-13009` — the rest of the engine already handled textual fields
  this way; only `upDegree` had been left behind.
- The config uses lowercase `manposcombat` in 6 classes, so case-insensitive comparison
  is not a luxury.
- `upDegree=-1` (3 classes) and `upDegree=0` (1 class) still go through the numeric branch,
  with no regression.

### 9.5 Measured validation

`package-v34-sizefix/profile-v36-updegree/DayZInt.RPT`, with the V36 exe:

```
DIAGMOVE t=87.75 pos=13309.75,8.87,5355.83  spd=0.00  prim=aidlpercmstpsnonwnondnon
DIAGMOVE t=88.76 pos=13307.98,9.30,5354.71  spd=1.46  prim=amovpercmstpslowwnondnon
DIAGMOVE t=90.78 pos=13313.47,8.18,5355.67  spd=6.80  prim=amovpercmevasnonwnondf
DIAGMOVE t=91.78 pos=13319.79,7.45,5358.28  spd=6.95  prim=amovpercmevasnonwnondfr
```

| | before | after |
|---|---|---|
| `pos` | fixed at `13309.50,8.88,5356.29` | changes every second (~6 m/s) |
| `prim` | permanent `<none>` | `amovpercmstpslowwnondnon` → `amovpercmevasnonwnondf` |
| `info` | `0.0000,0.0000` | `0.0668,0.0866` |
| `minmax` | `0.000,1000.000` | `0.850,1.000` |
| `spd` | `0.00,0.00,0.00` | `6.80`, `6.95` |
| `Cannot evaluate 'ManPos*'` | 345 in `debug.log` | **0** (`debug.log` 0 bytes) |
| `Unknown upDegree` | — | **0** (all names recognized) |

### 9.6 Versions and files

- **V36** — exe with patch + DIAG instrumentation (`DayZInt-v35-diag.exe` is the previous
  instrumented one without the patch; `DayZInt-v34-backup.exe` is clean V34).
- **V37** — **clean** exe: patch kept, instrumentation removed
  (`DayZInt-v37-clean.exe`, SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C`,
  13,639,680 B).
- Launchers: `build/ABRIR-DAYZ-V36.bat` (instrumented) and
  `build/ABRIR-DAYZ-V37.bat` (clean).
- Restore points:
  - `build/inventory-menu-v10/restore-point-v36-updegree-20261117/motion.cpp`
    (original, SHA-1 `E2BF90EFB071826AFD77DCB2EBA34B0E1838A4A0`)
  - `…/motion-PATCHED-updegree.cpp` (with the fix)
  - `build/inventory-menu-v10/restore-point-v35-diagmove-20261117/` (original `soldierOld.cpp` and
    `simul.cpp`, used to remove the instrumentation without losing anything else — the
    diff was insertion only: +57 and +15 lines).
