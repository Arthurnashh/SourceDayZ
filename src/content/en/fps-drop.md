# Solving the FPS drop

**High priority.** This is the track dedicated to eliminating the FPS drop near cities, buildings, houses and forests in **DayZ 0.45.124252**. The work is done in the engine, in **Release/Win32**, with A/B at the same spot in Berezino and **vsync off**. No touching shadows, view distance or graphics settings: the target is the CPU/GPU work that repeats per object.

## The hint from the developers

> “Object processing before rendering. All the crap that happens inside all the `Scene::DrawObject***` functions, all the material, polygon and other crap preparation.”

That was the hint received from the developers and it is the north of this whole track. It is not shadow, not distance, not vsync: it is **what the engine does with each object before sending the pixel to the screen**. The whole investigation below — A, B, C, D, E, F and F2 — was built on top of that sentence.

> **Resume point — 18/11/2026**
>
> **F2 was tested in game** with the V38 package and the `perfil-janela` profile, at the same spot in Berezino. **The main fix worked**: character visible, houses and trees present from afar, up close and in contact. **But the scene is not 100%**: **grass does not appear most of the time** — it shows up only now and then, in patches — and the **character's shadow appears on his back**. FPS was low.
>
> Both visual defects are recorded below, with screenshots and technical hypothesis. F2 **is not acceptable as a final fix**: it fixed the `_drawPass1ON` list, but did not close the scene. The work is **paused here**; the script to resume is in **Resume point**.

**Before/after code:** all patches (A–F, F2 and the earlier work) are transcribed in the **Code before and after (git-like)** section, at the end of this tab, with `-`/`+` lines and a link to download each `.diff`.

## One-screen summary

| Question | Answer |
|---|---|
| Symptom | FPS drop and stutter near buildings, houses and woods, mainly in Berezino. |
| What was ruled out | Shadow, `shadowQuality`, `shadowZDistance`, view distance, vsync and garbage collection. |
| What the code shows | Nearby objects go through preparation and submission in more than one stage of the frame; the depth prepass and the color pass share object lists. |
| What F did | With `FSAA=0`, it stopped submitting objects in the depth prepass. The color pass should draw everything, but received a predication scope **never recorded** and interpreted it as empty. |
| F result | FPS ↑ **and** broken scene: invisible character, houses/trees vanish up close, grass flickers. **Invalid gain.** |
| F2 fix | `CopyCBPredicatedScope` returns `false` when `scope.beg < 0`; the color pass falls back to the direct path and draws the lists. |
| F2 result | **Character and houses/trees fixed**, but **intermittent grass** (shows only now and then, in patches) and **character shadow on his back**. **Low FPS**, no gain; subjective report, no number. |
| Where we stopped | F2 fixed the `_drawPass1ON` list, but **did not close the scene**. F/F2 line closed as **partial and not worthwhile**. Next track: A–E in Release and, then, per-object cost in the color pass. See **Resume point**. |
| Criterion to declare a gain | Complete scene (character, houses/trees up close, grass, water, PiP, shadows) + better FPS at the same spot, vsync off. **Not reached by F2**: grass and shadow failed. |

## Resume point

**Where the work stopped.** F2 fixed part of the scene — character and houses/trees came back —, but **did not close it**: grass appears only now and then, in patches, and the character's shadow sits on his back. FPS was low. There was no numerical measurement; the record is the test report. The practical conclusion about performance remains: **removing object submission from the depth prepass is not a path to gain**. F only looked faster because the `_drawPass1ON` list was not drawn.

**What was proven.**

- The fix `if (scope.beg < 0) return false` is right for the `_drawPass1ON` list: the color pass draws character, houses and trees again when the scope was never recorded.
- F2 **did not fix the other paths**: grass (`_lDGCl`) and the character's shadow are still defective. The scene is not complete.
- The F bug was not shadow, distance, LOD or occlusion. It was the predication scope treated as empty.
- The premise that the depth prepass was “pure duplicated work” **does not hold in practice**. The prepass fills depth with cheap drawing (`PSAlphaOnly`, no material/lighting) and the color pass then rejects hidden fragments early. Removing objects from there pushes rasterization to the color pass, with full shading and overdraw. The command buffer replay is also cheaper than re-running `Object::Draw`/`PrepareTextures`; that is why the “full second pass” did not exist the way the hypothesis supposed.
- There is still **no GPU profile** confirming the exact cost split. That is the reading most consistent with the result, and the next step is to measure, not presume.

**What is ready to resume.**

| Item | State |
|---|---|
| Code | A+B+C+D+E+F+F2 in the tree; restore points `backup-fps-f-20261117-164157` (after E, before F) and `backup-fps-f2-20261118-003054` (F2) |
| F2 binary | `DayZ045-fps-noprimeobjects-release-f2-20261118`, Release, SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |
| Original | runtime `DayZ045-fps-original-runtime-20261117`; EXE `DayZInt-ORIGINAL-v37-clean.exe`, SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22` |
| Test package | V38 in `package-v38-pause-menu\Addons`; only Release loads the unsigned `ui.pbo` |
| Documentation | this tab, the **Code before and after (git-like)** section, the technical audit and the `FPS-AB-TEST-20261117.txt` sheet |
| F2 process | still open (PID 7388), only as reference; no need to keep it |

**Next session, in order.**

1. **Confirm the F2 regressions against the Original**, at the same spot and time: grass and character shadow. If both defects only appear in F2, it is discarded as a visual fix; the clean path is the A–E build.
2. **Release build of A+B+C+D+E, without F/F2**, from `backup-fps-f-20261117-164157`. It is the only cumulative sequence that preserves the depth prepass and **was never tested in A/B**. Retail does not work for V38; it has to be Release.
3. Test at the same spot in Berezino, vsync off, complete scene, alternating Original and A–E 2–3 times. Record average FPS, 1% low, worst stutter and smoothness. If the scene is correct and FPS is better, that is the **first valid gain** of the track. If it does not pay off, go back to the Original as the performance baseline and keep A–E only as reference.
4. If A–E does not pay off, **measure the color pass before cutting**. Use the scopes that already exist (`obAni`, `obLit`, `obTex`, `obShp`, `dSec`, `d9HW`/`d9FB`) in a Profile build, or light counters in Release. Separate CPU cost (draw calls, `PrepareTL`, material/texture) from GPU cost (overdraw, fill).
5. Attack in this order: **(a)** material/texture cache per unique object (houses) — the same `PrepareTL`/`CreateMaterial` repeats for equal materials; **(b)** extend the 1x-per-run preparation of candidate E to the `nInstances==1` path, which is not reached today; **(c)** only then revisit submission passes.
6. Keep the rule: no shadow, `shadowQuality`, `shadowZDistance` or view distance; no gain declared without A/B at the same spot, complete scene and vsync off.

**What not to repeat.**

- F as a performance fix. Object submission in the depth prepass is not the waste the hypothesis claimed.
- Considering F2 a complete visual fix: grass and character shadow are still wrong.
- Considering an FPS gain with missing geometry. The F number does not enter any result.
- Testing Retail with the unsigned V38 package.
- Declaring a gain by feeling, without a number and without A/B.

## What the devs' hint means in the code

The sentence “object processing before rendering” points to the chain that goes from the world traversal to `DrawIndexedPrimitive`. The real path is this:

```text
World::PrepareDraw
  -> Scene::ObjectForDrawing / Scene::ObjectsForDrawing
    -> Scene::DrawObject(Object*)        // scene.cpp:11174 — only forwards
      -> Object::Draw(...)               // object.cpp:1974+
        -> Animate                       // obAni
        -> SelectAggLights               // obLit
        -> PrepareTextures               // obTex / prpTx / prpIX / prpSc
        -> Shape::Draw                   // obShp / cuDrw
          -> Shape::DrawSections         // dSec
            -> CreateMaterial
            -> PrepareTL                 // LoadTextureMipmaps, Combine, texgen, shader, states
            -> DrawSectionTL             // [beg,end) -> DrawIndexedPrimitive
