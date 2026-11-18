# Bugs corrigidos

**12 bugs corrigidos**, **1 aberto** (lanterna + pilha) e **7 investigações encerradas sem
patch**. Cada item traz o sintoma que aparecia no jogo, a causa medida no código ou no log e
a correção que entrou na build.

## 1. Personagem animava, mas não andava

**Sintoma:** o corpo fazia o ciclo de caminhada e o pulo, a câmera orbitava, o inventário
abria — e a posição não mudava. Sem crash e sem erro na tela.

**Causa:** o config escreve `upDegree="ManPosNoWeapon"` (texto), mas o construtor do
`ActionMap` lia direto para `int` (`_upDegree = e >> "upDegree"`). O avaliador não conhecia o
nome e devolvia **0** para todos os mapas. O `debug.log` tinha **345** avisos
`Cannot evaluate 'ManPos*'`: `manposcombat` 112, `ManPosCrouch` 93, `ManPosNoWeapon` 93,
`ManPosLying` 25, `ManPosLyingNoWeapon` 13, `ManPosSwimming` 5, `ManPosDead` 2,
`ManPosHandGunStand` 1, `ManPosStand` 1.

**Cadeia:** com todos os `_upDegree = 0`, `MotionType::GetMove()` devolvia `none`,
`ResetMovement` gravava `none` como move primário, `GetActionMap` devolvia `NULL`,
`GetDefaultMove()` devolvia `none` de novo e `AdvanceMoveQueue` ficava sem translação. A
animação continuava porque vinha de outro caminho (direct control / blend).

**Correção:** `DecodeUpDegree()` em `lib/motion.cpp`, antes do construtor do `ActionMap`.
Aceita `ManPosXxx` e `Xxx` sem diferenciar maiúsculas, mantém valores numéricos (`-1`, `0`) e
registra `Unknown upDegree` para nome desconhecido.

