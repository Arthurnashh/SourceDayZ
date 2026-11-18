# Resolver drop de FPS

**Prioridade alta.** Esta é a frente dedicada a eliminar a queda de FPS perto de cidades, construções, casas e florestas no **DayZ 0.45.124252**. O trabalho é feito na engine, em **Release/Win32**, com A/B no mesmo ponto de Berezino e **vsync desligado**. Nada de mexer em sombra, distância de visão ou configuração gráfica: o alvo é o trabalho de CPU/GPU que se repete por objeto.

## A pista dos desenvolvedores

> “Processamento de objetos antes da renderização. Todas as merdas que acontecem dentro de todas as funções `Scene::DrawObject***`, toda a preparação de materiais, polígonos e outras merdas.”

Essa foi a pista recebida dos desenvolvedores e ela é o norte de toda esta frente. Não é sombra, não é distância, não é vsync: é **o que a engine faz com cada objeto antes de mandar o pixel para a tela**. Toda a investigação abaixo — A, B, C, D, E, F e F2 — foi construída em cima dessa frase.

> **Ponto de retomada — 18/11/2026**
>
> A **F2 foi testada em jogo** com o pacote V38 e o perfil `perfil-janela`, no mesmo ponto de Berezino. **A correção principal funcionou**: personagem visível, casas e árvores presentes de longe, de perto e no contato. **Mas a cena não está 100%**: a **grama não aparece na maior parte do tempo** — surge só de vez em quando, em manchas — e a **sombra do personagem aparece nas costas dele**. O FPS ficou baixo.
>
> Os dois defeitos visuais estão registrados abaixo, com prints e hipótese técnica. A F2 **não é aceitável como correção final**: corrigiu a lista `_drawPass1ON`, mas não fechou a cena. O trabalho está **pausado aqui**; o roteiro para retomar está em **Ponto de retomada**.

**Código antes/depois:** todos os patches (A–F, F2 e o trabalho anterior) estão transcritos na seção **Código antes e depois (tipo git)**, no fim desta aba, com linhas `-`/`+` e link para baixar cada `.diff`.

## Resumo em uma tela

| Pergunta | Resposta |
|---|---|
| Sintoma | Queda de FPS e engasgo perto de construções, casas e mata, principalmente em Berezino. |
| O que foi descartado | Sombra, `shadowQuality`, `shadowZDistance`, distância de visão, vsync e coleta de lixo. |
| O que o código mostra | Os objetos próximos passam por preparação e submissão em mais de um estágio do frame; o depth prepass e o passe de cor compartilham listas de objetos. |
| O que o F fez | Com `FSAA=0`, parou de submeter objetos no depth prepass. O passe de cor deveria desenhar tudo, mas recebeu um escopo de predicação **nunca gravado** e o interpretou como vazio. |
| Resultado do F | FPS ↑ **e** cena quebrada: personagem invisível, casas/árvores somem de perto, grama pisca. **Ganho inválido.** |
| Correção F2 | `CopyCBPredicatedScope` retorna `false` quando `scope.beg < 0`; o passe de cor cai no caminho direto e desenha as listas. |
| Resultado do F2 | **Personagem e casas/árvores corrigidos**, mas **grama intermitente** (aparece só de vez em quando, em manchas) e **sombra do personagem nas costas**. **FPS baixo**, sem ganho; relato subjetivo, sem número. |
| Onde paramos | F2 corrigiu a lista `_drawPass1ON`, mas **não fechou a cena**. Linha F/F2 encerrada como **parcial e não vantajosa**. Próxima frente: A–E em Release e, depois, custo por objeto no passe de cor. Ver **Ponto de retomada**. |
| Critério para declarar ganho | Cena completa (personagem, casas/árvores de perto, grama, água, PiP, sombras) + FPS melhor no mesmo ponto, vsync off. **Não atingido pela F2**: grama e sombra falharam. |

## Ponto de retomada

**Onde o trabalho parou.** A F2 corrigiu parte da cena — personagem e casas/árvores voltaram —, mas **não fechou**: a grama aparece só de vez em quando, em manchas, e a sombra do personagem fica nas costas dele. O FPS ficou baixo. Não houve medição numérica; o registro é o relato do teste. A conclusão prática sobre performance continua: **remover a submissão de objetos do depth prepass não é um caminho de ganho**. O F só parecia mais rápido porque a lista `_drawPass1ON` não era desenhada.

**O que ficou provado.**

- A correção `if (scope.beg < 0) return false` está certa para a lista `_drawPass1ON`: o passe de cor volta a desenhar personagem, casas e árvores quando o escopo nunca foi gravado.
- A F2 **não resolveu os outros caminhos**: a grama (`_lDGCl`) e a sombra do personagem continuam com defeito. A cena não está completa.
- O bug do F não era de sombra, distância, LOD nem oclusão. Era o escopo de predicação tratado como vazio.
- A premissa de que o depth prepass era “trabalho duplicado puro” **não se sustenta na prática**. O prepass preenche profundidade com desenho barato (`PSAlphaOnly`, sem material/lighting) e o passe de cor depois rejeita fragmentos ocultos cedo. Tirar os objetos dali empurra a rasterização para o passe de cor, com shading completo e overdraw. O replay de command buffer também é mais barato do que reexecutar `Object::Draw`/`PrepareTextures`; por isso a “segunda passada completa” não existia do jeito que a hipótese supunha.
- Ainda **não há perfil de GPU** confirmando a divisão exata do custo. Essa é a leitura mais consistente com o resultado, e o próximo passo é medir, não presumir.

**O que está pronto para retomar.**

| Item | Estado |
|---|---|
| Código | A+B+C+D+E+F+F2 na árvore; restore points `backup-fps-f-20261117-164157` (depois de E, antes de F) e `backup-fps-f2-20261118-003054` (F2) |
| Binário F2 | `DayZ045-fps-noprimeobjects-release-f2-20261118`, Release, SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |
| Original | runtime `DayZ045-fps-original-runtime-20261117`; EXE `DayZInt-ORIGINAL-v37-clean.exe`, SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22` |
| Pacote de teste | V38 em `package-v38-pause-menu\Addons`; só Release carrega o `ui.pbo` sem assinatura |
| Documentação | esta aba, a seção **Código antes e depois (tipo git)**, a auditoria técnica e a folha `FPS-AB-TEST-20261117.txt` |
| Processo F2 | ainda aberto (PID 7388), apenas como referência; não é preciso mantê-lo |

**Próxima sessão, em ordem.**

1. **Confirmar as regressões da F2 contra o Original**, no mesmo ponto e horário: grama e sombra do personagem. Se os dois defeitos só aparecem na F2, ela está descartada como correção visual; o caminho limpo é o build A–E.
2. **Build Release de A+B+C+D+E, sem F/F2**, a partir de `backup-fps-f-20261117-164157`. É a única sequência cumulativa que preserva o depth prepass e **nunca foi testada em A/B**. Retail não serve para o V38; tem de ser Release.
3. Testar no mesmo ponto de Berezino, vsync off, cena completa, alternando Original e A–E 2–3 vezes. Anotar FPS médio, 1% low, pior engasgo e fluidez. Se a cena estiver correta e o FPS melhor, esse é o **primeiro ganho válido** da frente. Se não pagar, voltar ao Original como base de performance e manter A–E só como referência.
4. Se A–E não pagar, **medir o passe de cor antes de cortar**. Usar os scopes que já existem (`obAni`, `obLit`, `obTex`, `obShp`, `dSec`, `d9HW`/`d9FB`) em build Profile, ou contadores leves em Release. Separar custo de CPU (draw calls, `PrepareTL`, material/textura) de GPU (overdraw, fill).
5. Atacar nesta ordem: **(a)** cache de material/textura por objeto único (casas) — o mesmo `PrepareTL`/`CreateMaterial` se repete para materiais iguais; **(b)** estender o preparo 1x por run do candidato E ao caminho `nInstances==1`, que hoje não é atingido; **(c)** só depois revisitar passes de submissão.
6. Manter a regra: nada de sombra, `shadowQuality`, `shadowZDistance` ou distância de visão; nenhum ganho declarado sem A/B no mesmo ponto, cena completa e vsync off.

**O que não repetir.**

- F como correção de performance. A submissão de objetos no depth prepass não é o desperdício que a hipótese dizia.
- Considerar a F2 uma correção visual completa: grama e sombra do personagem continuam erradas.
- Considerar ganho de FPS com geometria faltando. O número do F não entra em nenhum resultado.
- Testar Retail com o pacote V38 sem assinatura.
- Declarar ganho por sensação, sem número e sem A/B.

## O que a pista dos devs significa no código

A frase “processamento de objetos antes da renderização” aponta para a cadeia que vai do percurso do mundo até o `DrawIndexedPrimitive`. O caminho real é este:

```text
World::PrepareDraw
  -> Scene::ObjectForDrawing / Scene::ObjectsForDrawing
    -> Scene::DrawObject(Object*)        // scene.cpp:11174 — só encaminha
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