```

On the instanced path, the same preparation appears elsewhere:

```text
Object::DrawSimpleInstanced
  -> Engine::DrawMeshTLInstanced / DrawMeshTLSectionsInstanced
    -> BeginInstanceTL / BeginMeshTL
    -> PrepareTL per section run
    -> DrawSectionTL per instance
```

The important detail: `Scene::DrawObject(Object*)` is a trivial function that only calls `obj->Draw(...)`. The cost the devs described is not in the name `Scene::DrawObject` itself; it is in what happens **inside** `Object::Draw`, `Shape::Draw` and `DrawSections`, and in how many times that path runs per frame. That is exactly what the audit found:

- `Animate` runs per object, even when the object is static.
- `SelectAggLights` builds the light list per object.
- `PrepareTextures` walks sections and material stages; without `TexAreaIndex`, it repeats the scan on every call.
- `PrepareTL` redoes `LoadTextureMipmaps`, `PolyProperties::Combine`, texture/sampler/render state/pixel shader setup and `DoSetMaterial`.
- `DrawSections` does `CreateMaterial` + `PrepareTL` + `DrawSectionTL` per visible section.
- In the depth passes (`RMDPrime`/`RMZPrime`), all of that ran again even when the shader was `PSAlphaOnly` and consumed neither material nor light.
- In software instancing, `PrepareTL` was redone per instance × section run, even being identical for all instances of the chain.

Each cut A–F attacks a part of that sentence:

| Cut | Part of the devs' hint it attacks |
|---|---|
| A | material/light/texture preparation inside the depth passes |
| B | the entire submission of a depth pass that only resubmitted the same objects |
| C | per-instance shadow computation inside the depth pass |
| D | light grid, sorting and grouping by light inside the depth pass |
| E | `PrepareTL` repeated per instance in the color pass software instancing |
| F | the entire `Object::Draw` call in the depth prepass with `FSAA=0` |
| F2 | makes the color pass actually draw when the F scope was never recorded |

## How the test is done

The user's real game is **Release** (`DayZInt`), not Retail. The reason is technical: Retail builds define `_ACCEPT_ONLY_SIGNED_DATA 1` in `retailConfig.h` and reject the modified `Addons\ui.pbo` from the V38 package with the message `Corrupted data detected.`. Release does not do that check and loads the V38 package. That is why the valid A/B is always **Release against Release**, in the same folder, with the same `Addons` and the same profile.

Configuration used in the test (`perfil-janela` profile):

```text
FSAA=0
MSAA=0
PostFX=0
ssaoEnabled=0
VSync=0
PPAA=0
AToC=0
```

Shadow, distance and quality stay the same as the normal game. The test is at the **same spot in Berezino** (the three houses + woods), same time and weather. What matters is the **oscillation/stutter** when turning the camera, not the FPS standing still looking at the sea. The sequence is to alternate Original and candidate 2–3 times, recording average FPS, worst stutter and visual artifacts.

### What is observed as a regression

- Invisible character, missing parts or broken 3rd person.
- Houses, trees and buildings vanishing as you approach.
- Grass flickering, unstable depth or objects showing through walls.
- Holes in the scenery, flicker on roads, trails and decals over the terrain.
- Water, scope/PiP (crosshair), shadows, particles and occlusion.
- RPT with `Corrupted data detected.` or `ErrorMessage`.

## What the F test showed

The test was done with `DayZInt-F.exe` (Release), the V38 package and the `perfil-janela` profile:

- The game started without `Corrupted data detected.` and without `ErrorMessage`; the F runtime RPT is 39,220 bytes and only shows material and content warnings.
- FPS improved perceptibly. **There is no recorded FPS number**; the report is of a perceived increase. Since the scene was incomplete, that number would not be valid anyway.
- The 3rd person character **does not appear**.
- Houses, trees and buildings **only appear from afar**. When the camera gets close, **they disappear**.
- Grass alternates between appearing and vanishing.

The six screenshots below are the record sent by the user. They show the road and the distant scenery intact, but the character absent and the foreground without the objects that should be there. **The houses do not “remain visible” in F: they vanish on approach.** That is the bug, not the expected behavior.

![Screenshot 1 — road with trees in the background; the character does not appear in 3rd person.](/fps-2026-11-18/f-teste-01.jpg)

![Screenshot 2 — building in the distance and debug overlay; nearby objects are not drawn.](/fps-2026-11-18/f-teste-02.jpg)

![Screenshot 3 — same scene in rain; road and distant vegetation remain, foreground empty.](/fps-2026-11-18/f-teste-03.jpg)

![Screenshot 4 — “I am completely soaking” status; character absent and scenery incomplete.](/fps-2026-11-18/f-teste-04.jpg)

![Screenshot 5 — house and barn visible at medium distance; on getting close, they vanish.](/fps-2026-11-18/f-teste-05.jpg)

![Screenshot 6 — house at medium distance; the character is still invisible and the foreground has no geometry.](/fps-2026-11-18/f-teste-06.jpg)

### Record of the six screenshots

| Screenshot | Dimension | Size | SHA-256 |
|---|---|---:|---|
| `f-teste-01.jpg` | 1920×1080 | 234,021 B | `EF09431582BE4B2F67A9FD4FD03A32000036FA77F4A83A6D2767DDB4B91206C1` |
| `f-teste-02.jpg` | 1136×905 | 166,753 B | `C132063B3946037532E5B82580B914D975379414B14D21810DD59613A6A6794F` |
| `f-teste-03.jpg` | 1180×899 | 173,109 B | `B349D48F5E9F9E33CB0F923D24E4977C315395F0E87582EDE92C3048FCB91C0F` |
| `f-teste-04.jpg` | 1920×1080 | 177,635 B | `C27CF0C0AEED4B98DD68203326FBC15042FCC6800F3144241BAE3D33113EE3B9` |
| `f-teste-05.jpg` | 1090×821 | 83,170 B | `FB8C86C15A22D68575265E84EEF2EEED1B4338E17D5366DDA8D320F6EBF3458E` |
| `f-teste-06.jpg` | 1099×835 | 92,197 B | `37063EAD4E040804B20D8091F279920F616C131B76F39EE7F1A1EF3F17C030AA` |

## The root cause of the F bug

The error is not shadow, view distance or configuration. It is the object submission path.

With predication and command buffers enabled, the color pass **does not walk the object list again**. It reuses the commands recorded in the depth prepass:

1. `Scene::DrawDepthPrime` calls `StartCBPredicatedScope(ctx._oPasO, pass)`.
2. `DrawPass1Part` records the `_drawPass1ON` draws in that scope.
3. `EndCBPredicatedScope` closes the recording.
4. In the color pass, `Scene::DrawPass1O` calls `CopyCBPredicatedScope(ctx._oPasO, RenderingPass)`.
5. If the copy returns `true`, the color pass does **not** call `DrawPass1Part`: the already recorded commands are replayed with the color state.

Candidate F made steps 1–3 be skipped when `FSAA=0` (`drawObjects=false`). Consequence: the `_oPasO` scope was **never recorded**. In step 4, `CopyCBPredicatedScope` found the default scope (`beg = -1`, `end = -1`) and treated it as an “empty scope”, returning `true`. The color pass then skipped `DrawPass1Part` and the nearby object list was not drawn.

```cpp
// Scene::DrawPass1O — color pass
if (!GEngine->CopyCBPredicatedScope(ctx._oPasO, Engine::RenderingPass))
{
  DrawPass1Part(ctx, ctx._drawPass1ON._original, Engine::RenderingPass);
  DrawPass1Part(ctx, ctx._drawPass1ON._blending, Engine::RenderingPass);
}
```

```cpp
// EngineDD9::CopyCBPredicatedScope — previous state (F)
if (!UsePredication()) return false;
Assert(scope.beg >= 0); // the scope may be empty, but it must have been recorded
if (scope.end <= scope.beg)
{
  // empty scope: return true to avoid the cost of the default path
  return true;
}
```

The `Assert` disappears in Release. The default scope (`beg = -1`) falls into `if (scope.end <= scope.beg)` and returns `true`, which is exactly the “nothing to draw” interpreted by the color pass.

The `_drawPass1OF` and `_drawPass1AF` lists are still drawn directly in `DrawPass1A`, before the predicated scope. That is why the distant scenery remains: it does not depend on the scope that became empty. The 3rd person character and the nearby houses/trees depend on the `_drawPass1ON` list, which vanished. Grass uses another scope (`_lDGCl`), but the depth state also changed; the flicker needs to be rechecked after the fix.

### Correction of the historical record

The previous audit said that, with `FSAA=0`, the color pass “redrew exactly the same lists with `ZFUNC EQUAL`”. That is not accurate when predication is on. The color pass **replays the command buffers recorded in the depth pass**; it does not re-run the per-object preparation of the list. The correct formulation is:

- **Predication on:** the depth pass records the commands; the color pass replays them. The duplicated cost is depth rasterization and the replay, not necessarily a second full preparation of each object.
- **Predication off / scope never recorded:** the color pass draws the lists directly.

That distinction is what explains why F “saved” so much: it not only avoided the depth pass, it avoided **drawing the nearby objects entirely**.

## F2 fix

The fix is small and surgical: a scope that **was never recorded** cannot be treated as a recorded empty scope.

```cpp
// EngineDD9::CopyCBPredicatedScope — F2
if (!UsePredication()) return false;

