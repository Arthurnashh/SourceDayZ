import { useState, useEffect } from "react";
import correcoesMd from "../content/correcoes.md?raw";
import implementacoesMd from "../content/implementacoes.md?raw";
import animacoesMd from "../content/animacoes.md?raw";
import buildsMd from "../content/builds.md?raw";
import linhaMd from "../content/linha-do-tempo.md?raw";
import { Md } from "../components/Md";
import { GithubFeed } from "../components/GithubFeed";
import { UpdatesLog } from "../components/UpdatesLog";
import { Stat } from "../components/ui";
import { useWorkStore } from "../lib/work";
import { navigate, useRoute } from "../lib/router";

type AbaMd = "correcoes" | "implementacoes" | "animacoes" | "builds" | "linha";
type Aba = AbaMd | "github" | "manuais";

const TABS: { key: Aba; label: string; sub: string }[] = [
  { key: "correcoes", label: "Bugs corrigidos", sub: "12 resolvidos · 1 aberto" },
  { key: "github", label: "Feed do GitHub", sub: "commits · releases · Personed/Game" },
  { key: "manuais", label: "Atualizações manuais", sub: "quem tem a source publica aqui" },
  { key: "implementacoes", label: "Novas implementações", sub: "11 frentes documentadas" },
  { key: "animacoes", label: "Animações 1.30", sub: "1.390 RTMs · E1–E7" },
  { key: "builds", label: "Builds E1–E7", sub: "7 builds · E6 em jogo" },
  { key: "linha", label: "Linha do tempo", sub: "16 a 18 de novembro" },
];

const CONTEUDO: Record<AbaMd, string> = {
  correcoes: correcoesMd,
  implementacoes: implementacoesMd,
  animacoes: animacoesMd,
  builds: buildsMd,
  linha: linhaMd,
};

function isMd(aba: Aba): aba is AbaMd {
  return aba in CONTEUDO;
}

function isAba(value: string | undefined): value is Aba {
  return Boolean(value && ["correcoes", "github", "manuais", "implementacoes", "animacoes", "builds", "linha"].includes(value));
}

export function Atualizacoes() {
  const route = useRoute();
  const pedida = route.parts[1];
  const [aba, setAba] = useState<Aba>(isAba(pedida) ? pedida : "correcoes");
  const store = useWorkStore();

  useEffect(() => {
    if (isAba(pedida)) setAba(pedida);
  }, [pedida]);

  const trocar = (key: Aba) => {
    setAba(key);
    window.history.replaceState(null, "", `#/atualizacoes/${key}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">atualizações · github oficial e changelog do projeto</span>
          <h1>Atualizações</h1>
          <p>
            Tudo que foi consertado e tudo que foi criado neste projeto — do motor em v141 e da
            colisão de zumbi ao WRP do mapa, terreno, navegador, menu de pausa,{" "}
            <code>upDegree</code> e ao porte das <strong>1.390 animações</strong> do DayZ 1.30,
            com as builds E1–E7 e o bug aberto da lanterna. O <strong>Feed do GitHub</strong> lê
            commits, releases e o manifesto do repositório <code>Personed/Game</code>; a aba{" "}
            <strong>Atualizações manuais</strong> é para quem tem a source publicar o changelog
            curado. A frente de FPS tem aba própria em{" "}
            <strong>Pendências → Resolver Drop de FPS</strong>.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label="Bugs corrigidos" value="12" hint="motor, mapa, UI, inventário e builds" tone="lime" />
        <Stat label="Implementações" value="11" hint="código, pipeline e documentação" tone="blue" />
        <Stat label="Animações 1.30" value="1.390" hint="de 2.028 · 68,5% · E1–E7" tone="violet" />
        <Stat label="Em aberto" value="1" hint="lanterna + pilha · E7 pronta" tone="amber" />
      </section>

      <div className="hero-actions" style={{ marginBottom: 4 }}>
        <button className="btn primary" onClick={() => navigate("passo-a-passo")}>
          Ver o passo a passo técnico →
        </button>
        <button className="btn ghost" onClick={() => navigate("pendencias")}>
          O que falta
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${aba === t.key ? "on" : ""}`}
            onClick={() => trocar(t.key)}
          >
            <strong>{t.label}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>

      {aba === "github" && <GithubFeed />}

      {aba === "manuais" && <UpdatesLog store={store} />}

      {isMd(aba) && (
        <section className="panel article">
          <Md text={CONTEUDO[aba]} />
        </section>
      )}
    </div>
  );
}
