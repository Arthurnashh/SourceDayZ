# Пошаговый порт анимаций

Эта страница — технический дневник порта: **что было сделано, в каком порядке, каким скриптом и что
изменилось в каждом файле**. Цель — чтобы любой мог повторить процесс с
нуля и понять, почему было принято каждое решение.

Работа выполнена 17–18/11/2026 на клиенте **0.45.124252**, с использованием коллекции
**DayZ 1.30** в `D:\RetailPlayer-OFP2-Y0` (7 415 RTM).

## Что значит «портировать анимацию»

`anims.pbo` хранит две разные вещи:

| Часть | Что это | Заменялась? |
|---|---|---|
| `config/sdr2/config.bin` | CfgMoves: состояния, переходы, правила, скорости | **нет** — в конфиге 1.30 есть состояния, которых 0.45 не знает |
| `data/anim/sdr/**/*.rtm` | кадры анимации (кости, матрицы, времена) | **да** — 1 526 файлов |

Значит порт — **данных**, а не кода движка. Исполняемый файл 0.45 не менялся, чтобы
читать новые анимации; он уже умел читать оба формата.

## Весь конвейер

```text
DayZ 1.30 (7 415 RTM)                      DayZ 0.45 (anims.pbo)
        |                                          |
        |  1. индекс по имени                      |  2. извлечь + манифест
        v                                          v
  mapping_*.json  ------ 3. применить ------>  anims045/  (1 526 заменено)
        |                                          |
        |  4. дополнения + step                    |
        v                                          v
  trimmed_e4/  (1 526 после trim)  -- 5. staging -->  animsE6_tree/
                                                        |
                                               6. pack_pbo.py
                                                        v
                                                 anims_E6.pbo
                                                        |
                                               7. проверить + установить + RPT
```

| Этап | Что делает | Инструмент | Результат |
|---|---|---|---|
| 0 | фиксирует оригинал и измеряет | `certutil`, `Get-FileHash` | известный baseline |
| 1 | открывает PBO и сохраняет манифест | `unpack_pbo.py` | 2 053 записи |
| 2 | читает оба формата RTM | бинарное чтение | 156 × 120 костей |
| 3 | находит имя 1.30 для каждого слота | `build_mapping.py` | 360 локомоции |
| 4 | копирует с проверкой заголовка | `apply_mapping.py` | 1 526 путей |
| 5 | добавляет 4 дополнения и правит step | `add_extra.py` | 24 клипа |
| 6 | пробует полный пакет | `pack_pbo.py` | падение на потолке 1,1 GB |
| 7 | удаляет кости, которые 0.45 не использует | `trim_rtm.py` | −23,45% |
| 8 | собирает финальное дерево | `stage_e6.py` | 2 053 файла |
| 9 | упаковывает с SHA1 | `pack_pbo.py` | `anims_E6.pbo` |
| 10 | проверяет структуру и образцы | `verify_e7.py` | 10/10 |
| 11 | устанавливает и измеряет RPT | `schtasks` | 12 / 23 / 15 / `PLAYING` |
| 12 | исправляет фонарь | сборка E7 | 2 IK возвращены |

---

# Шаг 0 — baseline и бэкап

Прежде всего: сохранить работающий PBO и записать хеш. Без этого нельзя
доказать, что сбой вызван новой сборкой.

```bat
copy /Y "Addons\anims.pbo" "ANIMS-WORK-20261117\backup\anims_E3_instalado.pbo"
certutil -hashfile "Addons\anims.pbo" SHA1
```

Оригинал также извлечён в отдельное дерево (`anims045_orig`), которое никогда не
меняется. Из него берутся сравнения костей и откаты.

| Путь | Роль |
|---|---|
| `anims045_orig\` | нетронутое извлечение PBO 0.45 |
| `anims045\` | рабочее дерево (принимает RTM 1.30) |
| `trimmed_e4\` | RTM 1.30 после trim |
| `animsE6_tree\` | финальный staging, готов к упаковке |
| `out\` | сборки E1–E7 |
| `backup\` | сборки, которые уже были в игре |

---

# Шаг 1 — открыть PBO 0.45

Использованный распаковщик — не BankRev, а собственный скрипт, который **проверяет SHA1
PBO** и сохраняет манифест со смещениями и размерами. Это важно, потому что упаковщик потом
переиспользует исходные смещения.

```python
# unpack_pbo.py (фрагмент)
with pbo.open('rb') as stream:
    props, entries, paths = {}, [], set()
    while True:
        name = cstring(stream)
        method, original, offset, timestamp, size = struct.unpack('<5I', stream.read(20))
        if not name and method == 0x56657273:
            while key := cstring(stream):
                props[key] = cstring(stream)
            continue
        if not name:
            break
        entries.append(dict(name=name, method=method, original=original,
                            offset=offset, timestamp=timestamp, size=size))

    data_start = stream.tell()
    end = data_start + sum(e['size'] for e in entries)
    if pbo.stat().st_size - end != 21:
        raise ValueError('Tamanho invalido')

    stream.seek(0)
    digest = hashlib.sha1()
    remaining = end
    while remaining:
        chunk = stream.read(min(remaining, 1024 * 1024))
        digest.update(chunk)
        remaining -= len(chunk)
    if stream.read(21) != b'\0' + digest.digest():
        raise ValueError('Checksum invalido')
