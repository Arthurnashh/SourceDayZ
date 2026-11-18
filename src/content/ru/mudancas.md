# Изменения, сделанные в этом исходнике

> Это дерево **больше не нетронутый оригинальный код**: оно было изменено, скомпилировано и
> протестировано. Пункты ниже прочитаны в текущем коде и сравнены со снимками в
> `backup-*`/`build/inventory-menu-v10/restore-point-*`. Где нет записи о тесте
> в игре, стоит `[ожидает проверки]`.

## 1. Сборка действительно происходит (и это не v100)

Проект объявляет `v100` (`lib/lib2010.vcxproj:118,123`), но на этой машине сборка идёт
с **v141 через override**. Доказательство в логе: `build/inventory-menu-v10/cpp-build-release-v31.log:1`
— `Microsoft (R) Build Engine версия 15.9.30` (MSBuild из VS2017) и в конце того же лога
`Microsoft (R) COFF/PE Editor Version 14.16.27054.0`, заканчиваясь на:

```text
lib2010.vcxproj -> ...\build\inventory-menu-v10\cpp-out-v31\DayZInt.exe
```

| Пункт | Значение |
|---|---|
| Компилятор | MSVC 14.16 (v141), `cl.exe` в `VS2017\Community\VC\Tools\MSVC\14.16.27023` |
| Оркестратор | MSBuild 15.9.30 |
| SDK | Windows 10.0.19041 |
| DirectX | **по-прежнему DX9** (`lib/d3d9/`), без миграции на DX11 |
| Вывод | `build/inventory-menu-v10/cpp-out-v31/DayZInt.exe` |

Чтобы код 2001 года скомпилировался в v141, пришлось тронуть старые заголовки — все
сохранены в `backup-v141-compat-20261116/`:

- `El/Math/math3dp.hpp` — 42 KB
- `Enfusion/include/common/enf_mathlib.h` — 105 KB
- `Es/Containers/typeopts.hpp`
- `lib/appName.h`, `lib/wpch.hpp`, `lib/SimulWeather/SimulWeatherDX9.hpp`
- `lib/fsmEntity.cpp`, `lib/gameDirs.cpp`, `lib/main.cpp`, `lib/person.cpp`,
  `lib/vehicleAI.cpp`, `lib/world.cpp`, `lib/winapp.cpp`
- `lib/Network/networkClient.cpp`, `networkMsg.cpp`, `networkObject.hpp`, `networkServer.cpp`
- `lib/UI/displayUI.cpp`, `lib/UI/inGameUIDraw.cpp`

Предупреждения, остающиеся в логе (не ошибки):

- `C4005` — `DXGI_ERROR_*` переопределён между `extern/DXSDK/include/dxgitype.h` и
  `Windows Kits\10\Include\10.0.19041.0\shared\winerror.h` (DXSDK 2010 vs SDK 10).
- `C4477` в `lib/d3d9/txtd3d9.cpp:3843` (`sprintf` с `%d` и аргументом другого типа).
- `LNK4217` — `_floor` импортирован локально `xapobased.lib`.

## 2. Наклон на бегу с Q/E — сделано

`lib/soldierOld.cpp:17190-17250`, в `Man::RecalcLeaningTransform()`.

Проблема: карты анимации быстрого бега/страйфа **не определяют** смещения
наклона (`GetLeanRRot`/`GetLeanRShift`), поэтому удержание Q/E в движении становилось no-op.

Исправление состоит из двух частей:

**Часть 1 — fallback на карту остановки** (`soldierOld.cpp:17212-17237`). Если смещения
текущей карты нулевые, берётся `ManActStop` того же семейства движения и смещения переиспользуются.

```cpp
// Some locomotion action maps (notably fast/strafe variants) omit the
// lean offsets even though the stop map for that same movement family
// defines them. Reuse those offsets so Q/E remain an additive pose while
// running instead of silently becoming a no-op.
if (fabs(leanRotAngle) < 1e-6f && fabs(leanShift) < 1e-6f)
{
  const MoveIdExt &stopMove = type->GetMove(map, ManActStop);
  ...
}
```

