import { useRef, useState, type ReactNode } from "react";
import {
  fetchGithubBoard,
  GITHUB_BOARD_PATH,
  GITHUB_UPDATES_PATH,
  publishGithubFile,
  readGithubToken,
  saveGithubToken,
} from "../lib/github";
import type { WorkStore } from "../lib/work";
import { useWorkT } from "../content/work-i18n";
import type { Locale } from "../lib/i18n";

interface BoardToolsProps {
  store: WorkStore;
  editMode: boolean;
  onEditMode: (value: boolean) => void;
}

type Notice = { text: string; url?: string } | null;

const RICH: Record<"boardBanner" | "tokenHelp" | "footerHint", Record<Locale, ReactNode>> = {
  boardBanner: {
    pt: (
      <>
        <strong>Edição local ativa.</strong> As mudanças ficam neste navegador. Para compartilhar,
        exporte o <code>board.json</code> e commite em <code>site-data/board.json</code> (ou em{" "}
        <code>public/data/board.json</code> para virar a base do site), ou use a publicação pelo
        GitHub abaixo.
      </>
    ),
    en: (
      <>
        <strong>Local editing active.</strong> Changes stay in this browser. To share, export{" "}
        <code>board.json</code> and commit it to <code>site-data/board.json</code> (or to{" "}
        <code>public/data/board.json</code> to become the site base), or use the GitHub publishing
        below.
      </>
    ),
    ru: (
      <>
        <strong>Локальное редактирование активно.</strong> Изменения остаются в этом браузере.
        Чтобы поделиться, экспортируйте <code>board.json</code> и закоммитьте в{" "}
        <code>site-data/board.json</code> (или в <code>public/data/board.json</code>, чтобы он стал
        базой сайта), или используйте публикацию через GitHub ниже.
      </>
    ),
  },
  tokenHelp: {
    pt: (
      <>
        O token fica apenas nesta aba do navegador (sessionStorage) e é enviado somente para{" "}
        <code>api.github.com</code>. Use um token fine-grained com{" "}
        <strong>Contents: Read and write</strong> no repositório <code>Personed/Game</code>. Nunca
        use um token clássico com acesso total.
      </>
    ),
    en: (
      <>
        The token stays only in this browser tab (sessionStorage) and is sent only to{" "}
        <code>api.github.com</code>. Use a fine-grained token with{" "}
        <strong>Contents: Read and write</strong> on the <code>Personed/Game</code> repository.
        Never use a classic token with full access.
      </>
    ),
    ru: (
      <>
        Токен хранится только в этой вкладке браузера (sessionStorage) и отправляется только на{" "}
        <code>api.github.com</code>. Используйте fine-grained токен с{" "}
        <strong>Contents: Read and write</strong> для репозитория <code>Personed/Game</code>.
        Никогда не используйте классический токен с полным доступом.
      </>
    ),
  },
  footerHint: {
    pt: (
      <>
        O site lê <code>site-data/updates.json</code> automaticamente na aba GitHub. O{" "}
        <code>site-data/board.json</code> vira a base compartilhada quando alguém usa “Puxar board
        do GitHub” ou quando o arquivo é copiado para <code>public/data/board.json</code>.
      </>
    ),
    en: (
      <>
        The site reads <code>site-data/updates.json</code> automatically in the GitHub tab.{" "}
        <code>site-data/board.json</code> becomes the shared base when someone uses “Pull board from
        GitHub” or when the file is copied to <code>public/data/board.json</code>.
      </>
    ),
    ru: (
      <>
        Сайт автоматически читает <code>site-data/updates.json</code> на вкладке GitHub.{" "}
        <code>site-data/board.json</code> становится общей базой, когда кто-то использует
        «Загрузить доску из GitHub» или когда файл копируется в{" "}
        <code>public/data/board.json</code>.
      </>
    ),
  },
};

