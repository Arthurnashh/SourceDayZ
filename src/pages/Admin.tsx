import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { navigate } from "../lib/router";
import {
  USING_SUPABASE,
  loginAccount,
  logoutAccount,
  useAccountStore,
  useCurrentAccount,
} from "../lib/accounts";
import {
  getAdminDashboard,
  getAdminSettings,
  listAdminAccounts,
  listAdminLog,
  listAdminOrders,
  listAdminServers,
  setAdminOrderStatus,
  setAdminServerStatus,
  type AdminAccount,
  type AdminDashboard,
  type AdminLogEntry,
  type AdminOrder,
  type AdminServer,
  type AdminSettings,
} from "../lib/admin";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminAccounts } from "./admin/AdminAccounts";
import { AdminServers } from "./admin/AdminServers";
import { AdminOrders } from "./admin/AdminOrders";
import { AdminGateway } from "./admin/AdminGateway";
import { AdminSettings as AdminSiteSettings } from "./admin/AdminSettings";
import { AdminLog } from "./admin/AdminLog";
import {
  NoticeBar,
  type AdminNotice,
  type AdminTab,
} from "./admin/shared";

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const NAV: Array<{ key: AdminTab; label: string; icon: ReactNode }> = [
  {
    key: "visao",
    label: "Visão geral",
    icon: icon("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"),
  },
  {
    key: "contas",
    label: "Contas",
    icon: icon("M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M18 21a6 6 0 0 0-3-5.2"),
  },
  {
    key: "servidores",
    label: "Servidores",
    icon: icon("M4 5h16v5H4zM4 14h16v5H4zM8 8h.01M8 17h.01"),
  },
  {
    key: "pedidos",
    label: "Pedidos",
    icon: icon("M6 6h15l-1.5 8.5H7.5L6 3H3M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"),
  },
  {
    key: "gateway",
    label: "Gateway",
    icon: icon("M3 7h18v10H3zM3 10h18M7 14h3"),
  },
  {
    key: "ajustes",
    label: "Ajustes",
    icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 3h5l.4-3a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"),
  },
  {
    key: "historico",
    label: "Histórico",
    icon: icon("M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"),
  },
];

function Brand() {
  return (
    <button className="sd-brand" type="button" onClick={() => navigate("")} aria-label="SourceDayZ">
      <span className="sd-mark">SD</span>
      <span className="sd-brand-text">
        <strong>SOURCEDAYZ</strong>
        <small>administração</small>
      </span>
    </button>
  );
}

function AdminLogin({ error }: { error: string | null }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setBusy(true);
    const result = await loginAccount({ email, senha });
    setBusy(false);
    if (!result.ok) setErro(result.error);
  }

  return (
    <div className="adm-gate-page">
      <header className="acc-top acc-top-gate">
        <Brand />
        <button className="sd-btn ghost acc-back" type="button" onClick={() => navigate("")}>
          Voltar ao site
        </button>
      </header>

      <main className="adm-gate-main">
        <section className="adm-gate-copy">
          <p className="sd-eyebrow">acesso restrito</p>
          <h1>Painel administrativo</h1>
          <p>
            Contas, solicitações de servidor, pedidos e gateway do SourceDayZ. Entre com uma
            conta que tenha permissão de administrador.
          </p>
          <ul>
            <li>Contas e acessos</li>
            <li>Aprovação de servidores</li>
            <li>Pedidos e gateway</li>
            <li>Histórico de ações</li>
          </ul>
        </section>

        <section className="adm-gate-card">
          <p className="sd-eyebrow">equipe</p>
          <h2>Entrar no painel</h2>

          {!USING_SUPABASE ? (
            <p className="auth-error" role="alert">
              O painel precisa do Supabase configurado neste build. Sem banco real, não há
              contas administrativas.
            </p>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              <label className="sd-field">
                <span>E-mail</span>
                <input
                  className="adm-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@sourcedayz.com"
                  required
                />
              </label>
              <label className="sd-field">
                <span>Senha</span>
                <input
                  className="adm-input"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="sua senha"
                  required
                />
              </label>

              {(erro || error) && (
                <p className="auth-error" role="alert">
                  {erro ?? error}
                </p>
              )}

              <button className="sd-btn primary sd-btn-block" type="submit" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </button>
            </form>
          )}

          <p className="adm-gate-foot">
            É jogador? <button type="button" onClick={() => navigate("minha-conta")}>Ir para minha conta</button>
          </p>
        </section>
      </main>
    </div>
  );
}

