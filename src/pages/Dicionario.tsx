import { useMemo, useState } from "react";
import { getGlossario, useAsync, fmt } from "../lib/data";
import { ErrorBox, Loading, SearchInput, Stat } from "../components/ui";

const PAGE = 120;
const LETRAS = ["todas", ..."abcdefghijklmnopqrstuvwxyz".split(""), "#"];

export function Dicionario() {
  const { data, error, loading } = useAsync(getGlossario);
  const [q, setQ] = useState("");
  const [letra, setLetra] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [limite, setLimite] = useState(PAGE);

  const filtrados = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (data?.itens ?? []).filter((it) => {
      if (tipo !== "todos" && it.tipo !== tipo) return false;
      if (letra !== "todas") {
        const c = it.en[0].toLowerCase();
        if (letra === "#" ? /[a-z]/.test(c) : c !== letra) return false;
      }
      if (!needle) return true;
      return it.en.toLowerCase().includes(needle) || it.pt.toLowerCase().includes(needle);
    });
  }, [data, q, letra, tipo]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const visiveis = filtrados.slice(0, limite);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">glossário EN → PT-BR</span>
          <h1>Dicionário</h1>
          <p>
            O glossário determinístico usado pelo anotador de comentários:{" "}
            {fmt(data.total)} entradas. Identificadores técnicos, CamelCase, caminhos e trechos
            entre crases são preservados — só o inglês técnico é traduzido.
          </p>
        </div>
      </div>

      <div className="stats-grid three">
        <Stat label="Entradas" value={fmt(data.total)} hint="frases + termos" tone="lime" />
        <Stat label="Frases" value={fmt(data.frases)} hint="expressões multi-palavra" />
        <Stat label="Termos" value={fmt(data.palavras)} hint="palavra única" tone="blue" />
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setLimite(PAGE); }} placeholder="Buscar em inglês ou português..." />
        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setLimite(PAGE); }}>
          <option value="todos">todos os tipos</option>
          <option value="frase">frases</option>
          <option value="termo">termos</option>
        </select>
        <span className="count">{fmt(filtrados.length)} entrada(s)</span>
      </div>

      <div className="letters">
        {LETRAS.map((l) => (
          <button key={l} className={letra === l ? "on" : ""} onClick={() => { setLetra(l); setLimite(PAGE); }}>
            {l === "todas" ? "todas" : l}
          </button>
        ))}
      </div>

      <div className="dict-grid">
        {visiveis.map((it) => (
          <div className="dict-item" key={it.en + it.tipo}>
            <code className="dict-en">{it.en}</code>
            <span className="dict-arrow">→</span>
            <span className="dict-pt">{it.pt}</span>
            <span className={`dict-tipo ${it.tipo}`}>{it.tipo}</span>
          </div>
        ))}
        {!filtrados.length && <div className="empty">Nenhuma entrada para os filtros atuais.</div>}
      </div>

      {filtrados.length > limite && (
        <div className="pager">
          <button onClick={() => setLimite((v) => v + PAGE)}>
            carregar mais ({fmt(filtrados.length - limite)} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
