import { useSyncExternalStore } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SteamProfile } from "./steam";

export type AccessTipo = "mensal" | "vitalicio" | "cortesia";
export type GrantStatus = "ativo" | "revogado";
export type AccountMode = "local" | "supabase";

export interface AccessGrant {
  id: string;
  tipo: AccessTipo;
  inicio: string;
  fim: string | null;
  origem: string;
  status: GrantStatus;
}

export type OrderStatus = "aguardando" | "pago" | "cancelado";

export interface PaymentOrder {
  id: string;
  accountId: string;
  plano: "mensal";
  valorCentavos: number;
  status: OrderStatus;
  criadoEm: string;
  pagoEm: string | null;
  metodo: "pix" | "cartao" | null;
}

export interface ServerGuest {
  accountId: string;
  nome: string;
  steamNome: string | null;
  entrouEm: string;
  expiraEm: string;
}

export type ServerStatus = "em_analise" | "ativo" | "pausado" | "encerrado";

export interface HostedServer {
  id: string;
  ownerId: string;
  nome: string;
  regiao: string;
  slots: number;
  discord: string;
  descricao: string;
  status: ServerStatus;
  codigo: string;
  criadoEm: string;
  ativadoEm: string | null;
  pausadoEm: string | null;
  encerradoEm: string | null;
  convidados: ServerGuest[];
}

export interface Account {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  senhaSalt: string;
  avatar: string | null;
  steam: SteamProfile | null;
  isAdmin: boolean;
  isDev: boolean;
  grants: AccessGrant[];
  criadoEm: string;
  atualizadoEm: string;
  ultimoLogin: string | null;
}

export interface AccountStore {
  version: 2;
  mode: AccountMode;
  ready: boolean;
  loading: boolean;
  error: string | null;
  devMode: boolean;
  sessionId: string | null;
  accounts: Account[];
  servers: HostedServer[];
  orders: PaymentOrder[];
  updatedAt: string;
}

export type AuthResult =
  | { ok: true; account: Account | null; needsConfirmation?: boolean }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };

export type SteamStartResult = { ok: true; url: string } | { ok: false; error: string };

export type CreateServerResult =
  | { ok: true; server: HostedServer }
  | { ok: false; error: string };

export type CreateOrderResult =
  | { ok: true; order: PaymentOrder; jaExistia: boolean }
  | { ok: false; error: string };

export type RedeemResult =
  | { ok: true; server: HostedServer; expiraEm: string; restantes: number }
  | { ok: false; error: string };

export interface AccessInfo {
  ativo: boolean;
  tipo: AccessTipo | null;
  rotulo: string;
  detalhe: string;
  expiraEm: string | null;
  origem: string | null;
  servidorNome: string | null;
  diasRestantes: number | null;
}

export const ACCOUNT_STORAGE_KEY = "sourcedayz.accounts.v1";
export const MONTHLY_PRICE_CENTS = 2500;
export const MONTHLY_DAYS = 30;
export const FREE_GUEST_LIMIT = 20;
export const FREE_GUEST_DAYS = 30;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const USING_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const ACCOUNT_MODE: AccountMode = USING_SUPABASE ? "supabase" : "local";
export const SUPABASE_FUNCTIONS_URL = USING_SUPABASE ? `${SUPABASE_URL}/functions/v1` : null;

const supabase: SupabaseClient | null = USING_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  return supabase ? { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } : null;
}

const DAY_MS = 86_400_000;

const SERVER_STATUS_LABEL: Record<ServerStatus, string> = {
  em_analise: "em análise",
  ativo: "ativo",
  pausado: "pausado",
  encerrado: "encerrado",
};

const ACCESS_LABEL: Record<AccessTipo, string> = {
  vitalicio: "Acesso vitalício",
  mensal: "Acesso mensal",
  cortesia: "Acesso liberado",
};

const ACCESS_PRIORITY: Record<AccessTipo, number> = {
  vitalicio: 0,
  mensal: 1,
  cortesia: 2,
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  const uuid =
    globalThis.crypto?.randomUUID?.() ??
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `${prefix}_${uuid}`;
}