// A scope never recorded is not the same as a recorded empty scope.
// Return false so the caller draws the list directly; this is
// necessary when the depth prepass skips object submission (FSAA=0,
// see Landscape::PrimeDepthBuffer) and the color pass still needs to draw them.
if (scope.beg < 0) return false;

Assert(scope.beg >= 0); // the scope may be empty, but it must have been recorded
```

With `false`, `DrawPass1O` and `DrawPass1A` fall into the direct path and draw the lists once, with `ZFUNC LESSEQUAL` and `ZWRITE TRUE` (`_mainDepthPrimed` stays `false` when the prepass does not submit objects). It is the same path used when predication is off, which is already supported by the engine.

What F2 does **not** change:

- The shadow code, `shadowQuality`, `shadowZDistance` and cascades. **But the test showed the character's shadow wrong**, probably due to color pass state/order; investigate.
- `DrawVolShadows`, `DrawPass3Part` and `DrawPass4Part`.
- View distance, `sceneComplexity`, terrain and weather.
- The terrain/grass pass code; it was not changed. **But the test showed grass intermittent**, indirectly affected by the new depth state/color pass order — see **F2 test result**.
- The object list, LOD, occlusion and draw order.

### F2 build record

| Item | Value |
|---|---|
| Build | `BuildOutput\DayZ045-fps-noprimeobjects-release-f2-20261118` |
| Configuration | Release / Win32 / `DayZ.sln /t:lib /m:4` |
| MSBuild result | `exit=0`; no `error C`, `error LNK` or `error MSB`; `LNK4099` from external PDBs remain |
| `DayZInt.exe` | 13,916,160 bytes · SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |
| `DayZInt.pdb` | SHA-256 `820A72D9A758358C67824F3E1EACFE8081FCCF5A90A87C75B77643C5DA1DCAA2` |
| `DayZInt.map` | SHA-256 `2B87863BC6C4DC6260215BBBC0205DEEB16A88DD6B4617B65B79B3076E7931EA` |
| Runtime | `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118` |
| Executable in runtime | `DayZInt-F2.exe` (same hash as the build) |
| Symbols in runtime | `DayZInt-F2.pdb` / `DayZInt-F2.map` (hashes checked) |
| Launcher | `Start-DayZ-Release-F2.bat` |
| Addons | junction to `package-v38-pause-menu\Addons` |
| Profile | `perfil-janela` (same profile as the F test) |
| `.map` | contains `?DrawDepthPrime@Scene@@QAEXAAUDrawContext@1@_NW4PredicationMode@Engine@@1H@Z` and `?CopyCBPredicatedScope@EngineDD9@@...` |
| F2 sources | `engdd9.cpp` `DD4866460CF783DEF142BACA0D78CBB8D14BF0191263B13CC4F77C0DE5EB2615`; `scene.cpp` `09E1FC6B886A4D29C993EA29BF1455A260D1F21C8F541320FE814596FD5E8404`; `scene.hpp` `539C579BD15F36D26B1842CB0449EA7D4ABB09A3E9A8F82939D8785B83A13D20`; `landscape.cpp` `FAA0BC763CDB57F8E298156F73CE6F5B05EE8E3934A430C5E09C60C4093D6D24` |
| Restore point | `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f2-20261118-003054` |

## F2 acceptance criterion

> **Attention:** in the F test, houses and trees **disappear when the camera approaches**. They are seen from afar and vanish in the foreground. That is the bug F2 must fix; the items below are requirements to accept F2, not what happened in F.

1. The character appears normally in 1st and 3rd person.
2. Houses, trees and buildings **cannot vanish on approach**: they must remain visible from afar, at medium distance and in contact.
3. Grass appears continuously and stably: it cannot vanish for intervals or flicker.
4. The RPT closes without `Corrupted data detected.` and without `ErrorMessage`.
5. Water, scope/PiP, shadows and particles remain correct. The character's shadow cannot appear on his back.
6. FPS is measured at the same spot in Berezino, vsync off, with the complete scene. **Only then** can the gain be declared.

**Status on 18/11/2026:** items **1, 2 and 4 met**. Item **3 failed**: grass is intermittent. Item **5 failed on shadow**: the character's shadow appears on his back; water/PiP/particles were not mentioned in the test. Item **6 not met**: low FPS, no gain. F2 **is not acceptable as a final fix**.

## F2 test result

F2 was tested on 18/11/2026, with the V38 package and the `perfil-janela` profile, at the same spot in Berezino. The result is **partial**.

**What F2 fixed.**

- **Character visible** in 1st and 3rd person.
- **Houses and trees present** from afar, at medium distance and in contact. They no longer vanish on approach.
- **RPT** with 37,920 bytes, without `Corrupted data detected.` and without `ErrorMessage`.

### F2 visual regressions

The main scene came back, but **two defects persist** and prevent accepting F2 as a complete visual fix:

- **Intermittent grass.** Grass does not appear continuously: most of the time the field has no tufts and it shows only now and then, in patches. It is not the quick “flicker” of F; it is prolonged absence with occasional reappearance.
- **Character shadow on his back.** The shadow appears on his back, over the shirt and legs — it is not a shadow cast on the ground.
- **Low FPS**, no gain. The report brought no recorded number.

**F2 test screenshots.**

![Screenshot 7 — F2: grass only in patches and character shadow on his back; the red arrows highlight the reported region.](/fps-2026-11-18/f2-teste-01.jpg)

![Screenshot 8 — F2 in the game window: the field shows grass gaps; character, houses and trees are present.](/fps-2026-11-18/f2-teste-02.jpg)

**Record of the F2 screenshots.**

| Screenshot | Dimension | Size | SHA-256 |
|---|---|---:|---|
| `f2-teste-01.jpg` | 1108×834 | 274,295 B | `57FAB8846CA97C498CCAB4E0EC6E2D878756EAAB79FA588F22DE62CCECE3F730` |
| `f2-teste-02.jpg` | 1920×1080 | 407,643 B | `75EE18475D221203712CFD527EA193992AC315E87F0E9EC9600C9BDEC7B1457F` |

**Technical hypothesis (not yet confirmed).**

F2 changed the color pass contract: with `_mainDepthPrimed=false`, the object lists are drawn directly with `ZFUNC LESSEQUAL` + `ZWRITE TRUE`, and the Z/stencil clear moved to `InitDraw`. The `_drawPass1ON` list (character, houses, trees) came back. But **grass and shadow are not in that list**:

- Grass uses the `_lDGCl` scope and the terrain/landscape path. The suspicion is that it still depends on the depth prepass or on the clear order for the depth test. If the scope is drawn before/after the clear, or with a different `ZFUNC`, it disappears intermittently. Confirm with state capture (PIX) or `_lDGCl` instrumentation.
- The character's shadow comes from the shadow map (`DrawRectShadowBuffer`) and is applied in the color pass. F2 did not change the shadow map directly, but it changed the depth state and the color pass submission order. The hypothesis is bias/self-shadow or matrix read with the new state. It could also be a defect that already existed and only became visible with the complete scene; compare with the Original at the same spot.

**Reading the result:** F2 fixes the `_drawPass1ON` list, but **is not a complete visual fix**: criterion 3 (grass) and the shadow part of criterion 5 failed; water/PiP/particles were not mentioned in the test. Criterion 6 (FPS) was not met. The F FPS cannot be used as reference because the list was absent. The current level is F2's, with the scene still incomplete, and that is what the next session must beat — after solving grass and shadow.

## The timeline of the cuts

The table below is cumulative: each binary contains all previous cuts. F, for example, is **A+B+C+D+E+F**. F2 is **A+B+C+D+E+F+F2**.

| Candidate | What it cuts | Build | Recorded result |
|---|---|---|---|
| A | lightweight preparation in the depth passes | `DayZ045-fps-depthprime-lean-retail-20261117` | build ok; no A/B recorded |
| B | removes the entire `RMZPrime` pass | `DayZ045-fps-noprime-retail-20261117` | build ok; with `FSAA=0` the pass did not run, so it is a no-op in practice |
| C | no `GetLandShadowSmooth` per instance in the depth pass | `DayZ045-fps-noprime-noshadowcoef-retail-20261117` | build ok; no A/B recorded |
| D | depth pass without light grid per instance | `DayZ045-fps-primelightlean-retail-20261117` | build ok; no A/B recorded |
| E | 1x-per-run section preparation in color instancing | `DayZ045-fps-colorinstance-retail-20261117` | build ok; does not reach unique houses (`nInstances==1`) |
| F | no object submission in the depth prepass with `FSAA=0` | `DayZ045-fps-noprimeobjects-release-20261117` | FPS ↑, character/nearby houses vanish · **invalid** |
| F2 | never-recorded scope returns `false` and the color pass draws directly | `DayZ045-fps-noprimeobjects-release-f2-20261118` | **tested: character/houses ok; intermittent grass; shadow on back; low FPS · no gain** |

### Candidate A — lightweight preparation in the depth passes

Goal: the `RMDPrime` (SSSM mask) and `RMZPrime` (z-only) passes only need depth. They use `PSAlphaOnly`, do not write color and consume neither material nor lighting. Even so, they ran the same per-object preparation as the color pass.

Changes, all restricted to `RMDPrime`/`RMZPrime`:

1. `lib/object.cpp` (~2148 and ~2199): `PrepareTextures(..., prepareBaseTextureOnly=true)` when `dp._zprimeIsBeingRendered` (added to the already existing `_sbIsBeingRendered` case). Only the base texture — source of the alpha test — is prepared; normal map, detail and specular are left out.
2. `lib/object.cpp` (~2103): `SelectAggLights` is skipped in `RMZPrime`; the light list handed to the shape becomes empty. The pass does not consume lighting.
3. `lib/d3d9/engdd9.cpp` (~15674, `PrepareTriangleTL`): early return before the material color combination and `DoSetMaterial` when `_renderingMode == RMDPrime || RMZPrime`.

Build: `DayZ045-fps-depthprime-lean-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib`, `exit=0`, no C/LNK/MSB errors (only the already known `LNK4099` from external PDBs remain).

- `DayZ.exe`: 11,567,104 bytes, SHA-256 `F279A9FEE966F0766B0C1C9E4DE3E88D9C48AAFCF7623239F931AF3CE1613B9C`.
- `DayZ.pdb`: SHA-256 `1E9D82614F576F2C74A09AADFC78595D03BCAD5033991D7AB2E4ACDAD4E6D129`.
- `DayZ.map`: SHA-256 `6C8189E2F880FF0432C4148C30E4739AD2CAC91BF310B55438C93B0A2FB6ECE6`.
- Runtime: `BuildOutput\DayZ045-fps-depthprime-lean-retail-runtime-20261117`.
- Restore point: `restore-points/fps-depthprime-lean-before-edit-20261117-120927`.

Known risk: `RMDPrime` feeds the SSSM mask. Foliage uses the base texture (preserved) for the alpha test; trees also sample sampler1 (normal map), bound by `SetupMaterialTextures` and not by the base-only preparation. If wrong clipping/outline appears on trees or strange shadow on vegetation, the candidate must be reverted.

### Candidate B — removal of the `RMZPrime` pass

`RMZPrime` resubmits the same nearby objects (radius `max(GetShadowZ(), 100)` = 250 m) only to fill the main depth; the color pass then uses `ZFUNC EQUAL` and disables alpha test. Without it, `ZFUNC` returns to `LESSEQUAL` with `ZWRITE` and normal alpha test. For opaque geometry the result is the same, without an entire object submission. The SSSM mask is still produced by `RMDPrime`, and `_zPrimingDone` still controls `_doSSSM`/`PSTBasicSSSM`.

Changes:

- `lib/d3d9/engdd9.hpp`: new member `_mainDepthPrimed` and `SetMainDepthPrimed`. `ZPrimed()` stops returning a fixed `true` and returns `_mainDepthPrimed`.
- `lib/landscape.cpp` (`PrimeDepthBuffer`): after `EndDepthMapRendering`, `SetMainDepthPrimed(zOnly || GetFSAA()==0)`. Without the z-only pass and with `FSAA>0`, the flag stays false and the color pass returns to normal behavior.
- `lib/world.cpp`: `PrimeDepthBuffer(..., zOnly=true, ...)` call commented out in `World::Simulate` and in the R2T path.
- `lib/d3d9/engdd9.cpp`: `InitDraw` now includes `D3DCLEAR_ZBUFFER` (and stencil, if any) when `_mainDepthPrimed` is false. Before, the z-only pass cleared it (`Clear(true,false)` in `BeginDepthMapRendering(true)`). Without it, depth would be tested against the previous frame.

Build: `DayZ045-fps-noprime-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0`, no C/LNK/MSB errors. The first attempt failed with `C1090` (corrupted compiler PDB) and the second with `C2039` (`GEngine` and `Engine*`); fixed by adding `virtual ZPrimed()`/`virtual SetMainDepthPrimed` to the `Engine` base class (`lib/engine.hpp`).

- `DayZ.exe`: 11,567,104 bytes, SHA-256 `34CA9C61F8A974E41E27735F3EE8D2EE180C09A17AE1AB3C8F4CDDE82CEA5E26`.
- `DayZ.pdb`: SHA-256 `31DD70E503799AC07D19C3AF4CB3B55C12B94F472AA20923AC799E15364FDC1B`.
- `DayZ.map`: SHA-256 `04C5A017E841CA060CFC61AD55894F593A4F2005A7EE6FC9EE3B851BAB941556`; contains `?ZPrimed@EngineDD9@@UBE_NXZ` and `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Runtime: `BuildOutput\DayZ045-fps-noprime-retail-runtime-20261117`.
- Restore point: `restore-points/fps-rmzprime-removal-before-edit-20261117-1235`.
- Sources at the end: `engdd9.hpp` `A09ACC1A24C6C967627CB8530BD16BFA3EBAA16A3B8A56A83E1C4104B0CF7E20`; `engdd9.cpp` `FF6A9F4708416B60E9E781EEFE3BCF1C8022549A30C3A8FE89467891C0FBE391`; `landscape.cpp` `D5F970B5CFA215C576AF7E74557974655D31329BAA377E68564332B47656D7F1`; `world.cpp` `FBDA870A757978494920E10EAF6BFF5AB97082689CA7E1080D968BA814DA46F0`; `engine.hpp` `D2ACBAF4CB0D76CBDC79C5480A70873C03D8B9DA8C127E44D2736BE356AE0C5C`.

