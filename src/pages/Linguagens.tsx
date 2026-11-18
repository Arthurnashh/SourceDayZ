import { useEffect, useState } from "react";
import { Md } from "../components/Md";
import { navigate, useRoute } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";
import type { Locale } from "../lib/i18n";

type Tab = "sqf" | "enforce" | "config" | "cpp";

const TABS: { key: Tab }[] = [
  { key: "sqf" },
  { key: "enforce" },
  { key: "config" },
  { key: "cpp" },
];
const CONFIG_MD: Record<Locale, string> = {
  pt: `
## Config (ParamFile)

\`cfg/Bin/config.cpp\` agrega inventário, armas, veículos, UI e mundos. A sintaxe é a de
\`paramFile\`, carregada por \`lib/paramFile.cpp\` e serializada por \`El/ParamFile\`.
Não é C++ nem SQF: é um formato de dados declarativo.

\`\`\`cpp
class CfgPatches
{
    class MeuMod
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
    };
};

class CfgVehicles
{
    class HouseNoDestruct;

    class MinhaCasa: HouseNoDestruct
    {
        scope = 2;
        model = "\\MeuMod\\data\\casa.p3d";
        displayName = "Minha Casa";
    };
};
\`\`\`

### Regras da linguagem

| Forma | Exemplo | Observação |
|---|---|---|
| Classe | \`class Nome { ... };\` | sempre termina com \`;\` |
| Herança | \`class X: Base { ... };\` | primeiro membro nomeado por último |
| Atributo | \`scope = 2;\` | \`nome = valor;\` |
| Array | \`units[] = {"a","b"};\` | colchetes antes do \`=\` |
| String | \`"texto"\` | escape com \`\\\\\` |
| Comentário | \`//\` e \`/* */\` | igual a C |

### Onde o motor lê isso

- \`lib/paramFile.cpp\` — parser e árvore de classes.
- \`El/ParamFile\` — serialização (binário e texto).
- \`cfg/Bin/config.cpp\` — configuração do motor, UI, ações e localização.

**[pendente P-03]** mapear todas as classes de config usadas pelo gameplay de DayZ.
`,
  en: `
## Config (ParamFile)

\`cfg/Bin/config.cpp\` aggregates inventory, weapons, vehicles, UI and worlds. The syntax is that of
\`paramFile\`, loaded by \`lib/paramFile.cpp\` and serialized by \`El/ParamFile\`.
It is not C++ or SQF: it is a declarative data format.

\`\`\`cpp
class CfgPatches
{
    class MeuMod
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
    };
};

class CfgVehicles
{
    class HouseNoDestruct;

    class MinhaCasa: HouseNoDestruct
    {
        scope = 2;
        model = "\\MeuMod\\data\\casa.p3d";
        displayName = "Minha Casa";
    };
};
\`\`\`

### Language rules

| Form | Example | Note |
|---|---|---|
| Class | \`class Nome { ... };\` | always ends with \`;\` |
| Inheritance | \`class X: Base { ... };\` | first member named last |
| Attribute | \`scope = 2;\` | \`nome = valor;\` |
| Array | \`units[] = {"a","b"};\` | brackets before the \`=\` |
| String | \`"texto"\` | escape with \`\\\\\` |
| Comment | \`//\` and \`/* */\` | same as C |

### Where the engine reads it

- \`lib/paramFile.cpp\` — parser and class tree.
- \`El/ParamFile\` — serialization (binary and text).
- \`cfg/Bin/config.cpp\` — engine configuration, UI, actions and localization.

**[pending P-03]** map all config classes used by DayZ gameplay.
`,
  ru: `
## Config (ParamFile)

\`cfg/Bin/config.cpp\` объединяет инвентарь, оружие, транспорт, UI и миры. Синтаксис — как у
\`paramFile\`, загружается \`lib/paramFile.cpp\` и сериализуется \`El/ParamFile\`.
Это не C++ и не SQF: это декларативный формат данных.

\`\`\`cpp
class CfgPatches
{
    class MeuMod
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
    };
};

class CfgVehicles
{
    class HouseNoDestruct;

    class MinhaCasa: HouseNoDestruct
    {
        scope = 2;
        model = "\\MeuMod\\data\\casa.p3d";
        displayName = "Minha Casa";
    };
};
\`\`\`

### Правила языка

| Форма | Пример | Примечание |
|---|---|---|
| Класс | \`class Nome { ... };\` | всегда заканчивается \`;\` |
| Наследование | \`class X: Base { ... };\` | первый член именуется последним |
| Атрибут | \`scope = 2;\` | \`nome = valor;\` |
| Массив | \`units[] = {"a","b"};\` | скобки перед \`=\` |
| Строка | \`"texto"\` | escape через \`\\\\\` |
| Комментарий | \`//\` и \`/* */\` | как в C |

### Где движок это читает

- \`lib/paramFile.cpp\` — парсер и дерево классов.
- \`El/ParamFile\` — сериализация (бинарная и текст).
- \`cfg/Bin/config.cpp\` — конфигурация движка, UI, действия и локализация.

**[ожидает P-03]** сопоставить все классы config, используемые геймплеем DayZ.
`,
};