No caminho instanciado, a mesma preparação aparece em outro lugar:

```text
Object::DrawSimpleInstanced
  -> Engine::DrawMeshTLInstanced / DrawMeshTLSectionsInstanced
    -> BeginInstanceTL / BeginMeshTL
    -> PrepareTL por run de seção
    -> DrawSectionTL por instância
```

O detalhe importante: `Scene::DrawObject(Object*)` é uma função trivial que só chama `obj->Draw(...)`. O custo que os devs descreveram não está no nome `Scene::DrawObject` em si; está no que acontece **dentro** de `Object::Draw`, `Shape::Draw` e `DrawSections`, e na quantidade de vezes que esse caminho é executado por frame. Foi exatamente isso que a auditoria encontrou:

- `Animate` roda por objeto, mesmo quando o objeto é estático.
- `SelectAggLights` monta a lista de luzes por objeto.
- `PrepareTextures` percorre seções e estágios de material; sem `TexAreaIndex`, repete a varredura a cada chamada.
- `PrepareTL` refaz `LoadTextureMipmaps`, `PolyProperties::Combine`, configuração de textura/sampler/render states/pixel shader e `DoSetMaterial`.
- `DrawSections` faz `CreateMaterial` + `PrepareTL` + `DrawSectionTL` por seção visível.
- Nos passe de profundidade (`RMDPrime`/`RMZPrime`), tudo isso rodava de novo mesmo quando o shader era `PSAlphaOnly` e não consumia material nem luz.
- No instancing por software, `PrepareTL` era refeito por instância × run de seção, mesmo sendo idêntico para todas as instâncias da cadeia.

Cada corte A–F ataca uma parte dessa frase:

| Corte | Parte da pista dos devs que ele ataca |
|---|---|
| A | preparação de material/luz/textura dentro dos passes de profundidade |
| B | a submissão inteira de um passe de profundidade que só reenviava os mesmos objetos |
| C | cálculo de sombra por instância dentro do passe de profundidade |
| D | light grid, ordenação e agrupamento por luz dentro do passe de profundidade |
| E | `PrepareTL` repetido por instância no instancing por software do passe de cor |
| F | a chamada inteira de `Object::Draw` no depth prepass com `FSAA=0` |
| F2 | faz o passe de cor desenhar de verdade quando o escopo do F não foi gravado |

## Como o teste é feito

O jogo real do usuário é o **Release** (`DayZInt`), não o Retail. O motivo é técnico: as builds Retail definem `_ACCEPT_ONLY_SIGNED_DATA 1` em `retailConfig.h` e recusam o `Addons\ui.pbo` modificado do pacote V38 com a mensagem `Corrupted data detected.`. O Release não faz essa verificação e carrega o pacote V38. Por isso o A/B válido é sempre **Release contra Release**, na mesma pasta, com o mesmo `Addons` e o mesmo perfil.

Configuração usada no teste (perfil `perfil-janela`):

```text
FSAA=0
MSAA=0
PostFX=0
ssaoEnabled=0
VSync=0
PPAA=0
AToC=0
```

Sombra, distância e qualidade ficam iguais às do jogo normal. O teste é no **mesmo ponto de Berezino** (as três casas + mata), mesmo horário e clima. O que importa é a **oscilação/engasgo** ao girar a câmera, não o FPS parado olhando para o mar. A sequência é alternar Original e candidato 2–3 vezes, anotando FPS médio, pior engasgo e artefatos visuais.

### O que é observado como regressão

- Personagem invisível, partes faltando ou 3ª pessoa quebrada.
- Casas, árvores e construções sumindo ao se aproximar.
- Grama piscando, profundidade instável ou objetos aparecendo através de paredes.
- Furos no cenário, flicker em estradas, trilhas e decalques sobre o terreno.
- Água, escopo/PiP (mira), sombras, partículas e oclusão.
- RPT com `Corrupted data detected.` ou `ErrorMessage`.

## O que o teste F mostrou

O teste foi feito com `DayZInt-F.exe` (Release), o pacote V38 e o perfil `perfil-janela`:

- O jogo iniciou sem `Corrupted data detected.` e sem `ErrorMessage`; o RPT do runtime F tem 39.220 bytes e só mostra warnings de material e conteúdo.
- O FPS melhorou de forma perceptível. **Não há número de FPS registrado**; o relato é de aumento percebido. Como a cena estava incompleta, esse número não seria válido de qualquer forma.
- O personagem em 3ª pessoa **não aparece**.
- Casas, árvores e construções **só aparecem de longe**. Quando a câmera chega perto, **desaparecem**.
- A grama alterna entre aparecer e sumir.

Os seis prints abaixo são o registro enviado pelo usuário. Eles mostram a estrada e o cenário distante intactos, mas o personagem ausente e o primeiro plano sem os objetos que deveriam estar ali. **As casas não “continuam visíveis” no F: elas somem na aproximação.** Isso é o bug, não o comportamento esperado.

![Print 1 — estrada com árvores ao fundo; o personagem não aparece em 3ª pessoa.](/fps-2026-11-18/f-teste-01.jpg)

![Print 2 — construção ao longe e overlay de debug; os objetos próximos não são desenhados.](/fps-2026-11-18/f-teste-02.jpg)

![Print 3 — mesma cena sob chuva; estrada e vegetação distante permanecem, primeiro plano vazio.](/fps-2026-11-18/f-teste-03.jpg)

![Print 4 — status "I am completely soaking"; personagem ausente e cenário incompleto.](/fps-2026-11-18/f-teste-04.jpg)

![Print 5 — casa e celeiro visíveis a média distância; ao chegar perto, somem.](/fps-2026-11-18/f-teste-05.jpg)

![Print 6 — casa a média distância; o personagem continua invisível e o primeiro plano está sem geometria.](/fps-2026-11-18/f-teste-06.jpg)

### Ficha dos seis prints

| Print | Dimensão | Tamanho | SHA-256 |
|---|---|---:|---|
| `f-teste-01.jpg` | 1920×1080 | 234.021 B | `EF09431582BE4B2F67A9FD4FD03A32000036FA77F4A83A6D2767DDB4B91206C1` |
| `f-teste-02.jpg` | 1136×905 | 166.753 B | `C132063B3946037532E5B82580B914D975379414B14D21810DD59613A6A6794F` |
| `f-teste-03.jpg` | 1180×899 | 173.109 B | `B349D48F5E9F9E33CB0F923D24E4977C315395F0E87582EDE92C3048FCB91C0F` |
| `f-teste-04.jpg` | 1920×1080 | 177.635 B | `C27CF0C0AEED4B98DD68203326FBC15042FCC6800F3144241BAE3D33113EE3B9` |
| `f-teste-05.jpg` | 1090×821 | 83.170 B | `FB8C86C15A22D68575265E84EEF2EEED1B4338E17D5366DDA8D320F6EBF3458E` |
| `f-teste-06.jpg` | 1099×835 | 92.197 B | `37063EAD4E040804B20D8091F279920F616C131B76F39EE7F1A1EF3F17C030AA` |

## A causa raiz do bug do F

O erro não é de sombra, distância de visão ou configuração. É o caminho de submissão dos objetos.

Com predicação e command buffers ligados, o passe de cor **não percorre a lista de objetos de novo**. Ele reutiliza os comandos gravados no depth prepass:

1. `Scene::DrawDepthPrime` chama `StartCBPredicatedScope(ctx._oPasO, pass)`.
2. `DrawPass1Part` grava os desenhos de `_drawPass1ON` nesse escopo.
3. `EndCBPredicatedScope` fecha a gravação.
4. No passe de cor, `Scene::DrawPass1O` chama `CopyCBPredicatedScope(ctx._oPasO, RenderingPass)`.
5. Se a cópia retorna `true`, o passe de cor **não** chama `DrawPass1Part`: os comandos já gravados são reproduzidos com o estado de cor.

O candidato F fez os passos 1–3 serem pulados quando `FSAA=0` (`drawObjects=false`). Consequência: o escopo `_oPasO` ficou **nunca gravado**. No passo 4, `CopyCBPredicatedScope` encontrou o escopo padrão (`beg = -1`, `end = -1`) e o tratou como “escopo vazio”, retornando `true`. O passe de cor então pulou `DrawPass1Part` e a lista de objetos próximos não foi desenhada.

```cpp
// Scene::DrawPass1O — passe de cor
if (!GEngine->CopyCBPredicatedScope(ctx._oPasO, Engine::RenderingPass))
{
  DrawPass1Part(ctx, ctx._drawPass1ON._original, Engine::RenderingPass);
  DrawPass1Part(ctx, ctx._drawPass1ON._blending, Engine::RenderingPass);
}
```

