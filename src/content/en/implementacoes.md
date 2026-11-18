# New implementations

Eleven tracks that did not exist in the original project and now do — code, tools,
builds and documentation.

## 1. 0.45 engine compiling with v141

The source is from 2001 and declares `v100`. On this machine the build runs with **MSVC 14.16 (v141)** and
**MSBuild 15.9.30**, producing `build\inventory-menu-v10\cpp-out-v31\DayZInt.exe`. It required
adjustments to old headers (`math3dp.hpp`, `enf_mathlib.h`, `typeopts.hpp`, `appName.h`,
`wpch.hpp`, `SimulWeatherDX9.hpp` and several `.cpp`), all preserved in
`backup-v141-compat-20261116/`.

Known and accepted warnings: `C4005` (`DXGI_ERROR_*` between DXSDK 2010 and SDK 10), `C4477` in
`txtd3d9.cpp:3843` and `LNK4217` (`_floor` in `xapobased.lib`). DirectX remains **DX9**; there
was no migration to DX11.

## 2. Item rotation in the inventory, replicated by the server

It did not exist before. Now space rotates the item and the state is synchronized:

| Step | File |
|---|---|
| Input | `lib/UI/uiMap.cpp:6544-6549` · `CItemBase::RotateInventoryItem` |
| Send | `lib/Network/networkClient.cpp:7669` · `AskForRotateInventoryItem` |
| Message | `lib/Network/networkImpl.hpp:370` · `DECLARE_NET_MESSAGE` |
| Server | `lib/Network/networkServer.cpp:6796` |
| State | `lib/Network/networkClient.cpp:4519` · `IsInventoryRotated()` |
| Interface | `lib/Network/network.hpp:1093` and `:1411` |

## 3. Main menu, pause and server browser

31 versioned packages (`package-v10` … `package-v31`) plus V32, V32.1, V33, V34 and V38, with
a restore point before each step:

- three working tabs: **OFFICIAL / COMMUNITIES / LAN**; HISTORY/FRIENDS/REMOTE off screen
- menu layout adjusted (`cfg/Bin/rscScreen.hpp`, `lib/UI/optionsUI.cpp`)
- mod launcher control positioned in the menu
- statistics were no longer fixed text (`"NOT SYNCED"` → `0m` / `0`)
- `ui.pbo` edited directly, without depending on `@MenuCleanup`
- native tab types (`type=106`), `B_Cancel`/`B_Join` fixed, inactive
  `controlsBackgroundx`/`controlsx` blocks removed, a single logo and Early Access closed
- **V38 — new pause menu:** `RscDisplayMPInterrupt` and `RscDisplayInterrupt` rewritten in the
  `ui.pbo` config; `PausePanel`/`PauseAccent`/`PauseTipPanel` removed via `delete`;
  IDs preserved (101 OPTIONS, 104 EXIT, 122 RESPAWN, 1 CONTINUE); 3D world in the background, logo,
  “DAYZ 0.45.124252”, “BUILD MODIFICADO - V38”, “Check-up completo 25/35” card and the list
  EXIT / OPTIONS / CONTINUE. Only `ui.pbo` changed relative to V34.

The current `ui.pbo` is 48,349,274 B (46.1 MiB), SHA-256
`EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500`.

## 4. Porting the DayZ 1.30 animations

The largest track of the project. Full detail is in the **Animations 1.30** tab; the summary is:

| Item | Value |
|---|---|
| RTMs in the 0.45 `anims.pbo` | 2,028 |
| In 1.30 format (`RTM_0101`) in E6 | **1,390 (68.5%)** |
| Kept as 0.45 `BMTR` | 638 |
| Available 1.30 collection | 7,415 RTMs |
| Files swapped in the manifest | 1,526 unique paths (1,527 records) |
| 1.30 menu excluded | 140 files |
| Active gameplay from the manifest | 1,386 |
| Extras outside the manifest | 4 (`InjL...breath` ×3, `Ainv...pills`) |
| `ik/` tracks replaced | 84 (includes the 2 battery ones) |
| `batteryLicking` states | 4 |
| Bone trim | 1,526 files · 1,425.9 → 1,091.5 MB · **−23.45%** (1,523 in the first pass) |
| Build in game | **E6** (875.8 MiB) |
| Ready build | **E7** (875.7 MiB, 2 IKs reverted) |

**Formats:** 0.45 uses `BMTR` (v3), with a zero-terminated name table and per-frame compressed
data; 1.30 uses `RTM_0101`, with fixed 32 bytes per name and 80 bytes per bone per frame
(20 values). The 0.45 engine reads both. Bones are matched by **name**; the order differs
in 100% of the swaps and that breaks nothing.

**Coverage of what stayed 0.45:** 273 zombie animations (different rig), 140 menu, 33
test/visema/props and ~192 player files that do not exist in 1.30 (weapon swap by slot, stops,
urinate, defecate, `m4_check`, `_right` variants, `ik`).

**Decisions:** 1.30 menu out (141 files, 333 MB raw / 255 MB trimmed); inventory preview
reverted to 0.45 in E6; 1.30 transitions (171 posture, 512 reload, 80
unjam, 77 weapon switch, 96 attack and 270 hit) have no equivalent state in the 0.45 config
and were kept; weapon swap, stops and urinate/defecate are procedural in the config, not
files.

**Validation:** E6 entered the world with `PLAYING` and the vanilla baseline of **12**
`not found or empty`, **23** `Bad move` and **15** `Invalid move ... disarm`, with no new animation
error. The open bug is the flashlight + battery (see the bugs tab).