**Часть 2 — сохранить запрос игрока** (`soldierOld.cpp:17245-17250`). Клипы быстрого
передвижения обнуляют `LeaningFactor`; если Q/E нажато, фактор принудительно ставится в 1.

```cpp
if (fabs(_leanZRot) > 0.01f && leaningFactor < 1e-4f)
  leaningFactor = 1.0f;
```

Предыдущее состояние сохранено в `backup-lean-strafe-20261116-065525/lib/soldierOld.cpp`
(реальный diff: 24 115 → 24 148 строк). `lib/mainInput.cpp` и `lib/soldierOld.hpp` **не**
менялись — наклон уже управлялся `_leanZRot`, не хватало позы.

## 3. Зомби проходит сквозь стену — сделано

`lib/zombie.cpp:1068-1145` (обход движения `Man`).

Три причины и три исправления:

| Причина | Исправление | Строка |
|---|---|---|
| `IsPassable()` — порог **массы** (<10), а не правило карты — статические постройки проходили | зомби уважает **любое** попадание в статическую геометрию (`obj->Static()`), даже проходимую | `:1068-1077` |
| Начало движения уже с перекрытием даёт `under == 0` и не является временем входа; clamp на 1% удерживал перекрытого зомби | начальное перекрытие становится неоднозначным случаем и передаётся solver тела | `:1082-1099` |
| Запас 1% шага всё ещё толкал внутрь на коротких шагах | фиксированный запас `0.005` и перепозиционирование в `minT` | `:1138-1144` |

```cpp
const bool zombieStaticWorldBlock = isZombie && obj->Static();
if (obj->IsPassable() && !zombieStaticWorldBlock)
  continue;
```

Встроенная диагностика, ограниченная 1 логом/с на сервере:

- `[ZombieCollisionDiag]` — `zombie.cpp:1126-1137`
- `[ZombieCollisionStartOverlap]` — `zombie.cpp:1112-1124`

Тестовые артефакты: `lib/lib/build/zombie-collision-diag-v102/`, `-v103`, `-v120`, `-v121`,
`-v123`; исполняемые файлы в `dist/server/` (`DayZServer-ZombieCollisionFix.exe`,
`DayZInt-ZombieCollisionFixV120.exe`, `DayZServer-ZombieStuckCollision.exe`).

## 4. Инвентарь: вращение предмета и руки

**Вращение** — пробел вращает предмет, и вращение реплицируется сервером:

| Этап | Файл:строка |
|---|---|
| Ввод игрока | `lib/UI/uiMap.cpp:6544-6549` — `CItemBase::RotateInventoryItem` |
| Отправка на сервер | `lib/Network/networkClient.cpp:7669` — `AskForRotateInventoryItem` |
| Определение сообщения | `lib/Network/networkImpl.hpp:370` — `DECLARE_NET_MESSAGE(AskForRotateInventoryItem, ...)` |
| Обработчик сервера | `lib/Network/networkServer.cpp:6796` |
| Реплицированное состояние | `lib/Network/networkClient.cpp:4519` — `IsInventoryRotated()` |
| Интерфейс | `lib/Network/network.hpp:1093` (чистая виртуальная), `:1411` (таблица сообщений) |

**Клавиша пробела в инвентаре** — `lib/UI/uiContainers.cpp:2166-2175`:

```cpp
// Buttons activate on key release. Consume Space here too, otherwise a
// stale/default-button press can close the inventory after its keydown was
// already handled as an item-rotation request.
if (dikCode == DIK_SPACE && IsInventoryOpened())
  return true;
```

Без этого вращение предмета пробелом закрывало инвентарь через default-кнопку.

**Руки (`Hands`)**: итерации синхронизации предмета слота при перемещении в штаны,
рубашку, рюкзак или `Vicinity`, и чтобы не повторять отмену действия при закрытии экрана.
Пакеты `package-v10` … `package-v13` в `build/inventory-menu-v10/`.

## 5. Главное меню, пауза и браузер серверов

Работа в процессе, с 31 версионированным пакетом (`package-v10` … `package-v31`) и
`restore-point-*` перед каждым этапом.

