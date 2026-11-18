import { useMemo, useState } from "react";
import { getDoc, useAsync } from "../lib/data";
import type { DocSecao } from "../types";
import { ErrorBox, Loading, SearchInput } from "../components/ui";
import { Md } from "../components/Md";
import { useDocsT } from "../content/docs-i18n";
import { docsTitle } from "../content/docs-titles";

export function Documento() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getDoc(locale), [locale]);
  const [sel, setSel] = useState(0);
  const [q, setQ] = useState("");
  const [abertos, setAbertos] = useState<Set<number>>(() => new Set([0]));

  const secoes = data?.secoes ?? [];
  const titulo = (s: DocSecao) => docsTitle(locale, s.titulo);

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
      .filter(({ s }) =>
        (docsTitle(locale, s.titulo) + " " + s.titulo + " " + s.md).toLowerCase().includes(needle)
      )
      .slice(0, 60);
  }, [secoes, q, locale]);

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
          title={titulo(s)}
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
          <span className="doc-label">{titulo(s)}</span>
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
          <span className="kicker">{t("doc.kicker")}</span>
          <h1>{t("doc.title")}</h1>
          <p>
            {t("doc.lead", {
              sections: data.secoes.length,
              lines: data.linhas.toLocaleString(locale === "pt" ? "pt-BR" : locale),
              kb: Math.round(data.bytes / 1024),
            })}
          </p>
        </div>
      </div>

      <div className="doc-layout">
        <aside className="doc-pane">
          <SearchInput value={q} onChange={setQ} placeholder={t("doc.search")} />
          {q ? (
            <div className="doc-results">
              {resultados.map(({ s, i }) => (
                <button key={i} className="doc-result" onClick={() => { abrir(i); setQ(""); }}>
                  <small>{t("doc.resultMeta", { level: s.nivel, line: s.linha })}</small>
                  <span>{titulo(s)}</span>
                </button>
              ))}
              {!resultados.length && <div className="empty">{t("doc.nothing")}</div>}
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
                <button key={a} onClick={() => abrir(a)}>{titulo(secoes[a])}</button>
              ))}
            </div>
          )}
          <div className="doc-meta">
            <span className="chip">{t("doc.lineChip", { n: atual.linha })}</span>
            <span className="chip">{t("doc.linesChip", { n: atual.linhas })}</span>
            <span className="chip">{t("doc.levelChip", { n: atual.nivel })}</span>
            {locale !== "pt" && !data.traduzido && (
              <span className="chip amber" title={t("docs.corpusNote")}>
                {t("docs.corpusNoteShort")}
              </span>
            )}
          </div>
          <h2 className="doc-title">{titulo(atual)}</h2>
          <Md text={atual.md} />

          {atual.filhos.length > 0 && (
            <div className="doc-children">
              <h4>{t("doc.subsections", { n: atual.filhos.length })}</h4>
              <div className="doc-chips">
                {atual.filhos.map((f) => (
                  <button key={f} onClick={() => abrir(f)}>
                    {titulo(secoes[f])}
                    <small>{secoes[f].linhas}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="doc-nav">
            <button disabled={sel <= 0} onClick={() => abrir(Math.max(0, sel - 1))}>{t("common.previous")}</button>
            <button disabled={sel >= secoes.length - 1} onClick={() => abrir(Math.min(secoes.length - 1, sel + 1))}>{t("common.next")}</button>
          </div>
        </article>
      </div>
    </div>
  );
}
