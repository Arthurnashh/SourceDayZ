# Estrutura do código-fonte

> **Não é engenharia reversa.** Esta é a árvore real do código-fonte da Bohemia
> Interactive, entregue como projeto Visual Studio:
> `D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252`.
> Todos os números abaixo foram medidos por `tools/build_source_data.py` (arquivo por
> arquivo, sem estimativa), e cada afirmação estrutural aponta o arquivo que a comprova.

## 1. Raiz do projeto

| Item | O que é |
|---|---|
| `DayZ.sln` | solução Visual Studio 2010, **6 projetos** |
| `DayZ2010.sln` | solução gêmea, os mesmos 6 projetos |
| `buildNo.h` | número de build compilado no binário |
| `rv.natvis` | visualizador de tipos do depurador (`Ref<>`, `RString`, `Vector3`) |
| `DayZ.smproj` | projeto auxiliar de build, 36 MB, gerado |

Evidência da solução: `DayZ.sln:1-2` — `Format Version 12.00` / `# Visual Studio 2010`.
Os seis projetos (`DayZ.sln:3-14`):

```text
cfg            -> cfg\cfg2010.vcxproj
lib            -> lib\lib2010.vcxproj        (o jogo)
LaunchServer   -> LaunchServer\LaunchServer.vcxproj
BulletCollision-> extern\bullet2.76\msvc\2010\BulletCollision.vcxproj
BulletDynamics -> extern\bullet2.76\msvc\2010\BulletDynamics.vcxproj
LinearMath     -> extern\bullet2.76\msvc\2010\LinearMath.vcxproj
```

## 2. As pastas que importam

Medição real, excluindo `build/`, `dist/` e os `backup-*` de trabalho:

| Pasta | Arquivos | Tamanho | Papel |
|---|---:|---:|---|
| `Addons/` | 232 | 6.145 MB | 116 PBOs + 116 assinaturas `.bisign` |
| `lib/` | 5.480 | 3.000 MB | o jogo e o motor (inclui `lib/obj/`, objetos de build) |
| `extern/` | 8.354 | 816 MB | SDKs de terceiros |
| `cfg/` | 1.655 | 33 MB | configuração do jogo (Cfg*) |
| `ComRef/` | 40 | 6 MB | manual de comandos SQF (`comref.xml`) |
| `El/` | 537 | 5 MB | biblioteca base (streams, parser, rede, matemática) |
| `Enfusion/` | 191 | 4 MB | engine nova (VM Enforce, render, física, áudio) |
| `Drobnosti/` | 188 | 2 MB | utilitários internos |
| `RV/` | 177 | 2 MB | runtime de voz e KBBase |
| `Es/` | 116 | 1 MB | containers, strings, threads |
| `bin/` | 58 | 2 MB | config compilada em C++ (`cfg*.hpp`) |
| `PerfLog/` | 27 | 1 MB | captura de perfil |
| **total medido** | **20.171** | **9,83 GB** | |

E as duas pastas geradas, que **não são código**:

| Pasta | Arquivos | Tamanho | O que é |
|---|---:|---:|---|
| `build/` | 18.162 | 187 GB | saída de compilação (`port-x64/`, `.obj`, `.pdb`, mapas) |
| `dist/` | 690 | 1,4 GB | binários finais e pacote do cliente/servidor |

## 3. `lib/` — o jogo

`lib/` é onde 90% do comportamento do DayZ vive. Os `.cpp` ficam **na raiz** de `lib/`
(361 arquivos `.cpp/.hpp/.h`), e as subpastas guardam os subsistemas:

| Caminho | Arquivos | O que é |
|---|---:|---|
| `lib/*.cpp` + `lib/*.hpp` | 718 fontes | motor e gameplay (`world.cpp`, `scene.cpp`, `object.cpp`, `zombie.cpp`) |
| `lib/obj/` | 2.882 | **saída de build**, não source |
| `lib/lib/build/` | 1.657 | **saída de build** (1.454 `.obj`), com `zombie-collision-diag-v10*/` |
| `lib/GameSpy/` | 111 | SDK de matchmaking legado |
| `lib/d3d9/` | 42 | backend DirectX 9 (51.549 linhas) |
| `lib/d3dT/` | 23 | pipeline T&L legado |
| `lib/d3dXB/` | 107 | backend Xbox 360 |
| `lib/UI/` | 42 | HUD, menus, widgets |
| `lib/Network/` | 30 | cliente/servidor, pacotes, JIP |
| `lib/AI/` | 17 | navegação, sensores, comportamento |
| `lib/Inventory/` | 20 | inventário e containers |
| `lib/Protect/` | 22 | proteção de dados |
| `lib/Shape/` | 20 | geometria e LOD |
| `lib/Tools/` | 24 | ferramentas internas |

O mesmo padrão se repete nas outras camadas:

- `El/` tem 62 subpastas — `QStream/` (PBO e streams), `ParamFile/`, `Evaluator/`
  (interpretador SQF), `PreprocC/`, `MultiThread/`, `Network/`.
- `Enfusion/` tem `include/` (109) e `src/` (82) — `script/`, `render/`, `physics/`,
  `animation/`, `sound/`, `resources/`.
- `extern/` tem 39 subpastas.

## 4. `extern/` — o teto técnico

| Dependência | Arquivos | Tamanho | Versão / uso |
|---|---:|---:|---|
| `boost/` | 3.774 | 26 MB | containers e utilitários, anterior ao C++11 |
| `Botan/` | 1.682 | 9 MB | criptografia |
| `bullet2.76/` | 585 | 23 MB | física (Bullet **2.76**) |
| `SimulWeather/` | 591 | 259 MB | nuvens/atmosfera |
| `RotorLib/` | 251 | 364 MB | IA de helicópteros |
| `DXSDK/` | 138 | 29 MB | DirectX SDK 2010 (`Include/`, `Lib/`) |
| `libcurl/` | 269 | 3 MB | HTTP |
| `Steamworks/` | 34 | 12 MB | Steam |
| `svn-win32-1.7.2/` | 574 | 41 MB | cliente SVN embutido |
| `ogg/`, `vorbis/`, `theora/`, `speex-*` | — | — | áudio e vídeo |

`cfg/Bin/` e `bin/` guardam os **mesmos** headers `cfg*.hpp` (ex.: `cfgVehicles.hpp`,
120 KB): a configuração do jogo é **compilada dentro do executável**, não só lida de
`config.cpp` em tempo de execução.

## 5. `Addons/` — o conteúdo empacotado

`Addons/` tem exatamente **116 `.pbo` e 116 `.bisign`** (assinatura por arquivo), 6.145 MB.
É a prova de que o conteúdo do jogo não está em pastas soltas nesta árvore: ele já vem
empacotado no formato descrito na aba **PBOs**.

## 6. Como ler a árvore

1. `lib/*.cpp` — comportamento (mundo, cena, objeto, zumbi, rede, IA).
2. `El/` + `Es/` — fundação (streams, containers, ParamFile, threads).
3. `Enfusion/` — engine nova, incompleta neste snapshot.
4. `extern/` — dependências e o limite de modernização (Bullet 2.76, DXSDK 2010).
5. `cfg/` + `Addons/` — dados: config compilada e PBOs assinados.

Onde o código já foi alterado, a aba **Mudanças** aponta `arquivo:linha` de cada patch.

> `[pendente]` mapear arquivo a arquivo o conteúdo de cada PBO (o índice de funções
> cobre apenas o código C++, não os dados empacotados).
