# What is left to do

Project pending-work board. The **Tasks** tab is the editable board (create, start,
block, complete and delete); this text is the detailed overview of each track. The technical
detail of animations is in the **Animations** tab; here is the picture of what is open today
(18/11/2026).

## Open tracks

| Track | Status | Next step |
|---|---|---|
| Animations 1.30 on the 0.45 client | in game (E6), 1 open bug | test E7 (2 IKs reverted) |
| Menus / UI | V38 installed, new pause menu | check 3D, tabs and mission return on screen |
| Map / WRP | client and server aligned (rev. 17865) | keep the rule in any future build |
| Doors and actions | server V127 ready | validate open/close/enter in game |
| Inventory | redesign started, old + new coexist | decide whether to continue or go back to native |
| FPS near cities | **high priority** · F2: character/houses ok, grass/shadow failed, low FPS | confirm regressions and test A+B+C+D+E in Release |
| Build infra | working | single script to install + test + summarize RPT |
| Documentation | site with GitHub feed and changelog | keep it up with every build |

## Animations

### What we are doing

Porting the **DayZ 1.30** RTMs into the **0.45** `anims.pbo`, keeping the old CfgMoves
(the 1.30 config has states the 0.45 does not know). Everything must fit in a single
PBO because two PBOs with the same prefix do not mount together. The practical ceiling is **~1.1 GB**.

### Where we got

- **1,390 of 2,028** animations (68.5%) in 1.30 format in E6; 638 remain BMTR 0.45
- **E6** build installed: 875.8 MiB, 2,053 entries, SHA1 `7AF66887…EA48`
- In game: `PLAYING` with **12** `not found or empty` and **23** `Bad move` — vanilla baseline
- **E7** ready: 875.7 MiB, SHA1 `A986CA7C…166C`, 2 stack IKs reverted, **not tested**
- Bone trim (156 → 120) reduced 23.45% and freed space (1,425.7 → 1,091.4 MB)
- 140 1.30 menu files stayed out; the inventory preview went back to 0.45
- 84 `ik/` tracks replaced; throws and signals in 1.30

### What is missing

| # | Item | Size | Status |
|---|---|---|---|
| 1 | **Flashlight + battery stretch the arms** | 6 files | **open — top priority; E7 ready** |
| 2 | Review the 84 `ik/` tracks (eat, drink, heal, maps) | 84 files | not tested item by item |
| 3 | 1.30 menu (inventory preview) | 140 files, +255 MB | optional, ceiling risk |
| 4 | Alternative preview `p_menu_unarmed_idleMain02` | 1 file | not tested |
| 5 | 1.30 zombie animations | 273 files | blocked by rig |
| 6 | Recreate weapon swap, stops, urinate/defecate | ~192 files | do not exist in 1.30 |
| 7 | 1.30 transitions (171 posture) | — | no equivalent state in the 0.45 config |
| 8 | Validate the 1,390 in game, item by item | — | the RPT alone is not enough |

**Bug 1 plan (E7):** revert the 2 tracks `ik\comsumables\9v_battery` and `battery_d` to
0.45 and test. If it keeps stretching, revert the 4 `batteryLicking` states (E8). If it
continues, review the action's transitions.

**Definition of done:** hold the flashlight, lick the battery, eat an apple, drink from the canteen, use
a bandage, open the map and use the compass without deformation — and the RPT closing at 12 / 23 / 15.

## Menus and UI

- `ui.pbo` is at 48,349,274 B (46.1 MiB), SHA-256 `EBC95ACE…5500`, package **V38**
- V38 rewrote `RscDisplayMPInterrupt` and `RscDisplayInterrupt`; only `ui.pbo` changed
- **Still to check on screen:** 3D world in the background, logo, “Check-up completo 25/35” card,
  CONTINUE/OPTIONS/EXIT/RESPAWN, OFFICIAL/COMMUNITIES/LAN tabs, Change Server and the
  mission return without legacy overlap
- **Still to make the previous `ui.pbo` backup** — the restore point
  `restore-point-v38-pause-menu-20261117\ui-before.pbo` exists, but the package's “official”
  backup has not been set aside yet
- The complete 1.30 menu (+255 MB) only goes in if the current preview bothers us

## Map, WRP and terrain

