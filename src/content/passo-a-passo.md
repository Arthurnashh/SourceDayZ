# Passo a passo do porte das animações

Esta página é o diário técnico do porte: **o que foi feito, em que ordem, com qual script e o
que mudou em cada arquivo**. O objetivo é que qualquer pessoa consiga repetir o processo do
zero — e entender por que cada decisão foi tomada.

O trabalho foi feito entre 17 e 18/11/2026, no cliente **0.45.124252**, usando o acervo do
**DayZ 1.30** em `D:\RetailPlayer-OFP2-Y0` (7.415 RTMs).

## O que "portar animação" significa

O `anims.pbo` guarda duas coisas diferentes:

| Parte | O que é | Foi trocada? |
|---|---|---|
| `config/sdr2/config.bin` | CfgMoves: estados, transições, regras, velocidades | **não** — o config do 1.30 tem estados que o 0.45 não conhece |
| `data/anim/sdr/**/*.rtm` | os quadros de animação (ossos, matrizes, tempos) | **sim** — 1.526 arquivos |

Portanto o porte é **de dados**, não de código do motor. O executável 0.45 não foi alterado
para ler as animações novas; ele já sabia ler os dois formatos.

## O pipeline inteiro

```text
DayZ 1.30 (7.415 RTMs)                     DayZ 0.45 (anims.pbo)
        |                                          |
        |  1. índice por nome                      |  2. extrair + manifesto
        v                                          v
  mapping_*.json  ------ 3. aplicar ------->  anims045/  (1.526 trocados)
        |                                          |
        |  4. extras + step                        |
        v                                          v
  trimmed_e4/  (1.526 trimados)  -- 5. staging -->  animsE6_tree/
                                                       |
                                              6. pack_pbo.py
                                                       v
                                                anims_E6.pbo
                                                       |
                                              7. verificar + instalar + RPT
```

| Passo | O que faz | Ferramenta | Resultado |
|---|---|---|---|
| 0 | congela o original e mede | `certutil`, `Get-FileHash` | baseline conhecido |
| 1 | abre o PBO e guarda o manifesto | `unpack_pbo.py` | 2.053 entradas |
| 2 | lê os dois formatos de RTM | leitura binária | 156 × 120 ossos |
| 3 | descobre o nome 1.30 de cada slot | `build_mapping.py` | 360 de locomoção |
| 4 | copia com validação de header | `apply_mapping.py` | 1.526 caminhos |
| 5 | adiciona 4 extras e corrige o step | `add_extra.py` | 24 clipes |
| 6 | tenta o pacote completo | `pack_pbo.py` | falha no teto de 1,1 GB |
| 7 | tira os ossos que o 0.45 não usa | `trim_rtm.py` | −23,45% |
| 8 | monta a árvore final | `stage_e6.py` | 2.053 arquivos |
| 9 | empacota com SHA1 | `pack_pbo.py` | `anims_E6.pbo` |
| 10 | confere estrutura e amostras | `verify_e7.py` | 10/10 |
| 11 | instala e mede o RPT | `schtasks` | 12 / 23 / 15 / `PLAYING` |
| 12 | corrige a lanterna | build E7 | 2 IK revertidos |

---

# Passo 0 — baseline e backup

Antes de qualquer coisa: guardar o PBO que funciona e registrar o hash. Sem isso não dá para
provar que uma falha é da build nova.

```bat
copy /Y "Addons\anims.pbo" "ANIMS-WORK-20261117\backup\anims_E3_instalado.pbo"
certutil -hashfile "Addons\anims.pbo" SHA1
```

O original também foi extraído para uma árvore separada (`anims045_orig`), que nunca é
alterada. É dela que saem as comparações de ossos e as reversões.

| Caminho | Papel |
|---|---|
| `anims045_orig\` | extração pristina do PBO 0.45 |
| `anims045\` | árvore de trabalho (recebe os RTMs 1.30) |
| `trimmed_e4\` | RTMs 1.30 já trimados |
| `animsE6_tree\` | staging final, pronto para empacotar |
| `out\` | builds E1–E7 |
| `backup\` | builds que já estiveram em jogo |

---

# Passo 1 — abrir o PBO do 0.45

O extrator usado não foi o BankRev: foi um script próprio que **valida o checksum SHA1 do
PBO** e guarda o manifesto com offsets e tamanhos. Isso importa porque o empacotador depois
reaproveita os offsets originais.

```python
# unpack_pbo.py (trecho)
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

