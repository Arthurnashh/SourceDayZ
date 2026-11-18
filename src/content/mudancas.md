# Mudanças feitas nesta source

> Esta árvore **não é mais código original intocado**: ela foi modificada, compilada e
> testada. Os itens abaixo foram lidos no código atual e comparados com os snapshots em
> `backup-*`/`build/inventory-menu-v10/restore-point-*`. Onde não há registro de teste
> dentro do jogo, está marcado `[pendente de validação]`.

## 1. O build realmente acontece (e não é v100)

O projeto declara `v100` (`lib/lib2010.vcxproj:118,123`), mas nesta máquina o build roda
com **v141 por override**. Prova no log: `build/inventory-menu-v10/cpp-build-release-v31.log:1`
— `Microsoft (R) Build Engine versão 15.9.30` (MSBuild do VS2017) e, no fim do mesmo log,
`Microsoft (R) COFF/PE Editor Version 14.16.27054.0`, terminando em:

```text
lib2010.vcxproj -> ...\build\inventory-menu-v10\cpp-out-v31\DayZInt.exe
```

| Item | Valor |
|---|---|
| Compilador | MSVC 14.16 (v141), `cl.exe` em `VS2017\Community\VC\Tools\MSVC\14.16.27023` |
| Orquestrador | MSBuild 15.9.30 |
| SDK | Windows 10.0.19041 |
| DirectX | **continua DX9** (`lib/d3d9/`), sem migração para DX11 |
| Saída | `build/inventory-menu-v10/cpp-out-v31/DayZInt.exe` |

Para o código de 2001 compilar em v141 foi preciso mexer em headers antigos — todos
preservados em `backup-v141-compat-20261116/`:

- `El/Math/math3dp.hpp` — 42 KB
- `Enfusion/include/common/enf_mathlib.h` — 105 KB
- `Es/Containers/typeopts.hpp`
- `lib/appName.h`, `lib/wpch.hpp`, `lib/SimulWeather/SimulWeatherDX9.hpp`
- `lib/fsmEntity.cpp`, `lib/gameDirs.cpp`, `lib/main.cpp`, `lib/person.cpp`,
  `lib/vehicleAI.cpp`, `lib/world.cpp`, `lib/winapp.cpp`
- `lib/Network/networkClient.cpp`, `networkMsg.cpp`, `networkObject.hpp`, `networkServer.cpp`
- `lib/UI/displayUI.cpp`, `lib/UI/inGameUIDraw.cpp`

Avisos que continuam no log (não são erros):

- `C4005` — `DXGI_ERROR_*` redefinido entre `extern/DXSDK/include/dxgitype.h` e
  `Windows Kits\10\Include\10.0.19041.0\shared\winerror.h` (DXSDK 2010 vs SDK 10).
- `C4477` em `lib/d3d9/txtd3d9.cpp:3843` (`sprintf` com `%d` e argumento de outro tipo).
- `LNK4217` — `_floor` importado localmente por `xapobased.lib`.

## 2. Correr inclinado com Q/E — feito

`lib/soldierOld.cpp:17190-17250`, em `Man::RecalcLeaningTransform()`.

O problema: os mapas de animação de corrida rápida/strafe **não definem** os offsets de
inclinação (`GetLeanRRot`/`GetLeanRShift`), então segurar Q/E em movimento virava no-op.

A correção tem duas partes:

**Parte 1 — fallback para o mapa de parada** (`soldierOld.cpp:17212-17237`). Se os offsets
do mapa atual são zero, pega o `ManActStop` da mesma família de movimento e reusa os offsets.

```cpp
// Some locomotion action maps (notably fast/strafe variants) omit the
// lean offsets even though the stop map for that same movement family
// defines them. Reuse those offsets so Q/E remain an additive pose while
// running instead of silently becoming a no-op.
if (fabs(leanRotAngle) < 1e-6f && fabs(leanShift) < 1e-6f)
{
  const MoveIdExt &stopMove = type->GetMove(map, ManActStop);
  ...
}
```