```cpp
// EngineDD9::CopyCBPredicatedScope — estado anterior (F)
if (!UsePredication()) return false;
Assert(scope.beg >= 0); // o escopo pode estar vazio, mas precisa ter sido gravado
if (scope.end <= scope.beg)
{
  // escopo vazio: retorna true para evitar o custo do caminho padrão
  return true;
}
```

O `Assert` desaparece em Release. O escopo padrão (`beg = -1`) cai no `if (scope.end <= scope.beg)` e retorna `true`, que é exatamente o “nada a desenhar” interpretado pelo passe de cor.

As listas `_drawPass1OF` e `_drawPass1AF` continuam sendo desenhadas diretamente em `DrawPass1A`, antes do escopo predicado. É por isso que o cenário distante permanece: ele não depende do escopo que ficou vazio. O personagem em 3ª pessoa e as casas/árvores próximas dependem da lista `_drawPass1ON`, que sumiu. A grama usa outro escopo (`_lDGCl`), mas o estado de profundidade também mudou; o piscar precisa ser reconferido depois da correção.

### Correção do registro histórico

A auditoria anterior dizia que, com `FSAA=0`, o passe de cor “redesenhava exatamente as mesmas listas com `ZFUNC EQUAL`”. Isso não é preciso quando a predicação está ligada. O passe de cor **reproduz os command buffers gravados no depth pass**; ele não reexecuta a preparação por objeto da lista. A formulação correta é:

- **Predicação ligada:** o depth pass grava os comandos; o color pass os reproduz. O custo duplicado é a rasterização de profundidade e o replay, não necessariamente uma segunda preparação completa de cada objeto.
- **Predicação desligada / escopo nunca gravado:** o color pass desenha as listas diretamente.

Essa distinção é o que explica por que o F “economizou” tanto: ele não só evitou o depth pass, ele evitou **desenhar os objetos próximos por completo**.

## Correção F2

A correção é pequena e cirúrgica: um escopo que **nunca foi gravado** não pode ser tratado como um escopo vazio gravado.

```cpp
// EngineDD9::CopyCBPredicatedScope — F2
if (!UsePredication()) return false;

// Um escopo nunca gravado não é o mesmo que um escopo vazio gravado.
// Retorna false para o chamador desenhar a lista diretamente; isso é
// necessário quando o depth prepass pula a submissão de objetos (FSAA=0,
// veja Landscape::PrimeDepthBuffer) e o passe de cor ainda precisa desenhá-los.
if (scope.beg < 0) return false;

Assert(scope.beg >= 0); // o escopo pode estar vazio, mas precisa ter sido gravado
```

Com `false`, `DrawPass1O` e `DrawPass1A` caem no caminho direto e desenham as listas uma vez, com `ZFUNC LESSEQUAL` e `ZWRITE TRUE` (o `_mainDepthPrimed` continua `false` quando o prepass não submete objetos). É o mesmo caminho usado quando a predicação está desligada, que já é suportado pela engine.

O que a F2 **não** muda:

- O código de sombras, `shadowQuality`, `shadowZDistance` e cascatas. **Mas o teste mostrou a sombra do personagem errada**, provavelmente por estado/ordem do passe de cor; investigar.
- `DrawVolShadows`, `DrawPass3Part` e `DrawPass4Part`.
- Distância de visão, `sceneComplexity`, terreno e clima.
- O código do passe de terreno/grama; ele não foi alterado. **Mas o teste mostrou a grama intermitente**, afetada indiretamente pelo novo estado de profundidade/ordem do passe de cor — ver **Resultado do teste F2**.
- A lista de objetos, o LOD, a oclusão e a ordem de desenho.

### Ficha da build F2

| Item | Valor |
|---|---|
| Build | `BuildOutput\DayZ045-fps-noprimeobjects-release-f2-20261118` |
| Configuração | Release / Win32 / `DayZ.sln /t:lib /m:4` |
| Resultado do MSBuild | `exit=0`; sem `error C`, `error LNK` ou `error MSB`; restam `LNK4099` de PDBs externos |
| `DayZInt.exe` | 13.916.160 bytes · SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |
| `DayZInt.pdb` | SHA-256 `820A72D9A758358C67824F3E1EACFE8081FCCF5A90A87C75B77643C5DA1DCAA2` |
| `DayZInt.map` | SHA-256 `2B87863BC6C4DC6260215BBBC0205DEEB16A88DD6B4617B65B79B3076E7931EA` |
| Runtime | `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118` |
| Executável no runtime | `DayZInt-F2.exe` (mesmo hash do build) |
| Símbolos no runtime | `DayZInt-F2.pdb` / `DayZInt-F2.map` (hashes conferidos) |
| Launcher | `Start-DayZ-Release-F2.bat` |
| Addons | junction para `package-v38-pause-menu\Addons` |
| Perfil | `perfil-janela` (mesmo perfil do teste F) |
| `.map` | contém `?DrawDepthPrime@Scene@@QAEXAAUDrawContext@1@_NW4PredicationMode@Engine@@1H@Z` e `?CopyCBPredicatedScope@EngineDD9@@...` |
| Fontes F2 | `engdd9.cpp` `DD4866460CF783DEF142BACA0D78CBB8D14BF0191263B13CC4F77C0DE5EB2615`; `scene.cpp` `09E1FC6B886A4D29C993EA29BF1455A260D1F21C8F541320FE814596FD5E8404`; `scene.hpp` `539C579BD15F36D26B1842CB0449EA7D4ABB09A3E9A8F82939D8785B83A13D20`; `landscape.cpp` `FAA0BC763CDB57F8E298156F73CE6F5B05EE8E3934A430C5E09C60C4093D6D24` |
| Restore point | `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f2-20261118-003054` |

## Critério de aceite da F2

> **Atenção:** no teste F, casas e árvores **desaparecem quando a câmera se aproxima**. Elas são vistas de longe e somem no primeiro plano. Isso é o bug que a F2 precisa corrigir; os itens abaixo são exigências para aceitar a F2, não o que aconteceu no F.

1. O personagem aparece normalmente em 1ª e 3ª pessoa.
2. Casas, árvores e construções **não podem sumir ao chegar perto**: precisam continuar visíveis de longe, a média distância e no contato.
3. A grama aparece de forma contínua e estável: não pode sumir por intervalos nem piscar.
4. O RPT fecha sem `Corrupted data detected.` e sem `ErrorMessage`.
5. Água, escopo/PiP, sombras e partículas continuam corretos. A sombra do personagem não pode aparecer sobre as costas dele.
6. O FPS é medido no mesmo ponto de Berezino, vsync off, com a cena completa. **Só então** o ganho pode ser declarado.

**Status em 18/11/2026:** itens **1, 2 e 4 atendidos**. Item **3 falhou**: a grama é intermitente. Item **5 falhou no quesito sombra**: a sombra do personagem aparece nas costas; água/PiP/partículas não foram citados no teste. Item **6 não atendido**: FPS baixo, sem ganho. A F2 **não é aceitável como correção final**.

## Resultado do teste F2

A F2 foi testada em 18/11/2026, com o pacote V38 e o perfil `perfil-janela`, no mesmo ponto de Berezino. O resultado é **parcial**.

**O que a F2 corrigiu.**

- **Personagem visível** em 1ª e 3ª pessoa.
- **Casas e árvores presentes** de longe, a média distância e no contato. Não somem mais ao aproximar.
- **RPT** com 37.920 bytes, sem `Corrupted data detected.` e sem `ErrorMessage`.

### Regressões visuais da F2

A cena principal voltou, mas **dois defeitos persistem** e impedem aceitar a F2 como correção visual completa:

- **Grama intermitente.** A grama não aparece de forma contínua: na maior parte do tempo o campo fica sem os tufos e ela surge só de vez em quando, em manchas. Não é o “piscar” rápido do F; é ausência prolongada com reaparecimento ocasional.
- **Sombra do personagem nas costas.** A sombra aparece nas costas dele, sobre a camisa e as pernas — não é uma sombra projetada no chão.
- **FPS baixo**, sem ganho. O relato não trouxe número registrado.

**Prints do teste F2.**

![Print 7 — F2: grama só em manchas e sombra do personagem nas costas; as setas vermelhas destacam a região relatada.](/fps-2026-11-18/f2-teste-01.jpg)

![Print 8 — F2 na janela do jogo: o campo aparece com falhas de grama; personagem, casas e árvores estão presentes.](/fps-2026-11-18/f2-teste-02.jpg)

**Ficha dos prints da F2.**

| Print | Dimensão | Tamanho | SHA-256 |
|---|---|---:|---|
| `f2-teste-01.jpg` | 1108×834 | 274.295 B | `57FAB8846CA97C498CCAB4E0EC6E2D878756EAAB79FA588F22DE62CCECE3F730` |
| `f2-teste-02.jpg` | 1920×1080 | 407.643 B | `75EE18475D221203712CFD527EA193992AC315E87F0E9EC9600C9BDEC7B1457F` |

