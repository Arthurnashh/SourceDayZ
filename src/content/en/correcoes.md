# Fixed bugs

**12 bugs fixed**, **1 open** (flashlight + battery) and **7 investigations closed without
a patch**. Each item brings the symptom seen in game, the cause measured in code or in the log and
the fix that went into the build.

## 1. Character animated but did not walk

**Symptom:** the body played the walk cycle and the jump, the camera orbited, the inventory
opened — and the position did not change. No crash and no on-screen error.

**Cause:** the config writes `upDegree="ManPosNoWeapon"` (text), but the `ActionMap`
constructor read it directly into an `int` (`_upDegree = e >> "upDegree"`). The evaluator did not know the
name and returned **0** for every map. `debug.log` had **345** warnings
`Cannot evaluate 'ManPos*'`: `manposcombat` 112, `ManPosCrouch` 93, `ManPosNoWeapon` 93,
`ManPosLying` 25, `ManPosLyingNoWeapon` 13, `ManPosSwimming` 5, `ManPosDead` 2,
`ManPosHandGunStand` 1, `ManPosStand` 1.

**Chain:** with every `_upDegree = 0`, `MotionType::GetMove()` returned `none`,
`ResetMovement` wrote `none` as the primary move, `GetActionMap` returned `NULL`,
`GetDefaultMove()` returned `none` again and `AdvanceMoveQueue` was left without translation. The
animation continued because it came from another path (direct control / blend).

**Fix:** `DecodeUpDegree()` in `lib/motion.cpp`, before the `ActionMap` constructor.
Accepts `ManPosXxx` and `Xxx` case-insensitively, keeps numeric values (`-1`, `0`) and
logs `Unknown upDegree` for an unknown name.

