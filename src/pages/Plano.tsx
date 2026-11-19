import { navigate } from "../lib/router";
import { SectionTitle, Badge, Stat } from "../components/ui";
import { CYCLES, PENDING, PHASES, PLANO_COPY, usePlanoT } from "../content/plano-i18n";

const PILLAR_TONE: Record<string, string> = {
  light: "amber",
  shadow: "violet",
  atmo: "blue",
  sky: "lime",
  night: "red",
};

const PILLAR_LABEL: Record<string, Record<string, string>> = {
  light: { pt: "luz", en: "light", ru: "свет" },
  shadow: { pt: "sombra", en: "shadow", ru: "тень" },
  atmo: { pt: "atmosfera", en: "atmosphere", ru: "атмосфера" },
  sky: { pt: "céu", en: "sky", ru: "небо" },
  night: { pt: "noite", en: "night", ru: "ночь" },
};

export function Plano() {
  const { t, tr, locale } = usePlanoT();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("plano.kicker")}</span>
          <h1>{t("plano.title")}</h1>
          <p>{t("plano.lead")}</p>
        </div>
        <button className="btn primary" onClick={() => navigate("motor")}>
          {locale === "pt" ? "Ver o motor" : locale === "en" ? "See the engine" : "Смотреть движок"}
        </button>
      </div>

      <section className="stats-grid">
        <Stat
          label={locale === "pt" ? "pilares" : locale === "en" ? "pillars" : "опоры"}
          value="3"
          hint={locale === "pt" ? "luz · sombra · atmosfera" : locale === "en" ? "light · shadow · atmosphere" : "свет · тень · атмосфера"}
          tone="lime"
        />
        <Stat
          label={locale === "pt" ? "fases" : locale === "en" ? "phases" : "фазы"}
          value={String(PHASES.length)}
          hint={locale === "pt" ? "F0 a F6" : locale === "en" ? "F0 to F6" : "F0 — F6"}
          tone="blue"
        />
        <Stat
          label={locale === "pt" ? "ciclos" : locale === "en" ? "cycles" : "циклы"}
          value={String(CYCLES.length)}
          hint={locale === "pt" ? "um por compilação" : locale === "en" ? "one per build" : "один на сборку"}
          tone="amber"
        />
        <Stat
          label={locale === "pt" ? "pendências" : locale === "en" ? "open items" : "открытые вопросы"}
          value={String(PENDING.length)}
          hint={locale === "pt" ? "só com teste" : locale === "en" ? "test only" : "только с тестом"}
        />
      </section>

      <SectionTitle kicker="dx9" title={t("plano.pillars.title")} />
      <div className="grid three">
        {(["light", "shadow", "atmo"] as const).map((key) => (
          <section className="panel" key={key}>
            <Badge tone={PILLAR_TONE[key]}>{PILLAR_LABEL[key][locale] ?? PILLAR_LABEL[key].pt}</Badge>
            <h3>{t(`plano.pillar.${key}.title`)}</h3>
            <p>{t(`plano.pillar.${key}.desc`)}</p>
          </section>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="1 → 5" title={t("plano.method.title")} />
        <p className="muted">{t("plano.method.lead")}</p>
        <ol className="plano-method">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n}>
              <strong>{t(`plano.method.s${n}.t`)}</strong>
              <span>{t(`plano.method.s${n}.d`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <SectionTitle kicker="F0 → F6" title={t("plano.phases.title")} />
      <p className="muted">{t("plano.phases.lead")}</p>
      <div className="plano-phases">
        {PHASES.map((p) => (
          <article className="plano-phase" key={p.id}>
            <div className="plano-phase-head">
              <span className="plano-phase-id">{p.id}</span>
              <strong>{tr(p.title)}</strong>
              {p.cycles.length > 0 && (
                <span className="plano-phase-cycles">
                  {p.cycles.map((c) => (
                    <Badge key={c} tone="blue">#{c}</Badge>
                  ))}
                </span>
              )}
            </div>
            <p>{tr(p.goal)}</p>
            <small>{tr(p.exit)}</small>
          </article>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="ordem" title={t("plano.cycles.title")} />
        <p className="muted">{t("plano.cycles.lead")}</p>
        <div className="plano-table-wrap">
          <table className="plano-table">
            <thead>
              <tr>
                <th>{t("plano.cycles.col.n")}</th>
                <th>{t("plano.cycles.col.pillar")}</th>
                <th>{t("plano.cycles.col.change")}</th>
                <th>{t("plano.cycles.col.expect")}</th>
                <th>{t("plano.cycles.col.revert")}</th>
              </tr>
            </thead>
            <tbody>
              {CYCLES.map((c) => (
                <tr key={c.n}>
                  <td className="mono">{c.n}</td>
                  <td><Badge tone={PILLAR_TONE[c.pillar]}>{PILLAR_LABEL[c.pillar][locale] ?? PILLAR_LABEL[c.pillar].pt}</Badge></td>
                  <td>
                    <strong>{tr(c.change)}</strong>
                    <code>{c.where}</code>
                  </td>
                  <td>{tr(c.expect)}</td>
                  <td className="mono">{tr(c.revert)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionTitle kicker="aberto" title={t("plano.pending.title")} />
        <p className="muted">{t("plano.pending.lead")}</p>
        <ul className="plano-pending">
          {PENDING.map((p) => (
            <li key={p.id}>
              <Badge tone="amber">{p.id}</Badge>
              <span>{tr(p.text)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel plano-first">
        <SectionTitle kicker="ciclo 1" title={t("plano.first.title")} />
        <p>{t("plano.first.lead")}</p>
        <p className="muted">{t("plano.first.why")}</p>
        <p className="muted">{t("plano.first.check")}</p>
        <p className="muted">{t("plano.first.test")}</p>
        <p className="mono small">{t("plano.first.revert")}</p>
      </section>
    </div>
  );
}

export const PLANO_KEYS = Object.keys(PLANO_COPY);
