# PBO — o formato de arquivo do motor

> O PBO (*Packed Bohemia Object*) é o contêiner de conteúdo do jogo: um cabeçalho com a
> lista de arquivos, seguido dos dados concatenados. Tudo abaixo vem do código que lê e
> escreve o formato: `El/QStream/fileinfo.h`, `El/QStream/packFiles.cpp` e
> `El/QStream/qbStream.cpp`.

## 1. Onde o formato é definido

`El/QStream/fileinfo.h:4-29`:

```cpp
#define NAME_LEN 128-20                 // 108 bytes de nome no maximo

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

### O detalhe do "sreV"

`'Vers'` é uma constante multi-caractere do MSVC: o inteiro vale `0x56657273` e é gravado
em **little-endian**, ou seja, os bytes no disco saem `73 72 65 56` = **`sreV`**. É por
isso que o ramo GCC do mesmo header usa `StrToInt("sreV")` (`fileinfo.h:12-16`). Quem abre
um PBO num editor hexadecimal vê `sreV`, não `Vers`.

## 2. Layout em disco

```text
+----------------------------------------------------------+  offset 0
| ENTRADA DE PROPRIEDADES (opcional)                        |
|   name = ""            (1 byte NUL)                       |
|   compressedMagic = Vers                                  |
|   uncompressedSize = 0                                    |
|   startOffset = 0                                         |
|   time = 0                                                |
|   length = 0                                              |
|   par nome\0 valor\0 ...                                  |
|   "" (1 byte NUL encerra a lista)                         |
+----------------------------------------------------------+
| LISTA DE ARQUIVOS                                          |
|   para cada arquivo:                                      |
|     nome\0                                                |
|     int32 compressedMagic   (0 = cru, Cprs = comprimido)  |
|     int32 uncompressedSize  (so se comprimido)            |
|     int32 startOffset       (recalculado na abertura)     |
|     int32 time              (timestamp)                   |
|     int32 length            (bytes no PBO)                |
|   ENTRADA TERMINADORA: FileInfo todo zerado (nome vazio)  |
+----------------------------------------------------------+
| DADOS                                                     |
|   bloco do arquivo 1, bloco do arquivo 2, ...             |
+----------------------------------------------------------+
```

Evidências:

- Escrita de cada entrada: `packFiles.cpp:64-78` — `name` + NUL, depois
  `compressedMagic`, `uncompressedSize`, `startOffset`, `time`, `length`.
- Bloco de propriedades: `packFiles.cpp:399-417` — grava uma entrada terminadora com
  `compressedMagic = VersionMagic`, depois pares `nome\0valor\0` e um NUL final.
- Terminador da lista de arquivos: `packFiles.cpp:223-235` — `FileInfoExt f; f.Zero();
  _files.Add(f);`.
- Dados concatenados: `packFiles.cpp:500-511` (sem compressão) e `:519-544` (com compressão).

## 3. Por que `startOffset` não deve ser confiado

Na escrita, o campo existe (`packFiles.cpp:70`), mas na **abertura** o leitor recalcula os
offsets sequencialmente:

```cpp
info.startOffset = startOffset;
startOffset += info.length;      // qbStream.cpp:658-659, 770-771, 839-840, 878-879
...
info.startOffset += headerSize;  // qbStream.cpp:917
```

E valida o tamanho total:

```text
"Data file too short '%s'. Expected %d B, got %d B"   // qbStream.cpp:926-928
```

Ou seja: o PBO é lido como uma **sequência**, e o offset gravado é legado. Um PBO
reempacotado por ferramenta de terceiros continua válido se a ordem e os `length`
estiverem certos.

## 4. Compressão

Só os arquivos cujo `length` e `compressedMagic` dizem respeito:

- `compressedMagic = 'Cprs'` (`CompMagic`) → bloco comprimido, com `uncompressedSize`
  preenchido (`packFiles.cpp:533-539`).
- `compressedMagic = 0` → bloco cru.

Lista padrão de extensões que **nunca** são comprimidas (`packFiles.cpp:429-435`):

```text
.pbo  .ogg  .wss  .jpg
```

## 5. Prefixo: o "mount point" do PBO

Um PBO pode declarar a propriedade `prefix`. Na abertura, ela vira o caminho virtual dos
arquivos (`qbStream.cpp:439-445`):

```cpp
if (!strcmpi(name,"prefix"))
{
  if (_prefix.GetLength()==0) SetPrefix(value+"\\");
}
```

Na escrita, o prefixo é gravado como propriedade normal (`packFiles.cpp:699-705`,
`vbs2Enc.name = "prefix"`). É isso que permite um PBO montar em `\dz\weapons\` sem que
cada nome de arquivo repita o caminho.

## 6. Criptografia e proteção de header

- `compressedMagic = 'Encr'` (`EncrMagic`) marca bloco criptografado
  (`packFiles.cpp:769, 872, 879`).
- Lista padrão de extensões criptografadas: `.p3d .bin .cpp .sqm .sqs .ext .csv`
  (`packFiles.cpp:437-446`).
- **Proteção de header** (`_ENABLE_PBO_PROTECTION=1`, ligado no build —
  `lib2010.vcxproj:475`): o cabeçalho inteiro é cifrado em AES e o PBO recebe a propriedade
  `hprotect`; um arquivo dummy `___dummypadding___` preenche o padding
  (`El/Encryption/pboheaderprotection.h:15-30`, `packFiles.cpp:340-390`).

Estados possíveis ao transformar um PBO (`pboheaderprotection.h:36-50`): `TROk`,
`TRNotPBO`, `TRDecryptionFailed`, `TRUnexpectedEncrypted`, `TRInvalidDecryptedHeader` etc.

## 7. Assinatura (`.bisign`)

`Addons/` desta árvore tem **116 `.pbo` e 116 `.bisign`** — um por PBO, 6.145 MB no total.
O `.bisign` é a assinatura do conteúdo, verificada pelo servidor; sem ele o addon é
recusado. `[pendente]` detalhar o algoritmo exato (o módulo é `El/DataSignatures/`;
a leitura de chaves está em `El/Encryption/`).

## 8. Quem lê e quem escreve

| Papel | Classe / ferramenta | Evidência |
|---|---|---|
| Abrir PBO no jogo | `QFBank::open` | `qbStream.cpp:369-460` |
| Ler cabeçalho | `LoadFileInfo` | `qbStream.cpp:95-116` |
| Criar PBO | `FileBankManager::Create` | `packFiles.cpp:553-626` |
| Gravar cabeçalho | `SaveHeadersOpt` | `packFiles.cpp:325-396` |
| Gravar entrada | `SaveFileInfo` | `packFiles.cpp:64-78` |
| Empacotador CLI | `FileBank/FileBank.cpp` | usa `packFiles.hpp` |
| Listar/extrair | `BankRev/bankRev.cpp` | ferramenta de console |
| Verificar | `CheckBank/CheckBank.cpp` | ferramenta de console |
| Xbox 360 | `XBOXPBORepack/` | reempacota para a plataforma |

## 9. Pipeline de conteúdo

```text
Data3D/*.p3d  --binarize-->  .p3d otimizado  --FileBank-->  .pbo  --assinar-->  .bisign
Worlds/*.wrp  --binarize-->  .wrp otimizado   (idem)
```

`binarize/ReadMe.txt` mostra as linhas de comando reais usadas pela BI, por exemplo:

```text
binarize -textures=Optimize -exclude=Optimize\exclude.lst Data3D Optimize\Data3D *.p3d
binarize -addon=BISOFP -addon=Kolo -textures=AddOnsOpt -exclude=AddOnsOpt\exclude.lst Kolo AddOnsOpt\Kolo
```

## 10. Checklist para inspecionar um PBO

- [ ] Os 4 primeiros bytes são `73 72 65 56` (`sreV`)?
- [ ] A primeira entrada tem nome vazio e magic `Vers`? (bloco de propriedades)
- [ ] Existe `prefix`? Qual o caminho virtual?
- [ ] Cada entrada tem `length` coerente com o arquivo?
- [ ] O terminador (nome vazio, tudo zero) está antes dos dados?
- [ ] O tamanho total bate com o último `startOffset + length`?
- [ ] Há `.bisign` ao lado? O servidor aceita sem ele?