B visual checklist: holes in the scenery (depth not cleared — `InitDraw` now clears), flicker on roads/decals over the terrain (they now write depth), foliage/tree clipping, vegetation shadow and objects vanishing near houses.

**Important note:** with `FSAA=0`, the `PrimeDepthBuffer` called is the `zOnly=false` one; `RMZPrime` did not run. That is why B is a no-op in the user's real configuration. It was kept because F was compiled on top of A+B.

### Candidate C — no `GetLandShadowSmooth` per instance in the depth passes

Change in `lib/scene.cpp`, `Scene::DrawObjectsInstanced` (3 points: ~6164, ~6182, ~6205):

```cpp
info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
```

Before, the coefficient was computed for each instance in all passes. `GetLandShadowSmooth` samples the terrain shadow map (4 samples, `GetLandShadowDepthSmooth`) and may call `Landscape::SurfaceY`. In the `RMDPrime`/`RMZPrime` passes the shaders are `PSAlphaOnly` and do not consume `to.instanceShadow` (the value comes from the VS, but the PS does not use it); the work was discarded. With B, `RMZPrime` no longer exists, so the cut eliminates the computation in `RMDPrime` — the only remaining depth pass — and keeps the real value in the color pass (`dp._zprimeIsBeingRendered == false`). Nothing in the color pass was changed.

