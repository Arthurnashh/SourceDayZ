import { useMemo, useState } from "react";
import { getAchados, useAsync } from "../lib/data";
import { Badge, ErrorBox, Loading, SearchInput } from "../components/ui";

type Filtro = "todos" | "A" | "H" | "G";

const LABEL: Record<string, string> = {
  A: "Arquitetura / bug concreto",
  H: "Hipótese / risco a confirmar",
  G: "Ganho visual (DX11)"
};

export function Findings() {
  const { data, error, loading } = useAsync(getAchados);
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
          <span className="kicker">catálogo de problemas</span>
          <h1>Achados</h1>
          <p>
            {counts.A} achados de arquitetura, {counts.H} hipóteses/riscos e {counts.G} ganhos visuais
            mapeados durante a leitura — todos com local e evidência.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por ID, problema, arquivo..." />
        <div className="segmented">
          {(["todos", "A", "H", "G"] as Filtro[]).map((f) => (
            <button key={f} className={filtro === f ? "on" : ""} onClick={() => setFiltro(f)}>
              {f === "todos" ? "todos" : f}
            </button>
          ))}
        </div>
        <span className="count">{items.length} resultado(s)</span>
      </div>

      <div className="finding-grid">
        {items.map((a) => (
          <article className={`finding ${a.id[0].toLowerCase()}`} key={a.id}>
            <header>
              <Badge tone={a.id.startsWith("A") ? "violet" : a.id.startsWith("H") ? "amber" : "blue"}>{a.id}</Badge>
              <span className="finding-type">{LABEL[a.id[0]]}</span>
            </header>
            <h3>{a.resumo}</h3>
            <dl>
              {Object.entries(a.campos).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {a.texto && <p className="finding-extra">{a.texto}</p>}
          </article>
        ))}
        {!items.length && <div className="empty">Nenhum achado para os filtros atuais.</div>}
      </div>
    </div>
  );
}