O manifesto gerado tem 2.053 entradas:

| Propriedade | Valor |
|---|---|
| `prefix` | `DZ\anims` |
| `revision` | `17984` |
| `.rtm` | 2.028 |
| `.p3d` | 22 |
| `.bin` | 3 |

Cada entrada guarda `name`, `original`, `offset`, `timestamp`, `size` e `sha256`. É esse
manifesto que permite reempacotar sem inventar ordem nem metadados.

> **Armadilha:** o PBO termina com `\0` + SHA1 de 20 bytes. Se o extrator não conferir esses
> 21 bytes, um PBO truncado passa como válido e o erro só aparece no jogo.

---

# Passo 2 — entender os dois formatos (o antes e o depois)

O mesmo arquivo lógico — a pilha `battery_d.rtm` — em três estados. É a melhor forma de ver
o que o porte faz.

## 2.1 Antes: BMTR do 0.45

```text
offset  bytes                          campo
0       42 4D 54 52                    "BMTR"
4       03 00 00 00                    versão 3 (LZO ligado)
8       01                             reversed = 1
9       00 00 00 00                    stepX = 0.0
13      00 00 00 00                    stepY = 0.0
17      00 00 00 80                    stepZ = -0.0
21      02 00 00 00                    nPhases = 2
25      01 00 00 00                    preloadCount = 1
29      78 00 00 00                    nAnim = 120 ossos
33      78 00 00 00                    nSel = 120 seleções
37      70 65 6C 76 69 73 00 ...      "pelvis\0", "leftupleg\0", ...
```

- Header de **37 bytes**.
- Nomes de osso em texto terminado em zero, uma única vez.
- Cada quadro: 4 bytes de tempo + matrizes de 48 bytes (12 floats), **comprimidas em LZO**.
- Tamanho total da pilha: **4.209 bytes**.

## 2.2 Depois: RTM_0101 cru do 1.30

```text
offset  bytes                          campo
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX = 0.0
12      00 00 00 00                    stepY = 0.0
16      00 00 00 80                    stepZ = -0.0
20      02 00 00 00                    nAnim = 2 quadros
24      9C 00 00 00                    nSel = 156 ossos
28      70 65 6C 76 69 73 00 ...      "pelvis" em 32 bytes fixos
```

- Header de **28 bytes** + **32 bytes por osso** (nome com padding de zeros).
- Cada quadro: 4 bytes de tempo + **80 bytes por osso** (32 de nome + 48 de matriz).
- Sem compressão.
- Tamanho: **29.988 bytes** (156 ossos).

## 2.3 Depois do trim: RTM_0101 com os 120 ossos do 0.45

```text
offset  bytes                          campo
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX
12      00 00 00 00                    stepY
16      00 00 00 80                    stepZ
20      02 00 00 00                    nAnim = 2
24      78 00 00 00                    nSel = 120  <-- era 9C (156)
28      70 65 6C 76 69 73 00 ...      "pelvis"
```

- **23.076 bytes** — 23,0% menor que o cru, e 5,5× maior que o BMTR do 0.45.
- O `nSel` caiu de 156 para 120; os 36 ossos que só existem no rig do 1.30 saíram.
- As matrizes dos 120 ossos restantes são **byte a byte as mesmas** do arquivo cru.

## 2.4 O código do motor que lê cada um

Não houve alteração de código aqui. O motor escolhe o caminho pelo **conteúdo**, não pela
extensão:

```cpp
// rtAnimation.cpp — caminho BMTR (0.45)
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
// rtAnimation.cpp — caminho RTM_0101 (1.30)
in.seekg(RTMMagicLen, QIOS::cur);        // pula "RTM_0101"
in.seekg(sizeof(float)*3, QIOS::cur);    // stepX, stepY, stepZ
int nAnim = in.getil();
int nSel = in.getil();
in.seekg(32*nSel, QIOS::cur);            // nomes de 32 bytes
LoadPhases(in, skelet, nSel, 1, _nPhases);
```

E o detalhe que torna tudo possível: o motor **casa os ossos por nome**, não por índice.