## 5. Reproducible animation pipeline

| Tool | Function |
|---|---|
| `trim_rtm.py` | filters the 1.30 RTM bones to the 0.45 BMTR set |
| `stage_e6.py` | assembles the build staging (0.45 menu, extras, trim) |
| `pack_pbo.py` | packs the PBO in the 0.45 format with SHA1 at the end |
| `verify_e6.py` / `verify_e7.py` | checks entries, RTM sizes and byte-by-byte samples |

The working collection occupies **20.41 GB** in `ANIMS-WORK-20261117`: staging trees, E1–E7
builds, `trimmed_e4`, backups and `replaced_files.json` with the manifest of the swaps.

## 6. Diagnostics built into the engine

Temporary instrumentation that made the bugs visible:

- `DIAGMOVE` / `DIAGANIM` in `soldierOld.cpp` and `simul.cpp` — one line per second with
  `pos`, `spd`, `prim`, `info`, `minmax`, `pf`, `ctrl`, `stat` (removed in V37)
- `[ZombieCollisionDiag]` and `[ZombieCollisionStartOverlap]` in `zombie.cpp`, limited to
  1 log/s on the server
- RTM reading in Python (header, bones, frames) used to prove that the root motion
  was correct
- PBO comparison with BankRev (`-d`, `-properties`) and `CfgConvert -test` to validate
  configs before packing

## 7. Automated test launcher

Scheduled task `DayZTestLaunch`: starts the server, waits 40 s and opens the client at
`-connect=127.0.0.1 -port=2322`. Together with the RPT checklist (12 / 23 / 15 / `PLAYING`),
it allows comparing builds in minutes. The script also raises the game priority to
`AboveNormal` when the engine build is running in parallel.

## 8. Documentation site

This very site: functions, translated comments, patches, findings, bugs, dictionary,
tools, the **animation dossier**, the **pending** tab and the **updates** tab
with seven tabs (fixed bugs, GitHub feed, manual updates, new implementations,
animations 1.30, builds E1–E7 and timeline). Built in `site\dist` and served by Vite.

## 9. Version, WRP and hash discipline

- `backup-<theme>-<date-time>/` keeps only the files touched before each change
- `build/inventory-menu-v10/restore-point-vNN-*/` keeps source + EXE + MAP (+ PDB) before
  each build
- each `package-vNN` is an isolated playable installation, with its own launcher and profile
- `HISTORICO-CORRECOES-E-PENDENCIAS.md` records SHA-256 of EXE, `ui.pbo` and
  `worlds_chernarusplus.pbo` per version
- **WRP rule:** client and server must use the same `worlds_chernarusplus.pbo`
  (revision + SHA-256). If a future build repacks the client WRP, the entry crash
  comes back. The manual procedure is in five steps in the history.
- **PBO rule:** the prefix has a single backslash (`prefix=bin\`, not `prefix=bin\\`).

## 10. Analysis and verification tools

| Tool | Use |
|---|---|
| `BankRev` | list, extract, compare PBOs (`-d`, `-properties`) |
| `CfgConvert` | convert and validate `config.bin` (`-test`, `-txt`) |
| `certutil` / `Get-FileHash` | check SHA-1/SHA-256 of EXE, PBO and build |
| Python | read `BMTR`/`RTM_0101`, trim bones, pack and verify PBO |
| PowerShell | orchestrate builds, priorities, RPT and launcher |

Current hash reference:

| File | Bytes | Hash |
|---|---:|---|
| `Addons\anims.pbo` (E6 installed) | 918,323,340 | SHA-1 `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| `out\anims_E7.pbo` | 918,285,584 | SHA-1 `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| `Addons\ui.pbo` (V38) | 48,349,274 | SHA-256 `EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500` |
| `DayZInt-v37-clean.exe` | 13,640,192 | SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22` |
| `worlds_chernarusplus.pbo` | 120,164,803 | SHA-256 `0B8DAD26F376B892376C45240D630C14C126A84D0C31D0492384EF9371C78E28` |
| `dta\bin.pbo` (V38) | 5,218,347 | SHA-256 `59FF087A82E023307F9E91089785332A8B4CCB35D30B77EEC65DDDE7E1B6074F` |

## 11. Task board, bug log and GitHub feed

The **Pending** and **Bugs** pages are no longer read-only. The task board and the
bug log now allow creating, editing, starting, blocking, completing, reopening and deleting
items. Every completion requires an outcome with four mandatory answers: **what it was**, **how
it was fixed**, **what was used** and **how many attempts** were needed before actually solving
it. The same applies to completed tasks, with the text adapted to “what was done”.

Storage is local (`localStorage`, key `sourcedayz.board.v1`), with export and
import of `board.json`. Whoever has the source can publish the board to
`site-data/board.json` in the **Personed/Game** repository and the curated changelog to
`site-data/updates.json`. Publishing uses a fine-grained token with **Contents: Read and write**,
kept only in the browser session; without a token, the path is to export the JSON and commit by hand.

The **Updates** page gained two tabs: **GitHub Feed**, which reads commits, releases and the
`site-data/updates.json` manifest directly from `Personed/Game`, and **Manual updates**, where the
team records the curated changelog. The **Patches** page shows the same commit feed at the end,
so that a patch published in the repository appears on the site without manual editing. When the manifest
does not exist yet, the feed explains what is missing instead of failing.
