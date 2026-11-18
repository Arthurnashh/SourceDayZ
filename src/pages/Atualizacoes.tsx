import { useState, useEffect } from "react";
import { Md } from "../components/Md";
import { GithubFeed } from "../components/GithubFeed";
import { UpdatesLog } from "../components/UpdatesLog";
import { Stat } from "../components/ui";
import { useWorkStore } from "../lib/work";
import { navigate, useRoute } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

type AbaMd = "correcoes" | "implementacoes" | "animacoes" | "builds" | "linha";
type Aba = AbaMd | "github" | "manuais";

function isMd(aba: Aba): aba is AbaMd {
  return aba === "correcoes" || aba === "implementacoes" || aba === "animacoes" || aba === "builds" || aba === "linha";
}

function isAba(value: string | undefined): value is Aba {
  return Boolean(value && ["correcoes", "github", "manuais", "implementacoes", "animacoes", "builds", "linha"].includes(value));
}

export function Atualizacoes() {
  const { t, locale } = useDocsT();
  const correcoesMd = useMd("correcoes");
  const implementacoesMd = useMd("implementacoes");
  const animacoesMd = useMd("animacoes");
  const buildsMd = useMd("builds");
  const linhaMd = useMd("linha-do-tempo");
  const route = useRoute();
  const pedida = route.parts[1];
  const [aba, setAba] = useState<Aba>(isAba(pedida) ? pedida : "correcoes");
  const store = useWorkStore(locale);

  useEffect(() => {
    if (isAba(pedida)) setAba(pedida);
  }, [pedida]);

  const TABS: { key: Aba; label: string; sub: string }[] = [
    { key: "correcoes", label: t("updates.tab.fixes"), sub: t("updates.tab.fixesSub") },
    { key: "github", label: t("updates.tab.github"), sub: t("updates.tab.githubSub") },
    { key: "manuais", label: t("updates.tab.manual"), sub: t("updates.tab.manualSub") },
    { key: "implementacoes", label: t("updates.tab.impl"), sub: t("updates.tab.implSub") },
    { key: "animacoes", label: t("updates.tab.animations"), sub: t("updates.tab.animationsSub") },
    { key: "builds", label: t("updates.tab.builds"), sub: t("updates.tab.buildsSub") },
    { key: "linha", label: t("updates.tab.timeline"), sub: t("updates.tab.timelineSub") },
  ];

  const CONTEUDO: Record<AbaMd, string> = {
    correcoes: correcoesMd,
    implementacoes: implementacoesMd,
    animacoes: animacoesMd,
    builds: buildsMd,
    linha: linhaMd,
  };

  const trocar = (key: Aba) => {
    setAba(key);
    window.history.replaceState(null, "", `#/atualizacoes/${key}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("updates.kicker")}</span>
          <h1>{t("updates.title")}</h1>
          <p>{t("updates.lead")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label={t("updates.stat.fixed")} value="12" hint={t("updates.stat.fixedHint")} tone="lime" />
        <Stat label={t("updates.stat.impl")} value="11" hint={t("updates.stat.implHint")} tone="blue" />
        <Stat label={t("updates.stat.animations")} value="1.390" hint={t("updates.stat.animationsHint")} tone="violet" />
        <Stat label={t("updates.stat.open")} value="1" hint={t("updates.stat.openHint")} tone="amber" />
      </section>

      <div className="hero-actions" style={{ marginBottom: 4 }}>
        <button className="btn primary" onClick={() => navigate("passo-a-passo")}>
          {t("updates.step")}
        </button>
        <button className="btn ghost" onClick={() => navigate("pendencias")}>
          {t("updates.pending")}
        </button>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${aba === tab.key ? "on" : ""}`}
            onClick={() => trocar(tab.key)}
          >
            <strong>{tab.label}</strong>
            <small>{tab.sub}</small>
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