**Hipótese técnica (ainda não confirmada).**

A F2 mudou o contrato do passe de cor: com `_mainDepthPrimed=false`, as listas de objetos são desenhadas diretamente com `ZFUNC LESSEQUAL` + `ZWRITE TRUE`, e o clear de Z/stencil passou a ser feito no `InitDraw`. A lista `_drawPass1ON` (personagem, casas, árvores) voltou. Mas **grama e sombra não estão nessa lista**:

- A grama usa o escopo `_lDGCl` e o caminho de terreno/landscape. A suspeita é que ela ainda dependa do depth prepass ou da ordem do clear para o teste de profundidade. Se o escopo é desenhado antes/depois do clear, ou com `ZFUNC` diferente, ela desaparece de forma intermitente. Confirmar com captura de estado (PIX) ou instrumentação de `_lDGCl`.
- A sombra do personagem vem do shadow map (`DrawRectShadowBuffer`) e é aplicada no passe de cor. O F2 não alterou o shadow map diretamente, mas mudou o estado de profundidade e a ordem de submissão do passe de cor. A hipótese é bias/self-shadow ou leitura de matriz com o novo estado. Também pode ser um defeito que já existia e só ficou visível com a cena completa; comparar com o Original no mesmo ponto.

**Leitura do resultado:** a F2 corrige a lista `_drawPass1ON`, mas **não é uma correção visual completa**: o critério 3 (grama) e o quesito sombra do critério 5 falharam; água/PiP/partículas não foram citados no teste. O critério 6 (FPS) não foi atendido. O FPS do F não serve de referência porque a lista estava ausente. O patamar atual é o da F2, com a cena ainda incompleta, e é esse que a próxima sessão precisa bater — depois de resolver grama e sombra.

## A linha do tempo dos cortes

A tabela abaixo é cumulativa: cada binário contém todos os cortes anteriores. O F, por exemplo, é **A+B+C+D+E+F**. A F2 é **A+B+C+D+E+F+F2**.

| Candidato | O que corta | Build | Resultado registrado |
|---|---|---|---|
| A | preparação leve nos passes de profundidade | `DayZ045-fps-depthprime-lean-retail-20261117` | build ok; sem A/B registrado |
| B | remove o passe `RMZPrime` inteiro | `DayZ045-fps-noprime-retail-20261117` | build ok; com `FSAA=0` o passe não rodava, então é no-op na prática |
| C | sem `GetLandShadowSmooth` por instância no depth pass | `DayZ045-fps-noprime-noshadowcoef-retail-20261117` | build ok; sem A/B registrado |
| D | depth pass sem light grid por instância | `DayZ045-fps-primelightlean-retail-20261117` | build ok; sem A/B registrado |
| E | preparo de seção 1x por run no instancing de cor | `DayZ045-fps-colorinstance-retail-20261117` | build ok; não atinge casas únicas (`nInstances==1`) |
| F | sem submissão de objetos no depth prepass com `FSAA=0` | `DayZ045-fps-noprimeobjects-release-20261117` | FPS ↑, personagem/casas próximas somem · **inválido** |
| F2 | escopo nunca gravado retorna `false` e o passe de cor desenha direto | `DayZ045-fps-noprimeobjects-release-f2-20261118` | **testada: personagem/casas ok; grama intermitente; sombra nas costas; FPS baixo · sem ganho** |

### Candidato A — preparação leve nos passes de profundidade

Objetivo: os passes `RMDPrime` (máscara SSSM) e `RMZPrime` (z-only) só precisam de profundidade. Eles usam `PSAlphaOnly`, não escrevem cor e não consomem material nem iluminação. Mesmo assim, executavam a mesma preparação por objeto do passe de cor.

Alterações, todas restritas a `RMDPrime`/`RMZPrime`:

1. `lib/object.cpp` (~2148 e ~2199): `PrepareTextures(..., prepareBaseTextureOnly=true)` quando `dp._zprimeIsBeingRendered` (somado ao caso já existente `_sbIsBeingRendered`). Só a textura base — fonte do alpha test — é preparada; normal map, detalhe e specular ficam de fora.
2. `lib/object.cpp` (~2103): `SelectAggLights` é pulado no `RMZPrime`; a lista de luzes entregue ao shape fica vazia. O passe não consome iluminação.
3. `lib/d3d9/engdd9.cpp` (~15674, `PrepareTriangleTL`): retorno antecipado antes da combinação de cor de material e de `DoSetMaterial` quando `_renderingMode == RMDPrime || RMZPrime`.

Build: `DayZ045-fps-depthprime-lean-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib`, `exit=0`, sem erros C/LNK/MSB (restam apenas `LNK4099` de PDBs externos já conhecidos).

- `DayZ.exe`: 11.567.104 bytes, SHA-256 `F279A9FEE966F0766B0C1C9E4DE3E88D9C48AAFCF7623239F931AF3CE1613B9C`.
- `DayZ.pdb`: SHA-256 `1E9D82614F576F2C74A09AADFC78595D03BCAD5033991D7AB2E4ACDAD4E6D129`.
- `DayZ.map`: SHA-256 `6C8189E2F880FF0432C4148C30E4739AD2CAC91BF310B55438C93B0A2FB6ECE6`.
- Runtime: `BuildOutput\DayZ045-fps-depthprime-lean-retail-runtime-20261117`.
- Restore point: `restore-points/fps-depthprime-lean-before-edit-20261117-120927`.

Risco conhecido: o `RMDPrime` alimenta a máscara SSSM. A folhagem usa a textura base (preservada) para o alpha test; árvores também amostram o sampler1 (normal map), ligado por `SetupMaterialTextures` e não pela preparação base-only. Se aparecer recorte/contorno errado em árvore ou sombra estranha em vegetação, o candidato deve ser revertido.

### Candidato B — remoção do passe `RMZPrime`

O `RMZPrime` reenvia os mesmos objetos próximos (raio `max(GetShadowZ(), 100)` = 250 m) apenas para preencher o depth principal; o passe de cor então usa `ZFUNC EQUAL` e desliga alpha test. Sem ele, `ZFUNC` volta a `LESSEQUAL` com `ZWRITE` e alpha test normal. Para geometria opaca o resultado é o mesmo, sem uma submissão inteira de objetos. A máscara SSSM continua sendo produzida pelo `RMDPrime`, e `_zPrimingDone` continua controlando `_doSSSM`/`PSTBasicSSSM`.

Alterações:

- `lib/d3d9/engdd9.hpp`: novo membro `_mainDepthPrimed` e `SetMainDepthPrimed`. `ZPrimed()` deixa de retornar `true` fixo e passa a devolver `_mainDepthPrimed`.
- `lib/landscape.cpp` (`PrimeDepthBuffer`): após `EndDepthMapRendering`, `SetMainDepthPrimed(zOnly || GetFSAA()==0)`. Sem o passe z-only e com `FSAA>0`, o flag fica falso e o passe de cor volta ao comportamento normal.
- `lib/world.cpp`: chamada `PrimeDepthBuffer(..., zOnly=true, ...)` comentada em `World::Simulate` e no caminho R2T.
- `lib/d3d9/engdd9.cpp`: `InitDraw` passou a incluir `D3DCLEAR_ZBUFFER` (e stencil, se houver) quando `_mainDepthPrimed` é falso. Antes, quem limpava era o passe z-only (`Clear(true,false)` em `BeginDepthMapRendering(true)`). Sem ele, o depth seria testado contra o frame anterior.

Build: `DayZ045-fps-noprime-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0`, sem erros C/LNK/MSB. A primeira tentativa falhou com `C1090` (PDB do compilador corrompido) e a segunda com `C2039` (`GEngine` e `Engine*`); corrigido adicionando `virtual ZPrimed()`/`virtual SetMainDepthPrimed` na classe base `Engine` (`lib/engine.hpp`).

