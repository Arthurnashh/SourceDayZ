# Animation dossier · DayZ 1.30 → 0.45

Replace in the **0.45.124252** client every animation from **DayZ 1.30**, including
transitions, while keeping the game playable. This dossier records what is being done, what has
already gone into the game and what is still missing.

## What we are doing

The 0.45 `anims.pbo` holds two things: the **CfgMoves** (configuration of states, transitions
and rules) and the **RTMs** (the animation frames themselves). The strategy is to replace only the RTMs
with the 1.30 equivalents and keep the 0.45 CfgMoves — because the 1.30 config references
states the 0.45 does not have.

> The **technical walkthrough** — with the complete scripts, before/after hexdumps and the
> engine code that reads both formats — is on the [Walkthrough](#/passo-a-passo) page.

### The single-PBO rule

Two PBOs with the same prefix (`DZ\anims`) **are not mounted at the same time** — the second is
ignored. That is why everything must fit in **a single `anims.pbo`**. The measured practical ceiling is
**~1.1 GB**: build D2 (1,374 MB) stalled loading at `Updating base class ->Grid`.

### Formats that coexist

| Version | Format | How it stores bones |
|---|---|---|
| 0.45 | `BMTR` (v3) | name table with zero-terminated strings + per-frame compressed data |
| 1.30 | `RTM_0101` | fixed 32 bytes per name + 80 bytes per bone per frame (20 values) |

The 0.45 engine reads both formats — that is what made the port possible. Bone names
are matched **by name**, not by index: in the 1,387 paired swaps analyzed, the **order** of
bones differs in 100% of cases and the animations still play correctly. The 140
pairs that did not even have the same bone set are the menu files, which stayed out.

## Where we got

### Coverage

| Item | Value |
|---|---|
| RTMs in the 0.45 `anims.pbo` | 2,028 |
| In 1.30 format in **E6** | **1,390 (68.5%)** |
| Kept as 0.45 `BMTR` in E6 | 638 |
| Available 1.30 collection | 7,415 RTMs |
| Files in the manifest | 1,526 unique paths (1,527 records, 1 duplicate) |
| 1.30 menu excluded | 140 files |
| Active gameplay from the manifest | 1,386 |
| Extras outside the manifest | 4 |

The 4 extras are `CdzpInjL...breath.rtm` (perc, knl, pne) and `CdzpAinvPknl..._pills.rtm`; they
were already in 1.30 format in staging, but do not appear in `replaced_files.json`.

The 638 that remain 0.45:

- **273** zombie — the 1.30 zombie rig is not the same as 0.45
- **140** menu — cosmetic preview only, left out due to size
- **33** test / visema / props
- **~192** player files that **do not exist in 1.30** (weapon swap by slot, stops, urinate,
  defecate, `m4_check`, `_right` variants, `ik`)

### Build in game: E6

| | |
|---|---|
| File | `Addons\anims.pbo` |
| Size | 918,323,340 bytes (875.8 MiB) |
| Entries | 2,053 |
| Valid RTMs | 2,028 (1,390 `RTM_0101` + 638 `BMTR`) |
| SHA1 | `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| Byte-by-byte samples | 11/11 identical to the build |

Test session log (RPT, 17/11 23:40):

| Line | Occurrences | Situation |
|---|---|---|
| `Animation ... not found or empty` | 12 | vanilla baseline |
| `Bad move` | 23 | vanilla baseline |
| `Invalid move ... disarm` | 15 | vanilla (appears since 04:57, before any change) |
| `PLAYING` | 1 | entered the world |

**Zero new animation errors.** The 12 / 23 / 15 baseline repeats in all 36 previous
sessions, including before any change.

### Ready build: E7

| | |
|---|---|
| File | `ANIMS-WORK-20261117\out\anims_E7.pbo` |
| Size | 918,285,584 bytes (875.7 MiB) |
| Entries | 2,053 |
| Valid RTMs | 2,028 (1,388 `RTM_0101` + 640 `BMTR`) |
| SHA1 | `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| Samples | 10/10 identical to the tree |
| Change | `9v_battery.rtm` (4,187 B) and `battery_d.rtm` (4,209 B) reverted to 0.45 BMTR |
| Status | **not installed or tested** — E6 remains in game |

### Build history

| Build | Time | Size | What changed | Result |
|---|---|---|---|---|
| E1 | 11:02 | 1,056.5 MiB | first complete 1.30 RTM package | loaded, but above the safe ceiling |
| E2 | 11:13 | 1,030.1 MiB | batch adjustment | stable |
| E3 | 11:45 | 1,037.8 MiB | more batches, 1.30 menu still inside | stable; backup kept |
| E4 | 12:12 | 874.4 MiB | **bone trim** on 1,523 files + 0.45 menu | 12 missing, 23 `Bad move`, `PLAYING` |
| E5 | 12:33 | 878.6 MiB | +5 mappings (throws and 1.30 preview) | tested; preview rejected |
| **E6** | 16:01 | **875.8 MiB** | preview reverted to 0.45, 1.30 throws | in game, no new error |
| **E7** | 00:03 | **875.7 MiB** | 2 battery IKs reverted to 0.45 | ready, not tested |

### Bone trim

The 1.30 RTMs bring 156 bones; the 0.45 model uses 120. Copied whole, the PBO went
past 1.4 GB and did not load. The trim filters each RTM to the bone set of the corresponding 0.45 BMTR,
validating that the 1.30 set is a superset.

| | |
|---|---|
| Trimmed files | 1,526 (1,523 in the first pass, used in E4) |
| Before | 1,425.9 MB |
| After | 1,091.5 MB |
| Reduction | **23.45%** |
| Errors | 0 |

### Decisions made

- **1.30 menu stays out** (141 files, 333 MB raw / 255 MB trimmed): it is preview only and
  pushes the size ceiling.
- **Inventory preview went back to 0.45** in E6: the 1.30 `p_menu_unarmed_idleMain01` is a
  stretching pose with raised arms and looked odd in the inventory.
- **Weapon swap, stops and urinate/defecate remain 0.45**: they do not exist as files in 1.30,
  they are procedural in the config.
- **Transitions**: 1.30 has 171 (posture only), 512 reload, 80 unjam, 77 weapon
  switch, 96 attack and 270 hit. The 0.45 config does not have those states — the 0.45
  transitions were kept.
- **`ik/` tracks**: 84 files replaced, including the 2 battery ones. They position the item
  in the hand and are suspect #1 for the flashlight bug.

## What is left to do

### 1. Open bug: flashlight + battery (top priority)

Holding the flashlight and battery makes the character **stretch his arms** (elastic effect) and the item turns
into a giant board. It happens in the holding pose and in the **Lick battery** action.

States involved (all replaced by 1.30):

| State | E6 (1.30) | 0.45 (BMTR) |
|---|---|---|
| `CdzpAmovPercMstpSnonWnonDnon_batteryLicking` | 4,143,192 B · 431 frames | 87,976 B · 67 frames |
| `CdzpAmovPercMstpSrasWnonDnon_batteryLicking` | 493,672 B · 51 frames | 88,858 B · 67 frames |
| `CdzpAmovPknlMstpSnonWnonDnon_batteryLicking` | 1,358,032 B | 87,971 B |
| `CdzpAmovPpneMstpSnonWnonDnon_batteryLicking` | 1,655,756 B | 89,012 B |
| `ik\comsumables\9v_battery.rtm` | 23,076 B | 4,187 B |
| `ik\comsumables\battery_d.rtm` | 23,076 B | 4,209 B |

Hypotheses, in order of probability:

1. **Consumable IK tracks** (`9v_battery`, `battery_d`) — they are 2-frame poses that
   position the item in the hand; if the 1.30 IK target does not match the 0.45 rig, the arm
   bones receive an absurd transform and the mesh stretches. Explains the arm **and** the item.
2. 1.30 `batteryLicking` with 431 frames where 0.45 expects 67 — animation too long
   for a state the 0.45 config treats as short.
3. `Acts...battery` transitions that 0.45 uses to enter/leave the action.

Fix plan (build E7): first revert the **2 IKs** and test; if it continues, revert
the **4 batteryLicking**; if it continues, review the transitions. Each step is small and the
E6 backup already exists.

### 2. Review the 84 `ik/` tracks

84 IK RTMs were replaced (food, drink, medicine, tool, weapon). If the problem is the
same as the battery, eating an apple, drinking from the canteen, using a bandage, map and compass should also
show a stretched arm. Test item by item and revert the ones that fail.

### 3. 1.30 menu (optional)

140 files, +255 MB trimmed. It gives a new inventory preview, but pushes the ~1.1 GB ceiling.
It only goes in if the current preview bothers us.

### 4. Alternative preview

`p_menu_unarmed_idleMain02` was never tested as an inventory preview. It is the only
1.30 alternative after `idleMain01` was rejected.

### 5. Zombies

273 zombie animations remain 0.45. Before trying 1.30 it is necessary to confirm that the 1.30
zombie rig is compatible with the 0.45 model.

### 6. Rebuild by hand what does not exist in 1.30

Weapon swap by slot, stops, urinate/defecate, `m4_check` and `_right` variants total ~192
files. Either they stay 0.45 for good, or they are recreated from 1.30 clips.

### 7. Validate the 1,390 in game, item by item

The RPT only proves there is no new animation error; it does not prove that each weapon, item and action is
visually correct. The test must cover: throw with and without weapon, punch, jump fence,
signals with weapon, flashlight, battery, eat, drink, bandage, map, compass and weapon swap.

## Test routine

1. Close the game (the `anims.pbo` is locked while the client runs).
2. Copy the build to `Addons\anims.pbo` and check the SHA1.
3. Start server + client (`schtasks /run /tn "DayZTestLaunch"`).
4. Check in the RPT: 12 `not found or empty`, 23 `Bad move`, 15 `Invalid move` and `PLAYING`.
5. Test in game: inventory preview, throw with and without weapon, punch, jump fence, signals
   with weapon, hold flashlight, Lick battery, eat, drink, bandage, map and compass.

## Paths

```text
Game package
  SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\
    Addons\anims.pbo          installed build (E6)
    Addons\ui.pbo             menus (V38)
    profile-v36-updegree\DayZInt-v37-clean.RPT   client log

Animation work
  ANIMS-WORK-20261117\
    out\anims_E6.pbo          build in game
    out\anims_E7.pbo          ready build (2 IKs reverted)
    backup\anims_E3_instalado.pbo
    animsE6_tree\             staging (2,054 files)
    animsE7_tree\             E7 staging
    anims045\                 working tree with the batches
    anims045_orig\            pristine 0.45 extraction
    trimmed_e4\               already trimmed 1.30 RTMs
    replaced_files.json       manifest of the swaps

1.30 collection
  D:\RetailPlayer-OFP2-Y0\    7,415 RTMs
```

## Tools

| Script | What for |
|---|---|
| `trim_rtm.py` | filters the 1.30 RTM bones to the 0.45 BMTR set |
| `stage_e6.py` | assembles the build staging (0.45 menu, extras, trim) |
| `pack_pbo.py` | packs the PBO in the 0.45 format |
| `verify_e6.py` | checks the PBO header, entries and samples |
| `verify_e7.py` | the same for E7, including the 2 reverted IKs |

## Pitfalls already paid for

- **Duplicate PBO does not mount** — two PBOs with the `DZ\anims` prefix and the second is ignored.
- **~1.1 GB ceiling** — above that the game stalls at `Updating base class ->Grid`.
- **Process priority** — client and server started as `BelowNormal` and became
  "not responding" from CPU starvation while 5 build `CL.exe` processes used the 4 cores.
  Raising the game to `AboveNormal` fixes it immediately.
- **RPT is append-only** — to measure a session you must cut the log at the last `Current time:`.
- **Menu preview is not gameplay animation** — a pretty 1.30 menu pose can be
  useless in the 0.45 inventory.
- **Bone order does not matter** — the engine matches by name; do not waste time reordering.