**Validation:** `pos` started changing ~6 m/s, `prim` went from `<none>` to
`amovpercmevasnonwnondf`, `info` from `0.0000` to `0.0668,0.0866`, `minmax` from `0.000,1000`
to `0.850,1.000`, and the 345 warnings went to **0**. Clean version: **V37**
(`DayZInt-v37-clean.exe`, SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C`,
13,639,680 B).

## 2. Zombie walking through walls

**Symptom:** zombies entered static buildings and got stuck inside.

**Cause:** three problems in the `Man` movement sweep (`lib/zombie.cpp:1068-1145`):
`IsPassable()` is a mass threshold (<10), not a map rule — static buildings passed;
initial overlap produced `under == 0` and was not treated as entry time; and the 1% step margin
still pushed inside on short steps.

**Fix:** the zombie respects **any** static geometry hit (`obj->Static()`), even
passable; initial overlap goes to the body solver; fixed margin of `0.005` with
repositioning at `minT`.

**Diagnostics:** `[ZombieCollisionDiag]` and `[ZombieCollisionStartOverlap]`, limited to 1 log/s
on the server. Artifacts `zombie-collision-diag-v102` … `v123`; servers
`DayZServer-ZombieCollisionFix.exe`, `DayZInt-ZombieCollisionFixV120.exe` and
`DayZServer-ZombieStuckCollision.exe`. The current test server is
`DayZServer-DoorUserTypeExecV127`.

## 3. Leaning with Q/E did not work while running

**Symptom:** holding Q/E while standing still leaned; while running, it did nothing.

**Cause:** the fast-run/strafe maps do not define the lean offsets
(`GetLeanRRot`/`GetLeanRShift`), and fast locomotion clips zero `LeaningFactor`.

**Fix:** in `Man::RecalcLeaningTransform()` (`lib/soldierOld.cpp:17190-17250`), fallback
to the stop map of the same movement family when the offsets are zero, and preservation
of the player's request (`leaningFactor = 1.0` if Q/E is pressed).

**Backup:** `backup-lean-strafe-20261116-065525/lib/soldierOld.cpp` (diff of 24,115 → 24,148
lines). `mainInput.cpp` and `soldierOld.hpp` did not change.

## 4. Crash on entering the game: different WRP + invalid mip

**Symptom:** crash during loading, in material/texture; the client reached
`GAME LOADED` but went down with `C0000094 INT_DIVIDE_BY_ZERO`.

**Cause 1 — map:** the client and server used `worlds_chernarusplus.pbo` with different
revisions. V27 client: revision **17983**, SHA-256 `0EF016A7…F640`; server: revision **17865**,
SHA-256 `0B8DAD26…8E28`. The extracted WRP was also different. The `config.bin` inside the PBO was
the same, so the deviation was the WRP/revision.

**Cause 2 — texture:** an invalid mip led to division by zero in `TextureD3D9` and the assert
remained at `TextBankD3D9::UseMipmap` (`txtd3d9.cpp(4186): Assertion failed 'level >= 0'`).

**Fix:** **V28** aligned `worlds_chernarusplus.pbo` and the signature to the server
(revision 17865, 120,164,803 B, SHA-256 `0B8DAD26…8E28`). The crash persisted, so **V30**
added validations in `GetPixel`, `GetRect` and `RequestGetRect`, and **V31** validated
`_nMipmaps` and clamped `level`/`levelA` before the assert in `TextBankD3D9::UseMipmap`.

**Backups:** `restore-point-v27-before-wrp-align-20261116`,
`restore-point-v30-before-texture-guard-20261116`,
`restore-point-v31-before-invalid-mip-level-20261117`.

**Note:** V31 was delivered, but showed a visual regression (red/pink terrain, missing
3D background and six legacy tabs). It was **not** accepted as final; V32 repaired the terrain and the
menu. See bug 5.

## 5. Red/pink terrain and menu without a 3D scene

**Symptom:** after V31, the ground appeared red/pink, the main menu had no 3D
scene and the browser showed the six legacy tabs (INTERNET/FAVORITES/HISTORY/FRIENDS/LAN/
REMOTE).

**Cause:** the V31 `worlds_chernarusplus_data.pbo` had **509 files different** from the
current `Addons`, including `layers\*_lco.paa` textures, even though both declared revision
17380. V31 was combining the server WRP (17865) with a different texture package.

**Fix (V32):** `worlds_chernarusplus_data.pbo` and the signature went back to those of the
current `Addons`; the server WRP remained intact. `dta\bin.pbo` now defines the native tabs
`OFFICIAL` / `COMMUNITIES` / `LAN`, with HISTORY/FRIENDS/REMOTE off screen and native IDs
preserved. `RscDisplayMain` again runs the native `onLoad`, the Early Access
notice got immediate closing and the DayZ logo stayed in a single control.

**Validation:** the V32.1 capture showed **green** terrain, without the pink/red look. The menu
3D scene, the three tabs and the mission return remain as visual checks; the current
package is **V38**.

**V32 hashes:** EXE `10F94200…CD35`; `dta\bin.pbo` V32.1 `03A7CAD7…CC9D`; world data
`7DB7A946…087C`; WRP `0B8DAD26…8E28`. Restore point:
`restore-point-v32-before-terrain-menu-repair-20261117`.

## 6. `Unable to open dta\bin.pbo` and `No entry '.CfgAddons'`

**Symptom:** the first V32 would not open `dta\bin.pbo`; the RPT logged
`Unable to open dta\bin.pbo`, followed by `No entry '.CfgAddons'` and `.PreloadAddons`.

**Cause:** the PBO metadata was packed with `prefix=bin\\` (two literal backslashes), but the
game requires `prefix=bin\` (one backslash). The working V31 PBO used one backslash.

**Fix (V32.1):** metadata corrected to `prefix=bin\`, PBO repacked and checked in
BankRev. The re-extracted `config.bin` has an SHA-256 identical to the compiled one
(`C2D44BC3…CD1D`); the fixed `bin.pbo` has SHA-256 `03A7CAD7…CC9D`. Restore point:
`restore-point-v32-cfgaddons-prefix-20261117`.

**Note:** the `dta\bin.pbo` in the V38 package is a later revision (SHA-256
`59FF087A…074F`), not V32.1. The single-backslash rule applies to any repack.

## 7. Server browser missing 10 controls

**Symptom:** empty browser screen, repeated `Error loading control`, frozen world behind.

**Cause:** the controls **were not even created**. `sizeEx` held text
(`Size_Text_Very_Small`, `Small`, `Medium`) and evaluation threw an exception swallowed by
`ERROR_CATCH_ANY`. The four `BrowserLabel*` inherited the broken value from `BrowserLabelName`,
which explained exactly 10 missing controls: `ButtonInternet`, `ButtonFavorite`,
`ButtonLAN`, `B_Cancel`, `B_Join` and `BrowserLabelName/Ping/Password/Full/BattlEye`. In the main
menu, `DZ_MenuSlot*` used `idc="IDC_MAIN_MENU_SLOT_*"` as literal text.

**Fix (V34):** `sizeEx` went back to a number in `ui.pbo` (`Very_Small=0.022`, `Small=0.027`,
`Medium=0.033`) and the `idc` values were replaced with those from `lib/UI/resincl.hpp:630-632`
(`12025` prev, `12027` name, `12026` next) in `dta/bin/config.bin`.

**Validation:** **0** occurrences of `Error loading control` and `Size_Text_*` in the V34 RPT
(before: 10 per construction, 20 total). Package: `package-v34-sizefix`.

## 8. Menu with legacy tabs, wrong control types and Early Access

**Symptom:** the new menu appeared but kept old texts/elements (Early Access,
2013 logo/copyright), lost tab labels or had a blue background without a 3D scene;
`B_Cancel`/`B_Join` had an incompatible type and `controlsBackgroundx`/`controlsx` blocks
stayed active.

**Cause:** the tabs had no `type=106`; the back/join controls were replaced by an
incompatible type; the native `onLoad` of `RscDisplayMain` was zeroed; there was more than one
logo control and the Early Access callback was still active.

**Fix (V29 + V32):** native tab type fixed; `B_Cancel`/`B_Join` preserved;
inactive blocks removed; Early Access callback removed; a single logo control; the
`config` passed `CfgConvert -test` and the PBO was opened by BankRev. V32 closed the legacy
tabs and restored the native `onLoad`.

**Check pending:** menu 3D scene and mission return without legacy overlap — the
current V38 package introduced the new pause menu, but visual validation remains manual.

## 9. Rotating an item in the inventory closed the inventory

**Symptom:** pressing space to rotate the item closed the screen.

**Cause:** the screen's default button consumed the space `keyup` after the `keydown` had
already been handled as rotation.

**Fix:** consume `DIK_SPACE` on `keyup` while the inventory is open
(`lib/UI/uiContainers.cpp:2166-2175`).

## 10. Item did not follow the slot when moving between hands, pants, shirt and backpack

**Symptom:** the item stayed "stuck" in the old slot or the action was cancelled when closing the screen.

**Fix:** iterations of slot item synchronization (`Hands`) and action cancellation
in the inventory screens — packages `package-v10` to `package-v13`.

## 11. Inventory preview with the wrong pose

**Symptom:** in the inventory the character appeared stretching, with raised arms.

**Cause:** the 1.30 preview (`p_menu_unarmed_idleMain01`) is a stretching pose, not a
menu idle.

**Fix:** preview reverted to the 0.45 RTM in build **E6**; the rest of the animations
stayed in 1.30. `p_menu_unarmed_idleMain02` was never tested.

## 12. Game "not responding" on open

**Symptom:** client and server started with 7–15 MB, 0% CPU and "Not responding" for several
minutes.

**Cause:** it was not the PBO — the processes were at `BelowNormal` priority and five `CL.exe`
from an engine build used 100% of the 4 cores. In ~7 minutes the client had received
0.7 s of CPU.

**Operational fix:** game at `AboveNormal` and build at `BelowNormal` during the test;
fixes it immediately. The rule of thumb was recorded in the dossier. The same picture happened again
with E6 under low priority + parallel build.

## Open: flashlight + battery stretch the arms

**Symptom:** holding the flashlight and battery, the character stretches his arms (elastic effect) and the
item turns into a giant board; it happens in the holding pose and in the **Lick battery** action.

**Suspects:** the 4 `Cdzp..._batteryLicking` states and the 2 IK tracks
`ik\comsumables\9v_battery.rtm` / `battery_d.rtm`, all replaced by 1.30.

| State | E6 (1.30) | 0.45 (BMTR) |
|---|---|---|
| `CdzpAmovPercMstpSnonWnonDnon_batteryLicking` | 4,143,192 B · 431 frames | 87,976 B · 67 frames |
| `CdzpAmovPercMstpSrasWnonDnon_batteryLicking` | 493,672 B · 51 frames | 88,858 B · 67 frames |
| `CdzpAmovPknlMstpSnonWnonDnon_batteryLicking` | 1,358,032 B | 87,971 B |
| `CdzpAmovPpneMstpSnonWnonDnon_batteryLicking` | 1,655,756 B | 89,012 B |
| `ik\comsumables\9v_battery.rtm` | 23,076 B | 4,187 B |
| `ik\comsumables\battery_d.rtm` | 23,076 B | 4,209 B |

**Hypotheses, in order:** (1) consumable IK tracks with a 1.30 target that does not match the 0.45
rig; (2) `batteryLicking` with 431 frames where 0.45 expects 67; (3) `Acts...battery`
transitions from the 0.45 config.

**E7 build ready:** `out\anims_E7.pbo` (918,285,584 B, SHA-1
`A986CA7C65D1820297CA9EF1EAFC7A1599F6166C`), 2,053 entries, 2,028 RTMs (1,388 RTM_0101 +
640 BMTR), with `9v_battery` and `battery_d` reverted to 0.45 BMTR. Still **not installed or
tested**; E6 remains in game.

## Investigated and discarded

### Red "default character" warning

Not a project bug. It is vanilla: the spawn script in `Addons\modules_dayz.pbo` uses
`_this select 5` and shows the warning on a local server without a hive. It appears before any
change. The offer to comment out the line exists, but **was not applied**.

### Character motionless in V32.1

The RPT reached `GAME LOADED` and `PLAYING`, the server saved the character as alive and logged
`Arthurnashh`'s disconnect after 119.672 s. The symptom was probably window focus loss /
session interruption, not an animation failure. Movement/animation was not changed because of it.

### `Bad move` and `Invalid move ... disarm`

Vanilla noise. The baseline for all sessions is **12** `Animation ... not found or empty`,
**23** `Bad move` and **15** `Invalid move in action disarm` — including at 04:57, before
any change. E6 closed on those same numbers.

### Bone order

It is not the cause of the battery bug. In the 1,387 paired swaps analyzed, the bone set was
identical and the **order** was different in 100% of cases; the animations play correctly because
the engine matches by **name**, not by index.

### 1.30 menu

Left out on purpose: 141 files, 333 MB raw / 255 MB trimmed. It is cosmetic preview
only and pushes the ~1.1 GB PBO ceiling.

### V31 regression

V31 was not accepted: red/pink terrain, missing 3D background and six legacy tabs. V32
repaired it; the record stays so as not to repeat the combination of server WRP + textures from another
package.

### Vanilla noise in the RPT

`Cannot register unknown string STR_ACTION_THROW`, `Conflicting addon DZ_Pistols_Encore`,
`Item ... listed twice`, `Binarize missed persistence for 'Land_A_FuelStation_Feed'` and
`Cannot load material file physics/materials.h` already existed before the changes and do not block
the UI. They are not treated as a regression.