function emptyStore(ready = true): AccountStore {
  return {
    version: 2,
    mode: ACCOUNT_MODE,
    ready,
    loading: false,
    error: null,
    devMode: ACCOUNT_MODE === "local",
    sessionId: null,
    accounts: [],
    servers: [],
    orders: [],
    updatedAt: nowIso(),
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeAccount(raw: Partial<Account>): Account {
  return {
    id: String(raw.id ?? uid("acc")),
    nome: String(raw.nome ?? "Jogador"),
    email: String(raw.email ?? ""),
    senhaHash: String(raw.senhaHash ?? ""),
    senhaSalt: String(raw.senhaSalt ?? ""),
    avatar: typeof raw.avatar === "string" ? raw.avatar : null,
    steam: raw.steam && typeof raw.steam === "object" ? raw.steam : null,
    isAdmin: Boolean(raw.isAdmin),
    isDev: Boolean(raw.isDev),
    grants: asArray<AccessGrant>(raw.grants),
    criadoEm: String(raw.criadoEm ?? nowIso()),
    atualizadoEm: String(raw.atualizadoEm ?? nowIso()),
    ultimoLogin: typeof raw.ultimoLogin === "string" ? raw.ultimoLogin : null,
  };
}

function normalizeServer(raw: Partial<HostedServer>): HostedServer {
  return {
    id: String(raw.id ?? uid("srv")),
    ownerId: String(raw.ownerId ?? ""),
    nome: String(raw.nome ?? "Servidor"),
    regiao: String(raw.regiao ?? "América do Sul"),
    slots: Number(raw.slots ?? 60),
    discord: String(raw.discord ?? ""),
    descricao: String(raw.descricao ?? ""),
    status: (raw.status ?? "em_analise") as ServerStatus,
    codigo: String(raw.codigo ?? ""),
    criadoEm: String(raw.criadoEm ?? nowIso()),
    ativadoEm: typeof raw.ativadoEm === "string" ? raw.ativadoEm : null,
    pausadoEm: typeof raw.pausadoEm === "string" ? raw.pausadoEm : null,
    encerradoEm: typeof raw.encerradoEm === "string" ? raw.encerradoEm : null,
    convidados: asArray<ServerGuest>(raw.convidados),
  };
}

function loadStore(): AccountStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<AccountStore>;
    const accounts = asArray<Partial<Account>>(parsed.accounts).map(normalizeAccount);
    const sessionId =
      typeof parsed.sessionId === "string" && accounts.some((a) => a.id === parsed.sessionId)
        ? parsed.sessionId
        : null;
    return {
      version: 2,
      mode: ACCOUNT_MODE,
      ready: true,
      loading: false,
      error: null,
      devMode: true,
      sessionId,
      accounts,
      servers: asArray<Partial<HostedServer>>(parsed.servers).map(normalizeServer),
      orders: asArray<PaymentOrder>(parsed.orders),
      updatedAt: String(parsed.updatedAt ?? nowIso()),
    };
  } catch {
    return emptyStore();
  }
}

let store: AccountStore = USING_SUPABASE ? emptyStore(false) : loadStore();
const listeners = new Set<() => void>();

function commit(next: AccountStore): void {
  store = { ...next, updatedAt: nowIso() };
  if (!USING_SUPABASE) {
    try {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.warn("Não foi possível salvar as contas neste navegador.", error);
    }
  }
  listeners.forEach((listener) => listener());
}

function getSnapshot(): AccountStore {
  return store;
}

function subscribeAccounts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined" && !USING_SUPABASE) {
  window.addEventListener("storage", (event) => {
    if (event.key !== ACCOUNT_STORAGE_KEY) return;
    store = loadStore();
    listeners.forEach((listener) => listener());
  });
}

export function useAccountStore(): AccountStore {
  return useSyncExternalStore(subscribeAccounts, getSnapshot, getSnapshot);
}

export function useCurrentAccount(): Account | null {
  const snapshot = useAccountStore();
  return snapshot.accounts.find((account) => account.id === snapshot.sessionId) ?? null;
}

// ---------------------------------------------------------------------------
// Camada Supabase
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  steam: SteamProfile | null;
  is_admin: boolean;
  is_dev: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

interface GrantRow {
  id: string;
  kind: AccessTipo;
  starts_at: string;
  ends_at: string | null;
  source: string;
  status: GrantStatus;
}

interface GuestRow {
  user_id: string;
  name: string;
  steam_name: string | null;
  joined_at: string;
  expires_at: string;
}

interface ServerRow {
  id: string;
  owner_id: string;
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
  server_guests?: GuestRow[];
}

interface OrderRow {
  id: string;
  user_id: string;
  plan: "mensal";
  amount_cents: number;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  method: "pix" | "cartao" | null;
}

function mapGrant(row: GrantRow): AccessGrant {
  return {
    id: row.id,
    tipo: row.kind,
    inicio: row.starts_at,
    fim: row.ends_at,
    origem: row.source,
    status: row.status,
  };
}

function mapServer(row: ServerRow): HostedServer {
  return {
    id: row.id,
    ownerId: row.owner_id,
    nome: row.name,
    regiao: row.region,
    slots: row.slots,
    discord: row.discord ?? "",
    descricao: row.description ?? "",
    status: row.status,
    codigo: row.code,
    criadoEm: row.created_at,
    ativadoEm: row.activated_at,
    pausadoEm: row.paused_at,
    encerradoEm: row.closed_at,
    convidados: (row.server_guests ?? [])
      .map((guest) => ({
        accountId: guest.user_id,
        nome: guest.name,
        steamNome: guest.steam_name,
        entrouEm: guest.joined_at,
        expiraEm: guest.expires_at,
      }))
      .sort((a, b) => b.entrouEm.localeCompare(a.entrouEm)),
  };
}

function mapOrder(row: OrderRow): PaymentOrder {
  return {
    id: row.id,
    accountId: row.user_id,
    plano: row.plan,
    valorCentavos: row.amount_cents,
    status: row.status,
    criadoEm: row.created_at,
    pagoEm: row.paid_at,
    metodo: row.method,
  };
}

