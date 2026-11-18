import { useMemo, useState } from "react";
import fpsMd from "../content/fps-cidades.md?raw";
import { getBugs, useAsync } from "../lib/data";
import { Badge, ErrorBox, Loading, SearchInput } from "../components/ui";
import { Md } from "../components/Md";
import { WorkBoard } from "../components/WorkBoard";
import { useWorkStore } from "../lib/work";
import { navigate, useRoute } from "../lib/router";

type Aba = "registro" | "catalogo" | "fps";

export function Bugs() {
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
          <span className="kicker">registro da equipe &amp; catálogo de problemas</span>
          <h1>Bugs &amp; problemas</h1>
          <p>
            O <strong>Registro de bugs</strong> é editável: a equipe adiciona o que descobriu,
            marca como em andamento e, ao corrigir, registra o que era, como resolveu, o que usou
            e quantas tentativas foram necessárias. O <strong>Catálogo</strong> traz {data.total}{" "}
            itens desta build: {data.achados} achados de leitura (A/H/G) e {data.comentarios}{" "}
            marcadores deixados pelos próprios devs (TODO/HACK). A aba <strong>FPS em cidades</strong>{" "}
            mantém o dossiê do drop de 0-1 FPS separado.
          </p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${aba === "registro" ? "on" : ""}`} onClick={() => escolher("registro")}>
          <strong>Registro de bugs</strong>
          <small>adicionar · corrigir · excluir</small>
        </button>
        <button className={`tab ${aba === "catalogo" ? "on" : ""}`} onClick={() => escolher("catalogo")}>
          <strong>Catálogo</strong>
          <small>{data.total} itens categorizados</small>
        </button>
        <button className={`tab ${aba === "fps" ? "on" : ""}`} onClick={() => escolher("fps")}>
          <strong>FPS em cidades</strong>
          <small>dossiê do drop de 0-1 FPS</small>
        </button>
      </div>

      {aba === "registro" && (
        <WorkBoard
          kind="bug"
          store={store}
          title="Registro de bugs"
          intro="Adicione bugs descobertos pela equipe, marque o que está em andamento e registre a correção completa. O catálogo automático da source continua na aba ao lado; este registro é o histórico vivo da equipe."
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
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por ID, sintoma, arquivo..." />
            <select value={sev} onChange={(e) => setSev(e.target.value)}>
              <option value="todas">toda severidade</option>
              <option value="alta">alta</option>
              <option value="média">média</option>
              <option value="melhoria">melhoria</option>
            </select>
            <span className="count">{itens.length} resultado(s)</span>
          </div>

          <div className="cat-row">
            <button className={`cat-pill ${cat === "todas" ? "on" : ""}`} onClick={() => setCat("todas")}>
              todas <small>{data.total}</small>
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
            {!itens.length && <div className="empty">Nenhum item para os filtros atuais.</div>}
          </div>
        </>
      )}
    </div>
  );
}