Build: `DayZ045-fps-noprime-noshadowcoef-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0`, no C/LNK/MSB errors.

- `DayZ.exe`: 11,567,104 bytes, SHA-256 `89264F51294BD9A0CA9B6EE8EFDA81244D264DF63EF8535AEDA030102CAEDA39`.
- `DayZ.pdb`: SHA-256 `F125793F9234A2F9CA8146B43B902C10987B674A1F9C872198BC425BF3FBF15A`.
- `DayZ.map`: SHA-256 `5CDEAC0B1972F210EFB6BBFD2C84865865D8EE2FF7AEADE2D4675748018E7513`; contains `?ZPrimed@EngineDD9@@UBE_NXZ` and `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z` (inherited from B).
- Sources: `lib/scene.cpp` `4375B8E9A80772481ED8A72B2E1A972058865E071F4EBD50939C88F83EDE76AC`; `lib/scene.hpp` `E12D6E223980542139619344E8DC0F370A4ABA8EFAFFE1EF7A5AFBEF959323B6` (unchanged).
- Restore point: `restore-points/fps-prime-shadowcoef-before-edit-20261117-1340` (previous `scene.cpp` `CC1A7C4777AEAE8DB24F833D1449CD6B8D58BE5BBFD213D6048F77D9C0EDAEBB`).
- Runtime: `BuildOutput\DayZ045-fps-noprime-noshadowcoef-retail-runtime-20261117`.

Risk: none in the color pass (not touched). In the depth pass the `1.0` value only feeds `instanceShadow`, which `PSAlphaOnly` ignores; if some depth shader starts consuming that term, the value would need to come back.

### Candidate D — depth pass without light grid per instance

Changes in `lib/scene.cpp`, `Scene::DrawObjectsInstanced`, all conditioned on `dp._zprimeIsBeingRendered`:

1. The three points that fill `info._lightGridIndex` (~6161, ~6179, ~6201) stop calling `GetLightGridIndex(x,z)` in the depth pass and write `-1`. That index only exists to sort/group instances by light; the pass does not consume light.
2. In the chain dispatch (~6263), the depth pass enters the single-draw branch, with an empty light list, instead of running `QSort(instances, ctx, CmpInstances)` and the light-grid grouping loop. Before, each chain was sorted (O(n log n) per chain, per pass) and split into several `DrawSimpleInstanced`, one per light group, with no effect on the result (depth only).

Rationale: with B, the only remaining depth pass is `RMDPrime` (SSSM mask). It resubmits all nearby objects with `PSAlphaOnly` shaders. After A (no material preparation, no `SelectAggLights`, no `DoSetMaterial`) and C (no `GetLandShadowSmooth` per instance), what was left of per-instance work was exactly the light grid index, the sorting by light and the fragmentation of the chain into groups. None of that affects the pixels: depth shaders do not read light.

Risk: `info._lightGridIndex == -1` is only read by the comparator and the grouping loop, both skipped in the depth pass (verified by scanning: `_lightGridIndex` appears only in `scene.cpp` 6061, 6062, 6294, 6300 and in the three fill points). `DrawSimpleInstanced` and `DrawMeshTLInstanced` do not use the field.

Build: `DayZ045-fps-primelightlean-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`. The first attempt (clean obj) and the second (incremental) failed with `fatal error C1090: PDB API call failed, error code '23'` in different files (`animation.hpp`/`soundScene.cpp`/`simul.cpp`), with no code error. The third attempt, resumed without deleting `obj` (reusing 170 objects) and with `mspdbsrv` terminated, finished with `exit=0` and no C/LNK/MSB error.

