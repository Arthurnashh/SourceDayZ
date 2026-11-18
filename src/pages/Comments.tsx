import { useEffect, useMemo, useState } from "react";
import { getComentarios, getComentariosIndex, useAsync, fmt } from "../lib/data";
import type { Comentario } from "../types";
import { Badge, ErrorBox, Loading, SearchInput, toneForKind } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";

const PAGE = 30;

export function Comments() {
  const { t, locale } = useDocsT();
  const index = useAsync(getComentariosIndex);
  const [grupoSlug, setGrupoSlug] = useState("");
  const [grupoBusca, setGrupoBusca] = useState("");
  const [rows, setRows] = useState<Comentario[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("TODOS");
  const [comCodigo, setComCodigo] = useState(true);
  const [page, setPage] = useState(0);

  const grupos = index.data?.grupos ?? [];
  const grupoAtual = useMemo(
    () => (grupoSlug ? grupos.find((g) => g.slug === grupoSlug) : undefined),
    [grupos, grupoSlug]
  );

  useEffect(() => {
    if (grupoSlug || !index.data) return;
    const pref = index.data.grupos.find((g) => g.grupo === "lib/d3d11") ?? index.data.grupos[0];
    if (pref) setGrupoSlug(pref.slug);
  }, [index.data, grupoSlug]);

  useEffect(() => {
    if (!grupoAtual) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setRows(null);
    setPage(0);
    getComentarios(grupoAtual)
      .then((d) => alive && setRows(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [grupoAtual]);

  const kinds = useMemo(() => {
    const set = new Set<string>(["TODOS"]);
    (index.data?.kinds ?? []).forEach(([k]) => set.add(k));
    return Array.from(set);
  }, [index.data]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.toLowerCase().trim();
    return rows.filter((r) => {
      if (kind !== "TODOS" && r.kind !== kind) return false;
      if (!needle) return true;
      return (
        r.original.toLowerCase().includes(needle) ||
        r.pt.toLowerCase().includes(needle) ||
        r.file.toLowerCase().includes(needle) ||
        r.func.toLowerCase().includes(needle) ||
        r.qual.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, kind]);

  if (index.loading) return <Loading />;
  if (index.error) return <ErrorBox message={index.error} />;
  if (!index.data) return null;
  if (!grupoAtual) return <Loading label={t("comments.loadingGroup")} />;

  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const gruposFiltrados = grupos.filter((g) =>
    g.grupo.toLowerCase().includes(grupoBusca.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("comments.kicker")}</span>
          <h1>{t("comments.title")}</h1>
          <p>{t("comments.lead", { total: fmt(index.data.total), groups: index.data.grupos.length })}</p>
          {locale === "ru" && <p className="corpus-inline">{t("comments.russianNote")}</p>}
        </div>
      </div>

      <div className="comment-layout">
        <aside className="group-pane">
          <SearchInput value={grupoBusca} onChange={setGrupoBusca} placeholder={t("comments.filterGroups")} />
          <div className="group-list">
            {gruposFiltrados.map((g) => (
              <button
                key={g.slug}
                className={`group-item ${g.slug === grupoAtual.slug ? "on" : ""}`}
                onClick={() => setGrupoSlug(g.slug)}
              >
                <span>{g.grupo}</span>
                <small>{fmt(g.total)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="comment-main">
          <div className="toolbar">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder={t("comments.search")} />
            <select value={kind} onChange={(e) => { setKind(e.target.value); setPage(0); }}>
              {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <label className="toggle">
              <input type="checkbox" checked={comCodigo} onChange={(e) => setComCodigo(e.target.checked)} />
              {t("common.code")}
            </label>
          </div>

          <div className="comment-meta">
            <strong>{grupoAtual.grupo}</strong>
            <span>{t("comments.summary", { total: fmt(grupoAtual.total), filtered: filtered.length })}</span>
          </div>

          {loading && <Loading label={t("comments.loadingGroup")} />}
          {error && <ErrorBox message={error} />}

          <div className="comment-list">
            {pageRows.map((r) => (
              <article className="comment" key={`${r.file}:${r.line}`}>
                <header>
                  <div className="comment-loc">
                    <code>{r.file}:{r.line}</code>
                    {r.func && <span className="fn-ref">{r.func}</span>}
                  </div>
                  <div className="comment-badges">
                    <Badge tone={toneForKind(r.kind)}>{r.kind}</Badge>
                    {r.status === "curado" && <Badge tone="lime">{t("common.curated")}</Badge>}
                  </div>
                </header>
                <div className="comment-body">
                  <p className="original">{r.original}</p>
                  {locale === "pt" && <p className="pt">{r.pt}</p>}
                  {r.qual && <p className="qual"><strong>{t("comments.whatItDoes")}</strong> {r.qual}</p>}
                  {comCodigo && r.code && (
                    <pre className="code-block">{r.code.split(" | ").join("\n")}</pre>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!loading && !pageRows.length && <div className="empty">{t("comments.empty")}</div>}

          {pages > 1 && (
            <div className="pager">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>{t("common.previous")}</button>
              <span>{t("common.pageOf", { page: page + 1, pages })}</span>
              <button disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>{t("common.next")}</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