function translateBackendError(message: string): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (text.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (text.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (text.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }
  if (text.includes("already_has_server")) {
    return "Você já tem um servidor em análise ou ativo.";
  }
  if (text.includes("owner_cannot_redeem")) {
    return "Você é o dono deste servidor e já tem acesso vitalício.";
  }
  if (text.includes("limit_reached")) {
    return "As 20 vagas de acesso grátis deste servidor já foram preenchidas.";
  }
  if (text.includes("already_redeemed")) return "Você já resgatou o mês grátis deste servidor.";
  if (text.includes("server_inactive")) return "Este servidor não está ativo no momento.";
  if (text.includes("code_not_found")) return "Código não encontrado.";
  if (text.includes("invalid_code")) return "Digite o código do servidor.";
  if (text.includes("not_owner")) return "Este servidor não é seu.";
  if (text.includes("invalid_transition")) return "Essa mudança de status não é permitida.";
  if (text.includes("approval_required")) {
    return "A abertura do servidor ainda está em análise pela equipe.";
  }
  if (text.includes("dev_disabled")) {
    return "As ferramentas de teste estão desligadas neste ambiente.";
  }
  if (text.includes("not_authenticated")) return "Entre na sua conta para continuar.";
  if (text.includes("order_not_found")) return "Pedido não encontrado.";
  if (text.includes("order_not_pending")) return "Este pedido não está pendente.";
  if (text.includes("invalid_name")) return "Informe um nome com pelo menos 2 letras.";
  if (text.includes("invalid_avatar")) return "A foto de perfil é grande demais. Escolha outra imagem.";
  if (text.includes("invalid_steam")) return "Os dados da Steam são grandes demais.";
  if (text.includes("origin_not_allowed")) {
    return "Este endereço do site não está autorizado para o vínculo Steam. Avise o administrador.";
  }
  if (text.includes("steam_em_uso") || text.includes("profiles_steam_id64_idx") || text.includes("duplicate key")) {
    return "Esta conta Steam já está vinculada a outro jogador.";
  }
  if (text.includes("not_admin")) return "Apenas administradores podem fazer isso.";
  if (text.includes("cannot_demote_self")) {
    return "Você não pode remover o seu próprio acesso de administrador.";
  }
  if (text.includes("last_admin")) {
    return "O site precisa de pelo menos um administrador ativo.";
  }
  if (text.includes("user_not_found")) return "Conta não encontrada.";
  if (text.includes("grant_exists")) return "Esta conta já tem acesso vitalício ativo.";
  if (text.includes("grant_not_found")) return "Acesso não encontrado.";
  if (text.includes("grant_not_active")) return "Este acesso já está revogado.";
  if (text.includes("grant_locked_server")) {
    return "Pause ou encerre o servidor antes de revogar o acesso vitalício.";
  }
  if (text.includes("server_not_found")) return "Servidor não encontrado.";
  if (text.includes("owner_has_active_server")) {
    return "O dono já tem outro servidor ativo. Pause o atual antes de reativar este.";
  }
  if (text.includes("invalid_status")) return "Status inválido.";
  if (text.includes("gateway_provider_invalid")) return "Gateway inválido.";
  if (text.includes("gateway_environment_invalid")) return "Ambiente do gateway inválido.";
  if (text.includes("gateway_token_required")) {
    return "Informe o token de acesso antes de ativar este gateway.";
  }
  if (text.includes("gateway_value_too_long")) return "Um dos valores do gateway é grande demais.";
  if (text.includes("invalid_origins")) return "Informe origens válidas, uma por linha.";
  if (text.includes("invalid_slots")) {
    return "O servidor precisa ter entre 20 e 200 slots.";
  }
  if (text.includes("invalid_description")) {
    return "A descrição pode ter no máximo 400 caracteres.";
  }
  if (text.includes("failed to fetch") || text.includes("networkerror")) {
    return "Não foi possível falar com o servidor. Verifique a conexão.";
  }
  return message || "Não foi possível concluir a ação.";
}

function supabaseReadyStore(): AccountStore {
  return { ...emptyStore(true), mode: "supabase", ready: true, devMode: false };
}

let refreshSeq = 0;

async function refreshSupabase(): Promise<void> {
  if (!supabase) return;
  const seq = ++refreshSeq;

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (seq !== refreshSeq) return;
    if (authError || !authData.user) {
      commit(supabaseReadyStore());
      return;
    }

    const userId = authData.user.id;
    const [profileRes, grantsRes, serversRes, ordersRes, devRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("grants").select("*").order("created_at", { ascending: true }),
      supabase
        .from("servers")
        .select("*, server_guests(*)")
        .order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.rpc("dev_tools_enabled"),
    ]);

    if (seq !== refreshSeq) return;

    if (profileRes.error) throw profileRes.error;
    const profile = profileRes.data as ProfileRow | null;

    if (!profile) {
      // O trigger de cadastro pode ainda estar terminando. Tenta de novo uma vez.
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      if (seq !== refreshSeq) return;
      const retry = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (retry.error || !retry.data) {
        commit({
          ...supabaseReadyStore(),
          ready: true,
          error: "Seu perfil ainda não apareceu no banco. Recarregue a página em instantes.",
        });
        return;
      }
      commit(buildSupabaseStore(authData.user.email ?? "", retry.data as ProfileRow, grantsRes, serversRes, ordersRes, devRes));
      return;
    }

    commit(buildSupabaseStore(authData.user.email ?? "", profile, grantsRes, serversRes, ordersRes, devRes));
  } catch (error) {
    if (seq !== refreshSeq) return;
    commit({
      ...supabaseReadyStore(),
      ready: true,
      error:
        error instanceof Error
          ? translateBackendError(error.message)
          : "Não foi possível carregar sua conta.",
    });
  }
}

