import { getFerramentas, useAsync } from "../lib/data";
import { CopyButton, ErrorBox, Loading, SectionTitle } from "../components/ui";

export function Tools() {
  const { data, error, loading } = useAsync(getFerramentas);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const total = (data ?? []).reduce((s, t) => s + t.linhas, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">pipeline de estudo</span>
          <h1>Ferramentas</h1>
          <p>
            {(data ?? []).length} scripts Python que extraem, traduzem, ancoram e validam os dados
            deste site — {(total).toLocaleString("pt-BR")} linhas no total.
          </p>
        </div>
      </div>

      <div className="tools-grid">
        {(data ?? []).map((t) => (
          <article className="tool" key={t.nome}>
            <header>
              <span className="tool-dot" />
              <code>{t.nome}</code>
              <small>{t.linhas} linhas</small>
            </header>
            <p>{t.descricao}</p>
            <div className="tool-cmd">
              <code>python tools\{t.nome}</code>
              <CopyButton text={`python tools\\${t.nome}`} />
            </div>
          </article>
        ))}
      </div>

      <section className="panel">
        <SectionTitle kicker="reproduzir" title="Como o dataset é gerado" />
        <ol className="steps">
          <li><code>python tools\scan_comments.py</code> — varre a source e grava o índice bruto.</li>
          <li><code>python tools\annotate_comments.py</code> — traduz, ancora e agrupa os comentários.</li>
          <li><code>python tools\build_site_data.py</code> — consolida funções, achados, patches e ferramentas.</li>
          <li><code>python tools\build_docs_data.py</code> — fatia o 1.md, monta o glossário e categoriza os bugs.</li>
          <li><code>cd site &amp;&amp; npm install &amp;&amp; npm run dev</code> — abre este explorador.</li>
        </ol>
      </section>
    </div>
  );
}
