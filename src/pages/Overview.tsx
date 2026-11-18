import { getAchados, getFuncoes, getMeta, getPatches, fmt, useAsync } from "../lib/data";
import { navigate } from "../lib/router";
import { Bars, Badge, Loading, ErrorBox, SectionTitle, Stat } from "../components/ui";

export function Overview() {
  const meta = useAsync(getMeta);
  const funcs = useAsync(getFuncoes);
  const achados = useAsync(getAchados);
  const patches = useAsync(getPatches);

  if (meta.loading || funcs.loading) return <Loading />;
  if (meta.error) return <ErrorBox message={meta.error} />;
  if (!meta.data || !funcs.data) return null;

  const m = meta.data;
  const pct = Math.round((m.completas / Math.max(1, m.funcoes)) * 100);
  const recentesA = (achados.data ?? []).filter((a) => a.id.startsWith("A-") && Number(a.id.slice(2)) >= 73);
  const recentesH = (achados.data ?? []).filter((a) => a.id.startsWith("H-") && Number(a.id.slice(2)) >= 64);
  const ultimos = (patches.data ?? []).slice(-6).reverse();

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-body">
          <Badge tone="accent">código-fonte original · patches compilados</Badge>
          <h1>Toda a source do DayZ,<br />função por função.</h1>
          <p>
            O projeto real da Bohemia Interactive em <code>SOURCE DEFINITIVA</code>: cada
            função lida, cada comentário traduzido — e as correções já feitas na árvore,
            compiladas em v141: colisão de zumbi, inclinação ao correr, inventário e menu.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate("funcoes")}>Explorar funções →</button>
            <button className="btn" onClick={() => navigate("fonte/mudancas")}>Mudanças na source</button>
            <button className="btn ghost" onClick={() => navigate("diagrama")}>Diagrama &amp; motor</button>
            <button className="btn ghost" onClick={() => navigate("bugs")}>Bugs &amp; FPS</button>
            <button className="btn ghost" onClick={() => navigate("atualizacoes")}>Atualizações</button>
            <button className="btn ghost" onClick={() => navigate("pendencias")}>Pendências</button>
          </div>
        </div>
        <div className="hero-side">
          <div className="ring" style={{ ["--p" as string]: `${pct}%` }}>
            <div className="ring-inner">
              <strong>{pct}%</strong>
              <span>funções completas</span>
            </div>
          </div>
          <small>{m.completas} de {m.funcoes} entradas fechadas</small>
        </div>
      </section>

      <section className="stats-grid">
        <Stat label="Funções estudadas" value={fmt(m.funcoes)} hint={`${m.completas} completas · ${m.parciais} parciais`} tone="lime" />
        <Stat label="Comentários anotados" value={fmt(m.comentarios)} hint={`${fmt(m.arquivosComentados)} arquivos`} />
        <Stat label="Patches históricos" value={fmt(m.patches)} hint="tags \patch do repositório" tone="blue" />
        <Stat label="Pendências & hacks" value={fmt(m.alertas)} hint="DX11 TODO + HACK" tone="amber" />
        <Stat label="Achados" value={fmt(m.achados)} hint="A · H · G" tone="violet" />
        <Stat label="Ferramentas" value={fmt(m.ferramentas)} hint="pipeline em Python" />
      </section>

      <div className="grid two">
        <section className="panel">
          <SectionTitle kicker="corpus" title="Linguagens na source" />
          <Bars
            items={m.porLinguagem.map((l) => ({ label: l.nome, value: l.valor }))}
          />
        </section>
        <section className="panel">
          <SectionTitle kicker="concentração" title="Arquivos mais comentados" />
          <Bars
            mono
            items={m.topFiles.slice(0, 9).map((f) => ({
              label: f.file.split("/").slice(-2).join("/"),
              value: f.comentarios
            }))}
          />
        </section>
      </div>

      <div className="grid two">
        <section className="panel">
          <SectionTitle
            kicker="portabilidade"
            title="Achados recentes"
            right={<button className="link" onClick={() => navigate("achados")}>ver todos →</button>}
          />
          <ul className="finding-list">
            {[...recentesA, ...recentesH].map((a) => (
              <li key={a.id}>
                <Badge tone={a.id.startsWith("A") ? "violet" : "amber"}>{a.id}</Badge>
                <span>{a.resumo}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <SectionTitle
            kicker="histórico"
            title="Patches recentes"
            right={<button className="link" onClick={() => navigate("patches")}>ver todos →</button>}
          />
          <ul className="patch-mini">
            {ultimos.map((p) => (
              <li key={p.id}>
                <span className="patch-id">#{p.id}</span>
                <div>
                  <strong>{p.texto.slice(0, 90)}{p.texto.length > 90 ? "…" : ""}</strong>
                  <small>{p.data} · {p.autor} · <code>{p.arquivo}:{p.linha}</code></small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <SectionTitle kicker="leitura" title="Por onde começar" />
        <div className="quick">
          <button className="quick-card" onClick={() => navigate("funcoes/F-170")}>
            <span>Função em destaque</span>
            <strong>F-170 · DoSelectPixelShader</strong>
            <p>Seleção de pixel shader por material, spec e luzes no backend DX9.</p>
          </button>
          <button className="quick-card" onClick={() => navigate("comentarios")}>
            <span>Comentários</span>
            <strong>180.545 anotados</strong>
            <p>Original em inglês, tradução PT-BR, código ancorado e função de contexto.</p>
          </button>
          <button className="quick-card" onClick={() => navigate("bugs")}>
            <span>Performance</span>
            <strong>FPS perto de cidades</strong>
            <p>Dossiê com 6 elos causais, evidência de linha e correções por custo/benefício.</p>
          </button>
          <button className="quick-card" onClick={() => navigate("linguagens")}>
            <span>Script</span>
            <strong>SQF &amp; Enforce</strong>
            <p>Sintaxe completa das duas linguagens, operadores, VM e armadilhas.</p>
          </button>
          <button className="quick-card" onClick={() => navigate("fonte/mudancas")}>
            <span>Projeto</span>
            <strong>Mudanças &amp; PBOs</strong>
            <p>Patches com arquivo:linha, toolchain v141 e o formato binário dos PBOs.</p>
          </button>
        </div>
      </section>
    </div>
  );
}
