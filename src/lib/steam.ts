export interface SteamProfile {
  /** Texto exatamente como o jogador informou. */
  entrada: string;
  steamId64: string | null;
  steamId2: string | null;
  steamId3: string | null;
  accountId: string | null;
  vanity: string | null;
  nome: string | null;
  avatar: string | null;
  perfilUrl: string;
  /** true = posse confirmada pelo Steam OpenID. Vínculo manual fica false. */
  verificado: boolean;
  /** openid = confirmado pela Steam; manual = link colado pelo jogador. */
  origem?: "openid" | "manual";
  /** true = o perfil público já foi consultado (nome, avatar, VAC). */
  perfilPublico?: boolean;
  privacidade: string | null;
  vac: boolean | null;
  pais: string | null;
  membroDesde: string | null;
  atualizadoEm: string | null;
}

export type SteamTarget =
  | { kind: "id64"; id64: string }
  | { kind: "vanity"; vanity: string };

export type SteamParseResult =
  | { ok: true; target: SteamTarget }
  | { ok: false; error: string };

const STEAM_BASE = 76561197960265728n;
const STEAM_MAX = STEAM_BASE + 4294967295n;

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const STEAM_FUNCTIONS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/steam` : null;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidId64(value: string): boolean {
  if (!/^\d{17}$/.test(value)) return false;
  try {
    const n = BigInt(value);
    return n >= STEAM_BASE && n <= STEAM_MAX;
  } catch {
    return false;
  }
}

function accountIdToId64(accountId: bigint): string | null {
  if (accountId < 0n || accountId > 4294967295n) return null;
  return (STEAM_BASE + accountId).toString();
}

export function steamMeta(id64: string): {
  steamId2: string;
  steamId3: string;
  accountId: string;
} {
  const accountId = BigInt(id64) - STEAM_BASE;
  const y = accountId & 1n;
  const z = accountId >> 1n;
  return {
    steamId2: `STEAM_0:${y.toString()}:${z.toString()}`,
    steamId3: `[U:1:${accountId.toString()}]`,
    accountId: accountId.toString(),
  };
}

function fromVanity(raw: string): SteamParseResult {
  let vanity = raw.trim();
  try {
    vanity = decodeURIComponent(vanity);
  } catch {
    // mantém o texto original
  }
  if (!/^[A-Za-z0-9_.-]{2,64}$/.test(vanity)) {
    return { ok: false, error: "O nome personalizado da Steam parece inválido." };
  }
  return { ok: true, target: { kind: "vanity", vanity } };
}

export function parseSteamTarget(input: string): SteamParseResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Cole o link do seu perfil ou o SteamID." };

  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw
    : /(^|\.)steamcommunity\.com/i.test(raw)
      ? `https://${raw}`
      : raw;

  if (/^https?:\/\//i.test(withProtocol)) {
    let url: URL;
    try {
      url = new URL(withProtocol);
    } catch {
      return { ok: false, error: "Esse link não parece válido." };
    }
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "steamcommunity.com") {
      return {
        ok: false,
        error: "Use um link do tipo steamcommunity.com/profiles/… ou steamcommunity.com/id/….",
      };
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "profiles" && parts[1] && onlyDigits(parts[1]).length === 17) {
      const id64 = onlyDigits(parts[1]);
      if (!isValidId64(id64)) return { ok: false, error: "Esse SteamID64 está fora do intervalo válido." };
      return { ok: true, target: { kind: "id64", id64 } };
    }
    if (parts[0] === "id" && parts[1]) return fromVanity(parts[1]);
    return {
      ok: false,
      error: "O link precisa apontar para /profiles/<SteamID64> ou /id/<nome>.",
    };
  }

  if (/^\d{17}$/.test(raw)) {
    if (!isValidId64(raw)) return { ok: false, error: "Esse SteamID64 está fora do intervalo válido." };
    return { ok: true, target: { kind: "id64", id64: raw } };
  }

  const steam2 = raw.match(/^STEAM_[0-5]:([01]):(\d+)$/i);
  if (steam2) {
    const accountId = BigInt(steam2[2]) * 2n + BigInt(steam2[1]);
    const id64 = accountIdToId64(accountId);
    if (!id64) return { ok: false, error: "Esse SteamID está fora do intervalo válido." };
    return { ok: true, target: { kind: "id64", id64 } };
  }

  const steam3 = raw.match(/^\[U:1:(\d+)\]$/i);
  if (steam3) {
    const id64 = accountIdToId64(BigInt(steam3[1]));
    if (!id64) return { ok: false, error: "Esse SteamID está fora do intervalo válido." };
    return { ok: true, target: { kind: "id64", id64 } };
  }

  if (/^\d{1,10}$/.test(raw)) {
    const id64 = accountIdToId64(BigInt(raw));
    if (!id64) return { ok: false, error: "Esse friend code está fora do intervalo válido." };
    return { ok: true, target: { kind: "id64", id64 } };
  }

  // Sem link e sem número: aceita como vanity, mas deixa claro o formato.
  if (/^[A-Za-z0-9_.-]{2,64}$/.test(raw)) return fromVanity(raw);

  return {
    ok: false,
    error: "Não reconheci esse formato. Use o link do perfil, SteamID64, STEAM_x:x:xxxx ou [U:1:xxxx].",
  };
}