- `DayZ.exe`: 11.567.104 bytes, SHA-256 `34CA9C61F8A974E41E27735F3EE8D2EE180C09A17AE1AB3C8F4CDDE82CEA5E26`.
- `DayZ.pdb`: SHA-256 `31DD70E503799AC07D19C3AF4CB3B55C12B94F472AA20923AC799E15364FDC1B`.
- `DayZ.map`: SHA-256 `04C5A017E841CA060CFC61AD55894F593A4F2005A7EE6FC9EE3B851BAB941556`; contém `?ZPrimed@EngineDD9@@UBE_NXZ` e `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Runtime: `BuildOutput\DayZ045-fps-noprime-retail-runtime-20261117`.
- Restore point: `restore-points/fps-rmzprime-removal-before-edit-20261117-1235`.
- Fontes ao final: `engdd9.hpp` `A09ACC1A24C6C967627CB8530BD16BFA3EBAA16A3B8A56A83E1C4104B0CF7E20`; `engdd9.cpp` `FF6A9F4708416B60E9E781EEFE3BCF1C8022549A30C3A8FE89467891C0FBE391`; `landscape.cpp` `D5F970B5CFA215C576AF7E74557974655D31329BAA377E68564332B47656D7F1`; `world.cpp` `FBDA870A757978494920E10EAF6BFF5AB97082689CA7E1080D968BA814DA46F0`; `engine.hpp` `D2ACBAF4CB0D76CBDC79C5480A70873C03D8B9DA8C127E44D2736BE356AE0C5C`.

Checklist visual do B: furos no cenário (depth não limpo — `InitDraw` agora limpa), flicker em estradas/decalques sobre o terreno (passam a escrever profundidade), recorte de folhagem/árvores, sombra da vegetação e objetos que sumam perto de casas.

**Observação importante:** com `FSAA=0`, o `PrimeDepthBuffer` chamado é o de `zOnly=false`; o `RMZPrime` não rodava. Por isso o B é um no-op na configuração real do usuário. Ele foi mantido porque o F foi compilado em cima de A+B.

### Candidato C — sem `GetLandShadowSmooth` por instância nos passes de profundidade

Alteração em `lib/scene.cpp`, `Scene::DrawObjectsInstanced` (3 pontos: ~6164, ~6182, ~6205):

```cpp
info._shadowCoef = dp._zprimeIsBeingRendered ? 1.0f : GetLandShadowSmooth(info._origin.Position());
```

Antes o coeficiente era calculado para cada instância em todos os passes. `GetLandShadowSmooth` amostra o mapa de sombra do terreno (4 amostras, `GetLandShadowDepthSmooth`) e pode chamar `Landscape::SurfaceY`. Nos passes `RMDPrime`/`RMZPrime` os shaders são `PSAlphaOnly` e não consomem `to.instanceShadow` (o valor vem do VS, mas o PS não o usa); o trabalho era descartado. Com o B, o `RMZPrime` já não existe, então o corte elimina o cálculo no `RMDPrime` — o único passe de profundidade restante — e mantém o valor real no passe de cor (`dp._zprimeIsBeingRendered == false`). Nada no passe de cor foi alterado.

Build: `DayZ045-fps-noprime-noshadowcoef-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0`, sem erros C/LNK/MSB.

- `DayZ.exe`: 11.567.104 bytes, SHA-256 `89264F51294BD9A0CA9B6EE8EFDA81244D264DF63EF8535AEDA030102CAEDA39`.
- `DayZ.pdb`: SHA-256 `F125793F9234A2F9CA8146B43B902C10987B674A1F9C872198BC425BF3FBF15A`.
- `DayZ.map`: SHA-256 `5CDEAC0B1972F210EFB6BBFD2C84865865D8EE2FF7AEADE2D4675748018E7513`; contém `?ZPrimed@EngineDD9@@UBE_NXZ` e `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z` (herdados de B).
- Fontes: `lib/scene.cpp` `4375B8E9A80772481ED8A72B2E1A972058865E071F4EBD50939C88F83EDE76AC`; `lib/scene.hpp` `E12D6E223980542139619344E8DC0F370A4ABA8EFAFFE1EF7A5AFBEF959323B6` (inalterado).
- Restore point: `restore-points/fps-prime-shadowcoef-before-edit-20261117-1340` (`scene.cpp` anterior `CC1A7C4777AEAE8DB24F833D1449CD6B8D58BE5BBFD213D6048F77D9C0EDAEBB`).
- Runtime: `BuildOutput\DayZ045-fps-noprime-noshadowcoef-retail-runtime-20261117`.

Risco: nenhum no passe de cor (não foi tocado). No passe de profundidade o valor `1.0` só alimenta `instanceShadow`, que o `PSAlphaOnly` ignora; se algum shader de profundidade passar a consumir esse termo, o valor precisaria voltar.

### Candidato D — passe de profundidade sem light grid por instância

Alterações em `lib/scene.cpp`, `Scene::DrawObjectsInstanced`, todas condicionadas a `dp._zprimeIsBeingRendered`:

1. Os três pontos que preenchem `info._lightGridIndex` (~6161, ~6179, ~6201) param de chamar `GetLightGridIndex(x,z)` no passe de profundidade e gravam `-1`. Esse índice só existe para ordenar/agrupar instâncias por luz; o passe não consome luz.
2. No despacho da cadeia (~6263), o passe de profundidade entra no ramo de desenho único, com lista de luzes vazia, em vez de executar `QSort(instances, ctx, CmpInstances)` e o laço de agrupamento por light grid. Antes, cada cadeia era ordenada (O(n log n) por cadeia, por passe) e dividida em vários `DrawSimpleInstanced`, um por grupo de luzes, sem nenhum efeito no resultado (apenas profundidade).

Racional: com o B, o único passe de profundidade restante é o `RMDPrime` (máscara SSSM). Ele reenvia todos os objetos próximos com shaders `PSAlphaOnly`. Depois de A (sem preparo de material, sem `SelectAggLights`, sem `DoSetMaterial`) e C (sem `GetLandShadowSmooth` por instância), o que restava de trabalho por instância era exatamente o índice de light grid, a ordenação por luz e a fragmentação da cadeia em grupos. Nada disso afeta os pixels: os shaders de profundidade não leem luz.

Risco: `info._lightGridIndex == -1` só é lido pelo comparador e pelo laço de agrupamento, ambos pulados no passe de profundidade (verificado por varredura: `_lightGridIndex` aparece apenas em `scene.cpp` 6061, 6062, 6294, 6300 e nos três pontos de preenchimento). `DrawSimpleInstanced` e `DrawMeshTLInstanced` não usam o campo.

Build: `DayZ045-fps-primelightlean-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`. A primeira tentativa (obj limpo) e a segunda (incremental) falharam com `fatal error C1090: PDB API call failed, error code '23'` em arquivos diferentes (`animation.hpp`/`soundScene.cpp`/`simul.cpp`), sem erro de código. A terceira tentativa, retomada sem apagar `obj` (reaproveitando 170 objetos) e com `mspdbsrv` encerrado, terminou com `exit=0` e sem error C/LNK/MSB.

- `DayZ.exe`: 11.567.104 bytes, SHA-256 `14E21045C65B40717895780318DD2F2C1AA29C53ED4BA79AB61C759E9F1474D6`.
- `DayZ.pdb`: SHA-256 `31BFF20F179E9257149B66F4FC6E34AF403828F521CF44560BBB11497F83AE6C`.
- `DayZ.map`: SHA-256 `706DBDFA3A5F05C434A8CB1ECA289F49C85271DA5C3E235A390596E52D76A9B9`; contém `?ZPrimed@EngineDD9@@UBE_NXZ` e `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Fonte: `lib/scene.cpp` `350C9B4F6298D4BF21B539135E2A84E54FAA9DA77A8303E3D4F9D6267F1128D9`.
- Runtime: `BuildOutput\DayZ045-fps-primelightlean-retail-runtime-20261117`.
- Restore point: `restore-points/fps-prime-lightgrid-before-edit-20261117-1330` (`scene.cpp` `4375B8E9A80772481ED8A72B2E1A972058865E071F4EBD50939C88F83EDE76AC`).

### Candidato E — preparo de seção 1x por run no instancing por software

Primeiro corte no **passe de cor**. Alvo: `Engine::DrawMeshTLInstanced` (`lib/engineDraw.cpp`), caminho `nInstances>1` usado quando o vertex buffer da forma não foi criado para instancing de hardware e o desenho cai para uma submissão por instância.

Antes, para cada instância e para cada run de seções, o código refazia `TLMaterial` + `PrepareTL` completo (`LoadTextureMipmaps`, `PolyProperties::Combine`, `DoPrepareTriangle` com textura/sampler/render states/pixel shader e `DoSetMaterial`). Esse estado depende apenas da seção/run, não da instância. Numa cadeia de centenas de instâncias com vários runs, eram milhares de preparos completos por frame.

Depois: a instância 0 fixa o tipo de pixel shader e a escala/offset de UV (texgen) com `SetInstanceInfo`/`BeginInstanceTL`/`BeginMeshTL`; para cada run, `CreateMaterial` + `PrepareTL` acontece **uma vez**; dentro do run, cada instância só chama `ApplyMaterialTL` (material/luz no espaço do objeto) e `DrawSectionTL`.

```cpp
// instancia 0: fixa tipo de pixel shader e escala/offset de UV (texgen)
SetInstanceInfo/BeginInstanceTL/BeginMeshTL(instances[0]);
for (r : runs) {
  CreateMaterial(mat, HWhite);
  PrepareTL(run r);              // UMA vez por run
  for (j : instances) {
    SetInstanceInfo/BeginInstanceTL/BeginMeshTL;
    ApplyMaterialTL(cb, mat);    // so material/luz no espaco do objeto
    DrawSectionTL(run r);
    EndMeshTL;
  }
}
```

