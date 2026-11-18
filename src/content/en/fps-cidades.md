# Dossier: FPS drop when approaching cities

> **Reported symptom:** when approaching a city (e.g. Berezino), FPS drops abruptly — in
> reports, down to 0-1 FPS. Walking 50-100 m toward the city is the trigger.
> This dossier reconstructs the causal chain **from code**, not from opinion.
> Method: `1.md` §3.2, §3.6, §4.7, §5.4 + direct reading of `world.cpp`, `scene.cpp`,
> `object.cpp`, `landClutter.cpp`, `zombie.cpp`.

## 1. Short answer

The **probable** bottleneck is **CPU on the per-object path** (`Object::Draw`, `object.cpp:1968` and
`Scene::DrawObjectsInstanced`, `scene.cpp:6108`), plus the **lock rectangle streaming**
that fires when crossing the cell boundary (`World::PrepareDraw`, `world.cpp:7996-8015`).

Swapping DX9 for DX11 **does not fix** this by itself. The study itself records that the Berezino test
did not confirm an improvement (`1.md` §4.7) — and reading the code explains why.

## 2. The causal chain in 6 links

```text
[1] You walk 50-100 m
      ↓
[2] The lock rectangle (_objAroundCam) changes cell
      → incremental locks + asynchronous loading  (world.cpp:7996-8015)
      ↓
[3] PrepareDraw recomputes visibility and distances
      → maxDist includes shadow: reducing objectsZ does not reduce cost  (7953-7960)
      ↓
[4] Every visible object enters Object::Draw
      → 6 of 7 expensive operations are per object and per frame  (object.cpp:1968)
      ↓
[5] Instancing is capped at 512 and pays GetLandShadowSmooth per instance
      → scene.cpp:6116, 6169/6188/6211
      ↓
[6] The frame overruns the restFrame = 0.045f budget (~22 FPS)
      → world.cpp:11894; the delay contaminates AI, network and script
```

Each link has its own evidence. None of them requires "the GPU is weak" as an explanation.

## 3. Link 1 — the frame budget is from 2013

`world.cpp:11894`:

```cpp
restFrame = 0.045f;   // 45 ms reserved for "the rest" ≈ 22 FPS
```

The `TimeManager` receives `estimateReserve` and distributes the slack among systems. On modern
hardware, 45 ms is a wrong premise: the engine **underestimates** the real slack and serializes
work that could be parallel or deferred.

**H-01** — confirm by logging the real `estimateReserve`. Candidate fix: derive it from
`RefreshRate()` instead of a fixed constant.

## 4. Link 2 — the lock rectangle and hysteresis

`World::PrepareDraw` (`world.cpp:7926`) decides **what** will be drawn:

- `7953-7960` — three distinct distances:
  `objRange = ObjRange`; `maxObjDist = min(fogMax, config.objectsZ)`;
  `shadowRadius = GetMaxShadowSize()`;
  `maxShadowDist = shadows ? GetMaxShadowSize() + GetShadowZ() : 0`;
  `maxDist = max(maxObjDist, maxShadowDist)`.
  Objects are processed **beyond** the draw distance to project shadow inside the
  frustum. **That is why reducing `objectsZ` does not reduce cost proportionally.**
- `7972-7973` — `Calcul2DEdges(maxDist, ObjGrid, objRange, true, floop, boundRect)` computes
  the 2D grid rectangle covering the frustum.
- `7980-7994` — builds `circleRect` (rotation-invariant) and `objRect = circleRect +
  boundRect`, saturated at map bounds. The comment at `7978-7979` is explicit:
  *"we want the locked rectangle around the camera to be rotation invariant — turning
  around is a frequent thing and should not cause any locking/unlocking traffic"*.
- `7996-8015` — on the `inPreload` path, it locks the rectangle **incrementally**
  (`_objAroundCam->LeftToLock()`) so as not to saturate the loading system.

**H-02** — the highest-priority suspect for the "walk 50-100 m and drop" symptom: crossing the
cell boundary triggers locks, asynchronous loading and re-`PrepareDraw` of everything.
Confirm by counting locks per frame. Fix: larger hysteresis or asynchronous lock.

## 5. Link 3 — the per-object cost (the core of the problem)

