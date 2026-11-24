import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatDate, formatDateTime, refreshAccountStore } from "../../lib/accounts";
import {
  createDevAccount,
  renameAdminAccount,
  setAdminAccountAdmin,
  setAdminAccountDev,
  type AdminAccount,
} from "../../lib/admin";
import {
  Avatar,
  Empty,
  SectionHead,
  StatusPill,
  type AdminNotice,
} from "./shared";

type Filter = "todos" | "admins" | "devs" | "steam";

interface Props {
  accounts: AdminAccount[];
  selfId: string;
  onChanged: () => void;
  onNotice: (notice: AdminNotice) => void;
}

function SteamBadge({ account }: { account: AdminAccount }) {
  if (!account.steam?.verificado) {
    if (account.steam?.nome) {
      return (
        <span className="adm-steam manual" title="Nome informado manualmente, sem prova de posse">
          manual
        </span>
      );
    }
    return <span className="adm-muted">—</span>;
  }

  return (
    <span className="adm-steam" title={account.steam.steamId64 ?? "Steam verificada por OpenID"}>
      <i>✓</i> verificada
    </span>
  );
}

function AccountDetail({
  account,
  selfId,
  onChanged,
  onNotice,
}: {
  account: AdminAccount;
  selfId: string;
  onChanged: () => void;
  onNotice: (notice: AdminNotice) => void;
}) {
  const [name, setName] = useState(account.display_name);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setName(account.display_name);
  }, [account.id, account.display_name]);

  const self = account.id === selfId;

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("nome");
    const result = await renameAdminAccount(account.id, name);
    setBusy(null);
    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }
    onNotice({ tone: "ok", text: `Nome atualizado para “${result.data.display_name}”.` });
    if (self) await refreshAccountStore();
    onChanged();
  }

  async function toggleAdmin() {
    const next = !account.is_admin;
    const message = next
      ? `Dar acesso de administrador para ${account.display_name}?`
      : `Remover o acesso de administrador de ${account.display_name}?`;
    if (!window.confirm(message)) return;

    setBusy("admin");
    const result = await setAdminAccountAdmin(account.id, next);
    setBusy(null);
    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }
    onNotice({
      tone: "ok",
      text: next
        ? `${account.display_name} agora é administrador.`
        : `${account.display_name} deixou de ser administrador.`,
    });
    if (self) await refreshAccountStore();
    onChanged();
  }

  async function toggleDev() {
    const next = !account.is_dev;
    const message = next
      ? `Dar acesso à documentação da source para ${account.display_name}?`
      : `Remover o acesso à documentação de ${account.display_name}?`;
    if (!window.confirm(message)) return;

    setBusy("dev");
    const result = await setAdminAccountDev(account.id, next);
    setBusy(null);
    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }
    onNotice({
      tone: "ok",
      text: next
        ? `${account.display_name} agora é desenvolvedor e pode abrir a documentação.`
        : `${account.display_name} deixou de ser desenvolvedor.`,
    });
    if (self) await refreshAccountStore();
    onChanged();
  }

  return (
    <article className="adm-detail">
      <header className="adm-detail-head">
        <Avatar
          name={account.display_name}
          src={account.avatar_url ?? account.steam?.avatar ?? null}
          size={54}
        />
        <div>
          <h2>{account.display_name}</h2>
          <p>
            {account.email} · conta desde {formatDate(account.created_at)}
            {account.last_login_at ? ` · último login ${formatDateTime(account.last_login_at)}` : ""}
          </p>
          <div className="adm-detail-tags">
            <span className="adm-pill ok">Acesso gratuito</span>
            {account.is_admin && <span className="adm-pill lime">administrador</span>}
            {account.is_dev && <span className="adm-pill dev">desenvolvedor</span>}
            <SteamBadge account={account} />
          </div>
        </div>
        <button
          className="adm-icon-btn"
          type="button"
          onClick={() => navigator.clipboard?.writeText(account.id)}
          title="Copiar ID da conta"
        >
          copiar ID
        </button>
      </header>

      <div className="adm-detail-grid">
        <section>
          <h3>Identidade</h3>
          <form className="adm-form" onSubmit={saveName}>
            <label className="sd-field">
              <span>Nome no site</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                minLength={2}
                required
              />
            </label>
            <button className="sd-btn primary adm-btn-sm" type="submit" disabled={busy === "nome"}>
              {busy === "nome" ? "Salvando…" : "Salvar nome"}
            </button>
          </form>

          <div className="adm-admin-toggle">
            <div>
              <strong>Administrador</strong>
              <p>
                {self
                  ? "Você está logado nesta conta. Não é possível remover o próprio acesso."
                  : "Pode abrir este painel e gerenciar todo o site."}
              </p>
            </div>
            <button
              className={`sd-btn ${account.is_admin ? "ghost" : "primary"} adm-btn-sm`}
              type="button"
              disabled={self || busy === "admin"}
              onClick={toggleAdmin}
            >
              {busy === "admin" ? "…" : account.is_admin ? "Remover admin" : "Tornar admin"}
            </button>
          </div>

          <div className="adm-admin-toggle">
            <div>
              <strong>Desenvolvedor</strong>
              <p>
                Libera a documentação completa da source no site. Não dá acesso ao painel
                administrativo nem a dados de jogadores.
              </p>
            </div>
            <button
              className={`sd-btn ${account.is_dev ? "ghost" : "primary"} adm-btn-sm`}
              type="button"
              disabled={busy === "dev"}
              onClick={toggleDev}
            >
              {busy === "dev" ? "…" : account.is_dev ? "Remover dev" : "Tornar dev"}
            </button>
          </div>

          <div className="adm-meta-grid">
            <div>
              <span>Steam</span>
              <strong>{account.steam?.nome ?? "não vinculada"}</strong>
              <small>
                {account.steam?.verificado
                  ? `OpenID · ${account.steam.steamId64 ?? "ID não informado"}`
                  : account.steam?.origem === "manual"
                    ? "vínculo manual, sem prova de posse"
                    : "sem vínculo"}
              </small>
            </div>
            <div>
              <span>Servidor</span>
              <strong>{account.server?.name ?? "nenhum"}</strong>
              <small>
                {account.server
                  ? `${account.server.code} · ${account.server.slots} slots`
                  : "não abriu servidor"}
              </small>
            </div>
          </div>
        </section>

        <section>
          <h3>Acesso</h3>
          <div className="adm-admin-toggle">
            <div>
              <strong>Acesso gratuito</strong>
              <p>Todos podem participar do projeto sem assinatura ou cobrança.</p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function DevCreator({
  onChanged,
  onNotice,
}: {
  onChanged: () => void;
  onNotice: (notice: AdminNotice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await createDevAccount({
      displayName: name,
      email,
      password,
    });
    setBusy(false);

    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }

    onNotice({
      tone: "ok",
      text: `Conta dev criada para ${result.data.email}. Entregue a senha por um canal privado e peça para trocá-la depois.`,
    });
    setName("");
    setEmail("");
    setPassword("");
    setOpen(false);
    onChanged();
  }

  return (
    <section className="adm-dev-creator">
      <div>
        <strong>Conta de desenvolvedor</strong>
        <p>
          Cria uma conta nova com acesso somente leitura aos documentos da source. A
          autorização é gravada no banco, não só na interface.
        </p>
      </div>
      <button
        className={`sd-btn ${open ? "ghost" : "primary"} adm-btn-sm`}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Cancelar" : "Criar conta dev"}
      </button>

      {open && (
        <form className="adm-dev-form" onSubmit={submit}>
          <label className="sd-field">
            <span>Nome no site</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={40}
              placeholder="Como a equipe vai identificar"
              required
            />
          </label>
          <label className="sd-field">
            <span>E-mail de acesso</span>
            <input
              className="adm-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="dev@exemplo.com"
              required
            />
          </label>
          <label className="sd-field">
            <span>Senha inicial</span>
            <input
              className="adm-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="mínimo de 8 caracteres"
              required
            />
          </label>
          <button className="sd-btn primary adm-btn-sm" type="submit" disabled={busy}>
            {busy ? "Criando…" : "Criar conta dev"}
          </button>
          <p className="adm-dev-note">
            A senha não é exibida de novo. Anote antes de enviar e combine a troca com o
            desenvolvedor.
          </p>
        </form>
      )}
    </section>
  );
}

export function AdminAccounts({ accounts, selfId, onChanged, onNotice }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      if (query) {
        const haystack = `${account.display_name} ${account.email}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filter === "admins") return account.is_admin;
      if (filter === "devs") return account.is_dev;
      if (filter === "steam") return Boolean(account.steam?.verificado);
      return true;
    });
  }, [accounts, filter, search]);

  const selected = accounts.find((account) => account.id === selectedId) ?? null;
  const devs = accounts.filter((account) => account.is_dev).length;

  return (
    <div className="adm-page">
      <SectionHead
        title="Contas"
        subtitle={`${accounts.length} conta(s) · acesso gratuito para todos · ${devs} desenvolvedor(es).`}
      />

      <DevCreator onChanged={onChanged} onNotice={onNotice} />

      <div className="adm-toolbar">
        <input
          className="adm-input adm-search"
          type="search"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="adm-seg" role="tablist" aria-label="Filtrar contas">
          {(
            [
              ["todos", "Todas"],
              ["admins", "Admins"],
              ["devs", "Devs"],
              ["steam", "Steam"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "on" : ""}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty>Nenhuma conta encontrada.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Steam</th>
                <th>Acesso</th>
                <th>Servidor</th>
                <th>Criada em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr
                  key={account.id}
                  className={selectedId === account.id ? "selected" : ""}
                  onClick={() => setSelectedId(account.id)}
                >
                  <td>
                    <div className="adm-user">
                      <Avatar
                        name={account.display_name}
                        src={account.avatar_url ?? account.steam?.avatar ?? null}
                      />
                      <div>
                        <strong>
                          {account.display_name}
                          {account.is_admin && <span className="adm-admin-dot">admin</span>}
                          {account.is_dev && <span className="adm-dev-dot">dev</span>}
                        </strong>
                        <span>{account.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <SteamBadge account={account} />
                  </td>
                  <td><span className="adm-pill ok">Gratuito</span></td>
                  <td>
                    {account.server ? (
                      <div className="adm-cell-stack">
                        <strong>{account.server.name}</strong>
                        <StatusPill status={account.server.status} />
                      </div>
                    ) : (
                      <span className="adm-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className="adm-muted">{formatDate(account.created_at)}</span>
                  </td>
                  <td>
                    <button
                      className="adm-link"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(selectedId === account.id ? null : account.id);
                      }}
                    >
                      {selectedId === account.id ? "Fechar" : "Gerenciar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <AccountDetail
          key={selected.id}
          account={selected}
          selfId={selfId}
          onChanged={onChanged}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
