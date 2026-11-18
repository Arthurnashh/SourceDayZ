# Step-by-step of the animation port

This page is the technical diary of the port: **what was done, in what order, with which script and what
changed in each file**. The goal is that anyone can repeat the process from
scratch — and understand why each decision was made.

The work was done between 17 and 18/11/2026, on client **0.45.124252**, using the **DayZ 1.30**
collection at `D:\RetailPlayer-OFP2-Y0` (7,415 RTMs).

## What "porting an animation" means

`anims.pbo` holds two different things:

| Part | What it is | Was it swapped? |
|---|---|---|
| `config/sdr2/config.bin` | CfgMoves: states, transitions, rules, speeds | **no** — the 1.30 config has states the 0.45 does not know |
| `data/anim/sdr/**/*.rtm` | the animation frames (bones, matrices, times) | **yes** — 1,526 files |

So the port is **of data**, not of engine code. The 0.45 executable was not changed
to read the new animations; it already knew how to read both formats.

## The whole pipeline

```text
DayZ 1.30 (7,415 RTMs)                     DayZ 0.45 (anims.pbo)
        |                                          |
        |  1. index by name                        |  2. extract + manifest
        v                                          v
  mapping_*.json  ------ 3. apply ------->  anims045/  (1,526 swapped)
        |                                          |
        |  4. extras + step                        |
        v                                          v
  trimmed_e4/  (1,526 trimmed)  -- 5. staging -->  animsE6_tree/
                                                       |
                                              6. pack_pbo.py
                                                       v
                                                anims_E6.pbo
                                                       |
                                              7. verify + install + RPT
```

| Step | What it does | Tool | Result |
|---|---|---|---|
| 0 | freezes the original and measures | `certutil`, `Get-FileHash` | known baseline |
| 1 | opens the PBO and saves the manifest | `unpack_pbo.py` | 2,053 entries |
| 2 | reads both RTM formats | binary reading | 156 × 120 bones |
| 3 | finds the 1.30 name of each slot | `build_mapping.py` | 360 locomotion |
| 4 | copies with header validation | `apply_mapping.py` | 1,526 paths |
| 5 | adds 4 extras and fixes the step | `add_extra.py` | 24 clips |
| 6 | tries the full package | `pack_pbo.py` | fails at the 1.1 GB ceiling |
| 7 | removes bones the 0.45 does not use | `trim_rtm.py` | −23.45% |
| 8 | assembles the final tree | `stage_e6.py` | 2,053 files |
| 9 | packs with SHA1 | `pack_pbo.py` | `anims_E6.pbo` |
| 10 | checks structure and samples | `verify_e7.py` | 10/10 |
| 11 | installs and measures the RPT | `schtasks` | 12 / 23 / 15 / `PLAYING` |
| 12 | fixes the flashlight | build E7 | 2 IKs reverted |

---

# Step 0 — baseline and backup

Before anything: keep the working PBO and record the hash. Without that you cannot
prove a failure comes from the new build.

```bat
copy /Y "Addons\anims.pbo" "ANIMS-WORK-20261117\backup\anims_E3_instalado.pbo"
certutil -hashfile "Addons\anims.pbo" SHA1
```

The original was also extracted to a separate tree (`anims045_orig`), which is never
changed. Bone comparisons and reversions come from it.

| Path | Role |
|---|---|
| `anims045_orig\` | pristine extraction of the 0.45 PBO |
| `anims045\` | working tree (receives the 1.30 RTMs) |
| `trimmed_e4\` | 1.30 RTMs already trimmed |
| `animsE6_tree\` | final staging, ready to pack |
| `out\` | builds E1–E7 |
| `backup\` | builds that have been in game |

---

# Step 1 — open the 0.45 PBO

The extractor used was not BankRev: it was a custom script that **validates the PBO SHA1
checksum** and saves the manifest with offsets and sizes. That matters because the packer later
reuses the original offsets.

```python
# unpack_pbo.py (excerpt)
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