function targetForProfile(profile: SteamProfile): SteamTarget | null {
  if (profile.steamId64 && isValidId64(profile.steamId64)) {
    return { kind: "id64", id64: profile.steamId64 };
  }
  if (profile.vanity) return { kind: "vanity", vanity: profile.vanity };
  return null;
}

export function createSteamProfile(entrada: string, target: SteamTarget): SteamProfile {
  if (target.kind === "id64") {
    const meta = steamMeta(target.id64);
    return {
      entrada,
      steamId64: target.id64,
      steamId2: meta.steamId2,
      steamId3: meta.steamId3,
      accountId: meta.accountId,
      vanity: null,
      nome: null,
      avatar: null,
      perfilUrl: `https://steamcommunity.com/profiles/${target.id64}`,
      verificado: false,
      origem: "manual",
      perfilPublico: false,
      privacidade: null,
      vac: null,
      pais: null,
      membroDesde: null,
      atualizadoEm: null,
    };
  }

  return {
    entrada,
    steamId64: null,
    steamId2: null,
    steamId3: null,
    accountId: null,
    vanity: target.vanity,
    nome: null,
    avatar: null,
    perfilUrl: `https://steamcommunity.com/id/${encodeURIComponent(target.vanity)}`,
    verificado: false,
    origem: "manual",
    perfilPublico: false,
    privacidade: null,
    vac: null,
    pais: null,
    membroDesde: null,
    atualizadoEm: null,
  };
}