```

Сгенерированный манифест содержит 2 053 записи:

| Свойство | Значение |
|---|---|
| `prefix` | `DZ\anims` |
| `revision` | `17984` |
| `.rtm` | 2 028 |
| `.p3d` | 22 |
| `.bin` | 3 |

Каждая запись хранит `name`, `original`, `offset`, `timestamp`, `size` и `sha256`. Именно
этот манифест позволяет переупаковать без изобретения порядка и метаданных.

> **Ловушка:** PBO заканчивается `\0` + SHA1 из 20 байт. Если распаковщик не проверяет эти
> 21 байт, усечённый PBO пройдёт как валидный, а ошибка появится только в игре.

---

# Шаг 2 — понять два формата (до и после)

Один и тот же логический файл — стек `battery_d.rtm` — в трёх состояниях. Это лучший способ увидеть,
что делает порт.

## 2.1 До: BMTR 0.45

```text
offset  bytes                          поле
0       42 4D 54 52                    "BMTR"
4       03 00 00 00                    версия 3 (LZO включён)
8       01                             reversed = 1
9       00 00 00 00                    stepX = 0.0
13      00 00 00 00                    stepY = 0.0
17      00 00 00 80                    stepZ = -0.0
21      02 00 00 00                    nPhases = 2
25      01 00 00 00                    preloadCount = 1
29      78 00 00 00                    nAnim = 120 костей
33      78 00 00 00                    nSel = 120 выборок
37      70 65 6C 76 69 73 00 ...      "pelvis\0", "leftupleg\0", ...
```

- Заголовок **37 байт**.
- Имена костей текстом с нулём на конце, один раз.
- Каждый кадр: 4 байта времени + матрицы по 48 байт (12 float), **сжатые LZO**.
- Полный размер стека: **4 209 байт**.

## 2.2 После: сырой RTM_0101 1.30

```text
offset  bytes                          поле
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX = 0.0
12      00 00 00 00                    stepY = 0.0
16      00 00 00 80                    stepZ = -0.0
20      02 00 00 00                    nAnim = 2 кадра
24      9C 00 00 00                    nSel = 156 костей
28      70 65 6C 76 69 73 00 ...      "pelvis" в 32 фиксированных байтах
```

- Заголовок **28 байт** + **32 байта на кость** (имя с нулевым padding).
- Каждый кадр: 4 байта времени + **80 байт на кость** (32 имени + 48 матрицы).
- Без сжатия.
- Размер: **29 988 байт** (156 костей).

## 2.3 После trim: RTM_0101 с 120 костями 0.45

```text
offset  bytes                          поле
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX
12      00 00 00 00                    stepY
16      00 00 00 80                    stepZ
20      02 00 00 00                    nAnim = 2
24      78 00 00 00                    nSel = 120  <-- было 9C (156)
28      70 65 6C 76 69 73 00 ...      "pelvis"
```

- **23 076 байт** — на 23,0% меньше сырого и в 5,5 раза больше BMTR 0.45.
- `nSel` упал с 156 до 120; 36 костей, которые есть только в риге 1.30, ушли.
- Матрицы оставшихся 120 костей **байт в байт те же**, что в сыром файле.

## 2.4 Код движка, который читает каждый из них

Изменений кода здесь не было. Движок выбирает путь по **содержимому**, а не по
расширению:

```cpp
// rtAnimation.cpp — путь BMTR (0.45)
if (!f.Version('RTMB')) { f.SetError(EFileStructure); return; }
const int actVersion = 3;
if (f.GetVersion() >= 3) f.UseLZOCompression();
f.Transfer(_reversed);
f.Transfer(_step);
f.Transfer(_nPhases);
f.Transfer(_preloadCount);
int nAnim = f.LoadInt();
f.TransferBasicArray(_selections);
```

```cpp
// rtAnimation.cpp — путь RTM_0101 (1.30)
in.seekg(RTMMagicLen, QIOS::cur);        // пропускает "RTM_0101"
in.seekg(sizeof(float)*3, QIOS::cur);    // stepX, stepY, stepZ
int nAnim = in.getil();
int nSel = in.getil();
in.seekg(32*nSel, QIOS::cur);            // имена по 32 байта
LoadPhases(in, skelet, nSel, 1, _nPhases);
```

И деталь, которая делает всё возможным: движок **сопоставляет кости по имени**, а не по индексу.

```cpp
// AnimationRTPhase::Load — действует для обоих форматов
char name[32];
Matrix4P transformP;
in.read(name, sizeof(name));
strlwr(name);
in.read((char *)&transformP, sizeof(transformP));