The generated manifest has 2,053 entries:

| Property | Value |
|---|---|
| `prefix` | `DZ\anims` |
| `revision` | `17984` |
| `.rtm` | 2,028 |
| `.p3d` | 22 |
| `.bin` | 3 |

Each entry stores `name`, `original`, `offset`, `timestamp`, `size` and `sha256`. This
manifest is what allows repacking without inventing order or metadata.

> **Trap:** the PBO ends with `\0` + a 20-byte SHA1. If the extractor does not check those
> 21 bytes, a truncated PBO passes as valid and the error only shows up in game.

---

# Step 2 — understanding the two formats (before and after)

The same logical file — the `battery_d.rtm` stack — in three states. It is the best way to see
what the port does.

## 2.1 Before: 0.45 BMTR

```text
offset  bytes                          field
0       42 4D 54 52                    "BMTR"
4       03 00 00 00                    version 3 (LZO enabled)
8       01                             reversed = 1
9       00 00 00 00                    stepX = 0.0
13      00 00 00 00                    stepY = 0.0
17      00 00 00 80                    stepZ = -0.0
21      02 00 00 00                    nPhases = 2
25      01 00 00 00                    preloadCount = 1
29      78 00 00 00                    nAnim = 120 bones
33      78 00 00 00                    nSel = 120 selections
37      70 65 6C 76 69 73 00 ...      "pelvis\0", "leftupleg\0", ...
```

- **37-byte** header.
- Bone names as zero-terminated text, a single time.
- Each frame: 4 bytes of time + 48-byte matrices (12 floats), **compressed with LZO**.
- Total stack size: **4,209 bytes**.

## 2.2 After: raw 1.30 RTM_0101

```text
offset  bytes                          field
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX = 0.0
12      00 00 00 00                    stepY = 0.0
16      00 00 00 80                    stepZ = -0.0
20      02 00 00 00                    nAnim = 2 frames
24      9C 00 00 00                    nSel = 156 bones
28      70 65 6C 76 69 73 00 ...      "pelvis" in 32 fixed bytes
```

- **28-byte** header + **32 bytes per bone** (zero-padded name).
- Each frame: 4 bytes of time + **80 bytes per bone** (32 name + 48 matrix).
- No compression.
- Size: **29,988 bytes** (156 bones).

## 2.3 After the trim: RTM_0101 with the 0.45's 120 bones

```text
offset  bytes                          field
0       52 54 4D 5F 30 31 30 31        "RTM_0101"
8       00 00 00 00                    stepX
12      00 00 00 00                    stepY
16      00 00 00 80                    stepZ
20      02 00 00 00                    nAnim = 2
24      78 00 00 00                    nSel = 120  <-- was 9C (156)
28      70 65 6C 76 69 73 00 ...      "pelvis"
```

- **23,076 bytes** — 23.0% smaller than raw, and 5.5× larger than the 0.45 BMTR.
- `nSel` dropped from 156 to 120; the 36 bones that only exist in the 1.30 rig were removed.
- The matrices of the remaining 120 bones are **byte-for-byte the same** as the raw file.

## 2.4 The engine code that reads each one

There was no code change here. The engine picks the path by **content**, not by
extension:

```cpp
// rtAnimation.cpp — BMTR path (0.45)
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
// rtAnimation.cpp — RTM_0101 path (1.30)
in.seekg(RTMMagicLen, QIOS::cur);        // skips "RTM_0101"
in.seekg(sizeof(float)*3, QIOS::cur);    // stepX, stepY, stepZ
int nAnim = in.getil();
int nSel = in.getil();
in.seekg(32*nSel, QIOS::cur);            // 32-byte names
LoadPhases(in, skelet, nSel, 1, _nPhases);
```

And the detail that makes everything possible: the engine **matches bones by name**, not by index.

