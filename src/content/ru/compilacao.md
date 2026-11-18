# Как компилируется игра

> Всё здесь взято из самих файлов проекта в
> `D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252`. Здесь нет CMake, premake или
> магического скрипта: сборка — это **Visual Studio 2010** (`.sln` + `.vcxproj`) и, как наследие,
> GNU `Makefile`.

## 1. Основная программа: Visual Studio 2010

| Элемент | Значение | Доказательство |
|---|---|---|
| Решение | `DayZ.sln` / `DayZ2010.sln` | `DayZ.sln:1-2` |
| Формат | `Format Version 12.00`, `# Visual Studio 2010` | `DayZ.sln:1-2` |
| Toolset игры | **v100** (MSVC 10.0 / VS2010) | `lib/lib2010.vcxproj:118,123` |
| Toolset этой сборки | **v141** (MSVC 14.16) через override | `build/inventory-menu-v10/cpp-build-release-v31.log` |
| Платформы | `Win32` и `Xbox 360` | `DayZ.sln` (SolutionConfigurationPlatforms) |
| Конфигурации | 12 (Debug, Release, Retail, Retail Server, Retail Steam, Retail Demo, Release Demo, ReleaseNoOpt, Profile, Testing, Debug Server, Buldozer) | `DayZ.sln` |
| Вывод | `..\dist\` | `lib/lib2010.vcxproj:345-383` |

Toolset **не однороден**: `BankRev` обновлён до **v110** (VS2012)
(`BankRev/BankRev.vcxproj`), а игра остаётся на v100. `cfg`, `binarize` и
`FileBank` — старые `.vcxproj` **без** объявленного `PlatformToolset`, они наследуют
значение по умолчанию из установки.

На практике эта машина **компилирует**: MSBuild 15.9.30 (VS2017) с `PlatformToolset=v141`
через override. Лог `cpp-build-release-v31.log` заканчивается на
`lib2010.vcxproj -> ...\cpp-out-v31\DayZInt.exe`, с линкером `14.16.27054.0` и Windows
SDK `10.0.19041`. Компиляция кода 2001 года в MSVC 14.16 потребовала правок старых
заголовков (`El/Math/math3dp.hpp`, `Es/Containers/typeopts.hpp`, `Enfusion/include/common/enf_mathlib.h`,
`lib/appName.h`, `lib/wpch.hpp`), сохранённых в `backup-v141-compat-20261116/`.

## 2. Шесть проектов

`DayZ.sln:3-14`:

| Проект | Путь | Тип |
|---|---|---|
| `cfg` | `cfg\cfg2010.vcxproj` | конфиг игры, скомпилированный в C++ |
| `lib` | `lib\lib2010.vcxproj` | **исполняемый файл** (движок + геймплей) |
| `LaunchServer` | `LaunchServer\LaunchServer.vcxproj` | лаунчер выделенного сервера |
| `BulletCollision` | `extern\bullet2.76\msvc\2010\...` | физика |
| `BulletDynamics` | `extern\bullet2.76\msvc\2010\...` | физика |
| `LinearMath` | `extern\bullet2.76\msvc\2010\...` | математика Bullet |

## 3. Что создаёт каждая конфигурация

`lib/lib2010.vcxproj:448-452` — имя бинарника зависит от конфигурации:

| Конфигурация | TargetName | Использование |
|---|---|---|
| `Release\|Win32` | `DayZInt` | внутренняя сборка для разработки |
| `Retail\|Win32` | `DayZ` | продакшн-клиент |
| `Retail Server\|Win32` | `DayZServer` | выделенный сервер |
| `Retail Steam\|Win32` | `DayZSteam` | вариант для Steam |
| `Retail Demo\|Win32` | `DayZDemo` | демо |
| остальные | `DayZ$(Configuration)` | Debug, Profile, Testing, Buldozer… |

Реальный вывод в `dist/` (измерено):

```text
dist\DayZ.exe        11 230 KB
dist\DayZInt.exe     13 517 KB
dist\DayZ.pdb        69 491 KB   (символы)
dist\DayZ.map        12 109 KB   (адрес -> символ)
dist\binarize.exe    13 517 KB
dist\steam_api.dll      104 KB
```

`.pdb` на 69 MB и `.map` на 12 MB — именно они позволяют *разрешить* краш до
`файл:строка`; по той же причине это исследование может цитировать строки.

## 4. Каталоги include и define

`lib/lib2010.vcxproj:474` (Debug\|Win32):

```text
$(SolutionDir)
$(SolutionDir)PhysicalLibs\RigidBody\ODE
$(SolutionDir)extern
$(SolutionDir)extern\dxsdk\include
$(SolutionDir)extern\SimulWeather
$(SolutionDir)Enfusion\include
```

Основные define (`lib2010.vcxproj:475` и `:534`):

| Define | Значение |
|---|---|
| `_ENABLE_PHYSICS=1` | физика включена |
| `_ENABLE_PBO_PROTECTION=1` | PBO с защищённым заголовком (AES) |
| `_ENABLE_DLC_SUPPORT=1` | поддержка DLC |
| `_SERVER=1` | серверный вариант (конфиг Retail Server) |
| `_SUPER_RELEASE=1`, `_SECUROM=1` | продакшн-сборка |
| `_GAMES_FOR_WINDOWS=0` | без GFWL |
| `_DEBUG` / `_RELEASE=1` / `NDEBUG` | режим сборки |

## 5. Подключаемые библиотеки

`lib/lib2010.vcxproj:499` (реальный список, сокращённо):

```text
ddraw.lib dxguid.lib winmm.lib version.lib Iphlpapi.lib
vorbisfilemtd.lib libspeexMtd.lib libspeexdspMtd.lib
rsamt.lib libbulletcollision_d.lib libbulletdynamics_d.lib ...
```

`ddraw.lib` и `dxguid.lib` присутствуют, потому что код всё ещё несёт пути DirectDraw/DX9.
`legacy_stdio_definitions.lib` — заплатка для компиляции кода 2001 года с современной CRT.

## 6. Программы, которые компилируют и упаковывают

| Программа | Где | Функция |
|---|---|---|
| **MSVC 10.0 (`cl.exe`, v100)** | VS2010 | компилирует `lib`, `cfg`, `LaunchServer` |
| **MSBuild / `devenv`** | VS2010 | управляет `.sln` |
| **Windows SDK 7.1** | VS2010 | заголовки/библиотеки Windows (`winmm`, `version`, `Iphlpapi`) |
| **DirectX SDK 2010** | `extern/DXSDK` | `d3dx9`, `dxguid`, шейдеры |
| **Bullet 2.76** | `extern/bullet2.76` | физика, собирается как 3 проекта |
| **`binarize.exe`** | `binarize/` → `dist/` | оптимизирует `.p3d`/`.wrp` (LOD, текстуры, меши) |
| **`FileBank`** | `FileBank/` | **создаёт PBO** |
| **`BankRev`** | `BankRev/` | перечисляет/извлекает PBO |
| **`CheckBank`** | `CheckBank/` | проверяет целостность PBO |
| **`XBOXPBORepack`** | `XBOXPBORepack/` | перепаковывает PBO для Xbox 360 |
| **`texMerge`** | `texMerge/` | объединяет текстуры в атласы |
| **`buldozer`** | `buldozer/` | редактор/просмотрщик моделей |
| **`CfgEdit`** | `CfgEdit/` | редактирует `config.cpp` (ParamFile) |
| **`OFPPatch` / `OPFCreatePatch`** | одноимённые папки | патч аддонов OFP |
| **GNU `make` + gcc/g++** | `Makefiles/Makefile` | устаревшая сборка для Linux |

Доказательство устаревшей сборки: `Makefiles/Makefile:34-58` определяет `CC=gcc`, `CCC=g++`,
`CPUFLAGS = -m32 -msse2` — до перехода на Windows/VS.

## 7. Реальная последовательность сборки (модель)

1. **Скомпилировать** `lib` + `cfg` + Bullet в нужной конфигурации → `dist\DayZ*.exe`.
2. **Бинаризовать** модели и миры с `binarize.exe` (`binarize/ReadMe.txt` содержит
   реальные командные строки, например `-textures=Optimize -exclude=… Data3D Optimize\Data3D *.p3d`).
3. **Упаковать** папки в PBO с `FileBank` (или `binarize` в режиме addon).
4. **Подписать** каждый PBO, создавая `.bisign` рядом.
5. **Распространить** `DayZ.exe` + `Addons/*.pbo` + `Addons/*.bisign` + ключи.

`binarize/deploy.bat` и `FileBank/deploy.bat` автоматизируют шаги 2–3 на машине BI.

## 8. Известные ограничения этого снимка

- `lib/lib2010.vcxproj` объявляет **v100**; открытие в VS2019/2022 без retarget падает с
  `MSB8020`. Здесь retarget делается через override `PlatformToolset=v141` (VS2017), и
  это работает — но требует правок совместимости из раздела 1.
- `BankRev` уже на v110: признак частичного обновления, а не современной сборки.
- Предупреждения, остающиеся в логе: `C4005` (`DXGI_ERROR_*` между `extern/DXSDK` и Windows
  SDK 10), `C4477` в `lib/d3d9/txtd3D9.cpp:3843` и `LNK4217` (`_floor` через `xapobased.lib`).
- `[ожидает]` подтвердить точную версию Windows SDK на машине BI (проект
  не фиксирует `WindowsTargetPlatformVersion`).