- `ApplyMaterialTL` é um novo virtual em `Engine` (vazio) implementado em `EngineDD9`. Ele reproduz apenas o trecho final de `PrepareTriangleTL`: modulação por `_modColor` + `DoSetMaterial`. Essa é a única parte de `PrepareTriangleTL` que depende da instância, porque `SetupMaterialLights` transforma a direção da luz para o espaço do objeto via `cbState._world` (`TransformAndNormalizeVectorToObjectSpace`).
- No passe de profundidade (`RMDPrime`/`RMZPrime`) `ApplyMaterialTL` retorna cedo, preservando o candidato A. Ainda assim o E remove `DoPrepareTriangle`/`LoadTextureMipmaps` por instância nesse passe, que o A não removia.
- A ordem `BeginInstanceTL`/`BeginMeshTL` da instância 0 antes do `PrepareTL` é obrigatória: `BeginInstanceTL` seleciona o tipo de pixel shader (`PSTBasic`/`PSTBasicSSSM`/`PSTAlphaOnly`) e `BeginMeshTL` grava a escala/offset de UV consumida por `EnableCustomTexGen` dentro de `DoPrepareTriangle`. Sem isso o texgen usaria o estado da forma anterior.
- O laço original permanece intacto para `nInstances==1` (objetos únicos), sombra, caminho de instancing de hardware (`DrawMeshTLSectionsInstanced`), LOD, sorting e passe de cor de objetos únicos.

Build: `DayZ045-fps-colorinstance-retail-20261117`, MSBuild 15.0, Retail/Win32, `DayZ.sln /t:lib /m:4`, `exit=0` e sem error C/LNK/MSB.

- `DayZ.exe`: 11.568.128 bytes, SHA-256 `BCEE389B1A9C7496016853AD3ADC639B9846CE9687F4AB8670B723F1CA7FCB95`.
- `DayZ.pdb`: SHA-256 `B6342BD5F4A927576DFBC1DAA88045ED09EF3B16A15E5B9CD016F9D2FF157702`.
- `DayZ.map`: SHA-256 `748532D5F26215A038C7D8C3825C24AD7273071221F1944A065D9CFCC4BAFF96`; contém `?ApplyMaterialTL@EngineDD9@@MAEXHABUTLMaterial@@@Z` e `?DrawMeshTLInstanced@EngineDD9@@...`.
- Runtime: `BuildOutput\DayZ045-fps-colorinstance-retail-runtime-20261117`.
- Restore point: `restore-points/fps-colormaterial-before-edit-20261117-1325` (`engine.hpp` `D2ACBAF4CB0D76CBDC79C5480A70873C03D8B9DA8C127E44D2736BE356AE0C5C`, `engineDraw.cpp` `50949F1F62EDDE59FD9BC329E5C37A84B88307144192107CB6CAD1B2CF35CEF2`, `engdd9.hpp` `4B73AF821D8FE29A2148856A6208772796D13DE3395549D5A195D91D5C8D994C`, `engdd9.cpp` `FF6A9F4708416B60E9E781EEFE3BCF1C8022549A30C3A8FE89467891C0FBE391`).
- Fontes com E: `engine.hpp` `94A6E8224BD0EACBB2C7FC5F9A401C5203872BE444E52BC8AAF7822DBF1BECC1`; `engineDraw.cpp` `DB51E4C580163CA9B780F6BF80795D073BB2482003F96A9D7F89B2165EE0FC4F`; `engdd9.hpp` `C8593E1FB4318659581AA4C4016536922EA08DE2ECE67F62178DE2F350B325EC`; `engdd9.cpp` `757236D61692FF413EBC21019EF8E0F9EAFB5E81EC5427899663616320A0B6A8`.

Riscos a observar: UV deslocado/repetido (ordem `BeginMeshTL`/`PrepareTL`), cor/luz diferente entre instâncias da mesma cadeia (`ApplyMaterialTL` ausente ou fora de ordem), objeto sumindo/shader errado. O caminho de instancing por software é usado principalmente em vegetação/objetos repetidos; casas únicas (`nInstances==1`) não passam por ele.

### Candidato F — sem submissão de objetos no depth prepass com `FSAA=0`

Corte no nível de submissão, acima de `Shape::DrawSections`: atinge objetos únicos (casas) e instanciados igualmente, porque remove a **segunda chamada inteira** de `Object::Draw` no frame.

Com `FSAA=0` (configuração real do usuário), `World::Simulate` chama `Landscape::PrimeDepthBuffer(..., zOnly=false, ...)`. Em `landscape.cpp:5993` o passe desenhava `Scene::DrawDepthPrime`, que submetia `_drawPass1ON._original`, `_drawPass1ON._blending` e `_drawPass1AN` em `RMDPrime`. Depois `SetMainDepthPrimed(true)` fazia o passe de cor reutilizar os comandos gravados.

Alterações:

- `Scene::DrawDepthPrime` ganhou `bool drawObjects` (sem default, para não conflitar com o `drawListId` de `_HELISIM_RENDER_TO_TEXTURE`; o único chamador passa todos os argumentos).
- Em `Landscape::PrimeDepthBuffer`, `primeObjects = zOnly || GEngine->GetFSAA()!=0`. Com `FSAA=0` e `zOnly=false`, `drawObjects=false`: as listas de objetos não são submetidas no depth prepass.
- `SetMainDepthPrimed(primeObjects && (zOnly || GEngine->GetFSAA()==0))` fica `false` nesse caso. O passe de cor volta ao caminho normal (`ZFUNC LESSEQUAL` + `ZWRITE TRUE`) e o clear principal limpa Z/stencil (`engdd9.cpp:3439`).
- `DrawVolShadows` e `DrawPass3Part`/`DrawPass4Part` continuam no `DrawDepthPrime`; `DrawRectShadowBuffer` (shadow maps), `shadowQuality=4` e `shadowZDistance=250` não foram alterados.
- Com `FSAA>0` o comportamento antigo é mantido (depth prepass separado continua necessário).

O que isso remove por objeto único, por frame: uma chamada de `Object::Draw` com `Animate`, `SelectAggLights`, `PrepareTextures`, `UseDrawMatrices`, `Shape::Draw` -> `DrawSections` (`CreateMaterial`/`PrepareTL`/`DrawSectionTL`) e os `DrawIndexedPrimitive` correspondentes. O interior de `DrawSections` já une seções adjacentes com `PolyProperties` idênticas (`shapeDraw.cpp:144-163`, comparando `_texture`/`_special`/`_surfMat` em `poly.cpp:18-35`); o desperdício real era a submissão inteira repetida.

- Build: `DayZ045-fps-noprimeobjects-release-20261117`, Release/Win32, `exit=0`, sem error C/LNK/MSB.
- `DayZInt.exe`: 13.916.672 bytes, SHA-256 `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB`.
- `DayZInt.pdb`: SHA-256 `AD464C876D14F3519E0B8EE2317175DD43ABC3010D7658DC6BA9692FF6C853E7`.
- `DayZInt.map`: SHA-256 `D6C3D7B21103A0E8FC92307E4005B296E04C70D732128FD94BD98D07ACFD7E0A`; contém `?DrawDepthPrime@Scene@@QAEXAAUDrawContext@1@_NW4PredicationMode@Engine@@1H@Z` e `?SetMainDepthPrimed@EngineDD9@@UAEX_N@Z`.
- Runtime: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-20261117`.
- Restore point: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f-20261117-164157` (`scene.cpp` `350C9B4F6298D4BF21B539135E2A84E54FAA9DA77A8303E3D4F9D6267F1128D9`, `scene.hpp` `E12D6E223980542139619344E8DC0F370A4ABA8EFAFFE1EF7A5AFBEF959323B6`, `landscape.cpp` `D5F970B5CFA215C576AF7E74557974655D31329BAA377E68564332B47656D7F1`).
- Fontes com F: `scene.cpp` `99B6BFFC91C536904FAC978BABC8E9F2904B971FE2BEC34A77629A9A8607650C`; `scene.hpp` `539C579BD15F36D26B1842CB0449EA7D4ABB09A3E9A8F82939D8785B83A13D20`; `landscape.cpp` `FAA0BC763CDB57F8E298156F73CE6F5B05EE8E3934A430C5E09C60C4093D6D24`.

#### F Retail (histórico, não testado com o V38)

Antes do F Release, o mesmo corte foi compilado em Retail: `DayZ045-fps-noprimeobjects-retail-20261117`. O `DayZ.exe` tem 11.568.128 bytes e SHA-256 `CA4F03D7A5C1E8A4C575C5D5BD1C95841B63D87B091191D8EB9E6F276A4FB329` (PDB `033D1D84B07B3D233733D5C70DF1D9CBBCA029FBC16080524E8FC078A4B1089F`, MAP `22084066556D3DBA4C6E410B5381D0FDC505784F6C87EA2E124B2E66E8DE4D7A`; build exit=0). O `.map` contém `DrawDepthPrime` com o novo parâmetro bool e `SetMainDepthPrimed@EngineDD9`.

