import {
  adminRpc,
  currentAccessToken,
  SUPABASE_FUNCTIONS_URL,
  type AccessTipo,
  type AdminRpcResult,
  type GrantStatus,
  type OrderStatus,
  type ServerStatus,
} from "./accounts";
import type { SteamProfile } from "./steam";

export interface AdminDashboard {
  accounts: number;
  admins: number;
  devs: number;
  steam_verified: number;
  servers_total: number;
  servers_pending: number;
  servers_active: number;
  servers_paused: number;
  servers_closed: number;
  guests: number;
  grants_active: number;
  orders_pending: number;
  orders_paid: number;
  revenue_cents: number;
  revenue_30d_cents: number;
  gateway_ready: boolean;
}

export interface AdminGrant {
  id: string;
  kind: AccessTipo;
  starts_at: string;
  ends_at: string | null;
  source: string;
  status: GrantStatus;
  created_at: string;
}

export interface AdminServerSummary {
  id: string;
  name: string;
  status: ServerStatus;
  code: string;
  slots: number;
  created_at: string;
}

export interface AdminAccount {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  steam: SteamProfile | null;
  is_admin: boolean;
  is_dev: boolean;
  created_at: string;
  last_login_at: string | null;
  grants: AdminGrant[];
  server: AdminServerSummary | null;
  orders_count: number;
  spent_cents: number;
}

export interface AdminServer {
  id: string;
  name: string;
  region: string;
  slots: number;
  discord: string;
  description: string;
  status: ServerStatus;
  code: string;
  created_at: string;
  activated_at: string | null;
  paused_at: string | null;
  closed_at: string | null;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  owner_steam: string | null;
  owner_steam_verified: boolean;
  guest_count: number;
  lifetime_active: boolean;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: "mensal";
  amount_cents: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  method: "pix" | "cartao" | null;
}

export interface AdminGateway {
  provider: "manual" | "mercadopago" | "stripe";
  enabled: boolean;
  environment: "test" | "production";
  public_key: string;
  has_access_token: boolean;
  has_webhook_secret: boolean;
  updated_at: string | null;
}

export interface AdminSettings {
  gateway: AdminGateway;
  site: {
    allowed_origins: string[];
    dev_mode: boolean;
  };
}

