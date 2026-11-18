import { useRef, useState } from "react";
import {
  fetchGithubBoard,
  GITHUB_BOARD_PATH,
  GITHUB_UPDATES_PATH,
  publishGithubFile,
  readGithubToken,
  saveGithubToken,
} from "../lib/github";
import type { WorkStore } from "../lib/work";

interface BoardToolsProps {
  store: WorkStore;
  editMode: boolean;
  onEditMode: (value: boolean) => void;
}

type Notice = { text: string; url?: string } | null;

export function BoardTools({ store, editMode, onEditMode }: BoardToolsProps) {
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
      if (
        !window.confirm(
          "Importar este arquivo e substituir o quadro atual deste navegador? Exporte uma cópia antes se precisar."
        )
      ) {
        return;
      }
      store.importBoard(raw);
      setNotice({ text: "Arquivo importado. O quadro deste navegador foi substituído." });
    } catch (err: unknown) {
      fail(err);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Restaurar o quadro base do site? Tarefas, bugs e atualizações adicionados neste navegador serão descartados."
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await store.reset();
      setNotice({ text: "Quadro restaurado a partir de data/board.json." });
    } catch (err: unknown) {
      fail(err);
    }
  };

  const publishBoard = async () => {
    if (!store.state) return;
    if (!token.trim()) {
      setError("Informe um token do GitHub com permissão Contents: Read and write.");
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
        message: "chore(site): atualiza quadro de tarefas e bugs",
      });
      setNotice({
        text: "Board publicado no GitHub.",
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
      setError("Informe um token do GitHub com permissão Contents: Read and write.");
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
        message: "docs(site): publica atualizações curadas",
      });
      setNotice({
        text: "Manifesto de atualizações publicado no GitHub.",
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
        throw new Error(
          `O repositório ainda não tem ${GITHUB_BOARD_PATH}. Publique o board primeiro.`
        );
      }
      if (
        !window.confirm(
          "Substituir o quadro deste navegador pelo board publicado no GitHub? As alterações locais não publicadas serão perdidas."
        )
      ) {
        return;
      }
      store.replaceBoard(board);
      setNotice({ text: "Board sincronizado a partir do GitHub." });
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
          title="Libera os botões de adicionar, editar, concluir e excluir"
        >
          {editMode ? "Edição ativa" : "Ativar edição"}
        </button>
        <button className="wb-btn" onClick={() => fileRef.current?.click()}>
          Importar
        </button>
        <button className="wb-btn" onClick={store.exportBoard} disabled={!store.state}>
          Exportar board
        </button>
        <button className="wb-btn" onClick={store.exportUpdates} disabled={!store.state}>
          Exportar updates
        </button>
        <button className="wb-btn ghost" onClick={() => void reset()}>
          Restaurar base
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

      {editMode && (
        <div className="wb-banner">
          <strong>Edição local ativa.</strong> As mudanças ficam neste navegador. Para compartilhar,
          exporte o <code>board.json</code> e commite em <code>site-data/board.json</code> (ou em{" "}
          <code>public/data/board.json</code> para virar a base do site), ou use a publicação pelo
          GitHub abaixo.
        </div>
      )}

      {(notice || error) && (
        <div className={`wb-notice ${error ? "bad" : "good"}`}>
          {error ?? notice?.text}
          {notice?.url && (
            <>
              {" "}
              <a href={notice.url} target="_blank" rel="noreferrer noopener">
                ver commit ↗
              </a>
            </>
          )}
        </div>
      )}

      <details className="wb-publish">
        <summary>Publicação avançada · GitHub</summary>
        <div className="wb-publish-body">
          <p>
            O token fica apenas nesta aba do navegador (sessionStorage) e é enviado somente para{" "}
            <code>api.github.com</code>. Use um token fine-grained com{" "}
            <strong>Contents: Read and write</strong> no repositório{" "}
            <code>Personed/Game</code>. Nunca use um token clássico com acesso total.
          </p>
          <div className="wb-field">
            <label htmlFor="wb-gh-token">Token do GitHub</label>
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
            <span className="wb-hint">
              Sem token, use Exportar board e commite o arquivo manualmente.
            </span>
          </div>
          <div className="wb-publish-actions">
            <button className="wb-btn primary" onClick={() => void publishBoard()} disabled={busy !== null}>
              {busy === "board" ? "Publicando..." : `Publicar ${GITHUB_BOARD_PATH}`}
            </button>
            <button className="wb-btn" onClick={() => void publishUpdates()} disabled={busy !== null}>
              {busy === "updates" ? "Publicando..." : `Publicar ${GITHUB_UPDATES_PATH}`}
            </button>
            <button className="wb-btn ghost" onClick={() => void pullBoard()} disabled={busy !== null}>
              {busy === "pull" ? "Puxando..." : "Puxar board do GitHub"}
            </button>
          </div>
          <p className="wb-hint">
            O site lê <code>site-data/updates.json</code> automaticamente na aba GitHub. O{" "}
            <code>site-data/board.json</code> vira a base compartilhada quando alguém usa “Puxar
            board do GitHub” ou quando o arquivo é copiado para <code>public/data/board.json</code>.
          </p>
        </div>
      </details>
    </div>
  );
}