**Parte 2 — preservar o pedido do jogador** (`soldierOld.cpp:17245-17250`). Clipes de
locomoção rápida zeram `LeaningFactor`; se Q/E está pressionado, força o fator para 1.

```cpp
if (fabs(_leanZRot) > 0.01f && leaningFactor < 1e-4f)
  leaningFactor = 1.0f;
```

Estado anterior preservado em `backup-lean-strafe-20261116-065525/lib/soldierOld.cpp`
(diff real: 24.115 → 24.148 linhas). `lib/mainInput.cpp` e `lib/soldierOld.hpp` **não**
mudaram — a inclinação já era dirigida por `_leanZRot`, o que faltava era a pose.

## 3. Zumbi atravessando parede — feito

`lib/zombie.cpp:1068-1145` (varredura de movimento do `Man`).

Três causas e três correções:

| Causa | Correção | Linha |
|---|---|---|
| `IsPassable()` é limiar de **massa** (<10), não regra de mapa — construções estáticas passavam | zumbi respeita **qualquer** hit de geometria estática (`obj->Static()`), mesmo passável | `:1068-1077` |
| Início do movimento já sobreposto gera `under == 0` e não é tempo de entrada; clampar em 1% prendia o zumbi sobreposto | sobreposição inicial vira caso ambíguo e é entregue ao solver de corpo | `:1082-1099` |
| Margem de 1% do passo ainda empurrava para dentro em passos curtos | margem fixa de `0.005` e reposicionamento em `minT` | `:1138-1144` |

```cpp
const bool zombieStaticWorldBlock = isZombie && obj->Static();
if (obj->IsPassable() && !zombieStaticWorldBlock)
  continue;
```

Diagnóstico embutido, limitado a 1 log/s no servidor:

- `[ZombieCollisionDiag]` — `zombie.cpp:1126-1137`
- `[ZombieCollisionStartOverlap]` — `zombie.cpp:1112-1124`

Artefatos de teste: `lib/lib/build/zombie-collision-diag-v102/`, `-v103`, `-v120`, `-v121`,
`-v123`; executáveis em `dist/server/` (`DayZServer-ZombieCollisionFix.exe`,
`DayZInt-ZombieCollisionFixV120.exe`, `DayZServer-ZombieStuckCollision.exe`).

## 4. Inventário: rotação de item e mãos

**Rotação** — espaço gira o item, e a rotação é replicada pelo servidor:

| Etapa | Arquivo:linha |
|---|---|
| Entrada do jogador | `lib/UI/uiMap.cpp:6544-6549` — `CItemBase::RotateInventoryItem` |
| Envio ao servidor | `lib/Network/networkClient.cpp:7669` — `AskForRotateInventoryItem` |
| Definição da mensagem | `lib/Network/networkImpl.hpp:370` — `DECLARE_NET_MESSAGE(AskForRotateInventoryItem, ...)` |
| Handler do servidor | `lib/Network/networkServer.cpp:6796` |
| Estado replicado | `lib/Network/networkClient.cpp:4519` — `IsInventoryRotated()` |
| Interface | `lib/Network/network.hpp:1093` (virtual puro), `:1411` (tabela de mensagens) |

**Tecla de espaço no inventário** — `lib/UI/uiContainers.cpp:2166-2175`:

```cpp
// Buttons activate on key release. Consume Space here too, otherwise a
// stale/default-button press can close the inventory after its keydown was
// already handled as an item-rotation request.
if (dikCode == DIK_SPACE && IsInventoryOpened())
  return true;
```

Sem isso, girar o item com espaço fechava o inventário pelo botão default.

**Mãos (`Hands`)**: iterações para sincronizar o item do slot quando movido para calça,
camisa, mochila ou `Vicinity`, e para não repetir o cancelamento de ação ao fechar a tela.
Pacotes `package-v10` a `package-v13` em `build/inventory-menu-v10/`.

## 5. Menu inicial, pausa e navegador de servidores

Trabalho em andamento, com 31 pacotes versionados (`package-v10` … `package-v31`) e um
`restore-point-*` antes de cada etapa.

- `lib/UI/optionsUI.cpp:7409` — estatísticas deixaram de ser texto fixo
  (`"NOT SYNCED"` → valores `"0m"`/`"0"`), ainda como placeholder até virar dado real.