```cpp
// AnimationRTPhase::Load — vale para os dois formatos
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
// osso que não existe no skeleton é simplesmente ignorado
```

É por isso que:

- a **ordem** dos ossos pode ser diferente (e é, em 100% dos pares) sem quebrar nada;
- um arquivo de 156 ossos toca num rig de 120 — os 36 extras são ignorados;
- o trim é seguro desde que **nenhum** osso usado pelo 0.45 seja removido.

---

# Passo 3 — descobrir qual arquivo do 1.30 vira qual slot do 0.45

Este foi o trabalho mais demorado. Os nomes não têm nada a ver:

| 0.45 | 1.30 |
|---|---|
| `CdzpAmovPercMstpSnonWnonDf.rtm` | `p_erc_walkF.rtm` |
| `CdzpAidlPknlMstpSlowWnonDnon.rtm` | `p_cro_idle.rtm` |
| `CdzpAidlPpneMstpSlowWnonDnon.rtm` | `p_pne_idle.rtm` |
| `AidlPercMstpSlowWshlDnon.rtm` | `p_hvy_erc_idle01.rtm` |

## 3.1 O código antes (a tentativa óbvia)

```python
# ANTES — casar pelo nome do arquivo
for alvo in alvos:
    fonte = SRC / alvo.name          # CdzpAmovPerc... != p_erc_walkF
    if fonte.exists():
        copiar(fonte, alvo)
```

Resultado medido nos 360 alvos de locomoção: **0 matches exatos**. Nenhum.

## 3.2 O código depois (gramática do nome)

O nome do 0.45 é uma frase codificada. O parser desmonta:

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

As tabelas de tradução:

```python
stance_map = {'erc': 'erc', 'knl': 'cro', 'pne': 'pne'}
move_map   = {'wlk': 'walk', 'run': 'run', 'spr': 'sprint',
              'stp': 'idle', 'trn': 'turn'}
dir_map    = {'f': 'F', 'b': 'B', 'l': 'L', 'r': 'R',
              'fl': 'FL', 'fr': 'FR', 'bl': 'BL', 'br': 'BR'}

sets = {
    'non': ('moves/unarmed', ['p']),
    'rfl': ('moves/rifles',  ['p_rfl']),
    'shl': ('moves/heavy',   ['p_hvy', 'p_rfl']),  # heavy só tem erc
    'pst': ('moves/pistols', ['p_pst', 'p_rfl']),
    'bow': ('moves/bow',     ['p_bow']),
    'bin': ('moves/unarmed', ['p']),
    'mel': ('moves/1handed', ['p_1hd', 'p_2hd']),
}
```

## 3.3 A cadeia de fallback

Nem todo slot tem um arquivo 1.30 idêntico. O gerador tenta, em ordem:

| Situação | Fallback |
|---|---|
| `sprint` não existe | `run`, depois `walk` |
| pose baixa não existe | pose normal, depois `_ras` |
| `shl` (heavy) agachado/deitado | `rfl` (rifle) — heavy só tem em pé |
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

O primeiro candidato que existe no índice de 7.415 RTMs é o escolhido.

## 3.4 O resultado do mapeamento

| Grupo | Arquivos | Script |
|---|---:|---|
| Locomoção (CSV) | 360 | `build_mapping.py` |
| Movimento | 259 | `map_mov.py` |
| Sinais com arma | 229 | `map_sig.py` |
| Menu | 140 | `map_menu_ik.py` |
| Armas no mundo | 120 | `map_wop.py` |
| IK / consumíveis | 84 | `map_menu_ik.py` |
| Transições de postura | 66 | `map_trans.py` |
| Misc | 70 + 124 + 37 | `map_misc*.py` |
| Últimos ajustes | 34 | `map_last.py` |

O manifesto final ficou com **1.527 registros / 1.526 caminhos únicos** — um caminho aparece
duas vezes porque dois grupos diferentes o reivindicaram. O `set` no script de staging resolve.

---

# Passo 4 — aplicar com validação (o antes e o depois real)

## 4.1 Antes: `apply_full.py`

```python
for r in rows:
    rel = r['target'].replace('/', '\\').lower()
    dst = WORK.joinpath(*parts)
    src = Path(r['source'])
    if not dst.exists(): continue
    if not src.exists(): continue
    shutil.copyfile(src, dst)          # copia qualquer coisa
    replaced.append('/'.join(parts))
```

