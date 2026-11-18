# Novas implementações

Onze frentes que não existiam no projeto original e passaram a existir — código, ferramentas,
builds e documentação.

## 1. Motor 0.45 compilando em v141

A source é de 2001 e declara `v100`. Nesta máquina o build roda com **MSVC 14.16 (v141)** e
**MSBuild 15.9.30**, gerando `build\inventory-menu-v10\cpp-out-v31\DayZInt.exe`. Exigiu
ajustes em headers antigos (`math3dp.hpp`, `enf_mathlib.h`, `typeopts.hpp`, `appName.h`,
`wpch.hpp`, `SimulWeatherDX9.hpp` e vários `.cpp`), todos preservados em
`backup-v141-compat-20261116/`.

Avisos conhecidos e aceitos: `C4005` (`DXGI_ERROR_*` entre DXSDK 2010 e SDK 10), `C4477` em
`txtd3d9.cpp:3843` e `LNK4217` (`_floor` em `xapobased.lib`). O DirectX continua **DX9**; não
houve migração para DX11.

## 2. Rotação de item no inventário, replicada pelo servidor

Antes não existia. Agora espaço gira o item e o estado é sincronizado:

| Etapa | Arquivo |
|---|---|
| Entrada | `lib/UI/uiMap.cpp:6544-6549` · `CItemBase::RotateInventoryItem` |
| Envio | `lib/Network/networkClient.cpp:7669` · `AskForRotateInventoryItem` |
| Mensagem | `lib/Network/networkImpl.hpp:370` · `DECLARE_NET_MESSAGE` |
| Servidor | `lib/Network/networkServer.cpp:6796` |
| Estado | `lib/Network/networkClient.cpp:4519` · `IsInventoryRotated()` |
| Interface | `lib/Network/network.hpp:1093` e `:1411` |

## 3. Menu inicial, pausa e navegador de servidores

31 pacotes versionados (`package-v10` … `package-v31`) mais V32, V32.1, V33, V34 e V38, com
restore point antes de cada etapa:

- três abas funcionais: **OFFICIAL / COMMUNITIES / LAN**; HISTORY/FRIENDS/REMOTE fora da tela
- layout do menu ajustado (`cfg/Bin/rscScreen.hpp`, `lib/UI/optionsUI.cpp`)
- controle do mod launcher posicionado no menu
- estatísticas deixaram de ser texto fixo (`"NOT SYNCED"` → `0m` / `0`)
- `ui.pbo` editado direto, sem depender de `@MenuCleanup`
- tipos nativos das abas (`type=106`), `B_Cancel`/`B_Join` corrigidos, blocos
  `controlsBackgroundx`/`controlsx` inativos removidos, um único logo e Early Access fechado
- **V38 — menu de pausa novo:** `RscDisplayMPInterrupt` e `RscDisplayInterrupt` reescritos no
  config do `ui.pbo`; `PausePanel`/`PauseAccent`/`PauseTipPanel` removidos por `delete`;
  IDs preservados (101 OPÇÕES, 104 SAIR, 122 RESPAWN, 1 CONTINUAR); mundo 3D ao fundo, logo,
  “DAYZ 0.45.124252”, “BUILD MODIFICADO - V38”, card “Check-up completo 25/35” e lista
  SAIR / OPÇÕES / CONTINUAR. Só o `ui.pbo` mudou em relação ao V34.

O `ui.pbo` atual tem 48.349.274 B (46,1 MiB), SHA-256
`EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500`.

## 4. Porte das animações do DayZ 1.30

A maior frente do projeto. O detalhe completo fica na aba **Animações 1.30**; o resumo é:

| Item | Valor |
|---|---|
| RTMs no `anims.pbo` 0.45 | 2.028 |
| Em formato 1.30 (`RTM_0101`) na E6 | **1.390 (68,5%)** |
| Mantidos em `BMTR` 0.45 | 638 |
| Acervo 1.30 disponível | 7.415 RTMs |
| Arquivos trocados no manifesto | 1.526 caminhos únicos (1.527 registros) |
| Menu 1.30 excluído | 140 arquivos |
| Gameplay ativo do manifesto | 1.386 |
| Extras fora do manifesto | 4 (`InjL...breath` ×3, `Ainv...pills`) |
| Tracks `ik/` substituídos | 84 (inclui os 2 da pilha) |
| Estados `batteryLicking` | 4 |
| Trim de ossos | 1.526 arquivos · 1.425,9 → 1.091,5 MB · **−23,45%** (1.523 na primeira passada) |
| Build em jogo | **E6** (875,8 MiB) |
| Build pronta | **E7** (875,7 MiB, 2 IK revertidos) |

**Formatos:** o 0.45 usa `BMTR` (v3), com tabela de nomes terminada em zero e dados comprimidos
por quadro; o 1.30 usa `RTM_0101`, com 32 bytes fixos por nome e 80 bytes por osso por quadro
(20 valores). O motor 0.45 lê os dois. Os ossos são casados por **nome**; a ordem é diferente
em 100% das trocas e isso não quebra nada.

**Cobertura do que ficou em 0.45:** 273 animações de zumbi (rig diferente), 140 de menu, 33 de
teste/visema/props e ~192 do jogador que não existem na 1.30 (troca de arma por slot, stops,
urinar, defecar, `m4_check`, variantes `_right`, `ik`).

**Decisões:** menu 1.30 fora (141 arquivos, 333 MB bruto / 255 MB trimado); preview do
inventário revertido ao 0.45 na E6; transições do 1.30 (171 de postura, 512 de reload, 80 de
unjam, 77 de weapon switch, 96 de attack e 270 de hit) não têm estado equivalente no config
0.45 e foram mantidas; troca de arma, stops e urinar/defecar são procedurais no config, não
arquivos.

**Validação:** a E6 entrou no mundo com `PLAYING` e o baseline vanilla de **12**
`not found or empty`, **23** `Bad move` e **15** `Invalid move ... disarm`, sem erro novo de
animação. O bug aberto é a lanterna + pilha (ver aba de bugs).

## 5. Pipeline reprodutível de animação

| Ferramenta | Função |
|---|---|
| `trim_rtm.py` | filtra os ossos do RTM 1.30 para o conjunto do BMTR 0.45 |
| `stage_e6.py` | monta o staging da build (menu 0.45, extras, trim) |
| `pack_pbo.py` | empacota o PBO no formato 0.45 com SHA1 no fim |
| `verify_e6.py` / `verify_e7.py` | confere entradas, tamanhos de RTM e amostras byte a byte |

O acervo de trabalho ocupa **20,41 GB** em `ANIMS-WORK-20261117`: árvores de staging, builds
E1–E7, `trimmed_e4`, backups e o `replaced_files.json` com o manifesto das trocas.

## 6. Diagnóstico embutido no motor

Instrumentação temporária que tornou os bugs visíveis:

- `DIAGMOVE` / `DIAGANIM` em `soldierOld.cpp` e `simul.cpp` — uma linha por segundo com
  `pos`, `spd`, `prim`, `info`, `minmax`, `pf`, `ctrl`, `stat` (removida na V37)
- `[ZombieCollisionDiag]` e `[ZombieCollisionStartOverlap]` em `zombie.cpp`, limitados a
  1 log/s no servidor
- leitura de RTM em Python (header, ossos, quadros) usada para provar que o root motion
  estava correto
- comparação de PBOs com BankRev (`-d`, `-properties`) e `CfgConvert -test` para validar
  configs antes de empacotar

## 7. Launcher de teste automatizado

Tarefa agendada `DayZTestLaunch`: sobe o servidor, espera 40 s e abre o cliente em
`-connect=127.0.0.1 -port=2322`. Junto com o checklist de RPT (12 / 23 / 15 / `PLAYING`),
permite comparar builds em minutos. O script também sobe a prioridade do jogo para
`AboveNormal` quando o build de engine está rodando em paralelo.

## 8. Site de documentação

Este próprio site: funções, comentários traduzidos, patches, achados, bugs, dicionário,
ferramentas, o **dossiê de animações**, a aba de **pendências** e a aba de **atualizações**
com sete abas (bugs corrigidos, feed do GitHub, atualizações manuais, novas implementações,
animações 1.30, builds E1–E7 e linha do tempo). Buildado em `site\dist` e servido por Vite.