- `lib/UI/optionsUI.cpp:7409` — статистика перестала быть фиксированным текстом
  (`"NOT SYNCED"` → значения `"0m"`/`"0"`), пока placeholder до появления реальных данных.
- `lib/UI/optionsUI.cpp:7518` — позиция/размер контрола mod launcher в макете меню.
- `cfg/Bin/rscScreen.hpp` — макет экранов (`RscDisplayMultiplayer`, инвентарь).
- `ui.pbo` редактируется напрямую; без зависимости от `@MenuCleanup`.

Вкладки `OFFICIAL` / `COMMUNITIES` / `LAN`: V29 исправила нативный тип вкладок и
контролы назад/играть, и `config` прошёл `CfgConvert -test`.

`[ожидает проверки]` — проверить в игре три вкладки, отсутствие legacy-наложения,
3D-фон и подключение; и в инвентаре — единый интерфейс без дублированного макета.

## 6. Краш при входе (material/texture) — V30/V31

- V30: проверки в `TextureD3D9::GetPixel`, `GetRect` и `RequestGetRect`
  (`lib/d3d9/txtD3D9.cpp`), чтобы не делить на ноль при неверном mip.
- V31: оставшийся assert шёл из `TextBankD3D9::UseMipmap` — теперь проверяется
  `_nMipmaps` и ограничиваются `level`/`levelA` до assert.
- Restore points: `restore-point-v30-before-texture-guard-20261116/` и
  `restore-point-v31-before-invalid-mip-level-20261117/`.

## 7. Дисциплина версий (что делает это аудируемым)

- **Снимки на изменение**: `backup-<тема>-<дата-время>/` хранит только затронутые файлы.
- **Restore points на сборку**: `build/inventory-menu-v10/restore-point-vNN-*/` хранит
  предыдущие исходник + EXE + MAP (+ PDB).
- **Изолированные пакеты**: каждый `package-vNN` — отдельная играбельная установка со своим лаунчером
  и профилем — не перезаписывает исходные `dist/` или `Addons/`.
- **Хеши**: `HISTORICO-CORRECOES-E-PENDENCIAS.md` фиксирует SHA-256 EXE, `ui.pbo` и
  `worlds_chernarusplus.pbo` по версиям.

Это отвечает на практический вопрос: работать с этим исходником безопасно можно потому, что
есть измеренный rollback, а не потому что код простой.

## 8. Браузер серверов: реальная причина 10 «Error loading control» — V34

Браузер был не «без макета»: 10 контролов экрана **даже не создавались**, потому что
значение `sizeEx` ломало вычисление выражения, а исключение проглатывалось.

**Цепочка, измеренная в коде**

- `lib/UI/uiControls.cpp:5834` — конструктор кнопки делает `_size = cls >> "sizeEx"`
  (то же в `:2536`, `:5171`, `:5878`).
- `El/ParamFile/paramFile.cpp:1772-1782` — если значение не число, оно попадает в
  `_file->EvaluateFloat(_value)`.
- `El/Evaluator/evaluatorExpress.cpp:46-56` — нулевой результат вызывает
  `LogF("Warning: Cannot evaluate '%s'")` + `ERROR_THROW(ErrorInfoText, "Cannot evaluate value")`.
- `lib/UI/uiContainers.cpp:497-508` — `LoadFromEntry` ловит через `ERROR_CATCH_ANY`
  и только логирует `Error loading control %s`; display продолжается без этого контрола.

**Доказательство в runtime-логе**

`package-v32-terrain-menu-repair/profile-terrain-menu-v32/debug.log`:

| значение | вхождений |
|---|---|
| `Size_Text_Very_Small` | 10 |
| `Size_Text_Small` | 8 |
| `Size_Text_Medium` | 2 |

Это 20 предупреждений, потому что экран строится дважды (вход + возврат миссии), и в
`DayZInt.RPT` это выглядит как 10 ошибок в `:1076-1085` и ещё 10 в `:1161-1170`:
`RscDisplayMultiplayer/controls/ButtonInternet`, `ButtonFavorite`, `ButtonLAN`,
`B_Cancel`, `B_Join`, `BrowserLabelName/Ping/Password/Full/BattlEye`.

