import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Modal } from "./Modal";
import {
  GITHUB_UPDATES_PATH,
  publishGithubFile,
  readGithubToken,
  saveGithubToken,
} from "../lib/github";
import {
  downloadJSON,
  fmtDate,
  type UpdateEntry,
  type UpdateKind,
  type WorkStore,
} from "../lib/work";
import { useWorkT } from "../content/work-i18n";
import type { Locale } from "../lib/i18n";

const TIPOS: UpdateKind[] = ["patch", "implementacao", "build", "anuncio"];

function kindKey(kind: UpdateKind): string {
  if (kind === "patch") return "kindPatch";
  if (kind === "implementacao") return "kindImplementation";
  if (kind === "build") return "kindBuild";
  return "kindAnnouncement";
}

const BANNER: Record<Locale, ReactNode> = {
  pt: (
    <>
      <strong>Edição local ativa.</strong> As entradas ficam neste navegador até você publicar o
      manifesto no GitHub. Use o bloco <em>Publicar no GitHub</em> abaixo ou exporte o JSON e
      commite em <code>{GITHUB_UPDATES_PATH}</code>.
    </>
  ),
  en: (
    <>
      <strong>Local editing active.</strong> Entries stay in this browser until you publish the
      manifest to GitHub. Use the <em>Publish to GitHub</em> block below or export the JSON and
      commit it to <code>{GITHUB_UPDATES_PATH}</code>.
    </>
  ),
  ru: (
    <>
      <strong>Локальное редактирование активно.</strong> Записи остаются в этом браузере, пока вы
      не опубликуете манифест в GitHub. Используйте блок <em>Опубликовать в GitHub</em> ниже или
      экспортируйте JSON и закоммитьте в <code>{GITHUB_UPDATES_PATH}</code>.
    </>
  ),
};

const PUBLISH_HELP: Record<Locale, ReactNode> = {
  pt: (
    <>
      O token fica nesta aba do navegador (sessionStorage) e só é enviado para{" "}
      <code>api.github.com</code>. Use um token fine-grained com{" "}
      <strong>Contents: Read and write</strong> apenas no repositório{" "}
      <code>Personed/Game</code>.
    </>
  ),
  en: (
    <>
      The token stays in this browser tab (sessionStorage) and is sent only to{" "}
      <code>api.github.com</code>. Use a fine-grained token with{" "}
      <strong>Contents: Read and write</strong> only on the <code>Personed/Game</code> repository.
    </>
  ),
  ru: (
    <>
      Токен хранится в этой вкладке браузера (sessionStorage) и отправляется только на{" "}
      <code>api.github.com</code>. Используйте fine-grained токен с{" "}
      <strong>Contents: Read and write</strong> только для репозитория{" "}
      <code>Personed/Game</code>.
    </>
  ),
};

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function newUpdate(): UpdateEntry {
  const now = new Date();
  return {
    id: `U-${now.getTime()}`,
    tipo: "anuncio",
    titulo: "",
    resumo: "",
    data: now.toISOString(),
    origem: "manual",
    criadoEm: now.toISOString(),
  };
}

