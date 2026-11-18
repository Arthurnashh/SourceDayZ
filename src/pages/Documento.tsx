import { useMemo, useState } from "react";
import { getDoc, useAsync } from "../lib/data";
import type { DocSecao } from "../types";
import { ErrorBox, Loading, SearchInput } from "../components/ui";
import { Md } from "../components/Md";

export function Documento() {
  const { data, error, loading } = useAsync(getDoc);
  const [sel, setSel] = useState(0);
  const [q, setQ] = useState("");
  const [abertos, setAbertos] = useState<Set<number>>(() => new Set([0]));

  const secoes = data?.secoes ?? [];

  const ancestrais = useMemo(() => {
    if (!secoes.length) return [];
    const chain: number[] = [];
    let nivelAlvo = secoes[sel]?.nivel ?? 1;
    for (let i = sel - 1; i >= 0 && nivelAlvo > 1; i--) {
      if (secoes[i].nivel < nivelAlvo) {
        chain.unshift(i);
        nivelAlvo = secoes[i].nivel;
      }
    }
    return chain;
  }, [secoes, sel]);

  const resultados = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return [];
    return secoes
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => (s.titulo + " " + s.md).toLowerCase().includes(needle))
      .slice(0, 60);
  }, [secoes, q]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const atual: DocSecao | undefined = secoes[sel];
  if (!atual) return null;

  const toggle = (i: number) => {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const abrir = (i: number) => {
    setSel(i);
    const add = new Set(abertos);
    let nivel = secoes[i].nivel;
    for (let k = i - 1; k >= 0 && nivel > 1; k--) {
      if (secoes[k].nivel < nivel) {
        add.add(k);
        nivel = secoes[k].nivel;
      }
    }
    setAbertos(add);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderTree = (i: number, depth: number) => {
    const s = secoes[i];
    const temFilhos = s.filhos.length > 0;
    const aberto = abertos.has(i);
    return (
      <div key={i} className="doc-node">
        <button
          className={`doc-link d${Math.min(depth, 3)} ${sel === i ? "on" : ""}`}
          onClick={() => abrir(i)}
          title={s.titulo}
        >
          {temFilhos ? (
            <span
              className={`doc-caret ${aberto ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); toggle(i); }}
            >
              ▸
            </span>
          ) : (
            <span className="doc-caret ghost" />
          )}
          <span className="doc-label">{s.titulo}</span>
          <small>{s.linhas}</small>
        </button>
        {aberto && temFilhos && s.filhos.map((f) => renderTree(f, depth + 1))}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">documento-mestre</span>
          <h1>Documento</h1>
          <p>
            O <code>1.md</code> inteiro, fatiado em {data.secoes.length} seções navegáveis:
            {" "}{data.linhas.toLocaleString("pt-BR")} linhas, {(data.bytes / 1024).toFixed(0)} KB
            de estudo da source — método, linguagens, funções, DX11 e motor.
          </p>
        </div>
      </div>

      <div className="doc-layout">
        <aside className="doc-pane">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar no documento..." />
          {q ? (
            <div className="doc-results">
              {resultados.map(({ s, i }) => (
                <button key={i} className="doc-result" onClick={() => { abrir(i); setQ(""); }}>
                  <small>nível {s.nivel} · linha {s.linha}</small>
                  <span>{s.titulo}</span>
                </button>
              ))}
              {!resultados.length && <div className="empty">Nada encontrado.</div>}
            </div>
          ) : (
            <nav className="doc-tree">
              {data.raizes.map((r) => renderTree(r, 0))}
            </nav>
          )}
        </aside>

        <article className="doc-main">
          {ancestrais.length > 0 && (
            <div className="doc-breadcrumb">
              {ancestrais.map((a) => (
                <button key={a} onClick={() => abrir(a)}>{secoes[a].titulo}</button>
              ))}
            </div>
          )}
          <div className="doc-meta">
            <span className="chip">linha {atual.linha}</span>
            <span className="chip">{atual.linhas} linhas de texto</span>
            <span className="chip">nível {atual.nivel}</span>
          </div>
          <h2 className="doc-title">{atual.titulo}</h2>
          <Md text={atual.md} />

          {atual.filhos.length > 0 && (
            <div className="doc-children">
              <h4>Subseções ({atual.filhos.length})</h4>
              <div className="doc-chips">
                {atual.filhos.map((f) => (
                  <button key={f} onClick={() => abrir(f)}>
                    {secoes[f].titulo}
                    <small>{secoes[f].linhas}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="doc-nav">
            <button disabled={sel <= 0} onClick={() => abrir(Math.max(0, sel - 1))}>← anterior</button>
            <button disabled={sel >= secoes.length - 1} onClick={() => abrir(Math.min(secoes.length - 1, sel + 1))}>próxima →</button>
          </div>
        </article>
      </div>
    </div>
  );
}