export async function refreshAccountStore(): Promise<void> {
  if (supabase) {
    await refreshSupabase();
  }
}

export type AdminRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Chamada de RPC administrativa. A autorização real fica no banco: cada função
 * confere public.is_admin(); o gate da interface é só conveniência.
 */
export async function adminRpc<T>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<AdminRpcResult<T>> {
  if (!supabase) {
    return { ok: false, error: "O painel administrativo precisa do Supabase configurado." };
  }

  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { ok: false, error: translateBackendError(error.message) };
  return { ok: true, data: data as T };
}

/** Token da sessão atual, usado para chamar Edge Functions administrativas. */
export async function currentAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Troca a senha da conta logada (Supabase Auth). */
export async function changeAccountPassword(password: string): Promise<SimpleResult> {
  if (!supabase) {
    return { ok: false, error: "A troca de senha precisa do Supabase configurado." };
  }
  if (password.length < 8) {
    return { ok: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: translateBackendError(error.message) };
  return { ok: true };
}

async function waitForSupabaseAccount(userId: string | undefined): Promise<Account | null> {
  if (!userId) return null;

  // Depois do cadastro o trigger do banco e o evento de sessão podem terminar
  // em ordens diferentes. Insistimos por alguns segundos antes de desistir.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await refreshSupabase();
    const account = store.accounts.find((item) => item.id === userId) ?? null;
    if (account) return account;
    if (attempt < 5) {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
    }
  }
  return null;
}

function buildSupabaseStore(
  authEmail: string,
  profile: ProfileRow,
  grantsRes: { data: unknown; error: { message: string } | null },
  serversRes: { data: unknown; error: { message: string } | null },
  ordersRes: { data: unknown; error: { message: string } | null },
  devRes: { data: unknown; error: { message: string } | null },
): AccountStore {
  const account: Account = {
    id: profile.id,
    nome: profile.display_name,
    email: profile.email || authEmail,
    senhaHash: "",
    senhaSalt: "",
    avatar: profile.avatar_url,
    steam: profile.steam,
    isAdmin: profile.is_admin,
    isDev: profile.is_dev,
    grants: asArray<GrantRow>(grantsRes.data).map(mapGrant),
    criadoEm: profile.created_at,
    atualizadoEm: profile.updated_at,
    ultimoLogin: profile.last_login_at,
  };

  const firstError =
    grantsRes.error?.message ?? serversRes.error?.message ?? ordersRes.error?.message ?? null;

  return {
    version: 2,
    mode: "supabase",
    ready: true,
    loading: false,
    error: firstError ? translateBackendError(firstError) : null,
    devMode: devRes.data === true || profile.is_admin,
    sessionId: profile.id,
    accounts: [account],
    servers: asArray<ServerRow>(serversRes.data).map(mapServer),
    orders: asArray<OrderRow>(ordersRes.data).map(mapOrder),
    updatedAt: nowIso(),
  };
}