- `DayZ.exe`: 11,567,104 bytes, SHA-256 `14E21045C65B40717895780318DD2F2C1AA29C53ED4BA79AB61C759E9F1474D6`.
- `DayZ.pdb`: SHA-256 `31BFF20F179E9257149B66F4FC6E34AF403828F521CF44560BBB11497F83AE6C`.
- `DayZ.map`: SHA-256 `706DBDFA3A5F05C434A8CB1ECA289F49C85271DA5C3E235A390596E52D76A9B9`; contains `?ZPrimed@EngineDD9@@UBE_NXZ` and `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Source: `lib/scene.cpp` `350C9B4F6298D4BF21B539135E2A84E54FAA9DA77A8303E3D4F9D6267F1128D9`.
- Runtime: `BuildOutput\DayZ045-fps-primelightlean-retail-runtime-20261117`.
- Restore point: `restore-points/fps-prime-lightgrid-before-edit-20261117-1330` (`scene.cpp` `4375B8E9A80772481ED8A72B2E1A972058865E071F4EBD50939C88F83EDE76AC`).

### Candidate E — 1x-per-run section preparation in software instancing

First cut in the **color pass**. Target: `Engine::DrawMeshTLInstanced` (`lib/engineDraw.cpp`), the `nInstances>1` path used when the shape's vertex buffer was not created for hardware instancing and the draw falls back to one submission per instance.

Before, for each instance and each section run, the code redid `TLMaterial` + full `PrepareTL` (`LoadTextureMipmaps`, `PolyProperties::Combine`, `DoPrepareTriangle` with texture/sampler/render states/pixel shader and `DoSetMaterial`). That state depends only on the section/run, not on the instance. In a chain of hundreds of instances with several runs, that was thousands of full preparations per frame.

After: instance 0 fixes the pixel shader type and the UV scale/offset (texgen) with `SetInstanceInfo`/`BeginInstanceTL`/`BeginMeshTL`; for each run, `CreateMaterial` + `PrepareTL` happens **once**; inside the run, each instance only calls `ApplyMaterialTL` (material/light in object space) and `DrawSectionTL`.

```cpp
// instance 0: fixes pixel shader type and UV scale/offset (texgen)
SetInstanceInfo/BeginInstanceTL/BeginMeshTL(instances[0]);
for (r : runs) {
  CreateMaterial(mat, HWhite);
  PrepareTL(run r);              // ONCE per run
  for (j : instances) {
    SetInstanceInfo/BeginInstanceTL/BeginMeshTL;
    ApplyMaterialTL(cb, mat);    // only material/light in object space
    DrawSectionTL(run r);
    EndMeshTL;
  }
}
```

- `ApplyMaterialTL` is a new virtual in `Engine` (empty) implemented in `EngineDD9`. It reproduces only the final part of `PrepareTriangleTL`: modulation by `_modColor` + `DoSetMaterial`. That is the only part of `PrepareTriangleTL` that depends on the instance, because `SetupMaterialLights` transforms the light direction to object space via `cbState._world` (`TransformAndNormalizeVectorToObjectSpace`).
- In the depth pass (`RMDPrime`/`RMZPrime`) `ApplyMaterialTL` returns early, preserving candidate A. Even so, E removes `DoPrepareTriangle`/`LoadTextureMipmaps` per instance in that pass, which A did not remove.
- The order `BeginInstanceTL`/`BeginMeshTL` of instance 0 before `PrepareTL` is mandatory: `BeginInstanceTL` selects the pixel shader type (`PSTBasic`/`PSTBasicSSSM`/`PSTAlphaOnly`) and `BeginMeshTL` records the UV scale/offset consumed by `EnableCustomTexGen` inside `DoPrepareTriangle`. Without that, texgen would use the previous shape's state.
- The original loop remains intact for `nInstances==1` (unique objects), shadow, the hardware instancing path (`DrawMeshTLSectionsInstanced`), LOD, sorting and the color pass of unique objects.

Build: `DayZ045-fps-colorinstance-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0` and no C/LNK/MSB error.

- `DayZ.exe`: 11,568,128 bytes, SHA-256 `BCEE389B1A9C7496016853AD3ADC639B9846CE9687F4AB8670B723F1CA7FCB95`.
- `DayZ.pdb`: SHA-256 `B6342BD5F4A927576DFBC1DAA88045ED09EF3B16A15E5B9CD016F9D2FF157702`.
- `DayZ.map`: SHA-256 `748532D5F26215A038C7D8C3825C24AD7273071221F1944A065D9CFCC4BAFF96`; contains `?ApplyMaterialTL@EngineDD9@@MAEXHABUTLMaterial@@@Z` and `?DrawMeshTLInstanced@EngineDD9@@...`.
- Runtime: `BuildOutput\DayZ045-fps-colorinstance-retail-runtime-20261117`.
- Restore point: `restore-points/fps-colormaterial-before-edit-20261117-1325` (`engine.hpp` `D2ACBAF4CB0D76CBDC79C5480A70873C03D8B9DA8C127E44D2736BE356AE0C5C`, `engineDraw.cpp` `50949F1F62EDDE59FD9BC329E5C37A84B88307144192107CB6CAD1B2CF35CEF2`, `engdd9.hpp` `4B73AF821D8FE29A2148856A6208772796D13DE3395549D5A195D91D5C8D994C`, `engdd9.cpp` `FF6A9F4708416B60E9E781EEFE3BCF1C8022549A30C3A8FE89467891C0FBE391`).
- Sources with E: `engine.hpp` `94A6E8224BD0EACBB2C7FC5F9A401C5203872BE444E52BC8AAF7822DBF1BECC1`; `engineDraw.cpp` `DB51E4C580163CA9B780F6BF80795D073BB2482003F96A9D7F89B2165EE0FC4F`; `engdd9.hpp` `C8593E1FB4318659581AA4C4016536922EA08DE2ECE67F62178DE2F350B325EC`; `engdd9.cpp` `757236D61692FF413EBC21019EF8E0F9EAFB5E81EC5427899663616320A0B6A8`.

Risks to watch: displaced/repeated UV (order `BeginMeshTL`/`PrepareTL`), different color/light between instances of the same chain (`ApplyMaterialTL` missing or out of order), object vanishing/wrong shader. The software instancing path is used mainly for vegetation/repeated objects; unique houses (`nInstances==1`) do not go through it.

### Candidate F — no object submission in the depth prepass with `FSAA=0`

Cut at the submission level, above `Shape::DrawSections`: it reaches unique objects (houses) and instanced ones equally, because it removes the **entire second call** to `Object::Draw` in the frame.

With `FSAA=0` (the user's real configuration), `World::Simulate` calls `Landscape::PrimeDepthBuffer(..., zOnly=false, ...)`. In `landscape.cpp:5993` the pass drew `Scene::DrawDepthPrime`, which submitted `_drawPass1ON._original`, `_drawPass1ON._blending` and `_drawPass1AN` in `RMDPrime`. Then `SetMainDepthPrimed(true)` made the color pass reuse the recorded commands.

Changes:

- `Scene::DrawDepthPrime` gained `bool drawObjects` (no default, to avoid conflicting with the `drawListId` of `_HELISIM_RENDER_TO_TEXTURE`; the only caller passes all arguments).
- In `Landscape::PrimeDepthBuffer`, `primeObjects = zOnly || GEngine->GetFSAA()!=0`. With `FSAA=0` and `zOnly=false`, `drawObjects=false`: the object lists are not submitted in the depth prepass.
- `SetMainDepthPrimed(primeObjects && (zOnly || GEngine->GetFSAA()==0))` stays `false` in that case. The color pass returns to the normal path (`ZFUNC LESSEQUAL` + `ZWRITE TRUE`) and the main clear clears Z/stencil (`engdd9.cpp:3439`).
- `DrawVolShadows` and `DrawPass3Part`/`DrawPass4Part` stay in `DrawDepthPrime`; `DrawRectShadowBuffer` (shadow maps), `shadowQuality=4` and `shadowZDistance=250` were not changed.
- With `FSAA>0` the old behavior is kept (separate depth prepass still needed).

What this removes per unique object, per frame: one `Object::Draw` call with `Animate`, `SelectAggLights`, `PrepareTextures`, `UseDrawMatrices`, `Shape::Draw` -> `DrawSections` (`CreateMaterial`/`PrepareTL`/`DrawSectionTL`) and the corresponding `DrawIndexedPrimitive`. The inside of `DrawSections` already joins adjacent sections with identical `PolyProperties` (`shapeDraw.cpp:144-163`, comparing `_texture`/`_special`/`_surfMat` in `poly.cpp:18-35`); the real waste was the entire repeated submission.

- Build: `DayZ045-fps-noprimeobjects-release-20261117`, Release/Win32, `exit=0`, no C/LNK/MSB error.
- `DayZInt.exe`: 13,916,672 bytes, SHA-256 `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB`.
- `DayZInt.pdb`: SHA-256 `AD464C876D14F3519E0B8EE2317175DD43ABC3010D7658DC6BA9692FF6C853E7`.
- `DayZInt.map`: SHA-256 `D6C3D7B21103A0E8FC92307E4005B296E04C70D732128FD94BD98D07ACFD7E0A`; contains `?DrawDepthPrime@Scene@@QAEXAAUDrawContext@1@_NW4PredicationMode@Engine@@1H@Z` and `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Runtime: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-20261117`.
- Restore point: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f-20261117-164157` (`scene.cpp` `350C9B4F6298D4BF21B539135E2A84E54FAA9DA77A8303E3D4F9D6267F1128D9`, `scene.hpp` `E12D6E223980542139619344E8DC0F370A4ABA8EFAFFE1EF7A5AFBEF959323B6`, `landscape.cpp` `D5F970B5CFA215C576AF7E74557974655D31329BAA377E68564332B47656D7F1`).
- Sources with F: `scene.cpp` `99B6BFFC91C536904FAC978BABC8E9F2904B971FE2BEC34A77629A9A8607650C`; `scene.hpp` `539C579BD15F36D26B1842CB0449EA7D4ABB09A3E9A8F82939D8785B83A13D20`; `landscape.cpp` `FAA0BC763CDB57F8E298156F73CE6F5B05EE8E3934A430C5E09C60C4093D6D24`.

#### F Retail (historical, not tested with V38)

Before the F Release, the same cut was compiled in Retail: `DayZ045-fps-noprimeobjects-retail-20261117`. `DayZ.exe` is 11,568,128 bytes with SHA-256 `CA4F03D7A5C1E8A4C575C5D5BD1C95841B63D87B091191D8EB9E6F276A4FB329` (PDB `033D1D84B07B3D233733D5C70DF1D9CBBCA029FBC16080524E8FC078A4B1089F`, MAP `22084066556D3DBA4C6E410B5381D0FDC505784F6C87EA2E124B2E66E8DE4D7A`; build exit=0). The `.map` contains `DrawDepthPrime` with the new bool parameter and `SetMainDepthPrimed@EngineDD9`.