```cpp
// AnimationRTPhase::Load — valid for both formats
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
// a bone that does not exist in the skeleton is simply ignored
```

That is why:

- the **order** of bones can differ (and it does, in 100% of the pairs) without breaking anything;
- a 156-bone file plays on a 120-bone rig — the 36 extras are ignored;
- the trim is safe as long as **no** bone used by the 0.45 is removed.

---

# Step 3 — finding which 1.30 file becomes which 0.45 slot

This was the longest work. The names have nothing to do with each other:

| 0.45 | 1.30 |
|---|---|
| `CdzpAmovPercMstpSnonWnonDf.rtm` | `p_erc_walkF.rtm` |
| `CdzpAidlPknlMstpSlowWnonDnon.rtm` | `p_cro_idle.rtm` |
| `CdzpAidlPpneMstpSlowWnonDnon.rtm` | `p_pne_idle.rtm` |
| `AidlPercMstpSlowWshlDnon.rtm` | `p_hvy_erc_idle01.rtm` |

## 3.1 The code before (the obvious attempt)

```python
# BEFORE — match by file name
for target in targets:
    source = SRC / target.name          # CdzpAmovPerc... != p_erc_walkF
    if source.exists():
        copy(source, target)
```

Result measured across the 360 locomotion targets: **0 exact matches**. None.

## 3.2 The code after (name grammar)

The 0.45 name is an encoded sentence. The parser takes it apart:

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

The translation tables:

```python
stance_map = {'erc': 'erc', 'knl': 'cro', 'pne': 'pne'}
move_map   = {'wlk': 'walk', 'run': 'run', 'spr': 'sprint',
              'stp': 'idle', 'trn': 'turn'}
dir_map    = {'f': 'F', 'b': 'B', 'l': 'L', 'r': 'R',
              'fl': 'FL', 'fr': 'FR', 'bl': 'BL', 'br': 'BR'}

sets = {
    'non': ('moves/unarmed', ['p']),
    'rfl': ('moves/rifles',  ['p_rfl']),
    'shl': ('moves/heavy',   ['p_hvy', 'p_rfl']),  # heavy only has erc
    'pst': ('moves/pistols', ['p_pst', 'p_rfl']),
    'bow': ('moves/bow',     ['p_bow']),
    'bin': ('moves/unarmed', ['p']),
    'mel': ('moves/1handed', ['p_1hd', 'p_2hd']),
}
```

## 3.3 The fallback chain

Not every slot has an identical 1.30 file. The generator tries, in order:

| Situation | Fallback |
|---|---|
| `sprint` does not exist | `run`, then `walk` |
| low pose does not exist | normal pose, then `_ras` |
| `shl` (heavy) crouched/lying | `rfl` (rifle) — heavy only exists standing |
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

The first candidate that exists in the index of 7,415 RTMs is chosen.

## 3.4 The mapping result

| Group | Files | Script |
|---|---:|---|
| Locomotion (CSV) | 360 | `build_mapping.py` |
| Movement | 259 | `map_mov.py` |
| Weapon signals | 229 | `map_sig.py` |
| Menu | 140 | `map_menu_ik.py` |
| Weapons in the world | 120 | `map_wop.py` |
| IK / consumables | 84 | `map_menu_ik.py` |
| Posture transitions | 66 | `map_trans.py` |
| Misc | 70 + 124 + 37 | `map_misc*.py` |
| Final adjustments | 34 | `map_last.py` |

The final manifest ended with **1,527 records / 1,526 unique paths** — one path appears
twice because two different groups claimed it. The `set` in the staging script resolves it.

---

# Step 4 — applying with validation (the real before and after)

## 4.1 Before: `apply_full.py`

```python
for r in rows:
    rel = r['target'].replace('/', '\\').lower()
    dst = WORK.joinpath(*parts)
    src = Path(r['source'])
    if not dst.exists(): continue
    if not src.exists(): continue
    shutil.copyfile(src, dst)          # copies anything
    replaced.append('/'.join(parts))
```