export interface AdminLogEntry {
  id: number;
  admin_id: string | null;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  target: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export function getAdminDashboard(): Promise<AdminRpcResult<AdminDashboard>> {
  return adminRpc<AdminDashboard>("admin_dashboard");
}

export function listAdminAccounts(
  search = "",
  limit = 300,
): Promise<AdminRpcResult<AdminAccount[]>> {
  return adminRpc<AdminAccount[]>("admin_list_accounts", {
    p_search: search,
    p_limit: limit,
  });
}

export function renameAdminAccount(
  userId: string,
  displayName: string,
): Promise<AdminRpcResult<{ id: string; display_name: string }>> {
  return adminRpc("admin_update_account", {
    p_user_id: userId,
    p_display_name: displayName,
  });
}

export function setAdminAccountAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<AdminRpcResult<{ id: string; is_admin: boolean }>> {
  return adminRpc("admin_set_admin", {
    p_user_id: userId,
    p_is_admin: isAdmin,
  });
}

export function setAdminAccountDev(
  userId: string,
  isDev: boolean,
): Promise<AdminRpcResult<{ id: string; is_dev: boolean }>> {
  return adminRpc("admin_set_dev", {
    p_user_id: userId,
    p_is_dev: isDev,
  });
}

export function grantAdminAccess(
  userId: string,
  kind: AccessTipo,
  days: number | null,
): Promise<AdminRpcResult<AdminGrant>> {
  return adminRpc("admin_grant_access", {
    p_user_id: userId,
    p_kind: kind,
    p_days: days,
  });
}

export function revokeAdminGrant(
  grantId: string,
): Promise<AdminRpcResult<{ id: string; status: "revogado" }>> {
  return adminRpc("admin_revoke_grant", { p_grant_id: grantId });
}

export function listAdminServers(): Promise<AdminRpcResult<AdminServer[]>> {
  return adminRpc<AdminServer[]>("admin_list_servers");
}

export function setAdminServerStatus(
  serverId: string,
  status: Extract<ServerStatus, "ativo" | "pausado" | "encerrado">,
  note = "",
): Promise<AdminRpcResult<{ id: string; status: ServerStatus }>> {
  return adminRpc("admin_set_server_status", {
    p_server_id: serverId,
    p_status: status,
    p_note: note,
  });
}

export function listAdminOrders(): Promise<AdminRpcResult<AdminOrder[]>> {
  return adminRpc<AdminOrder[]>("admin_list_orders");
}

export function setAdminOrderStatus(
  orderId: string,
  status: "pago" | "cancelado",
): Promise<AdminRpcResult<{ id: string; status: OrderStatus }>> {
  return adminRpc("admin_set_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
}

export function getAdminSettings(): Promise<AdminRpcResult<AdminSettings>> {
  return adminRpc<AdminSettings>("admin_get_settings");
}

export interface SaveGatewayInput {
  provider: AdminGateway["provider"];
  enabled: boolean;
  environment: AdminGateway["environment"];
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  clearAccessToken: boolean;
  clearWebhookSecret: boolean;
}

export function saveAdminGateway(
  input: SaveGatewayInput,
): Promise<AdminRpcResult<AdminSettings>> {
  return adminRpc<AdminSettings>("admin_set_gateway", {
    p_provider: input.provider,
    p_enabled: input.enabled,
    p_environment: input.environment,
    p_public_key: input.publicKey,
    p_access_token: input.accessToken.trim() || null,
    p_webhook_secret: input.webhookSecret.trim() || null,
    p_clear_access_token: input.clearAccessToken,
    p_clear_webhook_secret: input.clearWebhookSecret,
  });
}

export function saveAdminOrigins(
  origins: string[],
): Promise<AdminRpcResult<{ allowed_origins: string[] }>> {
  return adminRpc("admin_set_origins", { p_origins: origins });
}

export function setAdminDevMode(
  enabled: boolean,
): Promise<AdminRpcResult<{ dev_mode: boolean }>> {
  return adminRpc("admin_set_dev_mode", { p_enabled: enabled });
}

export function listAdminLog(limit = 100): Promise<AdminRpcResult<AdminLogEntry[]>> {
  return adminRpc<AdminLogEntry[]>("admin_list_log", { p_limit: limit });
}

export function adminAccessLabel(grants: AdminGrant[]): string {
  const now = Date.now();
  const active = grants.filter(
    (grant) =>
      grant.status === "ativo" &&
      (!grant.ends_at || new Date(grant.ends_at).getTime() > now),
  );
  if (active.some((grant) => grant.kind === "vitalicio")) return "Vitalício";
  const monthly = active.find((grant) => grant.kind === "mensal");
  if (monthly) return "Mensal";
  if (active.some((grant) => grant.kind === "cortesia")) return "Cortesia";
  return "Sem acesso";
}

export function adminGrantSourceLabel(source: string): string {
  if (source.startsWith("servidor:")) return "Servidor ativo";
  if (source.startsWith("pedido:")) return "Pedido pago";
  if (source.startsWith("admin:")) return "Concedido no painel";
  if (source === "resgate") return "Resgate de convite";
  return source;
}

export interface CreatedDevAccount {
  id: string;
  email: string;
  display_name: string;
}

/**
 * Cria a conta no Supabase Auth através de uma Edge Function com service_role.
 * O cliente nunca recebe a service_role nem a senha de volta.
 */
export async function createDevAccount(input: {
  displayName: string;
  email: string;
  password: string;
}): Promise<AdminRpcResult<CreatedDevAccount>> {
  if (!SUPABASE_FUNCTIONS_URL) {
    return { ok: false, error: "O Supabase não está configurado neste ambiente." };
  }

  const token = await currentAccessToken();
  if (!token) {
    return { ok: false, error: "Sua sessão expirou. Entre novamente no painel." };
  }

  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/admin-dev`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        display_name: input.displayName,
        email: input.email,
        password: input.password,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; account?: CreatedDevAccount }
      | null;

    if (!response.ok || !payload?.ok || !payload.account) {
      return {
        ok: false,
        error: payload?.error ?? "Não foi possível criar a conta dev.",
      };
    }

    return { ok: true, data: payload.account };
  } catch {
    return { ok: false, error: "Falha de rede ao criar a conta dev. Tente novamente." };
  }
}