- `lib/UI/optionsUI.cpp:7518` — posição/tamanho do controle do mod launcher no layout do menu.
- `cfg/Bin/rscScreen.hpp` — layout das telas (`RscDisplayMultiplayer`, inventário).
- `ui.pbo` editado direto; sem depender de `@MenuCleanup`.

Abas `OFFICIAL` / `COMMUNITIES` / `LAN`: a V29 corrigiu o tipo nativo das abas e os
controles de voltar/jogar, e o `config` passou em `CfgConvert -test`.

`[pendente de validação]` — conferir no jogo as três abas, ausência de sobreposição legacy,
fundo 3D e o conectar; e no inventário, uma única interface sem mockup duplicado.

## 6. Crash ao entrar (material/textura) — V30/V31

- V30: validações em `TextureD3D9::GetPixel`, `GetRect` e `RequestGetRect`
  (`lib/d3d9/txtD3D9.cpp`) para não dividir por zero com mip inválido.
- V31: o assert que sobrava vinha de `TextBankD3D9::UseMipmap` — passou a validar
  `_nMipmaps` e limitar `level`/`levelA` antes do assert.
- Restore points: `restore-point-v30-before-texture-guard-20261116/` e
  `restore-point-v31-before-invalid-mip-level-20261117/`.

## 7. Disciplina de versão (o que torna isso auditável)

- **Snapshots por mudança**: `backup-<tema>-<data-hora>/` guarda só os arquivos tocados.
- **Restore points por build**: `build/inventory-menu-v10/restore-point-vNN-*/` guarda
  fonte + EXE + MAP (+ PDB) anteriores.
- **Pacotes isolados**: cada `package-vNN` é uma instalação jogável separada, com launcher
  e perfil próprios — não sobrescreve `dist/` nem `Addons/` de origem.
- **Hashes**: `HISTORICO-CORRECOES-E-PENDENCIAS.md` registra SHA-256 de EXE, `ui.pbo` e
  `worlds_chernarusplus.pbo` por versão.

Isso responde a pergunta prática: dá para trabalhar nesta source com segurança porque
existe rollback medido, não porque o código é fácil.

## 8. Navegador de servidores: a causa real dos 10 "Error loading control" — V34

O navegador não estava "sem layout": os 10 controles da tela **nem eram criados**, porque
um valor de `sizeEx` quebrava a avaliação da expressão e a exceção era engolida.

**Cadeia medida no código**

- `lib/UI/uiControls.cpp:5834` — o construtor do botão faz `_size = cls >> "sizeEx"`
  (o mesmo em `:2536`, `:5171`, `:5878`).
- `El/ParamFile/paramFile.cpp:1772-1782` — se o valor não é número, cai em
  `_file->EvaluateFloat(_value)`.
- `El/Evaluator/evaluatorExpress.cpp:46-56` — resultado nulo dispara
  `LogF("Warning: Cannot evaluate '%s'")` + `ERROR_THROW(ErrorInfoText, "Cannot evaluate value")`.
- `lib/UI/uiContainers.cpp:497-508` — o `LoadFromEntry` captura com `ERROR_CATCH_ANY`
  e só registra `Error loading control %s`; o display continua sem aquele controle.

**Prova no log de execução**

`package-v32-terrain-menu-repair/profile-terrain-menu-v32/debug.log`:

| valor | ocorrências |
|---|---|
| `Size_Text_Very_Small` | 10 |
| `Size_Text_Small` | 8 |
| `Size_Text_Medium` | 2 |

São 20 avisos porque a tela é construída duas vezes (entrada + retorno da missão), e no
`DayZInt.RPT` isso aparece como 10 erros em `:1076-1085` e mais 10 em `:1161-1170`:
`RscDisplayMultiplayer/controls/ButtonInternet`, `ButtonFavorite`, `ButtonLAN`,
`B_Cancel`, `B_Join`, `BrowserLabelName/Ping/Password/Full/BattlEye`.

