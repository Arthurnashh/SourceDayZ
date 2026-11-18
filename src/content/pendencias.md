# O que falta fazer

Quadro de pendências do projeto. A aba **Tarefas** é o quadro editável (criar, iniciar,
bloquear, concluir e excluir); este texto é o panorama detalhado de cada frente. O detalhe
técnico das animações está na aba **Animações**; aqui fica o retrato do que está aberto hoje
(18/11/2026).

## Frentes abertas

| Frente | Estado | Próximo passo |
|---|---|---|
| Animações 1.30 no cliente 0.45 | em jogo (E6), 1 bug aberto | testar a E7 (2 IK revertidos) |
| Menus / UI | V38 instalada, menu de pausa novo | conferir 3D, abas e retorno da missão em tela |
| Mapa / WRP | cliente e servidor alinhados (rev. 17865) | manter a regra em qualquer build futura |
| Portas e ações | servidor V127 pronto | validar abrir/fechar/entrar em jogo |
| Inventário | redesign iniciado, antigo + novo coexistem | decidir se continua ou volta ao nativo |
| FPS perto de cidades | **prioridade alta** · F2: personagem/casas ok, grama/sombra falharam, FPS baixo | confirmar regressões e testar A+B+C+D+E em Release |
| Infra de builds | funcionando | script único de instalar + testar + resumir RPT |
| Documentação | site com feed do GitHub e changelog | manter a cada build |

## Animações

### O que estamos fazendo

Portando os RTMs do **DayZ 1.30** para dentro do `anims.pbo` do **0.45**, mantendo o CfgMoves
antigo (o config do 1.30 tem estados que o 0.45 não conhece). Tudo precisa caber em um único
PBO porque dois PBOs com o mesmo prefixo não montam juntos. O teto prático é **~1,1 GB**.

### Onde chegamos

- **1.390 de 2.028** animações (68,5%) em formato 1.30 na E6; 638 continuam BMTR 0.45
- Build **E6** instalada: 875,8 MiB, 2.053 entradas, SHA1 `7AF66887…EA48`
- Em jogo: `PLAYING` com **12** `not found or empty` e **23** `Bad move` — baseline vanilla
- **E7** pronta: 875,7 MiB, SHA1 `A986CA7C…166C`, 2 IK da pilha revertidos, **não testada**
- Trim de ossos (156 → 120) reduziu 23,45% e liberou espaço (1.425,7 → 1.091,4 MB)
- 140 arquivos de menu 1.30 ficaram fora; preview do inventário voltou ao 0.45
- 84 tracks `ik/` substituídos; arremessos e sinais em 1.30

### O que falta

| # | Item | Tamanho | Estado |
|---|---|---|---|
| 1 | **Lanterna + pilha esticam os braços** | 6 arquivos | **aberto — prioridade máxima; E7 pronta** |
| 2 | Revisar os 84 tracks `ik/` (comer, beber, curar, mapas) | 84 arquivos | não testado item a item |
| 3 | Menu 1.30 (preview do inventário) | 140 arquivos, +255 MB | opcional, risco de teto |
| 4 | Preview alternativo `p_menu_unarmed_idleMain02` | 1 arquivo | não testado |
| 5 | Animações de zumbi do 1.30 | 273 arquivos | bloqueado por rig |
| 6 | Recriar troca de arma, stops, urinar/defecar | ~192 arquivos | não existem na 1.30 |
| 7 | Transições do 1.30 (171 de postura) | — | sem estado equivalente no config 0.45 |
| 8 | Validar as 1.390 em jogo, item por item | — | só o RPT não basta |

**Plano do bug 1 (E7):** reverter os 2 tracks `ik\comsumables\9v_battery` e `battery_d` para o
0.45 e testar. Se continuar esticando, reverter os 4 estados `batteryLicking` (E8). Se
continuar, revisar as transições da ação.

**Critério de pronto:** segurar lanterna, lamber pilha, comer maçã, beber cantil, usar
bandagem, abrir mapa e usar bússola sem deformação — e o RPT fechando em 12 / 23 / 15.

## Menus e UI

- `ui.pbo` está em 48.349.274 B (46,1 MiB), SHA-256 `EBC95ACE…5500`, pacote **V38**
- O V38 reescreveu `RscDisplayMPInterrupt` e `RscDisplayInterrupt`; só o `ui.pbo` mudou
- **Falta conferir em tela:** mundo 3D ao fundo, logo, card “Check-up completo 25/35”,
  CONTIUAR/OPÇÕES/SAIR/RESPAWN, abas OFFICIAL/COMMUNITIES/LAN, Change Server e retorno da
  missão sem sobreposição legacy
- **Falta fazer o backup do `ui.pbo` anterior** — o restore point
  `restore-point-v38-pause-menu-20261117\ui-before.pbo` existe, mas o backup “oficial” do
  pacote ainda não foi separado
- O menu 1.30 completo (+255 MB) só entra se o preview atual incomodar

## Mapa, WRP e terreno

- Cliente e servidor usam `worlds_chernarusplus.pbo` **revisão 17865**, SHA-256
  `0B8DAD26F376B892376C45240D630C14C126A84D0C31D0492384EF9371C78E28`