Esse binário **não pôde ser testado com o pacote V38**: o Retail verifica assinatura de PBO e recusa o `ui.pbo` modificado. Ele fica como referência histórica do corte. O teste real do F foi o Release `7C71EA...` listado acima.

**Resultado do teste F:** FPS ↑, personagem invisível em 3ª pessoa, casas/árvores somem ao se aproximar, grama pisca. O ganho é inválido porque a lista `_drawPass1ON` não foi desenhada. O F **não** é a resposta final.

## Trabalho anterior: investigação, instrumentação e becos sem saída

Antes dos cortes A–F, a frente passou por uma auditoria estática e por várias builds de diagnóstico. Isso não era o caminho final, mas faz parte do histórico e explica por que o alvo mudou para o depth prepass.

### Auditoria de 15/11/2026

- `FarLodsDefault = 2`; `Scene::DrawPreparation` percorre candidatos estáticos, recalcula `ClippingInfo` e chama `SceneCoverage::RenderBBox` com grade 64×32 (`scene.cpp:9447-9474`). Custo potencial por objeto, mas sem prova de dominância.
- Fallback de instancing D3D9: o buffer limita cópias a 32.000 vértices para geometria frequente e 8.000 para não frequente; modelos grandes caem em `Engine::DrawMeshTLInstanced`, que percorre instância por instância e repete preparação de mesh/material/seções (`engdd9.cpp:7257-7277`, `8731-8807`, `engineDraw.cpp:1370-1458`).
- `HORIZON_PRUNE` ativo; `HorizonPrune::AddObjectHorizon` transforma os dois endpoints de cada aresta e repete o mesmo vértice quando arestas compartilham vértices (`world.cpp:7299-7337`). Havia um TODO explícito no próprio código.
- `World::PrepareDraw` só agrupa objetos não oclusores, sem sombra, acima de 200 m (`world.cpp:8293-8337`). Perto, o caminho é por objeto.
- Carga síncrona de células até 200 m (`UOWait`), com `LoadObjects`/`ObjectCreate` (`landSave.cpp:2356-2517`). Pode explicar engasgo na primeira entrada, não FPS baixo contínuo.
- Inventário de assets: `assets_buildings.pbo` 543 entradas/98 `.p3d`; `assets_buildings2.pbo` 1.434/139; `structures_houses.pbo` 977/83; `worlds_chernarusplus_data.pbo` 8.002 entradas/2.073 imagens. Contagem de arquivos, não de instâncias no mapa.

### Cache de vértices do horizonte

- Implementado cache direto de 128 slots por índice de vértice e geração por chamada/forma em `HorizonPrune::AddObjectHorizon`; colisão só causa transformação repetida. Também inicializado `_lastObject` como `NULL`.
- Build Release: `DayZ045-fps-horizon-vertex-cache-20261115`, `DayZInt.exe` 13.843.456 bytes, SHA-256 `C92D1C0479DD30AC0C8C32870FE3CAA21BB29E5F82DD264C844B8D7599EC034C`.
- Build Retail: `DayZ045-fps-horizon-vertex-cache-retail-20261115`, `DayZ.exe` 11.500.544 bytes, SHA-256 `89CA8021E5C7084F290DE81700B8B619BD40AA14CBB23604C64D4CD95BB3EAEE`.
- Restore point: `restore-points/fps-horizon-vertex-cache-before-edit-20261115-135230`; `world.cpp` original `D9D107F07400B26C93E102574F3510D433F5DF2E653630A24160014F94C961F6`.
- Sem sessão A/B; nenhum ganho declarado.

### Transição de LOD por grupo

- `DrawObjectsInstanced` atualizava `blendFactor` dentro do loop de membros; como a lista compartilha um único `SortObject`, uma lista com N membros podia avançar o blend N vezes no mesmo frame.
- Corrigido para calcular o coeficiente uma vez e atualizar o blend uma vez por grupo, depois de percorrer os membros (`scene.cpp:6144-6190`).
- Restore point: `restore-points/fps-lod-group-before-edit-20261115-191628`; `scene.cpp` original `C46E6C36049BC9373CD13C69C17245817B2F0981B0580EF967567EAE44F62749`.
- Efeito esperado: transição de LOD consistente; impacto em FPS possivelmente pequeno.

### Agrupamento de seções adjacentes no draw individual

- Implementado em `lib/shapeDraw.cpp`: seções contíguas com `PolyProperties` iguais e os mesmos `_minBoneIndex`/`_bonesCount` são agrupadas; não atravessa seção oculta/proxy, UV animado nem passes de crateras.
- Scope `dSec` sob `cuDrw` mede draws e seções agrupadas.
- Build Profile: `DayZ045-fps-drawsections-group-profile-20261115-2120`, `DayZProfile.exe` SHA-256 `EBF453D99B646E7C6397255097224F084B0AF24D57592003A366ACB6B7C7B07C`.
- Restore point: `restore-points/fps-drawsections-group-before-edit-20261115`; `shapeDraw.cpp` original `4BDD66170DFE51EFF8B1EDC36EF350E4AD09C7F18E8938F65946A727007F12CE`; atual `43820FEDE60246817043A66345BA6B0F36173BBE33D3532A132AF454107C03FD`.
- Sem A/B; não foi adotado como correção principal.

### Índice de texturas por shape (`_texAreaDraw`)

- Novo índice separado do `_texArea` do landscape, sem divisão por escala UV, com AOT saturado em `1e20f` e invalidação explícita em `Shape::Clear`, `FindSections`, `SetAsOneSection`, `SetUniformMaterial` e `RecalculateAreas`.
- `TexAreaIndex::Item` guarda `_z2Scale` e `_forceMipmap0`; `BuildTexAreaDrawIndex()` monta o índice após a criação do vertex buffer; `PrepareTextures` prefere `_texArea`, depois `_texAreaDraw`, e mantém o caminho antigo em `prpSc`.
- Build Profile: `DayZ045-fps-texarea-draw-index-profile-20261117`, `DayZProfile.exe` 16.122.368 bytes, SHA-256 `826C348CC505A8652AEDE671D25D3D71270598C516C03C99DB1F83A8D0394DEB`; PDB `D916E6A7237458D298644489D1013DEC61D75CE32936B83A904198435636017B`; MAP `483B2513397E0A464EA3C2694CE8E9BB2B03DCE9DF7C6A6DC18E50EDAAFF71B7`.
- Fontes: `shape.hpp` `18CF428F39675B1C889AF91166C2E44ED277A5BCDDDE02B4CBFB0C877789D5C8`; `shape.cpp` `20CF4261444001EAA6507A6DB6C0C74C67439B99F52EEBFBFB68C64C15E5CACA`; `shapeDraw.cpp` `F274A05635D993C1A69CD50B4149FC80F71C72F0771D06B258E165F9B095774D`.
- Correções de ambiente da build: `openlpc.cpp` com `openlpc_round` + `lrintf`; Bullet de `_MSC_VER=1900` trocada por libs 1600; Simul trocada por VC10 Static Release; `legacy_stdio_definitions.lib` e `crtCompat.cpp` removidos do `lib2010.vcxproj` para evitar `LNK2005`/`LNK1104`.
- Sem medição de FPS; a hipótese era reduzir `prpSc` e aumentar `prpIX`.

### Scopes de profiling adicionados

- Objeto individual: `obAni` (animação), `obLit` (luzes), `obTex` (texturas), `obShp` (shape/draw).
- Instancing: `inTex`, `inDrw`.
- Textura: `prpIX` (caminho do índice), `prpSc` (varredura por seção).
- Mundo: `wGrd` (grade), `wCel` (célula).
- D3D9: `d9HW`/`d9FB` (caminho acelerado/fallback), `d9HWc`/`d9HWi`/`d9FBc`/`d9FBi` (contadores), `d9SR` (faixas de seção).
- Draw individual: `dSec` (seções agrupadas).

### Builds de diagnóstico (Profile)

