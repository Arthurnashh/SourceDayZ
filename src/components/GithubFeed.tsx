import { useEffect, useState } from "react";
import {
  fetchGithubFeed,
  GITHUB_URL,
  type GithubFeedData,
} from "../lib/github";
import { fmtDate } from "../lib/work";
import { Loading } from "./ui";
import { useWorkT } from "../content/work-i18n";

function kindKey(kind: string): string {
  if (kind === "patch") return "kindPatch";
  if (kind === "implementacao") return "kindImplementation";
  if (kind === "build") return "kindBuild";
  return "kindAnnouncement";
}

export function GithubFeed({ compact = false }: { compact?: boolean }) {
  const { t, locale } = useWorkT();
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
    // The feed is loaded once per mount; the Refresh button forces a re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commits = feed?.commits.slice(0, compact ? 6 : 12) ?? [];
  const manifest = feed?.manifest ?? [];
  const releases = feed?.releases ?? [];

  return (
    <section className={`gh ${compact ? "compact" : ""}`}>
      <div className="gh-head">
        <div className="gh-head-main">
          <span className="kicker">{t("feedKicker")}</span>
          <h2>Personed/Game</h2>
          <p>{t("feedLead", { path: "site-data/updates.json" })}</p>
        </div>
        <div className="gh-head-actions">
          <a className="wb-btn ghost" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            {t("feedOpen")}
          </a>
          <button className="wb-btn" onClick={() => void load(true)} disabled={loading}>
            {loading ? t("feedLoading") : t("feedRefresh")}
          </button>
        </div>
      </div>

      {feed && (
        <div className="gh-repo-line">
          <span className="gh-repo-dot" />
          <strong>{feed.repo.fullName}</strong>
          <span>{t("feedBranch", { branch: feed.repo.defaultBranch })}</span>
          {feed.repo.language && <span>{feed.repo.language}</span>}
          <span>{t("feedLastPush", { date: fmtDate(feed.repo.pushedAt, true, locale) })}</span>
          <span>{t("feedStars", { n: feed.repo.stars })}</span>
          <span className="gh-sync">{t("feedSynced", { date: fmtDate(feed.fetchedAt, true, locale) })}</span>
        </div>
      )}

      {error && (
        <div className="errorbox">
          {t("feedError", { error })}{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
            {t("feedOpenRepo")}
          </a>
          .
        </div>
      )}

      {loading && !feed && <Loading label={t("feedLoadingLabel")} />}

      {feed && (
        <div className="gh-grid">
          <div className="gh-main">
            {manifest.length > 0 && (
              <div className="gh-block">
                <div className="gh-block-head">
                  <span className="gh-block-title">{t("feedManifestTitle")}</span>
                  <span className="gh-count">{manifest.length}</span>
                </div>
                <div className="gh-updates">
                  {manifest.map((entry) => (
                    <article className="gh-update" key={entry.id}>
                      <header>
                        <span className={`gh-type ${entry.tipo}`}>{t(kindKey(entry.tipo))}</span>
                        {entry.versao && <code>{entry.versao}</code>}
                        <time dateTime={entry.data}>{fmtDate(entry.data, false, locale)}</time>
                      </header>
                      <h3>{entry.titulo}</h3>
                      <p>{entry.resumo}</p>
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer noopener">
                          {t("updatesReference")}
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
                  <span className="gh-block-title">{t("feedManifestTitle")}</span>
                  <span className="gh-count">0</span>
                </div>
                <div className="empty">{t("feedManifestEmpty", { path: "site-data/updates.json" })}</div>
              </div>
            )}

            {releases.length > 0 && (
              <div className="gh-block">
                <div className="gh-block-head">
                  <span className="gh-block-title">{t("feedReleases")}</span>
                  <span className="gh-count">{releases.length}</span>
                </div>
                <div className="gh-updates">
                  {releases.map((release) => (
                    <article className="gh-update" key={release.id}>
                      <header>
                        <span className="gh-type build">{t("feedReleases")}</span>
                        <code>{release.tag}</code>
                        <time dateTime={release.publishedAt}>
                          {fmtDate(release.publishedAt, false, locale)}
                        </time>
                      </header>
                      <h3>{release.name}</h3>
                      {release.body && <p>{release.body.slice(0, 240)}</p>}
                      <a href={release.url} target="_blank" rel="noreferrer noopener">
                        {t("feedOpenRelease")}
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="gh-block">
              <div className="gh-block-head">
                <span className="gh-block-title">{t("feedRecentCommits")}</span>
                <span className="gh-count">{commits.length}</span>
              </div>
              {commits.length === 0 ? (
                <div className="empty">{t("feedNoCommits")}</div>
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
                          {commit.author} · {fmtDate(commit.date, true, locale)}
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
              <span className="kicker">{t("feedSideKicker")}</span>
              <h3>{t("feedSideTitle")}</h3>
              <ul>
                <li>
                  <strong>{t("feedCommitsLabel")}</strong>{" "}
                  {t("feedSideCommits", { branch: feed.repo.defaultBranch })}
                </li>
                <li>
                  <strong>{t("feedReleases")}</strong> {t("feedSideReleases")}
                </li>
                <li>
                  <strong>{t("feedManifestLabel")}</strong>{" "}
                  {t("feedSideManifest", { path: "site-data/updates.json" })}
                </li>
              </ul>
            </div>
            <div className="gh-side-card">
              <span className="kicker">{t("feedRepoKicker")}</span>
              <dl>
                <div>
                  <dt>{t("feedOwner")}</dt>
                  <dd>{feed.repo.fullName.split("/")[0]}</dd>
                </div>
                <div>
                  <dt>{t("feedBranchLabel")}</dt>
                  <dd>{feed.repo.defaultBranch}</dd>
                </div>
                <div>
                  <dt>{t("feedOpenIssues")}</dt>
                  <dd>{feed.repo.openIssues}</dd>
                </div>
                <div>
                  <dt>{t("feedLastPushLabel")}</dt>
                  <dd>{fmtDate(feed.repo.pushedAt, true, locale)}</dd>
                </div>
              </dl>
            </div>
            {feed.rate.remaining !== null && (
              <div className={`gh-rate ${feed.rate.remaining <= 5 ? "low" : ""}`}>
                {t("feedRate", { n: feed.rate.remaining })}
                {feed.rate.reset && <> {t("feedRateReset", { date: fmtDate(feed.rate.reset, true, locale) })}</>}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