int index = GetSkeletonIndex(skelet->FindBone(name));
if (index >= 0) {
  Matrix4 transform = ConvertToM(transformP);
  origMatrix.Add(transform);
}
// кость, которой нет в skeleton, просто игнорируется
```

Поэтому:

- **порядок** костей может отличаться (и отличается в 100% пар), ничего не ломая;
- файл из 156 костей играет на риге 120 — 36 лишних игнорируются;
- trim безопасен, пока **ни одна** кость, используемая 0.45, не удалена.

---

# Шаг 3 — выяснить, какой файл 1.30 становится каким слотом 0.45

Это была самая долгая работа. Имена не имеют ничего общего:

| 0.45 | 1.30 |
|---|---|
| `CdzpAmovPercMstpSnonWnonDf.rtm` | `p_erc_walkF.rtm` |
| `CdzpAidlPknlMstpSlowWnonDnon.rtm` | `p_cro_idle.rtm` |
| `CdzpAidlPpneMstpSlowWnonDnon.rtm` | `p_pne_idle.rtm` |
| `AidlPercMstpSlowWshlDnon.rtm` | `p_hvy_erc_idle01.rtm` |

## 3.1 Код до (очевидная попытка)

```python
# ДО — сопоставление по имени файла
for alvo in alvos:
    fonte = SRC / alvo.name          # CdzpAmovPerc... != p_erc_walkF
    if fonte.exists():
        copiar(fonte, alvo)
```

Результат, измеренный на 360 целях локомоции: **0 точных совпадений**. Ноль.

## 3.2 Код после (грамматика имени)

Имя 0.45 — закодированное предложение. Парсер разбирает:

```python
def parse(name):
    inj = False
    n = name
    if n.startswith('cdzp'): n = n[4:]
    if n.startswith('injl'): inj = True; n = n[4:]
    if n.startswith('a'):    n = n[1:]
    if not n.startswith(('idl', 'mov', 'ovr')): return None
    n = n[3:]
    if not n.startswith('p'): return None
    n = n[1:]
    stance = n[:3]                   # erc / knl / pne
    if stance not in stance_map: return None
    n = n[3:]
    if not n.startswith('m'): return None
    move = n[1:4]                    # wlk / run / spr / stp / trn
    if move not in move_map: return None
    n = n[4:]
    speed = n[:4]                    # slow / sras / snon
    if speed not in ('slow', 'sras', 'snon'): return None
    n = n[4:]
    if not n.startswith('w'): return None
    n = n[1:]
    weapon = n[:3]                   # non / rfl / shl / pst / bow / bin / mel
    if weapon not in sets: return None
    n = n[3:]
    if not n.startswith('d'): return None
    n = n[1:]
    if n.startswith('non'): d = 'non'
    elif n[:2] in ('fl', 'fr', 'bl', 'br'): d = n[:2]
    elif n[:1] in ('f', 'b', 'l', 'r'):     d = n[:1]
    else: return None
    return inj, stance_map[stance], move_map[move], speed, weapon, d
```

Таблицы перевода:

```python
stance_map = {'erc': 'erc', 'knl': 'cro', 'pne': 'pne'}
move_map   = {'wlk': 'walk', 'run': 'run', 'spr': 'sprint',
              'stp': 'idle', 'trn': 'turn'}
dir_map    = {'f': 'F', 'b': 'B', 'l': 'L', 'r': 'R',
              'fl': 'FL', 'fr': 'FR', 'bl': 'BL', 'br': 'BR'}

sets = {
    'non': ('moves/unarmed', ['p']),
    'rfl': ('moves/rifles',  ['p_rfl']),
    'shl': ('moves/heavy',   ['p_hvy', 'p_rfl']),  # heavy есть только erc
    'pst': ('moves/pistols', ['p_pst', 'p_rfl']),
    'bow': ('moves/bow',     ['p_bow']),
    'bin': ('moves/unarmed', ['p']),
    'mel': ('moves/1handed', ['p_1hd', 'p_2hd']),
}
```

## 3.3 Цепочка fallback

Не у каждого слота есть идентичный файл 1.30. Генератор пробует по порядку:

| Ситуация | Fallback |
|---|---|
| `sprint` не существует | `run`, затем `walk` |
| низкая поза не существует | обычная поза, затем `_ras` |
| `shl` (heavy) в приседе/лёжа | `rfl` (rifle) — heavy есть только стоя |
| `L` / `R` | `FL` / `FR` |
| `BL` / `BR` | `B` |
| `knl` | `cro` (crouch) |
| `stp` | `idle` |

```python
def candidates(bases, stance, move, d, variant, injured):
    out = []
    suf = ['_ras', '_low', ''] if variant == 'ras' else ['_low', '', '_ras']
    for base in bases:
        if base == 'p_hvy' and stance != 'erc':
            continue
        if move == 'turn':
            turn = 'turnL_90' if d == 'L' else 'turnR_90'
            for v in suf:
                out.append(f'{base}_{stance}_{"inj_" if injured else ""}{turn}{v}')
            continue
        inj = '_inj' if injured else ''
        if move == 'idle':
            for v in suf:
                out.append(f'{base}_{stance}{inj}_idle{v}')
            if base == 'p_hvy':
                for i in range(1, 6):
                    out.append(f'{base}_{stance}{inj}_idle0{i}')
            continue
        dirs = [d, 'FL' if d == 'L' else 'FR']
        for mv in ([move, 'run', 'walk'] if move in ('sprint', 'run') else [move]):
            for dd in dirs:
                for v in suf:
                    out.append(f'{base}_{stance}{inj}_{mv}{dd}{v}')
    return out