Esse script não olha o conteúdo. Se a origem estiver truncada, em outro formato ou for um
arquivo errado, ele copia e o erro só aparece no jogo.

## 4.2 Depois: `apply_mapping.py`

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

O que cada checagem pega:

| Checagem | Pega o quê |
|---|---|
| `data[:8] == RTM_0101` | arquivo que não é RTM, download interrompido, HTML de erro |
| `len(data) >= 32` | arquivo vazio ou só com magic |
| `nAnim > 0` | header com contagem zero |
| `0 < nSel <= 200` | contagem absurda (corrupção) |
| tamanho esperado ±40% | header que não fecha com o corpo |

O tamanho esperado é exatamente o que o motor calcula:

```text
28 + 32*nSel + nAnim * (4 + nSel*80)
```

## 4.3 O manifesto

O script mantém o `replaced_files.json`: a lista de tudo que saiu do 0.45 e virou 1.30. É
esse arquivo que o staging consulta para saber o que precisa passar pelo trim.

```python
repfile.write_text(json.dumps(rep, indent=1), encoding='utf-8')
print('copiados', copied, 'ja existentes', skipped, 'ruins', bad)
```

Resultado: **1.526 caminhos únicos** no manifesto, nenhum arquivo corrompido.

---

# Passo 5 — os 4 extras e o step

## 5.1 Extras fora do manifesto

Quatro RTMs do 1.30 não têm slot equivalente no 0.45, mas eram necessários. Eles são
injetados direto no staging:

| Slot no 0.45 | Origem no 1.30 |
|---|---|
| `injl/idl/erc/stp/low/rfl/CdzpInjlAidlPercMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_erc_inj_idle_low.rtm` |
| `injl/idl/knl/stp/low/rfl/CdzpInjlAidlPknlMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_cro_inj_idle_low.rtm` |
| `injl/idl/pne/stp/low/rfl/CdzpInjlAidlPpneMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_pne_inj_idle_low.rtm` |
| `inv/knl/stp/non/non/CdzpAinvPknlMstpSnonWnonDnon_pills.rtm` | `actions/healing/p_cro_eatingpills_loop.rtm` |

## 5.2 O step (root motion)

O campo `step` é o deslocamento do personagem por ciclo. Se ele não bater com o número de
quadros, o personagem **desliza** ou **corre no lugar**.

Medição real nos clipes de rastejar:

| Arquivo | Quadros | step 1.30 | step 0.45 | Razão |
|---|---:|---:|---:|---:|
| `p_pne_walkF.rtm` | 157 | −6,6484 | −2,2161 | **3,00×** |
| `p_cro_walkF.rtm` | 106 | −4,6157 | −4,6157 | 1,00× |

Nos 8 clipes de rastejar o step do 1.30 era exatamente 3× o do slot. O script divide por 3:

```python
x, y, z = struct.unpack_from('<3f', b, 8)
struct.pack_into('<3f', b, 8, x / 3.0, y / 3.0, z / 3.0)
```

Nos clipes de agachar (106 quadros nos dois lados) nada foi dividido — o mapeamento reaplicou
o arquivo com o step original, que já batia. O resultado foi conferido andando em jogo, não
só no papel.

## 5.3 As 12 transições de postura

As transições de postura do 1.30 não têm o mesmo nome, mas têm o mesmo papel. Doze foram
mapeadas à mão:

```python
MAP = [
 ('p_erc_trans_cro_low.rtm', 'mov/erc/stp/low/non/...Perc...Pknl....rtm', 'em pé -> agachado'),
 ('p_cro_trans_erc_low.rtm', 'mov/knl/stp/low/non/...Pknl...Perc....rtm', 'agachado -> em pé'),
 ('p_erc_trans_pne_low.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._A.rtm', 'em pé -> deitado'),
 ('p_erc_transMove_pne.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._B.rtm', 'andando -> deitado'),
 # ... 8 outras
]
```

Como o clipe do 1.30 tem outro número de quadros, a **velocidade** da classe no config foi
reescrita para `30 / quadros`:

```python
new_speed = round(30.0 / e['new_frames'], 4)
# ex.: 46 quadros -> speed=0.6522
```

