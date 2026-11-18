# Enforce Script (Enfusion) — 0.45 version reference

> Source of truth: the compiler itself, `Enfusion/src/script/enf_scriptcompiler.cpp`
> (124 KB), plus the VM (`enf_scriptvm.cpp`) and the thread (`enf_scriptthread.cpp`).
> BI's official wiki was not used: it returns HTTP 403 for automated access (verified).

## 1. What it is

Enforce is Enfusion's modern scripting language, used by `Enfusion/src/script/`.
Syntax similar to C#/Java, but with its own semantics: fixed value types, classes
declared with `class`, native methods exposed by the engine via `proto native`, and
execution in **cooperative single-threaded coroutines**.

## 2. Keywords — literal table from the compiler

`enf_scriptcompiler.cpp:5468-5489`:

```cpp
#define ADD_CMD(s, c) m_Keywords.Insert(s, c)
ADD_CMD("if", CMD_IF);          ADD_CMD("else", CMD_ELSE);
ADD_CMD("break", CMD_BREAK);    ADD_CMD("continue", CMD_CONTINUE);
ADD_CMD("class", CMD_CLASS);    ADD_CMD("while", CMD_WHILE);
ADD_CMD("for", CMD_FOR);        ADD_CMD("return", CMD_RETURN);
ADD_CMD("switch", CMD_SWITCH);  ADD_CMD("case", CMD_CASE);
ADD_CMD("default", CMD_DEFAULT);ADD_CMD("delete", CMD_DELETE);
ADD_CMD("proto", CMD_PROTO);    ADD_CMD("goto", CMD_GOTO);
ADD_CMD("debug", CMD_DEBUG);    ADD_CMD("typedef", CMD_TYPEDEF);
ADD_CMD("clamp", CMD_CLAMP);    ADD_CMD("cache", CMD_CACHE);
ADD_CMD("Wait", CMD_WAIT);      ADD_CMD("Sleep", CMD_SLEEP);
```

Observations that only appear when reading the code:

- `class` is the type declaration; **there is no `struct`** as a script type.
- `proto` declares a native prototype — that is how C++ exposes functions to the language.
- `typedef` allows type aliases.
- `clamp` is a **keyword**, not a library function: it generates its own instruction.
- `cache` is an expression-optimization keyword (the compiler keeps the result).
- `Wait` and `Sleep` are keywords: **thread suspension** instructions, not ordinary
  calls. Confirmed in the bytecode: `enf_scriptthread.cpp:232` handles `OP_WAIT`.
- `goto` exists (compatibility with the 2001 language).
- `delete` destroys a class instance.

## 3. Declaration modifiers

Read in the member parser, `enf_scriptcompiler.cpp:1201-1283`:

| Modifier | Line | Effect |
|---|---:|---|
| `private` | 1201 | visibility restricted to the class |
| `native` | 1209 | method implemented in C++ (no body in script) |
| `owned` | 1226 | reference ownership |
| `static` | 1258 | class member, not instance |
| `const` | 1267 | immutable |
| `protected` | 1283 | visible to the hierarchy |
| `out` | 1234 | output parameter |
| `inout` | 1242 | input and output parameter |

### Note: this snapshot is 2013 Enforce

`modded` and `override`, described in current DayZ documentation, **do not exist as tokens
in this 0.45**:

- `grep -c "modded"` across all of `Enfusion/` = **0**.
- `"override"` appears 2× in `Enfusion/src/script/*.cpp`, never in `ADD_CMD`.

Consequence: any modern modding tutorial with `modded void Foo()` **fails to
compile** here. See `1.md` §5.6.

## 4. Operators — dispatch by type

`enf_scriptcompiler.cpp:5419-5462`. The compiler resolves the operator **by the operand type**:

| Operator | Type | Opcode |
|---|---|---|
| `*` | int | `OP_MULI` |
| `*` | float | `OP_MULF` |
| `*` | vector | `OP_CROSSV` (**cross product**) |
| `/` | int / float | `OP_DIVI` / `OP_DIVF` |
| `+` | int / float / vector / string | `OP_ADDI` / `OP_ADDF` / `OP_ADDV` / `OP_ADDS` |
| `-` | int / float / vector | `OP_SUBI` / `OP_SUBF` / `OP_SUBV` |
| `%` | int | `OP_MODI` (integer only) |
| `^` | int | `OP_EORI` (**bitwise XOR**, not power) |
| `<<` `>>` | int | `OP_LSLI` / `OP_ASRI` (arithmetic shift) |
| `\|` `&` | int | `OP_ORI` / `OP_ANDI` |
| `==` | any | `OP_BNE` |
| `>` `<` `>=` `<=` `!=` | any | `OP_BLE` `OP_BGE` `OP_BGT` `OP_BLT` `OP_BEQ` |

Three real traps:

1. **`^` is XOR, not power.** `2^10` equals `8`. For power use `Math.Pow(2,10)`.
2. **`*` between vectors is a cross product** (`OP_CROSSV`). For a scalar, `vector * float`
   promotes to `MULF` — a promotion that lives in the type checker (`[hypothesis]`, pending P-01).
3. **`%` only exists for int.** `5.5 % 2` does not compile; use `Math.Mod`.

The comparators look inverted (`==` → `BNE`): it is *branch-on-false* codegen — the
compiler emits "jump if false", saving one jump per `if`.

