# PBO — формат файла движка

> PBO (*Packed Bohemia Object*) — контейнер контента игры: заголовок со
> списком файлов, за которым идут объединённые данные. Всё ниже взято из кода, который читает и
> пишет этот формат: `El/QStream/fileinfo.h`, `El/QStream/packFiles.cpp` и
> `El/QStream/qbStream.cpp`.

## 1. Где определён формат

`El/QStream/fileinfo.h:4-29`:

```cpp
#define NAME_LEN 128-20                 // максимум 108 байт на имя

#define EncrMagic    'Encr'             // GCC: StrToInt("rcnE")
#define CompMagic    'Cprs'             // GCC: StrToInt("srpC")
#define VersionMagic 'Vers'             // GCC: StrToInt("sreV")

struct FileInfo
{
    char name[NAME_LEN];
    int  compressedMagic;
    int  uncompressedSize;
    long startOffset;
    long time;
    long length;
};
```

### Деталь про "sreV"

`'Vers'` — многобайтовая константа MSVC: целое значение равно `0x56657273` и записывается
в **little-endian**, то есть байты на диске выходят `73 72 65 56` = **`sreV`**. Поэтому
GCC-ветка того же заголовка использует `StrToInt("sreV")` (`fileinfo.h:12-16`). Кто открывает
PBO в hex-редакторе, видит `sreV`, а не `Vers`.

## 2. Раскладка на диске

```text
+----------------------------------------------------------+  смещение 0
| ЗАПИСЬ СВОЙСТВ (необязательная)                           |
|   name = ""            (1 байт NUL)                       |
|   compressedMagic = Vers                                  |
|   uncompressedSize = 0                                    |
|   startOffset = 0                                         |
|   time = 0                                                |
|   length = 0                                              |
|   пары имя\0 значение\0 ...                               |
|   "" (1 байт NUL завершает список)                        |
+----------------------------------------------------------+
| СПИСОК ФАЙЛОВ                                             |
|   для каждого файла:                                      |
|     имя\0                                                 |
|     int32 compressedMagic   (0 = сырой, Cprs = сжатый)    |
|     int32 uncompressedSize  (только если сжатый)          |
|     int32 startOffset       (пересчитывается при открытии)|
|     int32 time              (timestamp)                   |
|     int32 length            (байт в PBO)                  |
|   ЗАВЕРШАЮЩАЯ ЗАПИСЬ: FileInfo полностью нулевая (имя "") |
+----------------------------------------------------------+
| ДАННЫЕ                                                    |
|   блок файла 1, блок файла 2, ...                         |
+----------------------------------------------------------+
```

Доказательства:

- Запись каждой записи: `packFiles.cpp:64-78` — `name` + NUL, затем
  `compressedMagic`, `uncompressedSize`, `startOffset`, `time`, `length`.
- Блок свойств: `packFiles.cpp:399-417` — пишет завершающую запись с
  `compressedMagic = VersionMagic`, затем пары `имя\0значение\0` и финальный NUL.
- Терминатор списка файлов: `packFiles.cpp:223-235` — `FileInfoExt f; f.Zero();
  _files.Add(f);`.
- Объединённые данные: `packFiles.cpp:500-511` (без сжатия) и `:519-544` (со сжатием).

## 3. Почему нельзя доверять `startOffset`

При записи поле существует (`packFiles.cpp:70`), но при **открытии** читатель пересчитывает
смещения последовательно:

```cpp
info.startOffset = startOffset;
startOffset += info.length;      // qbStream.cpp:658-659, 770-771, 839-840, 878-879
...
info.startOffset += headerSize;  // qbStream.cpp:917
```

И проверяет общий размер:

```text
"Data file too short '%s'. Expected %d B, got %d B"   // qbStream.cpp:926-928
```

То есть PBO читается как **последовательность**, а записанное смещение — наследие. PBO,
перепакованный сторонним инструментом, остаётся действительным, если порядок и `length`
верны.

## 4. Сжатие

Только файлы, у которых `length` и `compressedMagic` это указывают:

- `compressedMagic = 'Cprs'` (`CompMagic`) → сжатый блок, с заполненным `uncompressedSize`
  (`packFiles.cpp:533-539`).
- `compressedMagic = 0` → сырой блок.