That binary **could not be tested with the V38 package**: Retail verifies PBO signatures and rejects the modified `ui.pbo`. It remains as a historical reference of the cut. The real F test was the Release `7C71EA...` listed above.

**F test result:** FPS ↑, character invisible in 3rd person, houses/trees vanish on approach, grass flickers. The gain is invalid because the `_drawPass1ON` list was not drawn. F **is not** the final answer.

## Earlier work: investigation, instrumentation and dead ends

Before cuts A–F, the track went through a static audit and several diagnostic builds. That was not the final path, but it is part of the history and explains why the target moved to the depth prepass.

### 15/11/2026 audit

- `FarLodsDefault = 2`; `Scene::DrawPreparation` walks static candidates, recomputes `ClippingInfo` and calls `SceneCoverage::RenderBBox` with a 64×32 grid (`scene.cpp:9447-9474`). Potential per-object cost, but no proof of dominance.
- D3D9 instancing fallback: the buffer limits copies to 32,000 vertices for frequent geometry and 8,000 for infrequent; large models fall into `Engine::DrawMeshTLInstanced`, which walks instance by instance and repeats mesh/material/section preparation (`engdd9.cpp:7257-7277`, `8731-8807`, `engineDraw.cpp:1370-1458`).
- `HORIZON_PRUNE` active; `HorizonPrune::AddObjectHorizon` transforms the two endpoints of each edge and repeats the same vertex when edges share vertices (`world.cpp:7299-7337`). There was an explicit TODO in the code itself.
- `World::PrepareDraw` only groups non-occluder objects, without shadow, above 200 m (`world.cpp:8293-8337`). Up close, the path is per object.
- Synchronous cell loading up to 200 m (`UOWait`), with `LoadObjects`/`ObjectCreate` (`landSave.cpp:2356-2517`). It may explain the stutter on first entry, not continuous low FPS.
- Asset inventory: `assets_buildings.pbo` 543 entries/98 `.p3d`; `assets_buildings2.pbo` 1,434/139; `structures_houses.pbo` 977/83; `worlds_chernarusplus_data.pbo` 8,002 entries/2,073 images. File counts, not map instances.

### Horizon vertex cache

- Implemented a direct 128-slot cache per vertex index and per-call/shape generation in `HorizonPrune::AddObjectHorizon`; collision only causes repeated transformation. Also initialized `_lastObject` as `NULL`.
- Release build: `DayZ045-fps-horizon-vertex-cache-20261115`, `DayZInt.exe` 13,843,456 bytes, SHA-256 `C92D1C0479DD30AC0C8C32870FE3CAA21BB29E5F82DD264C844B8D7599EC034C`.
- Retail build: `DayZ045-fps-horizon-vertex-cache-retail-20261115`, `DayZ.exe` 11,500,544 bytes, SHA-256 `89CA8021E5C7084F290DE81700B8B619BD40AA14CBB23604C64D4CD95BB3EAEE`.
- Restore point: `restore-points/fps-horizon-vertex-cache-before-edit-20261115-135230`; original `world.cpp` `D9D107F07400B26C93E102574F3510D433F5DF2E653630A24160014F94C961F6`.
- No A/B session; no gain declared.

### Per-group LOD transition

- `DrawObjectsInstanced` updated `blendFactor` inside the member loop; since the list shares a single `SortObject`, a list with N members could advance the blend N times in the same frame.
- Fixed to compute the coefficient once and update the blend once per group, after walking the members (`scene.cpp:6144-6190`).
- Restore point: `restore-points/fps-lod-group-before-edit-20261115-191628`; original `scene.cpp` `C46E6C36049BC9373CD13C69C17245817B2F0981B0580EF967567EAE44F62749`.
- Expected effect: consistent LOD transition; possibly small FPS impact.

### Grouping adjacent sections in the individual draw

- Implemented in `lib/shapeDraw.cpp`: contiguous sections with equal `PolyProperties` and the same `_minBoneIndex`/`_bonesCount` are grouped; it does not cross a hidden/proxy section, animated UV or crater passes.
- `dSec` scope under `cuDrw` measures draws and grouped sections.
- Profile build: `DayZ045-fps-drawsections-group-profile-20261115-2120`, `DayZProfile.exe` SHA-256 `EBF453D99B646E7C6397255097224F084B0AF24D57592003A366ACB6B7C7B07C`.
- Restore point: `restore-points/fps-drawsections-group-before-edit-20261115`; original `shapeDraw.cpp` `4BDD66170DFE51EFF8B1EDC36EF350E4AD09C7F18E8938F65946A727007F12CE`; current `43820FEDE60246817043A66345BA6B0F36173BBE33D3532A132AF454107C03FD`.
- No A/B; not adopted as the main fix.

### Texture index per shape (`_texAreaDraw`)

- New index separate from the landscape `_texArea`, without division by UV scale, with AOT saturated at `1e20f` and explicit invalidation in `Shape::Clear`, `FindSections`, `SetAsOneSection`, `SetUniformMaterial` and `RecalculateAreas`.
- `TexAreaIndex::Item` stores `_z2Scale` and `_forceMipmap0`; `BuildTexAreaDrawIndex()` builds the index after the vertex buffer creation; `PrepareTextures` prefers `_texArea`, then `_texAreaDraw`, and keeps the old path in `prpSc`.
- Profile build: `DayZ045-fps-texarea-draw-index-profile-20261117`, `DayZProfile.exe` 16,122,368 bytes, SHA-256 `826C348CC505A8652AEDE671D25D3D71270598C516C03C99DB1F83A8D0394DEB`; PDB `D916E6A7237458D298644489D1013DEC61D75CE32936B83A904198435636017B`; MAP `483B2513397E0A464EA3C2694CE8E9BB2B03DCE9DF7C6A6DC18E50EDAAFF71B7`.
- Sources: `shape.hpp` `18CF428F39675B1C889AF91166C2E44ED277A5BCDDDE02B4CBFB0C877789D5C8`; `shape.cpp` `20CF4261444001EAA6507A6DB6C0C74C67439B99F52EEBFBFB68C64C15E5CACA`; `shapeDraw.cpp` `F274A05635D993C1A69CD50B4149FC80F71C72F0771D06B258E165F9B095774D`.
- Build environment fixes: `openlpc.cpp` with `openlpc_round` + `lrintf`; Bullet from `_MSC_VER=1900` replaced by 1600 libs; Simul replaced by VC10 Static Release; `legacy_stdio_definitions.lib` and `crtCompat.cpp` removed from `lib2010.vcxproj` to avoid `LNK2005`/`LNK1104`.
- No FPS measurement; the hypothesis was to reduce `prpSc` and increase `prpIX`.

### Added profiling scopes

- Individual object: `obAni` (animation), `obLit` (lights), `obTex` (textures), `obShp` (shape/draw).
- Instancing: `inTex`, `inDrw`.
- Texture: `prpIX` (index path), `prpSc` (per-section scan).
- World: `wGrd` (grid), `wCel` (cell).
- D3D9: `d9HW`/`d9FB` (accelerated/fallback path), `d9HWc`/`d9HWi`/`d9FBc`/`d9FBi` (counters), `d9SR` (section ranges).
- Individual draw: `dSec` (grouped sections).

### Diagnostic builds (Profile)