## 5. VM value types

`Enfusion/include/script/enf_scriptvariable.h:36-56`:

```cpp
enum VType {
  VARTYPE_NONE = 0, VARTYPE_BOOL, VARTYPE_INT, VARTYPE_FLOAT,
  VARTYPE_VECTOR,      // float[3]
  VARTYPE_STRING,      // char[]
  VARTYPE_CLASS,       // script class instance
  VARTYPE_VOID,
  VARTYPE_FUNCPTR,     // {Variable* classptr, uint index}
  VARTYPE_CLASSREF,
  VARTYPE_ARRAY,
  VARTYPE_USER0..USER7  // native types registered by the engine
};
```

Variable flags (`VariableSpec`, lines 59+): `VSPEC_CONST`, `VSPEC_GLOBAL`,
`VSPEC_PTR`, `VSPEC_PROTECT`, `VSPEC_LOCAL`, `VSPEC_PRIVATE`, `VSPEC_DEFAULT`,
`VSPEC_CLASSMEMBER`, `VSPEC_STATIC`.

Native types are registered by the engine in `enf_scriptapi.cpp:3602-3603`:

```cpp
g_vtVObjectType = AddType("vobject", VARTYPE_VOBJECT, sizeof(void*));
g_vtSoundType   = AddType("hsound",  VARTYPE_HSOUND,  sizeof(int));
```

`VARTYPE_LAYER`, `VARTYPE_VOBJECT` and `VARTYPE_HSOUND` are macros over `USER0/USER1/USER2`
(`Enfusion/include/script/enf_scriptapi.h:25-27`). That is how `Layer`, `vobject` and `hsound`
exist in script without being primitive VM types.

## 6. Execution: threads, `Wait` and `Sleep`

`enf_scriptvm.cpp:865` — `ScriptContext::Run(ScriptThread*, VMStack*, int)` is the
interpreter: a `while(true)` loop over `stack->m_psStat` (904-923), with the
`m_Stats.m_iExecuted` counter.

Each script runs in a `ScriptThread` with state (`TF_RUNNING`, `TF_WCOND`, `TF_WTIME`,
`TF_KILL`) — `enf_scriptthread.cpp:540-607`. `Wait`/`Sleep` put the thread on the
sleeping list (`:509`, `:518`, `:577`); the scheduler reactivates it.

**Conclusion:** Enforce is a **cooperative single-threaded coroutine**, not an OS thread.
A `while(true)` without `Sleep` locks the entire server. `[verified by code]`

## 7. Classes and methods

```cpp
class MinhaClasse
{
    protected int m_Valor;

    void MinhaClasse()
    {
        m_Valor = 0;
    }

    void SetValor(int v)
    {
        m_Valor = v;
    }

    int GetValor()
    {
        return m_Valor;
    }
};

void Usar()
{
    MinhaClasse c = new MinhaClasse();
    c.SetValor(10);
    Print(c.GetValor());
    delete c;
}
```

- The constructor has the class name and **no** return type.
- `new` creates an instance; `delete` destroys it (`CMD_DELETE` keyword).
- Inheritance: `class Filho extends Pai`.
- Native method: `proto native void Foo();` — declared in script, implemented in C++.

## 8. Collections

The compiler has no array literal in the keyword table: arrays are native objects
(`VARTYPE_ARRAY`) created by the API. `array<>`, `map<>` and `set<>` are native classes
registered in `enf_scriptapi.cpp` via `AddType`/`AddClass`. `[pending P-02]` list
all exposed native methods.

```cpp
array<int> nums = new array<int>();
nums.Insert(1);
nums.Insert(2);
Print(nums.Count());

map<string, int> tabela = new map<string, int>();
tabela.Set("um", 1);
```

## 9. Suspension and concurrency

| Form | Effect |
|---|---|
| `Sleep(seconds)` | suspends the thread for N seconds |
| `Wait(condition)` | suspends until the condition becomes true |
| `thread Foo()` | starts `Foo` in a new coroutine |
| `call Foo()` | direct call, same thread |

`Wait` and `Sleep` are **instructions**, not functions: the compiler emits `OP_WAIT` and the thread
leaves the execution queue until the scheduler reactivates it.

## 10. Traps and known debt

| Problem | Evidence |
|---|---|
| `while(true)` without `Sleep` freezes the VM | `enf_scriptthread.cpp:540-607` |
| `m_Stats.m_iExecuted++` per instruction | `enf_scriptvm.cpp:906` (H-05) |
| `modded`/`override` absent | `grep` = 0 in `Enfusion/` |
| `%` only for int | operator table, `5419-5462` |
| `^` is XOR | `OP_EORI` |
| no C++11 in the host | MSVC v100 (`lib/lib2010.vcxproj`) |

## 11. Quick SQF × Enforce comparison

| Aspect | SQF | Enforce |
|---|---|---|
| Origin | legacy RV | Enfusion |
| Unit | single expression | file with classes/functions |
| Types | dynamic | static (VType) |
| Arrays | `[1,2,3]` literal | native `array<T>` |
| Suspension | `sleep`, `waitUntil` | `Sleep`, `Wait` |
| Concurrency | cooperative, 100 lines/frame | cooperative, single thread |
| Modern modding | no | **not in this 0.45** |