Sem isso a transição ficava lenta ou rápida demais. As demais transições do 1.30 (512 de
reload, 80 de unjam, 77 de weapon switch, 96 de attack, 270 de hit) **não** têm estado
correspondente no config 0.45 e continuaram as do 0.45.

---

# Passo 6 — o primeiro pacote completo e o teto de 1,1 GB

Com todos os RTMs crus (156 ossos), o PBO passou de 1,3 GB. O jogo não carrega:

| Build | Bytes | Resultado |
|---|---:|---|
| `anims_D1` | 520 MB | bisect de config, carregou |
| `anims_D1_sig` | 634 MB | com sinais armados, carregou |
| **`anims_D2`** | **1.374 MB** | **travou em `Updating base class ->Grid`** |
| `anims_E1` | 1.056,5 MiB | carregou, mas no limite |
| `anims_E2` | 1.030,1 MiB | estável |

Duas regras nasceram aqui:

1. **PBO único.** Dois PBOs com o mesmo prefixo `DZ\anims` não montam juntos; o segundo é
   ignorado. Tudo precisa caber em um arquivo.
2. **Teto prático de ~1,1 GB.** Acima disso o carregamento morre antes do menu.

A solução não foi cortar animação: foi cortar **osso que o 0.45 não usa**.

---

# Passo 7 — trim de ossos (o truque central)

## 7.1 O problema

| Rig | Ossos |
|---|---:|
| 1.30 | **156** |
| 0.45 | **120** |

Cada quadro do RTM_0101 guarda **80 bytes por osso**, mesmo os 36 que o modelo 0.45 não tem.
Em 1.526 arquivos isso vira centenas de MB de dados que o motor vai ler e descartar.

## 7.2 A conta, arquivo por arquivo

Para a pilha `battery_d.rtm`, com 2 quadros:

```text
cru    : 28 + 32*156 + 2*(4 + 156*80) = 29.988 bytes
trimado: 28 + 32*120 + 2*(4 + 120*80) = 23.076 bytes
economia: 6.912 bytes (23,0%)
```

O corte não é "pegar os primeiros 120": é **filtrar por nome**, usando o conjunto de ossos do
BMTR 0.45 correspondente como referência.

## 7.3 O código completo

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
        buf += data[o:o + 4]        # tempo do quadro
        for i in keep:
            p = o + 4 + i * 80
            buf += data[p:p + 80]   # 32 nome + 48 matriz
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

## 7.4 Por que é seguro

A linha mais importante do script é esta:

```python
missing = keep_set - set(low)
if missing:
    raise ValueError('faltando ossos: %s' % sorted(missing)[:5])
```

Ela garante que **todo osso usado pelo BMTR 0.45 existe no RTM 1.30**. Se faltar um, o script
para em vez de gerar um arquivo com buraco. Foi assim que os 140 arquivos de menu foram
detectados: eles não têm nem o mesmo conjunto de ossos, então não passam nessa checagem.

## 7.5 O resultado

| | |
|---|---:|
| Arquivos reduzidos | **1.526** (todos os do manifesto) |
| Antes | **1.425,9 MB** |
| Depois | **1.091,5 MB** |
| Redução | **−23,45%** |
| Erros | **0** |
| Pasta | `trimmed_e4\` (1.527 arquivos: os 1.526 + o preview da E5, depois revertido) |

> Os relatórios da E4 falam **1.523**: foi a primeira passada do trim. A passada final, usada
> da E5 em diante, tem **1.526** — os três arquivos que faltavam entraram em reaplicações
> posteriores e também encolheram. O total de bytes e a redução de 23,45% fecham.

---

# Passo 8 — staging: montar a árvore final

O staging copia 2.053 arquivos, um por entrada do manifesto, escolhendo a origem certa para
cada categoria:

| Categoria | Origem | Motivo |
|---|---|---|
| menu | `anims045_orig` (0.45) | 140 arquivos, +255 MB, só preview |
| preview do inventário | 0.45 após a E5 | pose do 1.30 ficou errada |
| resto do manifesto | `trimmed_e4` (1.30) | 1.526 arquivos |
| 4 extras | acervo 1.30 | não têm slot |

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
        os.link(src, dst)          # hardlink: não duplica 1 GB em disco
    except OSError:
        shutil.copyfile(src, dst)
```

