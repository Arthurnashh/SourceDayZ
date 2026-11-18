import { Md } from "../components/Md";
import { Stat } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

export function PassoAPasso() {
  const { t } = useDocsT();
  const passoMd = useMd("passo-a-passo");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("walkthrough.kicker")}</span>
          <h1>{t("walkthrough.title")}</h1>
          <p>{t("walkthrough.lead")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label={t("walkthrough.stat.steps")} value="12" hint={t("walkthrough.stat.stepsHint")} tone="blue" />
        <Stat label={t("walkthrough.stat.rtms")} value="7.415" hint={t("walkthrough.stat.rtmsHint")} tone="violet" />
        <Stat label={t("walkthrough.stat.files")} value="1.526" hint={t("walkthrough.stat.filesHint")} tone="lime" />
        <Stat label={t("walkthrough.stat.trim")} value="−23,45%" hint={t("walkthrough.stat.trimHint")} tone="amber" />
      </section>

      <section className="panel article">
        <Md text={passoMd} />
      </section>
    </div>
  );
}