```

Первый кандидат, существующий в индексе 7 415 RTM, и выбирается.

## 3.4 Результат маппинга

| Группа | Файлы | Скрипт |
|---|---:|---|
| Локомоция (CSV) | 360 | `build_mapping.py` |
| Движение | 259 | `map_mov.py` |
| Сигналы с оружием | 229 | `map_sig.py` |
| Меню | 140 | `map_menu_ik.py` |
| Оружие в мире | 120 | `map_wop.py` |
| IK / расходники | 84 | `map_menu_ik.py` |
| Переходы позы | 66 | `map_trans.py` |
| Misc | 70 + 124 + 37 | `map_misc*.py` |
| Последние правки | 34 | `map_last.py` |

Финальный манифест получил **1 527 записей / 1 526 уникальных путей** — один путь встречается
дважды, потому что две разные группы его затребовали. `set` в скрипте staging решает это.

---

# Шаг 4 — применить с проверкой (реальные до и после)

## 4.1 До: `apply_full.py`

```python
for r in rows:
    rel = r['target'].replace('/', '\\').lower()
    dst = WORK.joinpath(*parts)
    src = Path(r['source'])
    if not dst.exists(): continue
    if not src.exists(): continue
    shutil.copyfile(src, dst)          # копирует что угодно
    replaced.append('/'.join(parts))
```

Этот скрипт не смотрит содержимое. Если источник усечён, в другом формате или это не тот
файл, он копирует, и ошибка появляется только в игре.

## 4.2 После: `apply_mapping.py`

```diff
-    shutil.copyfile(src, dst)
-    replaced.append('/'.join(parts))
+    data = src.read_bytes()
+    if len(data) < 32 or data[:8] not in (b'RTM_0101', b'RTM_0102'):
+        bad += 1; badlist.append(('formato', str(src))); continue
+    step = struct.unpack_from('<3f', data, 8)
+    nAnim = struct.unpack_from('<i', data, 20)[0]
+    nSel = struct.unpack_from('<i', data, 24)[0]
+    expected = nAnim * nSel * 80
+    if nAnim <= 0 or nSel <= 0 or nSel > 200 or not (
+        expected * 0.6 <= len(data) <= expected * 1.4 + 60000
+    ):
+        bad += 1
+        badlist.append(('header', str(src), nAnim, nSel, len(data), expected))
+        continue
+    if tgt_rel.lower() in repset:
+        skipped += 1
+        continue
+    shutil.copyfile(src, tgt)
+    repset.add(tgt_rel.lower()); rep.append(tgt_rel.lower()); copied += 1
```

Что ловит каждая проверка:

| Проверка | Что ловит |
|---|---|
| `data[:8] == RTM_0101` | файл, который не RTM, прерванная загрузка, HTML ошибки |
| `len(data) >= 32` | пустой файл или только magic |
| `nAnim > 0` | заголовок с нулевым счётчиком |
| `0 < nSel <= 200` | абсурдный счётчик (повреждение) |
| ожидаемый размер ±40% | заголовок, не совпадающий с телом |

Ожидаемый размер — ровно то, что вычисляет движок:

```text
28 + 32*nSel + nAnim * (4 + nSel*80)
```

## 4.3 Манифест

Скрипт ведёт `replaced_files.json`: список всего, что ушло из 0.45 и стало 1.30. Именно
этот файл staging запрашивает, чтобы знать, что должно пройти trim.

```python
repfile.write_text(json.dumps(rep, indent=1), encoding='utf-8')
print('copiados', copied, 'ja existentes', skipped, 'ruins', bad)
```

Результат: **1 526 уникальных путей** в манифесте, ни одного повреждённого файла.

---

# Шаг 5 — 4 дополнения и step

## 5.1 Дополнения вне манифеста

Четыре RTM 1.30 не имеют эквивалентного слота в 0.45, но были нужны. Они
внедряются прямо в staging:

| Слот 0.45 | Источник 1.30 |
|---|---|
| `injl/idl/erc/stp/low/rfl/CdzpInjlAidlPercMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_erc_inj_idle_low.rtm` |
| `injl/idl/knl/stp/low/rfl/CdzpInjlAidlPknlMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_cro_inj_idle_low.rtm` |
| `injl/idl/pne/stp/low/rfl/CdzpInjlAidlPpneMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_pne_inj_idle_low.rtm` |
| `inv/knl/stp/non/non/CdzpAinvPknlMstpSnonWnonDnon_pills.rtm` | `actions/healing/p_cro_eatingpills_loop.rtm` |

## 5.2 Step (root motion)

Поле `step` — смещение персонажа за цикл. Если оно не совпадает с числом
кадров, персонаж **скользит** или **бежит на месте**.

Реальное измерение на клипах ползания:

| Файл | Кадры | step 1.30 | step 0.45 | Отношение |
|---|---:|---:|---:|---:|
| `p_pne_walkF.rtm` | 157 | −6,6484 | −2,2161 | **3,00×** |
| `p_cro_walkF.rtm` | 106 | −4,6157 | −4,6157 | 1,00× |

В 8 клипах ползания step 1.30 был ровно в 3 раза больше слота. Скрипт делит на 3:

```python
x, y, z = struct.unpack_from('<3f', b, 8)
struct.pack_into('<3f', b, 8, x / 3.0, y / 3.0, z / 3.0)
```

В клипах приседа (106 кадров с обеих сторон) ничего не делилось — маппинг заново применил
файл с исходным step, который уже совпадал. Результат проверен ходьбой в игре, а не
только на бумаге.

## 5.3 12 переходов позы

Переходы позы 1.30 не имеют того же имени, но играют ту же роль. Двенадцать были
сопоставлены вручную:

```python
MAP = [
 ('p_erc_trans_cro_low.rtm', 'mov/erc/stp/low/non/...Perc...Pknl....rtm', 'стоя -> присед'),
 ('p_cro_trans_erc_low.rtm', 'mov/knl/stp/low/non/...Pknl...Perc....rtm', 'присед -> стоя'),
 ('p_erc_trans_pne_low.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._A.rtm', 'стоя -> лёжа'),
 ('p_erc_transMove_pne.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._B.rtm', 'идя -> лёжа'),
 # ... 8 других
]
```

Поскольку у клипа 1.30 другое число кадров, **скорость** класса в конфиге была
переписана на `30 / кадры`:

```python
new_speed = round(30.0 / e['new_frames'], 4)
# напр. 46 кадров -> speed=0.6522
```

Без этого переход был слишком медленным или быстрым. Остальные переходы 1.30 (512 reload,
80 unjam, 77 weapon switch, 96 attack, 270 hit) **не** имеют соответствующего состояния в
конфиге 0.45 и остались из 0.45.

---

# Шаг 6 — первый полный пакет и потолок 1,1 GB

Со всеми сырыми RTM (156 костей) PBO перевалил за 1,3 GB. Игра не загружает:

| Сборка | Байты | Результат |
|---|---:|---|
| `anims_D1` | 520 MB | bisect конфига, загрузилась |
| `anims_D1_sig` | 634 MB | с сигналами оружия, загрузилась |
| **`anims_D2`** | **1 374 MB** | **застряла на `Updating base class ->Grid`** |
| `anims_E1` | 1 056,5 MiB | загрузилась, но на пределе |
| `anims_E2` | 1 030,1 MiB | стабильна |

Два правила родились здесь:

1. **Один PBO.** Два PBO с одним префиксом `DZ\anims` не монтируются вместе; второй
   игнорируется. Всё должно помещаться в один файл.
2. **Практический потолок ~1,1 GB.** Выше этого загрузка умирает до меню.

Решение было не резать анимацию, а резать **кости, которые 0.45 не использует**.

---

# Шаг 7 — trim костей (центральный трюк)

## 7.1 Проблема

| Риг | Кости |
|---|---:|
| 1.30 | **156** |
| 0.45 | **120** |

Каждый кадр RTM_0101 хранит **80 байт на кость**, даже для 36, которых нет в модели 0.45.
В 1 526 файлах это сотни MB данных, которые движок прочитает и отбросит.

## 7.2 Расчёт, файл за файлом

Для стека `battery_d.rtm` с 2 кадрами:

```text
сырой  : 28 + 32*156 + 2*(4 + 156*80) = 29 988 байт
trimmed: 28 + 32*120 + 2*(4 + 120*80) = 23 076 байт
экономия: 6 912 байт (23,0%)
```

Отрезается не «первые 120»: идёт **фильтрация по имени**, используя набор костей
соответствующего BMTR 0.45 как эталон.

## 7.3 Полный код

```python
import json, struct, sys
from pathlib import Path