Resultado: **2.053 arquivos**, **~918 MB**, **1.386 trimados**, **140 de menu em 0.45**.

## 8.1 O antes e o depois do preview

A E5 tentou usar o preview do 1.30 no inventário. O arquivo é 18× maior e a pose é de
alongamento, com os braços levantados:

| Build | Formato | Bytes | Resultado |
|---|---|---:|---|
| E5 | `RTM_0101` (`p_menu_unarmed_idleMain01`) | **3.086.752** | braços levantados, reprovado |
| E6 | `BMTR` (0.45) | **171.150** | pose correta |

A reversão foi um `copyfile` do original por cima do arquivo no working tree, seguido de nova
passada de staging. Não foi preciso mexer no script.

## 8.2 O diff do staging (E3 → E6)

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

A E3 ainda mandava o menu inteiro para o 0.45, mas não usava o trim (ele ainda não existia).
A E6 manda o menu para o 0.45 **exceto o preview** e usa o trim em todo o resto.

---

# Passo 9 — empacotar o PBO

## 9.1 O formato do arquivo

O PBO é uma sequência de entradas com nome terminado em zero, seguidas dos dados e de um
SHA1 no fim:

```text
\0 + "Vers" + 0 + 0 + 0 + 0        cabeçalho (21 bytes)
prefix\0DZ\anims\0                 propriedades
revision\017984\0
\0                                 fim das propriedades
config.bin\0 + 5 uint32            entrada (nome + método/original/offset/timestamp/size)
data\anim\...\x.rtm\0 + 5 uint32
\0                                 fim das entradas
<dados concatenados na ordem das entradas>
\0 + SHA1(header + dados)          rodapé (21 bytes)
```

O campo `offset` é o offset **original** do arquivo dentro do PBO antigo; o `timestamp` também
é preservado. Isso mantém o PBO compatível com o que o motor espera e deixa o hash estável.

## 9.2 O código completo

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

O `struct.pack` da entrada usa **os metadados do manifesto**, não valores recalculados. É isso
que faz o PBO novo ser uma edição do antigo, e não um arquivo estranho.

## 9.3 O resultado

| Build | Bytes | MiB | Entradas | RTMs |
|---|---:|---:|---:|---:|
| **E6** | 918.323.340 | 875,8 | 2.053 | 2.028 (1.390 + 638) |
| **E7** | 918.285.584 | 875,7 | 2.053 | 2.028 (1.388 + 640) |

---

# Passo 10 — verificar antes de instalar

O verificador faz três coisas: confere a estrutura de **todos** os RTMs, compara amostras
byte a byte com o staging e mostra os casos especiais.

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

Além disso, 10 arquivos sorteados + os casos especiais (pilha, preview, arremesso) são
comparados por SHA1 com a árvore de staging.

| Verificação | E6 | E7 |
|---|---|---|
| Entradas | 2.053 | 2.053 |
| RTMs válidos | 2.028 | 2.028 |
| `RTM_0101` | 1.390 | 1.388 |
| `BMTR` | 638 | 640 |
| Amostras idênticas | 11/11 | 10/10 |
| RTM inconsistente | 0 | 0 |
| Sobra no fim do PBO | 21 bytes (SHA1) | 21 bytes (SHA1) |

---

# Passo 11 — instalar e testar

O `anims.pbo` fica **travado enquanto o cliente roda**. Instalar sempre com o jogo fechado.

```bat
:: 1. fechar o jogo
taskkill /IM DayZInt.exe /F

:: 2. copiar a build (troque E7 pelo build desejado)
copy /Y "D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo" ^
     "D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\Addons\anims.pbo"

:: 3. conferir
certutil -hashfile "...\Addons\anims.pbo" SHA1

:: 4. subir servidor + cliente (espera 40 s)
schtasks /run /tn "DayZTestLaunch"
```

O RPT é **append**: para medir a sessão, corte o texto no último `Current time:`.

| Linha | Baseline aceitável |
|---|---:|
| `Animation ... not found or empty` | 12 |
| `Bad move` | 23 |
| `Invalid move ... disarm` | 15 |
| `PLAYING` | 1 |