| Build | Artefato | SHA-256 |
|---|---|---|
| `DayZ045-fps-object-render-scopes-profile-sln-20261115` | `DayZProfile.exe` 16.051.200 bytes | `BF704538DB4EB408DAF5D8BA90028FA62F077E7DE919C3B6DB908A8A99C9AFA7` |
| `DayZ045-fps-texture-branch-profile-20261116` | `DayZProfile.exe` 16.053.248 bytes | `4832A3C467D28924D8727A6CB1E7979B237C61442A79A49AB7CE6B80213406E4` |
| `DayZ045-fps-world-prep-grid-profile-20261116` | `DayZProfile.exe` 16.053.248 bytes | `A6298CF0C217C8ACDFEEFFFFCDF148EFE465403496A2F8E6E09EB3ACF9D73FE7` |
| `DayZ045-fps-d3d9-instancing-profile-20261116` | `DayZProfile.exe` 16.054.272 bytes | `53B27D2ADF20EECCE0F9190B9825CD9959A614337EC86FBAA9EFB0281DF0A407` |
| `DayZ045-fps-fallback-section-runs-profile-20261116` | `DayZProfile.exe` 16.056.320 bytes | `0BBA3DC8522D07101392C444CEE5E04F3AFBECEA9B7EBE2965C79B563383FF55` |
| `DayZ045-fps-texarea-draw-index-profile-20261117` | `DayZProfile.exe` 16.122.368 bytes | `826C348CC505A8652AEDE671D25D3D71270598C516C03C99DB1F83A8D0394DEB` |

Essas builds serviram para medir caminhos (textura, instancing, grade, seções), mas o usuário rejeitou transformar o trabalho em uma maratona de profiler. A decisão foi cortar direto no caminho de submissão dos objetos e validar em jogo. Nenhum ganho foi declarado a partir delas.

## O que já foi descartado

- **Sombra e distância de visão:** o usuário rejeitou explicitamente. `shadowQuality`, `shadowZDistance`, cascatas, `sceneComplexity` e `viewDistance` não são a causa que está sendo corrigida.
- **Vsync:** o teste é sempre com `VSync=0`.
- **Garbage collector:** `FreeOnDemandGarbageCollect` é inline vazio nesta configuração (`El/FreeOnDemand/memFreeReq.hpp:684-689`); as chamadas em `MergeInstances` não fazem coleta e não explicam a queda.
- **Ativar o índice de textura global sem proteção:** o comentário histórico em `Shape::CheckPushbufferCanBeUsed` registrava `areaOTex == INF` e floating-point trap em `Texture::PrepareAndCheckMipmapLevel()`; ativar sem índice separado e sem saturação de AOT poderia reintroduzir crash/corrupção de mipmap.
- **Trocar `UOWait` por `UONoWait` sem prova:** mudaria a política de carregamento e poderia causar pop-in/ausência de objetos.
- **Declarar ganho pelo F:** o FPS subiu porque parte da cena não foi desenhada. Isso não conta.

## Pastas, builds e arquivos

### Builds principais

| Build | Configuração | Executável | SHA-256 |
|---|---|---|---|
| `DayZ045-fps-depthprime-lean-retail-20261117` | Retail/Win32 | `DayZ.exe` 11.567.104 | `F279A9FEE966F0766B0C1C9E4DE3E88D9C48AAFCF7623239F931AF3CE1613B9C` |
| `DayZ045-fps-noprime-retail-20261117` | Retail/Win32 | `DayZ.exe` 11.567.104 | `34CA9C61F8A974E41E27735F3EE8D2EE180C09A17AE1AB3C8F4CDDE82CEA5E26` |
| `DayZ045-fps-noprime-noshadowcoef-retail-20261117` | Retail/Win32 | `DayZ.exe` 11.567.104 | `89264F51294BD9A0CA9B6EE8EFDA81244D264DF63EF8535AEDA030102CAEDA39` |
| `DayZ045-fps-primelightlean-retail-20261117` | Retail/Win32 | `DayZ.exe` 11.567.104 | `14E21045C65B40717895780318DD2F2C1AA29C53ED4BA79AB61C759E9F1474D6` |
| `DayZ045-fps-colorinstance-retail-20261117` | Retail/Win32 | `DayZ.exe` 11.568.128 | `BCEE389B1A9C7496016853AD3ADC639B9846CE9687F4AB8670B723F1CA7FCB95` |
| `DayZ045-fps-noprimeobjects-release-20261117` | Release/Win32 | `DayZInt.exe` 13.916.672 | `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB` |
| `DayZ045-fps-noprimeobjects-release-f2-20261118` | Release/Win32 | `DayZInt.exe` 13.916.160 | `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE` |

### Runtime de teste F2

`BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118`

- `DayZInt-ORIGINAL-v37-clean.exe` — original Release, 13.640.192 bytes, SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22`.
- `DayZInt-F.exe` — F quebrado, 13.916.672 bytes, SHA-256 `7C71EA457671EDBCA91F25297981075840FD2506FFE1DE7ACE16FFD7475312EB`.
- `DayZInt-F2.exe` — F2 corrigido, 13.916.160 bytes, SHA-256 `04BEB7A5F29BE963DFFA6A0A612D26F8AAE54CACA02E9EB765EAE58C93EF37AE`.
- `DayZInt-F2.pdb` / `DayZInt-F2.map` — símbolos com hash conferido.
- `Start-DayZ-Original.bat`, `Start-DayZ-Release-F.bat`, `Start-DayZ-Release-F2.bat`.
- `perfil-janela` — perfil do teste.
- `Addons`, `BattlEye`, `bin`, `dll`, `dta`, `Keys` — junctions para `build\inventory-menu-v10\package-v38-pause-menu`.
- `README-FPS-F2.txt` — instruções e ficha do teste.

### Pacote V38 e assinatura

- `Addons\ui.pbo`: 48.349.274 bytes, SHA-256 `EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500`.
- O `ui.pbo` não tem `ui.pbo.dayz.bisign`; por isso o Retail recusa e o Release aceita.
- O jogo base usado nas junctions é `package-v38-pause-menu`; o teste não copia PBOs para `dist`.

### Fontes e restore points

| Candidato | Arquivos principais | Restore point |
|---|---|---|
| A | `object.cpp`, `d3d9/engdd9.cpp` | `restore-points/fps-depthprime-lean-before-edit-20261117-120927` |
| B | `d3d9/engdd9.hpp`, `d3d9/engdd9.cpp`, `landscape.cpp`, `world.cpp`, `engine.hpp` | `restore-points/fps-rmzprime-removal-before-edit-20261117-1235` |
| C | `scene.cpp` | `restore-points/fps-prime-shadowcoef-before-edit-20261117-1340` |
| D | `scene.cpp` | `restore-points/fps-prime-lightgrid-before-edit-20261117-1330` |
| E | `engine.hpp`, `engineDraw.cpp`, `d3d9/engdd9.hpp`, `d3d9/engdd9.cpp` | `restore-points/fps-colormaterial-before-edit-20261117-1325` |
| F | `scene.cpp`, `scene.hpp`, `landscape.cpp` | `backup-fps-f-20261117-164157` |
| F2 | `d3d9/engdd9.cpp`, `scene.cpp` | `backup-fps-f2-20261118-003054` |

## Próximos passos

> A frente está **pausada aqui**. O roteiro completo, com o estado dos artefatos e o que não repetir, está em **Ponto de retomada**. Em resumo:

1. Comparar **F2 vs Original** no mesmo ponto para confirmar as regressões de grama e sombra. Se forem só da F2, descartar a F2 como correção visual.
2. Compilar **A+B+C+D+E em Release**, a partir de `backup-fps-f-20261117-164157`, e testar contra o Original no mesmo ponto de Berezino, vsync off, cena completa. Essa sequência preserva o depth prepass e nunca foi medida.
3. Se A–E não pagar, **medir o passe de cor** (`Scene::DrawObjectsInstanced`, `Object::Draw`, `Shape::DrawSections`) antes de cortar. O alvo seguinte é material/textura por objeto único e o preparo 1x por run no caminho `nInstances==1`.
4. Não usar o FPS do F como referência e não testar Retail com o V38 sem assinatura.
5. Só declarar ganho com A/B no mesmo ponto, cena completa e RPT limpo.

## Artefatos e documentação

- Auditoria técnica: `SOURCE DEFINITIVA\DayZ-0.45.124252\Docs\performance\FPS_URBAN_AUDIT_2026-11-15.md`
- Folha de teste: `BuildOutput\FPS-AB-TEST-20261117.txt`
- Prints do teste F: `site\public\fps-2026-11-18\f-teste-01.jpg` … `f-teste-06.jpg`
- Prints do teste F2: `site\public\fps-2026-11-18\f2-teste-01.jpg` (setas) e `f2-teste-02.jpg` (janela)
- Build F: `BuildOutput\DayZ045-fps-noprimeobjects-release-20261117`
- Runtime F: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-20261117`
- Build F2: `BuildOutput\DayZ045-fps-noprimeobjects-release-f2-20261118`
- Runtime F2: `BuildOutput\DayZ045-fps-noprimeobjects-release-runtime-f2-20261118`
- Restore point F: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f-20261117-164157`
- Restore point F2: `SOURCE DEFINITIVA\DayZ-0.45.124252\backup-fps-f2-20261118-003054`

> **Regra da frente:** nenhum número de FPS vale se a cena estiver incompleta. Primeiro o personagem, as casas, as árvores e a grama; depois o ganho.