W = Path(r'D:\SOURCEDAYZS!!\ANIMS-WORK-20261117')
base = W / 'anims045'
orig = W / 'anims045_orig'
out = W / 'trimmed_e4'
rep = json.loads((W / 'replaced_files.json').read_text(encoding='utf-8'))

def bmtr_names(p):
    b = p.read_bytes()
    nph, pre, na, ns = struct.unpack_from('<4i', b, 21)
    off = 37
    names = []
    for _ in range(ns):
        e = b.index(b'\0', off)
        names.append(b[off:e].decode('latin1').lower())
        off = e + 1
    return names

def trim(data, keep_set):
    if data[:8] != b'RTM_0101':
        return None
    na, ns = struct.unpack_from('<2i', data, 20)
    names = [data[28 + i * 32:28 + i * 32 + 32] for i in range(ns)]
    low = [n.split(b'\0', 1)[0].decode('latin1').lower() for n in names]
    if len(set(low)) != len(low):
        raise ValueError('nomes duplicados')
    missing = keep_set - set(low)
    if missing:
        raise ValueError('faltando ossos: %s' % sorted(missing)[:5])
    keep = [i for i, n in enumerate(low) if n in keep_set]
    nk = len(keep)
    fr = 4 + ns * 80
    if len(data) != 28 + 32 * ns + na * fr:
        raise ValueError('tamanho inesperado')
    buf = bytearray()
    buf += data[:8]                 # "RTM_0101"
    buf += data[8:20]               # step
    buf += struct.pack('<2i', na, nk)
    for i in keep:
        buf += names[i]
    for f in range(na):
        o = 28 + 32 * ns + f * fr
        buf += data[o:o + 4]        # время кадра
        for i in keep:
            p = o + 4 + i * 80
            buf += data[p:p + 80]   # 32 имя + 48 матрица
    if len(buf) != 28 + 32 * nk + na * (4 + nk * 80):
        raise ValueError('tamanho final inesperado')
    return bytes(buf)

