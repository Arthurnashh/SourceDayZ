# Como o motor do DayZ funciona

> Arquitetura do motor Real Virtuality / Enfusion na build 0.45.124252, com evidência
> retirada de `lib/world.cpp`, `lib/scene.cpp`, `lib/object.cpp`, `lib/d3d9/` e `lib/d3d11/`.
> Cada afirmação forte aponta arquivo e linha.

## 1. Visão em 30 segundos

O motor é um **loop único de simulação** que orçamenta tempo por frame e distribui a folga
entre subsistemas. Não existe separação rígida "update / render": scripts, física, terreno,
IA e desenho rodam no mesmo frame, e quem gasta mais rouba tempo de quem vem depois.

- O mundo simula em `World::Simulate` (`lib/world.cpp:11795`).
- O frame é orçado por `GTimeManager.Frame(estimateReserve)` (`world.cpp:11899/11946/11950`).
- O desenho é preparado por `World::PrepareDraw` (`world.cpp:7926`) e executado por
  `Scene::Draw*` (`lib/scene.cpp`).
- Cada objeto entra no backend gráfico por `Object::Draw` (`lib/object.cpp:1968`).
- O backend legado é `lib/d3d9/` (51.549 linhas); o novo é `lib/d3d11/` (**1.211 linhas**,
  2,3% do tamanho do D3D9).

## 2. Mapa da source

| Pasta | Arquivos | O que é |
|---|---:|---|
| `lib/` | 2.407 | **o jogo e o motor**: `main.cpp`, `world.cpp`, `scene.cpp`, `Network/`, `UI/`, `AI/`, `d3d9/`, `d3d11/` |
| `El/` | 537 | biblioteca base: parser, archives, streams, rede, matemática, threads |
| `Es/` | 116 | containers, strings, threads, arquivos, memória |
| `Enfusion/` | 193 | engine nova: VM de script Enforce, render, física, animação, áudio |
| `extern/` | 10.144 | SDKs: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, ogg/vorbis |
| `cfg/` | 160 | configuração (ParamFile): inventário, armas, veículos, UI, mundos |
| `ComRef/` | 40 | referência de comandos SQF (`comref.xml`, 1.340 comandos) |
| `PerfLog/` | 27 | captura e análise de perfil |

As quatro raízes que importam: `lib/` (o jogo), `El/`+`Es/` (fundação), `Enfusion/` (engine
nova) e `extern/` (teto técnico). O resto são ferramentas e variantes históricas.

## 3. A ordem real do frame

Extraído de `lib/world.cpp`, dentro de `World::Simulate`:

```text
World::Simulate
├─ 11815  GMatrixCache.Clear()
├─ 11816  ClearClutterDrawCache()
├─ 11821  FreeOnDemandGarbageCollectMain()
├─ 11899/11946/11950  GTimeManager.Frame(estimateReserve)   ← orçamento do frame
├─ 12147  SimulateAllVehicles(deltaT)
├─ 12213  SimulateScripts(deltaT, timeLimit)                ← SQF/Enforce
├─ 12364  SimulateLandscape(deltaT)
├─ 12737  PrepareDraw(camInsideVehicle,false,FLT_MAX)       ← visibilidade/grid
├─ 12788  SimulateUI(deltaT)
├─ 12830  DrawScene(...)                                    ← Scene::Draw*
└─ 12848  DrawUI(...)
```

O que esses números revelam:

1. **`SimulateScripts` vem antes de `Draw`.** Script roda no mesmo frame e pode alterar o
   mundo que será desenhado. Não há buffer duplo de estado.
2. **`SimulateLandscape` antes de `PrepareDraw`.** O terreno é simulado *e* a visibilidade
   é preparada depois: potencial de varredura duplicada de grid.
3. **`SimulateUI` depois de `PrepareDraw`** (a chamada em `12421` está comentada) — a UI
   simula sobre o estado já preparado.
4. **Dois caches são limpos todo frame**: matrizes (`GMatrixCache.Clear()`) e clutter já
   desenhado (`ClearClutterDrawCache()`). É decisão de correção, não de performance — e é
   candidato direto a otimização (H-03).

## 4. O orçamento de frame

`World::Simulate` calcula quanto tempo sobra para "o resto" do frame:

- Com vsync: `vsyncTime = 1/RefreshRate()`, depois `CalculateFrameDuration(...)` e
  `restFrame = 0.045f` (45 ms) reservados.
- Sem vsync: `GetSmoothFrameDuration()` e estimativa de `totalDuration - timeManaged`.

`restFrame = 0.045f` corresponde a **~22 FPS**. É uma constante de 2013, em
`world.cpp:11894`, e continua lá em 2026. Em hardware moderno essa premissa subestima a
folga disponível — registrado como **H-01**.

Consequência arquitetural: o motor **orça tempo** e distribui entre atividades. Um sistema
que estoura o orçamento atrasa todos os seguintes. É por isso que FPS baixo "contamina"
IA, rede e script: eles recebem menos tempo, não porque sejam lentos por si.

## 5. Modelo de threads

O motor é **multi-thread com locks explícitos**, não *lock-free*.

| Evidência | O que significa |
|---|---|
| `main.cpp:11657-11660` `SetThreadName(-1,"Main"); RegisterMainThread();` | existe noção de thread principal verificada por assert |
| `scene.cpp:11189` `DoAssert(CheckMainThread())` | desenho pode ser main-only em certos modos |
| `Dx11EngineCore.hpp:87` `CriticalSection _meshSequenceLock` | worker de render pode chamar `BeginMeshTL/DrawSectionTL/EndMeshTL` |
| `scene.cpp:11252` `GEngine->FlushBackgroundScope()` | existe escopo de render em background |
| `networkClient.cpp:1265` `BankList::ReadAccess banks(GFileBanks)` | leitura concorrente de bancos |
| `shapeDraw.cpp:139-153` | lista de geometria protegida por sincronização |

Cada lock no caminho de desenho (`ShapeGeometryLock`, `VertexBufferLock`,
`_meshSequenceLock`, `BankList::ReadAccess`) é um ponto de serialização. Em cidade, com
muitos objetos, a probabilidade de contenção cresce — e contenção aparece como **frame time
alto sem CPU 100%**, sintoma clássico de espera de lock.

## 6. Do objeto ao pixel

O caminho completo, na ordem em que o custo acontece:

```text
World::PrepareDraw            (world.cpp:7926)
  └─ calcula distâncias, retângulo de grid, locks de streaming
Scene::DrawObject             (scene.cpp:11186)   ← só um forwarder
  └─ Object::Draw             (object.cpp:1968)
       ├─ ShapeGeometryLock            (2036-2040)
       ├─ AnimationContext + Animate() (2043-2047)
       ├─ SelectAggLights()            (2091-2093)
       ├─ VertexBufferLock             (2122)
       ├─ PrepareTextures()            (2126)
       ├─ OptimizeLevelRendering()     (2129)  ← mutante, por objeto
       ├─ Shape::Draw()                (2139)
       ├─ CheckCraterDrawing()         (2143-2163)
       └─ shadowCache.Split()          (2165-2186)  ← só OnSurface
Scene::DrawObjectsInstanced   (scene.cpp:6108)   ← lote de até 512
  └─ GetLandShadowSmooth() por instância (6169/6188/6211)
Backend: EngineDD9 (d3d9) ou Dx11EngineCore (d3d11)
```

O ponto central: **6 de 7 operações caras em `Object::Draw` são por objeto e por frame**, e
não têm relação com "desenhar triângulos". Numa cidade com milhares de objetos, o custo é
linear no número de objetos, não no número de pixels.

`Scene::DrawObject` (`scene.cpp:11186`) tem 13 linhas e é apenas um *forwarder*: quem
otimiza ali está otimizando o lugar errado.

## 7. Os dois backends gráficos

| Backend | Arquivos | Funções | Linhas |
|---|---:|---:|---:|
| `lib/d3d9/` | 42 | 1.985 | 51.549 |
| `lib/d3d11/` | 24 | **117** | **1.211** |
| `lib/d3dT/` (T&L legado) | — | 709 | 18.289 |
| `lib/d3dXB/` (Xbox) | — | 604 | 17.313 |

O backend DX11 cobre **2,3% das linhas** e **5,9% das funções** do D3D9. Dizer que "o DX11
está pronto" é falso por um fator de ~42× em superfície de código.