const CPP_MD: Record<Locale, string> = {
  pt: `
## C++ da Bohemia — padrões que se repetem

A source é C++ de 2001-2013, não C++ moderno. Estes padrões aparecem em quase todo arquivo
de \`lib/\` e economizam horas de leitura.

| Padrão | Exemplo | Regra |
|---|---|---|
| Membro com \`_\` | \`_shape\`, \`_position\` | prefixo \`_\` = campo |
| Global com \`G\` | \`GScene\`, \`GEngine\`, \`GWorld\`, \`GLandscape\` | \`G\` = singleton global |
| Tipo com \`Ref<>\` | \`Ref<Object>\`, \`Ref<Texture>\` | ponteiro com contagem de referência |
| Tipo com \`OLink<>\` | \`OLink(Person)\` | link fraco, anulável |
| Array | \`AutoArray<T>\`, \`StaticArrayAuto<T>\` | container próprio, não \`std::vector\` |
| String | \`RString\`, \`RStringB\` | \`RStringB\` = visão sem dono |
| Erro | \`LSError\`, \`Fail("...")\`, \`RptF("...")\` | retorno de erro + log, **sem exceções** |
| Serialização | \`ParamArchive &ar\` | todo objeto persistente implementa \`Serialize\` |
| Perfil | \`PROFILE_SCOPE_EX(nome,*);\` | instrumentação de tempo por escopo |
| Thread | \`CriticalSection\`, \`MultiThread\` | locks explícitos, sem \`std::mutex\` |

### Regras de leitura

1. **\`#if _ENABLE_CHEATS\` / \`#if _VBS3\` / \`#if _GAMES_FOR_WINDOWS\`** — ~30% do código é
   variante de plataforma/produto. Ignore o ramo que não é o alvo (\`_WIN32\` + \`!_VBS3\` +
   \`!_GAMES_FOR_WINDOWS\`).
2. **\`Fail()\`** é assert + log em release; não é \`abort\`. Um \`Fail\` em caminho quente é
   dívida de performance (formata string).
3. **\`Ref<>\` não é \`shared_ptr\`**: a contagem é manual e \`Ref\` pode ser nulo sem checagem.
4. **Retorno por parâmetro**: \`bool GetX(Type &out)\` retorna sucesso, não valor.
5. **\`PROFILE_SCOPE_EX\`** é o mapa de calor de graça: \`wSimu\`, \`wPrep\`, \`obDrw\`, \`obTxP\`,
   \`obShD\`, \`obLgt\`, \`nwSer\`, \`nwCli\`.

### O teto do compilador

| Dependência | Versão | Consequência |
|---|---|---|
| MSVC | v100 (VS2010) | sem C++11: \`std::atomic\`, \`std::thread\`, \`nullptr\`, \`override\`, \`constexpr\` |
| Bullet | 2.76 | física antiga, sem SIMD, sem solver multithread |
| DirectX SDK | 2010 | \`D3DX9\`/\`D3DX11\`, \`d3dx9_41.dll\` obrigatório |
| Boost | antigo | \`boost::\` containers em vez de \`std::\` |

O retarget do projeto hoje falha com \`MSB8020\`. Qualquer modernização de render precisa
resolver isso **primeiro**.
`,
  en: `
## Bohemia C++ — patterns that repeat

The source is C++ from 2001-2013, not modern C++. These patterns appear in almost every file
in \`lib/\` and save hours of reading.

| Pattern | Example | Rule |
|---|---|---|
| Member with \`_\` | \`_shape\`, \`_position\` | \`_\` prefix = field |
| Global with \`G\` | \`GScene\`, \`GEngine\`, \`GWorld\`, \`GLandscape\` | \`G\` = global singleton |
| Type with \`Ref<>\` | \`Ref<Object>\`, \`Ref<Texture>\` | reference-counted pointer |
| Type with \`OLink<>\` | \`OLink(Person)\` | weak, nullable link |
| Array | \`AutoArray<T>\`, \`StaticArrayAuto<T>\` | own container, not \`std::vector\` |
| String | \`RString\`, \`RStringB\` | \`RStringB\` = non-owning view |
| Error | \`LSError\`, \`Fail("...")\`, \`RptF("...")\` | error return + log, **no exceptions** |
| Serialization | \`ParamArchive &ar\` | every persistent object implements \`Serialize\` |
| Profile | \`PROFILE_SCOPE_EX(nome,*);\` | per-scope time instrumentation |
| Thread | \`CriticalSection\`, \`MultiThread\` | explicit locks, no \`std::mutex\` |

### Reading rules

1. **\`#if _ENABLE_CHEATS\` / \`#if _VBS3\` / \`#if _GAMES_FOR_WINDOWS\`** — about 30% of the code is
   a platform/product variant. Ignore the branch that is not the target (\`_WIN32\` + \`!_VBS3\` +
   \`!_GAMES_FOR_WINDOWS\`).
2. **\`Fail()\`** is assert + log in release; it is not \`abort\`. A \`Fail\` on a hot path is a
   performance debt (it formats a string).
3. **\`Ref<>\` is not \`shared_ptr\`**: counting is manual and \`Ref\` can be null without a check.
4. **Return by parameter**: \`bool GetX(Type &out)\` returns success, not the value.
5. **\`PROFILE_SCOPE_EX\`** is the free heat map: \`wSimu\`, \`wPrep\`, \`obDrw\`, \`obTxP\`,
   \`obShD\`, \`obLgt\`, \`nwSer\`, \`nwCli\`.

### The compiler ceiling

| Dependency | Version | Consequence |
|---|---|---|
| MSVC | v100 (VS2010) | no C++11: \`std::atomic\`, \`std::thread\`, \`nullptr\`, \`override\`, \`constexpr\` |
| Bullet | 2.76 | old physics, no SIMD, no multithreaded solver |
| DirectX SDK | 2010 | \`D3DX9\`/\`D3DX11\`, \`d3dx9_41.dll\` required |
| Boost | old | \`boost::\` containers instead of \`std::\` |

Retargeting the project today fails with \`MSB8020\`. Any rendering modernization needs to
solve that **first**.
`,
  ru: `
## C++ Bohemia — повторяющиеся паттерны

Исходники — это C++ 2001–2013, не современный C++. Эти паттерны встречаются почти в каждом файле
из \`lib/\` и экономят часы чтения.

| Паттерн | Пример | Правило |
|---|---|---|
| Член с \`_\` | \`_shape\`, \`_position\` | префикс \`_\` = поле |
| Глобал с \`G\` | \`GScene\`, \`GEngine\`, \`GWorld\`, \`GLandscape\` | \`G\` = глобальный singleton |
| Тип с \`Ref<>\` | \`Ref<Object>\`, \`Ref<Texture>\` | указатель со счётчиком ссылок |
| Тип с \`OLink<>\` | \`OLink(Person)\` | слабая, обнуляемая ссылка |
| Массив | \`AutoArray<T>\`, \`StaticArrayAuto<T>\` | собственный контейнер, не \`std::vector\` |
| Строка | \`RString\`, \`RStringB\` | \`RStringB\` = невладеющий вид |
| Ошибка | \`LSError\`, \`Fail("...")\`, \`RptF("...")\` | возврат ошибки + лог, **без исключений** |
| Сериализация | \`ParamArchive &ar\` | каждый постоянный объект реализует \`Serialize\` |
| Профиль | \`PROFILE_SCOPE_EX(nome,*);\` | инструментация времени по scope |
| Поток | \`CriticalSection\`, \`MultiThread\` | явные локи, без \`std::mutex\` |

### Правила чтения

1. **\`#if _ENABLE_CHEATS\` / \`#if _VBS3\` / \`#if _GAMES_FOR_WINDOWS\`** — около 30% кода —
   вариант платформы/продукта. Игнорируйте ветку, которая не является целью (\`_WIN32\` + \`!_VBS3\` +
   \`!_GAMES_FOR_WINDOWS\`).
2. **\`Fail()\`** — это assert + лог в release; это не \`abort\`. \`Fail\` в горячем пути —
   долг производительности (форматирует строку).
3. **\`Ref<>\` — не \`shared_ptr\`**: счёт ведётся вручную, и \`Ref\` может быть null без проверки.
4. **Возврат через параметр**: \`bool GetX(Type &out)\` возвращает успех, а не значение.
5. **\`PROFILE_SCOPE_EX\`** — бесплатная тепловая карта: \`wSimu\`, \`wPrep\`, \`obDrw\`, \`obTxP\`,
   \`obShD\`, \`obLgt\`, \`nwSer\`, \`nwCli\`.

### Потолок компилятора

| Зависимость | Версия | Следствие |
|---|---|---|
| MSVC | v100 (VS2010) | без C++11: \`std::atomic\`, \`std::thread\`, \`nullptr\`, \`override\`, \`constexpr\` |
| Bullet | 2.76 | старая физика, без SIMD, без многопоточного solver |
| DirectX SDK | 2010 | \`D3DX9\`/\`D3DX11\`, обязателен \`d3dx9_41.dll\` |
| Boost | старый | контейнеры \`boost::\` вместо \`std::\` |

Retarget проекта сегодня падает с \`MSB8020\`. Любая модернизация рендера должна
сначала решить это.
`,
};