dry = '--apply' not in sys.argv
tot_before = tot_after = 0
files = changed = skipped = 0
errors = []

for r in rep:
    p = base / r
    o = orig / r
    if not p.is_file() or not o.is_file():
        continue
    files += 1
    d = p.read_bytes()
    if d[:8] != b'RTM_0101':
        skipped += 1
        continue
    try:
        t = trim(d, set(bmtr_names(o)))
    except Exception as e:
        errors.append((r, str(e)))
        continue
    tot_before += len(d)
    tot_after += len(t)
    changed += 1
    if not dry:
        dst = out / r
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(t)

print('pares', files, 'trimados', changed, 'nao-RTM_0101', skipped, 'erros', len(errors))
print('antes MB', round(tot_before / 1e6, 1),
      'depois MB', round(tot_after / 1e6, 1),
      'reducao %', round(100 * (1 - tot_after / tot_before), 2))
print('modo', 'DRY-RUN' if dry else 'APLICADO em ' + str(out))
```

## 7.4 Почему это безопасно

Самая важная строка скрипта — эта:

```python
missing = keep_set - set(low)
if missing:
    raise ValueError('faltando ossos: %s' % sorted(missing)[:5])
```

Она гарантирует, что **каждая кость, используемая BMTR 0.45, существует в RTM 1.30**. Если какой-то не хватает, скрипт
останавливается вместо создания файла с дырой. Так были обнаружены 140 файлов меню:
у них даже набор костей другой, поэтому они не проходят эту проверку.

## 7.5 Результат

| | |
|---|---:|
| Уменьшено файлов | **1 526** (все из манифеста) |
| До | **1 425,9 MB** |
| После | **1 091,5 MB** |
| Сокращение | **−23,45%** |
| Ошибки | **0** |
| Папка | `trimmed_e4\` (1 527 файлов: 1 526 + превью E5, позже откатано) |

> Отчёты E4 говорят **1 523**: это был первый проход trim. Финальный проход, использованный
> с E5 onward, имеет **1 526** — три недостающих файла вошли в повторные
> применения и тоже уменьшились. Общие байты и сокращение 23,45% сходятся.

---

# Шаг 8 — staging: собрать финальное дерево

Staging копирует 2 053 файла, по одному на запись манифеста, выбирая нужный источник для
каждой категории:

| Категория | Источник | Причина |
|---|---|---|
| меню | `anims045_orig` (0.45) | 140 файлов, +255 MB, только превью |
| превью инвентаря | 0.45 после E5 | поза 1.30 оказалась неверной |
| остальное из манифеста | `trimmed_e4` (1.30) | 1 526 файлов |
| 4 дополнения | коллекция 1.30 | у них нет слота |

```python
n = total = rev_menu = trimmed_n = 0
for e in info['files']:
    rel = e['name'].replace('\\', '/')
    parts = rel.split('/')
    cat = parts[3] if len(parts) > 3 and parts[2] == 'sdr' else ''
    src = tree / rel
    if cat == 'menu' and rel.lower() != (
        'data/anim/sdr/menu/inventory/cdzpinventoryplayerpreviewunarmed.rtm'
    ):
        q = orig / rel
        if q.is_file():
            src = q
            rev_menu += 1
    elif rel.lower() in rep:
        t = trim / rel
        if t.is_file():
            src = t
            trimmed_n += 1
    if rel in extras:
        src = extras[rel]
    if not src.is_file():
        raise SystemExit('faltando: ' + str(src))
    dst = stage / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(src, dst)          # hardlink: не дублирует 1 GB на диске
    except OSError:
        shutil.copyfile(src, dst)
```

Результат: **2 053 файла**, **~918 MB**, **1 386 после trim**, **140 меню в 0.45**.

## 8.1 Превью до и после

E5 попыталась использовать превью 1.30 в инвентаре. Файл в 18 раз больше, а поза —
потягивания, с поднятыми руками:

| Сборка | Формат | Байты | Результат |
|---|---|---:|---|
| E5 | `RTM_0101` (`p_menu_unarmed_idleMain01`) | **3 086 752** | поднятые руки, отклонено |
| E6 | `BMTR` (0.45) | **171 150** | правильная поза |

Откат был `copyfile` оригинала поверх файла в рабочем дереве, затем новый
проход staging. Менять скрипт не понадобилось.

## 8.2 Diff staging (E3 → E6)

```diff
-        if cat == 'menu':
-            use_orig = True
-        elif cat == 'sig' and not is_unarmed(name):
-            use_orig = True
+        if cat == 'menu' and rel.lower() != (
+            'data/anim/sdr/menu/inventory/cdzpinventoryplayerpreviewunarmed.rtm'
+        ):
+            q = orig / rel
+            if q.is_file():
+                src = q
+                rev_menu += 1
+        elif rel.lower() in rep:
+            t = trim / rel
+            if t.is_file():
+                src = t
+                trimmed_n += 1
```

E3 ещё отправляла всё меню в 0.45, но не использовала trim (его ещё не было).
E6 отправляет меню в 0.45 **кроме превью** и использует trim во всём остальном.

---

# Шаг 9 — упаковать PBO

## 9.1 Формат файла

PBO — последовательность записей с именем, завершённым нулём, затем данные и
SHA1 в конце:

```text
\0 + "Vers" + 0 + 0 + 0 + 0        заголовок (21 байт)
prefix\0DZ\anims\0                 свойства
revision\017984\0
\0                                 конец свойств
config.bin\0 + 5 uint32            запись (имя + метод/original/offset/timestamp/size)
data\anim\...\x.rtm\0 + 5 uint32
\0                                 конец записей
<данные, соединённые в порядке записей>
\0 + SHA1(header + data)           трейлер (21 байт)
```

Поле `offset` — **исходное** смещение файла в старом PBO; `timestamp` также
сохраняется. Это держит PBO совместимым с ожиданиями движка и оставляет хеш стабильным.

## 9.2 Полный код

```python
import argparse, hashlib, json, struct, tempfile
from pathlib import Path, PureWindowsPath