export function UpdatesLog({ store }: { store: WorkStore }) {
  const { t, locale } = useWorkT();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<UpdateEntry | null>(null);
  const [token, setToken] = useState(readGithubToken);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updates = useMemo(
    () => [...(store.state?.updates ?? [])].sort((a, b) => b.data.localeCompare(a.data)),
    [store.state]
  );

  const exportAll = () => {
    if (!store.state) return;
    downloadJSON("updates.json", {
      version: 1,
      updatedAt: new Date().toISOString(),
      updates,
    });
  };

  const publish = async () => {
    if (!store.state) return;
    if (!token.trim()) {
      setError(t("toolsErrorToken"));
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const content = JSON.stringify(
        { version: 1, updatedAt: new Date().toISOString(), updates },
        null,
        2
      );
      const result = await publishGithubFile({
        token,
        path: GITHUB_UPDATES_PATH,
        content,
        message: t("toolsUpdatesCommit"),
      });
      setNotice(
        result.commitUrl
          ? `${t("toolsUpdatesPublished")} ${result.commitUrl}`
          : t("toolsUpdatesPublished")
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (entry: UpdateEntry) => {
    if (window.confirm(t("updatesRemoveConfirm", { title: entry.titulo }))) {
      store.deleteUpdate(entry.id);
    }
  };

  return (
    <section className="wb updates-log">
      <div className="wb-top">
        <div className="wb-title">
          <span className="kicker">{t("updatesKicker")}</span>
          <h2>{t("updatesTitle")}</h2>
          <p>{t("updatesLead", { path: GITHUB_UPDATES_PATH })}</p>
        </div>
        <div className="wb-tools">
          <button
            className={`wb-btn ${editMode ? "on" : ""}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? t("toolsEditOn") : t("toolsEditOff")}
          </button>
          {editMode && (
            <button className="wb-btn primary" onClick={() => setDraft(newUpdate())}>
              {t("updatesNew")}
            </button>
          )}
          <button className="wb-btn" onClick={exportAll} disabled={!store.state}>
            {t("updatesExport")}
          </button>
        </div>
      </div>

      {editMode && <div className="wb-banner">{BANNER[locale]}</div>}

      {(notice || error) && (
        <div className={`wb-notice ${error ? "bad" : "good"}`}>{error ?? notice}</div>
      )}

      <div className="updates-list">
        {updates.map((entry) => (
          <article className={`update-entry ${entry.tipo}`} key={entry.id}>
            <header>
              <span className={`gh-type ${entry.tipo}`}>{t(kindKey(entry.tipo))}</span>
              {entry.versao && <code>{entry.versao}</code>}
              <time dateTime={entry.data}>{fmtDate(entry.data, true, locale)}</time>
              <span className={`update-origin ${entry.origem}`}>
                {entry.origem === "github" ? "GitHub" : "manual"}
              </span>
            </header>
            <h3>{entry.titulo}</h3>
            <p className="update-summary">{entry.resumo}</p>
            {entry.detalhes && <p className="update-details">{entry.detalhes}</p>}
            <footer>
              {entry.autor && <span>{t("updatesBy", { author: entry.autor })}</span>}
              {entry.url && (
                <a href={entry.url} target="_blank" rel="noreferrer noopener">
                  {t("updatesReference")}
                </a>
              )}
              {editMode && (
                <div className="wb-actions">
                  <button className="wb-mini" onClick={() => setDraft({ ...entry })}>
                    {t("actionEdit")}
                  </button>
                  <button className="wb-mini danger" onClick={() => remove(entry)}>
                    {t("actionDelete")}
                  </button>
                </div>
              )}
            </footer>
          </article>
        ))}
        {updates.length === 0 && <div className="empty">{t("updatesEmpty")}</div>}
      </div>

      <details className="wb-publish">
        <summary>{t("updatesPublish")}</summary>
        <div className="wb-publish-body">
          <p>{PUBLISH_HELP[locale]}</p>
          <div className="wb-field">
            <label htmlFor="updates-token">{t("toolsTokenLabel")}</label>
            <input
              id="updates-token"
              type="password"
              value={token}
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_..."
              onChange={(event) => {
                setToken(event.target.value);
                saveGithubToken(event.target.value);
              }}
            />
          </div>
          <div className="wb-publish-actions">
            <button className="wb-btn primary" onClick={() => void publish()} disabled={busy}>
              {busy ? t("toolsPublishing") : t("toolsPublishUpdates", { path: GITHUB_UPDATES_PATH })}
            </button>
          </div>
        </div>
      </details>

      {draft && (
        <Modal
          title={
            updates.some((entry) => entry.id === draft.id)
              ? t("updatesModalEdit")
              : t("updatesModalNew")
          }
          subtitle={t("updatesModalSubtitle")}
          onClose={() => setDraft(null)}
          wide
        >
          <UpdateForm
            entry={draft}
            onCancel={() => setDraft(null)}
            onSave={(entry) => {
              if (updates.some((current) => current.id === entry.id)) {
                store.updateUpdate(entry);
              } else {
                store.addUpdate(entry);
              }
              setDraft(null);
            }}
          />
        </Modal>
      )}
    </section>
  );
}

function UpdateForm({
  entry,
  onCancel,
  onSave,
}: {
  entry: UpdateEntry;
  onCancel: () => void;
  onSave: (entry: UpdateEntry) => void;
}) {
  const { t } = useWorkT();
  const [draft, setDraft] = useState<UpdateEntry>({ ...entry });
  const [when, setWhen] = useState(toLocalInput(entry.data));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.titulo.trim()) {
      setError(t("updatesErrTitle"));
      return;
    }
    if (!draft.resumo.trim()) {
      setError(t("updatesErrSummary"));
      return;
    }
    onSave({
      ...draft,
      titulo: draft.titulo.trim(),
      resumo: draft.resumo.trim(),
      detalhes: draft.detalhes?.trim() || undefined,
      versao: draft.versao?.trim() || undefined,
      autor: draft.autor?.trim() || undefined,
      url: draft.url?.trim() || undefined,
      data: fromLocalInput(when),
      origem: "manual",
    });
  };

  return (
    <form className="wb-form" onSubmit={submit}>
      <div className="wb-field">
        <label htmlFor="up-title">{t("updatesFormTitle")}</label>
        <input
          id="up-title"
          value={draft.titulo}
          autoFocus
          onChange={(event) => setDraft({ ...draft, titulo: event.target.value })}
          placeholder={t("updatesFormTitlePh")}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="up-summary">{t("updatesFormSummary")}</label>
        <textarea
          id="up-summary"
          value={draft.resumo}
          onChange={(event) => setDraft({ ...draft, resumo: event.target.value })}
          placeholder={t("updatesFormSummaryPh")}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="up-details">{t("updatesFormDetails")}</label>
        <textarea
          id="up-details"
          value={draft.detalhes ?? ""}
          onChange={(event) => setDraft({ ...draft, detalhes: event.target.value })}
          placeholder={t("updatesFormDetailsPh")}
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="up-type">{t("updatesFormType")}</label>
          <select
            id="up-type"
            value={draft.tipo}
            onChange={(event) => setDraft({ ...draft, tipo: event.target.value as UpdateKind })}
          >
            {TIPOS.map((tipo) => (
              <option value={tipo} key={tipo}>
                {t(kindKey(tipo))}
              </option>
            ))}
          </select>
        </div>
        <div className="wb-field">
          <label htmlFor="up-when">{t("updatesFormDate")}</label>
          <input
            id="up-when"
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
          />
        </div>
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="up-version">{t("updatesFormVersion")}</label>
          <input
            id="up-version"
            value={draft.versao ?? ""}
            onChange={(event) => setDraft({ ...draft, versao: event.target.value })}
            placeholder="V38, E7, site..."
          />
        </div>
        <div className="wb-field">
          <label htmlFor="up-author">{t("updatesFormAuthor")}</label>
          <input
            id="up-author"
            value={draft.autor ?? ""}
            onChange={(event) => setDraft({ ...draft, autor: event.target.value })}
            placeholder={t("updatesFormAuthorPh")}
          />
        </div>
      </div>

      <div className="wb-field">
        <label htmlFor="up-url">{t("updatesFormUrl")}</label>
        <input
          id="up-url"
          value={draft.url ?? ""}
          onChange={(event) => setDraft({ ...draft, url: event.target.value })}
          placeholder="https://github.com/Personed/Game/commit/..."
        />
      </div>

      {error && <div className="wb-form-error">{error}</div>}

      <div className="wb-actions-row">
        <button type="button" className="wb-btn ghost" onClick={onCancel}>
          {t("formCancel")}
        </button>
        <button type="submit" className="wb-btn primary">
          {t("updatesSave")}
        </button>
      </div>
    </form>
  );
}
