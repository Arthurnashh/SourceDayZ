# Dossiê: queda de FPS ao chegar perto de cidades

> **Sintoma relatado:** ao se aproximar de uma cidade (ex.: Berezino), o FPS cai de forma
> abrupta — em relatos, até 0-1 FPS. Andar 50-100 m na direção da cidade é o gatilho.
> Este dossiê reconstrói a cadeia causal **por código**, não por opinião.
> Método: `1.md` §3.2, §3.6, §4.7, §5.4 + leitura direta de `world.cpp`, `scene.cpp`,
> `object.cpp`, `landClutter.cpp`, `zombie.cpp`.

## 1. Resposta curta

O gargalo **provável** é **CPU no caminho por objeto** (`Object::Draw`, `object.cpp:1968` e
`Scene::DrawObjectsInstanced`, `scene.cpp:6108`), somado ao **streaming do retângulo de
lock** que dispara ao cruzar a fronteira de célula (`World::PrepareDraw`, `world.cpp:7996-8015`).

Trocar DX9 por DX11 **não resolve** isso sozinho. O próprio estudo registra que o teste em
Berezino não confirmou melhora (`1.md` §4.7) — e a leitura por código explica por quê.

## 2. A cadeia causal em 6 elos

```text
[1] Você anda 50-100 m
      ↓
[2] O retângulo de lock (_objAroundCam) muda de célula
      → locks incrementais + carregamento assíncrono  (world.cpp:7996-8015)
      ↓
[3] PrepareDraw recalcula visibilidade e distâncias
      → maxDist inclui sombra: reduzir objectsZ não reduz o custo  (7953-7960)
      ↓
[4] Cada objeto visível entra em Object::Draw
      → 6 de 7 operações caras são por objeto e por frame  (object.cpp:1968)
      ↓
[5] Instancing é limitado a 512 e paga GetLandShadowSmooth por instância
      → scene.cpp:6116, 6169/6188/6211
      ↓
[6] O frame estoura o orçamento de restFrame = 0.045f (~22 FPS)
      → world.cpp:11894; o atraso contamina IA, rede e script
```

Cada elo tem evidência própria. Nenhum deles exige "a GPU é fraca" como explicação.

## 3. Elo 1 — o orçamento de frame é de 2013

`world.cpp:11894`:

```cpp
restFrame = 0.045f;   // 45 ms reservados para "o resto" ≈ 22 FPS
```

O `TimeManager` recebe `estimateReserve` e distribui a folga entre os sistemas. Em hardware
moderno, 45 ms é uma premissa errada: o motor **subestima** a folga real e serializa
trabalho que poderia ser paralelo ou adiado.

**H-01** — confirmar logando o `estimateReserve` real. Correção candidata: derivar de
`RefreshRate()` em vez de constante fixa.

## 4. Elo 2 — o retângulo de lock e a histerese

`World::PrepareDraw` (`world.cpp:7926`) decide **o que** será desenhado:

- `7953-7960` — três distâncias distintas:
  `objRange = ObjRange`; `maxObjDist = min(fogMax, config.objectsZ)`;
  `shadowRadius = GetMaxShadowSize()`;
  `maxShadowDist = shadows ? GetMaxShadowSize() + GetShadowZ() : 0`;
  `maxDist = max(maxObjDist, maxShadowDist)`.
  Objetos são processados **além** da distância de desenho para projetar sombra dentro do
  frustum. **É por isso que reduzir `objectsZ` não reduz o custo proporcionalmente.**
- `7972-7973` — `Calcul2DEdges(maxDist, ObjGrid, objRange, true, floop, boundRect)` calcula
  o retângulo de grids 2D que cobre o frustum.
- `7980-7994` — constrói `circleRect` (rotação-invariante) e `objRect = circleRect +
  boundRect`, saturado nos limites do mapa. O comentário em `7978-7979` é explícito:
  *"we want the locked rectangle around the camera to be rotation invariant — turning
  around is a frequent thing and should not cause any locking/unlocking traffic"*.
- `7996-8015` — no caminho `inPreload`, trava o retângulo **incrementalmente**
  (`_objAroundCam->LeftToLock()`) para não saturar o sistema de carregamento.

**H-02** — o suspeito de maior prioridade para o sintoma "andar 50-100 m e cair": cruzar a
fronteira de célula dispara locks, carregamento assíncrono e re-`PrepareDraw` de tudo.
Confirmar contando locks por frame. Correção: histerese maior ou lock assíncrono.

## 5. Elo 3 — o custo por objeto (o núcleo do problema)