This script does not look at content. If the source is truncated, in another format or is the wrong
file, it copies and the error only shows up in game.

## 4.2 After: `apply_mapping.py`

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

What each check catches:

| Check | Catches |
|---|---|
| `data[:8] == RTM_0101` | file that is not an RTM, interrupted download, error HTML |
| `len(data) >= 32` | empty file or only the magic |
| `nAnim > 0` | header with zero count |
| `0 < nSel <= 200` | absurd count (corruption) |
| expected size ±40% | header that does not match the body |

The expected size is exactly what the engine computes:

```text
28 + 32*nSel + nAnim * (4 + nSel*80)
```

## 4.3 The manifest

The script keeps `replaced_files.json`: the list of everything that left the 0.45 and became
1.30. It is this file that staging consults to know what must go through the trim.

```python
repfile.write_text(json.dumps(rep, indent=1), encoding='utf-8')
print('copiados', copied, 'ja existentes', skipped, 'ruins', bad)
```

Result: **1,526 unique paths** in the manifest, no corrupted files.

---

# Step 5 — the 4 extras and the step

## 5.1 Extras outside the manifest

Four 1.30 RTMs have no equivalent slot in the 0.45, but were needed. They are
injected directly into staging:

| 0.45 slot | 1.30 source |
|---|---|
| `injl/idl/erc/stp/low/rfl/CdzpInjlAidlPercMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_erc_inj_idle_low.rtm` |
| `injl/idl/knl/stp/low/rfl/CdzpInjlAidlPknlMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_cro_inj_idle_low.rtm` |
| `injl/idl/pne/stp/low/rfl/CdzpInjlAidlPpneMstpSlowWrflDnon_breath.rtm` | `moves/rifles/injured/p_rfl_pne_inj_idle_low.rtm` |
| `inv/knl/stp/non/non/CdzpAinvPknlMstpSnonWnonDnon_pills.rtm` | `actions/healing/p_cro_eatingpills_loop.rtm` |

## 5.2 The step (root motion)

The `step` field is the character's displacement per cycle. If it does not match the number of
frames, the character **slides** or **runs in place**.

Real measurement on the crawling clips:

| File | Frames | step 1.30 | step 0.45 | Ratio |
|---|---:|---:|---:|---:|
| `p_pne_walkF.rtm` | 157 | −6.6484 | −2.2161 | **3.00×** |
| `p_cro_walkF.rtm` | 106 | −4.6157 | −4.6157 | 1.00× |

In the 8 crawling clips the 1.30 step was exactly 3× the slot's. The script divides by 3:

```python
x, y, z = struct.unpack_from('<3f', b, 8)
struct.pack_into('<3f', b, 8, x / 3.0, y / 3.0, z / 3.0)
```

In the crouch clips (106 frames on both sides) nothing was divided — the mapping reapplied the
file with the original step, which already matched. The result was checked by walking in game, not
only on paper.

## 5.3 The 12 posture transitions

The 1.30 posture transitions do not have the same name, but they play the same role. Twelve were
mapped by hand:

```python
MAP = [
 ('p_erc_trans_cro_low.rtm', 'mov/erc/stp/low/non/...Perc...Pknl....rtm', 'standing -> crouched'),
 ('p_cro_trans_erc_low.rtm', 'mov/knl/stp/low/non/...Pknl...Perc....rtm', 'crouched -> standing'),
 ('p_erc_trans_pne_low.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._A.rtm', 'standing -> lying'),
 ('p_erc_transMove_pne.rtm', 'mov/erc/stp/low/non/...Perc...Ppne..._B.rtm', 'walking -> lying'),
 # ... 8 others
]
```

Since the 1.30 clip has a different number of frames, the class **speed** in the config was
rewritten to `30 / frames`:

```python
new_speed = round(30.0 / e['new_frames'], 4)
# e.g. 46 frames -> speed=0.6522
```

