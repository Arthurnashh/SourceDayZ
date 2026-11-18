# Как работает движок DayZ

> Архитектура движка Real Virtuality / Enfusion в сборке 0.45.124252, с доказательствами
> из `lib/world.cpp`, `lib/scene.cpp`, `lib/object.cpp`, `lib/d3d9/` и `lib/d3d11/`.
> Каждое сильное утверждение указывает файл и строку.

## 1. Обзор за 30 секунд

Движок — это **единый цикл симуляции**, который распределяет время на кадр и делит остаток
между подсистемами. Жёсткого разделения «update / render» нет: скрипты, физика, рельеф,
ИИ и отрисовка идут в одном кадре, и тот, кто тратит больше, отнимает время у следующего.

- Мир симулируется в `World::Simulate` (`lib/world.cpp:11795`).
- Кадр бюджетируется `GTimeManager.Frame(estimateReserve)` (`world.cpp:11899/11946/11950`).
- Отрисовка подготавливается `World::PrepareDraw` (`world.cpp:7926`) и выполняется
  `Scene::Draw*` (`lib/scene.cpp`).
- Каждый объект попадает в графический бэкенд через `Object::Draw` (`lib/object.cpp:1968`).
- Устаревший бэкенд — `lib/d3d9/` (51 549 строк); новый — `lib/d3d11/` (**1 211 строк**,
  2,3% размера D3D9).

## 2. Карта исходников

| Папка | Файлов | Что это |
|---|---:|---|
| `lib/` | 2 407 | **игра и движок**: `main.cpp`, `world.cpp`, `scene.cpp`, `Network/`, `UI/`, `AI/`, `d3d9/`, `d3d11/` |
| `El/` | 537 | базовая библиотека: parser, archives, streams, сеть, математика, потоки |
| `Es/` | 116 | контейнеры, строки, потоки, файлы, память |
| `Enfusion/` | 193 | новый движок: VM скриптов Enforce, рендер, физика, анимация, аудио |
| `extern/` | 10 144 | SDK: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, ogg/vorbis |
| `cfg/` | 160 | конфигурация (ParamFile): инвентарь, оружие, транспорт, UI, миры |
| `ComRef/` | 40 | справочник команд SQF (`comref.xml`, 1 340 команд) |
| `PerfLog/` | 27 | захват и анализ профиля |

Четыре важных корня: `lib/` (игра), `El/`+`Es/` (фундамент), `Enfusion/` (новый
движок) и `extern/` (технический потолок). Остальное — инструменты и исторические варианты.

## 3. Реальный порядок кадра

Извлечено из `lib/world.cpp`, внутри `World::Simulate`:

```text
World::Simulate
├─ 11815  GMatrixCache.Clear()
├─ 11816  ClearClutterDrawCache()
├─ 11821  FreeOnDemandGarbageCollectMain()
├─ 11899/11946/11950  GTimeManager.Frame(estimateReserve)   ← бюджет кадра
├─ 12147  SimulateAllVehicles(deltaT)
├─ 12213  SimulateScripts(deltaT, timeLimit)                ← SQF/Enforce
├─ 12364  SimulateLandscape(deltaT)
├─ 12737  PrepareDraw(camInsideVehicle,false,FLT_MAX)       ← видимость/grid
├─ 12788  SimulateUI(deltaT)
├─ 12830  DrawScene(...)                                    ← Scene::Draw*
└─ 12848  DrawUI(...)
```

Что эти числа показывают:

1. **`SimulateScripts` идёт до `Draw`.** Скрипт работает в том же кадре и может изменить
   мир, который будет нарисован. Двойного буфера состояния нет.
2. **`SimulateLandscape` до `PrepareDraw`.** Рельеф симулируется *и* видимость
   подготавливается после: возможен дублирующий обход grid.
3. **`SimulateUI` после `PrepareDraw`** (вызов в `12421` закомментирован) — UI
   симулирует поверх уже подготовленного состояния.
4. **Два кеша очищаются каждый кадр**: матрицы (`GMatrixCache.Clear()`) и уже нарисованный
   clutter (`ClearClutterDrawCache()`). Это решение ради корректности, а не производительности — и прямой
   кандидат на оптимизацию (H-03).

## 4. Бюджет кадра

`World::Simulate` вычисляет, сколько времени остаётся на «остальное» кадра:

- С vsync: `vsyncTime = 1/RefreshRate()`, затем `CalculateFrameDuration(...)` и
  зарезервировано `restFrame = 0.045f` (45 ms).
- Без vsync: `GetSmoothFrameDuration()` и оценка `totalDuration - timeManaged`.

`restFrame = 0.045f` соответствует **~22 FPS**. Это константа 2013 года в
`world.cpp:11894`, и она остаётся там в 2026. На современном железе эта предпосылка недооценивает
доступный запас — записано как **H-01**.

Архитектурное следствие: движок **бюджетирует время** и распределяет его между активностями. Система,
которая превышает бюджет, задерживает всё следующее. Поэтому низкий FPS «заражает»
ИИ, сеть и скрипты: они получают меньше времени, не потому что сами медленные.

## 5. Модель потоков

Движок **многопоточный с явными блокировками**, не *lock-free*.

| Доказательство | Что означает |
|---|---|
| `main.cpp:11657-11660` `SetThreadName(-1,"Main"); RegisterMainThread();` | есть понятие главного потока, проверяемое assert |
| `scene.cpp:11189` `DoAssert(CheckMainThread())` | отрисовка может быть main-only в некоторых режимах |
| `Dx11EngineCore.hpp:87` `CriticalSection _meshSequenceLock` | worker рендера может вызывать `BeginMeshTL/DrawSectionTL/EndMeshTL` |
| `scene.cpp:11252` `GEngine->FlushBackgroundScope()` | существует фоновый scope рендера |
| `networkClient.cpp:1265` `BankList::ReadAccess banks(GFileBanks)` | конкурентное чтение банков |
| `shapeDraw.cpp:139-153` | список геометрии защищён синхронизацией |

Каждая блокировка на пути отрисовки (`ShapeGeometryLock`, `VertexBufferLock`,
`_meshSequenceLock`, `BankList::ReadAccess`) — точка сериализации. В городе с
множеством объектов вероятность конкуренции растёт — а конкуренция проявляется как **высокий frame time
без 100% CPU**, классический симптом ожидания блокировки.

## 6. От объекта до пикселя

Полный путь в порядке возникновения затрат:

```text
World::PrepareDraw            (world.cpp:7926)
  └─ вычисляет дистанции, прямоугольник grid, блокировки streaming
Scene::DrawObject             (scene.cpp:11186)   ← только forwarder
  └─ Object::Draw             (object.cpp:1968)
       ├─ ShapeGeometryLock            (2036-2040)
       ├─ AnimationContext + Animate() (2043-2047)
       ├─ SelectAggLights()            (2091-2093)
       ├─ VertexBufferLock             (2122)
       ├─ PrepareTextures()            (2126)
       ├─ OptimizeLevelRendering()     (2129)  ← мутирующий, на объект
       ├─ Shape::Draw()                (2139)
       ├─ CheckCraterDrawing()         (2143-2163)
       └─ shadowCache.Split()          (2165-2186)  ← только OnSurface
Scene::DrawObjectsInstanced   (scene.cpp:6108)   ← пакет до 512
  └─ GetLandShadowSmooth() на экземпляр (6169/6188/6211)
Backend: EngineDD9 (d3d9) или Dx11EngineCore (d3d11)
```

Главное: **6 из 7 дорогих операций в `Object::Draw` — на объект и на кадр**, и
они не связаны с «рисованием треугольников». В городе с тысячами объектов стоимость
линейна по числу объектов, а не по числу пикселей.

`Scene::DrawObject` (`scene.cpp:11186`) — 13 строк и лишь *forwarder*: кто
оптимизирует там, оптимизирует не то место.

## 7. Два графических бэкенда

| Бэкенд | Файлов | Функций | Строк |
|---|---:|---:|---:|
| `lib/d3d9/` | 42 | 1 985 | 51 549 |
| `lib/d3d11/` | 24 | **117** | **1 211** |
| `lib/d3dT/` (устаревший T&L) | — | 709 | 18 289 |
| `lib/d3dXB/` (Xbox) | — | 604 | 17 313 |

Бэкенд DX11 покрывает **2,3% строк** и **5,9% функций** D3D9. Утверждать, что «DX11
готов», ложно с коэффициентом ~42× по объёму кода.