`Object::Draw` (`object.cpp:1968`). As **7 operações caras**, na ordem do código:

| # | Operação | Linha | Por objeto? | Por frame? |
|---|---|---:|---|---|
| 1 | `ShapeGeometryLock` | 2036-2040 | sim | sim |
| 2 | `VertexBufferLock` | 2122 | sim | sim |
| 3 | construção de `AnimationContext` | 2043-2047 | sim | sim |
| 4 | `Animate()` (esqueleto) | 2045 | sim | sim |
| 5 | `SelectAggLights()` | 2091-2093 | sim | sim |
| 6 | `PrepareTextures()` | 2126 | sim | sim |
| 7 | `OptimizeLevelRendering()` + `shadowCache.Split()` | 2129 / 2165-2186 | sim | sim |

**6 de 7 são por objeto e por frame.** Numa cidade com milhares de objetos, o custo cresce
linearmente com o número de objetos — e nenhuma dessas operações é "desenhar triângulo".

Detalhes que agravam:

- `AnimationContextStorageRender storage;` + `Animate(...)` = **animação de esqueleto
  calculada no caminho de desenho**, por objeto, por frame.
- `OptimizeLevelRendering(forceLOD,false)` é **mutante** e chamada no caminho de desenho.
  Se o mesmo shape for desenhado por dois workers, é *data race* em potencial (**H-08**).
- `shadowCache.Split(this, VUp, forceLOD, special)` **divide geometria para sombra em tempo
  de desenho** (**H-09**).
- `DoAssert(CheckMainThread())` só existe sob `_HELISIM_RENDER_TO_TEXTURE`; fora disso o
  desenho pode vir de worker — logo os locks acima são reais, não decorativos.

## 6. Elo 4 — instancing limitado e cálculo por instância

`Scene::DrawObjectsInstanced` (`scene.cpp:6108`):

- `6116-6118` — `maxInstancingChain = 512`; cadeias maiores causariam alocação, então o
  motor **divide** o lote. Isso mantém o número de draw calls alto.
- `6139-6142` — `AUTO_STATIC_ARRAY_16(ObjectInstanceInfo, instances, maxInstancingChain)`:
  até 512 × `ObjectInstanceInfo` **na stack** por chamada (dezenas de KB).
- `6146-6200` — por objeto:
  - `PrefetchT0Off(list->Get(li+1), 0)` (prefetch manual);
  - `GetBlendingCoef(bao, canBlend)` **calculado 2× por objeto** (6163 e 6181);
  - `info._origin = obj->RenderVisualState().Transform();`
  - `info._shadowCoef = GetLandShadowSmooth(info._origin.Position());` ← **por instância**.
- `6196-6200` — acumula `minDist2` e `maxCoveredArea` para escolher LOD.

**H-04** — `GetLandShadowSmooth` depende da **posição**, não do objeto. Se N objetos
compartilham a mesma célula de terreno, é N× o mesmo cálculo. Cache por célula é a
correção de melhor relação custo/benefício do caminho de instancing.

## 7. Elo 5 — grama/clutter cresce com a área visível

`landClutter.cpp`:

- `4224`, `4242-4274` — o custo da grama cresce com a **área do retângulo visível**, não com
  a distância (**H-13**). Olhar para uma cidade grande (retângulo grande) custa mais que
  olhar para o horizonte.
- `4187-4211` — `lodLimit` do clutter recalculado **por frame** (**H-14**).
- `4242-4274` — `_clutterData` lido sem lock durante os jobs (**H-15**, `[hipótese]`).

Junto com `ClearClutterDrawCache()` (`world.cpp:11816`), que limpa o cache de clutter **todo
frame**, forma um conjunto de custos que aparece exatamente ao abrir a cidade na tela.

## 8. Elo 6 — IA e infectados roubam orçamento invisível

- `zombie.cpp:3854` — `ObjectCollisionLine` por zumbi ocioso (**H-06**). Com 1.000
  infectados numa cidade, é uma carga de física **invisível** no orçamento (nada aparece na
  tela), mas que reduz o tempo disponível para o desenho.
- `enf_scriptvm.cpp:906` — `m_Stats.m_iExecuted++` por instrução (**H-05**): contador global
  incrementado por instrução, candidato a cache miss em script pesado.

Como o orçamento é compartilhado, **IA lenta reduz FPS mesmo sem aparecer no frame**.

## 9. Por que trocar para DX11 não resolve

`1.md` §4.7, resposta honesta:

1. **Menos overhead de driver por draw call** só aparece se o número de draw calls for alto
   e o estado for cacheado. Um porte ingênuo (um `UpdateSubresource` por objeto) pode ficar
   **mais lento** que o DX9.
