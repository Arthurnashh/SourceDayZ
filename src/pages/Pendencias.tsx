import { useState } from "react";
import { Md } from "../components/Md";
import { Stat } from "../components/ui";
import { WorkBoard } from "../components/WorkBoard";
import { useWorkStore } from "../lib/work";
import { PendenciasFps } from "./PendenciasFps";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

type Aba = "fps" | "pendencias" | "animacoes" | "builds";

export function Pendencias() {
  const { t, locale } = useDocsT();
  const pendenciasMd = useMd("pendencias");
  const animacoesMd = useMd("animacoes");
  const buildsMd = useMd("builds");
  const [aba, setAba] = useState<Aba>("fps");
  const store = useWorkStore(locale);
  const openBugs =
    store.state?.items.filter(
      (item) => item.kind === "bug" && item.status !== "concluido"
    ).length ?? 1;
  const openTasks =
    store.state?.items.filter(
      (item) => item.kind === "tarefa" && item.status !== "concluido"
    ).length ?? 0;

  const TABS: { key: Aba; label: string; sub: string }[] = [
    { key: "fps", label: t("pending.tab.fps"), sub: t("pending.tab.fpsSub") },
    { key: "pendencias", label: t("pending.tab.tasks"), sub: t("pending.tab.tasksSub") },
    { key: "animacoes", label: t("pending.tab.animations"), sub: t("pending.tab.animationsSub") },
    { key: "builds", label: t("pending.tab.builds"), sub: t("pending.tab.buildsSub") },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("pending.kicker")}</span>
          <h1>{t("pending.title")}</h1>
          <p>{t("pending.lead")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label={t("pending.stat.animations")} value="1.390" hint={t("pending.stat.animationsHint")} tone="lime" />
        <Stat label={t("pending.stat.build")} value="E6" hint={t("pending.stat.buildHint")} tone="blue" />
        <Stat label={t("pending.stat.bugs")} value={String(openBugs)} hint={t("pending.stat.bugsHint")} tone="amber" />
        <Stat label={t("pending.stat.tasks")} value={String(openTasks)} hint={t("pending.stat.tasksHint")} tone="amber" />
        <Stat label={t("pending.stat.priority")} value="FPS" hint={t("pending.stat.priorityHint")} tone="amber" />
        <Stat label={t("pending.stat.baseline")} value="12 / 23" hint={t("pending.stat.baselineHint")} tone="violet" />
      </section>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${aba === tab.key ? "on" : ""}`}
            onClick={() => setAba(tab.key)}
          >
            <strong>{tab.label}</strong>
            <small>{tab.sub}</small>
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
            title={t("pending.tasksTitle")}
            intro={t("pending.tasksIntro")}
          />
          <details className="panel article wb-archive">
            <summary>{t("pending.details")}</summary>
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
