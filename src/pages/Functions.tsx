import { useMemo, useState } from "react";
import { getFuncoes, useAsync } from "../lib/data";
import { navigate, useRoute } from "../lib/router";
import type { Funcao } from "../types";
import { Badge, ErrorBox, Loading, SearchInput } from "../components/ui";
import { Markdown, stripMd } from "../components/Markdown";
import { useDocsT } from "../content/docs-i18n";
import type { Locale } from "../lib/i18n";

function statusTone(s: string): string {
  if (/completa/i.test(s) && !/parcial/i.test(s)) return "lime";
  if (/parcial/i.test(s)) return "amber";
  return "neutral";
}

function statusText(locale: Locale, status: string): string {
  if (!status) return "—";
  const partial = /parcial/i.test(status);
  const complete = /completa/i.test(status) && !partial;
  if (locale === "pt") return status;
  if (partial) return locale === "ru" ? "частично" : "partial";
  if (complete) return locale === "ru" ? "полностью" : "complete";
  return status;
}

export function Functions() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getFuncoes(locale), [locale]);
  const route = useRoute();
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const id = route.parts[1];
  const sel = id ? data.find((f) => f.id.toLowerCase() === id.toLowerCase()) : undefined;
  if (id && !sel) {
    return (
      <div className="page">
        <ErrorBox message={t("functions.notFound", { id })} />
        <button className="btn" onClick={() => navigate("funcoes")}>{t("common.back")}</button>
      </div>
    );
  }
  return sel ? <FunctionDetail f={sel} all={data} /> : <FunctionList all={data} />;
}

function FunctionList({ all }: { all: Funcao[] }) {
  const { t, locale } = useDocsT();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todas" | "completas" | "parciais">("todas");

  const items = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return all.filter((f) => {
      const isParcial = /parcial/i.test(f.status);
      if (filter === "completas" && isParcial) return false;
      if (filter === "parciais" && !isParcial) return false;
      if (!needle) return true;
      const hay = [f.id, f.titulo, f.simbolos.join(" "), f.papel, f.local, f.assinatura]
        .join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [all, q, filter]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("functions.kicker")}</span>
          <h1>{t("functions.title")}</h1>
          <p>{t("functions.lead", { n: all.length })}</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder={t("functions.search")} />
        <div className="segmented">
          {(["todas", "completas", "parciais"] as const).map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {t(`functions.filter.${f === "todas" ? "all" : f === "completas" ? "complete" : "partial"}`)}
            </button>
          ))}
        </div>
        <span className="count">{t("common.results", { n: items.length })}</span>
      </div>

      <div className="fn-grid">
        {items.map((f) => (
          <button className="fn-card" key={f.id} onClick={() => navigate(`funcoes/${f.id}`)}>
            <div className="fn-card-top">
              <span className="fn-id">{f.id}</span>
              <Badge tone={statusTone(f.status)}>{statusText(locale, f.status)}</Badge>
            </div>
            <strong className="fn-name">{f.titulo}</strong>
            <p>{stripMd(f.papel).slice(0, 140)}{stripMd(f.papel).length > 140 ? "…" : ""}</p>
            <span className="fn-file">{(f.local.match(/`([^`]+)`/)?.[1] ?? "").slice(0, 60)}</span>
          </button>
        ))}
        {!items.length && <div className="empty">{t("functions.empty", { q })}</div>}
      </div>
    </div>
  );
}

function FunctionDetail({ f, all }: { f: Funcao; all: Funcao[] }) {
  const { t, locale } = useDocsT();
  const idx = all.findIndex((x) => x.id === f.id);
  const prev = all[idx - 1];
  const next = all[idx + 1];

  return (
    <div className="page detail">
      <button className="back" onClick={() => navigate("funcoes")}>{t("functions.backAll")}</button>
      <header className="detail-head">
        <div className="detail-id">{f.id}</div>
        <div>
          <h1>{f.titulo}</h1>
          <div className="detail-tags">
            <Badge tone={statusTone(f.status)}>{f.status ? statusText(locale, f.status) : t("functions.noStatus")}</Badge>
            {f.simbolos.map((s) => <code className="sym" key={s}>{s}</code>)}
          </div>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-main">
          <Block title={t("functions.block.role")} body={f.papel} />
          <Block title={t("functions.block.flow")} body={f.fluxo} />
          <Block title={t("functions.block.learned")} body={f.aprendi} tone="lime" />
          <Block title={t("functions.block.risk")} body={f.risco} tone="amber" />
        </div>
        <aside className="detail-side">
          <div className="side-card">
            <h4>{t("functions.side.local")}</h4>
            <div className="mono-wrap"><Markdown text={f.local || "—"} /></div>
          </div>
          <div className="side-card">
            <h4>{t("functions.side.signature")}</h4>
            <div className="mono-wrap"><Markdown text={f.assinatura || "—"} /></div>
          </div>
          <div className="side-card">
            <h4>{t("functions.side.navigate")}</h4>
            <div className="nav-pair">
              <button disabled={!prev} onClick={() => prev && navigate(`funcoes/${prev.id}`)}>← {prev?.id ?? "—"}</button>
              <button disabled={!next} onClick={() => next && navigate(`funcoes/${next.id}`)}>{next?.id ?? "—"} →</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Block({ title, body, tone = "" }: { title: string; body: string; tone?: string }) {
  if (!body) return null;
  return (
    <section className={`detail-block ${tone}`}>
      <h3>{title}</h3>
      <Markdown text={body} />
    </section>
  );
}
