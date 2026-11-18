import { useMemo, useState } from "react";
import { getAlertas, getPatches, useAsync } from "../lib/data";
import { Badge, ErrorBox, Loading, SearchInput, SectionTitle } from "../components/ui";
import { GithubFeed } from "../components/GithubFeed";
import { GITHUB_URL } from "../lib/github";

type Tab = "patches" | "dx11" | "hacks";

export function Updates() {
  const patches = useAsync(getPatches);
  const alertas = useAsync(getAlertas);
  const [tab, setTab] = useState<Tab>("patches");
  const [q, setQ] = useState("");

  const patchList = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = (patches.data ?? []).filter((p) =>
      !needle || [p.id, p.autor, p.texto, p.arquivo].join(" ").toLowerCase().includes(needle)
    );
    return [...list].reverse();
  }, [patches.data, q]);

  const dx11 = useMemo(
    () => (alertas.data ?? []).filter((a) => a.tipo === "DX11 TODO" &&
      (!q || [a.texto, a.file].join(" ").toLowerCase().includes(q.toLowerCase()))),
    [alertas.data, q]
  );
  const hacks = useMemo(
    () => (alertas.data ?? []).filter((a) => a.tipo === "HACK" &&
      (!q || [a.texto, a.file].join(" ").toLowerCase().includes(q.toLowerCase()))),
    [alertas.data, q]
  );

  if (patches.loading) return <Loading />;
  if (patches.error) return <ErrorBox message={patches.error} />;

  let lastYear = "";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">histórico &amp; dívida técnica · sincronizado do GitHub</span>
          <h1>Patches</h1>
          <p>
            Tags <code>\patch</code> do repositório e os marcadores de portabilidade deixados no
            código. O histórico abaixo descreve a build local; o feed no fim da página lê os
            commits e as releases diretamente de{" "}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
              <code>Personed/Game</code>
            </a>
            , para que patch publicado no repositório apareça aqui sem edição manual.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented">
          <button className={tab === "patches" ? "on" : ""} onClick={() => setTab("patches")}>Patches ({patches.data?.length ?? 0})</button>
          <button className={tab === "dx11" ? "on" : ""} onClick={() => setTab("dx11")}>DX11 TODO ({dx11.length})</button>
          <button className={tab === "hacks" ? "on" : ""} onClick={() => setTab("hacks")}>HACKs ({hacks.length})</button>
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar no histórico..." />
      </div>

      {tab === "patches" && (
        <div className="timeline">
          {patchList.map((p) => {
            const year = p.data.split("/")[2] ?? "?";
            const show = year !== lastYear;
            lastYear = year;
            return (
              <div key={`${p.id}-${p.arquivo}-${p.linha}`}>
                {show && <div className="year">{year}</div>}
                <article className="patch">
                  <div className="patch-date">
                    <strong>#{p.id}</strong>
                    <span>{p.data}</span>
                  </div>
                  <div className="patch-body">
                    <p>{p.texto}</p>
                    <small>
                      por <b>{p.autor}</b> · <code>{p.arquivo}:{p.linha}</code>
                    </small>
                  </div>
                </article>
              </div>
            );
          })}
          {!patchList.length && <div className="empty">Nenhum patch encontrado.</div>}
        </div>
      )}

      {tab === "dx11" && (
        <section className="panel">
          <SectionTitle kicker="porte" title="Pendências declaradas no backend DX11" />
          <ul className="alert-list">
            {dx11.map((a) => (
              <li key={`${a.file}:${a.line}`}>
                <Badge tone="amber">TODO</Badge>
                <span>{a.texto}</span>
                <code>{a.file}:{a.line}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "hacks" && (
        <section className="panel">
          <SectionTitle kicker="dívida" title="Hacks e soluções temporárias" />
          <ul className="alert-list">
            {hacks.map((a) => (
              <li key={`${a.file}:${a.line}`}>
                <Badge tone="red">HACK</Badge>
                <span>{a.texto}</span>
                <code>{a.file}:{a.line}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      <GithubFeed compact />
    </div>
  );
}
