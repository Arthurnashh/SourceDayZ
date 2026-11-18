# Como o jogo é compilado

> Tudo aqui vem dos próprios arquivos de projeto em
> `D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252`. Não há CMake, premake nem
> script mágico: o build é **Visual Studio 2010** (`.sln` + `.vcxproj`) e, como legado,
> um `Makefile` GNU.

## 1. Programa principal: Visual Studio 2010

| Item | Valor | Evidência |
|---|---|---|
| Solução | `DayZ.sln` / `DayZ2010.sln` | `DayZ.sln:1-2` |
| Formato | `Format Version 12.00`, `# Visual Studio 2010` | `DayZ.sln:1-2` |
| Toolset do jogo | **v100** (MSVC 10.0 / VS2010) | `lib/lib2010.vcxproj:118,123` |
| Toolset usado neste build | **v141** (MSVC 14.16) por override | `build/inventory-menu-v10/cpp-build-release-v31.log` |
| Plataformas | `Win32` e `Xbox 360` | `DayZ.sln` (SolutionConfigurationPlatforms) |
| Configurações | 12 (Debug, Release, Retail, Retail Server, Retail Steam, Retail Demo, Release Demo, ReleaseNoOpt, Profile, Testing, Debug Server, Buldozer) | `DayZ.sln` |
| Saída | `..\dist\` | `lib/lib2010.vcxproj:345-383` |

O toolset **não é uniforme**: `BankRev` foi atualizado para **v110** (VS2012)
(`BankRev/BankRev.vcxproj`), enquanto o jogo continua em v100. `cfg`, `binarize` e
`FileBank` são `.vcxproj` antigos **sem** `PlatformToolset` declarado — herdam o padrão da
instalação.

Na prática, esta máquina **compila**: MSBuild 15.9.30 (VS2017) com `PlatformToolset=v141`
por override. O log `cpp-build-release-v31.log` termina em
`lib2010.vcxproj -> ...\cpp-out-v31\DayZInt.exe`, com linker `14.16.27054.0` e Windows
SDK `10.0.19041`. Compilar código de 2001 em MSVC 14.16 exigiu ajustes em headers antigos
(`El/Math/math3dp.hpp`, `Es/Containers/typeopts.hpp`, `Enfusion/include/common/enf_mathlib.h`,
`lib/appName.h`, `lib/wpch.hpp`), guardados em `backup-v141-compat-20261116/`.

## 2. Os 6 projetos

`DayZ.sln:3-14`:

| Projeto | Caminho | Tipo |
|---|---|---|
| `cfg` | `cfg\cfg2010.vcxproj` | config do jogo compilada em C++ |
| `lib` | `lib\lib2010.vcxproj` | **o executável** (motor + gameplay) |
| `LaunchServer` | `LaunchServer\LaunchServer.vcxproj` | lançador do servidor dedicado |
| `BulletCollision` | `extern\bullet2.76\msvc\2010\...` | física |
| `BulletDynamics` | `extern\bullet2.76\msvc\2010\...` | física |
| `LinearMath` | `extern\bullet2.76\msvc\2010\...` | matemática do Bullet |

## 3. O que cada configuração gera

`lib/lib2010.vcxproj:448-452` — o nome do binário muda por configuração:

| Configuração | TargetName | Uso |
|---|---|---|
| `Release\|Win32` | `DayZInt` | build interno de desenvolvimento |
| `Retail\|Win32` | `DayZ` | cliente de produção |
| `Retail Server\|Win32` | `DayZServer` | servidor dedicado |
| `Retail Steam\|Win32` | `DayZSteam` | variante Steam |
| `Retail Demo\|Win32` | `DayZDemo` | demo |
| demais | `DayZ$(Configuration)` | Debug, Profile, Testing, Buldozer… |

Saída real em `dist/` (medida):

```text
dist\DayZ.exe        11.230 KB
dist\DayZInt.exe     13.517 KB
dist\DayZ.pdb        69.491 KB   (símbolos)
dist\DayZ.map        12.109 KB   (endereço -> símbolo)
dist\binarize.exe    13.517 KB
dist\steam_api.dll      104 KB
```

O `.pdb` de 69 MB e o `.map` de 12 MB são o que permite *resolver* um crash para
`arquivo:linha` — é o mesmo motivo pelo qual este estudo consegue citar linha.

## 4. Diretórios de include e defines

`lib/lib2010.vcxproj:474` (Debug\|Win32):

```text
$(SolutionDir)
$(SolutionDir)PhysicalLibs\RigidBody\ODE
$(SolutionDir)extern
$(SolutionDir)extern\dxsdk\include
$(SolutionDir)extern\SimulWeather
$(SolutionDir)Enfusion\include
```

Defines principais (`lib2010.vcxproj:475` e `:534`):

| Define | Significado |
|---|---|
| `_ENABLE_PHYSICS=1` | física ativa |
| `_ENABLE_PBO_PROTECTION=1` | PBOs com header protegido (AES) |
| `_ENABLE_DLC_SUPPORT=1` | suporte a DLC |
| `_SERVER=1` | variante servidor (config Retail Server) |
| `_SUPER_RELEASE=1`, `_SECUROM=1` | build de produção |
| `_GAMES_FOR_WINDOWS=0` | sem GFWL |
| `_DEBUG` / `_RELEASE=1` / `NDEBUG` | modo de build |

## 5. Bibliotecas linkadas

`lib/lib2010.vcxproj:499` (lista real, resumida):

```text
ddraw.lib dxguid.lib winmm.lib version.lib Iphlpapi.lib
vorbisfilemtd.lib libspeexMtd.lib libspeexdspMtd.lib
rsamt.lib libbulletcollision_d.lib libbulletdynamics_d.lib ...
```

`ddraw.lib` e `dxguid.lib` aparecem porque o código ainda carrega caminhos DirectDraw/DX9.
`legacy_stdio_definitions.lib` é o remendo para compilar código de 2001 com a CRT moderna.

## 6. Os programas que compilam e empacotam

| Programa | Onde | Função |
|---|---|---|
| **MSVC 10.0 (`cl.exe`, v100)** | VS2010 | compila `lib`, `cfg`, `LaunchServer` |
| **MSBuild / `devenv`** | VS2010 | orquestra a `.sln` |
| **Windows SDK 7.1** | VS2010 | headers/libs do Windows (`winmm`, `version`, `Iphlpapi`) |
| **DirectX SDK 2010** | `extern/DXSDK` | `d3dx9`, `dxguid`, shaders |
| **Bullet 2.76** | `extern/bullet2.76` | física, compilada como 3 projetos |
| **`binarize.exe`** | `binarize/` → `dist/` | otimiza `.p3d`/`.wrp` (LOD, texturas, malhas) |
| **`FileBank`** | `FileBank/` | **cria os PBOs** |
| **`BankRev`** | `BankRev/` | lista/extrai PBO |
| **`CheckBank`** | `CheckBank/` | verifica integridade de PBO |
| **`XBOXPBORepack`** | `XBOXPBORepack/` | reempacota PBO para Xbox 360 |
| **`texMerge`** | `texMerge/` | junta texturas em atlas |
| **`buldozer`** | `buldozer/` | editor/visualizador de modelos |
| **`CfgEdit`** | `CfgEdit/` | edita `config.cpp` (ParamFile) |
| **`OFPPatch` / `OPFCreatePatch`** | pastas homônimas | patch de addons OFP |
| **GNU `make` + gcc/g++** | `Makefiles/Makefile` | build legado Linux |

Evidência do build legado: `Makefiles/Makefile:34-58` define `CC=gcc`, `CCC=g++`,
`CPUFLAGS = -m32 -msse2` — anterior à migração para Windows/VS.

## 7. Sequência real de build (modelo)

1. **Compilar** `lib` + `cfg` + Bullet na configuração desejada → `dist\DayZ*.exe`.
2. **Binarizar** modelos e mundos com `binarize.exe` (`binarize/ReadMe.txt` traz as
   linhas de comando reais, ex.: `-textures=Optimize -exclude=… Data3D Optimize\Data3D *.p3d`).
3. **Empacotar** as pastas em PBO com `FileBank` (ou `binarize` em modo addon).
4. **Assinar** cada PBO, gerando o `.bisign` ao lado.
5. **Distribuir** `DayZ.exe` + `Addons/*.pbo` + `Addons/*.bisign` + chaves.

`binarize/deploy.bat` e `FileBank/deploy.bat` automatizam os passos 2–3 na máquina da BI.

## 8. Limites conhecidos deste snapshot

- `lib/lib2010.vcxproj` declara **v100**; abrir em VS2019/2022 sem retarget falha com
  `MSB8020`. Aqui o retarget é feito por override de `PlatformToolset=v141` (VS2017), e
  funciona — mas exige os ajustes de compatibilidade listados na seção 1.
- `BankRev` já está em v110: sinal de atualização parcial, não de build moderno.
- Avisos que permanecem no log: `C4005` (`DXGI_ERROR_*` entre `extern/DXSDK` e Windows
  SDK 10), `C4477` em `lib/d3d9/txtd3D9.cpp:3843` e `LNK4217` (`_floor` via `xapobased.lib`).
- `[pendente]` confirmar a versão exata do Windows SDK usada na máquina da BI (o projeto
  não fixa `WindowsTargetPlatformVersion`).
