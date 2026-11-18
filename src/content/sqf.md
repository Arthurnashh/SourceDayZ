# SQF / SQS — o script legado do motor

> Fonte de verdade local: `ComRef/comref.xml` (519 KB, o manual de comandos gerado pelo
> próprio motor), o interpretador `El/Evaluator/` e a camada de corrotina `lib/scripts.cpp`.
> Tudo que aparece aqui foi lido na source em `D:\SOURCEDAYZS!!\DayZ-0.45.124252`.

## 1. O que é SQF

SQF (*Status Quo Function*) é a linguagem de script original do motor Real Virtuality,
anterior ao Enforce. Ela continua viva em 0.45 porque as missões, o `init.sqf`, os
`execVM` e boa parte do gameplay antigo dependem dela. SQS é a variante anterior, em que
cada linha do arquivo é um comando (sem blocos); o motor mantém as duas.

SQF é uma linguagem de **expressão única**: não existem declarações de função como em C.
Tudo é um valor, e o programa é uma árvore de chamadas. Um arquivo `.sqf` é avaliado
como uma expressão; o resultado da última expressão é o valor de retorno do script.

Evidência de que o motor trata script como objeto carregável assíncrono:
`lib/scripts.hpp:75` — `class Script : public RequestableObject, public IDebugScript`.
Cada arquivo `.sqf` é um objeto de streaming, não um texto lido de uma vez.

## 2. Vocabulário: mais de 1.200 comandos

Medido no `comref.xml`:

| Métrica | Valor |
|---|---:|
| Entradas `<command>` | 1.340 |
| Nomes únicos de comando/operador | 1.216 |
| Operadores simbólicos | `! != % && > >> >= < <= * / : ^ \|\| + == -` |

Cada entrada do `comref.xml` traz `<name>`, `<loper>` (operando esquerdo),
`<roper>` (operando direito), tipos, `<returntype>`, `<description>`, `<example>`,
`<exResult>` e `<category>` (`comref.xml:8-19`). Ou seja: o dicionário completo da
linguagem está **no repositório**, não na internet.

## 3. Formas sintáticas

| Forma | Exemplo | Semântica |
|---|---|---|
| Operador infixo | `a + b`, `a == b` | resolve pelo tipo dos operandos |
| Comando prefixo | `getPos player` | comando + argumento à direita |
| Comando com array | `setPos [x,y,z]` | argumento único é um array |
| Chamada de função | `call fnc`, `[a,b] call fnc` | código como valor |
| Bloco de código | `{ ... }` | valor `CODE`, não executado |
| Array | `[1,2,3]` | índice base **0** |
| String | `"texto"` | aspas internas duplicadas `""` |
| Variável local | `_x` | escopo da função/script |
| Variável global | `nome` | namespace da missão |
| Atribuição | `_x = 5` | o valor é o resultado da expressão |
| Condicional | `if (cond) then {..} else {..}` | `then` é obrigatório |
| Laço while | `while {cond} do {..}` | a condição é um bloco |
| Laço for | `for "_i" from 0 to 10 step 2 do {..}` | laço numérico |
| Switch | `switch (x) do { case 1: {..}; default {..} }` | igualdade |
| Espera por condição | `waitUntil {cond}` | suspende até verdadeiro |
| Suspensão | `sleep 1` | suspende N segundos |
| Thread | `spawn {..}`, `execVM "f.sqf"` | cria thread cooperativa |
| Escopo | `private ["_a","_b"]`, `params [...]` | declaração de escopo |
| Comentário | `// linha` e `/* bloco */` | |
| Pré-processador | `#include`, `#define`, `#ifdef` | via `PreprocC` |

### 3.1 Chamada de comando

O comando é o primeiro token; o argumento vem à direita. Quando o comando espera vários
valores, eles vão empacotados em um array:

```sqf
_pos  = getPos player;              // comando + argumento
_dir  = getDir player;              // idem
player setPos [x, y, z];            // três valores em um array
_unit setDamage 0.5;                // um escalar
```

### 3.2 Bloco de código é valor

`{ ... }` **não executa** nada: cria um valor do tipo `CODE`. Para executar, use `call`,
`spawn`, `execVM` ou passe o bloco para um comando que aceite código (`waitUntil`, `then`).

```sqf
_meuBloco = { hint "rodou"; };
call _meuBloco;                     // executa agora, no mesmo thread
_meuBloco spawn {};                 // agenda em thread nova
```

### 3.3 Escopo

- `_x` é local. Sem `private`, uma variável local "vaza" para o script chamador.
- `private ["_a", "_b"]` declara locais no escopo atual.
- `params ["_a", ["_b", 0]]` declara e valida tipos/valores padrão.
- Nome sem `_` é global da missão (`missionNamespace`).