O que **já existe** em `lib/d3d11/`: device/swap chain, `Dx11EngineCore` (TL, texturas,
texto, mesh), cache de shader, compilador, tradutor de estados, textura 2D e volume, text
bank, TL renderer, mesh, render target, alpha test, constant buffer, shape mesh e renderer.

O que **não existe**: pós-processamento (FXAA/SMAA/SSAO/SSR/glow), sombras (map e volume),
terreno, água, shore, grama/clutter, sprites, animação/skinning, materiais completos, vídeo,
queries de oclusão, SRGB, MSAA e restauração de device perdido.

### 7.1 DX10 ou DX11?

**Portar para a API D3D11 com feature levels 10_0/10_1/11_0. Não portar para D3D10.**

1. D3D11 é superconjunto da API D3D10: um device 11 em `FEATURE_LEVEL_10_0` expõe o mesmo
   hardware, com a mesma HLSL 4.0. Dois backends duplicariam 100% do código por zero ganho.
2. `d3d10.dll` não tem runtime próprio desde o Windows 8 — foi substituído por downlevel
   em `d3d11.dll`.
3. O código **já faz isso**: `Dx11Device::Create` (`Dx11Device.cpp:48-50`) tenta
   `11_0 → 10_1 → 10_0` na mesma chamada `D3D11CreateDeviceAndSwapChain`.

## 8. Instrumentação disponível de graça

| Ferramenta | Como usar | O que responde |
|---|---|---|
| `PROFILE_SCOPE_EX(nome,*)` | nomes `wSimu`, `wPrep`, `obDrw`, `obTxP`, `obShD`, `obLgt`, `nwCli`, `nwSer` | tempo por subsistema, por frame |
| `PerfLog/` | ferramenta de captura | perfil hierárquico |
| `DayZ.pdb` (70,7 MB) | WinDbg/`cdb` | stack de crash com função e linha |
| `DayZ.map` (12,4 MB) | endereço → símbolo | crash de build sem PDB |
| ETW + GPUView | Windows Performance Recorder | CPU vs GPU vs Present |
| PIX / RenderDoc | captura de frame DX11 | draw calls, estado, overdraw |
| `-dx11warp` | `Dx11Device.cpp:53` | separar bug de engine de bug de driver |

Os nomes de escopo são um mapa de calor pronto: `wSimu` (simulação), `wPrep` (preparação de
cena), `obDrw` (desenho de objeto), `obShD` (sombra), `obLgt` (luzes), `nwCli`/`nwSer`
(rede). Basta capturar 30 s e olhar quem domina.

## 9. Modding neste snapshot

Este 0.45 **não tem** o keyword `modded` (grep = 0 em toda `Enfusion/`) nem `override` como
keyword. Portanto:

- **não é possível** sobrescrever método com `modded void Foo()`;
- `modded class` também não funciona — depende do mesmo keyword;
- a extensão só é possível por (a) substituir o arquivo inteiro no PBO, (b) config em
  `cfg/` (`CfgVehicles`, `CfgWeapons`), ou (c) `proto native` com recompilação do C++.

Qualquer guia moderno de modding aplicado a este código **falha na compilação**.

## 10. Teto técnico imposto por `extern/`

| Dependência | Versão | Consequência |
|---|---|---|
| Bullet | 2.76 | física antiga; sem SIMD moderno, sem solver multithread |
| DirectX SDK | 2010 | `D3DX9`/`D3DX11`; obriga `d3dx9_41.dll` |
| Boost | antigo | `boost::` em vez de `std::` |
| Steamworks | antigo | matchmaking limitado |
| MSVC | v100 (VS2010) | **sem C++11** no projeto principal |

O toolset v100 é o limitador mais duro: sem `std::atomic`, `std::thread`, `nullptr`,
`override` ou `constexpr`. Modernizar o render (que precisa de atomics e `thread_local`)
exige **primeiro** o retarget do projeto — que hoje falha com `MSB8020`.

## 11. O que isso explica

O motor não é "lento porque o DX9 é velho". Ele é lento em cidade porque o **caminho por
objeto** faz trabalho de CPU que cresce linearmente com o número de objetos, enquanto o
orçamento de frame (`restFrame = 0.045f`) foi calibrado para 22 FPS em 2013. Trocar a API
gráfica sem atacar esse caminho não muda o resultado — ver o dossiê em **Bugs → FPS em
cidades**.
