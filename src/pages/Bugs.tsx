import { useMemo, useState } from "react";
import { getBugs, useAsync } from "../lib/data";
import { Badge, ErrorBox, Loading, SearchInput } from "../components/ui";
import { Md } from "../components/Md";
import { WorkBoard } from "../components/WorkBoard";
import { useWorkStore } from "../lib/work";
import { navigate, useRoute } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

type Aba = "registro" | "catalogo" | "fps";

export function Bugs() {
  const { t } = useDocsT();
  const fpsMd = useMd("fps-cidades");
  const { data, error, loading } = useAsync(getBugs);
  const store = useWorkStore();
  const route = useRoute();
  const [aba, setAba] = useState<Aba>(
    route.parts[1] === "fps"
      ? "fps"
      : route.parts[1] === "catalogo"
        ? "catalogo"
        : "registro"
  );
  const [cat, setCat] = useState("todas");
  const [sev, setSev] = useState("todas");
  const [q, setQ] = useState("");

  const escolher = (a: Aba) => {
    setAba(a);
    navigate(a === "fps" ? "bugs/fps" : a === "catalogo" ? "bugs/catalogo" : "bugs");
  };

  const itens = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data?.itens ?? []).filter((b) => {
      if (cat !== "todas" && !b.cats.includes(cat)) return false;
      if (sev !== "todas" && b.severidade !== sev) return false;
      if (!needle) return true;
      return [b.id, b.titulo, b.local, b.texto, Object.values(b.campos).join(" ")]
        .join(" ").toLowerCase().includes(needle);
    });
  }, [data, cat, sev, q]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("bugs.kicker")}</span>
          <h1>{t("bugs.title")}</h1>
          <p>
            {t("bugs.lead", {
              total: data.total,
              findings: data.achados,
              comments: data.comentarios,
            })}
          </p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${aba === "registro" ? "on" : ""}`} onClick={() => escolher("registro")}>
          <strong>{t("bugs.tab.registry")}</strong>
          <small>{t("bugs.tab.registrySub")}</small>
        </button>
        <button className={`tab ${aba === "catalogo" ? "on" : ""}`} onClick={() => escolher("catalogo")}>
          <strong>{t("bugs.tab.catalog")}</strong>
          <small>{t("bugs.tab.catalogSub", { n: data.total })}</small>
        </button>
        <button className={`tab ${aba === "fps" ? "on" : ""}`} onClick={() => escolher("fps")}>
          <strong>{t("bugs.tab.fps")}</strong>
          <small>{t("bugs.tab.fpsSub")}</small>
        </button>
      </div>

      {aba === "registro" && (
        <WorkBoard
          kind="bug"
          store={store}
          title={t("bugs.tab.registry")}
          intro={t("bugs.registryIntro")}
        />
      )}

      {aba === "fps" && (
        <section className="panel article">
          <Md text={fpsMd} />
        </section>
      )}

      {aba === "catalogo" && (
        <>
          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder={t("bugs.search")} />
            <select value={sev} onChange={(e) => setSev(e.target.value)}>
              <option value="todas">{t("bugs.severity.all")}</option>
              <option value="alta">{t("bugs.severity.high")}</option>
              <option value="média">{t("bugs.severity.medium")}</option>
              <option value="melhoria">{t("bugs.severity.improvement")}</option>
            </select>
            <span className="count">{t("common.results", { n: itens.length })}</span>
          </div>

          <div className="cat-row">
            <button className={`cat-pill ${cat === "todas" ? "on" : ""}`} onClick={() => setCat("todas")}>
              {t("common.all")} <small>{data.total}</small>
            </button>
            {data.categorias.filter((c) => c.total > 0).map((c) => (
              <button key={c.slug} className={`cat-pill ${cat === c.slug ? "on" : ""}`} onClick={() => setCat(c.slug)}>
                {c.nome} <small>{c.total}</small>
              </button>
            ))}
          </div>

          <div className="bug-grid">
            {itens.map((b) => (
              <article className={`bug ${b.id[0].toLowerCase()}`} key={b.id}>
                <header>
                  <Badge tone={b.id.startsWith("A") ? "violet" : b.id.startsWith("H") ? "amber" : b.id.startsWith("G") ? "blue" : "red"}>
                    {b.id}
                  </Badge>
                  <span className={`sev ${b.severidade}`}>{b.severidade}</span>
                  <span className="bug-origem">{b.origem}</span>
                </header>
                <h3>{b.titulo}</h3>
                {b.local && <code className="bug-local">{b.local}</code>}
                <dl>
                  {Object.entries(b.campos).filter(([k]) => k !== "Local").slice(0, 4).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="bug-cats">
                  {b.cats.map((c) => <span key={c}>{c}</span>)}
                </div>
              </article>
            ))}
            {!itens.length && <div className="empty">{t("bugs.empty")}</div>}
          </div>
        </>
      )}
    </div>
  );
}