Os quatro `BrowserLabel*` não têm `sizeEx` próprio: herdam o valor quebrado de
`BrowserLabelName`, por isso falham junto — 6 valores inválidos explicam exatamente
10 controles ausentes.

**Correção aplicada (V34)**

- `ui.pbo` → `RscDisplayMultiplayer`: `sizeEx` voltou a ser número
  (`Very_Small=0.022`, `Small=0.027`, `Medium=0.033`).
- `dta/bin/config.bin` → `RscDisplayMain`: os `DZ_MenuSlot*` usavam
  `idc="IDC_MAIN_MENU_SLOT_*"` (texto literal, avaliado como variável e inexistente).
  Trocado pelos valores de `lib/UI/resincl.hpp:630-632`: `12025` (prev), `12027` (name),
  `12026` (next) — isso remove os 3 erros de `DZ_MenuSlotPrev/Name/Next` e devolve os
  controles usados por `lib/UI/optionsUI.cpp:7399`.
- `prefix` de cada PBO preservado (`DZ\ui\` e `bin\`), listas de arquivos conferidas
  (843 e 13 arquivos), `CfgConvert -txt` de verificação sem nenhum resto de
  `Size_Text_*`/`IDC_MAIN_MENU_SLOT`.
- Pacote: `build/inventory-menu-v10/package-v34-sizefix/` (hardlinks do V33 + os dois
  PBOs novos), launcher `Start-DayZ-V34-SizeEx-Fix.bat`.

`[pendente de validação]` — abrir o navegador no V34 e confirmar as três abas, os rótulos
laterais e o retorno da missão sem tela congelada.

**Validação parcial (17/11, 02:20)** — primeira execução do V34:

- `profile-v34-sizefix/DayZInt.RPT` com **0** `Error loading control` (antes: 10 por
  construção, 20 no total do arquivo) e **0** `Size_Text_*`.
- `debug.log` sem nenhum `Cannot evaluate 'Size_Text_*'` (antes: 20).
- O cliente ficou ~140 s compilando shaders (`D3DXCompileShader VSShaderPool`) e o
  Windows marcou "não respondendo" — é o comportamento normal deste build DX9 no
  primeiro boot, não travamento: o `debug.log` continua crescendo e o processo volta a
  responder sozinho (`Fill Objects took 12813 ms`, `Visibility set to 3000`).
- `Error: Binarize missed persistence for 'Land_A_FuelStation_Feed'` (10×) é ruído de
  arte, já existia antes e não bloqueia a UI.

`[pendente]` — confirmar em tela as três abas e o retorno da missão.

`[hipótese forte]` o "personagem travado" é consequência disso: em
`profile-terrain-menu-v32/DayZInt.RPT:1153` o cliente sai de `PLAYING` para
`MISSION ASKED` e reconstrói o navegador; como todos os controles falhavam, o display
subia vazio sobre o mundo congelado — sem HUD e sem input.

## 9. Personagem anima mas não anda: `upDegree` lido como número — V35/V36

O sintoma era o mais enganoso possível: **o personagem executava o ciclo de caminhada e o
pulo, a câmera orbitava, o inventário abria — mas a posição não mudava**. Nada de crash,
nada de erro na tela. Só um corpo animando no lugar.

### 9.1 O que o log mostrou

Instrumentação temporária em `lib/soldierOld.cpp` e `lib/simul.cpp` (removida depois),
gravando uma linha por segundo no `DayZInt.RPT`:

```
DIAGMOVE t=... pos=13309.50,8.88,5356.29 pot=13309.50,8.88,5356.29 spd=0.00,0.00,0.00
         wW=0.00,0.00 fine=0 ctrl=1 land=1 obj=0 stat=1 rs=0 chg=1
DIAGANIM t=... move=-0.0000,-0.0000 info=-0.0000,-0.0000 adj=1.000 rel=-0.000,-0.000
         minmax=0.000,1000.000 pf=1.000 prim=<none> manual=1 dc=1
```

Três coisas gritavam:

| campo | valor | leitura |
|---|---|---|
| `prim` | `<none>` | nenhum move primário na fila |
| `info` | `0.0000,0.0000` | `AdvanceMoveQueue` não devolve deslocamento |
| `minmax` | `0.000,1000.000` | default de `GetRelSpeedRange` **sem** move info |

E o detalhe que fechou o caso: **no menu o mesmo log mostrava `prim=menu_idleunarmed0`**.
Ou seja, a máquina de moves funcionava — ela só não achava o move do jogador em pé.

### 9.2 A causa: string onde o código espera `int`

O config de animações escreve o campo `upDegree` como **nome**:

```cpp
// anims/CfgMovesMaleSdr2 (convertido para texto)
class KnockedDownActionsCivilLeft: NoActions
{
  ...
  upDegree="ManPosNoWeapon";
};
```

Mas o construtor do `ActionMap` lia direto para `int`:

```cpp
// lib/motion.cpp:58 (antes)
_upDegree = e >> "upDegree";
```

`ParamRawValue::GetInt()` só entende número (`El/ParamFile/paramFile.cpp:1784-1804`):
tenta `ScanInt`, depois `ScanFloat`, e por fim joga a string no avaliador de expressões,
que não conhece `ManPosNoWeapon` e devolve **0**. Resultado: **todos** os action maps
ficavam com `_upDegree = 0`.

A prova estava no `debug.log` do perfil, com **345** avisos:

| valor | ocorrências |
|---|---|
| `manposcombat` | 112 |
| `ManPosCrouch` | 93 |
| `ManPosNoWeapon` | 93 |
| `ManPosLying` | 25 |
| `ManPosLyingNoWeapon` | 13 |
| `ManPosSwimming` | 5 |
| `ManPosDead` | 2 |
| `ManPosHandGunStand` | 1 |
| `ManPosStand` | 1 |

### 9.3 A cadeia do travamento

1. `Man::GetAutoUpDegree()` (`lib/soldierOld.cpp:15911-15918`) devolve `ManPosNoWeapon`
   (valor **12** no enum `ManPos`, `lib/soldierOld.hpp:818-838`).
2. `MotionType::GetMove(upDegree, index)` (`lib/motion.cpp:758-776`) varre os action maps
   e só aceita `map->GetUpDegree() == upDegree`. Como todos valiam `0`, devolve
   `MoveIdExt::none`.
3. `Man::ResetMovement` (`lib/soldierOld.cpp:4219-4250`) grava esse `none` como move
   primário — e `ResetMovement(0)` usa `ManActDefault` com `init = true`
   (`:4305-4311`), então o estado inicial já nascia vazio.
4. `KeyboardPilot` faz `map = Type()->GetActionMap(primary)` (`:15561`). Sem move info,
   `MovesTypeBase::GetActionMap` devolve `NULL` (`lib/motion.cpp:1206-1211`).
5. Com `map == NULL`, `moveWanted = GetDefaultMove()` (`:15820`), e `GetDefaultMove()`
   chama `GetMove(deg, ManActDefault)` — de novo `none`
   (`lib/soldierOld.hpp:388-393`).
6. `SetMoveQueue(none)` nunca sai do estado vazio → `AdvanceMoveQueue` não tem move
   primário → `info.moveX/moveZ = 0` → **sem translação**. A animação continuava porque
   vem de outro caminho (direct control / blend).

Não era root motion: os 2028 RTMs de `anims.pbo` foram lidos em formato BMTR e a faixa de
velocidade estava correta (walk 1,1–1,5 m/s; run 2,6–4,1 m/s). Também não era colisão
estática (`stat=1` é valor pessimista de `CreatePotentialState`, lido antes do teste), nem
`remoteState` (`rs=0`), nem o bloco `frozen` (`ctrl=1`).

### 9.4 A correção (V36)

Uma função de decodificação em `lib/motion.cpp`, antes do construtor do `ActionMap`:

```cpp
static int DecodeUpDegree(RStringB value)
{
  static const char *names[] =
  {
    "Dead", "Weapon", "BinocLying", "LyingNoWeapon", "Lying",
    "HandGunLying", "Crouch", "HandGunCrouch", "Combat",
    "HandGunStand", "Stand", "Swimming", "NoWeapon", "Binoc", "BinocStand",
  };
  const char *text = value;
  if (!text || !*text) return 0;

  // aceita "ManPosXxx" e "Xxx", sem diferenciar maiúsculas/minúsculas
  const char *shortName = text;
  if (!strnicmp(text, "ManPos", 6)) shortName = text + 6;
  for (int i = 0; i < (int)(sizeof(names) / sizeof(*names)); i++)
  {
    if (!strcmpi(shortName, names[i])) return i;
  }

  // valores numéricos (inclusive -1 de NoActions) continuam válidos
  char first = text[0];
  if ((first >= '0' && first <= '9') || first == '-') return atoi(text);

  RptF("Unknown upDegree '%s'", text);
  return 0;
}
```

e a leitura passa a ser:

```cpp
_upDegree = DecodeUpDegree(e >> "upDegree");
```

Detalhes que importam:

- A ordem do array **é** o enum `ManPos` (`soldierOld.hpp:818-838`): `Dead=0`, `Weapon=1`,
  …, `NoWeapon=12`, `BinocStand=14`.
- `strcmpi`/`strnicmp` já existiam em `El/platform.hpp:174-176` e são o mesmo padrão usado
  para `bodyPosition` em `soldierOld.cpp:12999-13009` — o resto do motor já tratava campos
  textuais assim; só o `upDegree` tinha ficado para trás.
- O config usa `manposcombat` em minúsculas em 6 classes, então a comparação
  case-insensitive não é luxo.
- `upDegree=-1` (3 classes) e `upDegree=0` (1 classe) continuam entrando pelo ramo
  numérico, sem regressão.

### 9.5 Validação medida

`package-v34-sizefix/profile-v36-updegree/DayZInt.RPT`, com o exe V36:

```
DIAGMOVE t=87.75 pos=13309.75,8.87,5355.83  spd=0.00  prim=aidlpercmstpsnonwnondnon
DIAGMOVE t=88.76 pos=13307.98,9.30,5354.71  spd=1.46  prim=amovpercmstpslowwnondnon
DIAGMOVE t=90.78 pos=13313.47,8.18,5355.67  spd=6.80  prim=amovpercmevasnonwnondf
DIAGMOVE t=91.78 pos=13319.79,7.45,5358.28  spd=6.95  prim=amovpercmevasnonwnondfr
```

| | antes | depois |
|---|---|---|
| `pos` | fixa em `13309.50,8.88,5356.29` | muda a cada segundo (~6 m/s) |
| `prim` | `<none>` permanente | `amovpercmstpslowwnondnon` → `amovpercmevasnonwnondf` |
| `info` | `0.0000,0.0000` | `0.0668,0.0866` |
| `minmax` | `0.000,1000.000` | `0.850,1.000` |
| `spd` | `0.00,0.00,0.00` | `6.80`, `6.95` |
| `Cannot evaluate 'ManPos*'` | 345 no `debug.log` | **0** (`debug.log` 0 bytes) |
| `Unknown upDegree` | — | **0** (todos os nomes reconhecidos) |

### 9.6 Versões e arquivos

- **V36** — exe com patch + instrumentação DIAG (`DayZInt-v35-diag.exe` é o anterior
  instrumentado sem patch; `DayZInt-v34-backup.exe` é o V34 limpo).
- **V37** — exe **limpo**: patch mantido, instrumentação removida
  (`DayZInt-v37-clean.exe`, SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C`,
  13.639.680 B).
- Launchers: `build/ABRIR-DAYZ-V36.bat` (instrumentado) e
  `build/ABRIR-DAYZ-V37.bat` (limpo).
- Restore points:
  - `build/inventory-menu-v10/restore-point-v36-updegree-20261117/motion.cpp`
    (original, SHA-1 `E2BF90EFB071826AFD77DCB2EBA34B0E1838A4A0`)
  - `…/motion-PATCHED-updegree.cpp` (com a correção)
  - `build/inventory-menu-v10/restore-point-v35-diagmove-20261117/` (`soldierOld.cpp` e
    `simul.cpp` originais, usados para remover a instrumentação sem perder mais nada — o
    diff era só inserção: +57 e +15 linhas).