| Build | Artifact | SHA-256 |
|---|---|---|
| `DayZ045-fps-object-render-scopes-profile-sln-20261115` | `DayZProfile.exe` 16,051,200 bytes | `BF704538DB4EB408DAF5D8BA90028FA62F077E7DE919C3B6DB908A8A99C9AFA7` |
| `DayZ045-fps-texture-branch-profile-20261116` | `DayZProfile.exe` 16,053,248 bytes | `4832A3C467D28924D8727A6CB1E7979B237C61442A79A49AB7CE6B80213406E4` |
| `DayZ045-fps-world-prep-grid-profile-20261116` | `DayZProfile.exe` 16,053,248 bytes | `A6298CF0C217C8ACDFEEFFFFCDF148EFE465403496A2F8E6E09EB3ACF9D73FE7` |
| `DayZ045-fps-d3d9-instancing-profile-20261116` | `DayZProfile.exe` 16,054,272 bytes | `53B27D2ADF20EECCE0F9190B9825CD9959A614337EC86FBAA9EFB0281DF0A407` |
| `DayZ045-fps-fallback-section-runs-profile-20261116` | `DayZProfile.exe` 16,056,320 bytes | `0BBA3DC8522D07101392C444CEE5E04F3AFBECEA9B7EBE2965C79B563383FF55` |
| `DayZ045-fps-texarea-draw-index-profile-20261117` | `DayZProfile.exe` 16,122,368 bytes | `826C348CC505A8652AEDE671D25D3D71270598C516C03C99DB1F83A8D0394DEB` |

These builds served to measure paths (texture, instancing, grid, sections), but the user rejected turning the work into a profiler marathon. The decision was to cut directly in the object submission path and validate in game. No gain was declared from them.

## What has already been ruled out

- **Shadow and view distance:** the user explicitly rejected it. `shadowQuality`, `shadowZDistance`, cascades, `sceneComplexity` and `viewDistance` are not the cause being fixed.
- **Vsync:** the test is always with `VSync=0`.
- **Garbage collector:** `FreeOnDemandGarbageCollect` is an empty inline in this configuration (`El/FreeOnDemand/memFreeReq.hpp:684-689`); the calls in `MergeInstances` do not collect and do not explain the drop.
- **Enabling the global texture index without protection:** the historical comment in `Shape::CheckPushbufferCanBeUsed` recorded `areaOTex == INF` and a floating-point trap in `Texture::PrepareAndCheckMipmapLevel()`; enabling without a separate index and without AOT saturation could reintroduce crash/mipmap corruption.
- **Swapping `UOWait` for `UONoWait` without proof:** it would change the loading policy and could cause pop-in/missing objects.
- **Declaring a gain from F:** FPS rose because part of the scene was not drawn. That does not count.

## Folders, builds and files

### Main builds

| Build | Configuration | Executable | SHA-256 |
|---|---|---|---|
| `DayZ045-fps-depthprime-lean-retail-20261117` | Retail/Win32 | `DayZ.exe` 11,567,104 | `F279A9FEE966F0766B0C1C9E4DE3E88D9C48AAFCF7623239F931AF3CE1613B9C` |
| `DayZ045-fps-noprime-retail-20261117` | Retail/Win32 | `DayZ.exe` 11,567,104 | `34CA9C61F8A974E41E27735F3EE8D2EE180C09A17AE1AB3C8F4CDDE82CEA5E26` |
| `DayZ045-fps-noprime-noshadowcoef-retail-20261117` | Retail/Win32 | `DayZ.exe` 11,567,104 | `89264F51294BD9A0CA9B6EE8EFDA81244D264DF63EF8535AEDA030102CAEDA39` |
| `DayZ045-fps-primelightlean-retail-20261117` | Retail/Win32 | `DayZ.exe` 11,567,104 | `14E21045C65B40717895780318DD2F2C1AA29C53ED4BA79AB61C759E9F1474D6` |
| `DayZ045-fps-colorinstance-retail-20261117` | Retail/Win32 | `DayZ.exe` 11,568,128 | `BCEE389B1A9C7496016853AD3ADC639B9846CE9687F4AB8670B723F1CA7FCB95` |
| `DayZ045-fps-noprimeobjects-release-20261117` | Release/Win32 | `DayZInt.exe` 13,916,672 | `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB` |
| `DayZ045-fps-noprimeobjects-release-f2-20261118` | Release/Win32 | `DayZInt.exe` 13,916,160 | `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |

### F2 test runtime

`BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118`

- `DayZInt-ORIGINAL-v37-clean.exe` — original Release, 13,640,192 bytes, SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22`.
- `DayZInt-F.exe` — broken F, 13,916,672 bytes, SHA-256 `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB`.
- `DayZInt-F2.exe` — fixed F2, 13,916,160 bytes, SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE`.
- `DayZInt-F2.pdb` / `DayZInt-F2.map` — symbols with checked hash.
- `Start-DayZ-Original.bat`, `Start-DayZ-Release-F.bat`, `Start-DayZ-Release-F2.bat`.
- `perfil-janela` — test profile.
- `Addons`, `BattlEye`, `bin`, `dll`, `dta`, `Keys` — junctions to `build\inventory-menu-v10\package-v38-pause-menu`.
- `README-FPS-F2.txt` — instructions and test record.

### V38 package and signature

- `Addons\ui.pbo`: 48,349,274 bytes, SHA-256 `EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500`.
- `ui.pbo` has no `ui.pbo.dayz.bisign`; that is why Retail rejects it and Release accepts it.
- The base game used in the junctions is `package-v38-pause-menu`; the test does not copy PBOs to `dist`.

### Sources and restore points

| Candidate | Main files | Restore point |
|---|---|---|
| A | `object.cpp`, `d3d9/engdd9.cpp` | `restore-points/fps-depthprime-lean-before-edit-20261117-120927` |
| B | `d3d9/engdd9.hpp`, `d3d9/engdd9.cpp`, `landscape.cpp`, `world.cpp`, `engine.hpp` | `restore-points/fps-rmzprime-removal-before-edit-20261117-1235` |
| C | `scene.cpp` | `restore-points/fps-prime-shadowcoef-before-edit-20261117-1340` |
| D | `scene.cpp` | `restore-points/fps-prime-lightgrid-before-edit-20261117-1330` |
| E | `engine.hpp`, `engineDraw.cpp`, `d3d9/engdd9.hpp`, `d3d9/engdd9.cpp` | `restore-points/fps-colormaterial-before-edit-20261117-1325` |
| F | `scene.cpp`, `scene.hpp`, `landscape.cpp` | `backup-fps-f-20261117-164157` |
| F2 | `d3d9/engdd9.cpp`, `scene.cpp` | `backup-fps-f2-20261118-003054` |

## Next steps

> The track is **paused here**. The full script, with the state of the artifacts and what not to repeat, is in **Resume point**. In short:

1. Compare **F2 vs Original** at the same spot to confirm the grass and shadow regressions. If they are only from F2, discard F2 as a visual fix.
2. Compile **A+B+C+D+E in Release**, from `backup-fps-f-20261117-164157`, and test against the Original at the same spot in Berezino, vsync off, complete scene. That sequence preserves the depth prepass and was never measured.
3. If A–E does not pay off, **measure the color pass** (`Scene::DrawObjectsInstanced`, `Object::Draw`, `Shape::DrawSections`) before cutting. The next target is material/texture per unique object and the 1x-per-run preparation in the `nInstances==1` path.
4. Do not use the F FPS as reference and do not test Retail with the unsigned V38.
5. Only declare a gain with A/B at the same spot, complete scene and clean RPT.

## Artifacts and documentation

- Technical audit: `SOURCE DEFINITIVA\DayZ-0.45.124252\Docs\performance\FPS_URBAN_AUDIT_2026-11-15.md`
- Test sheet: `BuildOutput\FPS-AB-TEST-20261117.txt`
- F test screenshots: `site\public\fps-2026-11-18\f-teste-01.jpg` … `f-teste-06.jpg`
- F2 test screenshots: `site\public\fps-2026-11-18\f2-teste-01.jpg` (arrows) and `f2-teste-02.jpg` (window)
- F build: `BuildOutput\DayZ045-fps-noprimeobjects-release-20261117`
- F runtime: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-20261117`
- F2 build: `BuildOutput\DayZ045-fps-noprimeobjects-release-f2-20261118`
- F2 runtime: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118`
- F restore point: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f-20261117-164157`
- F2 restore point: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f2-20261118-003054`

> **Rule of the track:** no FPS number is worth anything if the scene is incomplete. First the character, the houses, the trees and the grass; then the gain.
