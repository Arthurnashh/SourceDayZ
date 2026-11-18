import { useState } from "react";
import pendenciasMd from "../content/pendencias.md?raw";
import animacoesMd from "../content/animacoes.md?raw";
import buildsMd from "../content/builds.md?raw";
import { Md } from "../components/Md";
import { Stat } from "../components/ui";
import { WorkBoard } from "../components/WorkBoard";
import { useWorkStore } from "../lib/work";
import { PendenciasFps } from "./PendenciasFps";

type Aba = "fps" | "pendencias" | "animacoes" | "builds";

const TABS: { key: Aba; label: string; sub: string }[] = [
  { key: "fps", label: "Resolver Drop de FPS", sub: "prioridade alta" },
  { key: "pendencias", label: "Tarefas", sub: "quadro editável · concluir e excluir" },
  { key: "animacoes", label: "Animações", sub: "dossiê 1.30 → 0.45" },
  { key: "builds", label: "Builds E1–E7", sub: "histórico e testes" },
];

export function Pendencias() {
  const [aba, setAba] = useState<Aba>("fps");
  const store = useWorkStore();
  const openBugs =
    store.state?.items.filter(
      (item) => item.kind === "bug" && item.status !== "concluido"
    ).length ?? 1;
  const openTasks =
    store.state?.items.filter(
      (item) => item.kind === "tarefa" && item.status !== "concluido"
    ).length ?? 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">estado do projeto · 18 de novembro de 2026</span>
          <h1>Pendências</h1>
          <p>
            O retrato do que está aberto: animações do DayZ 1.30 dentro do cliente 0.45, menus,
            FPS e a infraestrutura de builds. A aba <strong>Tarefas</strong> é um quadro editável:
            dá para criar, editar, marcar como em andamento e concluir. Ao concluir, o desfecho
            exige o que era, como foi resolvido, o que foi usado e quantas tentativas foram
            feitas. A aba <strong>Resolver Drop de FPS</strong> continua separada e concentra o
            teste do candidato F, as prints, a correção F2 e todos os diffs de código.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label="Animações em 1.30" value="1.390" hint="de 2.028 · 68,5% da base" tone="lime" />
        <Stat label="Build em jogo" value="E6" hint="875,8 MiB · sem erro novo" tone="blue" />
        <Stat
          label="Bugs abertos"
          value={String(openBugs)}
          hint="registro de bugs · corrigir ou reabrir"
          tone="amber"
        />
        <Stat
          label="Tarefas abertas"
          value={String(openTasks)}
          hint="quadro editável · em andamento incluso"
          tone="amber"
        />
        <Stat label="Prioridade alta" value="FPS" hint="F2 parcial · grama/sombra falham" tone="amber" />
        <Stat label="Baseline do RPT" value="12 / 23" hint="not found / Bad move" tone="violet" />
      </section>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${aba === t.key ? "on" : ""}`}
            onClick={() => setAba(t.key)}
          >
            <strong>{t.label}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>

      {aba === "fps" && (
        <section className="panel article">
          <PendenciasFps />
        </section>
      )}

      {aba === "pendencias" && (
        <>
          <WorkBoard
            kind="tarefa"
            store={store}
            title="Tarefas do projeto"
            intro="Crie tarefas, mova para em andamento, bloqueie ou conclua. Ao concluir, o desfecho pede o que foi feito, como, o que foi usado e quantas tentativas foram necessárias."
          />
          <details className="panel article wb-archive">
            <summary>Panorama detalhado do que falta</summary>
            <div className="wb-archive-body">
              <Md text={pendenciasMd} />
            </div>
          </details>
        </>
      )}

      {(aba === "animacoes" || aba === "builds") && (
        <section className="panel article">
          <Md text={aba === "animacoes" ? animacoesMd : buildsMd} />
        </section>
      )}
    </div>
  );
}