parser = argparse.ArgumentParser()
parser.add_argument('tree')
parser.add_argument('output')
args = parser.parse_args()

tree = Path(args.tree)
manifest = tree / '_pbo_manifest.json'
info = json.loads(manifest.read_text(encoding='utf-8'))
target = Path(args.output)
target.parent.mkdir(parents=True, exist_ok=True)

header = bytearray(b'\0' + struct.pack('<5I', 0x56657273, 0, 0, 0, 0))
for name, value in info['properties'].items():
    header.extend(name.encode('latin1') + b'\0' + value.encode('latin1') + b'\0')
header.extend(b'\0')

rows = []
total = 0
for entry in info['files']:
    path = manifest.parent.joinpath(*PureWindowsPath(entry['name']).parts)
    if not path.is_file():
        raise SystemExit('faltando: ' + entry['name'])
    size = path.stat().st_size
    header.extend(entry['name'].encode('latin1') + b'\0')
    header.extend(struct.pack('<5I', 0, entry['original'], entry['offset'],
                              entry['timestamp'], size))
    rows.append(path)
    total += size

header.extend(b'\0' * 21)
digest = hashlib.sha1(header)

with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as output:
    pending = Path(output.name)
    try:
        output.write(header)
        for path in rows:
            with path.open('rb') as source:
                for chunk in iter(lambda: source.read(4 * 1024 * 1024), b''):
                    digest.update(chunk)
                    output.write(chunk)
        output.write(b'\0' + digest.digest())
        output.close()
        pending.replace(target)
    finally:
        pending.unlink(missing_ok=True)

print('PBO gerado:', target)
print('arquivos: %d  dados: %.1f MB  total: %.1f MB' % (
    len(rows), total / 1048576, target.stat().st_size / 1048576))
```

`struct.pack` записи использует **метаданные манифеста**, а не пересчитанные значения. Именно
поэтому новый PBO — это правка старого, а не странный файл.

## 9.3 Результат

| Сборка | Байты | MiB | Записей | RTM |
|---|---:|---:|---:|---:|
| **E6** | 918 323 340 | 875,8 | 2 053 | 2 028 (1 390 + 638) |
| **E7** | 918 285 584 | 875,7 | 2 053 | 2 028 (1 388 + 640) |

---

# Шаг 10 — проверить перед установкой

Верификатор делает три вещи: проверяет структуру **всех** RTM, сравнивает образцы
байт в байт со staging и показывает особые случаи.

```python
import struct, hashlib, random
from pathlib import Path

p = Path(r'D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo')
stage = Path(r'D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\animsE7_tree')

with p.open('rb') as b:
    d = b.read(4000000)
    off = 1 + 4 + 16
    while True:
        e = d.index(b'\0', off); n = d[off:e].decode('latin1'); off = e + 1
        if not n: break
        e = d.index(b'\0', off); off = e + 1
    ents = []
    while True:
        e = d.index(b'\0', off); n = d[off:e].decode('latin1'); off = e + 1
        if not n:
            data_start = off + 20
            break
        m, o, offs, ts, sz = struct.unpack('<5I', d[off:off + 20]); off += 20
        ents.append((n, m, offs, sz))

    b.seek(0, 2); size = b.tell()
    print('entradas', len(ents), 'restante',
          size - data_start - sum(e[3] for e in ents))

    rtm = bad_rtm = 0
    for i, (name, m, offs, sz) in enumerate(ents):
        rel = Path(name.replace('\\', '/'))
        if rel.suffix.lower() == '.rtm':
            rtm += 1
            b.seek(pos); head = b.read(28)
            if head[:8] == b'RTM_0101':
                na, ns = struct.unpack('<2i', head[20:28])
                if sz != 28 + 32 * ns + na * (4 + ns * 80):
                    bad_rtm += 1
                    print('RTM inconsistente', rel.name, na, ns, sz)
        pos += sz
```

Кроме того, 10 случайных файлов + особые случаи (стек, превью, бросок) сравниваются
по SHA1 с деревом staging.

| Проверка | E6 | E7 |
|---|---|---|
| Записей | 2 053 | 2 053 |
| Валидных RTM | 2 028 | 2 028 |
| `RTM_0101` | 1 390 | 1 388 |
| `BMTR` | 638 | 640 |
| Идентичных образцов | 11/11 | 10/10 |
| Несогласованный RTM | 0 | 0 |
| Остаток в конце PBO | 21 байт (SHA1) | 21 байт (SHA1) |

---

# Шаг 11 — установить и протестировать

`anims.pbo` **заблокирован, пока клиент работает**. Устанавливать всегда с закрытой игрой.

```bat
:: 1. закрыть игру
taskkill /IM DayZInt.exe /F