`Object::Draw` (`object.cpp:1968`). The **7 expensive operations**, in code order:

| # | Operation | Line | Per object? | Per frame? |
|---|---|---:|---|---|
| 1 | `ShapeGeometryLock` | 2036-2040 | yes | yes |
| 2 | `VertexBufferLock` | 2122 | yes | yes |
| 3 | `AnimationContext` construction | 2043-2047 | yes | yes |
| 4 | `Animate()` (skeleton) | 2045 | yes | yes |
| 5 | `SelectAggLights()` | 2091-2093 | yes | yes |
| 6 | `PrepareTextures()` | 2126 | yes | yes |
| 7 | `OptimizeLevelRendering()` + `shadowCache.Split()` | 2129 / 2165-2186 | yes | yes |

**6 of 7 are per object and per frame.** In a city with thousands of objects, the cost grows
linearly with the number of objects — and none of those operations is "drawing a triangle".

Details that make it worse:

- `AnimationContextStorageRender storage;` + `Animate(...)` = **skeleton animation
  computed on the draw path**, per object, per frame.
- `OptimizeLevelRendering(forceLOD,false)` is **mutating** and called on the draw path.
  If the same shape is drawn by two workers, it is a potential *data race* (**H-08**).
- `shadowCache.Split(this, VUp, forceLOD, special)` **splits geometry for shadow at draw
  time** (**H-09**).
- `DoAssert(CheckMainThread())` only exists under `_HELISIM_RENDER_TO_TEXTURE`; outside that the
  drawing can come from a worker — so the locks above are real, not decorative.

## 6. Link 4 — capped instancing and per-instance computation

`Scene::DrawObjectsInstanced` (`scene.cpp:6108`):

- `6116-6118` — `maxInstancingChain = 512`; larger chains would cause allocation, so the
  engine **splits** the batch. This keeps the number of draw calls high.
- `6139-6142` — `AUTO_STATIC_ARRAY_16(ObjectInstanceInfo, instances, maxInstancingChain)`:
  up to 512 × `ObjectInstanceInfo` **on the stack** per call (tens of KB).
- `6146-6200` — per object:
  - `PrefetchT0Off(list->Get(li+1), 0)` (manual prefetch);
  - `GetBlendingCoef(bao, canBlend)` **computed 2× per object** (6163 and 6181);
  - `info._origin = obj->RenderVisualState().Transform();`
  - `info._shadowCoef = GetLandShadowSmooth(info._origin.Position());` ← **per instance**.
- `6196-6200` — accumulates `minDist2` and `maxCoveredArea` to choose LOD.

**H-04** — `GetLandShadowSmooth` depends on **position**, not on the object. If N objects
share the same terrain cell, it is N× the same computation. Caching per cell is the
best cost/benefit fix on the instancing path.

## 7. Link 5 — grass/clutter grows with the visible area

`landClutter.cpp`:

- `4224`, `4242-4274` — grass cost grows with the **area of the visible rectangle**, not with
  distance (**H-13**). Looking at a large city (large rectangle) costs more than
  looking at the horizon.
- `4187-4211` — clutter `lodLimit` recomputed **per frame** (**H-14**).
- `4242-4274` — `_clutterData` read without a lock during jobs (**H-15**, `[hypothesis]`).

Together with `ClearClutterDrawCache()` (`world.cpp:11816`), which clears the clutter cache **every
frame**, it forms a set of costs that appears exactly when the city opens on screen.

## 8. Link 6 — AI and infected steal invisible budget

- `zombie.cpp:3854` — `ObjectCollisionLine` per idle zombie (**H-06**). With 1,000
  infected in a city, it is a physics load **invisible** in the budget (nothing appears on
  screen), but it reduces the time available for drawing.
- `enf_scriptvm.cpp:906` — `m_Stats.m_iExecuted++` per instruction (**H-05**): global counter
  incremented per instruction, a cache-miss candidate under heavy script.

Since the budget is shared, **slow AI reduces FPS even without appearing in the frame**.

## 9. Why switching to DX11 does not solve it

`1.md` §4.7, honest answer:

1. **Less driver overhead per draw call** only shows up if the number of draw calls is high
   and state is cached. A naive port (one `UpdateSubresource` per object) can be
   **slower** than DX9.
2. **Native instancing** already exists in the engine (`Scene::DrawObjectsInstanced`), but in DX9 it is
   emulated. In DX11 the gain is real **if** the batch exceeds 512 (today the limit is 512).
3. **Compute/streaming** is not used today.

For the city symptom, the bottleneck is **CPU on the per-object path**, not the graphics API.
Swapping DX9 for DX11 without attacking `Object::Draw` and `DrawObjectsInstanced` does not change the result.
The DX11 backend has 1,211 lines against 51,549 in DX9 — 2.3% of the surface.

## 10. Measurement protocol (reproducible)

Without it, any "optimization" is a bet.

1. Fix build, mission, renderer and route (e.g. Berezino, 50-100 m approach).
2. Capture 30 s with **PerfLog + ETW**; note `wSimu`, `wPrep`, `obDrw`, `obShD`.
3. If **`obDrw` dominates** → attack `Object::Draw` (F-005).
4. If **`wPrep` dominates** → attack the grid/lock of `PrepareDraw` (F-003).
5. If **`DrawGroundClutter` dominates** → attack `landClutter.cpp:3991`.
6. If **none dominates** → GPU/Present: measure with GPUView before touching code.
7. One change at a time, same route, same save.

Tools already available in the binary: `PROFILE_SCOPE_EX`, `PerfLog/`, `DayZ.pdb` (70.7 MB),
`DayZ.map`, ETW + GPUView, PIX/RenderDoc and `-dx11warp` (`Dx11Device.cpp:53`).

## 11. Candidate fixes, by cost/benefit

| Priority | Fix | Where | Expected impact | Risk |
|---|---|---|---|---|
| 1 | Cache `GetLandShadowSmooth` per terrain cell | `scene.cpp:6169,6188,6211` | high in city (N× → 1×) | low |
| 2 | Larger hysteresis / asynchronous `_objAroundCam` lock | `world.cpp:7996-8015` | high on the "walk 50-100 m" symptom | medium |
| 3 | Derive `restFrame` from `RefreshRate()` | `world.cpp:11894` | medium, global | low |
| 4 | Make `OptimizeLevelRendering` idempotent or cache per shape | `object.cpp:2129` | medium in city | medium (race) |
| 5 | Cache `shadowCache.Split` per shape+LOD | `object.cpp:2182` | medium (shadows) | medium |
| 6 | Clutter budget by distance, not area | `landClutter.cpp:4224` | medium (grass) | low |
| 7 | Schedule `ObjectCollisionLine` by budget, not time | `zombie.cpp:3854` | medium with many infected | low |
| 8 | Instancing batch above 512 | `scene.cpp:6116` | medium (fewer draws) | low |
| 9 | `GetBlendingCoef` 1× per object | `scene.cpp:6163,6181` | low, free | none |
| 10 | Per-thread local VM counter | `enf_scriptvm.cpp:906` | low/medium | low |

## 12. What does **not** help

- **Swapping DX9 for DX11 without touching the per-object path.** The Berezino test did not
  confirm an improvement.
- **Reducing `objectsZ` expecting proportional cost.** `maxDist` includes `maxShadowDist`;
  objects beyond the draw distance are still processed because of the shadow.
- **Optimizing `Scene::DrawObject`.** It is 13 lines of forwarder (`scene.cpp:11186`); the cost
  is in `Object::Draw` and `DrawObjectsInstanced`.
- **Raising graphical quality expecting more FPS.** There is no AA, MSAA, SRGB or occlusion in
  DX11; adding more passes only increases the cost.

## 13. Reproduction checklist

- [ ] Fixed build: 0.45.124252, DX9 and DX11 renderer.
- [ ] Fixed route: Berezino approach within 50-100 m.
- [ ] 30 s capture with PerfLog + ETW, same camera.
- [ ] Record `wSimu`, `wPrep`, `obDrw`, `obShD` and `Present`.
- [ ] Count `_objAroundCam` locks per frame.
- [ ] Count `GetLandShadowSmooth` calls per frame.
- [ ] Count draw calls and instances per batch.
- [ ] Compare before/after ONE change.
