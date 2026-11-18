# Enforce Script (Enfusion) — referência da versão 0.45

> Fonte de verdade: o próprio compilador, `Enfusion/src/script/enf_scriptcompiler.cpp`
> (124 KB), mais a VM (`enf_scriptvm.cpp`) e a thread (`enf_scriptthread.cpp`).
> A wiki oficial da BI não foi usada: retorna HTTP 403 para acesso automatizado (verificado).

## 1. O que é

Enforce é a linguagem de script moderna da Enfusion, usada por `Enfusion/src/script/`.
Sintaxe parecida com C#/Java, mas com semântica própria: tipos de valor fixos, classes
declaradas com `class`, métodos nativos expostos pela engine via `proto native`, e
execução em **corrotinas cooperativas de thread única**.

## 2. Palavras-chave — tabela literal do compilador

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

Observações que só aparecem lendo o código:

- `class` é a declaração de tipo; **não existe `struct`** como tipo de script.
- `proto` declara protótipo nativo — é como o C++ expõe funções à linguagem.
- `typedef` permite alias de tipo.
- `clamp` é **keyword**, não função de biblioteca: gera instrução própria.
- `cache` é keyword de otimização de expressão (o compilador guarda o resultado).
- `Wait` e `Sleep` são keywords: instruções de **suspensão de thread**, não chamadas
  comuns. Confirmado no bytecode: `enf_scriptthread.cpp:232` trata `OP_WAIT`.
- `goto` existe (compatibilidade com a linguagem de 2001).
- `delete` destrói uma instância de classe.

## 3. Modificadores de declaração

Lidos no parser de membros, `enf_scriptcompiler.cpp:1201-1283`:

| Modificador | Linha | Efeito |
|---|---:|---|
| `private` | 1201 | visibilidade restrita à classe |
| `native` | 1209 | método implementado em C++ (sem corpo no script) |
| `owned` | 1226 | posse de referência (ownership) |
| `static` | 1258 | membro de classe, não de instância |
| `const` | 1267 | imutável |
| `protected` | 1283 | visível à hierarquia |
| `out` | 1234 | parâmetro de saída |
| `inout` | 1242 | parâmetro de entrada e saída |

### Atenção: este snapshot é Enforce de 2013

`modded` e `override`, descritos na documentação atual do DayZ, **não existem como token
neste 0.45**:

- `grep -c "modded"` em toda `Enfusion/` = **0**.
- `"override"` aparece 2× em `Enfusion/src/script/*.cpp`, nenhuma vez em `ADD_CMD`.

Consequência: qualquer tutorial moderno de modding com `modded void Foo()` **falha na
compilação** aqui. Ver `1.md` §5.6.

## 4. Operadores — despacho por tipo

`enf_scriptcompiler.cpp:5419-5462`. O compilador resolve o operador **pelo tipo do operando**:

| Operador | Tipo | Opcode |
|---|---|---|
| `*` | int | `OP_MULI` |
| `*` | float | `OP_MULF` |
| `*` | vector | `OP_CROSSV` (**produto vetorial**) |
| `/` | int / float | `OP_DIVI` / `OP_DIVF` |
| `+` | int / float / vector / string | `OP_ADDI` / `OP_ADDF` / `OP_ADDV` / `OP_ADDS` |
| `-` | int / float / vector | `OP_SUBI` / `OP_SUBF` / `OP_SUBV` |
| `%` | int | `OP_MODI` (só inteiro) |
| `^` | int | `OP_EORI` (**XOR bit a bit**, não potência) |
| `<<` `>>` | int | `OP_LSLI` / `OP_ASRI` (shift aritmético) |
| `\|` `&` | int | `OP_ORI` / `OP_ANDI` |
| `==` | qualquer | `OP_BNE` |
| `>` `<` `>=` `<=` `!=` | qualquer | `OP_BLE` `OP_BGE` `OP_BGT` `OP_BLT` `OP_BEQ` |

Três armadilhas reais:

1. **`^` é XOR, não potência.** `2^10` vale `8`. Para potência use `Math.Pow(2,10)`.
2. **`*` entre vetores é produto vetorial** (`OP_CROSSV`). Para escalar, `vector * float`
   promove para `MULF` — promoção que fica no type-checker (`[hipótese]`, pendência P-01).
3. **`%` só existe para int.** `5.5 % 2` não compila; use `Math.Mod`.

Os comparadores parecem invertidos (`==` → `BNE`): é codegen *branch-on-false* — o
compilador emite "salte se falso", economizando um salto por `if`.

## 5. Tipos de valor da VM

`Enfusion/include/script/enf_scriptvariable.h:36-56`:

```cpp
enum VType {
  VARTYPE_NONE = 0, VARTYPE_BOOL, VARTYPE_INT, VARTYPE_FLOAT,
  VARTYPE_VECTOR,      // float[3]
  VARTYPE_STRING,      // char[]
  VARTYPE_CLASS,       // instância de classe de script
  VARTYPE_VOID,
  VARTYPE_FUNCPTR,     // {Variable* classptr, uint index}
  VARTYPE_CLASSREF,
  VARTYPE_ARRAY,
  VARTYPE_USER0..USER7  // tipos nativos registrados pela engine
};
```

Flags de variável (`VariableSpec`, linhas 59+): `VSPEC_CONST`, `VSPEC_GLOBAL`,
`VSPEC_PTR`, `VSPEC_PROTECT`, `VSPEC_LOCAL`, `VSPEC_PRIVATE`, `VSPEC_DEFAULT`,
`VSPEC_CLASSMEMBER`, `VSPEC_STATIC`.

Tipos nativos são registrados pela engine em `enf_scriptapi.cpp:3602-3603`:

```cpp
g_vtVObjectType = AddType("vobject", VARTYPE_VOBJECT, sizeof(void*));
g_vtSoundType   = AddType("hsound",  VARTYPE_HSOUND,  sizeof(int));
```

`VARTYPE_LAYER`, `VARTYPE_VOBJECT` e `VARTYPE_HSOUND` são macros sobre `USER0/USER1/USER2`
(`Enfusion/include/script/enf_scriptapi.h:25-27`). É assim que `Layer`, `vobject` e `hsound`
existem no script sem serem tipos primitivos da VM.

## 6. Execução: threads, `Wait` e `Sleep`

`enf_scriptvm.cpp:865` — `ScriptContext::Run(ScriptThread*, VMStack*, int)` é o
interpretador: laço `while(true)` sobre `stack->m_psStat` (904-923), com contador
`m_Stats.m_iExecuted`.

Cada script roda em um `ScriptThread` com estado (`TF_RUNNING`, `TF_WCOND`, `TF_WTIME`,
`TF_KILL`) — `enf_scriptthread.cpp:540-607`. `Wait`/`Sleep` colocam a thread na lista de
dormentes (`:509`, `:518`, `:577`); o agendador a reativa.

**Conclusão:** Enforce é **corrotina cooperativa de thread única**, não thread de SO.
Um `while(true)` sem `Sleep` trava o servidor inteiro. `[verificado por código]`

## 7. Classes e métodos

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

- Construtor tem o nome da classe e **não** tem tipo de retorno.
- `new` cria instância; `delete` destrói (keyword `CMD_DELETE`).
- Herança: `class Filho extends Pai`.
- Método nativo: `proto native void Foo();` — declarado no script, implementado no C++.

## 8. Coleções

O compilador não tem literal de array na tabela de keywords: arrays são objetos nativos
(`VARTYPE_ARRAY`) criados pela API. `array<>`, `map<>` e `set<>` são classes nativas
registradas em `enf_scriptapi.cpp` via `AddType`/`AddClass`. `[pendente P-02]` listar
todos os métodos nativos expostos.

```cpp
array<int> nums = new array<int>();
nums.Insert(1);
nums.Insert(2);
Print(nums.Count());

map<string, int> tabela = new map<string, int>();
tabela.Set("um", 1);
```

## 9. Suspensão e concorrência

| Forma | Efeito |
|---|---|
| `Sleep(segundos)` | suspende a thread por N segundos |
| `Wait(condicao)` | suspende até a condição virar verdadeira |
| `thread Foo()` | inicia `Foo` em nova corrotina |
| `call Foo()` | chamada direta, mesmo thread |

`Wait` e `Sleep` são **instruções**, não funções: o compilador gera `OP_WAIT` e a thread
sai da fila de execução até o agendador reativá-la.

## 10. Armadilhas e dívida conhecida

| Problema | Evidência |
|---|---|
| `while(true)` sem `Sleep` congela a VM | `enf_scriptthread.cpp:540-607` |
| `m_Stats.m_iExecuted++` por instrução | `enf_scriptvm.cpp:906` (H-05) |
| `modded`/`override` ausentes | `grep` = 0 em `Enfusion/` |
| `%` só para int | tabela de operadores, `5419-5462` |
| `^` é XOR | `OP_EORI` |
| sem C++11 no host | MSVC v100 (`lib/lib2010.vcxproj`) |

## 11. Comparação rápida SQF × Enforce

| Aspecto | SQF | Enforce |
|---|---|---|
| Origem | RV legado | Enfusion |
| Unidade | expressão única | arquivo com classes/funções |
| Tipos | dinâmico | estático (VType) |
| Arrays | literal `[1,2,3]` | `array<T>` nativo |
| Suspensão | `sleep`, `waitUntil` | `Sleep`, `Wait` |
| Concorrência | cooperativa, 100 linhas/frame | cooperativa, thread única |
| Modding moderno | não | **não neste 0.45** |
