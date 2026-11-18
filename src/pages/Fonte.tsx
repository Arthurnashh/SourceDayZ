import { useMemo, useState } from "react";
import estruturaMd from "../content/estrutura.md?raw";
import compilacaoMd from "../content/compilacao.md?raw";
import pboMd from "../content/pbo.md?raw";
import mudancasMd from "../content/mudancas.md?raw";
import { fmt, getSource, useAsync } from "../lib/data";
import { ErrorBox, Loading, SearchInput, Stat } from "../components/ui";
import { Md } from "../components/Md";
import { navigate, useRoute } from "../lib/router";

type Aba = "estrutura" | "compilacao" | "pbo" | "mudancas";

const TABS: { key: Aba; label: string; sub: string }[] = [
  { key: "estrutura", label: "Estrutura", sub: "árvore real medida" },
  { key: "mudancas", label: "Mudanças", sub: "patches compilados" },
  { key: "compilacao", label: "Compilação", sub: "v141 · MSBuild 15" },
  { key: "pbo", label: "PBOs", sub: "formato, bits e ferramentas" },
];

const VALIDAS: Aba[] = ["estrutura", "compilacao", "pbo", "mudancas"];

function bytes(n: number): string {
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

export function Fonte() {
  const { data, error, loading } = useAsync(getSource);
  const route = useRoute();
  const inicial = route.parts[1] as Aba | undefined;
  const [aba, setAba] = useState<Aba>(
    inicial && VALIDAS.includes(inicial) ? inicial : "estrutura"
  );
  const [aberto, setAberto] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const escolher = (a: Aba) => {
    setAba(a);
    navigate(a === "estrutura" ? "fonte" : `fonte/${a}`);
  };

  const dirs = useMemo(() => {
    const lista = data?.dirs ?? [];
    const needle = q.toLowerCase().trim();
    if (!needle) return lista;
    return lista.filter(
      (d) =>
        d.nome.toLowerCase().includes(needle) ||
        d.nota.toLowerCase().includes(needle) ||
        d.filhos.some((f) => f.nome.toLowerCase().includes(needle))
    );
  }, [data, q]);

  const maior = Math.max(1, ...(data?.dirs ?? []).map((d) => d.bytes));

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">código-fonte original · patches compilados e testados</span>
          <h1>Código-fonte</h1>
          <p>
            A árvore real do projeto da Bohemia Interactive: {fmt(data.total.pastas)} pastas e{" "}
            {fmt(data.total.arquivos)} arquivos ({bytes(data.total.bytes)}) medidos nesta máquina.
            O código está em <code>{data.raiz}</code> — e esta árvore já foi modificada e
            recompilada: colisão de zumbi, inclinação ao correr, inventário e menu.
          </p>
        </div>
        <button className="btn primary" onClick={() => navigate("fonte/mudancas")}>Ver mudanças →</button>
      </div>

      <div className="src-path">
        <span>raiz do projeto</span>
        <code>{data.raiz}</code>
        <small>medido em {data.medido_em}</small>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${aba === t.key ? "on" : ""}`} onClick={() => escolher(t.key)}>
            <strong>{t.label}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>

      {aba === "estrutura" ? (
        <>
          <div className="stats-grid three">
            <Stat label="Arquivos de código" value={fmt(data.total.arquivos)} hint="sem build/ e dist/" tone="lime" />
            <Stat label="Tamanho medido" value={bytes(data.total.bytes)} hint="arquivo por arquivo" />
            <Stat label="Pastas de 1º nível" value={fmt(data.total.pastas)} hint="mais as geradas" tone="blue" />
          </div>

          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Filtrar pasta, nota ou subpasta..." />
            <span className="count">{dirs.length} pasta(s)</span>
          </div>

          <div className="src-list">
            {dirs.map((d) => {
              const on = aberto === d.nome;
              const pct = Math.max(2, (d.bytes / maior) * 100);
              return (
                <div className={`src-row ${on ? "on" : ""}`} key={d.nome}>
                  <button className="src-head" onClick={() => setAberto(on ? null : d.nome)}>
                    <span className={`src-caret ${on ? "open" : ""}`}>▸</span>
                    <code className="src-name">{d.nome}/</code>
                    <span className="src-nota">{d.nota}</span>
                    <span className="src-files">{fmt(d.arquivos)} arq.</span>
                    <span className="src-size">{bytes(d.bytes)}</span>
                  </button>
                  <div className="src-bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  {on && d.filhos.length > 0 && (
                    <div className="src-children">
                      {d.filhos.map((f) => (
                        <div className="src-child" key={f.nome}>
                          <code>{f.nome}/</code>
                          <span>{fmt(f.arquivos)} arq.</span>
                          <strong>{bytes(f.bytes)}</strong>
                        </div>
                      ))}
                      {d.filhos_total > d.filhos.length && (
                        <small className="src-more">
                          +{d.filhos_total - d.filhos.length} subpastas não exibidas
                        </small>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!dirs.length && <div className="empty">Nenhuma pasta para o filtro atual.</div>}
          </div>

          <section className="panel src-generated">
            <h3>Pastas geradas (não são código)</h3>
            <div className="src-gen-row">
              {data.geradas.map((g) => (
                <div key={g.nome}>
                  <code>{g.nome}/</code>
                  <span>{fmt(g.arquivos)} arquivos</span>
                  <strong>{bytes(g.bytes)}</strong>
                </div>
              ))}
            </div>
            <div className="src-root-files">
              {data.arquivos_raiz.map((f) => (
                <div key={f.nome}>
                  <code>{f.nome}</code>
                  <span>{f.nota}</span>
                  <strong>{bytes(f.bytes)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel article">
            <Md text={estruturaMd} />
          </section>
        </>
      ) : (
        <section className="panel article">
          <Md
            text={
              aba === "compilacao" ? compilacaoMd : aba === "mudancas" ? mudancasMd : pboMd
            }
          />
        </section>
      )}
    </div>
  );
}