```sqf
private _soma = 0;
{
    private _v = _x;                // _x é o elemento atual do forEach
    _soma = _soma + _v;
} forEach [1, 2, 3];
```

### 3.4 Estruturas de controle

```sqf
if (alive player) then {
    hint "vivo";
} else {
    hint "morto";
};

while { _i < 10 } do {
    _i = _i + 1;
    sleep 0.1;                      // devolve o controle ao motor
};

for "_i" from 0 to 10 step 2 do {
    diag_log str _i;
};

switch (_tipo) do {
    case "civil": { hint "civil"; };
    case "militar": { hint "militar"; };
    default { hint "outro"; };
};
```

### 3.5 Arrays

Índice base 0, tamanho dinâmico, heterogêneo:

```sqf
_arr = [1, "dois", [3, 4]];
_first = _arr select 0;             // 1
_arr set [3, "novo"];               // cresce automaticamente
_n = count _arr;
{ diag_log str _x } forEach _arr;
```

### 3.6 Strings e números

```sqf
_texto = "linha com ""aspas"" internas";   // aspas duplicadas
_num   = 42;                                // int
_real  = 1.5;                               // float
_bool  = true;                              // boolean
```

## 4. Como a engine executa SQF

O ponto decisivo é que SQF **não é interpretado linha a linha por um parser ingênuo**.
Ele é compilado para bytecode e executado por uma VM cooperativa com orçamento por frame.

- `lib/scripts.cpp:53-74` — construtor de `Script`: `_baseTime = Glob.time`,
  `_maxLinesAtOnce = 100`. **`_maxLinesAtOnce` é o orçamento de linhas por frame**:
  uma thread SQF executa no máximo 100 linhas e devolve o controle.
- `lib/scripts.cpp:76-93` — `ReadLine()` lê o arquivo caractere a caractere, pula espaços
  iniciais e trata `\r\n`.
- `El/Evaluator/expressCompiler.cpp` (95 KB) compila a árvore.
- `El/Evaluator/expressInterpreter.cpp` (21 KB) interpreta.
- `El/Evaluator/scriptVM.cpp` faz a ponte com a engine.

Consequência prática: um laço apertado **sem `sleep`** não congela o jogo — ele consome
os 100 comandos do frame e volta no frame seguinte. O sintoma é **queda de FPS**, não
travamento. Isso está registrado em `1.md` §1.2.3.

## 5. Concorrência: `spawn`, `execVM`, `call`

| Forma | Onde roda | Quando retorna | Uso |
|---|---|---|---|
| `call bloco` | thread atual | imediatamente, com o valor | função pura |
| `_h = bloco spawn` | thread nova | devolve handle `Script` | tarefa longa |
| `_h = execVM "f.sqf"` | thread nova, lê arquivo | devolve handle | script externo |
| `waitUntil {cond}` | thread atual | quando a condição fica verdadeira | polling cooperativo |
| `sleep n` | thread atual | n segundos depois | pausa |

Orçamento de 100 linhas/frame em `lib/scripts.cpp:53-74` é o que torna `spawn` barato:
não há thread de SO, só uma entrada na fila de scripts do motor.

## 6. Pré-processador

O SQF aceita diretivas de pré-processamento via `PreprocC`:

```sqf
#include "\minha_pasta\config.hpp"
#define MINHA_MACRO 10
#ifdef MINHA_MACRO
    diag_log "definida";
#endif
```

Isso é usado em massa pelo DayZ para injetar `CfgVehicles`, `CfgWeapons` e funções
compartilhadas entre cliente e servidor.

## 7. Erros clássicos (e como o motor reage)

| Erro | O que acontece | Evidência/comportamento |
|---|---|---|
| `while {true} do {}` sem `sleep` | FPS cai, jogo segue | orçamento de 100 linhas/frame |
| `2^10` esperando potência | não é SQF; em Enforce `^` é XOR | ver página Enforce |
| `_arr select 10` fora do array | retorna `nil` e loga erro | sem exceção |
| variável local sem `private` | pode sobrescrever local do chamador | escopo dinâmico |
| `then` ausente no `if` | erro de compilação do script | `if (...) then {...}` |
| `sleep` dentro de `call` | suspende a thread chamadora inteira | use `spawn` |

## 8. Relação com o Enforce

O motor 0.45 tem as duas VMs. O SQF é o legado (missões, `init.sqf`), o Enforce é o
moderno (`Enfusion/src/script/`). Elas compartilham o `TimeManager` e o mesmo orçamento
de frame: **script lento em qualquer uma das duas rouba tempo do desenho** (ver
`World::Simulate` em `lib/world.cpp:11795`, chamada `SimulateScripts` em `12213`).