export function Linguagens() {
  const { t, locale } = useDocsT();
  const sqfMd = useMd("sqf");
  const enforceMd = useMd("enforce");
  const route = useRoute();
  const inicial = route.parts[1] as Tab | undefined;
  const [tab, setTab] = useState<Tab>(
    inicial && ["sqf", "enforce", "config", "cpp"].includes(inicial) ? inicial : "sqf"
  );

  // Mantém a aba em sincronia com o endereço (#/linguagens/config etc.),
  // inclusive quando o link vem de outra página ou do histórico.
  useEffect(() => {
    const atual = route.parts[1] as Tab | undefined;
    if (atual && ["sqf", "enforce", "config", "cpp"].includes(atual)) {
      setTab(atual);
    }
  }, [route.parts[1]]);

  const label = (key: Tab) => ({
    label: key === "cpp" ? t("languages.tab.cpp") : key === "sqf" ? "SQF / SQS" : key === "enforce" ? "Enforce" : "Config",
    sub:
      key === "sqf"
        ? t("languages.tab.sqfSub")
        : key === "enforce"
          ? t("languages.tab.enforceSub")
          : key === "cpp"
            ? t("languages.tab.cppSub")
            : "ParamFile / Cfg*",
  });

  const escolher = (next: Tab) => {
    setTab(next);
    navigate(`linguagens/${next}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("languages.kicker")}</span>
          <h1>{t("languages.title")}</h1>
          <p>{t("languages.lead")}</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((item) => {
          const copy = label(item.key);
          return (
            <button key={item.key} className={`tab ${tab === item.key ? "on" : ""}`} onClick={() => escolher(item.key)}>
              <strong>{copy.label}</strong>
              <small>{copy.sub}</small>
            </button>
          );
        })}
      </div>

      <section className="panel article">
        {tab === "sqf" && <Md text={sqfMd} />}
        {tab === "enforce" && <Md text={enforceMd} />}
        {tab === "config" && <Md text={CONFIG_MD[locale]} />}
        {tab === "cpp" && <Md text={CPP_MD[locale]} />}
      </section>
    </div>
  );
}
