import { useMemo, useState } from "react";
import { formatBRL, formatDate, formatDateTime } from "../../lib/accounts";
import type { AdminOrder } from "../../lib/admin";
import { Empty, SectionHead, StatusPill } from "./shared";

type Filter = "todos" | "aguardando" | "pago" | "cancelado";

interface Props {
  orders: AdminOrder[];
  busy: string | null;
  onAction: (order: AdminOrder, status: "pago" | "cancelado") => void;
}

const FILTERS: Array<[Filter, string]> = [
  ["todos", "Todos"],
  ["aguardando", "Aguardando"],
  ["pago", "Pagos"],
  ["cancelado", "Cancelados"],
];

export function AdminOrders({ orders, busy, onAction }: Props) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "todos" && order.status !== filter) return false;
      if (!query) return true;
      return `${order.user_name} ${order.user_email} ${order.id}`.toLowerCase().includes(query);
    });
  }, [filter, orders, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: orders.length };
    for (const order of orders) {
      map[order.status] = (map[order.status] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  const pendingTotal = orders
    .filter((order) => order.status === "aguardando")
    .reduce((sum, order) => sum + order.amount_cents, 0);

  return (
    <div className="adm-page">
      <SectionHead
        title="Pedidos"
        subtitle="Confira pagamentos e libere o acesso mensal de 30 dias."
      />

      <div className="adm-note">
        <strong>Pagamento manual</strong>
        <span>
          Enquanto o checkout automático não está publicado, confira o Pix/cartão no seu
          recebedor e clique em <b>Marcar pago</b>. O sistema libera 30 dias de acesso na hora.
          {pendingTotal > 0 && ` Em aberto: ${formatBRL(pendingTotal)}.`}
        </span>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-input adm-search"
          type="search"
          placeholder="Buscar jogador, e-mail ou ID do pedido…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="adm-seg" role="tablist" aria-label="Filtrar pedidos">
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
        <Empty>Nenhum pedido neste filtro.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Plano</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Criado</th>
                <th>Pago em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const orderBusy = busy === `order:${order.id}`;
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="adm-cell-stack">
                        <strong>{order.user_name}</strong>
                        <span>{order.user_email}</span>
                        <small className="adm-mono">{order.id.slice(0, 8)}</small>
                      </div>
                    </td>
                    <td>{order.plan}</td>
                    <td>
                      <strong>{formatBRL(order.amount_cents)}</strong>
                      <div className="adm-muted">{order.method ?? "—"}</div>
                    </td>
                    <td>
                      <StatusPill status={order.status} />
                    </td>
                    <td>
                      <span className="adm-muted">{formatDate(order.created_at)}</span>
                    </td>
                    <td>
                      <span className="adm-muted">
                        {order.paid_at ? formatDateTime(order.paid_at) : "—"}
                      </span>
                    </td>
                    <td>
                      {order.status === "aguardando" ? (
                        <div className="adm-row-actions">
                          <button
                            className="sd-btn primary adm-btn-sm"
                            type="button"
                            disabled={orderBusy}
                            onClick={() => onAction(order, "pago")}
                          >
                            {orderBusy ? "…" : "Marcar pago"}
                          </button>
                          <button
                            className="adm-link danger"
                            type="button"
                            disabled={orderBusy}
                            onClick={() => onAction(order, "cancelado")}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="adm-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