Qualquer número acima disso é regressão da build. O baseline de 12 / 23 / 15 se repete nas 36
sessões anteriores, inclusive antes de qualquer mudança de animação.

---

# Passo 12 — a E7 e o bug da lanterna

A E6 entrou no mundo e não gerou erro novo, mas o teste visual achou um problema: segurando
**lanterna + pilha**, o personagem estica os braços e o item vira uma placa gigante.

O primeiro suspeito são os dois tracks de IK do consumível, que posicionam o item na mão:

| Arquivo | E6 (1.30) | E7 (0.45) |
|---|---:|---:|
| `ik\comsumables\9v_battery.rtm` | 23.076 B | **4.187 B** |
| `ik\comsumables\battery_d.rtm` | 23.076 B | **4.209 B** |

A E7 reverteu só esses dois e reempacotou:

```text
bytes     918.285.584
MiB       875,7
entradas  2.053
RTMs      2.028 (1.388 RTM_0101 + 640 BMTR)
SHA1      A986CA7C65D1820297CA9EF1EAFC7A1599F6166C
amostras  10/10
```

Se o bug continuar, o próximo passo é reverter os **4 estados `batteryLicking`** e refazer o
pacote como E8; depois disso, revisar as transições da ação.

---

# Antes × depois, arquivo por arquivo

| Classe | Antes (0.45) | Depois | Tratamento |
|---|---|---|---|
| Locomoção | BMTR 120 ossos | RTM_0101 120 ossos | trim |
| Armas | BMTR | RTM_0101 | trim |
| Ferimentos | BMTR | RTM_0101 | trim + 4 extras |
| IK / consumíveis | BMTR | RTM_0101 | trim; 2 revertidos na E7 |
| Transições de postura | BMTR curto | RTM_0101 + speed novo | 12 mapeadas à mão |
| Menu | BMTR | **continua BMTR** | 140 fora; preview revertido |
| Zumbi | BMTR | **continua BMTR** | rig incompatível (273) |
| Teste / visema / props | BMTR | **continua BMTR** | 33 sem par no 1.30 |
| Troca de arma, stops, urinar | BMTR | **continua BMTR** | ~192 não existem na 1.30 |

## Números finais

| | |
|---|---:|
| RTMs no PBO 0.45 | 2.028 |
| RTMs no acervo 1.30 | 7.415 |
| Arquivos trocados | 1.526 |
| Em formato 1.30 na E6 | **1.390 (68,5%)** |
| Em BMTR 0.45 na E6 | 638 |
| Trim | 1.425,9 → 1.091,5 MB (−23,45%) |
| Menu excluído | 140 arquivos (+255 MB) |
| Tracks `ik/` trocados | 84 |
| Transições de postura | 12 |
| Build em jogo | E6 · 918.323.340 B |
| Build pronta | E7 · 918.285.584 B |

## As 8 regras que custaram tempo

1. **PBO duplicado não monta** — mesmo prefixo, o segundo é ignorado.
2. **Teto de ~1,1 GB** — acima disso o jogo trava em `Updating base class ->Grid`.
3. **Ordem de ossos não importa** — o motor casa por nome; não reordene RTM.
4. **Trim é por nome, não por índice** — e precisa validar que o conjunto 0.45 é subconjunto.
5. **O step é espacial** — se o clipe muda de duração, o step precisa mudar junto.
6. **RPT é append** — cortar no último `Current time:` antes de contar.
7. **Menu não é gameplay** — pose bonita de menu pode ser inútil no inventário.
8. **Backup antes de tudo** — PBO, árvore e hash; sem isso não se prova regressão.

## Comandos do dia a dia

```bat
:: extrair
python unpack_pbo.py Addons\anims.pbo ANIMS-WORK-20261117\anims045_orig

:: mapear e aplicar
python build_mapping.py
python apply_mapping.py mapping_locomocao.json

:: trimar
python trim_rtm.py            :: dry-run
python trim_rtm.py --apply    :: grava em trimmed_e4

:: montar e empacotar
python stage_e6.py
python pack_pbo.py animsE6_tree out\anims_E6.pbo

:: verificar
python verify_e7.py
```

> O detalhe de cada build (E1–E7), os hashes e o RPT estão nas abas **Builds E1–E7** e
> **Animações 1.30** de **Atualizações**.
