import { useMemo, useState } from "react";
import { getAchados, useAsync } from "../lib/data";
import { Badge, ErrorBox, Loading, SearchInput } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";

type Filtro = "todos" | "A" | "H" | "G";

const LABEL_KEY: Record<string, string> = {
  A: "findings.type.A",
  H: "findings.type.H",
  G: "findings.type.G"
};

export function Findings() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getAchados(locale), [locale]);
  const label = (key: string) => {
    const id = `data.field.${key}`;
    const texto = t(id);
    return texto === id ? key : texto;
  };
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data ?? []).filter((a) => {
      if (filtro !== "todos" && !a.id.startsWith(filtro)) return false;
      if (!needle) return true;
      return [a.id, a.resumo, a.texto, Object.values(a.campos).join(" ")]
        .join(" ").toLowerCase().includes(needle);
    });
  }, [data, filtro, q]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const counts = {
    A: (data ?? []).filter((a) => a.id.startsWith("A-")).length,
    H: (data ?? []).filter((a) => a.id.startsWith("H-")).length,
    G: (data ?? []).filter((a) => a.id.startsWith("G-")).length
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("findings.kicker")}</span>
          <h1>{t("findings.title")}</h1>
          <p>{t("findings.lead", { a: counts.A, h: counts.H, g: counts.G })}</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={t("findings.search")} />
        <div className="segmented">
          {(["todos", "A", "H", "G"] as Filtro[]).map((f) => (
            <button key={f} className={filtro === f ? "on" : ""} onClick={() => setFiltro(f)}>
              {f === "todos" ? t("common.all") : f}
            </button>
          ))}
        </div>
        <span className="count">{t("common.results", { n: items.length })}</span>
      </div>

      <div className="finding-grid">
        {items.map((a) => (
          <article className={`finding ${a.id[0].toLowerCase()}`} key={a.id}>
            <header>
              <Badge tone={a.id.startsWith("A") ? "violet" : a.id.startsWith("H") ? "amber" : "blue"}>{a.id}</Badge>
              <span className="finding-type">{t(LABEL_KEY[a.id[0]])}</span>
            </header>
            <h3>{a.resumo}</h3>
            <dl>
              {Object.entries(a.campos).map(([k, v]) => (
                <div key={k}>
                  <dt>{label(k)}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {a.texto && <p className="finding-extra">{a.texto}</p>}
          </article>
        ))}
        {!items.length && <div className="empty">{t("findings.empty")}</div>}
      </div>
    </div>
  );
}