Without that the transition was too slow or too fast. The other 1.30 transitions (512 reload,
80 unjam, 77 weapon switch, 96 attack, 270 hit) **do not** have a corresponding state in the
0.45 config and remained the 0.45 ones.

---

# Step 6 — the first full package and the 1.1 GB ceiling

With all raw RTMs (156 bones), the PBO went past 1.3 GB. The game does not load:

| Build | Bytes | Result |
|---|---:|---|
| `anims_D1` | 520 MB | config bisect, loaded |
| `anims_D1_sig` | 634 MB | with armed signals, loaded |
| **`anims_D2`** | **1,374 MB** | **stuck at `Updating base class ->Grid`** |
| `anims_E1` | 1,056.5 MiB | loaded, but at the limit |
| `anims_E2` | 1,030.1 MiB | stable |

Two rules were born here:

1. **Single PBO.** Two PBOs with the same `DZ\anims` prefix do not mount together; the second is
   ignored. Everything must fit in one file.
2. **Practical ceiling of ~1.1 GB.** Above that loading dies before the menu.

The solution was not to cut animation: it was to cut **bones the 0.45 does not use**.

---

# Step 7 — bone trim (the central trick)

## 7.1 The problem

| Rig | Bones |
|---|---:|
| 1.30 | **156** |
| 0.45 | **120** |

Each RTM_0101 frame stores **80 bytes per bone**, even the 36 the 0.45 model does not have.
Across 1,526 files that becomes hundreds of MB of data the engine will read and discard.

## 7.2 The math, file by file

For the `battery_d.rtm` stack, with 2 frames:

```text
raw   : 28 + 32*156 + 2*(4 + 156*80) = 29,988 bytes
trimmed: 28 + 32*120 + 2*(4 + 120*80) = 23,076 bytes
saving: 6,912 bytes (23.0%)
```

The cut is not "take the first 120": it is **filtering by name**, using the bone set of the
corresponding 0.45 BMTR as reference.

## 7.3 The full code

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
        buf += data[o:o + 4]        # frame time
        for i in keep:
            p = o + 4 + i * 80
            buf += data[p:p + 80]   # 32 name + 48 matrix
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

## 7.4 Why it is safe

The most important line of the script is this one:

```python
missing = keep_set - set(low)
if missing:
    raise ValueError('faltando ossos: %s' % sorted(missing)[:5])
```

It guarantees that **every bone used by the 0.45 BMTR exists in the 1.30 RTM**. If one is missing, the script
stops instead of generating a file with a hole. That is how the 140 menu files were
detected: they do not even have the same bone set, so they fail this check.

## 7.5 The result

| | |
|---|---:|
| Files reduced | **1,526** (all in the manifest) |
| Before | **1,425.9 MB** |
| After | **1,091.5 MB** |
| Reduction | **−23.45%** |
| Errors | **0** |
| Folder | `trimmed_e4\` (1,527 files: the 1,526 + the E5 preview, later reverted) |

> The E4 reports say **1,523**: that was the first trim pass. The final pass, used
> from E5 onward, has **1,526** — the three missing files entered in later
> reapplications and also shrank. The total bytes and the 23.45% reduction add up.

---

# Step 8 — staging: assembling the final tree

Staging copies 2,053 files, one per manifest entry, choosing the right source for
each category:

| Category | Source | Reason |
|---|---|---|
| menu | `anims045_orig` (0.45) | 140 files, +255 MB, preview only |
| inventory preview | 0.45 after E5 | the 1.30 pose was wrong |
| rest of the manifest | `trimmed_e4` (1.30) | 1,526 files |
| 4 extras | 1.30 collection | they have no slot |

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
        os.link(src, dst)          # hardlink: does not duplicate 1 GB on disk
    except OSError:
        shutil.copyfile(src, dst)
```