if (supabase) {
  void supabase.auth
    .getSession()
    .then(({ data }) => {
      if (data.session?.user) void refreshSupabase();
      else commit(supabaseReadyStore());
    })
    .catch(() => commit(supabaseReadyStore()));

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      commit(supabaseReadyStore());
      return;
    }
    if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
      window.setTimeout(() => void refreshSupabase(), 0);
    }
  });
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hashPassword(
  password: string,
  saltHex?: string,
): Promise<{ hash: string; salt: string }> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Este navegador não oferece Web Crypto. Use HTTPS ou localhost.");
  }
  const saltSource = saltHex
    ? hexToBytes(saltHex)
    : globalThis.crypto.getRandomValues(new Uint8Array(16));
  const salt = new Uint8Array(saltSource);
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" },
    material,
    256,
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function supabaseRegister(
  nome: string,
  email: string,
  senha: string,
): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "Supabase não configurado." };

  // Um parâmetro marca a volta do link de confirmação. O Supabase troca o
  // ?code= por uma sessão e limpa só o code; o ?auth=confirm continua na URL
  // para levarmos o jogador direto a Minha conta.
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?auth=confirm`
      : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { display_name: nome },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) return { ok: false, error: translateBackendError(error.message) };

  if (!data.session) {
    return {
      ok: true,
      account: null,
      needsConfirmation: true,
    };
  }

  const account = await waitForSupabaseAccount(data.user?.id);
  if (!account) {
    return {
      ok: false,
      error:
        store.error ??
        "Conta criada, mas o perfil ainda não carregou. Tente entrar em instantes.",
    };
  }
  return { ok: true, account };
}

export async function registerAccount(input: {
  nome: string;
  email: string;
  senha: string;
}): Promise<AuthResult> {
  const nome = input.nome.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);

  if (nome.length < 2) return { ok: false, error: "Informe um nome com pelo menos 2 letras." };
  if (nome.length > 40) return { ok: false, error: "O nome pode ter no máximo 40 caracteres." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (input.senha.length < 8) {
    return { ok: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  if (supabase) {
    return supabaseRegister(nome, email, input.senha);
  }

  if (store.accounts.some((account) => account.email === email)) {
    return { ok: false, error: "Já existe uma conta com este e-mail neste navegador." };
  }

  try {
    const { hash, salt } = await hashPassword(input.senha);
    const createdAt = nowIso();
    const account: Account = {
      id: uid("acc"),
      nome,
      email,
      senhaHash: hash,
      senhaSalt: salt,
      avatar: null,
      steam: null,
      isAdmin: false,
      isDev: false,
      grants: [],
      criadoEm: createdAt,
      atualizadoEm: createdAt,
      ultimoLogin: createdAt,
    };
    commit({
      ...store,
      accounts: [...store.accounts, account],
      sessionId: account.id,
    });
    return { ok: true, account };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível criar a conta.",
    };
  }
}

export async function loginAccount(input: {
  email: string;
  senha: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.senha,
    });
    if (error) return { ok: false, error: translateBackendError(error.message) };
    if (!data.user) return { ok: false, error: "E-mail ou senha incorretos." };

    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id);

    const account = await waitForSupabaseAccount(data.user.id);
    if (!account) {
      return {
        ok: false,
        error: store.error ?? "Não foi possível carregar seu perfil. Tente entrar de novo.",
      };
    }
    return { ok: true, account };
  }

  const account = store.accounts.find((item) => item.email === email);
  if (!account) return { ok: false, error: "E-mail ou senha incorretos." };

  try {
    const { hash } = await hashPassword(input.senha, account.senhaSalt);
    if (hash !== account.senhaHash) return { ok: false, error: "E-mail ou senha incorretos." };
    const signedAt = nowIso();
    const updated: Account = { ...account, ultimoLogin: signedAt, atualizadoEm: signedAt };
    commit({
      ...store,
      sessionId: account.id,
      accounts: store.accounts.map((item) => (item.id === account.id ? updated : item)),
    });
    return { ok: true, account: updated };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível entrar.",
    };
  }
}

export async function logoutAccount(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    commit(supabaseReadyStore());
    return;
  }
  commit({ ...store, sessionId: null });
}

function patchAccount(accountId: string, patch: (account: Account) => Account): void {
  commit({
    ...store,
    accounts: store.accounts.map((account) =>
      account.id === accountId ? { ...patch(account), atualizadoEm: nowIso() } : account,
    ),
  });
}

export async function updateAccountProfile(
  accountId: string,
  patch: { nome?: string; avatar?: string | null },
): Promise<SimpleResult> {
  if (patch.nome !== undefined) {
    const nome = patch.nome.trim().replace(/\s+/g, " ");
    if (nome.length < 2) return { ok: false, error: "O nome precisa ter pelo menos 2 letras." };
    if (nome.length > 40) return { ok: false, error: "O nome pode ter no máximo 40 caracteres." };
    patch = { ...patch, nome };
  }

  if (supabase) {
    try {
      let avatarUrl = patch.avatar;
      if (avatarUrl && avatarUrl.startsWith("data:")) {
        const blob = await (await fetch(avatarUrl)).blob();
        const path = `${accountId}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
        if (uploadError) {
          return { ok: false, error: translateBackendError(uploadError.message) };
        }
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      }

      const update: Record<string, unknown> = {};
      if (patch.nome !== undefined) update.display_name = patch.nome;
      if (avatarUrl !== undefined) update.avatar_url = avatarUrl;

      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from("profiles").update(update).eq("id", accountId);
        if (error) return { ok: false, error: translateBackendError(error.message) };
      }
      await refreshSupabase();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? translateBackendError(error.message)
            : "Não foi possível salvar o perfil.",
      };
    }
  }

  patchAccount(accountId, (account) => ({
    ...account,
    nome: patch.nome ?? account.nome,
    avatar: patch.avatar === undefined ? account.avatar : patch.avatar,
  }));
  return { ok: true };
}

export async function startSteamOpenId(): Promise<SteamStartResult> {
  if (!supabase || !SUPABASE_FUNCTIONS_URL) {
    return { ok: false, error: "A verificação pela Steam só funciona com o banco configurado." };
  }

  try {
    const { data, error } = await supabase.rpc("create_steam_link_state", {
      p_origin: window.location.origin,
    });

    if (error) return { ok: false, error: translateBackendError(error.message) };
    if (!data) {
      return { ok: false, error: "Não foi possível iniciar a verificação. Tente de novo." };
    }

    const returnTo = `${SUPABASE_FUNCTIONS_URL}/steam?state=${encodeURIComponent(String(data))}`;
    const params = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": returnTo,
      "openid.realm": new URL(SUPABASE_URL).origin,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    });

    return { ok: true, url: `https://steamcommunity.com/openid/login?${params.toString()}` };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Não foi possível abrir a página da Steam.",
    };
  }
}

export async function saveSteamProfile(
  accountId: string,
  steam: SteamProfile,
): Promise<SimpleResult> {
  if (supabase) {
    const { error } = await supabase.from("profiles").update({ steam }).eq("id", accountId);
    if (error) return { ok: false, error: translateBackendError(error.message) };
    await refreshSupabase();
    return { ok: true };
  }
  patchAccount(accountId, (account) => ({ ...account, steam }));
  return { ok: true };
}

export async function clearSteamProfile(accountId: string): Promise<SimpleResult> {
  if (supabase) {
    const { error } = await supabase.from("profiles").update({ steam: null }).eq("id", accountId);
    if (error) return { ok: false, error: translateBackendError(error.message) };
    await refreshSupabase();
    return { ok: true };
  }
  patchAccount(accountId, (account) => ({ ...account, steam: null }));
  return { ok: true };
}

