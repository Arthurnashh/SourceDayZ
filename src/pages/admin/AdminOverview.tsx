import { formatBRL, formatDate, formatDateTime } from "../../lib/accounts";
import type {
  AdminDashboard,
  AdminLogEntry,
  AdminOrder,
  AdminServer,
} from "../../lib/admin";
import { Empty, Metric, SectionHead, StatusPill, type AdminTab } from "./shared";

interface Props {
  dashboard: AdminDashboard | null;
  servers: AdminServer[];
  orders: AdminOrder[];
  log: AdminLogEntry[];
  busy: string | null;
  onTab: (tab: AdminTab) => void;
  onServerAction: (
    server: AdminServer,
    status: "ativo" | "pausado" | "encerrado",
  ) => void;
  onOrderAction: (order: AdminOrder, status: "pago" | "cancelado") => void;
}

function ActionLabel({ action }: { action: string }) {
  const labels: Record<string, string> = {
    "account.rename": "Conta renomeada",
    "account.admin": "Permissão de admin alterada",
    "account.dev": "Permissão de desenvolvedor alterada",
    "account.create_dev": "Conta dev criada",
    "access.grant": "Acesso concedido",
    "access.revoke": "Acesso revogado",
    "server.status": "Status de servidor alterado",
    "order.status": "Pedido atualizado",
    "gateway.update": "Gateway atualizado",
    "site.origins": "Origens atualizadas",
    "site.dev_mode": "Modo de teste alterado",
  };
  return <>{labels[action] ?? action}</>;
}

export function AdminOverview({
  dashboard,
  servers,
  orders,
  log,
  busy,
  onTab,
  onServerAction,
  onOrderAction,
}: Props) {
  const pendingServers = servers.filter((server) => server.status === "em_analise").slice(0, 5);
  const pendingOrders = orders.filter((order) => order.status === "aguardando").slice(0, 5);

  return (
    <div className="adm-page">
      <SectionHead
        title="Visão geral"
        subtitle="Contas, acessos, servidores e receita em um só lugar."
      />

      <div className="adm-metrics">
        <Metric
          label="contas"
          value={dashboard?.accounts ?? "—"}
          detail={`${dashboard?.admins ?? 0} admin(s) · ${dashboard?.devs ?? 0} dev(s)`}
          tone="lime"
        />
        <Metric
          label="Steam verificada"
          value={dashboard?.steam_verified ?? "—"}
          detail="posse confirmada por OpenID"
          tone="blue"
        />
        <Metric
          label="acessos ativos"
          value={dashboard?.grants_active ?? "—"}
          detail="mensal, vitalício e cortesia"
        />
        <Metric
          label="receita 30 dias"
          value={dashboard ? formatBRL(dashboard.revenue_30d_cents) : "—"}
          detail={dashboard ? `${formatBRL(dashboard.revenue_cents)} no total` : undefined}
          tone="lime"
        />
      </div>

      <div className="adm-metrics">
        <Metric
          label="servidores"
          value={dashboard?.servers_total ?? "—"}
          detail={`${dashboard?.servers_active ?? 0} ativos · ${dashboard?.servers_pending ?? 0} em análise`}
        />
        <Metric
          label="convidados"
          value={dashboard?.guests ?? "—"}
          detail="vagas de 1 mês resgatadas"
        />
        <Metric
          label="pedidos pendentes"
          value={dashboard?.orders_pending ?? "—"}
          detail={`${dashboard?.orders_paid ?? 0} pagos`}
          tone={dashboard && dashboard.orders_pending > 0 ? "amber" : undefined}
        />
        <Metric
          label="gateway"
          value={dashboard?.gateway_ready ? "configurado" : "manual"}
          detail="configuração em Gateway"
          tone={dashboard?.gateway_ready ? "lime" : "amber"}
        />
      </div>

      <div className="adm-overview-grid">
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Fila de servidores</h2>
              <p>Solicitações aguardando aprovação.</p>
            </div>
            <button className="adm-link" type="button" onClick={() => onTab("servidores")}>
              Ver todos
            </button>
          </div>

          {pendingServers.length === 0 ? (
            <Empty>Nenhuma solicitação pendente.</Empty>
          ) : (
            <div className="adm-rows">
              {pendingServers.map((server) => (
                <div className="adm-row" key={server.id}>
                  <div className="adm-row-main">
                    <strong>{server.name}</strong>
                    <span>
                      {server.owner_name} · {server.region} · {server.slots} slots ·{" "}
                      {formatDate(server.created_at)}
                    </span>
                  </div>
                  <button
                    className="sd-btn primary adm-btn-sm"
                    type="button"
                    disabled={busy === `server:${server.id}`}
                    onClick={() => onServerAction(server, "ativo")}
                  >
                    {busy === `server:${server.id}` ? "…" : "Aprovar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Pedidos de acesso</h2>
              <p>Pagamentos aguardando conferência.</p>
            </div>
            <button className="adm-link" type="button" onClick={() => onTab("pedidos")}>
              Ver todos
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <Empty>Nenhum pedido pendente.</Empty>
          ) : (
            <div className="adm-rows">
              {pendingOrders.map((order) => (
                <div className="adm-row" key={order.id}>
                  <div className="adm-row-main">
                    <strong>{order.user_name}</strong>
                    <span>
                      {formatBRL(order.amount_cents)} · {formatDate(order.created_at)}
                    </span>
                  </div>
                  <button
                    className="sd-btn primary adm-btn-sm"
                    type="button"
                    disabled={busy === `order:${order.id}`}
                    onClick={() => onOrderAction(order, "pago")}
                  >
                    {busy === `order:${order.id}` ? "…" : "Marcar pago"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Status dos servidores</h2>
              <p>Distribuição atual.</p>
            </div>
          </div>
          <div className="adm-status-list">
            {(["em_analise", "ativo", "pausado", "encerrado"] as const).map((status) => (
              <div key={status}>
                <StatusPill status={status} />
                <strong>
                  {status === "em_analise"
                    ? dashboard?.servers_pending
                    : status === "ativo"
                      ? dashboard?.servers_active
                      : status === "pausado"
                        ? dashboard?.servers_paused
                        : dashboard?.servers_closed ?? 0}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Últimas ações</h2>
              <p>Histórico do painel.</p>
            </div>
            <button className="adm-link" type="button" onClick={() => onTab("historico")}>
              Ver histórico
            </button>
          </div>

          {log.length === 0 ? (
            <Empty>Nenhuma ação registrada ainda.</Empty>
          ) : (
            <div className="adm-timeline">
              {log.slice(0, 6).map((entry) => (
                <div key={entry.id}>
                  <span />
                  <div>
                    <strong>
                      <ActionLabel action={entry.action} />
                    </strong>
                    <small>
                      {entry.admin_name ?? "Sistema"} · {formatDateTime(entry.created_at)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