Что **уже есть** в `lib/d3d11/`: device/swap chain, `Dx11EngineCore` (TL, текстуры,
текст, mesh), кеш шейдеров, компилятор, транслятор состояний, 2D-текстура и volume, text
bank, TL renderer, mesh, render target, alpha test, constant buffer, shape mesh и renderer.

Чего **нет**: постобработка (FXAA/SMAA/SSAO/SSR/glow), тени (map и volume),
рельеф, вода, shore, трава/clutter, спрайты, анимация/skinning, полные материалы, видео,
occlusion queries, SRGB, MSAA и восстановление потерянного device.

### 7.1 DX10 или DX11?

**Портировать на API D3D11 с feature levels 10_0/10_1/11_0. Не портировать на D3D10.**

1. D3D11 — надмножество API D3D10: device 11 на `FEATURE_LEVEL_10_0` предоставляет то же
   железо с тем же HLSL 4.0. Два бэкенда дублировали бы 100% кода ради нулевого выигрыша.
2. У `d3d10.dll` нет собственного рантайма с Windows 8 — он заменён downlevel
   в `d3d11.dll`.
3. Код **уже это делает**: `Dx11Device::Create` (`Dx11Device.cpp:48-50`) пробует
   `11_0 → 10_1 → 10_0` в том же вызове `D3D11CreateDeviceAndSwapChain`.

## 8. Инструментация, доступная бесплатно

| Инструмент | Как использовать | На что отвечает |
|---|---|---|
| `PROFILE_SCOPE_EX(имя,*)` | имена `wSimu`, `wPrep`, `obDrw`, `obTxP`, `obShD`, `obLgt`, `nwCli`, `nwSer` | время на подсистему, на кадр |
| `PerfLog/` | инструмент захвата | иерархический профиль |
| `DayZ.pdb` (70,7 MB) | WinDbg/`cdb` | стек краша с функцией и строкой |
| `DayZ.map` (12,4 MB) | адрес → символ | краш сборки без PDB |
| ETW + GPUView | Windows Performance Recorder | CPU vs GPU vs Present |
| PIX / RenderDoc | захват кадра DX11 | draw calls, состояние, overdraw |
| `-dx11warp` | `Dx11Device.cpp:53` | отделить баг движка от бага драйвера |

Имена scope — готовая тепловая карта: `wSimu` (симуляция), `wPrep` (подготовка
сцены), `obDrw` (отрисовка объекта), `obShD` (тень), `obLgt` (свет), `nwCli`/`nwSer`
(сеть). Достаточно захватить 30 с и посмотреть, кто доминирует.

## 9. Моддинг в этом снимке

В этой 0.45 **нет** ключевого слова `modded` (grep = 0 по всей `Enfusion/`) и `override` как
ключевого слова. Поэтому:

- **невозможно** переопределить метод через `modded void Foo()`;
- `modded class` тоже не работает — зависит от того же ключевого слова;
- расширение возможно только через (a) замену всего файла в PBO, (b) конфиг в
  `cfg/` (`CfgVehicles`, `CfgWeapons`), или (c) `proto native` с перекомпиляцией C++.

Любое современное руководство по моддингу, применённое к этому коду, **не скомпилируется**.

## 10. Технический потолок, заданный `extern/`

| Зависимость | Версия | Последствие |
|---|---|---|
| Bullet | 2.76 | старая физика; без современного SIMD, без многопоточного solver |
| DirectX SDK | 2010 | `D3DX9`/`D3DX11`; требует `d3dx9_41.dll` |
| Boost | старый | `boost::` вместо `std::` |
| Steamworks | старый | ограниченный matchmaking |
| MSVC | v100 (VS2010) | **без C++11** в основном проекте |

Toolset v100 — самый жёсткий ограничитель: без `std::atomic`, `std::thread`, `nullptr`,
`override` или `constexpr`. Модернизация рендера (нужны atomics и `thread_local`)
требует **сначала** retarget проекта — который сегодня падает с `MSB8020`.

## 11. Что это объясняет

Движок не «медленный, потому что DX9 старый». Он медленный в городе, потому что **путь на
объект** делает работу CPU, растущую линейно с числом объектов, а бюджет кадра
(`restFrame = 0.045f`) был откалиброван на 22 FPS в 2013. Смена графического
API без атаки на этот путь не меняет результат — см. досье в **Баги → FPS в
городах**.
