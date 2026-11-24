import { useMemo, useState } from "react";
import { formatDate } from "../../lib/accounts";
import type { AdminServer } from "../../lib/admin";
import { Empty, SectionHead, StatusPill } from "./shared";

type Filter = "todos" | "em_analise" | "ativo" | "pausado" | "encerrado";

interface Props {
  servers: AdminServer[];
  busy: string | null;
  onAction: (
    server: AdminServer,
    status: "ativo" | "pausado" | "encerrado",
  ) => void;
}

const FILTERS: Array<[Filter, string]> = [
  ["todos", "Todos"],
  ["em_analise", "Em análise"],
  ["ativo", "Ativos"],
  ["pausado", "Pausados"],
  ["encerrado", "Encerrados"],
];

function ServerCard({
  server,
  busy,
  onAction,
}: {
  server: AdminServer;
  busy: string | null;
  onAction: Props["onAction"];
}) {
  const serverBusy = busy === `server:${server.id}`;

  return (
    <article className="adm-server-card">
      <header>
        <div>
          <div className="adm-server-title">
            <h2>{server.name}</h2>
            <StatusPill status={server.status} />
          </div>
          <p>
            {server.region} · {server.slots} slots · criado em {formatDate(server.created_at)}
          </p>
        </div>
        <div className="adm-server-actions">
          {server.status === "em_analise" && (
            <button
              className="sd-btn primary adm-btn-sm"
              type="button"
              disabled={serverBusy}
              onClick={() => onAction(server, "ativo")}
            >
              {serverBusy ? "…" : "Aprovar"}
            </button>
          )}
          {server.status === "ativo" && (
            <button
              className="sd-btn ghost adm-btn-sm"
              type="button"
              disabled={serverBusy}
              onClick={() => onAction(server, "pausado")}
            >
              {serverBusy ? "…" : "Pausar"}
            </button>
          )}
          {(server.status === "pausado" || server.status === "encerrado") && (
            <button
              className="sd-btn primary adm-btn-sm"
              type="button"
              disabled={serverBusy}
              onClick={() => onAction(server, "ativo")}
            >
              {serverBusy ? "…" : "Reativar"}
            </button>
          )}
          {server.status !== "encerrado" && (
            <button
              className="adm-link danger"
              type="button"
              disabled={serverBusy}
              onClick={() => onAction(server, "encerrado")}
            >
              Encerrar
            </button>
          )}
        </div>
      </header>

      <div className="adm-server-body">
        <div className="adm-server-owner">
          <span>Dono</span>
          <strong>{server.owner_name}</strong>
          <small>
            {server.owner_email}
            {server.owner_steam ? ` · Steam: ${server.owner_steam}` : ""}
            {server.owner_steam_verified ? " ✓" : ""}
          </small>
        </div>

        <div className="adm-meta-grid">
          <div>
            <span>Linha do tempo</span>
            <strong>
              {server.activated_at ? `ativo ${formatDate(server.activated_at)}` : "nunca ativado"}
            </strong>
            <small>
              {server.paused_at
                ? `pausado ${formatDate(server.paused_at)}`
                : server.closed_at
                  ? `encerrado ${formatDate(server.closed_at)}`
                  : "sem pausas"}
            </small>
          </div>
        </div>

        {server.description && <p className="adm-server-desc">{server.description}</p>}

        {server.discord && (
          <a
            className="adm-link"
            href={server.discord}
            target="_blank"
            rel="noreferrer noopener"
          >
            Discord do servidor ↗
          </a>
        )}
      </div>
    </article>
  );
}

export function AdminServers({ servers, busy, onAction }: Props) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return servers.filter((server) => {
      if (filter !== "todos" && server.status !== filter) return false;
      if (!query) return true;
      const haystack = `${server.name} ${server.owner_name} ${server.owner_email}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, search, servers]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: servers.length };
    for (const server of servers) {
      map[server.status] = (map[server.status] ?? 0) + 1;
    }
    return map;
  }, [servers]);

  return (
    <div className="adm-page">
      <SectionHead
        title="Servidores"
        subtitle="Aprove, pause, reative ou encerre as solicitações da comunidade."
      />

      <div className="adm-toolbar">
        <input
          className="adm-input adm-search"
          type="search"
          placeholder="Buscar servidor ou dono…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="adm-seg" role="tablist" aria-label="Filtrar servidores">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "on" : ""}
              onClick={() => setFilter(key)}
            >
              {label} <em>{counts[key] ?? 0}</em>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty>Nenhum servidor neste filtro.</Empty>
      ) : (
        <div className="adm-server-list">
          {filtered.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              busy={busy}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