Result: **2,053 files**, **~918 MB**, **1,386 trimmed**, **140 menu in 0.45**.

## 8.1 The preview before and after

E5 tried to use the 1.30 preview in the inventory. The file is 18× larger and the pose is
stretching, with raised arms:

| Build | Format | Bytes | Result |
|---|---|---:|---|
| E5 | `RTM_0101` (`p_menu_unarmed_idleMain01`) | **3,086,752** | raised arms, rejected |
| E6 | `BMTR` (0.45) | **171,150** | correct pose |

The reversion was a `copyfile` of the original over the file in the working tree, followed by a new
staging pass. No script change was needed.

## 8.2 The staging diff (E3 → E6)

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

E3 still sent the whole menu to the 0.45, but did not use the trim (it did not exist yet).
E6 sends the menu to the 0.45 **except the preview** and uses the trim for everything else.

---

# Step 9 — packing the PBO

## 9.1 The file format

The PBO is a sequence of entries with zero-terminated names, followed by the data and a
SHA1 at the end:

```text
\0 + "Vers" + 0 + 0 + 0 + 0        header (21 bytes)
prefix\0DZ\anims\0                 properties
revision\017984\0
\0                                 end of properties
config.bin\0 + 5 uint32            entry (name + method/original/offset/timestamp/size)
data\anim\...\x.rtm\0 + 5 uint32
\0                                 end of entries
<data concatenated in entry order>
\0 + SHA1(header + data)           footer (21 bytes)
```

The `offset` field is the file's **original** offset inside the old PBO; the `timestamp` is also
preserved. This keeps the PBO compatible with what the engine expects and keeps the hash stable.

## 9.2 The full code

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

The entry's `struct.pack` uses **the manifest metadata**, not recalculated values. That is what
makes the new PBO an edit of the old one, and not a strange file.

## 9.3 The result

| Build | Bytes | MiB | Entries | RTMs |
|---|---:|---:|---:|---:|
| **E6** | 918,323,340 | 875.8 | 2,053 | 2,028 (1,390 + 638) |
| **E7** | 918,285,584 | 875.7 | 2,053 | 2,028 (1,388 + 640) |

---

# Step 10 — verifying before installing

The verifier does three things: checks the structure of **all** RTMs, compares samples
byte by byte with staging and shows the special cases.

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

In addition, 10 random files + the special cases (battery, preview, throw) are
compared by SHA1 with the staging tree.

| Check | E6 | E7 |
|---|---|---|
| Entries | 2,053 | 2,053 |
| Valid RTMs | 2,028 | 2,028 |
| `RTM_0101` | 1,390 | 1,388 |
| `BMTR` | 638 | 640 |
| Identical samples | 11/11 | 10/10 |
| Inconsistent RTM | 0 | 0 |
| Remainder at the end of the PBO | 21 bytes (SHA1) | 21 bytes (SHA1) |

---

# Step 11 — installing and testing

`anims.pbo` is **locked while the client runs**. Always install with the game closed.

```bat
:: 1. close the game
taskkill /IM DayZInt.exe /F

:: 2. copy the build (replace E7 with the desired build)
copy /Y "D:\SOURCEDAYZS!!\ANIMS-WORK-20261117\out\anims_E7.pbo" ^
     "D:\SOURCEDAYZS!!\SOURCE DEFINITIVA\DayZ-0.45.124252\build\inventory-menu-v10\package-v38-pause-menu\Addons\anims.pbo"

:: 3. check
certutil -hashfile "...\Addons\anims.pbo" SHA1

:: 4. start server + client (waits 40 s)
schtasks /run /tn "DayZTestLaunch"
```

The RPT is **append**: to measure the session, cut the text at the last `Current time:`.

| Line | Acceptable baseline |
|---|---:|
| `Animation ... not found or empty` | 12 |
| `Bad move` | 23 |
| `Invalid move ... disarm` | 15 |
| `PLAYING` | 1 |

