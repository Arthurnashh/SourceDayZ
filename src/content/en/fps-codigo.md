# Code before and after (git-like)

Everything that was changed in the FPS track, file by file, in patch format: a line with `-` is what existed **before**; a line with `+` is what came to exist **after**; `@@` indicates where the excerpt sits in the file. It is the same format as a `git diff`.

> **How to read the candidates:** the builds are cumulative. The diff of **B** is against the state **after A**, not against the original. Adding A+B+C+D+E+F reaches the F binary; F2 is F + the F2 patch. The earlier work (horizon cache, LOD, section grouping, texture index and instrumentation) is shown separately because it was already in the tree before A.

## Files touched

| File | Appears in |
|---|---|
| `lib/object.cpp` | A, `Object` instrumentation |
| `lib/scene.cpp` | C, D, F, F2, LOD by group |
| `lib/scene.hpp` | F |
| `lib/landscape.cpp` | B, F |
| `lib/world.cpp` | B, horizon cache, grid scopes |
| `lib/engine.hpp` | B, E |
| `lib/engineDraw.cpp` | E, instancing fallback |
| `lib/d3d9/engdd9.cpp` | A, B, E, F2, D3D9 instrumentation |
| `lib/d3d9/engdd9.hpp` | B, E |
| `lib/Shape/shape.cpp` / `shape.hpp` | texture index per shape |
| `lib/shapeDraw.cpp` | section grouping, texture index |

## Patch index

| Patch | Build | Download |
|---|---|---|
| **A** — lightweight preparation in the depth pass | `DayZ045-fps-depthprime-lean-retail-20261117` | [`A-depthprime-lean.diff`](/fps-diffs/A-depthprime-lean.diff) |
| **B** — removal of RMZPrime | `DayZ045-fps-noprime-retail-20261117` | [`B-rmzprime-removal.diff`](/fps-diffs/B-rmzprime-removal.diff) |
| **C** — no per-instance shadow in the depth pass | `DayZ045-fps-noprime-noshadowcoef-retail-20261117` | [`C-prime-shadowcoef.diff`](/fps-diffs/C-prime-shadowcoef.diff) |
| **D** — no light grid in the depth pass | `DayZ045-fps-primelightlean-retail-20261117` | [`D-prime-lightgrid.diff`](/fps-diffs/D-prime-lightgrid.diff) |
| **E** — material 1x per run in instancing | `DayZ045-fps-colorinstance-retail-20261117` | [`E-color-instancing-material.diff`](/fps-diffs/E-color-instancing-material.diff) |
| **F** — no objects in the depth prepass with FSAA=0 | `DayZ045-fps-noprimeobjects-release-20261117` | [`F-no-prime-objects.diff`](/fps-diffs/F-no-prime-objects.diff) |
| **F2** — command buffer scope guard | `DayZ045-fps-noprimeobjects-release-f2-20261118` | [`F2-cb-scope-guard.diff`](/fps-diffs/F2-cb-scope-guard.diff) |
| **H1** — horizon cache | `DayZ045-fps-horizon-vertex-cache-20261115` | [`H1-horizon-cache.diff`](/fps-diffs/H1-horizon-cache.diff) |
| **H4** — LOD by group | no dedicated build | [`H4-lod-group.diff`](/fps-diffs/H4-lod-group.diff) |
| **H5** — section grouping | `DayZ045-fps-drawsections-group-profile-20261115-2120` | [`H5-drawsections-group.diff`](/fps-diffs/H5-drawsections-group.diff) |
| **H8** — texture index per shape | `DayZ045-fps-texarea-draw-index-profile-20261117` | [`H8-texarea-index.diff`](/fps-diffs/H8-texarea-index.diff) |
| **H6** — Object scopes | `DayZ045-fps-object-render-scopes-profile-sln-20261115` | [`H6-object-scopes.diff`](/fps-diffs/H6-object-scopes.diff) |
| **H2** — World grid scopes | `DayZ045-fps-world-prep-grid-profile-20261116` | [`H2-world-grid-scopes.diff`](/fps-diffs/H2-world-grid-scopes.diff) |
| **H9** — D3D9 counter fix | before `DayZ045-fps-d3d9-instancing-profile-20261116` | [`H9-d3d9-counter-fix.diff`](/fps-diffs/H9-d3d9-counter-fix.diff) |
| **H10** — D3D9 instancing scopes | `DayZ045-fps-d3d9-instancing-profile-20261116` | [`H10-d3d9-instancing-scopes.diff`](/fps-diffs/H10-d3d9-instancing-scopes.diff) |
| **H12** — fallback run descriptor | `DayZ045-fps-fallback-section-runs-profile-20261116` | [`H12-fallback-run-descriptor.diff`](/fps-diffs/H12-fallback-run-descriptor.diff) |
| **H13** — reused section runs | `DayZ045-fps-fallback-section-runs-profile-20261116` | [`H13-fallback-section-runs.diff`](/fps-diffs/H13-fallback-section-runs.diff) |

## A — lightweight preparation in the depth passes

**Build:** `DayZ045-fps-depthprime-lean-retail-20261117` · Retail/Win32

**Files:** `lib/object.cpp`, `lib/d3d9/engdd9.cpp`

The `RMDPrime` (SSSM mask) and `RMZPrime` (z-only) passes only need depth. They use `PSAlphaOnly`, do not write color and consume neither material nor lighting. The cut removes material preparation, light selection and `DoSetMaterial` from those passes.

- `Object::Draw`: in `_zprimeIsBeingRendered`, it hands over an empty light list and calls `PrepareTextures` with `prepareBaseTextureOnly=true` (the base texture is the alpha test source).
- `EngineDD9::PrepareTriangleTL`: early return before the material color combination and `DoSetMaterial` when the mode is `RMDPrime` or `RMZPrime`.

