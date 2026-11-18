# Builds E1 to E7 · history

Record of the animation builds generated between 17 and 18/11/2026. All of them
come from `ANIMS-WORK-20261117\out\` and the tested one becomes `Addons\anims.pbo`.

| Build | Time | Size | What changed | Result |
|---|---|---|---|---|
| E1 | 17/11 11:02 | 1,056.5 MiB | first complete 1.30 RTM package | loaded, but above the safe ceiling |
| E2 | 17/11 11:13 | 1,030.1 MiB | batch adjustment | stable |
| E3 | 17/11 11:45 | 1,037.8 MiB | more batches, 1.30 menu still inside | stable; backup kept |
| E4 | 17/11 12:12 | 874.4 MiB | **bone trim** on 1,523 files + 0.45 menu | 12 missing, 23 `Bad move`, `PLAYING` |
| E5 | 17/11 12:33 | 878.6 MiB | +5 mappings (throws and 1.30 preview) | tested; preview rejected |
| **E6** | 17/11 16:01 | **875.8 MiB** | preview reverted to 0.45, 1.30 throws | in game, no new error |
| **E7** | 18/11 00:03 | **875.7 MiB** | 2 stack IKs reverted to 0.45 | ready, **not installed/tested** |

## E6 reference (in game)

```text
file      Addons\anims.pbo
bytes     918,323,340
MiB       875.8
entries   2,053
RTMs      2,028 valid (1,390 RTM_0101 + 638 BMTR)
SHA1      7AF6688728D015F9A326B257918AC51F95CBEA48
```

The `replaced_files.json` manifest has **1,526 unique paths** (1,527 records, one
duplicate): 140 menu entries, which stayed out of E6, and 1,386 gameplay entries, which
went in. Besides those, 4 RTMs from 1.30 were added outside the manifest (3
`InjL...breath` and 1 `Ainv...pills`), completing the 1,390.

## E7 reference (ready)

```text
file      ANIMS-WORK-20261117\out\anims_E7.pbo
bytes     918,285,584
MiB       875.7
entries   2,053
RTMs      2,028 valid (1,388 RTM_0101 + 640 BMTR)
SHA1      A986CA7C65D1820297CA9EF1EAFC7A1599F6166C
samples   10/10 identical to the tree
change    9v_battery.rtm (4,187 B) and battery_d.rtm (4,209 B) in 0.45 BMTR
```

E7 is the **first step** of the flashlight/battery fix. If the bug persists, the next step
is to revert the 4 `batteryLicking` states to 0.45 and repack as E8.

## Discarded builds (reference)

| Build | Bytes | Reason for discarding |
|---|---|---|
| `anims_teste` | 169 MB | assembly test |
| `anims_full` / `v2` | 516 MB | missing the final config |
| `anims_transitions` | 520 MB | transitions-only batch |
| `anims_D1` | 520 MB | config bisect |
| `anims_D1_sig` | 634 MB | with armed signals |
| **`anims_D2`** | **1,374 MB** | **stuck at `Updating base class ->Grid` — size ceiling** |
| `anims_E1`–`E3` | 1,030–1,038 MiB | too heavy |

## Install and test

```bat
:: 1. close the game (the PBO is locked while the client runs)
:: 2. copy (replace E@ with the desired build)
copy /Y "D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo" ^
     "D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\Addons\anims.pbo"

:: 3. check the hash
certutil -hashfile "...\Addons\anims.pbo" SHA1

:: 4. start server + client
schtasks /run /tn "DayZTestLaunch"
```

Expected hash after copying:

| Build | SHA1 |
|---|---|
| E6 | `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| E7 | `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |

## How to read the RPT

The RPT is **append-only**: to measure the current session, cut the text at the last
`Current time:`.

| Line | Acceptable baseline |
|---|---|
| `Animation ... not found or empty` | 12 |
| `Bad move` | 23 |
| `Invalid move ... disarm` | 15 |
| `PLAYING` | 1 |

Any number above that is a build regression.

## Incident history

- **16:02–16:10 — client and server "not responding".** It was not the PBO: 5 `CL.exe`
  from an engine build used 100% of the 4 cores and the game processes were at
  `BelowNormal`. Raising them to `AboveNormal` fixed it immediately.
- **23:37 — the same picture repeated** with E6: low priority + parallel build.
  Rule of thumb: never test animation with an engine build running, or raise the game's
  priority.
- **18/11 00:10 — v37-clean client did not stay open.** The session RPT from 00:10:53
  stopped at `Cannot load material file physics/materials.h`, with 0 `PLAYING`, and the
  process exited around 75 s. There was no crash/AppHang event; another client
  (`DayZInt-F.exe`, FPS build) was open at the same time. The server stayed stable at 596 MB.