Any number above that is a regression of the build. The 12 / 23 / 15 baseline repeats across the 36
previous sessions, including before any animation change.

---

# Step 12 — E7 and the flashlight bug

E6 entered the world and generated no new error, but the visual test found a problem: holding
**flashlight + battery**, the character stretches his arms and the item becomes a giant plate.

The first suspect is the two consumable IK tracks, which position the item in the hand:

| File | E6 (1.30) | E7 (0.45) |
|---|---:|---:|
| `ik\comsumables\9v_battery.rtm` | 23,076 B | **4,187 B** |
| `ik\comsumables\battery_d.rtm` | 23,076 B | **4,209 B** |

E7 reverted only those two and repacked:

```text
bytes     918,285,584
MiB       875.7
entradas  2,053
RTMs      2,028 (1,388 RTM_0101 + 640 BMTR)
SHA1      A986CA7C65D1820297CA9EF1EAFC7A1599F6166C
amostras  10/10
```

If the bug continues, the next step is to revert the **4 `batteryLicking` states** and repack as
E8; after that, review the action transitions.

---

# Before × after, file by file

| Class | Before (0.45) | After | Treatment |
|---|---|---|---|
| Locomotion | BMTR 120 bones | RTM_0101 120 bones | trim |
| Weapons | BMTR | RTM_0101 | trim |
| Injuries | BMTR | RTM_0101 | trim + 4 extras |
| IK / consumables | BMTR | RTM_0101 | trim; 2 reverted in E7 |
| Posture transitions | short BMTR | RTM_0101 + new speed | 12 mapped by hand |
| Menu | BMTR | **stays BMTR** | 140 out; preview reverted |
| Zombie | BMTR | **stays BMTR** | incompatible rig (273) |
| Test / visema / props | BMTR | **stays BMTR** | 33 with no 1.30 pair |
| Weapon swap, stops, urinate | BMTR | **stays BMTR** | ~192 do not exist in 1.30 |

## Final numbers

| | |
|---|---:|
| RTMs in the 0.45 PBO | 2,028 |
| RTMs in the 1.30 collection | 7,415 |
| Files swapped | 1,526 |
| In 1.30 format in E6 | **1,390 (68.5%)** |
| In 0.45 BMTR in E6 | 638 |
| Trim | 1,425.9 → 1,091.5 MB (−23.45%) |
| Menu excluded | 140 files (+255 MB) |
| `ik/` tracks swapped | 84 |
| Posture transitions | 12 |
| Build in game | E6 · 918,323,340 B |
| Ready build | E7 · 918,285,584 B |

## The 8 rules that cost time

1. **Duplicate PBO does not mount** — same prefix, the second is ignored.
2. **~1.1 GB ceiling** — above that the game hangs at `Updating base class ->Grid`.
3. **Bone order does not matter** — the engine matches by name; do not reorder RTMs.
4. **Trim is by name, not by index** — and it must validate that the 0.45 set is a subset.
5. **The step is spatial** — if the clip changes duration, the step must change with it.
6. **RPT is append** — cut at the last `Current time:` before counting.
7. **Menu is not gameplay** — a pretty menu pose can be useless in the inventory.
8. **Backup before everything** — PBO, tree and hash; without that you cannot prove regression.

## Day-to-day commands

```bat
:: extract
python unpack_pbo.py Addons\anims.pbo ANIMS-WORK-20261117\anims045_orig

:: map and apply
python build_mapping.py
python apply_mapping.py mapping_locomocao.json

:: trim
python trim_rtm.py            :: dry-run
python trim_rtm.py --apply    :: writes to trimmed_e4

:: assemble and pack
python stage_e6.py
python pack_pbo.py animsE6_tree out\anims_E6.pbo

:: verify
python verify_e7.py
```

> The detail of each build (E1–E7), the hashes and the RPT are in the **Builds E1–E7** and
> **Animations 1.30** tabs of **Updates**.
