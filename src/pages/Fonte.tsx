import { useMemo, useState } from "react";
import { fmt, getSource, useAsync } from "../lib/data";
import { ErrorBox, Loading, SearchInput, Stat } from "../components/ui";
import { Md } from "../components/Md";
import { navigate, useRoute } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

type Aba = "estrutura" | "compilacao" | "pbo" | "mudancas";

const VALIDAS: Aba[] = ["estrutura", "compilacao", "pbo", "mudancas"];

function bytes(n: number): string {
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

export function Fonte() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getSource(locale), [locale]);
  const route = useRoute();
  const estruturaMd = useMd("estrutura");
  const compilacaoMd = useMd("compilacao");
  const pboMd = useMd("pbo");
  const mudancasMd = useMd("mudancas");
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

  const TABS: { key: Aba; label: string; sub: string }[] = [
    { key: "estrutura", label: t("source.tab.estrutura"), sub: t("source.tab.estruturaSub") },
    { key: "mudancas", label: t("source.tab.mudancas"), sub: t("source.tab.mudancasSub") },
    { key: "compilacao", label: t("source.tab.compilacao"), sub: t("source.tab.compilacaoSub") },
    { key: "pbo", label: t("source.tab.pbo"), sub: t("source.tab.pboSub") },
  ];

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
          <span className="kicker">{t("source.kicker")}</span>
          <h1>{t("source.title")}</h1>
          <p>
            {t("source.lead", {
              folders: fmt(data.total.pastas),
              files: fmt(data.total.arquivos),
              size: bytes(data.total.bytes),
              root: data.raiz,
            })}
          </p>
        </div>
        <button className="btn primary" onClick={() => navigate("fonte/mudancas")}>{t("source.viewChanges")}</button>
      </div>

      <div className="src-path">
        <span>{t("source.root")}</span>
        <code>{data.raiz}</code>
        <small>{t("source.measuredOn", { date: data.medido_em })}</small>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button key={tab.key} className={`tab ${aba === tab.key ? "on" : ""}`} onClick={() => escolher(tab.key)}>
            <strong>{tab.label}</strong>
            <small>{tab.sub}</small>
          </button>
        ))}
      </div>

      {aba === "estrutura" ? (
        <>
          <div className="stats-grid three">
            <Stat label={t("source.stats.files")} value={fmt(data.total.arquivos)} hint={t("source.stats.filesHint")} tone="lime" />
            <Stat label={t("source.stats.size")} value={bytes(data.total.bytes)} hint={t("source.stats.sizeHint")} />
            <Stat label={t("source.stats.folders")} value={fmt(data.total.pastas)} hint={t("source.stats.foldersHint")} tone="blue" />
          </div>

          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder={t("source.filter")} />
            <span className="count">{t("source.folders", { n: dirs.length })}</span>
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
                    <span className="src-files">{t("source.filesShort", { n: fmt(d.arquivos) })}</span>
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
                          <span>{t("source.filesShort", { n: fmt(f.arquivos) })}</span>
                          <strong>{bytes(f.bytes)}</strong>
                        </div>
                      ))}
                      {d.filhos_total > d.filhos.length && (
                        <small className="src-more">
                          {t("source.moreFolders", { n: d.filhos_total - d.filhos.length })}
                        </small>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!dirs.length && <div className="empty">{t("source.noFolders")}</div>}
          </div>

          <section className="panel src-generated">
            <h3>{t("source.generated")}</h3>
            <div className="src-gen-row">
              {data.geradas.map((g) => (
                <div key={g.nome}>
                  <code>{g.nome}/</code>
                  <span>{t("source.filesShort", { n: fmt(g.arquivos) })}</span>
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
