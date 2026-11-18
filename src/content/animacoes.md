# Dossiê de animações · DayZ 1.30 → 0.45

Substituir no cliente **0.45.124252** todas as animações do **DayZ 1.30**, incluindo as
transições, mantendo o jogo jogável. Este dossiê registra o que está sendo feito, o que já
entrou no jogo e o que ainda falta.

## O que estamos fazendo

O `anims.pbo` do 0.45 guarda duas coisas: o **CfgMoves** (configuração dos estados, transições
e regras) e os **RTMs** (os quadros de animação em si). A estratégia é trocar apenas os RTMs
pelos equivalentes do 1.30 e manter o CfgMoves do 0.45 — porque o config do 1.30 referencia
estados que o 0.45 não tem.

> O **passo a passo técnico** — com os scripts completos, os hexdumps de antes e depois e o
> código do motor que lê os dois formatos — está na página [Passo a passo](#/passo-a-passo).

### Regra do PBO único

Dois PBOs com o mesmo prefixo (`DZ\anims`) **não são montados ao mesmo tempo** — o segundo é
ignorado. Por isso tudo precisa caber em **um único `anims.pbo`**. O teto prático medido é de
**~1,1 GB**: a build D2 (1.374 MB) travou o carregamento em `Updating base class ->Grid`.

### Formatos que convivem

| Versão | Formato | Como guarda os ossos |
|---|---|---|
| 0.45 | `BMTR` (v3) | tabela de nomes com strings terminadas em zero + dados comprimidos por quadro |
| 1.30 | `RTM_0101` | 32 bytes fixos por nome + 80 bytes por osso por quadro (20 valores) |

O motor 0.45 lê os dois formatos — foi isso que tornou o porte possível. Os nomes dos ossos
são casados **por nome**, não por índice: nas 1.387 trocas pareadas analisadas a **ordem** dos
ossos é diferente em 100% dos casos e mesmo assim as animações tocam corretamente. Os 140
pares que não tinham nem o mesmo conjunto de ossos são os arquivos de menu, que ficaram fora.

## Onde chegamos

### Cobertura

| Item | Valor |
|---|---|
| RTMs no `anims.pbo` 0.45 | 2.028 |
| Em formato 1.30 na **E6** | **1.390 (68,5%)** |
| Mantidos em `BMTR` 0.45 na E6 | 638 |
| Acervo 1.30 disponível | 7.415 RTMs |
| Arquivos no manifesto | 1.526 caminhos únicos (1.527 registros, 1 duplicado) |
| Menu 1.30 excluído | 140 arquivos |
| Gameplay ativo do manifesto | 1.386 |
| Extras fora do manifesto | 4 |

Os 4 extras são `CdzpInjL...breath.rtm` (perc, knl, pne) e `CdzpAinvPknl..._pills.rtm`; eles
já estavam em formato 1.30 no staging, mas não aparecem no `replaced_files.json`.

Os 638 que continuam em 0.45:

- **273** de zumbi — o rig do zumbi do 1.30 não é o mesmo do 0.45
- **140** de menu — só preview cosmético, ficou de fora pelo tamanho
- **33** de teste / visema / props
- **~192** do jogador que **não existem na 1.30** (troca de arma por slot, stops, urinar,
  defecar, `m4_check`, variantes `_right`, `ik`)

### Build em jogo: E6

| | |
|---|---|
| Arquivo | `Addons\anims.pbo` |
| Tamanho | 918.323.340 bytes (875,8 MiB) |
| Entradas | 2.053 |
| RTMs válidos | 2.028 (1.390 `RTM_0101` + 638 `BMTR`) |
| SHA1 | `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| Amostras byte a byte | 11/11 idênticas ao build |

Log da sessão de teste (RPT, 17/11 23:40):

| Linha | Ocorrências | Situação |
|---|---|---|
| `Animation ... not found or empty` | 12 | baseline vanilla |
| `Bad move` | 23 | baseline vanilla |
| `Invalid move ... disarm` | 15 | vanilla (aparece desde 04:57, antes de qualquer mudança) |
| `PLAYING` | 1 | entrou no mundo |

**Zero erro novo de animação.** O baseline de 12 / 23 / 15 se repete em todas as 36 sessões
anteriores, inclusive antes de qualquer mudança.

### Build pronta: E7

| | |
|---|---|
| Arquivo | `ANIMS-WORK-20261117\out\anims_E7.pbo` |
| Tamanho | 918.285.584 bytes (875,7 MiB) |
| Entradas | 2.053 |
| RTMs válidos | 2.028 (1.388 `RTM_0101` + 640 `BMTR`) |
| SHA1 | `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| Amostras | 10/10 idênticas à árvore |
| Mudança | `9v_battery.rtm` (4.187 B) e `battery_d.rtm` (4.209 B) revertidos para BMTR 0.45 |
| Estado | **não instalada nem testada** — a E6 continua em jogo |

### Histórico das builds

| Build | Hora | Tamanho | O que mudou | Resultado |
|---|---|---|---|---|
| E1 | 11:02 | 1.056,5 MiB | primeiro pacote completo de RTMs 1.30 | carregou, mas passava do teto seguro |
| E2 | 11:13 | 1.030,1 MiB | ajuste de lotes | estável |
| E3 | 11:45 | 1.037,8 MiB | mais lotes, menu 1.30 ainda dentro | estável; backup guardado |
| E4 | 12:12 | 874,4 MiB | **trim de ossos** em 1.523 arquivos + menu 0.45 | 12 faltantes, 23 `Bad move`, `PLAYING` |
| E5 | 12:33 | 878,6 MiB | +5 mapeamentos (arremessos e preview 1.30) | testada; preview reprovado |
| **E6** | 16:01 | **875,8 MiB** | preview revertido ao 0.45, arremessos 1.30 | em jogo, sem erro novo |
| **E7** | 00:03 | **875,7 MiB** | 2 IK da pilha revertidos para 0.45 | pronta, não testada |

### Trim de ossos

Os RTMs do 1.30 trazem 156 ossos; o modelo do 0.45 usa 120. Copiado inteiro, o PBO passava
de 1,4 GB e não carregava. O trim filtra cada RTM para o conjunto de ossos do BMTR 0.45
correspondente, validando que o conjunto 1.30 é superset.

| | |
|---|---|
| Arquivos trimados | 1.526 (1.523 na primeira passada, usada na E4) |
| Antes | 1.425,9 MB |
| Depois | 1.091,5 MB |
| Redução | **23,45%** |
| Erros | 0 |

### Decisões tomadas

- **Menu 1.30 fica de fora** (141 arquivos, 333 MB bruto / 255 MB trimado): é só preview e
  encosta no teto de tamanho.
- **Preview do inventário voltou ao 0.45** na E6: o `p_menu_unarmed_idleMain01` do 1.30 é uma
  pose de alongamento com os braços levantados e ficou esquisito no inventário.
- **Troca de arma, stops e urinar/defecar continuam 0.45**: não existem como arquivo na 1.30,
  são procedurais no config.
- **Transições**: o 1.30 tem 171 (só de postura), 512 de reload, 80 de unjam, 77 de weapon
  switch, 96 de attack e 270 de hit. O config do 0.45 não tem esses estados — as transições
  do 0.45 foram mantidas.
- **Tracks `ik/`**: 84 arquivos substituídos, incluindo os 2 da pilha. Eles posicionam o item
  na mão e são o suspeito nº 1 do bug da lanterna.

## O que falta fazer

### 1. Bug aberto: lanterna + pilha (prioridade máxima)

Segurando lanterna e pilha o personagem **estica os braços** (efeito elástico) e o item vira
uma placa gigante. Acontece na pose de segurar e na ação **Lick battery**.

Estados envolvidos (todos substituídos pelo 1.30):

| Estado | E6 (1.30) | 0.45 (BMTR) |
|---|---|---|
| `CdzpAmovPercMstpSnonWnonDnon_batteryLicking` | 4.143.192 B · 431 quadros | 87.976 B · 67 quadros |
| `CdzpAmovPercMstpSrasWnonDnon_batteryLicking` | 493.672 B · 51 quadros | 88.858 B · 67 quadros |
| `CdzpAmovPknlMstpSnonWnonDnon_batteryLicking` | 1.358.032 B | 87.971 B |
| `CdzpAmovPpneMstpSnonWnonDnon_batteryLicking` | 1.655.756 B | 89.012 B |
| `ik\comsumables\9v_battery.rtm` | 23.076 B | 4.187 B |
| `ik\comsumables\battery_d.rtm` | 23.076 B | 4.209 B |

Hipóteses, em ordem de probabilidade:

1. **Tracks IK de consumível** (`9v_battery`, `battery_d`) — são poses de 2 quadros que
   posicionam o item na mão; se o alvo do IK do 1.30 não bate com o rig do 0.45, os ossos do
   braço recebem transformação absurda e a malha estica. Explica o braço **e** o item.
2. `batteryLicking` do 1.30 com 431 quadros onde o 0.45 espera 67 — animação longa demais
   para um estado que o config 0.45 trata como curto.
3. Transições `Acts...battery` que o 0.45 usa para entrar/sair da ação.

Plano de correção (build E7): reverter primeiro os **2 IK** e testar; se continuar, reverter
os **4 batteryLicking**; se continuar, revisar as transições. Cada passo é pequeno e o
backup da E6 já existe.

### 2. Revisar os 84 tracks `ik/`

Foram trocados 84 RTMs de IK (comida, bebida, remédio, ferramenta, arma). Se o problema for o
mesmo da pilha, comer maçã, beber cantil, usar bandagem, mapa e bússola também devem
apresentar braço esticado. Testar item por item e reverter os que falharem.

### 3. Menu 1.30 (opcional)

140 arquivos, +255 MB trimado. Dá preview novo no inventário, mas encosta no teto de ~1,1 GB.
Só entra se o preview atual incomodar.

### 4. Preview alternativo

`p_menu_unarmed_idleMain02` nunca foi testado como preview do inventário. É a única
alternativa do 1.30 depois que o `idleMain01` foi reprovado.

### 5. Zumbis

273 animações de zumbi continuam 0.45. Antes de tentar o 1.30 é preciso confirmar que o rig
do zumbi 1.30 é compatível com o modelo 0.45.

### 6. Reconstruir à mão o que não existe na 1.30

Troca de arma por slot, stops, urinar/defecar, `m4_check` e variantes `_right` somam ~192
arquivos. Ou ficam em 0.45 de vez, ou são recriados a partir de clipes do 1.30.

### 7. Validar as 1.390 em jogo, item por item

O RPT só prova que não há erro novo de animação; não prova que cada arma, item e ação está
visualmente correta. O teste precisa cobrir: arremesso com e sem arma, soco, pular cerca,
sinais com arma, lanterna, pilha, comer, beber, bandagem, mapa, bússola e troca de arma.

## Rotina de teste

1. Fechar o jogo (o `anims.pbo` fica travado enquanto o cliente roda).
2. Copiar o build para `Addons\anims.pbo` e conferir o SHA1.
3. Subir servidor + cliente (`schtasks /run /tn "DayZTestLaunch"`).
4. Conferir no RPT: 12 `not found or empty`, 23 `Bad move`, 15 `Invalid move` e `PLAYING`.
5. Testar no jogo: preview do inventário, arremesso com e sem arma, soco, pular cerca, sinais
   com arma, segurar lanterna, Lick battery, comer, beber, bandagem, mapa e bússola.

## Caminhos

```text
Pacote do jogo
  SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\
    Addons\anims.pbo          build instalada (E6)
    Addons\ui.pbo             menus (V38)
    profile-v36-updegree\DayZInt-v37-clean.RPT   log do cliente

Trabalho de animação
  ANIMS-WORK-20261117\
    out\anims_E6.pbo          build em jogo
    out\anims_E7.pbo          build pronta (2 IK revertidos)
    backup\anims_E3_instalado.pbo
    animsE6_tree\             staging (2.054 arquivos)
    animsE7_tree\             staging da E7
    anims045\                 árvore de trabalho com os lotes
    anims045_orig\            extração pristina do 0.45
    trimmed_e4\               RTMs 1.30 já trimados
    replaced_files.json       manifesto das trocas

Acervo 1.30
  D:\RetailPlayer-OFP2-Y0\    7.415 RTMs
```

## Ferramentas

| Script | Para quê |
|---|---|
| `trim_rtm.py` | filtra os ossos do RTM 1.30 para o set do BMTR 0.45 |
| `stage_e6.py` | monta o staging da build (menu 0.45, extras, trim) |
| `pack_pbo.py` | empacota o PBO no formato 0.45 |
| `verify_e6.py` | confere cabeçalho, entradas e amostras do PBO |
| `verify_e7.py` | o mesmo para a E7, incluindo os 2 IK revertidos |

## Armadilhas já pagas

- **PBO duplicado não monta** — dois PBOs com prefixo `DZ\anims` e o segundo é ignorado.
- **Teto de ~1,1 GB** — acima disso o jogo trava em `Updating base class ->Grid`.
- **Prioridade de processo** — cliente e servidor subiram como `BelowNormal` e ficaram
  "não respondendo" por fome de CPU enquanto 5 `CL.exe` de build ocupavam os 4 núcleos.
  Subir o jogo para `AboveNormal` resolve na hora.
- **RPT é append** — para medir uma sessão é preciso cortar o log no último `Current time:`.
- **Preview de menu não é animação de gameplay** — pose bonita de menu do 1.30 pode ser
  inútil no inventário do 0.45.
- **Ordem de ossos não importa** — o motor casa por nome; não gaste tempo reordenando.