**Full patch:** [download `A-depthprime-lean.diff`](/fps-diffs/A-depthprime-lean.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 51ce115..09be324 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -15663,16 +15663,21 @@ void EngineDD9::PrepareTriangleTL(
     // no material setup needed for shadows
     DoPrepareTriangle(cb, tex,TexMaterialLODInfo(),level,specFlagsSB,prop);
   }
   else
   {
     DoPrepareTriangle(cb, tex,mat,level,specFlags,prop);
   }
 
+  // Depth priming renders with PSAlphaOnly shaders and never writes color.
+  // Material and light constants are not consumed in this pass, so skip the
+  // per-section setup (several object-space transforms and VS constants).
+  if (_renderingMode==RMDPrime || _renderingMode==RMZPrime) return;
+
   // make color information from the texture
   // to be a part of the material
   TLMaterial matMod = tlMat;
   matMod.ambient = matMod.ambient*_modColor;
   matMod.diffuse = matMod.diffuse*_modColor;
   matMod.forcedDiffuse = matMod.forcedDiffuse*_modColor;
   matMod.emmisive = matMod.emmisive*_modColor;
   matMod.specular = matMod.specular*_modColor;
diff --git antes/lib/object.cpp depois/lib/object.cpp
index 027bd05..879c403 100644
--- antes/lib/object.cpp
+++ depois/lib/object.cpp
@@ -2095,16 +2095,23 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
     if (GetOwnHeatSource(newHeatSource))
     {
       dpTI._heatSourceDirection = newHeatSource;
       dpTI._useOwnHeatSource = true;
     }
 
     LightList work;
     const LightList *lights;
+    if (dp._zprimeIsBeingRendered)
+    {
+      // Depth priming uses PSAlphaOnly shaders, object lighting is not consumed.
+      // Skip the light grid lookup and the per-object light constant setup.
+      lights = &work;
+    }
+    else
     {
       PROFILE_SCOPE_DETAIL_EX(obLit,oSort);
       lights = &GScene->SelectAggLights(worldPosition, this, forceLOD, work);
     }
     
     OBJECT_LEVEL_DPRIM_STAT_SCOPE(cb,_shape,forceLOD);
     ADD_COUNTER(obj,1);
 
@@ -2131,17 +2138,19 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
     // if necessary, split it
     if (!(sShape->Special()&OnSurface) || (sShape->GetAndHints()&ClipLandMask)!=ClipLandOn)
     {
       // make sure texture loading does not evict our vertex buffer (if it exists)
       VertexBufferLock vbLock(sShape);
       
       {
         PROFILE_SCOPE_DETAIL_EX(obTex,oSort);
-        PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+        // Depth priming renders with PSAlphaOnly shaders - only the base texture
+        // (alpha test source) is needed there, material stages are not consumed.
+        PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered || dp._zprimeIsBeingRendered);
       }
       
       _shape->OptimizeLevelRendering(forceLOD,false);
       // Preparing of drawing of the shape
 #if _HELISIM_RENDER_TO_TEXTURE
       UseDrawMatrices(cb, isSkinned, _shape, forceLOD, oi, drawListId);
 #else
       UseDrawMatrices(cb, isSkinned, _shape, forceLOD, oi);
@@ -2180,17 +2189,19 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
     }
     else
     {
       // when rendering shadow buffer, rendering what is on surface has no sense
       if (!dp._sbIsBeingRendered)
       {
         {
           PROFILE_SCOPE_DETAIL_EX(obTex,oSort);
-          PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+          // Depth priming renders with PSAlphaOnly shaders - only the base texture
+          // (alpha test source) is needed there, material stages are not consumed.
+          PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered || dp._zprimeIsBeingRendered);
         }
 
 #if _HELISIM_RENDER_TO_TEXTURE
         UseDrawMatrices(cb, false, _shape, forceLOD, oi, drawListId);
 #else
         UseDrawMatrices(cb, false, _shape, forceLOD, oi);
 #endif
```

## B — removal of the RMZPrime pass

**Build:** `DayZ045-fps-noprime-retail-20261117` · Retail/Win32

**Files:** `lib/engine.hpp`, `lib/landscape.cpp`, `lib/world.cpp`, `lib/d3d9/engdd9.cpp`, `lib/d3d9/engdd9.hpp`

`RMZPrime` resubmitted the same nearby objects only to fill the main depth; the color pass then used `ZFUNC EQUAL`. The cut removes that whole submission.

- `Engine` gained `ZPrimed()`/`SetMainDepthPrimed`; `EngineDD9` stores `_mainDepthPrimed` instead of returning a fixed `true`.
- `Landscape::PrimeDepthBuffer` marks whether the main depth was primed.
- `World::Simulate` and `World::DrawSceneR2T` stop calling the separate z-only pass.
- `EngineDD9::InitDraw` clears Z/stencil when the depth was not primed; without that the frame would test against the previous depth.

**Note:** with `FSAA=0` the `RMZPrime` no longer ran, so B is a no-op in the real test configuration. It entered because F was compiled on top of A+B.

**Full patch:** [download `B-rmzprime-removal.diff`](/fps-diffs/B-rmzprime-removal.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 09be324..78b7ba4 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -3428,16 +3428,25 @@ void EngineDD9::InitDraw( bool clear, Color color )
   // one particular situation where this is important is map, without this it will not start HL recording
   StartBackgroundScope();
   
   D3DRECT rect;
   rect.x1=0,rect.y1=0;
   rect.x2=_w,rect.y2=_h;
   int flags=0;
 
+  // When the z-only priming pass is skipped (FSAA with RMZPrime removed), the
+  // main depth buffer was not cleared by any priming pass. Clear it here so the
+  // scene pass tests against fresh depth instead of last frame's values.
+  if (!_mainDepthPrimed)
+  {
+    flags |= D3DCLEAR_ZBUFFER;
+    if (_caps._hasStencilBuffer) flags|=D3DCLEAR_STENCIL;
+  }
+
   // TODO: unify for FSAA as well
 //   if (GetFSAA()>0)
 //   {
 //     flags |= D3DCLEAR_ZBUFFER;
 //     if (_caps._hasStencilBuffer) flags|=D3DCLEAR_STENCIL;
 //   }
   // sometimes we want to keep the old backbuffer content
   if( clear ) flags|=D3DCLEAR_TARGET;
@@ -27349,16 +27358,17 @@ BIND_SHADER(POOL,[VSPNormalMap][0][1][RMCommon][SIInst],[VD_Position_Normal_Tex0
   // Skinning parameters
   cbState._skinningType = STNone;
   cbState._bones.Clear();
   cbState._bonesWereSetDirectly = false;
 
   // Instancing parameters
   cbState._zPrimingDone = false;
   cbState._lastZPrimingDone = false;
+  _mainDepthPrimed = false;
 
   // Shadow buffer parameters
   _renderingMode = RMCommon;
   for (int i = 0; i < ShadowBufferCascadeLayers; i++)
   {
     _oldLRSP[i] = MIdentity;
   }
 
diff --git antes/lib/d3d9/engdd9.hpp depois/lib/d3d9/engdd9.hpp
index dab2b5c..1219a5a 100644
--- antes/lib/d3d9/engdd9.hpp
+++ depois/lib/d3d9/engdd9.hpp
@@ -2936,16 +2936,18 @@ protected:
     AToC_EnableAll = 7
   };
   /// which AToC mode is supported by the HW
   AToCMode _aToCSupported;
   
   /// should we use AToC?
   bool _useAToC;
   int _AToCMask;
+  /// main scene depth buffer was primed this frame (z-only priming pass)
+  bool _mainDepthPrimed;
   //@}
 
   // enable / disable vertical synchronization, default set to enable
   bool _vsync;
   //@{ anisotropy filtering settings
   int _afWanted;
   /// max. level allowed by the HW (typicaly 1..16)
   int _maxAFLevel;
@@ -5086,21 +5088,23 @@ public:
   bool GetVBuffersStatic() const {return _caps._vbuffersStatic;}
 
   bool UseLocalPrediction() const {return _caps._localPrediction;}
 
   virtual void SetFSAA(int quality);
   virtual int GetFSAA() const;
   virtual int GetMaxFSAA() const;
   
-  bool ZPrimed() const
+  virtual bool ZPrimed() const
   {
-      // on PC we currently do not prime z buffer when using MSAA
-      return true;
+      // main depth is primed only when the separate z-only pass has run
+      return _mainDepthPrimed;
   }
+  /// set when the z-only priming pass has filled the main depth buffer
+  virtual void SetMainDepthPrimed(bool val) {_mainDepthPrimed = val;}
 
   //@{ only set values, do not apply it yet
   bool SetFSAAWanted(int quality);
   bool SetHDRPrecisionWanted(HDRPrec prec);
   bool SetResolutionWanted(int w, int h, int bpp);
   bool SetPostprocessEffectsWanted(int quality);
   bool SetFillrateLevelWanted(int level);
   bool SetFillrateControlWanted(ResolutionInfo info);
diff --git antes/lib/engine.hpp depois/lib/engine.hpp
index 5e4ac0c..959f33b 100644
--- antes/lib/engine.hpp
+++ depois/lib/engine.hpp
@@ -1575,16 +1575,20 @@ public:
 
   //@{ user settings - FSAA
   virtual void SetFSAA(int quality) {}
   virtual int GetFSAA() const {return 0;}
   /// max. FSAA mode supported (0=none)
   virtual int GetMaxFSAA() const {return 0;}
   //@}
 
+  /// true when the main depth buffer was primed this frame
+  virtual bool ZPrimed() const {return true;}
+  virtual void SetMainDepthPrimed(bool val) {}
+
   //@{ user settings - AToC
   virtual void SetAToC(int level) {}
   virtual int GetAToC() const { return 0; }
   //@}
 
   //@{ user settings - PPAA
   virtual void SetPPAA(int ppaa, int level) {}
   virtual int GetPPAA(int &level) const {return 0;}
diff --git antes/lib/landscape.cpp depois/lib/landscape.cpp
index 0ec4fa8..d909861 100644
--- antes/lib/landscape.cpp
+++ depois/lib/landscape.cpp
@@ -5995,16 +5995,20 @@ void Landscape::PrimeDepthBuffer(GridRectangle &groundPrimed, Scene &scene, Scen
     scene.DrawDepthPrime(drawContext, svShadows, pass, drawListId);
 #else
     scene.DrawDepthPrime(drawContext, svShadows, pass);
 #endif
 
     GEngine->SetZPrimingDone(-1,false);
     // End depth rendering
     GEngine->EndDepthMapRendering(zOnly);
+    // Main depth buffer is primed only by the z-only pass (or by the shared
+    // depth buffer when FSAA is off). The main scene pass uses ZFUNC EQUAL
+    // and skips alpha test only when this is true.
+    GEngine->SetMainDepthPrimed(zOnly || GEngine->GetFSAA()==0);
 
     //GEngine->RenderStencilShadows();
   }
   if (LogStatesOnce) LogF(") DrawDepthPrime");
 }
 
 void Landscape::DrawRectPrepare(Scene::DrawContext &drawContext, Scene &scene, float deltaT, bool frameRepeated)
 {
diff --git antes/lib/world.cpp depois/lib/world.cpp
index a115cae..d4ff517 100644
--- antes/lib/world.cpp
+++ depois/lib/world.cpp
@@ -10505,22 +10505,23 @@ void World::DrawSceneR2T(Entity *camInVehicle, bool frameRepeated, float deltaT)
     _scene.GetLandscape()->DrawRectPrepare(drawContext, _scene, deltaT, frameRepeated);
 
     // render the depth buffer (may perform priming as well, unless separate priming is required)
     _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, false, frameRepeated, 
       drawState._drawObjId, true /*debugMe*/);
 
     // Render the shadow buffer
      _scene.GetLandscape()->DrawRectShadowBuffer(drawContext, _scene);
-    if (GEngine->GetFSAA()>0)
-    {
-      // PC with FSAA required separate depth priming
-      _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, true, frameRepeated, 
-        drawState._drawObjId);
-    }
+    // FPS experiment: separate z-only priming (RMZPrime) removed, see World::Simulate
+    // if (GEngine->GetFSAA()>0)
+    // {
+    //   // PC with FSAA required separate depth priming
+    //   _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, true, frameRepeated,
+    //     drawState._drawObjId);
+    // }
 
     // need to be called several times during the frame
     GetNetworkManager().FastUpdate();
 
     Assert(_scene.GetDrawObjectIndex() == drawState._drawObjId);
     GEngine->SetR2TRenderTargets();
 
     _scene.BeginObjects();
@@ -12881,25 +12882,25 @@ if (_playerOn)
       _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, false, frameRepeated 
 #if _HELISIM_RENDER_TO_TEXTURE 
         , 0
 #endif
         , true /*debugMe*/);
 
       // Render the shadow buffer
       _scene.GetLandscape()->DrawRectShadowBuffer(drawContext, _scene);
-      if (GEngine->GetFSAA()>0)
-      {
-        // PC with FSAA required separate depth priming
-        _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, true, frameRepeated
-#if _HELISIM_RENDER_TO_TEXTURE
-          , 0
-#endif
-          );
-      }
+      // FPS experiment: the separate z-only pass (RMZPrime) is redundant - it
+      // re-submits every near object only to prime the main depth buffer. The
+      // main pass now writes depth normally (see EngineDD9::ZPrimed). The SSSM
+      // depth map above is still produced by the RMDPrime pass.
+      // _scene.GetLandscape()->PrimeDepthBuffer(groundPrimed, _scene, drawContext, true, frameRepeated
+      // #if _HELISIM_RENDER_TO_TEXTURE
+      //   , 0
+      // #endif
+      //   );
     }
     else
     {
       // even when not rendering keep camera position ready (used for ambient life, sounds, and also reported to the server in MP)
       SelectCameraPosition(GEngine, deltaT);
     }
 
     {
```

## C — no GetLandShadowSmooth per instance in the depth pass

**Build:** `DayZ045-fps-noprime-noshadowcoef-retail-20261117` · Retail/Win32

**Files:** `lib/scene.cpp`

`Scene::DrawObjectsInstanced` computed `GetLandShadowSmooth` for each instance in all passes. In the `RMDPrime`/`RMZPrime` passes the shader is `PSAlphaOnly` and does not read `to.instanceShadow`; the work was discarded.

The cut writes `1.0f` in those passes and keeps the real value in the color pass (`dp._zprimeIsBeingRendered == false`).

**Full patch:** [download `C-prime-shadowcoef.diff`](/fps-diffs/C-prime-shadowcoef.diff)

```diff
diff --git antes/lib/scene.cpp depois/lib/scene.cpp
index 414b648..38781a6 100644
--- antes/lib/scene.cpp
+++ depois/lib/scene.cpp
@@ -6102,16 +6102,19 @@ void Scene::DrawObjectsInstanced(
 #if _HELISIM_RENDER_TO_TEXTURE
   , int drawListId
 #endif
 )
 {  
   const int maxInstancingChain = 512;
   // if instance count is very large, it would cause memory allocation
   // we rather to split it into several chains on the top level instead
+  // Priming passes use PSAlphaOnly shaders, which do not consume the per-instance
+  // landscape shadow coefficient. GetLandShadowSmooth samples the land shadow map
+  // (and may call Landscape::SurfaceY) for every instance, so skip it there.
   
   while (instancesBeg<=instancesEnd)
   {
     // count instances including chains passed to us from the object lists
     int instCount = 0;
     int iiEnd;
     for (iiEnd=instancesBeg; iiEnd<=instancesEnd; iiEnd++)
     {
@@ -6153,17 +6156,17 @@ void Scene::DrawObjectsInstanced(
             Object *obj = list->Get(li);
 
             if (color>0)
             {
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
               info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
-              info._shadowCoef = GetLandShadowSmooth(info._origin.Position());
+              info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
         }
 				//do the last one
 				{
 					if (iObj->IsVisible(li))
@@ -6171,17 +6174,17 @@ void Scene::DrawObjectsInstanced(
             Object *obj = list->Get(li);
             if (color>0)
             {
 
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
               info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
-              info._shadowCoef = GetLandShadowSmooth(info._origin.Position());
+              info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
         }
         if (updateBF) iObj->UpdateBlendFactor();
         // assume scale is around 1, therefore the same for all objects here
         if (minDist2>iObj->distance2) // TODO: this should perhaps be done inside in the loop - or can distance2 be assumed to be known for all at once?
@@ -6194,17 +6197,17 @@ void Scene::DrawObjectsInstanced(
       {
         if (color>0)
         {
         ObjectInstanceInfo &info = instances[tgt++];
         info._origin = iObj->position.position;
           info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
           info._color = Color(1,1,1,color);
         Assert(!iObj->position.camSpace);
-          info._shadowCoef = GetLandShadowSmooth(info._origin.Position());
+          info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
         info._object = info._parentObject = iObj->GetObject();
         info._limitSpriteSize = iObj->limitSpriteSize;
         }
         float scale2 = Square(iObj->GetObject()->RenderVisualState().Scale());
         if (minDist2*scale2>iObj->distance2)
         {
           minDist2 = iObj->distance2/scale2;
         }
```

## D — depth pass without light grid per instance

**Build:** `DayZ045-fps-primelightlean-retail-20261117` · Retail/Win32

**Files:** `lib/scene.cpp`

In the depth pass, `GetLightGridIndex` was called for each instance and the chain was sorted/grouped by light. The pass does not consume light; the index only served to sort and group.

The cut writes `-1` in the index and makes the depth pass enter the single-draw branch, without `QSort` and without splitting the chain into light groups. The color pass keeps the normal behavior.

**Full patch:** [download `D-prime-lightgrid.diff`](/fps-diffs/D-prime-lightgrid.diff)

```diff
diff --git antes/lib/scene.cpp depois/lib/scene.cpp
index 38781a6..0e8cdce 100644
--- antes/lib/scene.cpp
+++ depois/lib/scene.cpp
@@ -6154,17 +6154,17 @@ void Scene::DrawObjectsInstanced(
 					if (iObj->IsVisible(li))
 					{
             Object *obj = list->Get(li);
 
             if (color>0)
             {
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
-              info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
+              info._lightGridIndex = (!dp._zprimeIsBeingRendered && _gridLights.Size()) ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
               info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
         }
 				//do the last one
@@ -6172,17 +6172,17 @@ void Scene::DrawObjectsInstanced(
 					if (iObj->IsVisible(li))
 					{
             Object *obj = list->Get(li);
             if (color>0)
             {
 
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
-              info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
+              info._lightGridIndex = (!dp._zprimeIsBeingRendered && _gridLights.Size()) ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
               info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
         }
         if (updateBF) iObj->UpdateBlendFactor();
@@ -6194,17 +6194,17 @@ void Scene::DrawObjectsInstanced(
         if (iObj->coveredArea>maxCoveredArea) maxCoveredArea = iObj->coveredArea;
       }
       else
       {
         if (color>0)
         {
         ObjectInstanceInfo &info = instances[tgt++];
         info._origin = iObj->position.position;
-          info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
+          info._lightGridIndex = (!dp._zprimeIsBeingRendered && _gridLights.Size()) ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
           info._color = Color(1,1,1,color);
         Assert(!iObj->position.camSpace);
           info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
         info._object = info._parentObject = iObj->GetObject();
         info._limitSpriteSize = iObj->limitSpriteSize;
         }
         float scale2 = Square(iObj->GetObject()->RenderVisualState().Scale());
         if (minDist2*scale2>iObj->distance2)
@@ -6254,18 +6254,22 @@ void Scene::DrawObjectsInstanced(
 
     // The level is instance-able - already verified, and no GC was performed in between
     // TODO:MC: removed ShapeUsed from LevelUsesVBuffer
     DoAssert(obj->CanBeInstanced(level, oiBeg->distance2, dp));
     // airborne objects need special light selection and therefore cannot be instanced
     Assert(!obj->Airborne());
 
     // In case there is a day here (or zero lights) then draw it without worrying,
-    // else draw it split into groups
-    if (_gridLights.Size() == 0 /*(NLights()==0 || MainLight()->NightEffect()<0.01)*/)
+    // else draw it split into groups.
+    // Depth priming renders with PSAlphaOnly shaders, which do not consume any
+    // light. Sorting the whole chain by light grid and splitting it into groups
+    // would only add O(n log n) work and extra draws with identical depth output,
+    // so the chain is drawn in a single call with an empty light list there.
+    if (dp._zprimeIsBeingRendered || _gridLights.Size() == 0 /*(NLights()==0 || MainLight()->NightEffect()<0.01)*/)
     {
       // Draw the instances
       LightList empty;
       obj->DrawSimpleInstanced(
         cb, level, ClipAll, dp, instances.Data(), instances.Size(), minDist2, empty, oiBeg, maxCoveredArea
 #if _HELISIM_RENDER_TO_TEXTURE
         , drawListId
 #endif
```

## E — section preparation 1x per run in software instancing

**Build:** `DayZ045-fps-colorinstance-retail-20261117` · Retail/Win32

**Files:** `lib/engine.hpp`, `lib/engineDraw.cpp`, `lib/d3d9/engdd9.cpp`, `lib/d3d9/engdd9.hpp`

In the `nInstances>1` path of `Engine::DrawMeshTLInstanced`, each instance redid the full `PrepareTL` (`LoadTextureMipmaps`, `PolyProperties::Combine`, texture/sampler/render states/pixel shader and `DoSetMaterial`) for each section run. That state depends only on the section.

The cut prepares once per run and, for each instance, reapplies only `ApplyMaterialTL` + `DrawSectionTL`. `ApplyMaterialTL` is the only instance-dependent part, because the light direction is transformed to object space via `cbState._world`.

The order `BeginInstanceTL`/`BeginMeshTL` of instance 0 before `PrepareTL` is mandatory: `BeginInstanceTL` chooses the pixel shader and `BeginMeshTL` records the UV scale/offset used by texgen.

**Full patch:** [download `E-color-instancing-material.diff`](/fps-diffs/E-color-instancing-material.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 78b7ba4..5f015c6 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -15690,16 +15690,38 @@ void EngineDD9::PrepareTriangleTL(
   matMod.forcedDiffuse = matMod.forcedDiffuse*_modColor;
   matMod.emmisive = matMod.emmisive*_modColor;
   matMod.specular = matMod.specular*_modColor;
 
   // Set the material and combine material and main light color
   DoSetMaterial(cb, matMod);
 }
 
+void EngineDD9::ApplyMaterialTL(int cb, const TLMaterial &tlMat)
+{
+  // Depth priming renders with PSAlphaOnly shaders and never writes color.
+  // Material and light constants are not consumed in this pass - keep the
+  // same early return as PrepareTriangleTL.
+  if (_renderingMode==RMDPrime || _renderingMode==RMZPrime) return;
+
+  // make color information from the texture
+  // to be a part of the material
+  TLMaterial matMod = tlMat;
+  matMod.ambient = matMod.ambient*_modColor;
+  matMod.diffuse = matMod.diffuse*_modColor;
+  matMod.forcedDiffuse = matMod.forcedDiffuse*_modColor;
+  matMod.emmisive = matMod.emmisive*_modColor;
+  matMod.specular = matMod.specular*_modColor;
+
+  // Set the material and combine material and main light color.
+  // This is the only instance-dependent part of PrepareTriangleTL: the light
+  // direction is transformed to object space using the current world matrix.
+  DoSetMaterial(cb, matMod);
+}
+
 void EngineDD9::DrawDecal(
   int cb, Vector3Par screen, float rhw, float sizeX, float sizeY, PackedColor color,
   const MipInfo &mip, const TexMaterial *mat, int specFlags
 )
 {
   if (_backgroundD3D!=RecHighLevel)
   {
     DoDrawDecal(cb,screen,rhw,sizeX,sizeY,color,mip,mat,specFlags);
diff --git antes/lib/d3d9/engdd9.hpp depois/lib/d3d9/engdd9.hpp
index 1219a5a..fe8a741 100644
--- antes/lib/d3d9/engdd9.hpp
+++ depois/lib/d3d9/engdd9.hpp
@@ -5736,16 +5736,24 @@ protected: // D3D helpers
   
   void PrepareTriangle( int cb, const MipInfo &absMip, const TexMaterial *mat, int specFlags );
   virtual void PrepareTriangleTL(
     int cb, const PolyProperties *section,
     const MipInfo &mip, const TexMaterialLODInfo &mat, int specFlags,
     const TLMaterial &tlMat, int spec, const EngineShapeProperties &prop
     );
 
+  //! Re-apply only the material/light constants of an already prepared section.
+  /*!
+  Used by instanced drawing: the section state (textures, shaders, render states)
+  is prepared once per section run, while the material constants must be
+  recomputed for every instance (they depend on the object-space transform).
+  */
+  virtual void ApplyMaterialTL(int cb, const TLMaterial &tlMat);
+
   void DrawPolygon(const VertexIndex *ii, int n);
   void DrawSection(const FaceArray &face, Offset beg, Offset end);
 
 
   // integrated transform&lighting
   bool GetTL() const {return true;}
   bool HasWBuffer() const {return false;}
   //bool HasWBuffer() const {return false;}
diff --git antes/lib/engine.hpp depois/lib/engine.hpp
index 959f33b..31eef04 100644
--- antes/lib/engine.hpp
+++ depois/lib/engine.hpp
@@ -1654,16 +1654,24 @@ public:
 #endif
   virtual void PrepareTriangleTL(
     int cb, const PolyProperties *section,
     const MipInfo &mip, const TexMaterialLODInfo &mat, int specFlags,
     const TLMaterial &tlMat,
     int spec, const EngineShapeProperties &prop
   ) {}
 
+  //! Re-apply only the material/light constants of an already prepared section.
+  /*!
+  Used by instanced drawing: the section state (textures, shaders, render states)
+  is prepared once per section run, while the material constants must be
+  recomputed for every instance (they depend on the object-space transform).
+  */
+  virtual void ApplyMaterialTL(int cb, const TLMaterial &tlMat) {}
+
   virtual void PrepareTriangle( int cb, const MipInfo &mip, const TexMaterial *mat, int specFlags )= 0;
   virtual void DrawPolygon( const VertexIndex *i, int n )= 0;
   virtual void DrawSection(const FaceArray &face, Offset beg, Offset end)= 0;
 
   virtual void FlushQueues() {}
 
   // integrated transform&lighting
   virtual bool GetTL() const {return false;}
diff --git antes/lib/engineDraw.cpp depois/lib/engineDraw.cpp
index 49d8196..f0805f7 100644
--- antes/lib/engineDraw.cpp
+++ depois/lib/engineDraw.cpp
@@ -1431,16 +1431,62 @@ void Engine::DrawMeshTLInstanced(
     {
       runSecBeg.Append() = secBeg;
       runSecEnd.Append() = secEnd;
       // The original final flush recalculates bias from the run's first section.
       runBias.Append() = firstBias;
     }
   }
 
+  if (nInstances>1 && runSecBeg.Size()>0)
+  {
+    // The section state prepared by PrepareTL (texture, sampler, pixel shader,
+    // render states, material) depends only on the section run, not on the
+    // instance. Prepare it once per run and re-apply only the instance-dependent
+    // material/light constants for every instance.
+    //
+    // Establish the state of instance 0 first: BeginInstanceTL selects the pixel
+    // shader type, BeginMeshTL sets the UV scale/offset used by the texgen matrix
+    // inside PrepareTL.
+    {
+      const ObjectInstanceInfo &info0 = instances[0];
+      SetInstanceInfo(cb, info0._color, info0._shadowCoef);
+      BeginInstanceTL(cb, info0._origin, minDist2, spec, lights, dp);
+      if (!BeginMeshTL(cb, NULL, sMesh, prop, spec, lights, bias))
+      {
+        SetInstanceInfo(cb,HWhite,1);
+        return;
+      }
+    }
+
+    for (int r=0; r<runSecBeg.Size(); r++)
+    {
+      TLMaterial mat;
+      CreateMaterial(mat, HWhite);
+      sMesh.GetSection(runSecBeg[r]).PrepareTL(cb,mat, spec, prop);
+
+      for (int j=0; j<nInstances; j++)
+      {
+        const ObjectInstanceInfo &info = instances[j];
+        SetInstanceInfo(cb, info._color, info._shadowCoef);
+
+        BeginInstanceTL(cb, info._origin, minDist2, spec, lights, dp);
+        bool ok = BeginMeshTL(cb, NULL, sMesh, prop, spec, lights, bias);
+        if (ok)
+        {
+          ApplyMaterialTL(cb, mat);
+          DrawSectionTL(cb,sMesh, runSecBeg[r], runSecEnd[r], runBias[r]);
+          EndMeshTL(cb,sMesh);
+        }
+      }
+    }
+    SetInstanceInfo(cb,HWhite,1);
+    return;
+  }
+
   // Go through the instances
   for (int j = 0; j < nInstances; j++)
   {
     //SCOPE_GRF("inst",0);
     PROFILE_SCOPE_GRF_EX(inst,drw,SCOPE_COLOR_RED);
     // check if shape is dynamic or not
     const ObjectInstanceInfo &info = instances[j];
```

## F — no object submission in the depth prepass with FSAA=0

**Build:** `DayZ045-fps-noprimeobjects-release-20261117` · Release/Win32

**Files:** `lib/scene.cpp`, `lib/scene.hpp`, `lib/landscape.cpp`

With `FSAA=0`, `World::Simulate` calls `PrimeDepthBuffer(..., zOnly=false, ...)`. The pass submitted the `_drawPass1ON._original`, `_drawPass1ON._blending` and `_drawPass1AN` lists in `RMDPrime` and then `SetMainDepthPrimed(true)` made the color pass reuse the recorded commands.

The cut adds `bool drawObjects` to `Scene::DrawDepthPrime`. In `Landscape::PrimeDepthBuffer`, `primeObjects = zOnly || GEngine->GetFSAA()!=0`. With `FSAA=0` and `zOnly=false`, objects are not submitted in the prepass and `SetMainDepthPrimed` stays `false`; the color pass returns to `ZFUNC LESSEQUAL` + `ZWRITE TRUE`.

**Result:** FPS rose, but the scene broke (invisible character, houses/trees vanish on approach, grass flickers). The gain is invalid. The cause and the fix are in F2.

**F Retail:** the same cut was also compiled in Retail (`DayZ045-fps-noprimeobjects-retail-20261117`, `DayZ.exe` SHA-256 `CA4F03D7A5C1E8A4C575C5D5BD1C95841B63D87B091191D8EB9E6F276A4FB329`), but it could not be tested with the V38 package because Retail rejects unsigned PBOs. The real test was the Release.

**Full patch:** [download `F-no-prime-objects.diff`](/fps-diffs/F-no-prime-objects.diff)

```diff
diff --git antes/lib/landscape.cpp depois/lib/landscape.cpp
index d909861..4857100 100644
--- antes/lib/landscape.cpp
+++ depois/lib/landscape.cpp
@@ -5986,29 +5986,33 @@ void Landscape::PrimeDepthBuffer(GridRectangle &groundPrimed, Scene &scene, Scen
         if (PredicateGrass) GEngine->EndCBPredicatedScope(drawContext._lDGCl);
       }
     }
 
     //if (debugMe) GEngine->TrapFor0x8000("Landscape.PrimeDepthBuffer B");
 
     // Draw objects designed for depth rendering
     bool svShadows = GEngine->GetFSAA()>0 ? !zOnly : true;
+    // With FSAA off the main depth buffer is shared, so the color pass can
+    // write depth normally. Submitting every object again here would only
+    // duplicate the per-object preparation (materials, sections, draw calls).
+    const bool primeObjects = zOnly || GEngine->GetFSAA()!=0;
 #if _HELISIM_RENDER_TO_TEXTURE
-    scene.DrawDepthPrime(drawContext, svShadows, pass, drawListId);
+    scene.DrawDepthPrime(drawContext, svShadows, pass, primeObjects, drawListId);
 #else
-    scene.DrawDepthPrime(drawContext, svShadows, pass);
+    scene.DrawDepthPrime(drawContext, svShadows, pass, primeObjects);
 #endif
 
     GEngine->SetZPrimingDone(-1,false);
     // End depth rendering
     GEngine->EndDepthMapRendering(zOnly);
     // Main depth buffer is primed only by the z-only pass (or by the shared
-    // depth buffer when FSAA is off). The main scene pass uses ZFUNC EQUAL
-    // and skips alpha test only when this is true.
-    GEngine->SetMainDepthPrimed(zOnly || GEngine->GetFSAA()==0);
+    // depth buffer when FSAA is off and the objects were primed here). The
+    // main scene pass uses ZFUNC EQUAL and skips alpha test only when this is true.
+    GEngine->SetMainDepthPrimed(primeObjects && (zOnly || GEngine->GetFSAA()==0));
 
     //GEngine->RenderStencilShadows();
   }
   if (LogStatesOnce) LogF(") DrawDepthPrime");
 }
 
 void Landscape::DrawRectPrepare(Scene::DrawContext &drawContext, Scene &scene, float deltaT, bool frameRepeated)
 {
diff --git antes/lib/scene.cpp depois/lib/scene.cpp
index 0e8cdce..aba2d98 100644
--- antes/lib/scene.cpp
+++ depois/lib/scene.cpp
@@ -11011,39 +11011,44 @@ void Scene::DrawPass4(DrawContext &ctx)
 #if _HELISIM_RENDER_TO_TEXTURE
     , _drawObjectsId
 #endif
     );
 
   GEngine->SetZPrimingDone(-1,false);
 }
 
-void Scene::DrawDepthPrime(DrawContext &ctx, bool useSVShadows, Engine::PredicationMode pass
+void Scene::DrawDepthPrime(DrawContext &ctx, bool useSVShadows, Engine::PredicationMode pass, bool drawObjects
 #if _HELISIM_RENDER_TO_TEXTURE
                            , int drawListId
 #endif
                            )
 {
   if (!GEngine->IsAbleToDrawCheckOnly()) return;
   PROFILE_SCOPE_EX(oPasD,*);
 
   // Draw the usual depth objects, near first
-  
-  if (GEngine->StartCBPredicatedScope(ctx._oPasO,pass))
+  // When the main depth buffer is not shared this pass is required. When it
+  // is shared (FSAA off) the color pass writes depth itself, so submitting
+  // every object here would only duplicate the whole per-object preparation.
+  if (drawObjects)
   {
-    DrawPass1Part(ctx,ctx._drawPass1ON._original,pass);
-    DrawPass1Part(ctx,ctx._drawPass1ON._blending,pass);
-    GEngine->EndCBPredicatedScope(ctx._oPasO);
-  }
+    if (GEngine->StartCBPredicatedScope(ctx._oPasO,pass))
+    {
+      DrawPass1Part(ctx,ctx._drawPass1ON._original,pass);
+      DrawPass1Part(ctx,ctx._drawPass1ON._blending,pass);
+      GEngine->EndCBPredicatedScope(ctx._oPasO);
+    }
 
-  // We need to perform depth priming even for partially alpha transparent objects (in order the SSSM to work correctly)
-  if (GEngine->StartCBPredicatedScope(ctx._oPasA,pass))
-  {
-    DrawPass1Part(ctx,ctx._drawPass1AN,pass);
-    GEngine->EndCBPredicatedScope(ctx._oPasA);
+    // We need to perform depth priming even for partially alpha transparent objects (in order the SSSM to work correctly)
+    if (GEngine->StartCBPredicatedScope(ctx._oPasA,pass))
+    {
+      DrawPass1Part(ctx,ctx._drawPass1AN,pass);
+      GEngine->EndCBPredicatedScope(ctx._oPasA);
+    }
   }
   
   // Draw volume shadows prior the pass3 (as the z-buffer can't be used for depth determination after that)
   if (useSVShadows)
   {
 #if _HELISIM_RENDER_TO_TEXTURE
     DrawVolShadows(ctx, drawListId);
 #else
diff --git antes/lib/scene.hpp depois/lib/scene.hpp
index 2dc5103..55299aa 100644
--- antes/lib/scene.hpp
+++ depois/lib/scene.hpp
@@ -1102,17 +1102,17 @@ public:
     );
   /// render pass 2 - alpha blended objects
   void DrawPass2(DrawContext &ctx);
   /// render pass 3 - cockpit/1st person
   void DrawPass3(DrawContext &ctx);
   /// render pass 4 - UI
   void DrawPass4(DrawContext &ctx);
   //! Drawing of objects - depth buffer priming
-  void DrawDepthPrime(DrawContext &ctx, bool useSVShadows, Engine::PredicationMode pass
+  void DrawDepthPrime(DrawContext &ctx, bool useSVShadows, Engine::PredicationMode pass, bool drawObjects
 #if _HELISIM_RENDER_TO_TEXTURE
     , int drawListId
 #endif
     );
   /// finish object drawing
   void ObjectsDrawn(DrawContext &ctx
 #if _HELISIM_RENDER_TO_TEXTURE
     , int drawListId
```

## F2 — never-recorded command buffer scope returns false

**Build:** `DayZ045-fps-noprimeobjects-release-f2-20261118` · Release/Win32

**Files:** `lib/d3d9/engdd9.cpp`, `lib/scene.cpp`

F skipped `StartCBPredicatedScope`/`EndCBPredicatedScope` of the `_oPasO` scope when `drawObjects=false`. The scope was never recorded (`beg=-1`, `end=-1`). In the color pass, `EngineDD9::CopyCBPredicatedScope` tested `scope.end<=scope.beg`, classified the scope as empty and returned `true`; the color pass then skipped `DrawPass1Part` and the `_drawPass1ON` list (character, nearby houses and trees) was not drawn. The `Assert(scope.beg>=0)` disappears in Release.

F2 returns `false` when `scope.beg < 0`. The color pass falls into the direct path and draws the lists with `ZFUNC LESSEQUAL` + `ZWRITE TRUE`. The comment in `Scene::DrawDepthPrime` records the dependency.

**Test result (18/11/2026):** character and houses/trees fixed, but **grass appears only now and then, in patches**, and **the character's shadow appears on his back**; **FPS stayed low**. F2 is a **partial** visual fix and **is not a performance gain**. The F/F2 line is closed; the next test is A+B+C+D+E in Release.

**Full patch:** [download `F2-cb-scope-guard.diff`](/fps-diffs/F2-cb-scope-guard.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 5f015c6..3cb7c88 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -29241,16 +29241,21 @@ void EngineDD9::FlushBackground(WorkerThreadClass &bg, bool flushMem, const char
   WorkerThreadClass::CBType::OnFlush();
   
 }
 
 bool EngineDD9::CopyCBPredicatedScope(PredicatedCBScope &scope, PredicationMode pred)
 {
   LOG_MEM("CopyCBPredicatedScope %d..%d (%d)",scope.beg,scope.end,IsAbleToDrawCheckOnly());
   if (!UsePredication()) return false;
+  // A never-recorded scope is not the same as an empty recorded scope. Return
+  // false so the caller renders its list directly; this is required when the
+  // depth prepass skips object submission (FSAA=0, see Landscape::PrimeDepthBuffer)
+  // and the color pass still has to draw those objects.
+  if (scope.beg < 0) return false;
   Assert(scope.beg>=0); // the scope may be empty, but it needs to be recorded
   // if the scope is empty, we do not have to do anything, but we return true to avoid overhead of the default solution
   if (scope.end<=scope.beg)
   {
     scope.finalCopy = !_bgRecPredication; // see MarkNoDestroy below
     return true;
   }
   Assert(_backgroundD3D!=RecHighLevel);
diff --git antes/lib/scene.cpp depois/lib/scene.cpp
index aba2d98..5587df5 100644
--- antes/lib/scene.cpp
+++ depois/lib/scene.cpp
@@ -11024,16 +11024,18 @@ void Scene::DrawDepthPrime(DrawContext &ctx, bool useSVShadows, Engine::Predicat
 {
   if (!GEngine->IsAbleToDrawCheckOnly()) return;
   PROFILE_SCOPE_EX(oPasD,*);
 
   // Draw the usual depth objects, near first
   // When the main depth buffer is not shared this pass is required. When it
   // is shared (FSAA off) the color pass writes depth itself, so submitting
   // every object here would only duplicate the whole per-object preparation.
+  // If we skip this, the scopes stay unrecorded and CopyCBPredicatedScope
+  // returns false (beg < 0), making the color pass draw the lists directly.
   if (drawObjects)
   {
     if (GEngine->StartCBPredicatedScope(ctx._oPasO,pass))
     {
       DrawPass1Part(ctx,ctx._drawPass1ON._original,pass);
       DrawPass1Part(ctx,ctx._drawPass1ON._blending,pass);
       GEngine->EndCBPredicatedScope(ctx._oPasO);
     }
```

# Earlier work (already in the tree before A)

The patches below are experiments and fixes that came before candidates A-F. Not all became an FPS cut; some served to measure paths, others fixed drawing consistency. Where the backup also contained a change from another track, the patch was trimmed to show only the FPS part — and that is noted.

## H1 — horizon vertex cache

**Build:** `DayZ045-fps-horizon-vertex-cache-20261115` · Release/Win32 (there was also a Retail build)

**Files:** `lib/world.cpp`

`HorizonPrune::AddObjectHorizon` transformed the two endpoints of each edge and repeated the transformation when edges shared vertices. The cut creates a direct 128-slot cache per vertex index and a generation per call/shape; a collision only causes repeated transformation. It also initializes `_lastObject` as `NULL`.

**Result:** no A/B session; no gain declared. The code stayed in the tree as a base.

**Full patch:** [download `H1-horizon-cache.diff`](/fps-diffs/H1-horizon-cache.diff)

```diff
diff --git antes/lib/world.cpp depois/lib/world.cpp
index d4dc366..3c63679 100644
--- antes/lib/world.cpp
+++ depois/lib/world.cpp
@@ -6467,12 +6467,25 @@ class HorizonPrune
   /// inverse view space matrix 
   /** used to transform into view space */
   Matrix4 _invViewSpace;
   mutable Matrix4 _modelToView;
   mutable const Object* _lastObject;
 
+  // Small direct-mapped cache for repeated endpoints in one occluder shape.
+  // A collision only replaces an entry; it can never return another vertex.
+  static const int nVertexCache = 128;
+  struct VertexCacheEntry
+  {
+    unsigned int generation;
+    int index;
+    Vector3 position;
+    int clipCode;
+  };
+  VertexCacheEntry _vertexCache[nVertexCache];
+  unsigned int _vertexCacheGeneration;
+
 public:
   void SetModel(const Object* obj) const
   {
     //avoid twice transform when model is tested and added too
     if(obj != _lastObject)
     {
@@ -6600,12 +6613,19 @@ private:
 @param fov field of view of the virtual screen (width in 1m distance)
 */
 HorizonPrune::HorizonPrune(Vector3Par dir, Vector3Par pos, float fov)
 {
   _actBuffer = 0;
   _t = 0;
+  _lastObject = NULL;
+  _vertexCacheGeneration = 0;
+  for (int i=0; i<nVertexCache; i++)
+  {
+    _vertexCache[i].generation = 0;
+    _vertexCache[i].index = -1;
+  }
   
   // when starting assume no horizon (in any frame)
   for (int i = 0; i < nBuffers; i++)
   {
     for (int x=0; x<xSamples; x++)
       _y[i][x] = -FLT_MAX;
@@ -7295,25 +7315,51 @@ bool HorizonPrune::CheckMinmaxBox(const Object* obj, const Vector3 minmax[2], Cl
   if (!CheckLineScreen(p01,p00)) return false;
   return true;
 }
 
 void HorizonPrune::AddObjectHorizon(const Object* obj, const Shape *view, const AutoArray<OcclusionEdge> &edges)
 {
+  PROFILE_SCOPE_DETAIL_EX(hObj,drw);
   SetModel(obj);
   // TODO: if the object is too small to be any significant, do not add it any more
-  // TODO: optimization: transform each vertex to view/screen space only once
   //Matrix4 modelToView = _invViewSpace*toWorld;
 
   const AutoArray<Vector3>& posarray = view->GetPosArray();
+  unsigned int generation = ++_vertexCacheGeneration;
+  if (generation==0)
+  {
+    for (int i=0; i<nVertexCache; i++)
+      _vertexCache[i].generation = 0;
+    generation = ++_vertexCacheGeneration;
+  }
 
   for (int e=0; e<edges.Size(); e++)
   {
-    Vector3 pos0 = _modelToView.FastTransform(posarray[edges[e].a]);
-    Vector3 pos1 = _modelToView.FastTransform(posarray[edges[e].b]);
-    int cc0 = ViewSpaceClipPoint(pos0);
-    int cc1 = ViewSpaceClipPoint(pos1);
+    int index0 = edges[e].a;
+    int index1 = edges[e].b;
+    VertexCacheEntry &vertex0 = _vertexCache[index0 & (nVertexCache-1)];
+    if (vertex0.generation!=generation || vertex0.index!=index0)
+    {
+      vertex0.position = _modelToView.FastTransform(posarray[index0]);
+      vertex0.clipCode = ViewSpaceClipPoint(vertex0.position);
+      vertex0.index = index0;
+      vertex0.generation = generation;
+    }
+    Vector3 pos0 = vertex0.position;
+    int cc0 = vertex0.clipCode;
+
+    VertexCacheEntry &vertex1 = _vertexCache[index1 & (nVertexCache-1)];
+    if (vertex1.generation!=generation || vertex1.index!=index1)
+    {
+      vertex1.position = _modelToView.FastTransform(posarray[index1]);
+      vertex1.clipCode = ViewSpaceClipPoint(vertex1.position);
+      vertex1.index = index1;
+      vertex1.generation = generation;
+    }
+    Vector3 pos1 = vertex1.position;
+    int cc1 = vertex1.clipCode;
 
     if((cc0 & cc1) != 0)
       continue; //line is completely behind something
 
     if((cc0 | cc1) == 0)
     {
```

## H4 — LOD transition once per group

**Build:** no dedicated build; entered the tree before A

**Files:** `lib/scene.cpp`

`Scene::DrawObjectsInstanced` updated `blendFactor` inside the member loop. Since the list shares a single `SortObject`, a list with N members could advance the blend N times in the same frame. The cut computes the coefficient once and updates the blend once per group, after walking the members.

**Note:** the diff shows only the LOD cut. The backup also had two `RString` compatibility casts to `GetData()->GetString()`, outside the FPS scope, which were not included here.

**Full patch:** [download `H4-lod-group.diff`](/fps-diffs/H4-lod-group.diff)

```diff
diff --git antes/lib/scene.cpp depois/lib/scene.cpp
index 302901e..414b648 100644
--- antes/lib/scene.cpp
+++ depois/lib/scene.cpp
@@ -6138,66 +6138,63 @@ void Scene::DrawObjectsInstanced(
     {
       SortObject *iObj = drawPass[ii];
       #if DPRIM_STATS
         int startTgt = tgt;
       #endif
       bool canBlend = iObj->GetObject()->GetShape()->CanBlend();
+      float color = iObj->GetBlendingCoef(bao,canBlend);
       if (const ObjectListFull *list = iObj->_list)
       {
 				int li;
         for (li = iObj->_listBeg; (li+1)<iObj->_listEnd; li++) 
         {
 					PrefetchT0Off(list->Get(li+1), 0);
 					if (iObj->IsVisible(li))
 					{
             Object *obj = list->Get(li);
 
-            float color = iObj->GetBlendingCoef(bao,canBlend);
             if (color>0)
             {
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
               info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
               info._shadowCoef = GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
-          if (updateBF) iObj->UpdateBlendFactor();
         }
 				//do the last one
 				{
 					if (iObj->IsVisible(li))
 					{
             Object *obj = list->Get(li);
-            float color = iObj->GetBlendingCoef(bao,canBlend);
             if (color>0)
             {
 
             ObjectInstanceInfo &info = instances[tgt++];
             info._origin = obj->RenderVisualState().Transform();
               info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
               info._color = Color(1,1,1,color);
               info._shadowCoef = GetLandShadowSmooth(info._origin.Position());
             info._object = info._parentObject = obj;
             info._limitSpriteSize = iObj->limitSpriteSize;
           }
           }
-          if (updateBF) iObj->UpdateBlendFactor();
         }
+        if (updateBF) iObj->UpdateBlendFactor();
         // assume scale is around 1, therefore the same for all objects here
         if (minDist2>iObj->distance2) // TODO: this should perhaps be done inside in the loop - or can distance2 be assumed to be known for all at once?
         {
           minDist2 = iObj->distance2;
         }
         if (iObj->coveredArea>maxCoveredArea) maxCoveredArea = iObj->coveredArea;
       }
       else
       {
-        float color = iObj->GetBlendingCoef(bao,canBlend);
         if (color>0)
         {
         ObjectInstanceInfo &info = instances[tgt++];
         info._origin = iObj->position.position;
           info._lightGridIndex = _gridLights.Size() ? GetLightGridIndex(info._origin.Position().X(), info._origin.Position().Z()) : -1;
           info._color = Color(1,1,1,color);
```

## H5 — grouping of adjacent sections in the individual draw

**Build:** `DayZ045-fps-drawsections-group-profile-20261115-2120` · Profile

**Files:** `lib/shapeDraw.cpp`

`Shape::DrawSections` drew one section at a time. The cut groups contiguous sections with equal `PolyProperties` and the same `_minBoneIndex`/`_bonesCount`, without crossing a hidden/proxy section, animated UV or crater passes. The `dSec` scope measures the draws and the grouped sections.

**Result:** no A/B; it was not adopted as the main fix, but the grouping stayed in the tree.

**Full patch:** [download `H5-drawsections-group.diff`](/fps-diffs/H5-drawsections-group.diff)

```diff
diff --git antes/lib/shapeDraw.cpp depois/lib/shapeDraw.cpp
index 05b1b96..f56e498 100644
--- antes/lib/shapeDraw.cpp
+++ depois/lib/shapeDraw.cpp
@@ -80,26 +80,28 @@ void Shape::DrawSections(int cb, const AnimationContext *animContext, ColorVal a
   {
     beg = prop._begSection;
     end = prop._endSection;
   }
   else
   {
     beg = 0;
     end = NSections();
   }
 
-  // Go through the sections and draw them
-  // there was section merging working here - it cannot work
-  // as we cannot access FaceArray _face here (it can be discarded)
-  for (int i = beg; i < end; i++)
+  PROFILE_SCOPE_DETAIL_EX(dSec,cuDrw);
+  int sectionsMerged = 0;
+  int sectionDraws = 0;
+
+  // Go through the sections and draw them. Adjacent sections can share one draw
+  // setup when their effective properties and bone ranges match.
+  for (int i = beg; i < end; )
   {
-    // const ShapeSection &sec = GetSection(i);
     const PolyProperties &pp = animContext ? animContext->GetSection(this, i) : GetSection(i);
 
     // If we render craters and the pixel shader is not designed for drawing craters (f.i. tree crowns), then go to the next section
     if (dp._cratersCount > 0)
     {
       // Tree crown is determined by backface drawing and special pixel shader
       if (pp.Special()&NoBackfaceCull)
       {
         const TexMaterial *mat = pp.GetMaterialExt();
         if (mat)
@@ -111,54 +113,84 @@ void Shape::DrawSections(int cb, const AnimationContext *animContext, ColorVal a
           case PSNormalMapThroughSimple:
           case PSNormalMapSpecularThrough:
           case PSNormalMapSpecularThroughSimple:
           case PSTree:
           case PSTreeSN:
           case PSTreePRT:
           case PSTreeAdv:
           case PSTreeAdvSimple:
           case PSTreeAdvTrunk:
           case PSTreeAdvTrunkSimple:
+            i++;
             continue;
           }
         }
       }
     }
 
     // Proxy or hidden - don't draw
-    if (pp.Special() & (IsHidden | IsHiddenProxy)) continue;
+    if (pp.Special() & (IsHidden | IsHiddenProxy))
+    {
+      i++;
+      continue;
+    }
 
     // Calculate the bias for section
     int secBias = ((pp.Special() & ZBiasMask) / ZBiasStep) * 5;
     int maxBias = intMax(bias, secBias);
 
+    bool uvchanged = false;
+    if (animContext) uvchanged = animContext->GetUVchanged(this, i);
+
+    int drawEnd = i+1;
+    if (dp._cratersCount==0 && !uvchanged)
+    {
+      const ShapeSection &firstSection = GetSection(i);
+      for (int next=i+1; next<end; next++)
+      {
+        const PolyProperties &nextPP = animContext ? animContext->GetSection(this, next) : GetSection(next);
+        if (nextPP.Special() & (IsHidden | IsHiddenProxy)) break;
+        if (nextPP!=pp) break;
+
+        const ShapeSection &nextSection = GetSection(next);
+        if (
+          nextSection._minBoneIndex!=firstSection._minBoneIndex ||
+          nextSection._bonesCount!=firstSection._bonesCount
+        ) break;
+        if (animContext && animContext->GetUVchanged(this, next)) break;
+
+        drawEnd = next+1;
+      }
+    }
+
     // Get the material
     TLMaterial mat;
     CreateMaterial(mat,animColor);
 
-    // Prepare and draw section
-    bool uvchanged = false;
-    if (animContext) uvchanged = animContext->GetUVchanged(this, i); 
+    // Prepare and draw section range
     if (uvchanged)
     {
       // get information about UV offset if any and pass them to EngineDD9::PrepareDetailTex(...)
       float offsetU = animContext->GetUOffset(this, i);
       float offsetV = animContext->GetVOffset(this, i);
       pp.PrepareTL(cb, mat, spec, prop, dp, true ,offsetU, offsetV);
     }
     else
       pp.PrepareTL(cb, mat, spec, prop, dp);
 
-    GEngine->DrawSectionTL(cb,*this, i, i+1, maxBias, 0, 0, dp);
+    GEngine->DrawSectionTL(cb,*this, i, drawEnd, maxBias, 0, 0, dp);
+    sectionDraws++;
+    sectionsMerged += drawEnd-i-1;
+    i = drawEnd;
   }
-}
 
+}
 void Shape::Draw(
   int cb, AnimationContext *animContext,
   ColorVal animColor,
   const EngineShapeProperties &prop, const LightList &lights,
   ClipFlags clip, int spec, const PositionRender &transform, float minDist2,
   const DrawParameters &dp
 ) const
 {
   #ifndef ACCESS_ONLY
   // if engine has T&L interface, use it
```

## H8 — texture index per shape (_texAreaDraw)

**Build:** `DayZ045-fps-texarea-draw-index-profile-20261117` · Profile

**Files:** `lib/Shape/shape.cpp`, `lib/Shape/shape.hpp`, `lib/shapeDraw.cpp`

New index separate from the landscape `_texArea`, without division by UV scale, with AOT saturated at `1e20f` and explicit invalidation in `Shape::Clear`, `FindSections`, `SetAsOneSection`, `SetUniformMaterial` and `RecalculateAreas`. `TexAreaIndex::Item` stores `_z2Scale` and `_forceMipmap0`; `BuildTexAreaDrawIndex()` builds the index after the vertex buffer creation; `PrepareTextures` prefers `_texArea`, then `_texAreaDraw`, and keeps the old path in `prpSc`.

**Result:** no FPS measurement; the hypothesis was to reduce `prpSc` and increase `prpIX`.

**Full patch:** [download `H8-texarea-index.diff`](/fps-diffs/H8-texarea-index.diff)

```diff
diff --git antes/lib/Shape/shape.cpp depois/lib/Shape/shape.cpp
index 70aaf4c..b0c6206 100644
--- antes/lib/Shape/shape.cpp
+++ depois/lib/Shape/shape.cpp
@@ -2490,12 +2490,13 @@ void Shape::Clear()
   _sel.Clear();
   _prop.Clear();
   _phase.Clear();
   
   _face.Clear();
   _texArea.Clear();
+  _texAreaDraw.Clear();
   base::ReleaseTables();
 }
 
 void Shape::ClearSelections()
 {
   _sel.Clear();
@@ -4201,12 +4202,15 @@ void Shape::FindSections(const LODShape *lodShape, bool forceMaterial0)
   }
 
   // Set the vertex declaration according to sections
   VertexDeclarationNeedsUpdate();
 
   SetCanBeInstanced();
+
+  // sections may have been regrouped or given new materials
+  _texAreaDraw.Clear();
 }
 
 void Shape::SetAsOneSection(const ShapeSectionInfo &sec)
 {
   ShapeSection ss;
   ss.SetInfo(sec);
@@ -4214,12 +4218,14 @@ void Shape::SetAsOneSection(const ShapeSectionInfo &sec)
   ss.end = EndFaces();
 
   Faces().SetSections(&ss,1);
 
   // Set the vertex declaration according to sections
   VertexDeclarationNeedsUpdate();
+
+  _texAreaDraw.Clear();
 }
 
 void Shape::CheckPushbufferCanBeUsed() const
 {
   // In case some selections need sections, it looks like the shape is animated and must not be pushbuffered
   for (int i = 0; i < NNamedSel(); i++)
@@ -4229,19 +4235,20 @@ void Shape::CheckPushbufferCanBeUsed() const
     {
       DisablePushBuffer();
       return;
     }
   }
 
-// HOTFIX: causing Multiple floating point traps in Texture::PrepareAndCheckMipmapLevel() - areaOTex == 1.#INF000
-/*
-  if (_canUsePushBuffer)
+  // Ordinary objects do not have _texArea built (only the landscape loader does).
+  // Build the draw-time index once so PrepareTextures can walk unique textures
+  // instead of rescanning every section and material stage on each object draw.
+  // Animated shapes (pushbuffer disabled) and landscape shapes keep the old path.
+  if (_canUsePushBuffer && !_texArea._valid && !_texAreaDraw._valid)
   {
-    unconst_cast(this)->BuildTexAreaIndex();
+    unconst_cast(this)->BuildTexAreaDrawIndex();
   }
-*/
 }
 
 void Shape::SetCanBeInstanced()
 {
   _canBeInstanced = true;
   for (int i = 0; i < NSections(); i++)
@@ -4588,23 +4595,27 @@ void Shape::SetUniformMaterial(TexMaterial *material)
   // Go through all the sections
   for (int i = 0; i < NSections(); i++)
   {
     ShapeSection &sec = GetSection(i);
     sec.SetMaterialExt(material);
   }
+  // the draw-time texture index keeps pointers into the old material stages
+  _texAreaDraw.Clear();
 }
 
 void Shape::SetUniformMaterial(TexMaterial *material, Texture *texture)
 {
   // Go through all the sections
   for (int i = 0; i < NSections(); i++)
   {
     ShapeSection &sec = GetSection(i);
     sec.SetMaterialExt(material);
     sec.SetTexture(texture);
   }
+  // the draw-time texture index keeps pointers into the old material stages
+  _texAreaDraw.Clear();
 }
 
 void Shape::SetUniformMaterialEmmisiveColor(const Color &color)
 {
   // Go through all the sections
   for (int i = 0; i < NSections(); i++)
@@ -5860,40 +5871,50 @@ void Shape::RecalculateAreas()
           LogF("%s: UV mapping too varied on %s, stage %d: texel size used %g, max %g, min %g",
             GETREPORTSTACK(),cc_cast(tex->GetName()),uvStage,texelSizeUsed,texelSizeMax,texelSizeMin);
         }
       }
     }
   }
+  // AOT values are baked into the draw-time index
+  _texAreaDraw.Clear();
 }
 
 TexAreaIndex::TexAreaIndex()
 {
   _valid = false;
 }
 
 /**
 We want to track aot min value (saturateMax in Shape::RecalculateAreas does min)
 */
-void TexAreaIndex::AddItem(const RefR<Texture> *tex, float aot, bool someDataWanted)
+void TexAreaIndex::AddItem(const RefR<Texture> *tex, float aot, bool someDataWanted, float z2Scale, bool forceMipmap0)
 {
-  Assert(_finite(aot));
-  // check if the texture is already there
+  // FLT_MAX is used as "request the best mipmap". Do not let it (or an invalid
+  // AOT produced by a broken model) overflow when multiplied by the camera AOT
+  // factor - that was the source of the historical 1.#INF000 trap.
+  static const float MAX_SAFE_AOT = 1e20f;
+  if (!_finite(aot) || aot > MAX_SAFE_AOT) aot = MAX_SAFE_AOT;
+  Assert(aot>=0);
+
+  // check if the texture is already there with the same mipmap scaling
   for (int i=0; i<_items.Size(); i++)
   {
-    if (*_items[i]._tex==*tex)
-    {
-      saturateMax(_items[i]._aot,aot);
-      if (someDataWanted) _items[i]._someDataWanted = someDataWanted;
-      return;
-    }
+    if (*_items[i]._tex!=*tex) continue;
+    if (_items[i]._z2Scale!=z2Scale) continue;
+    if (_items[i]._forceMipmap0!=forceMipmap0) continue;
+    saturateMax(_items[i]._aot,aot);
+    if (someDataWanted) _items[i]._someDataWanted = true;
+    return;
   }
    
   Item &item = _items.Append();
   item._tex = tex;
   item._aot = aot;
+  item._z2Scale = z2Scale;
   item._someDataWanted = someDataWanted;
+  item._forceMipmap0 = forceMipmap0;
 }
 
 void TexAreaIndex::Clear()
 {
   _valid = false;
   _items.Clear();
diff --git antes/lib/Shape/shape.hpp depois/lib/Shape/shape.hpp
index 0174a20..07e6c82 100644
--- antes/lib/Shape/shape.hpp
+++ depois/lib/Shape/shape.hpp
@@ -524,27 +524,31 @@ public:
   struct Item
   {
     /// where can be a Ref to the texture are we tracking found
     const RefR<Texture> *_tex;
     /// Area Over Texture for both principal and additional UV coordinates
     float _aot;
+    /// z2 scale applied to this texture when preparing mipmaps (UV scale of the texgen)
+    float _z2Scale;
     /// sometimes we want some mip to be present
     bool _someDataWanted;
+    /// stage does not use UV mapping - only mipmap 0 can be requested
+    bool _forceMipmap0;
     
     ClassIsSimple(Item)
   };
   
   /// list of tracked textures
   AutoArray<Item> _items;
   /// is the list computed?
   bool _valid;
   
   TexAreaIndex();
   
   /// add or update a texture reference
-  void AddItem(const RefR<Texture> *tex, float aot, bool someDataWanted);
+  void AddItem(const RefR<Texture> *tex, float aot, bool someDataWanted, float z2Scale=1.0f, bool forceMipmap0=false);
   
   void Clear();
 };
 
 /// describe a hierarchy of bones
 /** 
@@ -799,12 +803,19 @@ private:
   /*!
     One face consists from several indices. Indices refer to vertices from vertex table.
   */
   FaceArray _face;
   /// tex.area information for all textures, used to optimize mipmap handling
   TexAreaIndex _texArea;
+  /// tex.area index built from all sections, used by ordinary object shapes
+  /**
+    Separate from _texArea, which is built by the landscape loader and keeps its
+    historical mipmap behaviour. This index mirrors the section scan used by
+    Shape::PrepareTextures and is built lazily when the vertex buffer is created.
+  */
+  TexAreaIndex _texAreaDraw;
   
   /// area of all non-proxy faces in the shape
   float _faceArea;
   
   //! Declaration mask computed in the constructor from all sections
   //int _vertexDeclarationMask;
@@ -939,12 +950,16 @@ public:
   }
   
   /// build TexAreaIndex from sections
   void BuildTexAreaIndex(TexAreaIndex &tgt) const;
   /// special case - build _texArea from sections
   void BuildTexAreaIndex(){BuildTexAreaIndex(_texArea);}
+  /// build _texAreaDraw, mirroring the per-section scan in Shape::PrepareTextures
+  void BuildTexAreaDrawIndex();
+  /// drop _texAreaDraw if sections/materials changed
+  void InvalidateTexAreaDrawIndex(){_texAreaDraw.Clear();}
 
   /// check if _texArea is valid
   bool CheckTexAreaIndex() const;
   
   int GetShapePropertiesNeeded() const {return _shapePropertiesNeeded;}
   void UpdateShapePropertiesNeeded();
@@ -1460,12 +1475,14 @@ public:
   }
 
   __forceinline const PolyProperties &GetSection(const Shape *shape, int i) const
   {
     return _loadedSections ? _sections[i] : shape->_face._sections[i];
   }
+  /// true when SetSection was used and base sections no longer describe this context
+  __forceinline bool SectionsChanged() const {return _loadedSections;}
   // load the context if needed
   __forceinline PolyProperties &SetSection(const Shape *shape, int i)
   {
     LoadSections(shape); return _sections[i];
   }
 
diff --git antes/lib/shapeDraw.cpp depois/lib/shapeDraw.cpp
index e7f5150..f56e498 100644
--- antes/lib/shapeDraw.cpp
+++ depois/lib/shapeDraw.cpp
@@ -1591,37 +1591,135 @@ static inline void RepairAreaOfTexture(float &areaOfTexture)
   static const float MIN_AREA_OVER_TEX = 1.5f;
   if (areaOfTexture < MIN_AREA_OVER_TEX)
     areaOfTexture = MIN_AREA_OVER_TEX;
 #endif
 }
 
+/**
+Build the draw-time texture index for ordinary object shapes.
+
+This mirrors the section scan in Shape::PrepareTextures, including the
+minimum AreaOverTexture hotfix and the UV scale used for each material stage.
+It is kept separate from _texArea because the landscape loader uses that index
+with different (historical) mipmap semantics.
+*/
+void Shape::BuildTexAreaDrawIndex()
+{
+  // attribute the one-time cost to vertex buffer creation; this runs right
+  // after the buffer is created (see Shape::CheckPushbufferCanBeUsed)
+  TimeManagerScope scope(TCCreateVertexBuffer);
+
+  _texAreaDraw.Clear();
+
+  // Stages using the landscape environment texture are replaced at draw time
+  // by GLandscape->GetEnvTexture(). A Ref pointer would not follow that swap,
+  // so such shapes must keep using the section scan.
+  for (int s=0; s<NSections(); s++)
+  {
+    const ShapeSection &sec = GetSection(s);
+    TexMaterial *mat = sec.GetMaterialExt();
+    if (!mat) continue;
+    mat->Load();
+    #if _ARMA3_ENV_MAPS
+      for (int i=0; i<mat->_stageCount+1; i++)
+      {
+        if (mat->_stage[i]._useWorldEnvMap) return;
+      }
+    #endif
+  }
+
+  for (int s=0; s<NSections(); s++)
+  {
+    const ShapeSection &sec = GetSection(s);
+
+    if (sec.GetTexture())
+    {
+      _texAreaDraw.AddItem(sec.GetTextureBackPointer(),sec.GetAreaOverTex(0),false);
+    }
+
+    TexMaterial *mat = sec.GetMaterialExt();
+    if (!mat) continue;
+    mat->Load();
+
+    for (int i=0; i<mat->_stageCount+1; i++)
+    {
+      const TexStageInfo &stage = mat->_stage[i];
+      if (!stage._tex) continue;
+      bool someDataWanted = stage._tex->Type()==TT_Diffuse && i!=0;
+
+      float uvScale = mat->GetUVScale(i);
+      if (uvScale>=0.0f)
+      {
+        int uvStage = mat->GetUVStage(i);
+        float areaOTex = sec.GetAreaOverTex(uvStage);
+        RepairAreaOfTexture(areaOTex);
+        // z2 is scaled by uvScale at draw time, exactly like the scan path
+        _texAreaDraw.AddItem(&stage._tex,areaOTex,someDataWanted,uvScale,false);
+      }
+      else
+      {
+        // No relation to UV mapping - the scan path only forces mipmap 0
+        _texAreaDraw.AddItem(&stage._tex,1.0f,someDataWanted,1.0f,true);
+      }
+    }
+  }
+
+  _texAreaDraw._items.Compact();
+  _texAreaDraw._valid = true;
+}
+
 void Shape::PrepareTextures(float z2, AnimationContext *animContext, int special, bool prepareBaseTextureOnly) const
 {
   PROFILE_SCOPE_GRF(prpTx,0);
 
   if( special&::BestMipmap )
   {
     z2 = 0; // force special handling
     special &= ~::BestMipmap; // we have handled it, do not pass it any more
   }
 
   float aotFactor = GScene->GetCamera()->GetAOTFactor();
-  if (!prepareBaseTextureOnly && _texArea._valid)
+  if (!prepareBaseTextureOnly)
   {
-    PROFILE_SCOPE_DETAIL_EX(prpIX,prpTx);
-    for (int i=0; i<_texArea._items.Size(); i++)
+    // the landscape index keeps its historical behaviour
+    const TexAreaIndex *areaIndex = _texArea._valid ? &_texArea : NULL;
+
+    // _texAreaDraw is built from base sections, so it cannot be used when the
+    // animation context replaced sections or when TI textures must be prepared
+    // from the material stages.
+    if (!areaIndex && _texAreaDraw._valid)
     {
-      const TexAreaIndex::Item &item = _texArea._items[i];
-      Texture *txt = *item._tex;
-      // txt is usually not NULL, but some animation might have set it to NULL
-      if (!txt) continue;
-      float areaOTex = item._aot;
-      Assert(areaOTex>=0);
-      txt->PrepareTextureScr(z2,special,areaOTex*aotFactor);
+      if ((!animContext || !animContext->SectionsChanged()) && !GEngine->GetThermalVision())
+      {
+        areaIndex = &_texAreaDraw;
+      }
+    }
+
+    if (areaIndex)
+    {
+      PROFILE_SCOPE_DETAIL_EX(prpIX,prpTx);
+      for (int i=0; i<areaIndex->_items.Size(); i++)
+      {
+        const TexAreaIndex::Item &item = areaIndex->_items[i];
+        Texture *txt = *item._tex;
+        // txt is usually not NULL, but some animation might have set it to NULL
+        if (!txt) continue;
+
+        if (item._forceMipmap0)
+        {
+          txt->LoadHeaders();
+          txt->PrepareMipmap0(true);
+          continue;
+        }
+
+        float areaOTex = item._aot;
+        Assert(areaOTex>=0);
+        txt->PrepareTextureScr(z2*item._z2Scale,special,areaOTex*aotFactor);
+      }
+      return;
     }
-    return;
   }
   PROFILE_SCOPE_DETAIL_EX(prpSc,prpTx);
   // hint mipmap for all textures used on this shape
   for (int s=0; s<NSections(); s++)
   {
     // TI AOT and scale determined by the stage the TI texture will shader same UV coordinates with (this stage is determined as a "Mate")
```

## H6 — Object instrumentation (obAni/obLit/obTex/obShp scopes)

**Build:** `DayZ045-fps-object-render-scopes-profile-sln-20261115` · Profile

**Files:** `lib/object.cpp`

Adds the `obAni` (animation), `obLit` (lights), `obTex` (textures) and `obShp` (shape/draw) scopes, besides instrumenting the `DrawSimpleInstanced` path. It serves to separate the per-object cost; it does not change the visual result.

**Note:** the diff shows only the instrumentation. The backup also had a `PerformAction` fix for `ATUserType`, from another track, which was left out.

**Full patch:** [download `H6-object-scopes.diff`](/fps-diffs/H6-object-scopes.diff)

```diff
diff --git antes/lib/object.cpp depois/lib/object.cpp
index 8753e3f..027bd05 100644
--- antes/lib/object.cpp
+++ depois/lib/object.cpp
@@ -30,12 +30,13 @@ Implements general and  drawing functions
 #include "Shape/material.hpp"
 #include <Es/Files/filenames.hpp>
 #include "diagModes.hpp"
 #include "objDestroy.hpp"
 #include "rtAnimation.hpp"
 #include "objectClasses.hpp"
+#include "vehicleAI.hpp"
 
 #include "Shape/specLods.hpp"
 #include "Network/network.hpp"
 #include "AI/ai.hpp"
 
 #include "stringtableExt.hpp"
@@ -439,13 +440,13 @@ static void ReportObjDiagMode(int mode)
   const char *name = FindEnumName(ObjDiagEnable(mode));
   GlobalShowMessage(2000,"Object diag mode %s %s",name,status);
 }
 
 static GameValue SetObjDiagEnable(const GameState *state, GameValuePar oper1, GameValuePar oper2)
 {
-  const char *modeStr = (RString)oper1;
+  const char *modeStr = oper1.GetData()->GetString();
   bool onOff = oper2;
   int modeMask = ~0;
   int mode = GetEnumValue<ObjDiagEnable>(modeStr);
   if (mode<0) return NOTHING;
   modeMask = 1<<mode;
 
@@ -454,24 +455,24 @@ static GameValue SetObjDiagEnable(const GameState *state, GameValuePar oper1, Ga
   ReportObjDiagMode(mode);
   return NOTHING;
 }
 
 static GameValue SetObjDiagScale(const GameState *state, GameValuePar oper1, GameValuePar oper2)
 {
-  const char *modeStr = (RString)oper1;
+  const char *modeStr = oper1.GetData()->GetString();
   float scale = oper2;
   int mode = GetEnumValue<ObjDiagEnable>(modeStr);
   if (mode<0) return NOTHING;
   ObjDrawScale[mode] = scale;
   return NOTHING;
 }
 
 
 static GameValue SetObjDiagToggle(const GameState *state, GameValuePar oper1)
 {
-  const char *modeStr = (RString)oper1;
+  const char *modeStr = oper1.GetData()->GetString();
   int mode = GetEnumValue<ObjDiagEnable>(modeStr);
   if (mode==-1) return NOTHING;
   int modeMask = 1<<mode;
 
   ObjDiagMode ^= modeMask;
   
@@ -1834,13 +1835,16 @@ void Object::DrawSimpleInstanced(
 
   //CurrentAppFrameFunctions->ProfileEndGraphScope();
   
   // make sure texture loading does not evict our vertex buffer (if it exists)
   VertexBufferLock vbLock(sShape);
   
-  sShape->PrepareTextures(dist2, NULL, special, dp._sbIsBeingRendered);
+  {
+    PROFILE_SCOPE_DETAIL_EX(inTex,oSort);
+    sShape->PrepareTextures(dist2, NULL, special, dp._sbIsBeingRendered);
+  }
 
   // If some hints then draw non-instanced version
   if ((sShape->GetOrHints()&ClipLandOn)!=0)
   {
     DoAssert(cb<0);
     DoAssert(!isSkinned);
@@ -1931,16 +1935,19 @@ void Object::DrawSimpleInstanced(
     }
     else
     {
       bias = ((special&ZBiasMask)/ZBiasStep) * 5;
     }
     
-    GEngine->DrawMeshTLInstanced(
-      cb,*sShape, *_shape, special, lights, bias,
-      instances, instanceCount, dist2, dpTI
-    );
+    {
+      PROFILE_SCOPE_DETAIL_EX(inDrw,oSort);
+      GEngine->DrawMeshTLInstanced(
+        cb,*sShape, *_shape, special, lights, bias,
+        instances, instanceCount, dist2, dpTI
+      );
+    }
     // Set skinning to default value (FLY Better than this clean-up would be better to set it before each drawing)
     GEngine->SetSkinningType(cb,STNone);
   }
 
 
 }
@@ -2041,13 +2048,16 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
   // test if reference points to valid object
   // get object position in clipping coordinates
   AnimationContextStorageRender storage;
   AnimationContext animContext(RenderVisualState(),storage);
   sShape->InitAnimationContext(animContext, _shape->GetConvexComponents(forceLOD), usingGeometry);
 
-  Animate(animContext, forceLOD, setEngineStuff, parentObject, dist2);
+  {
+    PROFILE_SCOPE_DETAIL_EX(obAni,oSort);
+    Animate(animContext, forceLOD, setEngineStuff, parentObject, dist2);
+  }
 
   // pos may be in camera space
   // dist2 is used for mipmap+proxy lod selection
   // Calculate the world position as well (it is not accurate though)
 
   // for clipping tests we want to check world space, as clipping planes are world space
@@ -2086,13 +2096,17 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
     {
       dpTI._heatSourceDirection = newHeatSource;
       dpTI._useOwnHeatSource = true;
     }
 
     LightList work;
-    const LightList &lights=GScene->SelectAggLights(worldPosition, this, forceLOD, work);
+    const LightList *lights;
+    {
+      PROFILE_SCOPE_DETAIL_EX(obLit,oSort);
+      lights = &GScene->SelectAggLights(worldPosition, this, forceLOD, work);
+    }
     
     OBJECT_LEVEL_DPRIM_STAT_SCOPE(cb,_shape,forceLOD);
     ADD_COUNTER(obj,1);
 
     if( special&IsColored ) GScene->SetConstantColor(GetConstantColor()); 
     
@@ -2117,23 +2131,29 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
     // if necessary, split it
     if (!(sShape->Special()&OnSurface) || (sShape->GetAndHints()&ClipLandMask)!=ClipLandOn)
     {
       // make sure texture loading does not evict our vertex buffer (if it exists)
       VertexBufferLock vbLock(sShape);
       
-      PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+      {
+        PROFILE_SCOPE_DETAIL_EX(obTex,oSort);
+        PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+      }
       
       _shape->OptimizeLevelRendering(forceLOD,false);
       // Preparing of drawing of the shape
 #if _HELISIM_RENDER_TO_TEXTURE
       UseDrawMatrices(cb, isSkinned, _shape, forceLOD, oi, drawListId);
 #else
       UseDrawMatrices(cb, isSkinned, _shape, forceLOD, oi);
 #endif
 
-      sShape->Draw(cb,&animContext, GetConstantColor(), *_shape, lights, clipFlags, special, pos, dist2, dpTI);
+      {
+        PROFILE_SCOPE_DETAIL_EX(obShp,oSort);
+        sShape->Draw(cb,&animContext, GetConstantColor(), *_shape, *lights, clipFlags, special, pos, dist2, dpTI);
+      }
 
       // Draw craters (omit DB and z-prime passes), when predicating, predication will take care of omitting it
       if (!dp._zprimeIsBeingRendered || Glob.config._predication)
       {
         int maxCraters = CheckCraterDrawing(dist2, dp);
         if (maxCraters > 0)
@@ -2147,34 +2167,43 @@ void Object::Draw(int cb, int forceLOD, ClipFlags clipFlags, const DrawParameter
           const AutoArray<CraterProperties> &craters = _damage ? _damage->_craters : noCraters;
           GEngine->UseCraters(cb,craters, maxCraters,  CraterColor());
 
           // Draw it
           DrawParameters dpc = dp;
           dpc._cratersCount = std::min(craters.Size(), maxCraters);
-          sShape->Draw(cb, &animContext, GetConstantColor(), *_shape, lights, clipFlags, special, pos, dist2, dpc);
+          {
+            PROFILE_SCOPE_DETAIL_EX(obShp,oSort);
+            sShape->Draw(cb, &animContext, GetConstantColor(), *_shape, *lights, clipFlags, special, pos, dist2, dpc);
+          }
 #endif
         }
       }
     }
     else
     {
       // when rendering shadow buffer, rendering what is on surface has no sense
       if (!dp._sbIsBeingRendered)
       {
-        PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+        {
+          PROFILE_SCOPE_DETAIL_EX(obTex,oSort);
+          PrepareTextures(&animContext, _shape, dist2/scale2, forceLOD, dp._sbIsBeingRendered);
+        }
 
 #if _HELISIM_RENDER_TO_TEXTURE
         UseDrawMatrices(cb, false, _shape, forceLOD, oi, drawListId);
 #else
         UseDrawMatrices(cb, false, _shape, forceLOD, oi);
 #endif
         
         // if all point are LandOn, we can split cache
         Ref<Shape> split = GScene->GetShadowCache().Split(this,VUp,forceLOD,special);
         int specAdj = (special&~OnSurface)|IsOnSurface;
-        split->Draw(cb, &animContext, GetConstantColor(), *_shape, lights, clipFlags, specAdj, pos, dist2, dpTI);
+        {
+          PROFILE_SCOPE_DETAIL_EX(obShp,oSort);
+          split->Draw(cb, &animContext, GetConstantColor(), *_shape, *lights, clipFlags, specAdj, pos, dist2, dpTI);
+        }
       }
     }
 
     // Set skinning to default value (FLY Better than this clean-up would be better to set it before each drawing)
     GEngine->SetSkinningType(cb,STNone);
   }
```

## H2 — grid scopes in World::PrepareDraw (wGrd/wCel)

**Build:** `DayZ045-fps-world-prep-grid-profile-20261116` · Profile

**Files:** `lib/world.cpp`

Instruments the grid scan of `World::PrepareDraw` with `wGrd` (main loop) and `wCel` (cell), to measure the world preparation cost.

**Note:** the patch was trimmed to the two grid hunks. The backup also contained a main-menu statistics function, from another track, which is not part of FPS.

**Full patch:** [download `H2-world-grid-scopes.diff`](/fps-diffs/H2-world-grid-scopes.diff)

```diff
diff --git antes/lib/world.cpp depois/lib/world.cpp
index 3c63679..a115cae 100644
--- antes/lib/world.cpp
+++ depois/lib/world.cpp
@@ -8205,23 +8205,26 @@ void World::PrepareDraw(Object *camInside, bool inPreload, float preloadDist)
 		DoAssert((floop.GetMajorBegin()>floop.GetMajorEnd()) || (floop.GetMajorIncrement()>0));
   
 
 #ifdef TRAP_FOR_0x8000
     //GEngine->TrapFor0x8000("World.PrepareDraw ENTERING major grid traversal loop");
 #endif
+		{
+			PROFILE_SCOPE_DETAIL_EX(wGrd,wPrep);
 		for (int major = floop.GetMajorBegin(); major != floop.GetMajorEnd(); major+=floop.GetMajorIncrement(),lineI++)
 		{
 			int minorBegin = floop.GetMinorBegin(major);
 			int minorEnd = floop.GetMinorEnd(major);
 
       // FIXME: there are situations in which the assert appears and we don't have time to fix it now.
       // In addition, the for cycle below handles that case properly.
 			// DoAssert(minorBegin<minorEnd);
 
 			for (int minor = minorBegin; minor < minorEnd; minor++)
 			{
+				PROFILE_SCOPE_DETAIL_EX(wCel,wGrd);
 				int x = floop.GetX(minor, major);
 				int z = floop.GetZ(minor, major);
 
 				DoAssert(x >= 0 && z >= 0 && x < objRange && z < objRange);
 
 				// some lists may be rejected even before loading the list
@@ -8614,12 +8617,13 @@ void World::PrepareDraw(Object *camInside, bool inPreload, float preloadDist)
 					}
 				}
 				prune.AdvanceBuffer();
 			}
 #endif
 		} // for (major grid traversal loop)
+		}
 #ifdef TRAP_FOR_0x8000
     //GEngine->TrapFor0x8000("World.PrepareDraw LEAVING major grid traversal loop");
 #endif
 		
 #if _ENABLE_REPORT
     if (!myGridVisited)
```

## H9 — D3D9 instancing counter fix

**Build:** before `DayZ045-fps-d3d9-instancing-profile-20261116`

**Files:** `lib/d3d9/engdd9.cpp`

Fixes the draw/instance count in the `DrawMeshTLInstanced` path so that the `d9HWc`/`d9HWi`/`d9FBc`/`d9FBi` counters reflect what was actually submitted. It is instrumentation; it does not change the drawing.

**Full patch:** [download `H9-d3d9-counter-fix.diff`](/fps-diffs/H9-d3d9-counter-fix.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 5a9702d..7d09c6f 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -8767,18 +8767,15 @@ void EngineDD9::DrawMeshTLInstanced(
   if (nInstancesInOneStep >= 1)
 #else
   // Instances in one step must be > 1 (we don't create VB for smaller size)
   if (nInstancesInOneStep > 1)
 #endif
   {
-    PROFILE_SCOPE_DETAIL_EX(d9HW,d3d);
     bool ok = BeginMeshTLInstanced(cb,sMesh, prop, spec, lights, bias, minDist2, dp);
     if (ok)
     {
-      ADD_COUNTER_P_EX(d9HWc,d3d,1);
-      ADD_COUNTER_P_EX(d9HWi,d3d,nInstances);
       // Either use a program to draw or draw it the usual way
       int drawnInstances = 0;
       while (drawnInstances < nInstances)
       {
         // Get number of instances
         int newInstances = min(nInstancesInOneStep, nInstances - drawnInstances);
@@ -8802,16 +8799,13 @@ void EngineDD9::DrawMeshTLInstanced(
       // Finish mesh
       EndMeshTL(cb,sMesh);
     }
   }
   else
   {
-    PROFILE_SCOPE_DETAIL_EX(d9FB,d3d);
     DoAssert(instances);
-    ADD_COUNTER_P_EX(d9FBc,d3d,1);
-    ADD_COUNTER_P_EX(d9FBi,d3d,nInstances);
     Engine::DrawMeshTLInstanced(cb,sMesh, prop, spec, lights, bias, instances, nInstances, minDist2, dp);
     return;
   }
 }
 
 void EngineDD9::DrawShadowVolumeInstanced(
```

## H10 — D3D9 instancing scopes (d9HW/d9FB)

**Build:** `DayZ045-fps-d3d9-instancing-profile-20261116` · Profile

**Files:** `lib/d3d9/engdd9.cpp`

Adds `d9HW`/`d9FB` to separate the accelerated path from the fallback, besides chain counters and section ranges. It serves to measure hardware instancing against software.

**Full patch:** [download `H10-d3d9-instancing-scopes.diff`](/fps-diffs/H10-d3d9-instancing-scopes.diff)

```diff
diff --git antes/lib/d3d9/engdd9.cpp depois/lib/d3d9/engdd9.cpp
index 7d09c6f..51ce115 100644
--- antes/lib/d3d9/engdd9.cpp
+++ depois/lib/d3d9/engdd9.cpp
@@ -404,13 +404,13 @@ static void ReportEngDiagMode(int mode)
   const char *name = FindEnumName(EngDiagEnable(mode));
   GlobalShowMessage(2000,"Engine diag mode %s %s",name,status);
 }
 
 static GameValue SetEngDiagEnable(const GameState *state, GameValuePar oper1, GameValuePar oper2)
 {
-  const char *modeStr = (RString)oper1;
+  const char *modeStr = oper1.GetData()->GetString();
   bool onOff = oper2;
   int modeMask = ~0;
   int mode = -1;
   if (strcmpi(modeStr,"all"))
   {
     mode = GetEnumValue<EngDiagEnable>(modeStr);
@@ -426,13 +426,13 @@ static GameValue SetEngDiagEnable(const GameState *state, GameValuePar oper1, Ga
   }
   return NOTHING;
 }
 
 static GameValue SetEngDiagToggle(const GameState *state, GameValuePar oper1)
 {
-  const char *modeStr = (RString)oper1;
+  const char *modeStr = oper1.GetData()->GetString();
   int mode = GetEnumValue<EngDiagEnable>(modeStr);
   if (mode==-1) return NOTHING;
   int modeMask = 1<<mode;
 
   EngDiagMode ^= modeMask;
 
@@ -518,22 +518,22 @@ static GameValue UseStaticVB(const GameState *state, GameValuePar oper1)
   GEngineDD->ReleaseAllVertexBuffers();
   return NOTHING;
 }
 
 static GameValue ReloadVS(const GameState *state, GameValuePar oper1)
 {
-  const char *shader = (RString)oper1;
+  const char *shader = oper1.GetData()->GetString();
   VertexShaderID vs = GetEnumValue<VertexShaderID>(shader);
   if (vs==-1) return NOTHING;
   GEngineDD->ReloadVertexShader(vs);
   return NOTHING;
 }
 
 static GameValue ReloadPS(const GameState *state, GameValuePar oper1)
 {
-  const char *shader = (RString)oper1;
+  const char *shader = oper1.GetData()->GetString();
   // check all pixel shader which match the mask given in oper1
   for(int ps=0; ps<NPixelShaderID; ps++)
   {
     PixelShaderID psid = PixelShaderID(ps);
     RStringB name = FindEnumName(psid);
     if (Matches(name,shader))
@@ -8767,15 +8767,22 @@ void EngineDD9::DrawMeshTLInstanced(
   if (nInstancesInOneStep >= 1)
 #else
   // Instances in one step must be > 1 (we don't create VB for smaller size)
   if (nInstancesInOneStep > 1)
 #endif
   {
+    PROFILE_SCOPE_DETAIL_EX(d9HW,d3d);
     bool ok = BeginMeshTLInstanced(cb,sMesh, prop, spec, lights, bias, minDist2, dp);
     if (ok)
     {
+#if _ENABLE_PERFLOG
+      DEF_COUNTER_P_EX(d9HWc,d3d,PROF_COUNT_SCALE);
+      COUNTER_P_NAME(d9HWc)+=1;
+      DEF_COUNTER_P_EX(d9HWi,d3d,PROF_COUNT_SCALE);
+      COUNTER_P_NAME(d9HWi)+=nInstances;
+#endif
       // Either use a program to draw or draw it the usual way
       int drawnInstances = 0;
       while (drawnInstances < nInstances)
       {
         // Get number of instances
         int newInstances = min(nInstancesInOneStep, nInstances - drawnInstances);
@@ -8799,13 +8806,20 @@ void EngineDD9::DrawMeshTLInstanced(
       // Finish mesh
       EndMeshTL(cb,sMesh);
     }
   }
   else
   {
+    PROFILE_SCOPE_DETAIL_EX(d9FB,d3d);
     DoAssert(instances);
+#if _ENABLE_PERFLOG
+    DEF_COUNTER_P_EX(d9FBc,d3d,PROF_COUNT_SCALE);
+    COUNTER_P_NAME(d9FBc)+=1;
+    DEF_COUNTER_P_EX(d9FBi,d3d,PROF_COUNT_SCALE);
+    COUNTER_P_NAME(d9FBi)+=nInstances;
+#endif
     Engine::DrawMeshTLInstanced(cb,sMesh, prop, spec, lights, bias, instances, nInstances, minDist2, dp);
     return;
   }
 }
 
 void EngineDD9::DrawShadowVolumeInstanced(
```

## H12 — instancing fallback: section run descriptor

**Build:** `DayZ045-fps-fallback-section-runs-profile-20261116` · Profile

**Files:** `lib/engineDraw.cpp`

Replaces the `InstancedSectionRun` structure with parallel start/end/bias arrays. It is the preparation to reuse the section ranges in the software fallback without allocating a structure per run.

**Full patch:** [download `H12-fallback-run-descriptor.diff`](/fps-diffs/H12-fallback-run-descriptor.diff)

```diff
diff --git antes/lib/engineDraw.cpp depois/lib/engineDraw.cpp
index c5a9231..f51ab37 100644
--- antes/lib/engineDraw.cpp
+++ depois/lib/engineDraw.cpp
@@ -1369,85 +1369,12 @@ void Engine::DrawFrame(Texture *corner, PackedColor color, const Rect2DAbs &fram
 
 void Engine::DrawMeshTLInstanced(
   int cb, const Shape &sMesh, const EngineShapeProperties &prop, int spec, const LightList &lights, int bias,
   const ObjectInstanceInfo *instances, int nInstances, float minDist2, const DrawParameters &dp
 )
 {
-  struct InstancedSectionRun
-  {
-    int _secBeg;
-    int _secEnd;
-    int _bias;
-  };
-
-  AUTO_STATIC_ARRAY(InstancedSectionRun,sectionRuns,256);
-  if (nInstances>1)
-  {
-    PROFILE_SCOPE_DETAIL_EX(d9SR,d3d);
-    // Section grouping depends only on this shape. Compute it once for all instances.
-    int secBeg = -1;
-    int secEnd = -1;
-    ShapeSectionInfo sProp;
-    int minBoneIndex = -1;
-    int bonesCount = -1;
-    int firstBias = bias;
-
-    for (int i=0; i<sMesh.NSections(); i++)
-    {
-      const ShapeSection &sec = sMesh.GetSection(i);
-      if (sec.Special()&(IsHidden|IsHiddenProxy)) continue;
-
-      int secBias = ((sec.Special()&ZBiasMask)/ZBiasStep) * 5;
-      int maxBias = intMax(bias, secBias);
-      if (secBeg<0)
-      {
-        secBeg = i;
-        secEnd = i+1;
-        sProp = sec;
-        minBoneIndex = sec._minBoneIndex;
-        bonesCount = sec._bonesCount;
-        firstBias = maxBias;
-      }
-      else if (
-        sec==sProp &&
-        sec._minBoneIndex==minBoneIndex &&
-        sec._bonesCount==bonesCount &&
-        i==secEnd
-      )
-      {
-        secEnd=i+1;
-      }
-      else
-      {
-        // Preserve the original flush bias, which is taken from the first section
-        // of the next run in the existing per-instance loop.
-        InstancedSectionRun &run = sectionRuns.Append();
-        run._secBeg = secBeg;
-        run._secEnd = secEnd;
-        run._bias = maxBias;
-
-        secBeg = i;
-        secEnd = i+1;
-        sProp = sec;
-        minBoneIndex = sec._minBoneIndex;
-        bonesCount = sec._bonesCount;
-        firstBias = maxBias;
-      }
-    }
-    if (secEnd>secBeg)
-    {
-      InstancedSectionRun &run = sectionRuns.Append();
-      run._secBeg = secBeg;
-      run._secEnd = secEnd;
-      // The original final flush recalculates bias from the run's first section.
-      run._bias = firstBias;
-    }
-    if (PROFILE_SCOPE_NAME(d9SR).IsActive())
-      PROFILE_SCOPE_NAME(d9SR).AddMoreInfo(Format("%d instances, %d sections, %d runs",nInstances,sMesh.NSections(),sectionRuns.Size()));
-  }
-
   // Go through the instances
   for (int j = 0; j < nInstances; j++)
   {
     //SCOPE_GRF("inst",0);
     PROFILE_SCOPE_GRF_EX(inst,drw,SCOPE_COLOR_RED);
     // check if shape is dynamic or not
@@ -1456,25 +1383,12 @@ void Engine::DrawMeshTLInstanced(
     SetInstanceInfo(cb, info._color, info._shadowCoef);
 
     BeginInstanceTL(cb, info._origin, minDist2, spec, lights, dp);
     bool ok = BeginMeshTL(cb, NULL, sMesh, prop, spec, lights, bias);
     if (ok)
     {
-      if (nInstances>1)
-      {
-        for (int r=0; r<sectionRuns.Size(); r++)
-        {
-          const InstancedSectionRun &run = sectionRuns[r];
-          TLMaterial mat;
-          CreateMaterial(mat, HWhite);
-          sMesh.GetSection(run._secBeg).PrepareTL(cb,mat, spec, prop);
-          DrawSectionTL(cb,sMesh, run._secBeg, run._secEnd, run._bias);
-        }
-      }
-      else
-      {
       // check first face properties
       int secBeg = -1;
       int secEnd = -1;
       ShapeSectionInfo sProp;
       int minBoneIndex = -1;
       int bonesCount = -1;
@@ -1537,13 +1451,12 @@ void Engine::DrawMeshTLInstanced(
         // Calculate the bias for section
         int secBias = ((sMesh.GetSection(secBeg).Special()&ZBiasMask)/ZBiasStep) * 5;
         int maxBias = intMax(bias, secBias);
 
         DrawSectionTL(cb,sMesh, secBeg, secEnd, maxBias);
       }
-      }
 
       EndMeshTL(cb,sMesh);
     }
   }
 
   SetInstanceInfo(cb,HWhite, 1);
```

## H13 — instancing fallback: reused section runs

**Build:** `DayZ045-fps-fallback-section-runs-profile-20261116` · Profile

**Files:** `lib/engineDraw.cpp`

The software fallback now computes the section ranges once per shape and uses them in the instance loop, instead of redoing the section scan per instance. It is the base of candidate E.

**Full patch:** [download `H13-fallback-section-runs.diff`](/fps-diffs/H13-fallback-section-runs.diff)

```diff
diff --git antes/lib/engineDraw.cpp depois/lib/engineDraw.cpp
index f51ab37..49d8196 100644
--- antes/lib/engineDraw.cpp
+++ depois/lib/engineDraw.cpp
@@ -1369,12 +1369,76 @@ void Engine::DrawFrame(Texture *corner, PackedColor color, const Rect2DAbs &fram
 
 void Engine::DrawMeshTLInstanced(
   int cb, const Shape &sMesh, const EngineShapeProperties &prop, int spec, const LightList &lights, int bias,
   const ObjectInstanceInfo *instances, int nInstances, float minDist2, const DrawParameters &dp
 )
 {
+  AUTO_STATIC_ARRAY(int,runSecBeg,256);
+  AUTO_STATIC_ARRAY(int,runSecEnd,256);
+  AUTO_STATIC_ARRAY(int,runBias,256);
+  if (nInstances>1)
+  {
+    PROFILE_SCOPE_DETAIL_EX(d9SR,d3d);
+    // Section grouping depends only on this shape. Compute it once for all instances.
+    int secBeg = -1;
+    int secEnd = -1;
+    ShapeSectionInfo sProp;
+    int minBoneIndex = -1;
+    int bonesCount = -1;
+    int firstBias = bias;
+
+    for (int i=0; i<sMesh.NSections(); i++)
+    {
+      const ShapeSection &sec = sMesh.GetSection(i);
+      if (sec.Special()&(IsHidden|IsHiddenProxy)) continue;
+
+      int secBias = ((sec.Special()&ZBiasMask)/ZBiasStep) * 5;
+      int maxBias = intMax(bias, secBias);
+      if (secBeg<0)
+      {
+        secBeg = i;
+        secEnd = i+1;
+        sProp = sec;
+        minBoneIndex = sec._minBoneIndex;
+        bonesCount = sec._bonesCount;
+        firstBias = maxBias;
+      }
+      else if (
+        sec==sProp &&
+        sec._minBoneIndex==minBoneIndex &&
+        sec._bonesCount==bonesCount &&
+        i==secEnd
+      )
+      {
+        secEnd=i+1;
+      }
+      else
+      {
+        // Preserve the original flush bias, which is taken from the first section
+        // of the next run in the existing per-instance loop.
+        runSecBeg.Append() = secBeg;
+        runSecEnd.Append() = secEnd;
+        runBias.Append() = maxBias;
+
+        secBeg = i;
+        secEnd = i+1;
+        sProp = sec;
+        minBoneIndex = sec._minBoneIndex;
+        bonesCount = sec._bonesCount;
+        firstBias = maxBias;
+      }
+    }
+    if (secEnd>secBeg)
+    {
+      runSecBeg.Append() = secBeg;
+      runSecEnd.Append() = secEnd;
+      // The original final flush recalculates bias from the run's first section.
+      runBias.Append() = firstBias;
+    }
+  }
+
   // Go through the instances
   for (int j = 0; j < nInstances; j++)
   {
     //SCOPE_GRF("inst",0);
     PROFILE_SCOPE_GRF_EX(inst,drw,SCOPE_COLOR_RED);
     // check if shape is dynamic or not
@@ -1383,12 +1447,24 @@ void Engine::DrawMeshTLInstanced(
     SetInstanceInfo(cb, info._color, info._shadowCoef);
 
     BeginInstanceTL(cb, info._origin, minDist2, spec, lights, dp);
     bool ok = BeginMeshTL(cb, NULL, sMesh, prop, spec, lights, bias);
     if (ok)
     {
+      if (nInstances>1)
+      {
+        for (int r=0; r<runSecBeg.Size(); r++)
+        {
+          TLMaterial mat;
+          CreateMaterial(mat, HWhite);
+          sMesh.GetSection(runSecBeg[r]).PrepareTL(cb,mat, spec, prop);
+          DrawSectionTL(cb,sMesh, runSecBeg[r], runSecEnd[r], runBias[r]);
+        }
+      }
+      else
+      {
       // check first face properties
       int secBeg = -1;
       int secEnd = -1;
       ShapeSectionInfo sProp;
       int minBoneIndex = -1;
       int bonesCount = -1;
@@ -1451,12 +1527,13 @@ void Engine::DrawMeshTLInstanced(
         // Calculate the bias for section
         int secBias = ((sMesh.GetSection(secBeg).Special()&ZBiasMask)/ZBiasStep) * 5;
         int maxBias = intMax(bias, secBias);
 
         DrawSectionTL(cb,sMesh, secBeg, secEnd, maxBias);
       }
+      }
 
       EndMeshTL(cb,sMesh);
     }
   }
 
   SetInstanceInfo(cb,HWhite, 1);
```

## Patch integrity

Each file below is also in `site/public/fps-diffs` and in `BuildOutput\fps-diffs-20261118`. SHA-256 hashes:

| File | SHA-256 |
|---|---|
| `A-depthprime-lean.diff` | `4B3BCB5EACC5FA49EEE7FE524A9D1AA72770EA8340C2989B5D131E16930E7AE3` |
| `B-rmzprime-removal.diff` | `99608E46CE6CD74F357EA08ABC214E061ABA3F5B7AAA0DFC8870FC9A712C149F` |
| `C-prime-shadowcoef.diff` | `AE7B8B515136C2D37A0B76FD6D412F3332E3E8B061C14915A4F78EC7AA40AE07` |
| `D-prime-lightgrid.diff` | `6F97F19C765AD6A2B35CD431E284511C26D57DDBF89778ECA2657E7F35BF0B8C` |
| `E-color-instancing-material.diff` | `DC0BDFFF86136F0489D46BE79401C166BC170918338088D27E3C20D3C49BBB9F` |
| `F-no-prime-objects.diff` | `ABFEF5151AF721B8352E55E7F469EC0378037B3FED64BBB2A8A0352D30F9EEEA` |
| `F2-cb-scope-guard.diff` | `1F5DE672995F19666EEECA4D726E47C8FE84C02338698A6E1E5A01D7FFAA0EE2` |
| `H1-horizon-cache.diff` | `3E9DA6E53BDD868A3668119220FB94D9A9C422FFE27C5AFE395CDE84C3011BD5` |
| `H4-lod-group.diff` | `BF09A17DB25C1378D078ECF336FFC7DD48C1E7951EE4A15341A2B123C4553654` |
| `H5-drawsections-group.diff` | `B6C06BADE33E2F87C22995CDF088391C72C68CC4B580A0A653AA7127C20B825B` |
| `H8-texarea-index.diff` | `6B68A42EBFCF66D4366B00FA6FDABD0CE6FC17390C3A35CFFF7C29FDEAA6100E` |
| `H6-object-scopes.diff` | `E3713722F11839C731673846B9096918C84126558BE0BAA870E71C9668804A77` |
| `H2-world-grid-scopes.diff` | `E0FB7F17F941A8E0655B44047028DCE54A2FC28F30D184A67B867C9C934B7FAA` |
| `H9-d3d9-counter-fix.diff` | `F9C156E2A2E5C2BAB023ABEE3CF9807295B5B1380ACDE97F7224A2F33700D37A` |
| `H10-d3d9-instancing-scopes.diff` | `2AE7F8CB86DF7D3E2D0F1BFF1AF3E7D5CC9F641891C2B61147AC7C6C91042462` |
| `H12-fallback-run-descriptor.diff` | `AC3301534E6AF2761480DBEE68BE141E826330A089483F35652BF9D174E92AA4` |
| `H13-fallback-section-runs.diff` | `39496D8D61D1185B98B2CDE94582C086592116DE7F72A872AA5E6D45A63CAFD4` |

## What is not on this page

Some changes were **build environment**, not rendering: swapping the Bullet libs from `_MSC_VER=1900` to 1600, swapping Simul to VC10 Static Release, removing `legacy_stdio_definitions.lib`/`crtCompat.cpp` from `lib2010.vcxproj` and the `openlpc_round`/`lrintf` rounding in `openlpc.cpp`. They exist so the Profile compiles and do not enter the Release test binary. The restore points and full manifests are in `SOURCE DEFINITIVA\DayZ-0.45.124252\restore-points`.

> **Rule:** a diff shows what changed, not what became faster. No FPS gain is declared without the A/B at the same spot in Berezino, vsync off, with the complete scene.