2. **Instancing nativo** já existe no engine (`Scene::DrawObjectsInstanced`), mas no DX9 é
   emulado. Em DX11 o ganho é real **se** o batch passar de 512 (hoje o limite é 512).
3. **Compute/streaming** não é usado hoje.

Para o sintoma em cidade, o gargalo é **CPU no caminho por objeto**, não a API gráfica.
Trocar DX9 por DX11 sem atacar `Object::Draw` e `DrawObjectsInstanced` não muda o resultado.
O backend DX11 tem 1.211 linhas contra 51.549 do DX9 — 2,3% da superfície.

## 10. Protocolo de medição (reproduzível)

Sem isso, qualquer "otimização" é aposta.

1. Fixar build, missão, renderer e rota (ex.: Berezino, aproximação de 50-100 m).
2. Capturar 30 s com **PerfLog + ETW**; anotar `wSimu`, `wPrep`, `obDrw`, `obShD`.
3. Se **`obDrw` domina** → atacar `Object::Draw` (F-005).
4. Se **`wPrep` domina** → atacar o grid/lock de `PrepareDraw` (F-003).
5. Se **`DrawGroundClutter` domina** → atacar `landClutter.cpp:3991`.
6. Se **nenhum domina** → GPU/Present: medir com GPUView antes de tocar em código.
7. Uma mudança por vez, mesma rota, mesmo save.

Ferramentas já disponíveis no binário: `PROFILE_SCOPE_EX`, `PerfLog/`, `DayZ.pdb` (70,7 MB),
`DayZ.map`, ETW + GPUView, PIX/RenderDoc e `-dx11warp` (`Dx11Device.cpp:53`).

## 11. Correções candidatas, por custo/benefício

| Prioridade | Correção | Onde | Impacto esperado | Risco |
|---|---|---|---|---|
| 1 | Cache de `GetLandShadowSmooth` por célula de terreno | `scene.cpp:6169,6188,6211` | alto em cidade (N× → 1×) | baixo |
| 2 | Histerese maior / lock assíncrono do `_objAroundCam` | `world.cpp:7996-8015` | alto no sintoma "andar 50-100 m" | médio |
| 3 | Derivar `restFrame` de `RefreshRate()` | `world.cpp:11894` | médio, global | baixo |
| 4 | Tornar `OptimizeLevelRendering` idempotente ou cachear por shape | `object.cpp:2129` | médio em cidade | médio (race) |
| 5 | Cache de `shadowCache.Split` por shape+LOD | `object.cpp:2182` | médio (sombras) | médio |
| 6 | Orçamento de clutter por distância, não por área | `landClutter.cpp:4224` | médio (grama) | baixo |
| 7 | Agendar `ObjectCollisionLine` por orçamento, não por tempo | `zombie.cpp:3854` | médio com muitos infectados | baixo |
| 8 | Batch de instancing acima de 512 | `scene.cpp:6116` | médio (menos draws) | baixo |
| 9 | `GetBlendingCoef` 1× por objeto | `scene.cpp:6163,6181` | baixo, gratuito | nenhum |
| 10 | Contador de VM local por thread | `enf_scriptvm.cpp:906` | baixo/médio | baixo |

## 12. O que **não** ajuda

- **Trocar DX9 por DX11 sem mexer no caminho por objeto.** O teste em Berezino não
  confirmou melhora.
- **Reduzir `objectsZ` esperando custo proporcional.** `maxDist` inclui `maxShadowDist`;
  objetos além da distância de desenho continuam sendo processados por causa da sombra.
- **Otimizar `Scene::DrawObject`.** São 13 linhas de forwarder (`scene.cpp:11186`); o custo
  está em `Object::Draw` e `DrawObjectsInstanced`.
- **Aumentar a qualidade gráfica esperando mais FPS.** Não há AA, MSAA, SRGB nem oclusão no
  DX11; adicionar mais passes só aumenta o custo.

## 13. Checklist de reprodução

- [ ] Build fixa: 0.45.124252, renderer DX9 e DX11.
- [ ] Rota fixa: aproximação de Berezino em 50-100 m.
- [ ] Captura de 30 s com PerfLog + ETW, mesma câmera.
- [ ] Registrar `wSimu`, `wPrep`, `obDrw`, `obShD` e `Present`.
- [ ] Contar locks de `_objAroundCam` por frame.
- [ ] Contar chamadas de `GetLandShadowSmooth` por frame.
- [ ] Contar draw calls e instâncias por batch.
- [ ] Comparar antes/depois de UMA mudança.