export function BoardTools({ store, editMode, onEditMode }: BoardToolsProps) {
  const { t, locale } = useWorkT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState(readGithubToken);
  const [busy, setBusy] = useState<"board" | "updates" | "pull" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = (err: unknown) => {
    setNotice(null);
    setError(err instanceof Error ? err.message : String(err));
  };

  const importFile = async (file: File) => {
    setError(null);
    setNotice(null);
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      if (!window.confirm(t("toolsConfirmImport"))) {
        return;
      }
      store.importBoard(raw);
      setNotice({ text: t("toolsImported") });
    } catch (err: unknown) {
      fail(err);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = async () => {
    if (!window.confirm(t("toolsConfirmReset"))) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await store.reset();
      setNotice({ text: t("toolsResetDone") });
    } catch (err: unknown) {
      fail(err);
    }
  };

  const publishBoard = async () => {
    if (!store.state) return;
    if (!token.trim()) {
      setError(t("toolsErrorToken"));
      return;
    }
    setBusy("board");
    setError(null);
    setNotice(null);
    try {
      const result = await publishGithubFile({
        token,
        path: GITHUB_BOARD_PATH,
        content: JSON.stringify(store.state, null, 2),
        message: t("toolsBoardCommit"),
      });
      setNotice({
        text: t("toolsBoardPublished"),
        url: result.commitUrl || undefined,
      });
    } catch (err: unknown) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const publishUpdates = async () => {
    if (!store.state) return;
    if (!token.trim()) {
      setError(t("toolsErrorToken"));
      return;
    }
    setBusy("updates");
    setError(null);
    setNotice(null);
    try {
      const content = JSON.stringify(
        {
          version: 1,
          updatedAt: new Date().toISOString(),
          updates: [...store.state.updates].sort((a, b) => b.data.localeCompare(a.data)),
        },
        null,
        2
      );
      const result = await publishGithubFile({
        token,
        path: GITHUB_UPDATES_PATH,
        content,
        message: t("toolsUpdatesCommit"),
      });
      setNotice({
        text: t("toolsUpdatesPublished"),
        url: result.commitUrl || undefined,
      });
    } catch (err: unknown) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const pullBoard = async () => {
    setBusy("pull");
    setError(null);
    setNotice(null);
    try {
      const board = await fetchGithubBoard();
      if (!board) {
        throw new Error(t("toolsBoardMissing", { path: GITHUB_BOARD_PATH }));
      }
      if (!window.confirm(t("toolsConfirmPull"))) {
        return;
      }
      store.replaceBoard(board);
      setNotice({ text: t("toolsPulled") });
    } catch (err: unknown) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="wb-toolbox">
      <div className="wb-tools">
        <button
          className={`wb-btn ${editMode ? "on" : ""}`}
          onClick={() => onEditMode(!editMode)}
          title={t("toolsTitleToggleEdit")}
        >
          {editMode ? t("toolsEditOn") : t("toolsEditOff")}
        </button>
        <button className="wb-btn" onClick={() => fileRef.current?.click()}>
          {t("toolsImport")}
        </button>
        <button className="wb-btn" onClick={store.exportBoard} disabled={!store.state}>
          {t("toolsExportBoard")}
        </button>
        <button className="wb-btn" onClick={store.exportUpdates} disabled={!store.state}>
          {t("toolsExportUpdates")}
        </button>
        <button className="wb-btn ghost" onClick={() => void reset()}>
          {t("toolsResetBase")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
      </div>

      {editMode && <div className="wb-banner">{RICH.boardBanner[locale]}</div>}

      {(notice || error) && (
        <div className={`wb-notice ${error ? "bad" : "good"}`}>
          {error ?? notice?.text}
          {notice?.url && (
            <>
              {" "}
              <a href={notice.url} target="_blank" rel="noreferrer noopener">
                {t("toolsViewCommit")}
              </a>
            </>
          )}
        </div>
      )}

      <details className="wb-publish">
        <summary>{t("toolsPublishAdvanced")}</summary>
        <div className="wb-publish-body">
          <p>{RICH.tokenHelp[locale]}</p>
          <div className="wb-field">
            <label htmlFor="wb-gh-token">{t("toolsTokenLabel")}</label>
            <input
              id="wb-gh-token"
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
            <span className="wb-hint">{t("toolsTokenHint")}</span>
          </div>
          <div className="wb-publish-actions">
            <button className="wb-btn primary" onClick={() => void publishBoard()} disabled={busy !== null}>
              {busy === "board" ? t("toolsPublishing") : t("toolsPublishBoard", { path: GITHUB_BOARD_PATH })}
            </button>
            <button className="wb-btn" onClick={() => void publishUpdates()} disabled={busy !== null}>
              {busy === "updates" ? t("toolsPublishing") : t("toolsPublishUpdates", { path: GITHUB_UPDATES_PATH })}
            </button>
            <button className="wb-btn ghost" onClick={() => void pullBoard()} disabled={busy !== null}>
              {busy === "pull" ? t("toolsPulling") : t("toolsPullBoard")}
            </button>
          </div>
          <p className="wb-hint">{RICH.footerHint[locale]}</p>
        </div>
      </details>
    </div>
  );
}