export async function updateSteamName(accountId: string, nome: string): Promise<SimpleResult> {
  const clean = nome.trim().replace(/\s+/g, " ");
  if (clean.length < 2) return { ok: false, error: "Informe o nome que aparece na Steam." };
  if (clean.length > 60) return { ok: false, error: "O nome pode ter no máximo 60 caracteres." };

  if (supabase) {
    const account = store.accounts.find((item) => item.id === accountId);
    if (!account?.steam) return { ok: false, error: "Vincule uma conta Steam primeiro." };
    const { error } = await supabase
      .from("profiles")
      .update({ steam: { ...account.steam, nome: clean } })
      .eq("id", accountId);
    if (error) return { ok: false, error: translateBackendError(error.message) };
    await refreshSupabase();
    return { ok: true };
  }

  patchAccount(accountId, (account) =>
    account.steam ? { ...account, steam: { ...account.steam, nome: clean } } : account,
  );
  return { ok: true };
}

function dayFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function serverOrigin(serverId: string): string {
  return `servidor:${serverId}`;
}

function guestOrigin(serverId: string): string {
  return `servidor:${serverId}:jogador`;
}

function activeGrant(grant: AccessGrant, now: Date): boolean {
  if (grant.status !== "ativo") return false;
  if (new Date(grant.inicio).getTime() > now.getTime()) return false;
  return grant.fim === null || new Date(grant.fim).getTime() > now.getTime();
}

function grantServerId(origin: string): string | null {
  const parts = origin.split(":");
  return parts[0] === "servidor" && parts[1] ? parts[1] : null;
}

export function getAccess(
  account: Account,
  servers: HostedServer[],
  now = new Date(),
): AccessInfo {
  const active = account.grants.filter((grant) => activeGrant(grant, now));

  // Garante o vitalício mesmo se o grant tiver sido perdido em uma migração.
  for (const server of servers) {
    if (server.ownerId === account.id && server.status === "ativo") {
      const origin = serverOrigin(server.id);
      if (!active.some((grant) => grant.tipo === "vitalicio" && grant.origem === origin)) {
        active.push({
          id: `synthetic_${server.id}`,
          tipo: "vitalicio",
          inicio: server.ativadoEm ?? server.criadoEm,
          fim: null,
          origem: origin,
          status: "ativo",
        });
      }
    }
  }

  if (active.length === 0) {
    const expired = account.grants
      .filter((grant) => grant.fim !== null)
      .sort((a, b) => new Date(b.fim ?? 0).getTime() - new Date(a.fim ?? 0).getTime())[0];
    return {
      ativo: false,
      tipo: null,
      rotulo: "Sem acesso ativo",
      detalhe: expired
        ? `Seu último acesso terminou em ${formatDate(expired.fim)}.`
        : "Assine o acesso mensal ou resgate o código de um servidor da comunidade.",
      expiraEm: null,
      origem: null,
      servidorNome: null,
      diasRestantes: null,
    };
  }

  active.sort((a, b) => {
    const priority = ACCESS_PRIORITY[a.tipo] - ACCESS_PRIORITY[b.tipo];
    if (priority !== 0) return priority;
    if (a.fim === null) return -1;
    if (b.fim === null) return 1;
    return new Date(b.fim).getTime() - new Date(a.fim).getTime();
  });

  const best = active[0];
  const serverId = grantServerId(best.origem);
  const server = serverId ? servers.find((item) => item.id === serverId) ?? null : null;
  const expires = best.fim;
  const daysLeft = expires
    ? Math.max(0, Math.ceil((new Date(expires).getTime() - now.getTime()) / DAY_MS))
    : null;

  let detalhe = "Acesso liberado enquanto a hospedagem estiver ativa.";
  if (best.tipo === "mensal") detalhe = `Válido até ${formatDate(expires)}.`;
  if (best.tipo === "cortesia") {
    detalhe = server
      ? `1 mês grátis no ${server.nome} · até ${formatDate(expires)}.`
      : `1 mês grátis · até ${formatDate(expires)}.`;
  }
  if (best.tipo === "vitalicio" && server) detalhe = `Servidor ativo: ${server.nome}.`;

  return {
    ativo: true,
    tipo: best.tipo,
    rotulo: ACCESS_LABEL[best.tipo],
    detalhe,
    expiraEm: expires,
    origem: best.origem,
    servidorNome: server?.nome ?? null,
    diasRestantes: daysLeft,
  };
}

export function serverStatusLabel(status: ServerStatus): string {
  return SERVER_STATUS_LABEL[status];
}

export function getOwnedServer(storeValue: AccountStore, accountId: string): HostedServer | null {
  return (
    storeValue.servers.find(
      (server) => server.ownerId === accountId && server.status !== "encerrado",
    ) ?? null
  );
}

export function guestSlotsRemaining(server: HostedServer): number {
  return Math.max(0, FREE_GUEST_LIMIT - server.convidados.length);
}

function makeServerCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
    let code = "SDZ-";
    for (const byte of bytes) code += alphabet[byte % alphabet.length];
    if (!store.servers.some((server) => server.codigo === code)) return code;
  }
  return `SDZ-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export async function createMonthlyOrder(accountId: string): Promise<CreateOrderResult> {
  if (supabase) {
    const { data, error } = await supabase.rpc("create_monthly_order");
    if (error) return { ok: false, error: translateBackendError(error.message) };
    const payload = data as { order: OrderRow; ja_existia: boolean } | null;
    if (!payload?.order) return { ok: false, error: "Não foi possível criar o pedido." };
    await refreshSupabase();
    return { ok: true, order: mapOrder(payload.order), jaExistia: payload.ja_existia };
  }

  const pending = store.orders.find(
    (order) => order.accountId === accountId && order.status === "aguardando",
  );
  if (pending) return { ok: true, order: pending, jaExistia: true };

  const order: PaymentOrder = {
    id: `ped_${Date.now().toString(36).toUpperCase()}`,
    accountId,
    plano: "mensal",
    valorCentavos: MONTHLY_PRICE_CENTS,
    status: "aguardando",
    criadoEm: nowIso(),
    pagoEm: null,
    metodo: null,
  };
  commit({ ...store, orders: [order, ...store.orders] });
  return { ok: true, order, jaExistia: false };
}

export async function simulateOrderPayment(
  accountId: string,
  orderId: string,
): Promise<SimpleResult> {
  if (supabase) {
    const { error } = await supabase.rpc("dev_pay_order", { p_order_id: orderId });
    if (error) return { ok: false, error: translateBackendError(error.message) };
    await refreshSupabase();
    return { ok: true };
  }

  const order = store.orders.find(
    (item) => item.id === orderId && item.accountId === accountId,
  );
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "aguardando") return { ok: false, error: "Este pedido não está pendente." };

  const now = new Date();
  const current = store.accounts.find((account) => account.id === accountId);
  if (!current) return { ok: false, error: "Conta não encontrada." };

  const monthGrants = current.grants.filter(
    (grant) =>
      grant.tipo === "mensal" &&
      grant.status === "ativo" &&
      grant.fim !== null &&
      new Date(grant.fim).getTime() > now.getTime(),
  );
  const base = monthGrants.reduce((latest, grant) => {
    const time = new Date(grant.fim ?? 0).getTime();
    return time > latest ? time : latest;
  }, now.getTime());

  const grant: AccessGrant = {
    id: uid("grant"),
    tipo: "mensal",
    inicio: now.toISOString(),
    fim: new Date(base + MONTHLY_DAYS * DAY_MS).toISOString(),
    origem: `pedido:${order.id}`,
    status: "ativo",
  };

  const paidAt = nowIso();
  commit({
    ...store,
    accounts: store.accounts.map((account) =>
      account.id === accountId
        ? {
            ...account,
            grants: [...account.grants, grant],
            atualizadoEm: paidAt,
          }
        : account,
    ),
    orders: store.orders.map((item) =>
      item.id === order.id ? { ...item, status: "pago", pagoEm: paidAt } : item,
    ),
  });
  return { ok: true };
}

export async function createServer(
  accountId: string,
  input: {
    nome: string;
    regiao: string;
    slots: number;
    discord: string;
    descricao: string;
  },
): Promise<CreateServerResult> {
  const nome = input.nome.trim().replace(/\s+/g, " ");
  if (nome.length < 3) return { ok: false, error: "Dê um nome ao servidor com pelo menos 3 letras." };
  if (nome.length > 60) return { ok: false, error: "O nome do servidor pode ter no máximo 60 caracteres." };
  if (!Number.isInteger(input.slots) || input.slots < 20 || input.slots > 200) {
    return { ok: false, error: "O servidor precisa ter entre 20 e 200 slots." };
  }
  if (input.descricao.trim().length > 400) {
    return { ok: false, error: "A descrição pode ter no máximo 400 caracteres." };
  }

  if (supabase) {
    const { data, error } = await supabase.rpc("create_server", {
      p_name: nome,
      p_region: input.regiao.trim() || "América do Sul",
      p_slots: input.slots,
      p_discord: input.discord.trim(),
      p_description: input.descricao.trim(),
    });
    if (error) return { ok: false, error: translateBackendError(error.message) };
    if (!data) return { ok: false, error: "Não foi possível criar o servidor." };
    await refreshSupabase();
    return { ok: true, server: mapServer(data as ServerRow) };
  }

  if (getOwnedServer(store, accountId)) {
    return { ok: false, error: "Você já tem um servidor em análise ou ativo." };
  }
  if (!store.accounts.some((account) => account.id === accountId)) {
    return { ok: false, error: "Conta não encontrada." };
  }

  const server: HostedServer = {
    id: uid("srv"),
    ownerId: accountId,
    nome,
    regiao: input.regiao.trim() || "América do Sul",
    slots: input.slots,
    discord: input.discord.trim(),
    descricao: input.descricao.trim(),
    status: "em_analise",
    codigo: makeServerCode(),
    criadoEm: nowIso(),
    ativadoEm: null,
    pausadoEm: null,
    encerradoEm: null,
    convidados: [],
  };
  commit({ ...store, servers: [server, ...store.servers] });
  return { ok: true, server };
}

const STATUS_TRANSITIONS: Record<ServerStatus, ServerStatus[]> = {
  em_analise: ["ativo", "encerrado"],
  ativo: ["pausado", "encerrado"],
  pausado: ["ativo", "encerrado"],
  encerrado: [],
};

export async function setServerStatus(
  accountId: string,
  serverId: string,
  status: ServerStatus,
): Promise<SimpleResult> {
  if (supabase) {
    const { error } = await supabase.rpc("set_server_status", {
      p_server_id: serverId,
      p_status: status,
    });
    if (error) return { ok: false, error: translateBackendError(error.message) };
    await refreshSupabase();
    return { ok: true };
  }

  const server = store.servers.find((item) => item.id === serverId);
  if (!server) return { ok: false, error: "Servidor não encontrado." };
  if (server.ownerId !== accountId) return { ok: false, error: "Este servidor não é seu." };
  if (server.status === status) return { ok: true };
  if (!STATUS_TRANSITIONS[server.status].includes(status)) {
    return {
      ok: false,
      error: `Não é possível mudar de ${SERVER_STATUS_LABEL[server.status]} para ${SERVER_STATUS_LABEL[status]}.`,
    };
  }

  const account = store.accounts.find((item) => item.id === accountId);
  if (!account) return { ok: false, error: "Conta não encontrada." };

  const when = nowIso();
  const origin = serverOrigin(server.id);
  let grants = account.grants.map((grant) =>
    grant.origem === origin && grant.status === "ativo"
      ? { ...grant, status: "revogado" as const }
      : grant,
  );

  if (status === "ativo") {
    grants = [
      ...grants,
      {
        id: uid("grant"),
        tipo: "vitalicio",
        inicio: when,
        fim: null,
        origem: origin,
        status: "ativo",
      },
    ];
  }

  const nextServer: HostedServer = {
    ...server,
    status,
    ativadoEm: status === "ativo" ? server.ativadoEm ?? when : server.ativadoEm,
    pausadoEm: status === "pausado" ? when : status === "ativo" ? null : server.pausadoEm,
    encerradoEm: status === "encerrado" ? when : server.encerradoEm,
  };

  commit({
    ...store,
    accounts: store.accounts.map((item) =>
      item.id === accountId ? { ...item, grants, atualizadoEm: when } : item,
    ),
    servers: store.servers.map((item) => (item.id === serverId ? nextServer : item)),
  });
  return { ok: true };
}

function normalizeCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export async function redeemServerCode(
  accountId: string,
  rawCode: string,
): Promise<RedeemResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Digite o código do servidor." };

  if (supabase) {
    const { data, error } = await supabase.rpc("redeem_server_code", { p_code: rawCode });
    if (error) return { ok: false, error: translateBackendError(error.message) };
    const payload = data as {
      server_id: string;
      expires_at: string;
      remaining: number;
    } | null;
    if (!payload?.server_id) {
      return { ok: false, error: "Não foi possível resgatar o código." };
    }
    await refreshSupabase();
    const redeemed = store.servers.find((item) => item.id === payload.server_id);
    if (!redeemed) {
      return {
        ok: false,
        error: "Código aceito, mas o servidor não apareceu no seu painel. Recarregue a página.",
      };
    }
    return {
      ok: true,
      server: redeemed,
      expiraEm: payload.expires_at,
      restantes: payload.remaining,
    };
  }

  const server = store.servers.find((item) => normalizeCode(item.codigo) === code);
  if (!server) return { ok: false, error: "Código não encontrado." };
  if (server.status !== "ativo") {
    return { ok: false, error: "Este servidor não está ativo no momento." };
  }
  if (server.ownerId === accountId) {
    return { ok: false, error: "Você é o dono deste servidor e já tem acesso vitalício." };
  }
  if (server.convidados.length >= FREE_GUEST_LIMIT) {
    return { ok: false, error: "As 20 vagas de acesso grátis deste servidor já foram preenchidas." };
  }
  if (server.convidados.some((guest) => guest.accountId === accountId)) {
    return { ok: false, error: "Você já resgatou o mês grátis deste servidor." };
  }

  const account = store.accounts.find((item) => item.id === accountId);
  if (!account) return { ok: false, error: "Conta não encontrada." };

  const when = nowIso();
  const expiraEm = dayFromNow(FREE_GUEST_DAYS);
  const guest: ServerGuest = {
    accountId,
    nome: account.nome,
    steamNome: account.steam?.nome ?? null,
    entrouEm: when,
    expiraEm,
  };
  const grant: AccessGrant = {
    id: uid("grant"),
    tipo: "cortesia",
    inicio: when,
    fim: expiraEm,
    origem: guestOrigin(server.id),
    status: "ativo",
  };
  const nextServer: HostedServer = {
    ...server,
    convidados: [...server.convidados, guest],
  };

  commit({
    ...store,
    accounts: store.accounts.map((item) =>
      item.id === accountId
        ? { ...item, grants: [...item.grants, grant], atualizadoEm: when }
        : item,
    ),
    servers: store.servers.map((item) => (item.id === server.id ? nextServer : item)),
  });

  return {
    ok: true,
    server: nextServer,
    expiraEm,
    restantes: guestSlotsRemaining(nextServer),
  };
}

export function resetAccountData(): void {
  if (supabase) {
    void supabase.auth.signOut();
    commit(supabaseReadyStore());
    return;
  }
  store = emptyStore();
  try {
    window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch {
    // sem localStorage, só limpa a memória
  }
  listeners.forEach((listener) => listener());
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function dayCount(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / DAY_MS));
}