function xmlText(parent: Element, tag: string): string | null {
  const node = parent.querySelector(tag);
  const text = node?.textContent?.trim();
  return text ? text : null;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/xml, text/xml, */*" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

interface SteamLookup {
  steamId64: string | null;
  vanity: string | null;
  nome: string | null;
  avatar: string | null;
  privacidade: string | null;
  vac: boolean | null;
  pais: string | null;
  membroDesde: string | null;
}

interface SteamFunctionResponse {
  ok?: boolean;
  error?: string;
  profile?: {
    steamId64?: string | null;
    vanity?: string | null;
    nome?: string | null;
    avatar?: string | null;
    privacidade?: string | null;
    vac?: boolean | null;
    pais?: string | null;
    membroDesde?: string | null;
    perfilUrl?: string | null;
  };
}

async function lookupSteamViaFunction(target: SteamTarget): Promise<SteamLookup> {
  const input = target.kind === "id64" ? target.id64 : target.vanity;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(
      `${STEAM_FUNCTIONS_URL}?profile=${encodeURIComponent(input)}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    let data: SteamFunctionResponse | null = null;
    try {
      data = (await response.json()) as SteamFunctionResponse;
    } catch {
      throw new Error("A Steam devolveu uma resposta inválida.");
    }

    if (!response.ok || !data?.ok || !data.profile) {
      throw new Error(data?.error ?? "A Steam não respondeu. Tente de novo.");
    }

    const found = data.profile;
    return {
      steamId64: found.steamId64 ?? null,
      vanity: found.vanity ?? (target.kind === "vanity" ? target.vanity : null),
      nome: found.nome ?? null,
      avatar: found.avatar ?? null,
      privacidade: found.privacidade ?? null,
      vac: typeof found.vac === "boolean" ? found.vac : null,
      pais: found.pais ?? null,
      membroDesde: found.membroDesde ?? null,
    };
  } finally {
    window.clearTimeout(timer);
  }
}

// Sem Supabase (modo local) o navegador consulta o XML direto; em produção
// quem consulta é a Edge Function, sem depender de proxy público.
async function lookupSteamBrowser(target: SteamTarget): Promise<SteamLookup> {
  const path =
    target.kind === "id64"
      ? `/profiles/${target.id64}/?xml=1`
      : `/id/${encodeURIComponent(target.vanity)}/?xml=1`;
  const steamUrl = `https://steamcommunity.com${path}`;

  // Em desenvolvimento o Vite faz proxy same-origin (sem CORS).
  // Em produção, tenta um proxy público; se falhar, o vínculo continua local.
  const urls = import.meta.env.DEV
    ? [`/steam-api${path}`]
    : [`https://api.allorigins.win/raw?url=${encodeURIComponent(steamUrl)}`];

  let lastError = "A Steam não respondeu.";
  let xml: string | null = null;
  for (const url of urls) {
    try {
      xml = await fetchText(url, 9000);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Falha na consulta.";
    }
  }
  if (!xml) throw new Error(lastError);

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("A Steam devolveu uma resposta inválida.");
  const errorNode = doc.querySelector("error");
  if (errorNode?.textContent?.trim()) {
    const message = errorNode.textContent.trim();
    if (/could not be found/i.test(message)) throw new Error("Perfil não encontrado na Steam.");
    throw new Error(message);
  }

  const profile = doc.querySelector("profile");
  if (!profile) throw new Error("A Steam não devolveu um perfil público.");

  const steamId64 = xmlText(profile, "steamID64");
  const vacRaw = xmlText(profile, "vacBanned");
  return {
    steamId64: steamId64 && isValidId64(steamId64) ? steamId64 : null,
    vanity: target.kind === "vanity" ? target.vanity : null,
    nome: xmlText(profile, "steamID"),
    avatar: xmlText(profile, "avatarFull") ?? xmlText(profile, "avatarMedium"),
    privacidade: xmlText(profile, "privacyState"),
    vac: vacRaw === null ? null : vacRaw === "1",
    pais: xmlText(profile, "location"),
    membroDesde: xmlText(profile, "memberSince"),
  };
}

async function lookupSteam(target: SteamTarget): Promise<SteamLookup> {
  if (STEAM_FUNCTIONS_URL) return lookupSteamViaFunction(target);
  return lookupSteamBrowser(target);
}

export type SteamEnrichResult =
  | { ok: true; profile: SteamProfile }
  | { ok: false; error: string };

export async function enrichSteamProfile(profile: SteamProfile): Promise<SteamEnrichResult> {
  const target = targetForProfile(profile);
  if (!target) return { ok: false, error: "Informe um link ou SteamID válido para consultar a Steam." };

  try {
    const found = await lookupSteam(target);
    const id64 = found.steamId64 ?? (target.kind === "id64" ? target.id64 : null);
    const meta = id64 ? steamMeta(id64) : null;

    return {
      ok: true,
      profile: {
        ...profile,
        steamId64: id64,
        steamId2: meta?.steamId2 ?? profile.steamId2,
        steamId3: meta?.steamId3 ?? profile.steamId3,
        accountId: meta?.accountId ?? profile.accountId,
        vanity: found.vanity ?? profile.vanity,
        nome: found.nome ?? profile.nome,
        avatar: found.avatar ?? profile.avatar,
        perfilUrl: id64 ? `https://steamcommunity.com/profiles/${id64}` : profile.perfilUrl,
        verificado: profile.origem === "openid" ? profile.verificado : false,
        origem: profile.origem ?? "manual",
        perfilPublico: true,
        privacidade: found.privacidade ?? profile.privacidade,
        vac: found.vac ?? profile.vac,
        pais: found.pais ?? profile.pais,
        membroDesde: found.membroDesde ?? profile.membroDesde,
        atualizadoEm: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a Steam agora. Tente novamente mais tarde.",
    };
  }
}

export function steamPrivacyLabel(value: string | null): string {
  switch ((value ?? "").toLowerCase()) {
    case "public":
      return "perfil público";
    case "friendsonly":
      return "visível para amigos";
    case "private":
      return "perfil privado";
    default:
      return "privacidade não informada";
  }
}
