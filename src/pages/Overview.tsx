import { getAchados, getFuncoes, getMeta, getPatches, fmt, useAsync } from "../lib/data";
import { navigate } from "../lib/router";
import { Bars, Badge, Loading, ErrorBox, SectionTitle, Stat } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";
import { usePlanoT } from "../content/plano-i18n";

export function Overview() {
  const { t } = useDocsT();
  const { t: tp } = usePlanoT();
  const meta = useAsync(getMeta);
  const funcs = useAsync(getFuncoes);
  const achados = useAsync(getAchados);
  const patches = useAsync(getPatches);

  if (meta.loading || funcs.loading) return <Loading />;
  if (meta.error) return <ErrorBox message={meta.error} />;
  if (!meta.data || !funcs.data) return null;

  const m = meta.data;
  const pct = Math.round((m.completas / Math.max(1, m.funcoes)) * 100);
  const recentesA = (achados.data ?? []).filter((a) => a.id.startsWith("A-") && Number(a.id.slice(2)) >= 73);
  const recentesH = (achados.data ?? []).filter((a) => a.id.startsWith("H-") && Number(a.id.slice(2)) >= 64);
  const ultimos = (patches.data ?? []).slice(-6).reverse();

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-body">
          <Badge tone="accent">{t("overview.kicker")}</Badge>
          <h1>{t("overview.title1")}<br />{t("overview.title2")}</h1>
          <p>{t("overview.lead")}</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate("funcoes")}>{t("overview.explore")}</button>
            <button className="btn" onClick={() => navigate("plano")}>{tp("plano.cta")}</button>
            <button className="btn" onClick={() => navigate("fonte/mudancas")}>{t("overview.changes")}</button>
            <button className="btn ghost" onClick={() => navigate("diagrama")}>{t("overview.diagram")}</button>
            <button className="btn ghost" onClick={() => navigate("bugs")}>{t("overview.bugs")}</button>
            <button className="btn ghost" onClick={() => navigate("atualizacoes")}>{t("overview.updates")}</button>
            <button className="btn ghost" onClick={() => navigate("pendencias")}>{t("overview.pending")}</button>
          </div>
        </div>
        <div className="hero-side">
          <div className="ring" style={{ ["--p" as string]: `${pct}%` }}>
            <div className="ring-inner">
              <strong>{pct}%</strong>
              <span>{t("overview.completeFunctions")}</span>
            </div>
          </div>
          <small>{t("overview.closedEntries", { done: m.completas, total: m.funcoes })}</small>
        </div>
      </section>

      <section className="stats-grid">
        <Stat label={t("overview.stat.functions")} value={fmt(m.funcoes)} hint={t("overview.stat.functionsHint", { done: m.completas, partial: m.parciais })} tone="lime" />
        <Stat label={t("overview.stat.comments")} value={fmt(m.comentarios)} hint={t("overview.stat.commentsHint", { n: fmt(m.arquivosComentados) })} />
        <Stat label={t("overview.stat.patches")} value={fmt(m.patches)} hint={t("overview.stat.patchesHint")} tone="blue" />
        <Stat label={t("overview.stat.pending")} value={fmt(m.alertas)} hint={t("overview.stat.pendingHint")} tone="amber" />
        <Stat label={t("overview.stat.findings")} value={fmt(m.achados)} hint={t("overview.stat.findingsHint")} tone="violet" />
        <Stat label={t("overview.stat.tools")} value={fmt(m.ferramentas)} hint={t("overview.stat.toolsHint")} />
      </section>

      <div className="grid two">
        <section className="panel">
          <SectionTitle kicker="corpus" title={t("overview.languages")} />
          <Bars
            items={m.porLinguagem.map((l) => ({ label: l.nome, value: l.valor }))}
          />
        </section>
        <section className="panel">
          <SectionTitle kicker="top" title={t("overview.topFiles")} />
          <Bars
            mono
            items={m.topFiles.slice(0, 9).map((f) => ({
              label: f.file.split("/").slice(-2).join("/"),
              value: f.comentarios
            }))}
          />
        </section>
      </div>

      <div className="grid two">
        <section className="panel">
          <SectionTitle
            kicker="portability"
            title={t("overview.recentFindings")}
            right={<button className="link" onClick={() => navigate("achados")}>{t("common.viewAll")}</button>}
          />
          <ul className="finding-list">
            {[...recentesA, ...recentesH].map((a) => (
              <li key={a.id}>
                <Badge tone={a.id.startsWith("A") ? "violet" : "amber"}>{a.id}</Badge>
                <span>{a.resumo}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <SectionTitle
            kicker="history"
            title={t("overview.recentPatches")}
            right={<button className="link" onClick={() => navigate("patches")}>{t("common.viewAll")}</button>}
          />
          <ul className="patch-mini">
            {ultimos.map((p) => (
              <li key={p.id}>
                <span className="patch-id">#{p.id}</span>
                <div>
                  <strong>{p.texto.slice(0, 90)}{p.texto.length > 90 ? "…" : ""}</strong>
                  <small>{p.data} · {p.autor} · <code>{p.arquivo}:{p.linha}</code></small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <SectionTitle kicker="reading" title={t("overview.whereToStart")} />
        <div className="quick">
          <button className="quick-card" onClick={() => navigate("funcoes/F-170")}>
            <span>{t("overview.quick.function")}</span>
            <strong>F-170 · DoSelectPixelShader</strong>
            <p>{t("overview.quick.functionDesc")}</p>
          </button>
          <button className="quick-card" onClick={() => navigate("comentarios")}>
            <span>{t("overview.quick.comments")}</span>
            <strong>{t("overview.quick.commentsTitle")}</strong>
            <p>{t("overview.quick.commentsDesc")}</p>
          </button>
          <button className="quick-card" onClick={() => navigate("bugs")}>
            <span>{t("overview.quick.performance")}</span>
            <strong>{t("overview.quick.performanceTitle")}</strong>
            <p>{t("overview.quick.performanceDesc")}</p>
          </button>
          <button className="quick-card" onClick={() => navigate("linguagens")}>
            <span>{t("overview.quick.script")}</span>
            <strong>{t("overview.quick.scriptTitle")}</strong>
            <p>{t("overview.quick.scriptDesc")}</p>
          </button>
          <button className="quick-card" onClick={() => navigate("fonte/mudancas")}>
            <span>{t("overview.quick.project")}</span>
            <strong>{t("overview.quick.projectTitle")}</strong>
            <p>{t("overview.quick.projectDesc")}</p>
          </button>
        </div>
      </section>
    </div>
  );
}
