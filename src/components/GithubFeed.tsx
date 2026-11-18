import { useEffect, useState } from "react";
import {
  fetchGithubFeed,
  GITHUB_URL,
  type GithubFeedData,
} from "../lib/github";
import { fmtDate, UPDATE_KIND_LABEL } from "../lib/work";
import { Loading } from "./ui";

export function GithubFeed({ compact = false }: { compact?: boolean }) {
  const [feed, setFeed] = useState<GithubFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      setFeed(await fetchGithubFeed(force));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // O feed é carregado uma vez por montagem; o botão Atualizar força a releitura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commits = feed?.commits.slice(0, compact ? 6 : 12) ?? [];
  const manifest = feed?.manifest ?? [];
  const releases = feed?.releases ?? [];

  return (
    <section className={`gh ${compact ? "compact" : ""}`}>
      <div className="gh-head">
        <div className="gh-head-main">
          <span className="kicker">fonte oficial · github</span>
          <h2>Personed/Game</h2>
          <p>
            Patches e atualizações são reconhecidos direto do repositório. Commits, releases e o
            manifesto <code>site-data/updates.json</code> aparecem aqui sem edição manual.
          </p>
        </div>
        <div className="gh-head-actions">
          <a className="wb-btn ghost" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            Abrir no GitHub ↗
          </a>
          <button className="wb-btn" onClick={() => void load(true)} disabled={loading}>
            {loading ? "Lendo..." : "Atualizar"}
          </button>
        </div>
      </div>

      {feed && (
        <div className="gh-repo-line">
          <span className="gh-repo-dot" />
          <strong>{feed.repo.fullName}</strong>
          <span>branch {feed.repo.defaultBranch}</span>
          {feed.repo.language && <span>{feed.repo.language}</span>}
          <span>último push {fmtDate(feed.repo.pushedAt, true)}</span>
          <span>{feed.repo.stars} estrela(s)</span>
          <span className="gh-sync">sincronizado {fmtDate(feed.fetchedAt, true)}</span>
        </div>
      )}

      {error && (
        <div className="errorbox">
          Não foi possível ler o GitHub: {error}{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            abrir o repositório
          </a>
          .
        </div>
      )}

      {loading && !feed && <Loading label="Lendo commits e releases do GitHub..." />}

      {feed && (
        <div className="gh-grid">
          <div className="gh-main">
            {manifest.length > 0 && (
              <div className="gh-block">
                <div className="gh-block-head">
                  <span className="gh-block-title">Atualizações publicadas no repositório</span>
                  <span className="gh-count">{manifest.length}</span>
                </div>
                <div className="gh-updates">
                  {manifest.map((entry) => (
                    <article className="gh-update" key={entry.id}>
                      <header>
                        <span className={`gh-type ${entry.tipo}`}>{UPDATE_KIND_LABEL[entry.tipo]}</span>
                        {entry.versao && <code>{entry.versao}</code>}
                        <time dateTime={entry.data}>{fmtDate(entry.data)}</time>
                      </header>
                      <h3>{entry.titulo}</h3>
                      <p>{entry.resumo}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer noopener">
                          ver referência ↗
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {manifest.length === 0 && (
              <div className="gh-block">
                <div className="gh-block-head">
                  <span className="gh-block-title">Atualizações publicadas no repositório</span>
                  <span className="gh-count">0</span>
                </div>
                <div className="empty">
                  O repositório ainda não tem <code>site-data/updates.json</code>. O feed já mostra
                  commits e releases; para publicar o changelog curado, use{" "}
                  <strong>Atualizações → Atualizações manuais</strong>.
                </div>
              </div>
            )}

            {releases.length > 0 && (
              <div className="gh-block">
                <div className="gh-block-head">
                  <span className="gh-block-title">Releases</span>
                  <span className="gh-count">{releases.length}</span>
                </div>
                <div className="gh-updates">
                  {releases.map((release) => (
                    <article className="gh-update" key={release.id}>
                      <header>
                        <span className="gh-type build">Release</span>
                        <code>{release.tag}</code>
                        <time dateTime={release.publishedAt}>{fmtDate(release.publishedAt)}</time>
                      </header>
                      <h3>{release.name}</h3>
                      {release.body && <p>{release.body.slice(0, 240)}</p>}
                      <a href={release.url} target="_blank" rel="noreferrer noopener">
                        abrir release ↗
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="gh-block">
              <div className="gh-block-head">
                <span className="gh-block-title">Commits recentes</span>
                <span className="gh-count">{commits.length}</span>
              </div>
              {commits.length === 0 ? (
                <div className="empty">Nenhum commit retornado pela API.</div>
              ) : (
                <div className="gh-commits">
                  {commits.map((commit) => (
                    <a
                      className="gh-commit"
                      href={commit.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      key={commit.sha}
                    >
                      <code>{commit.shortSha}</code>
                      <span className="gh-commit-body">
                        <strong>{commit.message}</strong>
                        <small>
                          {commit.author} · {fmtDate(commit.date, true)}
                        </small>
                      </span>
                      <span className="gh-arrow">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="gh-side">
            <div className="gh-side-card">
              <span className="kicker">reconhecimento automático</span>
              <h3>O que entra no feed</h3>
              <ul>
                <li>
                  <strong>Commits</strong> da branch <code>{feed.repo.defaultBranch}</code>
                </li>
                <li>
                  <strong>Releases</strong> publicadas no repositório
                </li>
                <li>
                  <strong>Manifesto</strong> <code>site-data/updates.json</code> para entradas
                  curadas
                </li>
              </ul>
            </div>
            <div className="gh-side-card">
              <span className="kicker">repositório</span>
              <dl>
                <div>
                  <dt>Owner</dt>
                  <dd>{feed.repo.fullName.split("/")[0]}</dd>
                </div>
                <div>
                  <dt>Branch</dt>
                  <dd>{feed.repo.defaultBranch}</dd>
                </div>
                <div>
                  <dt>Issues abertas</dt>
                  <dd>{feed.repo.openIssues}</dd>
                </div>
                <div>
                  <dt>Último push</dt>
                  <dd>{fmtDate(feed.repo.pushedAt, true)}</dd>
                </div>
              </dl>
            </div>
            {feed.rate.remaining !== null && (
              <div className={`gh-rate ${feed.rate.remaining <= 5 ? "low" : ""}`}>
                API do GitHub: {feed.rate.remaining} requisição(ões) restante(s) nesta hora.
                {feed.rate.reset && <> Renova {fmtDate(feed.rate.reset, true)}.</>}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