- Client and server use `worlds_chernarusplus.pbo` **revision 17865**, SHA-256
  `0B8DAD26F376B892376C45240D630C14C126A84D0C31D0492384EF9371C78E28`
- `worlds_chernarusplus_data.pbo` must be the one from the current `Addons`; V31 mixed the server's WRP
  with 509 textures from another package and the terrain turned red/pink
- **Rule:** if a future build repacks the client WRP, the entry crash comes back
- The manual 5-step alignment procedure is in
  `HISTORICO-CORRECOES-E-PENDENCIAS.md`

## Doors and actions

- Current test server: `DayZServer-DoorUserTypeExecV127`
- Packages V121/V123/V124–V127 investigated door action resolution and object search
- **Still to validate in game:** open, close, lock, break open and enter doors of houses,
  fences and buildings; record the door type that fails

## Inventory

- Item rotation (space) and hand/`Hands` synchronization are working
- The visual redesign inspired by the new inventory was started, but old and new
  coexist; the new panel still has no working character/items
- **Pending decision:** continue the redesign or freeze at the current native inventory
- Backup: `backup-inventory-redesign-20261117`

## FPS and engine

The track has its own tab in **Pending → Resolve FPS Drop** (high priority).

- Dev hint: “object processing before rendering — everything inside `Scene::DrawObject***`, material and polygon preparation”. The actual path is `Object::Draw` → `Shape::Draw` → `DrawSections` (`PrepareTL`/`DrawSectionTL`).
- **Candidate F** tested: FPS went up, but the scene broke (invisible character in 3rd
  person, houses/trees disappear when the camera approaches and grass flickers). **Invalid gain.**
- **F2** tested: character and houses/trees came back, but **grass only appears now and then**
  and the **character's shadow is on its back**; **FPS stayed low**. Visual fix
  **partial**, no performance gain. The F/F2 line is closed as not worthwhile.
- Cause of F: predication scope never written (`CopyCBPredicatedScope` with `scope.beg < 0`);
  the color pass interpreted the scope as empty.
- **Restart point:** confirm F2 vs Original (grass/shadow), then compile A+B+C+D+E in
  Release (without F/F2) from `backup-fps-f-20261117-164157` and measure. If it does not pay off, the target
  becomes the per-object cost in the color pass (`Scene::DrawObjectsInstanced`/`Shape::DrawSections`).
- Criterion to declare a gain: complete scene (character, houses/trees up close, grass,
  water, PiP, shadows) + better FPS at the same spot, vsync off.
- Careful: a parallel engine build consumes all cores and locks the game at
  “not responding” — raising the game to `AboveNormal` fixes it.

## Infra and delivery

- Backups: `ANIMS-WORK-20261117\backup\` (builds) and `out\` (all E1–E7)
- `anims.pbo` is locked while the client runs — always install with the game closed
- Test launcher: `schtasks /run /tn "DayZTestLaunch"` (server, 40 s wait, client)
- Missing a single script that does: close game → copy → check SHA1 → start server +
  client → summarize the RPT
- The v37-clean client from 18/11 00:10 did not stay open; the RPT stopped at loading and
  there was no crash. Another client (`DayZInt-F.exe`) was open at the same time

## Rules that cannot be forgotten

1. **Single PBO** — two PBOs with the same `DZ\anims` prefix and the second is ignored.
2. **~1.1 GB ceiling** — D2 (1,374 MB) got stuck at `Updating base class ->Grid`.
3. **Same WRP on both sides** — revision + SHA-256 of `worlds_chernarusplus.pbo`.
4. **PBO prefix with one backslash** — `prefix=bin\`, never `prefix=bin\\`.
5. **RPT is append-only** — cut at the last `Current time:` to measure the session.
6. **Game priority** — `AboveNormal` when an engine build runs in parallel.
7. **Bone order does not matter** — the engine matches by name; do not reorder RTMs.
8. **Backup before touching anything** — restore point + hash of the changed file.

## Test routine (checklist)

1. Close the game
2. Copy the build and check the SHA1
3. Start server + client
4. RPT: 12 `not found or empty`, 23 `Bad move`, 15 `Invalid move`, 1 `PLAYING`
5. In game: inventory, throw with/without weapon, punch, fence, signals with weapon, flashlight,
   battery, food, drink, bandage, map, compass, doors, pause menu and browser
6. Write down what failed **with the item and action name** — that is what lets you find the RTM
