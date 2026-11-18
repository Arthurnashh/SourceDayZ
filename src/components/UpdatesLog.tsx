import { useMemo, useState, type FormEvent } from "react";
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
  UPDATE_KIND_LABEL,
  type UpdateEntry,
  type UpdateKind,
  type WorkStore,
} from "../lib/work";

const TIPOS: UpdateKind[] = ["patch", "implementacao", "build", "anuncio"];

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
      setError("Informe um token do GitHub com permissão Contents: Read and write.");
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
        message: "docs(site): publica atualizações curadas",
      });
      setNotice(
        result.commitUrl
          ? `Manifesto publicado no GitHub. Commit: ${result.commitUrl}`
          : "Manifesto publicado no GitHub."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (entry: UpdateEntry) => {
    if (window.confirm(`Excluir a atualização “${entry.titulo}”?`)) {
      store.deleteUpdate(entry.id);
    }
  };

  return (
    <section className="wb updates-log">
      <div className="wb-top">
        <div className="wb-title">
          <span className="kicker">registro curado · publicado pelo GitHub</span>
          <h2>Atualizações do projeto</h2>
          <p>
            Este é o changelog mantido à mão. Quem tem a source adiciona aqui e publica o arquivo{" "}
            <code>{GITHUB_UPDATES_PATH}</code> no repositório; o site reconhece o manifesto e os
            commits automaticamente na aba <strong>Feed do GitHub</strong>.
          </p>
        </div>
        <div className="wb-tools">
          <button
            className={`wb-btn ${editMode ? "on" : ""}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Edição ativa" : "Ativar edição"}
          </button>
          {editMode && (
            <button className="wb-btn primary" onClick={() => setDraft(newUpdate())}>
              + Nova atualização
            </button>
          )}
          <button className="wb-btn" onClick={exportAll} disabled={!store.state}>
            Exportar updates
          </button>
        </div>
      </div>

      {editMode && (
        <div className="wb-banner">
          <strong>Edição local ativa.</strong> As entradas ficam neste navegador até você publicar o
          manifesto no GitHub. Use o bloco <em>Publicar no GitHub</em> abaixo ou exporte o JSON e
          commite em <code>{GITHUB_UPDATES_PATH}</code>.
        </div>
      )}

      {(notice || error) && (
        <div className={`wb-notice ${error ? "bad" : "good"}`}>{error ?? notice}</div>
      )}

      <div className="updates-list">
        {updates.map((entry) => (
          <article className={`update-entry ${entry.tipo}`} key={entry.id}>
            <header>
              <span className={`gh-type ${entry.tipo}`}>{UPDATE_KIND_LABEL[entry.tipo]}</span>
              {entry.versao && <code>{entry.versao}</code>}
              <time dateTime={entry.data}>{fmtDate(entry.data, true)}</time>
              <span className={`update-origin ${entry.origem}`}>
                {entry.origem === "github" ? "GitHub" : "manual"}
              </span>
            </header>
            <h3>{entry.titulo}</h3>
            <p className="update-summary">{entry.resumo}</p>
            {entry.detalhes && <p className="update-details">{entry.detalhes}</p>}
            <footer>
              {entry.autor && <span>por {entry.autor}</span>}
              {entry.url && (
                <a href={entry.url} target="_blank" rel="noreferrer noopener">
                  referência ↗
                </a>
              )}
              {editMode && (
                <div className="wb-actions">
                  <button className="wb-mini" onClick={() => setDraft({ ...entry })}>
                    Editar
                  </button>
                  <button className="wb-mini danger" onClick={() => remove(entry)}>
                    Excluir
                  </button>
                </div>
              )}
            </footer>
          </article>
        ))}
        {updates.length === 0 && (
          <div className="empty">
            Nenhuma atualização curada ainda. Ative a edição e adicione a primeira.
          </div>
        )}
      </div>

      <details className="wb-publish">
        <summary>Publicar no GitHub</summary>
        <div className="wb-publish-body">
          <p>
            O token fica nesta aba do navegador (sessionStorage) e só é enviado para{" "}
            <code>api.github.com</code>. Use um token fine-grained com{" "}
            <strong>Contents: Read and write</strong> apenas no repositório{" "}
            <code>Personed/Game</code>.
          </p>
          <div className="wb-field">
            <label htmlFor="updates-token">Token do GitHub</label>
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
              {busy ? "Publicando..." : `Publicar ${GITHUB_UPDATES_PATH}`}
            </button>
          </div>
        </div>
      </details>

      {draft && (
        <Modal
          title={updates.some((entry) => entry.id === draft.id) ? "Editar atualização" : "Nova atualização"}
          subtitle="O que mudou, quando e em qual versão."
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
  const [draft, setDraft] = useState<UpdateEntry>({ ...entry });
  const [when, setWhen] = useState(toLocalInput(entry.data));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.titulo.trim()) {
      setError("Informe o título da atualização.");
      return;
    }
    if (!draft.resumo.trim()) {
      setError("Escreva um resumo do que mudou.");
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
        <label htmlFor="up-title">Título *</label>
        <input
          id="up-title"
          value={draft.titulo}
          autoFocus
          onChange={(event) => setDraft({ ...draft, titulo: event.target.value })}
          placeholder="Patch V38, build E7, nova frente..."
        />
      </div>

      <div className="wb-field">
        <label htmlFor="up-summary">Resumo *</label>
        <textarea
          id="up-summary"
          value={draft.resumo}
          onChange={(event) => setDraft({ ...draft, resumo: event.target.value })}
          placeholder="O que mudou e qual é o impacto para quem joga."
        />
      </div>

      <div className="wb-field">
        <label htmlFor="up-details">Detalhes</label>
        <textarea
          id="up-details"
          value={draft.detalhes ?? ""}
          onChange={(event) => setDraft({ ...draft, detalhes: event.target.value })}
          placeholder="Arquivos, hashes, testes, pendências."
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="up-type">Tipo</label>
          <select
            id="up-type"
            value={draft.tipo}
            onChange={(event) => setDraft({ ...draft, tipo: event.target.value as UpdateKind })}
          >
            {TIPOS.map((tipo) => (
              <option value={tipo} key={tipo}>
                {UPDATE_KIND_LABEL[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div className="wb-field">
          <label htmlFor="up-when">Data</label>
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
          <label htmlFor="up-version">Versão / build</label>
          <input
            id="up-version"
            value={draft.versao ?? ""}
            onChange={(event) => setDraft({ ...draft, versao: event.target.value })}
            placeholder="V38, E7, site..."
          />
        </div>
        <div className="wb-field">
          <label htmlFor="up-author">Autor</label>
          <input
            id="up-author"
            value={draft.autor ?? ""}
            onChange={(event) => setDraft({ ...draft, autor: event.target.value })}
            placeholder="quem publicou"
          />
        </div>
      </div>

      <div className="wb-field">
        <label htmlFor="up-url">Link de referência</label>
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
          Cancelar
        </button>
        <button type="submit" className="wb-btn primary">
          Salvar atualização
        </button>
      </div>
    </form>
  );
}
