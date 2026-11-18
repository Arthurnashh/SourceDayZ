# PBO — the engine's file format

> The PBO (*Packed Bohemia Object*) is the game's content container: a header with the
> file list, followed by the concatenated data. Everything below comes from the code that reads and
> writes the format: `El/QStream/fileinfo.h`, `El/QStream/packFiles.cpp` and
> `El/QStream/qbStream.cpp`.

## 1. Where the format is defined

`El/QStream/fileinfo.h:4-29`:

```cpp
#define NAME_LEN 128-20                 // 108 bytes max for the name

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

### The "sreV" detail

`'Vers'` is an MSVC multi-character constant: the integer value is `0x56657273` and it is written
in **little-endian**, so the bytes on disk come out as `73 72 65 56` = **`sreV`**. That is
why the GCC branch of the same header uses `StrToInt("sreV")` (`fileinfo.h:12-16`). Anyone who opens
a PBO in a hex editor sees `sreV`, not `Vers`.

## 2. On-disk layout

```text
+----------------------------------------------------------+  offset 0
| PROPERTIES ENTRY (optional)                               |
|   name = ""            (1 NUL byte)                       |
|   compressedMagic = Vers                                  |
|   uncompressedSize = 0                                    |
|   startOffset = 0                                         |
|   time = 0                                                |
|   length = 0                                              |
|   name\0 value\0 ... pairs                                |
|   "" (1 NUL byte ends the list)                           |
+----------------------------------------------------------+
| FILE LIST                                                 |
|   for each file:                                          |
|     name\0                                                |
|     int32 compressedMagic   (0 = raw, Cprs = compressed)  |
|     int32 uncompressedSize  (only if compressed)          |
|     int32 startOffset       (recomputed on open)          |
|     int32 time              (timestamp)                   |
|     int32 length            (bytes in the PBO)            |
|   TERMINATING ENTRY: FileInfo all zeroed (empty name)     |
+----------------------------------------------------------+
| DATA                                                      |
|   block of file 1, block of file 2, ...                   |
+----------------------------------------------------------+
```

Evidence:

- Writing each entry: `packFiles.cpp:64-78` — `name` + NUL, then
  `compressedMagic`, `uncompressedSize`, `startOffset`, `time`, `length`.
- Properties block: `packFiles.cpp:399-417` — writes a terminating entry with
  `compressedMagic = VersionMagic`, then `name\0value\0` pairs and a final NUL.
- File-list terminator: `packFiles.cpp:223-235` — `FileInfoExt f; f.Zero();
  _files.Add(f);`.
- Concatenated data: `packFiles.cpp:500-511` (no compression) and `:519-544` (with compression).

## 3. Why `startOffset` should not be trusted

When writing, the field exists (`packFiles.cpp:70`), but on **open** the reader recomputes the
offsets sequentially:

```cpp
info.startOffset = startOffset;
startOffset += info.length;      // qbStream.cpp:658-659, 770-771, 839-840, 878-879
...
info.startOffset += headerSize;  // qbStream.cpp:917
```

And it validates the total size:

```text
"Data file too short '%s'. Expected %d B, got %d B"   // qbStream.cpp:926-928
```

In other words: the PBO is read as a **sequence**, and the stored offset is legacy. A PBO
repacked by a third-party tool remains valid if the order and the `length` values
are correct.

## 4. Compression

Only the files whose `length` and `compressedMagic` say so:

- `compressedMagic = 'Cprs'` (`CompMagic`) → compressed block, with `uncompressedSize`
  filled in (`packFiles.cpp:533-539`).
- `compressedMagic = 0` → raw block.

Default list of extensions that are **never** compressed (`packFiles.cpp:429-435`):

```text
.pbo  .ogg  .wss  .jpg
```

## 5. Prefix: the PBO's "mount point"

A PBO can declare the `prefix` property. On open, it becomes the files' virtual path
(`qbStream.cpp:439-445`):

```cpp
if (!strcmpi(name,"prefix"))
{
  if (_prefix.GetLength()==0) SetPrefix(value+"\\");
}
```

When writing, the prefix is stored as a normal property (`packFiles.cpp:699-705`,
`vbs2Enc.name = "prefix"`). That is what lets a PBO mount at `\dz\weapons\` without
every file name repeating the path.

## 6. Encryption and header protection

- `compressedMagic = 'Encr'` (`EncrMagic`) marks an encrypted block
  (`packFiles.cpp:769, 872, 879`).
- Default list of encrypted extensions: `.p3d .bin .cpp .sqm .sqs .ext .csv`
  (`packFiles.cpp:437-446`).
- **Header protection** (`_ENABLE_PBO_PROTECTION=1`, enabled in the build —
  `lib2010.vcxproj:475`): the entire header is AES-encrypted and the PBO receives the
  `hprotect` property; a dummy file `___dummypadding___` fills the padding
  (`El/Encryption/pboheaderprotection.h:15-30`, `packFiles.cpp:340-390`).

Possible states when transforming a PBO (`pboheaderprotection.h:36-50`): `TROk`,
`TRNotPBO`, `TRDecryptionFailed`, `TRUnexpectedEncrypted`, `TRInvalidDecryptedHeader` etc.

## 7. Signature (`.bisign`)

`Addons/` in this tree has **116 `.pbo` and 116 `.bisign`** — one per PBO, 6,145 MB in total.
The `.bisign` is the content signature, verified by the server; without it the addon is
rejected. `[pending]` detail the exact algorithm (the module is `El/DataSignatures/`;
key reading is in `El/Encryption/`).

## 8. Who reads and who writes

| Role | Class / tool | Evidence |
|---|---|---|
| Open a PBO in the game | `QFBank::open` | `qbStream.cpp:369-460` |
| Read the header | `LoadFileInfo` | `qbStream.cpp:95-116` |
| Create a PBO | `FileBankManager::Create` | `packFiles.cpp:553-626` |
| Write the header | `SaveHeadersOpt` | `packFiles.cpp:325-396` |
| Write an entry | `SaveFileInfo` | `packFiles.cpp:64-78` |
| CLI packer | `FileBank/FileBank.cpp` | uses `packFiles.hpp` |
| List/extract | `BankRev/bankRev.cpp` | console tool |
| Verify | `CheckBank/CheckBank.cpp` | console tool |
| Xbox 360 | `XBOXPBORepack/` | repacks for the platform |

## 9. Content pipeline

```text
Data3D/*.p3d  --binarize-->  optimized .p3d  --FileBank-->  .pbo  --sign-->  .bisign
Worlds/*.wrp  --binarize-->  optimized .wrp   (same)
```

`binarize/ReadMe.txt` shows the actual command lines used by BI, for example:

```text
binarize -textures=Optimize -exclude=Optimize\exclude.lst Data3D Optimize\Data3D *.p3d
binarize -addon=BISOFP -addon=Kolo -textures=AddOnsOpt -exclude=AddOnsOpt\exclude.lst Kolo AddOnsOpt\Kolo
```

## 10. Checklist for inspecting a PBO

- [ ] Are the first 4 bytes `73 72 65 56` (`sreV`)?
- [ ] Does the first entry have an empty name and magic `Vers`? (properties block)
- [ ] Is there a `prefix`? What is the virtual path?
- [ ] Does each entry have a `length` consistent with the file?
- [ ] Is the terminator (empty name, all zero) before the data?
- [ ] Does the total size match the last `startOffset + length`?
- [ ] Is there a `.bisign` next to it? Does the server accept it without one?
