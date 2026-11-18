import { useMemo, useState } from "react";
import { getGlossario, useAsync, fmt } from "../lib/data";
import { ErrorBox, Loading, SearchInput, Stat } from "../components/ui";
import { useDocsT } from "../content/docs-i18n";

const PAGE = 120;
const LETRAS = ["todas", ..."abcdefghijklmnopqrstuvwxyz".split(""), "#"];

export function Dicionario() {
  const { t, locale } = useDocsT();
  const { data, error, loading } = useAsync(() => getGlossario(locale), [locale]);
  const alvo = (it: { pt: string; ru?: string }) =>
    locale === "ru" ? it.ru ?? it.pt : it.pt;
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
      if (it.en.toLowerCase().includes(needle)) return true;
      return locale !== "en" && alvo(it).toLowerCase().includes(needle);
    });
  }, [data, q, letra, tipo, locale]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;
  if (!data) return null;

  const visiveis = filtrados.slice(0, limite);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("dict.kicker")}</span>
          <h1>{t("dict.title")}</h1>
          <p>{t("dict.lead", { n: fmt(data.total) })}</p>
          {locale !== "pt" && <p className="corpus-inline">{t("dict.note")}</p>}
        </div>
      </div>

      <div className="stats-grid three">
        <Stat label={t("dict.entries")} value={fmt(data.total)} hint={t("dict.entriesHint")} tone="lime" />
        <Stat label={t("dict.phrases")} value={fmt(data.frases)} hint={t("dict.phrasesHint")} />
        <Stat label={t("dict.terms")} value={fmt(data.palavras)} hint={t("dict.termsHint")} tone="blue" />
      </div>

      <div className="toolbar">
        <SearchInput value={q} onChange={(v) => { setQ(v); setLimite(PAGE); }} placeholder={t("dict.search")} />
        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setLimite(PAGE); }}>
          <option value="todos">{t("dict.type.all")}</option>
          <option value="frase">{t("dict.type.phrase")}</option>
          <option value="termo">{t("dict.type.term")}</option>
        </select>
        <span className="count">{t("common.results", { n: fmt(filtrados.length) })}</span>
      </div>

      <div className="letters">
        {LETRAS.map((l) => (
          <button key={l} className={letra === l ? "on" : ""} onClick={() => { setLetra(l); setLimite(PAGE); }}>
            {l === "todas" ? t("common.all") : l}
          </button>
        ))}
      </div>

      <div className="dict-grid">
        {visiveis.map((it) => (
          <div className="dict-item" key={it.en + it.tipo}>
            <code className="dict-en">{it.en}</code>
            {locale !== "en" && (
              <>
                <span className="dict-arrow">→</span>
                <span className="dict-pt">{alvo(it)}</span>
              </>
            )}
            <span className={`dict-tipo ${it.tipo}`}>
              {it.tipo === "frase" ? t("dict.type.phrase") : t("dict.type.term")}
            </span>
          </div>
        ))}
        {!filtrados.length && <div className="empty">{t("dict.empty")}</div>}
      </div>

      {filtrados.length > limite && (
        <div className="pager">
          <button onClick={() => setLimite((v) => v + PAGE)}>
            {t("common.loadMore", { n: fmt(filtrados.length - limite) })}
          </button>
        </div>
      )}
    </div>
  );
}
