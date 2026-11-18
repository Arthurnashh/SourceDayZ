import { useState } from "react";
import { Md } from "../components/Md";
import { navigate, useRoute } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

type Tab = "sqf" | "enforce" | "config" | "cpp";

const TABS: { key: Tab }[] = [
  { key: "sqf" },
  { key: "enforce" },
  { key: "config" },
  { key: "cpp" },
];
const CONFIG_MD = `
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
`;

const CPP_MD = `
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
`;

export function Linguagens() {
  const { t } = useDocsT();
  const sqfMd = useMd("sqf");
  const enforceMd = useMd("enforce");
  const route = useRoute();
  const inicial = route.parts[1] as Tab | undefined;
  const [tab, setTab] = useState<Tab>(
    inicial && ["sqf", "enforce", "config", "cpp"].includes(inicial) ? inicial : "sqf"
  );

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
        {tab === "config" && <Md text={CONFIG_MD} />}
        {tab === "cpp" && <Md text={CPP_MD} />}
      </section>
    </div>
  );
}