## 9. Disciplina de versão, WRP e hashes

- `backup-<tema>-<data-hora>/` guarda só os arquivos tocados antes de cada mudança
- `build/inventory-menu-v10/restore-point-vNN-*/` guarda fonte + EXE + MAP (+ PDB) antes de
  cada build
- cada `package-vNN` é uma instalação jogável isolada, com launcher e perfil próprios
- `HISTORICO-CORRECOES-E-PENDENCIAS.md` registra SHA-256 de EXE, `ui.pbo` e
  `worlds_chernarusplus.pbo` por versão
- **regra do WRP:** cliente e servidor precisam usar o mesmo `worlds_chernarusplus.pbo`
  (revisão + SHA-256). Se uma build futura reempacotar o WRP do cliente, o crash de entrada
  volta. O procedimento manual está em cinco passos no histórico.
- **regra do PBO:** o prefixo tem uma barra só (`prefix=bin\`, não `prefix=bin\\`).

## 10. Ferramentas de análise e verificação

| Ferramenta | Uso |
|---|---|
| `BankRev` | listar, extrair, comparar PBOs (`-d`, `-properties`) |
| `CfgConvert` | converter e validar `config.bin` (`-test`, `-txt`) |
| `certutil` / `Get-FileHash` | conferir SHA-1/SHA-256 de EXE, PBO e build |
| Python | ler `BMTR`/`RTM_0101`, trimar ossos, empacotar e verificar PBO |
| PowerShell | orquestrar builds, prioridades, RPT e launcher |

Referência de hashes atuais:

| Arquivo | Bytes | Hash |
|---|---:|---|
| `Addons\anims.pbo` (E6 instalada) | 918.323.340 | SHA-1 `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| `out\anims_E7.pbo` | 918.285.584 | SHA-1 `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |
| `Addons\ui.pbo` (V38) | 48.349.274 | SHA-256 `EBC95ACEC58C37785087FB774D17AE556DF72CA546C6CB14B863E2FF9ED25500` |
| `DayZInt-v37-clean.exe` | 13.640.192 | SHA-256 `32D93E90214332F79CFF342FD6E8D103ADE1C811693C073374EDCB174E875E22` |
| `worlds_chernarusplus.pbo` | 120.164.803 | SHA-256 `0B8DAD26F376B892376C45240D630C14C126A84D0C31D0492384EF9371C78E28` |
| `dta\bin.pbo` (V38) | 5.218.347 | SHA-256 `59FF087A82E023307F9E91089785332A8B4CCB35D30B77EEC65DDDE7E1B6074F` |

## 11. Quadro de tarefas, registro de bugs e feed do GitHub

As páginas **Pendências** e **Bugs** deixaram de ser só leitura. O quadro de tarefas e o
registro de bugs agora permitem criar, editar, iniciar, bloquear, concluir, reabrir e excluir
itens. Toda conclusão exige um desfecho com quatro respostas obrigatórias: **o que era**, **como
foi corrigido**, **o que foi usado** e **quantas tentativas** foram necessárias antes de resolver
de vez. O mesmo vale para tarefas concluídas, com o texto adaptado para “o que foi feito”.

O armazenamento é local (`localStorage`, chave `sourcedayz.board.v1`), com exportação e
importação de `board.json`. Quem tem a source pode publicar o quadro em
`site-data/board.json` no repositório **Personed/Game** e o changelog curado em
`site-data/updates.json`. A publicação usa um token fine-grained com **Contents: Read and write**,
guardado apenas na sessão do navegador; sem token, o caminho é exportar o JSON e commitar à mão.

A página **Atualizações** ganhou duas abas: **Feed do GitHub**, que lê commits, releases e o
manifesto `site-data/updates.json` direto de `Personed/Game`, e **Atualizações manuais**, onde a
equipe registra o changelog curado. A página **Patches** mostra o mesmo feed de commits no fim,
para que um patch publicado no repositório apareça no site sem edição manual. Quando o manifesto
ainda não existe, o feed explica o que falta em vez de falhar.