- O `worlds_chernarusplus_data.pbo` precisa ser o do `Addons` atual; a V31 misturou WRP do
  servidor com 509 texturas de outro pacote e o terreno ficou vermelho/rosa
- **Regra:** se uma build futura reempacotar o WRP do cliente, o crash de entrada volta
- Procedimento manual de alinhamento em 5 passos está no
  `HISTORICO-CORRECOES-E-PENDENCIAS.md`

## Portas e ações

- Servidor de teste atual: `DayZServer-DoorUserTypeExecV127`
- Pacotes V121/V123/V124–V127 investigaram resolução de ação de porta e procura de objeto
- **Falta validar em jogo:** abrir, fechar, trancar, arrombar e entrar em portas de casas,
  cercas e construções; registrar o tipo de porta que falhar

## Inventário

- Rotação de item (espaço) e sincronização de mãos/`Hands` estão funcionando
- O redesenho visual inspirado no inventário novo foi iniciado, mas o antigo e o novo
  coexistem; o painel novo ainda não tem personagem/itens funcionais
- **Decisão pendente:** continuar o redesign ou congelar no inventário nativo atual
- Backup: `backup-inventory-redesign-20261117`

## FPS e motor

A frente tem aba própria em **Pendências → Resolver Drop de FPS** (prioridade alta).

- Pista dos devs: “processamento de objetos antes da renderização — tudo dentro de `Scene::DrawObject***`, preparação de materiais e polígonos”. O caminho real é `Object::Draw` → `Shape::Draw` → `DrawSections` (`PrepareTL`/`DrawSectionTL`).
- **Candidato F** testado: o FPS subiu, mas a cena quebrou (personagem invisível em 3ª
  pessoa, casas/árvores somem quando a câmera se aproxima e a grama pisca). **Ganho inválido.**
- **F2** testada: personagem e casas/árvores voltaram, mas a **grama aparece só de vez em quando** e a **sombra do personagem fica nas costas**; o **FPS ficou baixo**. Correção visual **parcial**, sem ganho de performance. A linha F/F2 está encerrada como não vantajosa.
- Causa do F: escopo de predicação nunca gravado (`CopyCBPredicatedScope` com `scope.beg < 0`);
  o passe de cor interpretava o escopo como vazio.
- **Ponto de retomada:** confirmar F2 vs Original (grama/sombra), depois compilar A+B+C+D+E em
  Release (sem F/F2) a partir de `backup-fps-f-20261117-164157` e medir. Se não pagar, o alvo
  passa a ser o custo por objeto no passe de cor (`Scene::DrawObjectsInstanced`/`Shape::DrawSections`).
- Critério para declarar ganho: cena completa (personagem, casas/árvores de perto, grama,
  água, PiP, sombras) + FPS melhor no mesmo ponto, vsync off.
- Cuidado: build de engine em paralelo consome todos os núcleos e trava o jogo em
  “não respondendo” — subir o jogo para `AboveNormal` resolve.

## Infra e entrega

- Backups: `ANIMS-WORK-20261117\backup\` (builds) e `out\` (todas as E1–E7)
- `anims.pbo` fica travado enquanto o cliente roda — instalar sempre com o jogo fechado
- Launcher de teste: `schtasks /run /tn "DayZTestLaunch"` (servidor, 40 s de espera, cliente)
- Falta um script único que faça: fechar jogo → copiar → conferir SHA1 → abrir servidor +
  cliente → resumir o RPT
- O cliente v37-clean de 18/11 00:10 não permaneceu aberto; o RPT parou no carregamento e
  não houve crash. Havia outro cliente (`DayZInt-F.exe`) aberto ao mesmo tempo

## Regras que não podem ser esquecidas

1. **PBO único** — dois PBOs com o mesmo prefixo `DZ\anims` e o segundo é ignorado.
2. **Teto de ~1,1 GB** — a D2 (1.374 MB) travou em `Updating base class ->Grid`.
3. **WRP igual nos dois lados** — revisão + SHA-256 do `worlds_chernarusplus.pbo`.
4. **Prefixo do PBO com uma barra** — `prefix=bin\`, nunca `prefix=bin\\`.
5. **RPT é append** — cortar no último `Current time:` para medir a sessão.
6. **Prioridade do jogo** — `AboveNormal` quando houver build de engine em paralelo.
7. **Ordem de ossos não importa** — o motor casa por nome; não reordenar RTMs.
8. **Backup antes de mexer** — restore point + hash do arquivo alterado.

## Rotina de teste (checklist)

1. Fechar o jogo
2. Copiar o build e conferir o SHA1
3. Subir servidor + cliente
4. RPT: 12 `not found or empty`, 23 `Bad move`, 15 `Invalid move`, 1 `PLAYING`
5. No jogo: inventário, arremesso com/sem arma, soco, cerca, sinais com arma, lanterna,
   pilha, comida, bebida, bandagem, mapa, bússola, portas, menu de pausa e navegador
6. Anotar o que falhou **com o nome do item e da ação** — é isso que permite achar o RTM