**Validação:** `pos` passou a mudar ~6 m/s, `prim` saiu de `<none>` para
`amovpercmevasnonwnondf`, `info` de `0,0000` para `0,0668,0,0866`, `minmax` de `0,000,1000`
para `0,850,1,000`, e os 345 avisos foram para **0**. Versão limpa: **V37**
(`DayZInt-v37-clean.exe`, SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C`,
13.639.680 B).

## 2. Zumbi atravessando parede

**Sintoma:** zumbi entrava em construções estáticas e ficava preso dentro.

**Causa:** três problemas na varredura de movimento do `Man` (`lib/zombie.cpp:1068-1145`):
`IsPassable()` é limiar de massa (<10), não regra de mapa — construções estáticas passavam;
sobreposição inicial gerava `under == 0` e não era tempo de entrada; e a margem de 1% do passo
ainda empurrava para dentro em passos curtos.

**Correção:** o zumbi respeita **qualquer** hit de geometria estática (`obj->Static()`), mesmo
passável; sobreposição inicial vai para o solver de corpo; margem fixa de `0.005` com
reposicionamento em `minT`.

**Diagnóstico:** `[ZombieCollisionDiag]` e `[ZombieCollisionStartOverlap]`, limitados a 1 log/s
no servidor. Artefatos `zombie-collision-diag-v102` … `v123`; servidores
`DayZServer-ZombieCollisionFix.exe`, `DayZInt-ZombieCollisionFixV120.exe` e
`DayZServer-ZombieStuckCollision.exe`. O servidor de teste atual é o
`DayZServer-DoorUserTypeExecV127`.

## 3. Inclinar com Q/E não funcionava correndo

**Sintoma:** segurar Q/E parado inclinava; correndo, não fazia nada.

**Causa:** os mapas de corrida rápida/strafe não definem os offsets de inclinação
(`GetLeanRRot`/`GetLeanRShift`), e clipes de locomoção rápida zeram `LeaningFactor`.

**Correção:** em `Man::RecalcLeaningTransform()` (`lib/soldierOld.cpp:17190-17250`), fallback
para o mapa de parada da mesma família de movimento quando os offsets são zero, e preservação
do pedido do jogador (`leaningFactor = 1.0` se Q/E está pressionado).

**Backup:** `backup-lean-strafe-20261116-065525/lib/soldierOld.cpp` (diff de 24.115 → 24.148
linhas). `mainInput.cpp` e `soldierOld.hpp` não mudaram.

## 4. Crash ao entrar no jogo: WRP diferente + mip inválido

**Sintoma:** crash durante o carregamento, em material/textura; o cliente chegava a
`GAME LOADED`, mas caía com `C0000094 INT_DIVIDE_BY_ZERO`.

**Causa 1 — mapa:** o cliente e o servidor usavam `worlds_chernarusplus.pbo` com revisões
diferentes. Cliente V27: revisão **17983**, SHA-256 `0EF016A7…F640`; servidor: revisão **17865**,
SHA-256 `0B8DAD26…8E28`. O WRP extraído também era diferente. O `config.bin` dentro do PBO era
igual, então o desvio era o WRP/revisão.

**Causa 2 — textura:** mip inválido levava a divisão por zero em `TextureD3D9` e o assert
sobrava em `TextBankD3D9::UseMipmap` (`txtd3d9.cpp(4186): Assertion failed 'level >= 0'`).

**Correção:** a **V28** alinhou o `worlds_chernarusplus.pbo` e a assinatura ao servidor
(revisão 17865, 120.164.803 B, SHA-256 `0B8DAD26…8E28`). O crash persistiu, então a **V30**
adicionou validações em `GetPixel`, `GetRect` e `RequestGetRect`, e a **V31** validou
`_nMipmaps` e limitou `level`/`levelA` antes do assert em `TextBankD3D9::UseMipmap`.

**Backups:** `restore-point-v27-before-wrp-align-20261116`,
`restore-point-v30-before-texture-guard-20261116`,
`restore-point-v31-before-invalid-mip-level-20261117`.

**Atenção:** a V31 foi entregue, mas apresentou regressão visual (terreno vermelho/rosa, fundo
3D ausente e seis abas legacy). Ela **não** foi aceita como final; a V32 reparou o terreno e o
menu. Ver bug 5.

## 5. Terreno vermelho/rosa e menu sem cenário 3D

**Sintoma:** depois da V31, o chão aparecia vermelho/rosa, o menu principal ficava sem o
cenário 3D e o navegador mostrava as seis abas legacy (INTERNET/FAVORITES/HISTORY/FRIENDS/LAN/
REMOTE).

**Causa:** o `worlds_chernarusplus_data.pbo` da V31 tinha **509 arquivos diferentes** do
`Addons` atual, incluindo texturas `layers\*_lco.paa`, apesar de os dois declararem revisão
17380. A V31 estava combinando o WRP do servidor (17865) com um pacote de texturas diferente.

**Correção (V32):** o `worlds_chernarusplus_data.pbo` e a assinatura voltaram a ser os do
`Addons` atual; o WRP do servidor permaneceu intacto. O `dta\bin.pbo` passou a definir as abas
nativas `OFFICIAL` / `COMMUNITIES` / `LAN`, com HISTORY/FRIENDS/REMOTE fora da tela e IDs
nativos preservados. O `RscDisplayMain` voltou a executar o `onLoad` nativo, o aviso Early
Access recebeu fechamento imediato e a logo DayZ ficou em um único controle.

**Validação:** a captura da V32.1 mostrou o terreno **verde**, sem o aspecto rosa/vermelho. A
cena 3D do menu, as três abas e o retorno da missão seguem como conferência visual; o pacote
atual é a **V38**.

**Hashes da V32:** EXE `10F94200…CD35`; `dta\bin.pbo` V32.1 `03A7CAD7…CC9D`; dados do mundo
`7DB7A946…087C`; WRP `0B8DAD26…8E28`. Restore point:
`restore-point-v32-before-terrain-menu-repair-20261117`.

## 6. `Unable to open dta\bin.pbo` e `No entry '.CfgAddons'`

**Sintoma:** a primeira V32 não abria o `dta\bin.pbo`; o RPT registrava
`Unable to open dta\bin.pbo`, seguido de `No entry '.CfgAddons'` e `.PreloadAddons`.

**Causa:** o metadado do PBO foi empacotado com `prefix=bin\\` (duas barras literais), mas o
jogo exige `prefix=bin\` (uma barra). O PBO V31 funcional usava uma barra.

**Correção (V32.1):** metadado corrigido para `prefix=bin\`, PBO reempacotado e conferido no
BankRev. O `config.bin` reextraído tem SHA-256 idêntico ao compilado
(`C2D44BC3…CD1D`); o `bin.pbo` corrigido tem SHA-256 `03A7CAD7…CC9D`. Restore point:
`restore-point-v32-cfgaddons-prefix-20261117`.

**Atenção:** o `dta\bin.pbo` do pacote V38 é uma revisão posterior (SHA-256
`59FF087A…074F`), não o V32.1. A regra da barra única vale para qualquer repack.

## 7. Navegador de servidores sem 10 controles

**Sintoma:** tela do navegador vazia, `Error loading control` repetido, mundo congelado atrás.

**Causa:** os controles **nem eram criados**. `sizeEx` valia texto
(`Size_Text_Very_Small`, `Small`, `Medium`) e a avaliação lançava exceção engolida por
`ERROR_CATCH_ANY`. Os quatro `BrowserLabel*` herdavam o valor quebrado de `BrowserLabelName`,
o que explicava exatamente 10 controles ausentes: `ButtonInternet`, `ButtonFavorite`,
`ButtonLAN`, `B_Cancel`, `B_Join` e `BrowserLabelName/Ping/Password/Full/BattlEye`. No menu
principal, `DZ_MenuSlot*` usava `idc="IDC_MAIN_MENU_SLOT_*"` como texto literal.

**Correção (V34):** `sizeEx` voltou a número em `ui.pbo` (`Very_Small=0.022`, `Small=0.027`,
`Medium=0.033`) e os `idc` foram trocados pelos valores de `lib/UI/resincl.hpp:630-632`
(`12025` prev, `12027` name, `12026` next) em `dta/bin/config.bin`.

**Validação:** **0** ocorrências de `Error loading control` e de `Size_Text_*` no RPT do V34
(antes: 10 por construção, 20 no total). Pacote: `package-v34-sizefix`.

## 8. Menu com abas legacy, tipos de controle errados e Early Access

**Sintoma:** o menu novo aparecia, mas mantinha textos/elementos antigos (Early Access,
logo/copyright 2013), perdia rótulos das abas ou ficava com fundo azul sem cenário 3D;
`B_Cancel`/`B_Join` tinham tipo incompatível e blocos `controlsBackgroundx`/`controlsx`
ficavam ativos.

**Causa:** as abas não tinham `type=106`; os controles de voltar/jogar foram substituídos por
tipo incompatível; o `onLoad` nativo do `RscDisplayMain` estava zerado; havia mais de um
controle de logo e o callback do Early Access continuava ativo.

**Correção (V29 + V32):** tipo nativo das abas corrigido; `B_Cancel`/`B_Join` preservados;
blocos inativos removidos; callback do Early Access removido; um único controle de logo; o
`config` passou no `CfgConvert -test` e o PBO foi aberto pelo BankRev. A V32 fechou as abas
legacy e restaurou o `onLoad` nativo.

**Pendência de conferência:** cena 3D do menu e retorno da missão sem sobreposição legacy — o
pacote atual V38 introduziu o menu de pausa novo, mas a validação visual continua manual.

## 9. Girar item no inventário fechava o inventário

**Sintoma:** apertar espaço para girar o item fechava a tela.

**Causa:** o botão default da tela consumia o `keyup` do espaço depois que o `keydown` já
tinha sido tratado como rotação.

**Correção:** consumir `DIK_SPACE` no `keyup` enquanto o inventário está aberto
(`lib/UI/uiContainers.cpp:2166-2175`).

## 10. Item não acompanhava o slot ao mover entre mãos, calça, camisa e mochila

**Sintoma:** o item ficava "preso" no slot antigo ou a ação era cancelada ao fechar a tela.

**Correção:** iterações de sincronização do item do slot (`Hands`) e do cancelamento de ação
nas telas de inventário — pacotes `package-v10` a `package-v13`.

## 11. Preview do inventário com pose errada

**Sintoma:** no inventário o personagem aparecia se alongando, com os braços levantados.

**Causa:** o preview do 1.30 (`p_menu_unarmed_idleMain01`) é uma pose de alongamento, não um
idle de menu.

**Correção:** preview revertido para o RTM do 0.45 na build **E6**; o resto das animações
continuou em 1.30. O `p_menu_unarmed_idleMain02` nunca foi testado.

## 12. Jogo "não respondendo" ao abrir

**Sintoma:** cliente e servidor subiam com 7–15 MB, 0% de CPU e "Não respondendo" por vários
minutos.

**Causa:** não era o PBO — os processos estavam em prioridade `BelowNormal` e cinco `CL.exe`
de um build de engine ocupavam 100% dos 4 núcleos. Em ~7 minutos o cliente tinha recebido
0,7 s de CPU.

**Correção operacional:** jogo em `AboveNormal` e build em `BelowNormal` durante o teste;
resolve na hora. A regra prática ficou registrada no dossiê. O mesmo quadro voltou a acontecer
na E6 com prioridade baixa + build em paralelo.

## Em aberto: lanterna + pilha esticam os braços

**Sintoma:** segurando lanterna e pilha, o personagem estica os braços (efeito elástico) e o
item vira uma placa gigante; acontece na pose de segurar e na ação **Lick battery**.

**Suspeitos:** os 4 estados `Cdzp..._batteryLicking` e os 2 tracks IK
`ik\comsumables\9v_battery.rtm` / `battery_d.rtm`, todos substituídos pelo 1.30.

| Estado | E6 (1.30) | 0.45 (BMTR) |
|---|---|---|
| `CdzpAmovPercMstpSnonWnonDnon_batteryLicking` | 4.143.192 B · 431 quadros | 87.976 B · 67 quadros |
| `CdzpAmovPercMstpSrasWnonDnon_batteryLicking` | 493.672 B · 51 quadros | 88.858 B · 67 quadros |
| `CdzpAmovPknlMstpSnonWnonDnon_batteryLicking` | 1.358.032 B | 87.971 B |
| `CdzpAmovPpneMstpSnonWnonDnon_batteryLicking` | 1.655.756 B | 89.012 B |
| `ik\comsumables\9v_battery.rtm` | 23.076 B | 4.187 B |
| `ik\comsumables\battery_d.rtm` | 23.076 B | 4.209 B |

**Hipóteses, em ordem:** (1) tracks IK de consumível com alvo do 1.30 que não bate com o rig
0.45; (2) `batteryLicking` com 431 quadros onde o 0.45 espera 67; (3) transições
`Acts...battery` do config 0.45.

**Build E7 pronta:** `out\anims_E7.pbo` (918.285.584 B, SHA-1
`A986CA7C65D1820297CA9EF1EAFC7A1599F6166C`), 2.053 entradas, 2.028 RTMs (1.388 RTM_0101 +
640 BMTR), com `9v_battery` e `battery_d` revertidos para BMTR 0.45. Ainda **não instalada nem
testada**; a E6 continua em jogo.

## Investigado e descartado

### Aviso vermelho "default character"

Não é bug do projeto. É vanilla: o script de spawn em `Addons\modules_dayz.pbo` usa
`_this select 5` e mostra o aviso em servidor local sem hive. Aparece desde antes de qualquer
mudança. A oferta de comentar a linha existe, mas **não foi aplicada**.

### Personagem imóvel na V32.1

O RPT chegou a `GAME LOADED` e `PLAYING`, o servidor salvou o personagem como vivo e registrou
a desconexão de `Arthurnashh` após 119,672 s. O sintoma provavelmente foi perda de foco da
janela / interrupção da sessão, não falha de animação. Não foi alterado movimento/animação por
causa disso.

### `Bad move` e `Invalid move ... disarm`

Ruído vanilla. O baseline de todas as sessões é **12** `Animation ... not found or empty`,
**23** `Bad move` e **15** `Invalid move in action disarm` — inclusive às 04:57, antes de
qualquer mudança. A E6 fechou nesses mesmos números.

### Ordem dos ossos

Não é a causa do bug da pilha. Nas 1.387 trocas pareadas analisadas, o conjunto de ossos era
idêntico e a **ordem** era diferente em 100% dos casos; as animações tocam corretamente porque
o motor casa por **nome**, não por índice.

### Menu 1.30

Ficou de fora de propósito: 141 arquivos, 333 MB bruto / 255 MB trimado. É só preview
cosmético e encosta no teto de ~1,1 GB do PBO.

### Regressão da V31

A V31 não foi aceita: terreno vermelho/rosa, fundo 3D ausente e seis abas legacy. A V32
reparou; o registro fica para não repetir a combinação WRP do servidor + texturas de outro
pacote.

### Ruído vanilla no RPT

`Cannot register unknown string STR_ACTION_THROW`, `Conflicting addon DZ_Pistols_Encore`,
`Item ... listed twice`, `Binarize missed persistence for 'Land_A_FuelStation_Feed'` e
`Cannot load material file physics/materials.h` já existiam antes das mudanças e não bloqueiam
a UI. Não são tratados como regressão.
