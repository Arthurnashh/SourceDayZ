# Timeline

The order in which things happened, with the version/package of each step. Useful to quickly
find "what was running on day X" and which backup to use.

## 16/11/2026 — engine, collision, inventory and menu

| Time | Step | Result |
|---|---|---|
| — | v141 build validated | MSBuild 15.9.30, MSVC 14.16, output in `cpp-out-v31` |
| 06:55 | Q/E lean running | backup `backup-lean-strafe-20261116-065525` |
| — | zombie collision | artifacts `zombie-collision-diag-v102` … `v123` |
| — | inventory: rotation + hands | `package-v10` … `package-v13` |
| — | menu/pause/browser | `package-v14` … `package-v27` |
| 22:49 | V27–V28: client WRP ≠ server WRP | client rev. 17983, server 17865; V28 aligned them |
| 23:04 | **V28** — WRP aligned | `worlds_chernarusplus.pbo` rev. 17865, SHA-256 `0B8DAD26…8E28` |
| 23:38 | **V29** — native tabs | `type=106`, `B_Cancel`/`B_Join`, config passed `CfgConvert` |
| 23:38 | **V30** — texture guard | validations in `GetPixel`/`GetRect`/`RequestGetRect` |
| — | **V31** — mip guard | `_nMipmaps`/`level`; **visual regression** (pink terrain, no 3D, 6 tabs) |

## 17/11/2026 — terrain, UI, movement and animations

| Time | Step | Result |
|---|---|---|
| 01:01 | **V32** — terrain and menu repair | 509 files in `worlds_chernarusplus_data.pbo` different; green terrain in V32.1 |
| 01:13 | **V32.1** — `bin.pbo` prefix | `prefix=bin\\` → `prefix=bin\`; fixes `No entry '.CfgAddons'` |
| 01:31 | **V33** — UI PBO / browser | stage and restore point before V34 |
| 02:20 | **V34** — `sizeEx` and `idc` | 0 `Error loading control`, 0 `Size_Text_*` |
| 03:17 | **V35** — diagnostics | instrumented DIAGMOVE/DIAGANIM, no patch |
| 03:52 | **V36** — `upDegree` | patch + instrumentation; character walks again |
| 04:45 | **V38** — pause menu | `RscDisplayMPInterrupt`/`RscDisplayInterrupt` rewritten; only `ui.pbo` |
| 07:57 | **V37 clean** | `upDegree` fixed, instrumentation removed (`DayZInt-v37-clean.exe`) |
| 11:02 | animations **E1** | first complete 1.30 package (1,056.5 MiB) |
| 11:13 | **E2** | 1,030.1 MiB |
| 11:45 | **E3** | 1,037.8 MiB + backup kept |
| 12:12 | **E4** | bone trim: 874.4 MiB |
| 12:33 | **E5** | +5 mappings (throws and preview) |
| 16:01 | **E6** | 0.45 preview back, 875.8 MiB |
| 23:40 | E6 in-game test | `PLAYING`, 12 / 23 / 15 — baseline |
| 23:58 | documentation: Pending and dossier | new tabs on the site |

## 18/11/2026 — flashlight fix and delivery

| Time | Step | Result |
|---|---|---|
| 00:03 | **E7** packed | 918,285,584 B · 2,053 entries · 2 IKs reverted |
| — | E7 verification | 2,028 valid RTMs, 10/10 samples OK |
| 00:10 | attempt to launch v37-clean client | RPT stopped at `Cannot load material file`; exited in ~75 s, no crash |
| 00:13 | **Updates** tab on the site | bugs, implementations, animations, builds and timeline |
| 00:44 | FPS **F2** compiled (parallel track) | Release ready, runtime copied |
| — | **F2** tested in Berezino | character/houses ok; **intermittent grass and shadow on the back**; low FPS; track paused |
| — | final site build (Updates with 5 tabs) | bundle in `site\dist\assets` |

## Executable versions

| Version | What it is | Hash |
|---|---|---|
| `DayZInt-v34-backup.exe` | clean V34, before movement diagnostics | — |
| `DayZInt-v35-diag.exe` | instrumented V35 (DIAGMOVE/DIAGANIM), no patch | — |
| `DayZInt-v37-clean.exe` | **current** — `upDegree` fixed, instrumentation removed | SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C` · SHA-256 `32D93E90…5E22` |
| V30 EXE | texture guard | SHA-256 `8835CBE7…8A0A` |
| V32 EXE | terrain/menu repair | SHA-256 `10F94200…CD35` |

## Playable packages

Each `package-vNN` is an isolated installation, with its own launcher and profile:

```text
build\inventory-menu-v10\
  package-v10 … package-v31      menu, pause and browser
  package-v32-terrain-menu-repair
  package-v32.1 / stage-v33      intermediate fixes
  package-v34-sizefix            browser fix
  package-v38-pause-menu         current package (anims.pbo E6 + ui.pbo V38)
```

## Reference hashes (current state)

| File | Bytes | Hash |
|---|---:|---|
| `Addons\anims.pbo` (E6) | 918,323,340 | SHA-1 `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| `out\anims_E7.pbo` | 918,285,584 | SHA-1 `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| `Addons\ui.pbo` (V38) | 48,349,274 | SHA-256 `EBC95ACE…5500` |
| `DayZInt-v37-clean.exe` | 13,640,192 | SHA-256 `32D93E90…5E22` |
| `worlds_chernarusplus.pbo` | 120,164,803 | SHA-256 `0B8DAD26…8E28` |
| `dta\bin.pbo` (V38) | 5,218,347 | SHA-256 `59FF087A…074F` |

## Backups and restore points

| Path | Holds |
|---|---|
| `backup-v141-compat-20261116\` | old headers adjusted for v141 |
| `backup-lean-strafe-20261116-065525\` | `lib/soldierOld.cpp` before leaning |
| `backup-inventory-redesign-20261117\` | inventory before the redesign |
| `restore-point-v16-pause-controls-20261116\` | pause menu controls |
| `restore-point-v27-before-wrp-align-20261116\` | PBO/WRP before alignment |
| `restore-point-v28-before-v29-menu-20261116\` | menu before native tabs |
| `restore-point-v30-before-texture-guard-20261116\` | before the texture guard |
| `restore-point-v31-before-invalid-mip-level-20261117\` | before the mip level |
| `restore-point-v32-before-terrain-menu-repair-20261117\` | before the terrain repair |
| `restore-point-v32-cfgaddons-prefix-20261117\` | before the `bin.pbo` prefix |
| `restore-point-v33-before-ui-pbo-fix-20261117\` | before the UI PBO |
| `restore-point-v35-diagmove-20261117\` | original `soldierOld.cpp`/`simul.cpp` |
| `restore-point-v36-updegree-20261117\` | original and fixed `motion.cpp` |
| `restore-point-v38-pause-menu-20261117\` | `ui.pbo` before the pause menu |
| `ANIMS-WORK-20261117\backup\anims_E3_instalado.pbo` | previous animation build |