У четырёх `BrowserLabel*` нет собственного `sizeEx`: они наследуют сломанное значение от
`BrowserLabelName`, поэтому падают вместе — 6 неверных значений объясняют ровно
10 отсутствующих контролов.

**Применённое исправление (V34)**

- `ui.pbo` → `RscDisplayMultiplayer`: `sizeEx` снова число
  (`Very_Small=0.022`, `Small=0.027`, `Medium=0.033`).
- `dta/bin/config.bin` → `RscDisplayMain`: `DZ_MenuSlot*` использовали
  `idc="IDC_MAIN_MENU_SLOT_*"` (литеральный текст, вычисляемый как несуществующая переменная).
  Заменено значениями из `lib/UI/resincl.hpp:630-632`: `12025` (prev), `12027` (name),
  `12026` (next) — это убирает 3 ошибки `DZ_MenuSlotPrev/Name/Next` и возвращает
  контролы, используемые `lib/UI/optionsUI.cpp:7399`.
- `prefix` каждого PBO сохранён (`DZ\ui\` и `bin\`), списки файлов проверены
  (843 и 13 файлов), проверочный `CfgConvert -txt` без следов
  `Size_Text_*`/`IDC_MAIN_MENU_SLOT`.
- Пакет: `build/inventory-menu-v10/package-v34-sizefix/` (hardlinks из V33 + два
  новых PBO), лаунчер `Start-DayZ-V34-SizeEx-Fix.bat`.

`[ожидает проверки]` — открыть браузер в V34 и подтвердить три вкладки, боковые
подписи и возврат миссии без замороженного экрана.

**Частичная проверка (17/11, 02:20)** — первый запуск V34:

- `profile-v34-sizefix/DayZInt.RPT` с **0** `Error loading control` (до: 10 на
  конструкцию, 20 по всему файлу) и **0** `Size_Text_*`.
- `debug.log` без единого `Cannot evaluate 'Size_Text_*'` (до: 20).
- Клиент провёл ~140 с, компилируя шейдеры (`D3DXCompileShader VSShaderPool`), и
  Windows пометил «не отвечает» — это нормальное поведение этой DX9-сборки при
  первом запуске, а не зависание: `debug.log` продолжает расти и процесс снова
  отвечает сам (`Fill Objects took 12813 ms`, `Visibility set to 3000`).
- `Error: Binarize missed persistence for 'Land_A_FuelStation_Feed'` (10×) — шум
  арта, существовал раньше и не блокирует UI.

`[ожидает]` — подтвердить на экране три вкладки и возврат миссии.

`[сильная гипотеза]` «застрявший персонаж» — следствие этого: в
`profile-terrain-menu-v32/DayZInt.RPT:1153` клиент выходит из `PLAYING` в
`MISSION ASKED` и перестраивает браузер; поскольку все контролы падали, display поднимался
пустым поверх замороженного мира — без HUD и без ввода.

## 9. Персонаж анимируется, но не ходит: `upDegree` читался как число — V35/V36

Симптом был максимально обманчивым: **персонаж проигрывал цикл ходьбы и
прыжок, камера вращалась, инвентарь открывался — но позиция не менялась**. Ни краша,
ни ошибки на экране. Только тело, анимирующееся на месте.

### 9.1 Что показал лог

Временная инструментация в `lib/soldierOld.cpp` и `lib/simul.cpp` (позже удалена),
писавшая одну строку в секунду в `DayZInt.RPT`:

```
DIAGMOVE t=... pos=13309.50,8.88,5356.29 pot=13309.50,8.88,5356.29 spd=0.00,0.00,0.00
         wW=0.00,0.00 fine=0 ctrl=1 land=1 obj=0 stat=1 rs=0 chg=1
DIAGANIM t=... move=-0.0000,-0.0000 info=-0.0000,-0.0000 adj=1.000 rel=-0.000,-0.000
         minmax=0.000,1000.000 pf=1.000 prim=<none> manual=1 dc=1
```

Три вещи кричали:

| поле | значение | чтение |
|---|---|---|
| `prim` | `<none>` | нет основного move в очереди |
| `info` | `0.0000,0.0000` | `AdvanceMoveQueue` не возвращает смещение |
| `minmax` | `0.000,1000.000` | default `GetRelSpeedRange` **без** move info |

И деталь, закрывшая дело: **в меню тот же лог показывал `prim=menu_idleunarmed0`**.
То есть машина move работала — она просто не находила move стоящего игрока.

### 9.2 Причина: строка там, где код ожидает `int`

Конфиг анимаций пишет поле `upDegree` как **имя**:

```cpp
// anims/CfgMovesMaleSdr2 (конвертировано в текст)
class KnockedDownActionsCivilLeft: NoActions
{
  ...
  upDegree="ManPosNoWeapon";
};
```

Но конструктор `ActionMap` читал напрямую в `int`:

```cpp
// lib/motion.cpp:58 (до)
_upDegree = e >> "upDegree";
```

`ParamRawValue::GetInt()` понимает только число (`El/ParamFile/paramFile.cpp:1784-1804`):
пробует `ScanInt`, затем `ScanFloat`, и наконец бросает строку в вычислитель выражений,
который не знает `ManPosNoWeapon` и возвращает **0**. Результат: **все** action maps
получали `_upDegree = 0`.

Доказательство было в `debug.log` профиля, с **345** предупреждениями:

| значение | вхождений |
|---|---|
| `manposcombat` | 112 |
| `ManPosCrouch` | 93 |
| `ManPosNoWeapon` | 93 |
| `ManPosLying` | 25 |
| `ManPosLyingNoWeapon` | 13 |
| `ManPosSwimming` | 5 |
| `ManPosDead` | 2 |
| `ManPosHandGunStand` | 1 |
| `ManPosStand` | 1 |

### 9.3 Цепочка зависания

1. `Man::GetAutoUpDegree()` (`lib/soldierOld.cpp:15911-15918`) возвращает `ManPosNoWeapon`
   (значение **12** в enum `ManPos`, `lib/soldierOld.hpp:818-838`).
2. `MotionType::GetMove(upDegree, index)` (`lib/motion.cpp:758-776`) перебирает action maps
   и принимает только `map->GetUpDegree() == upDegree`. Поскольку все были `0`, возвращает
   `MoveIdExt::none`.
3. `Man::ResetMovement` (`lib/soldierOld.cpp:4219-4250`) записывает этот `none` как основной
   move — а `ResetMovement(0)` использует `ManActDefault` с `init = true`
   (`:4305-4311`), поэтому начальное состояние уже рождалось пустым.
4. `KeyboardPilot` делает `map = Type()->GetActionMap(primary)` (`:15561`). Без move info
   `MovesTypeBase::GetActionMap` возвращает `NULL` (`lib/motion.cpp:1206-1211`).
5. При `map == NULL`, `moveWanted = GetDefaultMove()` (`:15820`), а `GetDefaultMove()`
   вызывает `GetMove(deg, ManActDefault)` — снова `none`
   (`lib/soldierOld.hpp:388-393`).
6. `SetMoveQueue(none)` никогда не покидает пустое состояние → у `AdvanceMoveQueue` нет основного
   move → `info.moveX/moveZ = 0` → **без трансляции**. Анимация продолжалась, потому что
   идёт другим путём (direct control / blend).

Это не был root motion: 2 028 RTM в `anims.pbo` были прочитаны в формате BMTR, и диапазон
скорости был верным (walk 1,1–1,5 м/с; run 2,6–4,1 м/с). Это не была и статическая коллизия
(`stat=1` — пессимистичное значение `CreatePotentialState`, прочитанное до теста), ни
`remoteState` (`rs=0`), ни блок `frozen` (`ctrl=1`).

### 9.4 Исправление (V36)

Функция декодирования в `lib/motion.cpp`, до конструктора `ActionMap`:

```cpp
static int DecodeUpDegree(RStringB value)
{
  static const char *names[] =
  {
    "Dead", "Weapon", "BinocLying", "LyingNoWeapon", "Lying",
    "HandGunLying", "Crouch", "HandGunCrouch", "Combat",
    "HandGunStand", "Stand", "Swimming", "NoWeapon", "Binoc", "BinocStand",
  };
  const char *text = value;
  if (!text || !*text) return 0;

  // принимает "ManPosXxx" и "Xxx", без учёта регистра
  const char *shortName = text;
  if (!strnicmp(text, "ManPos", 6)) shortName = text + 6;
  for (int i = 0; i < (int)(sizeof(names) / sizeof(*names)); i++)
  {
    if (!strcmpi(shortName, names[i])) return i;
  }

  // числовые значения (включая -1 от NoActions) остаются действительными
  char first = text[0];
  if ((first >= '0' && first <= '9') || first == '-') return atoi(text);

  RptF("Unknown upDegree '%s'", text);
  return 0;
}
```

и чтение становится:

```cpp
_upDegree = DecodeUpDegree(e >> "upDegree");
```

Детали, которые важны:

- Порядок массива **и есть** enum `ManPos` (`soldierOld.hpp:818-838`): `Dead=0`, `Weapon=1`,
  …, `NoWeapon=12`, `BinocStand=14`.
- `strcmpi`/`strnicmp` уже существовали в `El/platform.hpp:174-176` и являются тем же шаблоном, использованным
  для `bodyPosition` в `soldierOld.cpp:12999-13009` — остальной движок уже обрабатывал текстовые поля
  так; только `upDegree` остался позади.
- Конфиг использует `manposcombat` в нижнем регистре в 6 классах, поэтому сравнение
  без учёта регистра — не роскошь.
- `upDegree=-1` (3 класса) и `upDegree=0` (1 класс) по-прежнему идут через числовую ветку,
  без регрессии.

### 9.5 Измеренная проверка

`package-v34-sizefix/profile-v36-updegree/DayZInt.RPT`, с exe V36:

```
DIAGMOVE t=87.75 pos=13309.75,8.87,5355.83  spd=0.00  prim=aidlpercmstpsnonwnondnon
DIAGMOVE t=88.76 pos=13307.98,9.30,5354.71  spd=1.46  prim=amovpercmstpslowwnondnon
DIAGMOVE t=90.78 pos=13313.47,8.18,5355.67  spd=6.80  prim=amovpercmevasnonwnondf
DIAGMOVE t=91.78 pos=13319.79,7.45,5358.28  spd=6.95  prim=amovpercmevasnonwnondfr
```

| | до | после |
|---|---|---|
| `pos` | фиксирована на `13309.50,8.88,5356.29` | меняется каждую секунду (~6 м/с) |
| `prim` | постоянный `<none>` | `amovpercmstpslowwnondnon` → `amovpercmevasnonwnondf` |
| `info` | `0.0000,0.0000` | `0.0668,0.0866` |
| `minmax` | `0.000,1000.000` | `0.850,1.000` |
| `spd` | `0.00,0.00,0.00` | `6.80`, `6.95` |
| `Cannot evaluate 'ManPos*'` | 345 в `debug.log` | **0** (`debug.log` 0 байт) |
| `Unknown upDegree` | — | **0** (все имена распознаны) |

### 9.6 Версии и файлы

- **V36** — exe с патчем + инструментация DIAG (`DayZInt-v35-diag.exe` — предыдущий
  инструментированный без патча; `DayZInt-v34-backup.exe` — чистый V34).
- **V37** — **чистый** exe: патч сохранён, инструментация удалена
  (`DayZInt-v37-clean.exe`, SHA-1 `6B4D18C1B8CDFE27EEE763C2041A55A97500C91C`,
  13 639 680 B).
- Лаунчеры: `build/ABRIR-DAYZ-V36.bat` (инструментированный) и
  `build/ABRIR-DAYZ-V37.bat` (чистый).
- Restore points:
  - `build/inventory-menu-v10/restore-point-v36-updegree-20261117/motion.cpp`
    (оригинал, SHA-1 `E2BF90EFB071826AFD77DCB2EBA34B0E1838A4A0`)
  - `…/motion-PATCHED-updegree.cpp` (с исправлением)
  - `build/inventory-menu-v10/restore-point-v35-diagmove-20261117/` (оригинальные `soldierOld.cpp` и
    `simul.cpp`, использованные, чтобы удалить инструментацию без потери чего-либо ещё —
    diff был только вставкой: +57 и +15 строк).
