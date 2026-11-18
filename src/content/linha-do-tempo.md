# Linha do tempo

Ordem em que as coisas aconteceram, com a versão/pacote de cada etapa. Serve para achar
rapidamente "o que estava rodando no dia X" e qual backup usar.

## 16/11/2026 — motor, colisão, inventário e menu

| Hora | Etapa | Resultado |
|---|---|---|
| — | build com v141 validado | MSBuild 15.9.30, MSVC 14.16, saída em `cpp-out-v31` |
| 06:55 | inclinação Q/E correndo | backup `backup-lean-strafe-20261116-065525` |
| — | colisão de zumbi | artefatos `zombie-collision-diag-v102` … `v123` |
| — | inventário: rotação + mãos | `package-v10` … `package-v13` |
| — | menu/pausa/navegador | `package-v14` … `package-v27` |
| 22:49 | V27–V28: WRP do cliente ≠ servidor | cliente rev. 17983, servidor 17865; V28 alinhou |
| 23:04 | **V28** — WRP alinhado | `worlds_chernarusplus.pbo` rev. 17865, SHA-256 `0B8DAD26…8E28` |
| 23:38 | **V29** — abas nativas | `type=106`, `B_Cancel`/`B_Join`, config passou no `CfgConvert` |
| 23:38 | **V30** — guard de textura | validações em `GetPixel`/`GetRect`/`RequestGetRect` |
| — | **V31** — guard de mip | `_nMipmaps`/`level`; **regressão visual** (terreno rosa, sem 3D, 6 abas) |

## 17/11/2026 — terreno, UI, movimento e animações

| Hora | Etapa | Resultado |
|---|---|---|
| 01:01 | **V32** — reparo de terreno e menu | 509 arquivos de `worlds_chernarusplus_data.pbo` diferentes; terreno verde na V32.1 |
| 01:13 | **V32.1** — prefixo do `bin.pbo` | `prefix=bin\\` → `prefix=bin\`; corrige `No entry '.CfgAddons'` |
| 01:31 | **V33** — UI PBO / navegador | stage e restore point antes do V34 |
| 02:20 | **V34** — `sizeEx` e `idc` | 0 `Error loading control`, 0 `Size_Text_*` |
| 03:17 | **V35** — diagnóstico | DIAGMOVE/DIAGANIM instrumentado, sem patch |
| 03:52 | **V36** — `upDegree` | patch + instrumentação; personagem volta a andar |
| 04:45 | **V38** — menu de pausa | `RscDisplayMPInterrupt`/`RscDisplayInterrupt` reescritos; só `ui.pbo` |
| 07:57 | **V37 clean** | `upDegree` corrigido, instrumentação removida (`DayZInt-v37-clean.exe`) |
| 11:02 | animações **E1** | primeiro pacote completo 1.30 (1.056,5 MiB) |
| 11:13 | **E2** | 1.030,1 MiB |
| 11:45 | **E3** | 1.037,8 MiB + backup guardado |
| 12:12 | **E4** | trim de ossos: 874,4 MiB |
| 12:33 | **E5** | +5 mapeamentos (arremessos e preview) |
| 16:01 | **E6** | preview do 0.45 de volta, 875,8 MiB |
| 23:40 | teste em jogo da E6 | `PLAYING`, 12 / 23 / 15 — baseline |
| 23:58 | documentação: Pendências e dossiê | abas novas no site |

## 18/11/2026 — correção da lanterna e entrega

| Hora | Etapa | Resultado |
|---|---|---|
| 00:03 | **E7** empacotada | 918.285.584 B · 2.053 entradas · 2 IK revertidos |
| — | verificação da E7 | 2.028 RTMs válidos, 10/10 amostras OK |
| 00:10 | tentativa de subir cliente v37-clean | RPT parou em `Cannot load material file`; saiu em ~75 s, sem crash |
| 00:13 | aba **Atualizações** no site | bugs, implementações, animações, builds e timeline |
| 00:44 | **F2** do FPS compilada (frente paralela) | Release pronta, runtime copiado |
| — | **F2** testada em Berezino | personagem/casas ok; **grama intermitente e sombra nas costas**; FPS baixo; frente pausada |
| — | build final do site (Atualizações com 5 abas) | bundle em `site\dist\assets` |

## Versões do executável

| Versão | O que é | Hash |
|---|---|---|
| `DayZInt-v34-backup.exe` | V34 limpo, antes do diagnóstico de movimento | — |
| `DayZInt-v35-diag.exe` | V35 instrumentado (DIAGMOVE/DIAGANIM), sem patch | — |
| `DayZInt-v37-clean.exe` | **atual** — `upDegree` corrigido, instrumentação removida | SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C` · SHA-256 `32D93E90…5E22` |
| V30 EXE | guard de textura | SHA-256 `8835CBE7…8A0A` |
| V32 EXE | reparo de terreno/menu | SHA-256 `10F94200…CD35` |

## Pacotes jogáveis

Cada `package-vNN` é uma instalação isolada, com launcher e perfil próprios:

```text
build\inventory-menu-v10\
  package-v10 … package-v31      menu, pausa e navegador
  package-v32-terrain-menu-repair
  package-v32.1 / stage-v33      correções intermediárias
  package-v34-sizefix            correção do navegador
  package-v38-pause-menu         pacote atual (anims.pbo E6 + ui.pbo V38)
```

## Hashes de referência (estado atual)

| Arquivo | Bytes | Hash |
|---|---:|---|
| `Addons\anims.pbo` (E6) | 918.323.340 | SHA-1 `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| `out\anims_E7.pbo` | 918.285.584 | SHA-1 `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| `Addons\ui.pbo` (V38) | 48.349.274 | SHA-256 `EBC95ACE…5500` |
| `DayZInt-v37-clean.exe` | 13.640.192 | SHA-256 `32D93E90…5E22` |
| `worlds_chernarusplus.pbo` | 120.164.803 | SHA-256 `0B8DAD26…8E28` |
| `dta\bin.pbo` (V38) | 5.218.347 | SHA-256 `59FF087A…074F` |

## Backups e restore points

| Caminho | Guarda |
|---|---|
| `backup-v141-compat-20261116\` | headers antigos ajustados para v141 |
| `backup-lean-strafe-20261116-065525\` | `lib/soldierOld.cpp` antes da inclinação |
| `backup-inventory-redesign-20261117\` | inventário antes do redesenho |
| `restore-point-v16-pause-controls-20261116\` | controles do menu de pausa |
| `restore-point-v27-before-wrp-align-20261116\` | PBO/WRP antes do alinhamento |
| `restore-point-v28-before-v29-menu-20261116\` | menu antes das abas nativas |
| `restore-point-v30-before-texture-guard-20261116\` | antes do guard de textura |
| `restore-point-v31-before-invalid-mip-level-20261117\` | antes do nível de mip |
| `restore-point-v32-before-terrain-menu-repair-20261117\` | antes do reparo de terreno |
| `restore-point-v32-cfgaddons-prefix-20261117\` | antes do prefixo do `bin.pbo` |
| `restore-point-v33-before-ui-pbo-fix-20261117\` | antes do PBO de UI |
| `restore-point-v35-diagmove-20261117\` | `soldierOld.cpp`/`simul.cpp` originais |
| `restore-point-v36-updegree-20261117\` | `motion.cpp` original e corrigido |
| `restore-point-v38-pause-menu-20261117\` | `ui.pbo` anterior ao menu de pausa |
| `ANIMS-WORK-20261117\backup\anims_E3_instalado.pbo` | build de animação anterior |
