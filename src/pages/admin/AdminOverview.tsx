import { formatDate, formatDateTime } from "../../lib/accounts";
import type {
  AdminDashboard,
  AdminLogEntry,
  AdminServer,
} from "../../lib/admin";
import { Empty, Metric, SectionHead, StatusPill, type AdminTab } from "./shared";

interface Props {
  dashboard: AdminDashboard | null;
  servers: AdminServer[];
  log: AdminLogEntry[];
  busy: string | null;
  onTab: (tab: AdminTab) => void;
  onServerAction: (
    server: AdminServer,
    status: "ativo" | "pausado" | "encerrado",
  ) => void;
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
    "order.status": "Ação administrativa registrada",
    "gateway.update": "Configuração administrativa atualizada",
    "site.origins": "Origens atualizadas",
    "site.dev_mode": "Modo de teste alterado",
  };
  return <>{labels[action] ?? action}</>;
}

export function AdminOverview({
  dashboard,
  servers,
  log,
  busy,
  onTab,
  onServerAction,
}: Props) {
  const pendingServers = servers.filter((server) => server.status === "em_analise").slice(0, 5);

  return (
    <div className="adm-page">
      <SectionHead
        title="Visão geral"
        subtitle="Contas gratuitas e servidores da comunidade em um só lugar."
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
          label="servidores ativos"
          value={dashboard?.servers_active ?? "—"}
          detail={`${dashboard?.servers_total ?? 0} no total`}
        />
        <Metric
          label="servidores em análise"
          value={dashboard?.servers_pending ?? "—"}
          detail="aguardando revisão da equipe"
        />
      </div>

      <div className="adm-metrics">
        <Metric
          label="servidores pausados"
          value={dashboard?.servers_paused ?? "—"}
          detail="podem ser reativados"
        />
        <Metric
          label="servidores encerrados"
          value={dashboard?.servers_closed ?? "—"}
          detail="registros encerrados"
        />
        <Metric
          label="acesso ao projeto"
          value="Grátis"
          detail="sem mensalidade ou cobrança"
          tone="lime"
        />
        <Metric
          label="jogadores convidados"
          value={dashboard?.guests ?? "—"}
          detail="convites registrados nos servidores"
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
