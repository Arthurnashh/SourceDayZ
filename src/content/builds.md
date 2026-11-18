# Builds E1 a E7 · histórico

Registro das builds de animação geradas entre 17 e 18/11/2026. Todas saem de
`ANIMS-WORK-20261117\out\` e a testada vira `Addons\anims.pbo`.

| Build | Hora | Tamanho | O que mudou | Resultado |
|---|---|---|---|---|
| E1 | 17/11 11:02 | 1.056,5 MiB | primeiro pacote completo de RTMs 1.30 | carregou, mas passava do teto seguro |
| E2 | 17/11 11:13 | 1.030,1 MiB | ajuste de lotes | estável |
| E3 | 17/11 11:45 | 1.037,8 MiB | mais lotes, menu 1.30 ainda dentro | estável; backup guardado |
| E4 | 17/11 12:12 | 874,4 MiB | **trim de ossos** em 1.523 arquivos + menu 0.45 | 12 faltantes, 23 `Bad move`, `PLAYING` |
| E5 | 17/11 12:33 | 878,6 MiB | +5 mapeamentos (arremessos e preview 1.30) | testada; preview reprovado |
| **E6** | 17/11 16:01 | **875,8 MiB** | preview revertido ao 0.45, arremessos 1.30 | em jogo, sem erro novo |
| **E7** | 18/11 00:03 | **875,7 MiB** | 2 IK da pilha revertidos para 0.45 | pronta, **não instalada/testada** |

## Referência da E6 (em jogo)

```text
arquivo   Addons\anims.pbo
bytes     918.323.340
MiB       875,8
entradas  2.053
RTMs      2.028 válidos (1.390 RTM_0101 + 638 BMTR)
SHA1      7AF6688728D015F9A326B257918AC51F95CBEA48
```

O manifesto `replaced_files.json` tem **1.526 caminhos únicos** (1.527 registros, um
duplicado): 140 de menu, que ficaram fora da E6, e 1.386 de gameplay, que entraram. Além
desses, 4 RTMs de 1.30 foram adicionados fora do manifesto (3 `InjL...breath` e 1
`Ainv...pills`), fechando os 1.390.

## Referência da E7 (pronta)

```text
arquivo   ANIMS-WORK-20261117\out\anims_E7.pbo
bytes     918.285.584
MiB       875,7
entradas  2.053
RTMs      2.028 válidos (1.388 RTM_0101 + 640 BMTR)
SHA1      A986CA7C65D1820297CA9EF1EAFC7A1599F6166C
amostras  10/10 idênticas à árvore
mudança   9v_battery.rtm (4.187 B) e battery_d.rtm (4.209 B) em BMTR 0.45
```

A E7 é o **primeiro passo** da correção da lanterna/pilha. Se o bug continuar, o próximo passo
é reverter os 4 estados `batteryLicking` para o 0.45 e reempacotar como E8.

## Builds descartadas (referência)

| Build | Bytes | Motivo do descarte |
|---|---|---|
| `anims_teste` | 169 MB | teste de montagem |
| `anims_full` / `v2` | 516 MB | sem o config final |
| `anims_transitions` | 520 MB | lote só de transições |
| `anims_D1` | 520 MB | bisect de config |
| `anims_D1_sig` | 634 MB | com sinais armados |
| **`anims_D2`** | **1.374 MB** | **travou em `Updating base class ->Grid` — teto de tamanho** |
| `anims_E1`–`E3` | 1.030–1.038 MiB | pesadas demais |

## Instalar e testar

```bat
:: 1. fechar o jogo (o PBO fica travado enquanto o cliente roda)
:: 2. copiar (troque E@ pelo build desejado)
copy /Y "D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo" ^
     "D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\Addons\anims.pbo"

:: 3. conferir o hash
certutil -hashfile "...\Addons\anims.pbo" SHA1

:: 4. subir servidor + cliente
schtasks /run /tn "DayZTestLaunch"
```

Hash esperado depois da cópia:

| Build | SHA1 |
|---|---|
| E6 | `7AF6688728D015F9A326B257918AC51F95CBEA48` |
| E7 | `A986CA7C65D1820297CA9EF1EAFC7A1599F6166C` |

## Como ler o RPT

O RPT é **append**: para medir a sessão atual, corte o texto no último `Current time:`.

| Linha | Baseline aceitável |
|---|---|
| `Animation ... not found or empty` | 12 |
| `Bad move` | 23 |
| `Invalid move ... disarm` | 15 |
| `PLAYING` | 1 |

Qualquer número acima disso é regressão da build.

## Histórico de incidentes

- **16:02–16:10 — cliente e servidor "não respondendo".** Não era o PBO: 5 `CL.exe` de um
  build de engine ocupavam 100% dos 4 núcleos e os processos do jogo estavam em
  `BelowNormal`. Subir para `AboveNormal` resolveu na hora.
- **23:37 — o mesmo quadro se repetiu** com a E6: prioridade baixa + build em paralelo.
  Regra prática: nunca testar animação com build de engine rodando, ou subir a prioridade
  do jogo.
- **18/11 00:10 — cliente v37-clean não permaneceu aberto.** O RPT da sessão de 00:10:53
  parou em `Cannot load material file physics/materials.h`, com 0 `PLAYING`, e o processo
  saiu por volta de 75 s. Não houve evento de crash/AppHang; havia outro cliente
  (`DayZInt-F.exe`, build de FPS) aberto ao mesmo tempo. O servidor ficou estável em 596 MB.
