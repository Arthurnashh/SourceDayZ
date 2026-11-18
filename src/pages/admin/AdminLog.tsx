import { useMemo, useState } from "react";
import { formatDateTime } from "../../lib/accounts";
import type { AdminLogEntry } from "../../lib/admin";
import { Empty, SectionHead } from "./shared";

const LABELS: Record<string, string> = {
  "account.rename": "Conta renomeada",
  "account.admin": "Permissão de admin",
  "access.grant": "Acesso concedido",
  "access.revoke": "Acesso revogado",
  "server.status": "Servidor atualizado",
  "order.status": "Pedido atualizado",
  "gateway.update": "Gateway atualizado",
  "site.origins": "Origens atualizadas",
  "site.dev_mode": "Modo de teste",
};

function detailText(detail: Record<string, unknown>): string {
  const entries = Object.entries(detail);
  if (entries.length === 0) return "—";
  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: —`;
      if (typeof value === "object") return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${String(value)}`;
    })
    .join(" · ");
}

export function AdminLog({ log }: { log: AdminLogEntry[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return log;
    return log.filter((entry) =>
      `${entry.admin_name ?? ""} ${entry.admin_email ?? ""} ${entry.action} ${
        entry.target ?? ""
      } ${detailText(entry.detail)}`
        .toLowerCase()
        .includes(query),
    );
  }, [log, search]);

  return (
    <div className="adm-page">
      <SectionHead
        title="Histórico"
        subtitle="Últimas ações administrativas registradas no banco."
      />

      <div className="adm-toolbar">
        <input
          className="adm-input adm-search"
          type="search"
          placeholder="Filtrar por admin, ação ou alvo…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Empty>Nenhuma ação no histórico.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Admin</th>
                <th>Ação</th>
                <th>Alvo</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span className="adm-muted">{formatDateTime(entry.created_at)}</span>
                  </td>
                  <td>
                    <div className="adm-cell-stack">
                      <strong>{entry.admin_name ?? "Sistema"}</strong>
                      <span>{entry.admin_email ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{LABELS[entry.action] ?? entry.action}</strong>
                    <div className="adm-mono adm-muted">{entry.action}</div>
                  </td>
                  <td>
                    <span className="adm-mono adm-muted">
                      {entry.target ? `${entry.target.slice(0, 8)}…` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="adm-log-detail">{detailText(entry.detail)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