:: 2. скопировать сборку (замените E7 на нужную)
copy /Y "D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo" ^
     "D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\Addons\anims.pbo"

:: 3. проверить
certutil -hashfile "...\Addons\anims.pbo" SHA1

:: 4. запустить сервер + клиент (ждёт 40 с)
schtasks /run /tn "DayZTestLaunch"
```

RPT **append**: чтобы измерить сессию, отрежьте текст на последнем `Current time:`.

| Строка | Приемлемый baseline |
|---|---:|
| `Animation ... not found or empty` | 12 |
| `Bad move` | 23 |
| `Invalid move ... disarm` | 15 |
| `PLAYING` | 1 |

Любое число выше — регрессия сборки. Baseline 12 / 23 / 15 повторяется во всех 36
предыдущих сессиях, включая до любого изменения анимации.

---

# Шаг 12 — E7 и баг фонаря

E6 вошла в мир и не дала новой ошибки, но визуальный тест нашёл проблему: держа
**фонарь + батарею**, персонаж вытягивает руки и предмет превращается в гигантскую пластину.

Первый подозреваемый — два IK-трека расходника, которые позиционируют предмет в руке:

| Файл | E6 (1.30) | E7 (0.45) |
|---|---:|---:|
| `ik\comsumables\9v_battery.rtm` | 23 076 B | **4 187 B** |
| `ik\comsumables\battery_d.rtm` | 23 076 B | **4 209 B** |

E7 вернула только эти два и переупаковала:

```text
bytes     918 285 584
MiB       875,7
entradas  2 053
RTMs      2 028 (1 388 RTM_0101 + 640 BMTR)
SHA1      A986CA7C65D1820297CA9EF1EAFC7A1599F6166C
amostras  10/10
```

Если баг останется, следующий шаг — вернуть **4 состояния `batteryLicking`** и пересобрать
пакет как E8; после этого пересмотреть переходы действия.

---

# До × после, файл за файлом

| Класс | До (0.45) | После | Обработка |
|---|---|---|---|
| Локомоция | BMTR 120 костей | RTM_0101 120 костей | trim |
| Оружие | BMTR | RTM_0101 | trim |
| Ранения | BMTR | RTM_0101 | trim + 4 дополнения |
| IK / расходники | BMTR | RTM_0101 | trim; 2 возвращены в E7 |
| Переходы позы | короткий BMTR | RTM_0101 + новая speed | 12 вручную |
| Меню | BMTR | **остаётся BMTR** | 140 вне; превью возвращено |
| Зомби | BMTR | **остаётся BMTR** | несовместимый риг (273) |
| Тест / visema / props | BMTR | **остаётся BMTR** | 33 без пары в 1.30 |
| Смена оружия, stops, мочеиспускание | BMTR | **остаётся BMTR** | ~192 не существуют в 1.30 |

## Финальные числа

| | |
|---|---:|
| RTM в PBO 0.45 | 2 028 |
| RTM в коллекции 1.30 | 7 415 |
| Заменено файлов | 1 526 |
| В формате 1.30 в E6 | **1 390 (68,5%)** |
| В BMTR 0.45 в E6 | 638 |
| Trim | 1 425,9 → 1 091,5 MB (−23,45%) |
| Меню исключено | 140 файлов (+255 MB) |
| Треков `ik/` заменено | 84 |
| Переходов позы | 12 |
| Сборка в игре | E6 · 918 323 340 B |
| Готовая сборка | E7 · 918 285 584 B |

## 8 правил, которые стоили времени

1. **Дублированный PBO не монтируется** — тот же префикс, второй игнорируется.
2. **Потолок ~1,1 GB** — выше игра зависает на `Updating base class ->Grid`.
3. **Порядок костей не важен** — движок сопоставляет по имени; не переупорядочивайте RTM.
4. **Trim по имени, а не по индексу** — и нужно проверять, что набор 0.45 является подмножеством.
5. **Step пространственный** — если клип меняет длительность, step должен меняться вместе с ним.
6. **RPT append** — отрезать на последнем `Current time:` перед подсчётом.
7. **Меню — не геймплей** — красивая поза меню может быть бесполезна в инвентаре.
8. **Бэкап прежде всего** — PBO, дерево и хеш; без этого не доказать регрессию.

## Команды на каждый день

```bat
:: извлечь
python unpack_pbo.py Addons\anims.pbo ANIMS-WORK-20261117\anims045_orig

:: сопоставить и применить
python build_mapping.py
python apply_mapping.py mapping_locomocao.json

:: trim
python trim_rtm.py            :: dry-run
python trim_rtm.py --apply    :: пишет в trimmed_e4

:: собрать и упаковать
python stage_e6.py
python pack_pbo.py animsE6_tree out\anims_E6.pbo

:: проверить
python verify_e7.py
```

> Детали каждой сборки (E1–E7), хеши и RPT — на вкладках **Сборки E1–E7** и
> **Анимации 1.30** страницы **Обновления**.