function AdminDenied() {
  const account = useCurrentAccount();

  return (
    <div className="adm-gate-page">
      <header className="acc-top acc-top-gate">
        <Brand />
        <button className="sd-btn ghost acc-back" type="button" onClick={() => navigate("")}>
          Voltar ao site
        </button>
      </header>

      <main className="adm-gate-main adm-denied">
        <section className="adm-gate-copy">
          <p className="sd-eyebrow">acesso restrito</p>
          <h1>Sem permissão</h1>
          <p>
            {account?.nome ? `${account.nome}, esta` : "Esta"} conta está logada, mas não tem
            permissão de administrador.
          </p>
          <p className="adm-muted">
            Se você deveria ter acesso, peça a um administrador para liberar a conta em
            <b> Contas → Gerenciar → Tornar admin</b>.
          </p>
        </section>

        <section className="adm-gate-card">
          <p className="sd-eyebrow">conta atual</p>
          <h2>{account?.nome ?? "Visitante"}</h2>
          <p className="adm-muted">{account?.email ?? "sem sessão"}</p>
          <button
            className="sd-btn primary sd-btn-block"
            type="button"
            onClick={() => navigate("minha-conta")}
          >
            Ir para minha conta
          </button>
          <button
            className="sd-btn ghost sd-btn-block"
            type="button"
            onClick={async () => {
              await logoutAccount();
              navigate("");
            }}
          >
            Sair desta conta
          </button>
        </section>
      </main>
    </div>
  );
}