Стандартный список расширений, которые **никогда** не сжимаются (`packFiles.cpp:429-435`):

```text
.pbo  .ogg  .wss  .jpg
```

## 5. Префикс: «точка монтирования» PBO

PBO может объявить свойство `prefix`. При открытии оно становится виртуальным путём
файлов (`qbStream.cpp:439-445`):

```cpp
if (!strcmpi(name,"prefix"))
{
  if (_prefix.GetLength()==0) SetPrefix(value+"\\");
}
```

При записи префикс сохраняется как обычное свойство (`packFiles.cpp:699-705`,
`vbs2Enc.name = "prefix"`). Именно это позволяет PBO монтироваться в `\dz\weapons\` без
повторения пути в каждом имени файла.

## 6. Шифрование и защита заголовка

- `compressedMagic = 'Encr'` (`EncrMagic`) помечает зашифрованный блок
  (`packFiles.cpp:769, 872, 879`).
- Стандартный список зашифрованных расширений: `.p3d .bin .cpp .sqm .sqs .ext .csv`
  (`packFiles.cpp:437-446`).
- **Защита заголовка** (`_ENABLE_PBO_PROTECTION=1`, включено в сборке —
  `lib2010.vcxproj:475`): весь заголовок шифруется AES, и PBO получает свойство
  `hprotect`; фиктивный файл `___dummypadding___` заполняет padding
  (`El/Encryption/pboheaderprotection.h:15-30`, `packFiles.cpp:340-390`).

Возможные состояния при преобразовании PBO (`pboheaderprotection.h:36-50`): `TROk`,
`TRNotPBO`, `TRDecryptionFailed`, `TRUnexpectedEncrypted`, `TRInvalidDecryptedHeader` и т. д.

## 7. Подпись (`.bisign`)

В `Addons/` этого дерева **116 `.pbo` и 116 `.bisign`** — по одному на PBO, всего 6 145 MB.
`.bisign` — подпись содержимого, проверяемая сервером; без неё аддон
отклоняется. `[ожидает]` детализировать точный алгоритм (модуль — `El/DataSignatures/`;
чтение ключей — в `El/Encryption/`).

## 8. Кто читает и кто пишет

| Роль | Класс / инструмент | Доказательство |
|---|---|---|
| Открыть PBO в игре | `QFBank::open` | `qbStream.cpp:369-460` |
| Прочитать заголовок | `LoadFileInfo` | `qbStream.cpp:95-116` |
| Создать PBO | `FileBankManager::Create` | `packFiles.cpp:553-626` |
| Записать заголовок | `SaveHeadersOpt` | `packFiles.cpp:325-396` |
| Записать запись | `SaveFileInfo` | `packFiles.cpp:64-78` |
| CLI-упаковщик | `FileBank/FileBank.cpp` | использует `packFiles.hpp` |
| Список/извлечение | `BankRev/bankRev.cpp` | консольный инструмент |
| Проверка | `CheckBank/CheckBank.cpp` | консольный инструмент |
| Xbox 360 | `XBOXPBORepack/` | перепаковывает для платформы |

## 9. Конвейер контента

```text
Data3D/*.p3d  --binarize-->  оптимизированный .p3d  --FileBank-->  .pbo  --подпись-->  .bisign
Worlds/*.wrp  --binarize-->  оптимизированный .wrp   (то же)
```

`binarize/ReadMe.txt` показывает реальные командные строки, использованные BI, например:

```text
binarize -textures=Optimize -exclude=Optimize\exclude.lst Data3D Optimize\Data3D *.p3d
binarize -addon=BISOFP -addon=Kolo -textures=AddOnsOpt -exclude=AddOnsOpt\exclude.lst Kolo AddOnsOpt\Kolo
```

## 10. Чек-лист для проверки PBO

- [ ] Первые 4 байта — `73 72 65 56` (`sreV`)?
- [ ] Первая запись имеет пустое имя и magic `Vers`? (блок свойств)
- [ ] Есть `prefix`? Какой виртуальный путь?
- [ ] У каждой записи `length` согласуется с файлом?
- [ ] Терминатор (пустое имя, всё нули) стоит перед данными?
- [ ] Общий размер совпадает с последним `startOffset + length`?
- [ ] Рядом есть `.bisign`? Сервер принимает без неё?
