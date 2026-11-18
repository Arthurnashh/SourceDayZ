import { getFerramentas, useAsync } from "../lib/data";
import { CopyButton, ErrorBox, Loading, SectionTitle } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";

export function Tools() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getFerramentas(locale), [locale]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const total = (data ?? []).reduce((s, tool) => s + tool.linhas, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("tools.kicker")}</span>
          <h1>{t("tools.title")}</h1>
          <p>
            {t("tools.lead", {
              n: (data ?? []).length,
              lines: total.toLocaleString(locale === "pt" ? "pt-BR" : locale),
            })}
          </p>
        </div>
      </div>

      <div className="tools-grid">
        {(data ?? []).map((tool) => (
          <article className="tool" key={tool.nome}>
            <header>
              <span className="tool-dot" />
              <code>{tool.nome}</code>
              <small>{t("tools.lines", { n: tool.linhas })}</small>
            </header>
            <p>{tool.descricao}</p>
            <div className="tool-cmd">
              <code>python tools\{tool.nome}</code>
              <CopyButton text={`python tools\\${tool.nome}`} />
            </div>
          </article>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="pipeline" title={t("tools.how")} />
        <ol className="steps">
          <li><code>python tools\scan_comments.py</code> — {t("tools.step.scan")}</li>
          <li><code>python tools\annotate_comments.py</code> — {t("tools.step.annotate")}</li>
          <li><code>python tools\build_site_data.py</code> — {t("tools.step.build")}</li>
          <li><code>python tools\build_docs_data.py</code> — {t("tools.step.docs")}</li>
          <li><code>cd site &amp;&amp; npm install &amp;&amp; npm run dev</code> — {t("tools.step.dev")}</li>
        </ol>
      </section>
    </div>
  );
}