export function Admin() {
  const store = useAccountStore();
  const account = useCurrentAccount();

  const [tab, setTab] = useState<AdminTab>("visao");
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [accountList, setAccountList] = useState<AdminAccount[]>([]);
  const [servers, setServers] = useState<AdminServer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [log, setLog] = useState<AdminLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!store.ready || !account?.isAdmin) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [dashRes, accountsRes, serversRes, ordersRes, settingsRes, logRes] =
        await Promise.all([
          getAdminDashboard(),
          listAdminAccounts("", 500),
          listAdminServers(),
          listAdminOrders(),
          getAdminSettings(),
          listAdminLog(150),
        ]);

      if (cancelled) return;

      const errors: string[] = [];
      if (dashRes.ok) setDashboard(dashRes.data);
      else errors.push(dashRes.error);
      if (accountsRes.ok) setAccountList(accountsRes.data);
      else errors.push(accountsRes.error);
      if (serversRes.ok) setServers(serversRes.data);
      else errors.push(serversRes.error);
      if (ordersRes.ok) setOrders(ordersRes.data);
      else errors.push(ordersRes.error);
      if (settingsRes.ok) setSettings(settingsRes.data);
      else errors.push(settingsRes.error);
      if (logRes.ok) setLog(logRes.data);
      else errors.push(logRes.error);

      setError(errors[0] ?? null);
      setLoaded(true);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [account?.id, account?.isAdmin, reloadKey, store.ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!store.ready) {
    return (
      <div className="adm-gate-page">
        <header className="acc-top acc-top-gate">
          <Brand />
        </header>
        <main className="adm-gate-main">
          <section className="adm-gate-copy">
            <p className="sd-eyebrow">administração</p>
            <h1>Carregando…</h1>
            <p>Conferindo a sessão e o nível de acesso.</p>
          </section>
        </main>
      </div>
    );
  }

  if (!account) return <AdminLogin error={null} />;
  if (!account.isAdmin) return <AdminDenied />;

  const selfId = account.id;

  async function changeServer(
    server: AdminServer,
    status: "ativo" | "pausado" | "encerrado",
  ) {
    const action =
      status === "ativo"
        ? server.status === "em_analise"
          ? "Aprovar"
          : "Reativar"
        : status === "pausado"
          ? "Pausar"
          : "Encerrar";

    if (status !== "ativo" || server.status !== "em_analise") {
      const detail =
        status === "encerrado"
          ? " O acesso vitalício do dono será revogado."
          : status === "pausado"
            ? " O acesso vitalício do dono será suspenso."
            : "";
      if (!window.confirm(`${action} o servidor “${server.name}”?${detail}`)) return;
    }

    setBusy(`server:${server.id}`);
    const result = await setAdminServerStatus(server.id, status);
    setBusy(null);
    if (!result.ok) {
      setNotice({ tone: "bad", text: result.error });
      return;
    }
    setNotice({ tone: "ok", text: `Servidor “${server.name}”: ${action.toLowerCase()}.` });
    reload();
  }

  async function changeOrder(order: AdminOrder, status: "pago" | "cancelado") {
    const message =
      status === "pago"
        ? `Confirmar o pagamento de ${order.user_name}? O acesso de 30 dias será liberado.`
        : `Cancelar o pedido de ${order.user_name}?`;
    if (!window.confirm(message)) return;

    setBusy(`order:${order.id}`);
    const result = await setAdminOrderStatus(order.id, status);
    setBusy(null);
    if (!result.ok) {
      setNotice({ tone: "bad", text: result.error });
      return;
    }
    setNotice({
      tone: "ok",
      text: status === "pago" ? "Pagamento confirmado e acesso liberado." : "Pedido cancelado.",
    });
    reload();
  }

  const pendingServers = dashboard?.servers_pending ?? 0;
  const pendingOrders = dashboard?.orders_pending ?? 0;

  function renderPage() {
    switch (tab) {
      case "contas":
        return (
          <AdminAccounts
            accounts={accountList}
            selfId={selfId}
            onChanged={reload}
            onNotice={setNotice}
          />
        );
      case "servidores":
        return (
          <AdminServers
            servers={servers}
            busy={busy}
            onAction={changeServer}
          />
        );
      case "pedidos":
        return (
          <AdminOrders orders={orders} busy={busy} onAction={changeOrder} />
        );
      case "gateway":
        return (
          <AdminGateway settings={settings} onSaved={setSettings} onNotice={setNotice} />
        );
      case "ajustes":
        return (
          <AdminSiteSettings
            settings={settings}
            onSaved={setSettings}
            onNotice={setNotice}
          />
        );
      case "historico":
        return <AdminLog log={log} />;
      default:
        return (
          <AdminOverview
            dashboard={dashboard}
            servers={servers}
            orders={orders}
            log={log}
            busy={busy}
            onTab={setTab}
            onServerAction={changeServer}
            onOrderAction={changeOrder}
          />
        );
    }
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <Brand />
        <span className="adm-top-tag">painel administrativo</span>
        <div className="adm-top-actions">
          <button
            className={`adm-refresh ${loading ? "busy" : ""}`}
            type="button"
            onClick={reload}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11a8 8 0 1 0-2.3 6M20 4v7h-7" />
            </svg>
            {loading ? "Atualizando" : "Atualizar"}
          </button>
          <button className="adm-top-link" type="button" onClick={() => navigate("minha-conta")}>
            Minha conta
          </button>
          <button className="adm-top-link" type="button" onClick={() => navigate("")}>
            Site
          </button>
          <button
            className="sd-login adm-logout"
            type="button"
            onClick={async () => {
              await logoutAccount();
              navigate("");
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div className="adm-body">
        <aside className="adm-side">
          <nav className="adm-nav" aria-label="Seções da administração">
            {NAV.map((item) => (
              <button
                key={item.key}
                type="button"
                className={tab === item.key ? "on" : ""}
                onClick={() => setTab(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.key === "servidores" && pendingServers > 0 && (
                  <em>{pendingServers}</em>
                )}
                {item.key === "pedidos" && pendingOrders > 0 && <em>{pendingOrders}</em>}
              </button>
            ))}
          </nav>

          <div className="adm-side-user">
            <span className="adm-side-avatar">{account.nome.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{account.nome}</strong>
              <small>{account.email}</small>
            </div>
          </div>

          <div className="adm-side-foot">
            <span className="dot" />
            <div>
              <strong>admin conectado</strong>
              <small>Supabase · RLS ativo</small>
            </div>
          </div>
        </aside>

        <main className="adm-main">
          {notice && <NoticeBar notice={notice} onClose={() => setNotice(null)} />}
          {error && (
            <div className="acc-notice bad adm-notice" role="alert">
              <span>{error}</span>
            </div>
          )}
          {loading && loaded && <div className="adm-loading-line" />}
          {!loaded && loading ? (
            <div className="adm-page">
              <p className="sd-eyebrow">administração</p>
              <h1>Carregando painel…</h1>
              <p className="adm-muted">Buscando contas, servidores e pedidos.</p>
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>
    </div>
  );
}
