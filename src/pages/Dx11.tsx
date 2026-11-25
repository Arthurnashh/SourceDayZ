import { navigate } from "../lib/router";
import { Badge, Bars, SectionTitle, Stat } from "../components/ui";
import {
  DX11_PHASES,
  DX11_RULES,
  DX11_STAGES,
  DX11_STATS,
  DX11_TARGETS,
  useDx11T,
} from "../content/dx11-i18n";

const STATUS_TONE: Record<string, string> = {
  done: "lime",
  doing: "amber",
  next: "blue",
  blocked: "red",
};

export function Dx11() {
  const { t, tr, locale } = useDx11T();
  const pct = Math.round((DX11_STATS.done / DX11_STATS.phases) * 100);
  const heaviest = [...DX11_TARGETS]
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 7)
    .map((f) => ({ label: f.file.split("\\").pop() ?? f.file, value: f.calls }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("dx11.kicker")}</span>
          <h1>{t("dx11.title")}</h1>
          <p>{t("dx11.lead")}</p>
        </div>
        <button className="btn primary" onClick={() => navigate("plano")}>
          {t("dx11.next.cta")}
        </button>
      </div>

      <section className="stats-grid">
        <Stat
          label={t("dx11.stat.phases")}
          value={String(DX11_STATS.phases)}
          hint={t("dx11.stat.phasesHint")}
          tone="blue"
        />
        <Stat
          label={t("dx11.stat.done")}
          value={`${DX11_STATS.done}/${DX11_STATS.phases}`}
          hint={`${pct}% · ${t("dx11.stat.doneHint")}`}
          tone="lime"
        />
        <Stat
          label={t("dx11.stat.calls")}
          value={DX11_STATS.calls.toLocaleString(locale === "pt" ? "pt-BR" : "en-US")}
          hint={t("dx11.stat.callsHint")}
          tone="amber"
        />
        <Stat
          label={t("dx11.stat.files")}
          value={String(DX11_STATS.files)}
          hint={t("dx11.stat.filesHint")}
          tone="violet"
        />
      </section>

      <SectionTitle kicker="hoje" title={t("dx11.now.title")} />
      <p className="muted">{t("dx11.now.lead")}</p>
      <div className="grid three">
        {(["mapped", "code", "slot"] as const).map((k) => (
          <section className="panel" key={k}>
            <Badge tone={k === "code" ? "amber" : k === "slot" ? "violet" : "lime"}>
              {t(`dx11.now.${k}`)}
            </Badge>
            <p className="muted small">{t(`dx11.now.${k}Desc`)}</p>
          </section>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="peso" title={t("dx11.targets.title")} />
        <p className="muted small">{t("dx11.targets.lead")}</p>
        <Bars items={heaviest} mono />
      </section>

      <SectionTitle kicker="D0 → D8" title={t("dx11.phases.title")} />
      <p className="muted">{t("dx11.phases.lead")}</p>
      <div className="plano-phases">
        {DX11_PHASES.map((p) => (
          <article className="plano-phase" key={p.id}>
            <div className="plano-phase-head">
              <span className="plano-phase-id">{p.id}</span>
              <strong>{tr(p.title)}</strong>
              <span className="plano-phase-cycles">
                <Badge tone={STATUS_TONE[p.status]}>{t(`dx11.status.${p.status}`)}</Badge>
              </span>
            </div>
            <p className="plano-phase-goal">{tr(p.goal)}</p>

            <div className="plano-phase-grid">
              <div className="plano-phase-block">
                <span className="plano-phase-label">{t("dx11.phase.tasks")}</span>
                <ol>
                  {p.tasks.map((task, i) => (
                    <li key={i}>{tr(task)}</li>
                  ))}
                </ol>
              </div>
              <div className="plano-phase-block">
                <span className="plano-phase-label">{t("dx11.phase.gate")}</span>
                <p>{tr(p.gate)}</p>
                <span className="plano-phase-label">{t("dx11.phase.files")}</span>
                <p>
                  <code>{p.deliverable}</code>
                </p>
              </div>
              <div className="plano-phase-block">
                {p.risk && (
                  <>
                    <span className="plano-phase-label">{t("dx11.phase.risk")}</span>
                    <p>{tr(p.risk)}</p>
                  </>
                )}
                <span className="plano-phase-label">{t("dx11.phase.revert")}</span>
                <p>{tr(p.revert)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <SectionTitle kicker="3 estagios" title={t("dx11.remove.title")} />
      <p className="muted">{t("dx11.remove.lead")}</p>
      <div className="grid three">
        {DX11_STAGES.map((s) => (
          <section className="panel" key={s.id}>
            <Badge tone={s.id === "3" ? "red" : s.id === "2" ? "amber" : "blue"}>{s.id}</Badge>
            <h3>{tr(s.title)}</h3>
            <p>{tr(s.desc)}</p>
          </section>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="17 TUs" title={t("dx11.targets.title")} />
        <p className="muted small">{t("dx11.targets.lead")}</p>
        <div className="plano-table-wrap">
          <table className="plano-table">
            <thead>
              <tr>
                <th>{t("dx11.targets.col.file")}</th>
                <th>{t("dx11.targets.col.calls")}</th>
                <th>{t("dx11.targets.col.until")}</th>
              </tr>
            </thead>
            <tbody>
              {DX11_TARGETS.map((f) => (
                <tr key={f.file}>
                  <td>
                    <code>{f.file}</code>
                  </td>
                  <td className="mono">{f.calls}</td>
                  <td>
                    <Badge tone="blue">{f.until}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionTitle kicker="invariantes" title={t("dx11.rules.title")} />
        <ol className="plano-method">
          {DX11_RULES.map((r, i) => (
            <li key={i}>
              <span>{tr(r)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel plano-first">
        <SectionTitle kicker="D0 · D1" title={t("dx11.next.title")} />
        <p>{t("dx11.next.lead")}</p>
        <p className="mono small">build\buildRelease.bat · docs\d3d11-port\</p>
      </section>
    </div>
  );
}
