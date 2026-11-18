# Enforce Script (Enfusion) — справочник версии 0.45

> Источник истины: сам компилятор, `Enfusion/src/script/enf_scriptcompiler.cpp`
> (124 KB), плюс VM (`enf_scriptvm.cpp`) и поток (`enf_scriptthread.cpp`).
> Официальная вики BI не использовалась: она возвращает HTTP 403 для автоматического доступа (проверено).

## 1. Что это

Enforce — современный скриптовый язык Enfusion, используемый в `Enfusion/src/script/`.
Синтаксис похож на C#/Java, но с собственной семантикой: фиксированные типы значений, классы
объявляются через `class`, нативные методы предоставляются движком через `proto native`, а
исполнение — в **кооперативных однопоточных корутинах**.

## 2. Ключевые слова — буквальная таблица компилятора

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

Наблюдения, которые видны только при чтении кода:

- `class` — объявление типа; **`struct` как скриптового типа не существует**.
- `proto` объявляет нативный прототип — так C++ предоставляет функции языку.
- `typedef` позволяет псевдонимы типов.
- `clamp` — **ключевое слово**, а не библиотечная функция: генерирует собственную инструкцию.
- `cache` — ключевое слово оптимизации выражений (компилятор сохраняет результат).
- `Wait` и `Sleep` — ключевые слова: инструкции **приостановки потока**, а не обычные
  вызовы. Подтверждено в байткоде: `enf_scriptthread.cpp:232` обрабатывает `OP_WAIT`.
- `goto` существует (совместимость с языком 2001 года).
- `delete` уничтожает экземпляр класса.

## 3. Модификаторы объявления

Читаются в парсере членов, `enf_scriptcompiler.cpp:1201-1283`:

| Модификатор | Строка | Эффект |
|---|---:|---|
| `private` | 1201 | видимость ограничена классом |
| `native` | 1209 | метод реализован на C++ (без тела в скрипте) |
| `owned` | 1226 | владение ссылкой (ownership) |
| `static` | 1258 | член класса, не экземпляра |
| `const` | 1267 | неизменяемый |
| `protected` | 1283 | видим иерархии |
| `out` | 1234 | выходной параметр |
| `inout` | 1242 | входной и выходной параметр |

### Внимание: этот снимок — Enforce 2013 года

`modded` и `override`, описанные в текущей документации DayZ, **не существуют как токены
в этой 0.45**:

- `grep -c "modded"` по всей `Enfusion/` = **0**.
- `"override"` встречается 2× в `Enfusion/src/script/*.cpp`, ни разу в `ADD_CMD`.

Следствие: любой современный туториал по моддингу с `modded void Foo()` **не
скомпилируется** здесь. См. `1.md` §5.6.

## 4. Операторы — диспетчеризация по типу

`enf_scriptcompiler.cpp:5419-5462`. Компилятор разрешает оператор **по типу операнда**:

| Оператор | Тип | Опкод |
|---|---|---|
| `*` | int | `OP_MULI` |
| `*` | float | `OP_MULF` |
| `*` | vector | `OP_CROSSV` (**векторное произведение**) |
| `/` | int / float | `OP_DIVI` / `OP_DIVF` |
| `+` | int / float / vector / string | `OP_ADDI` / `OP_ADDF` / `OP_ADDV` / `OP_ADDS` |
| `-` | int / float / vector | `OP_SUBI` / `OP_SUBF` / `OP_SUBV` |
| `%` | int | `OP_MODI` (только целые) |
| `^` | int | `OP_EORI` (**побитовый XOR**, не степень) |
| `<<` `>>` | int | `OP_LSLI` / `OP_ASRI` (арифметический сдвиг) |
| `\|` `&` | int | `OP_ORI` / `OP_ANDI` |
| `==` | любой | `OP_BNE` |
| `>` `<` `>=` `<=` `!=` | любой | `OP_BLE` `OP_BGE` `OP_BGT` `OP_BLT` `OP_BEQ` |

Три реальные ловушки:

1. **`^` — это XOR, а не степень.** `2^10` равно `8`. Для степени используйте `Math.Pow(2,10)`.
2. **`*` между векторами — векторное произведение** (`OP_CROSSV`). Для скаляра `vector * float`
   повышается до `MULF` — повышение живёт в type-checker (`[гипотеза]`, ожидает P-01).
3. **`%` существует только для int.** `5.5 % 2` не компилируется; используйте `Math.Mod`.

Компараторы выглядят инвертированными (`==` → `BNE`): это codegen *branch-on-false* —
компилятор выдаёт «перейти, если ложно», экономя один переход на `if`.

## 5. Типы значений VM

`Enfusion/include/script/enf_scriptvariable.h:36-56`:

```cpp
enum VType {
  VARTYPE_NONE = 0, VARTYPE_BOOL, VARTYPE_INT, VARTYPE_FLOAT,
  VARTYPE_VECTOR,      // float[3]
  VARTYPE_STRING,      // char[]
  VARTYPE_CLASS,       // экземпляр скриптового класса
  VARTYPE_VOID,
  VARTYPE_FUNCPTR,     // {Variable* classptr, uint index}
  VARTYPE_CLASSREF,
  VARTYPE_ARRAY,
  VARTYPE_USER0..USER7  // нативные типы, зарегистрированные движком
};
```

Флаги переменных (`VariableSpec`, строки 59+): `VSPEC_CONST`, `VSPEC_GLOBAL`,
`VSPEC_PTR`, `VSPEC_PROTECT`, `VSPEC_LOCAL`, `VSPEC_PRIVATE`, `VSPEC_DEFAULT`,
`VSPEC_CLASSMEMBER`, `VSPEC_STATIC`.

Нативные типы регистрируются движком в `enf_scriptapi.cpp:3602-3603`:

```cpp
g_vtVObjectType = AddType("vobject", VARTYPE_VOBJECT, sizeof(void*));
g_vtSoundType   = AddType("hsound",  VARTYPE_HSOUND,  sizeof(int));
```

`VARTYPE_LAYER`, `VARTYPE_VOBJECT` и `VARTYPE_HSOUND` — макросы над `USER0/USER1/USER2`
(`Enfusion/include/script/enf_scriptapi.h:25-27`). Так `Layer`, `vobject` и `hsound`
существуют в скрипте, не будучи примитивными типами VM.

## 6. Исполнение: потоки, `Wait` и `Sleep`

`enf_scriptvm.cpp:865` — `ScriptContext::Run(ScriptThread*, VMStack*, int)` — это
интерпретатор: цикл `while(true)` по `stack->m_psStat` (904-923), со счётчиком
`m_Stats.m_iExecuted`.

Каждый скрипт работает в `ScriptThread` с состоянием (`TF_RUNNING`, `TF_WCOND`, `TF_WTIME`,
`TF_KILL`) — `enf_scriptthread.cpp:540-607`. `Wait`/`Sleep` помещают поток в список
спящих (`:509`, `:518`, `:577`); планировщик его реактивирует.

**Вывод:** Enforce — **кооперативная однопоточная корутина**, а не поток ОС.
`while(true)` без `Sleep` блокирует весь сервер. `[проверено по коду]`

## 7. Классы и методы

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

- Конструктор имеет имя класса и **не** имеет типа возврата.
- `new` создаёт экземпляр; `delete` уничтожает (ключевое слово `CMD_DELETE`).
- Наследование: `class Filho extends Pai`.
- Нативный метод: `proto native void Foo();` — объявлен в скрипте, реализован на C++.

## 8. Коллекции

В таблице ключевых слов компилятора нет литерала массива: массивы — нативные объекты
(`VARTYPE_ARRAY`), создаваемые API. `array<>`, `map<>` и `set<>` — нативные классы,
зарегистрированные в `enf_scriptapi.cpp` через `AddType`/`AddClass`. `[ожидает P-02]` перечислить
все предоставленные нативные методы.

```cpp
array<int> nums = new array<int>();
nums.Insert(1);
nums.Insert(2);
Print(nums.Count());

map<string, int> tabela = new map<string, int>();
tabela.Set("um", 1);
```

## 9. Приостановка и конкурентность

| Форма | Эффект |
|---|---|
| `Sleep(секунды)` | приостанавливает поток на N секунд |
| `Wait(условие)` | приостанавливает до истинности условия |
| `thread Foo()` | запускает `Foo` в новой корутине |
| `call Foo()` | прямой вызов, тот же поток |

`Wait` и `Sleep` — **инструкции**, а не функции: компилятор генерирует `OP_WAIT`, и поток
покидает очередь исполнения, пока планировщик его не реактивирует.

## 10. Ловушки и известный долг

| Проблема | Доказательство |
|---|---|
| `while(true)` без `Sleep` замораживает VM | `enf_scriptthread.cpp:540-607` |
| `m_Stats.m_iExecuted++` на инструкцию | `enf_scriptvm.cpp:906` (H-05) |
| `modded`/`override` отсутствуют | `grep` = 0 в `Enfusion/` |
| `%` только для int | таблица операторов, `5419-5462` |
| `^` — это XOR | `OP_EORI` |
| нет C++11 в хосте | MSVC v100 (`lib/lib2010.vcxproj`) |

## 11. Быстрое сравнение SQF × Enforce

| Аспект | SQF | Enforce |
|---|---|---|
| Происхождение | устаревший RV | Enfusion |
| Единица | одно выражение | файл с классами/функциями |
| Типы | динамические | статические (VType) |
| Массивы | литерал `[1,2,3]` | нативный `array<T>` |
| Приостановка | `sleep`, `waitUntil` | `Sleep`, `Wait` |
| Конкурентность | кооперативная, 100 строк/кадр | кооперативная, один поток |
| Современный моддинг | нет | **нет в этой 0.45** |
