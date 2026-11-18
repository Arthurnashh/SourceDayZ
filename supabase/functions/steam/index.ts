// Steam OpenID + leitura do perfil público.
// Deploy: supabase functions deploy steam --no-verify-jwt
//
// Rotas:
//   GET ?profile=<link|SteamID64|vanity>  -> JSON com os dados públicos
//   GET ?state=<uuid>&openid.*            -> retorno do Steam OpenID

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const STEAM_BASE = 76561197960265728n;
const STEAM_MAX = STEAM_BASE + 4294967295n;
const OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const STEAM_ID_PATTERN = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

interface StateRow {
  state: string;
  user_id: string;
  return_origin: string;
  expires_at: string;
  used_at: string | null;
}

type Target = { kind: "id64"; id64: string } | { kind: "vanity"; vanity: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function html(message: string, status = 400): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>SourceDayZ · Steam</title>` +
      `<body style="font-family:system-ui,sans-serif;background:#101410;color:#e8eee4;padding:48px">` +
      `<h1 style="font-size:20px">SourceDayZ</h1><p>${message}</p>` +
      `<p><a style="color:#9bd45c" href="/">Voltar ao site</a></p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
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

function steamMeta(id64: string): { steamId2: string; steamId3: string; accountId: string } {
  const accountId = BigInt(id64) - STEAM_BASE;
  return {
    steamId2: `STEAM_0:${accountId & 1n}:${accountId >> 1n}`,
    steamId3: `[U:1:${accountId}]`,
    accountId: accountId.toString(),
  };
}

function parseTarget(input: string): Target | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;

  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw
    : /(^|\.)steamcommunity\.com/i.test(raw)
      ? `https://${raw}`
      : raw;

  if (/^https?:\/\//i.test(withProtocol)) {
    try {
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host !== "steamcommunity.com") return null;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "profiles" && parts[1] && /^\d{17}$/.test(parts[1])) {
        return isValidId64(parts[1]) ? { kind: "id64", id64: parts[1] } : null;
      }
      if (parts[0] === "id" && parts[1]) {
        let vanity = parts[1];
        try {
          vanity = decodeURIComponent(vanity);
        } catch {
          return null;
        }
        return /^[A-Za-z0-9_.-]{2,64}$/.test(vanity) ? { kind: "vanity", vanity } : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (/^\d{17}$/.test(raw)) {
    return isValidId64(raw) ? { kind: "id64", id64: raw } : null;
  }

  const steam2 = raw.match(/^STEAM_[0-5]:([01]):(\d+)$/i);
  if (steam2) {
    const id64 = accountIdToId64(BigInt(steam2[2]) * 2n + BigInt(steam2[1]));
    return id64 ? { kind: "id64", id64 } : null;
  }

  const steam3 = raw.match(/^\[U:1:(\d+)\]$/i);
  if (steam3) {
    const id64 = accountIdToId64(BigInt(steam3[1]));
    return id64 ? { kind: "id64", id64 } : null;
  }

  if (/^\d{1,10}$/.test(raw)) {
    const id64 = accountIdToId64(BigInt(raw));
    return id64 ? { kind: "id64", id64 } : null;
  }

  if (/^[A-Za-z0-9_.-]{2,64}$/.test(raw)) {
    return { kind: "vanity", vanity: raw };
  }

  return null;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function xmlTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  const text = decodeXml(match[1]);
  return text ? text : null;
}

async function handleProfile(url: URL): Promise<Response> {
  const input = url.searchParams.get("profile") ?? "";
  const target = parseTarget(input);
  if (!target) return json({ ok: false, error: "Perfil da Steam inválido." }, 400);

  const path =
    target.kind === "id64"
      ? `/profiles/${target.id64}/?xml=1`
      : `/id/${encodeURIComponent(target.vanity)}/?xml=1`;
  const steamUrl = `https://steamcommunity.com${path}`;

  let response: Response;
  try {
    response = await fetch(steamUrl, {
      headers: {
        Accept: "application/xml, text/xml, */*",
        "User-Agent": "SourceDayZ/1.0 (Steam OpenID)",
      },
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return json({ ok: false, error: "A Steam não respondeu. Tente de novo." }, 502);
  }

  if (!response.ok) {
    return json({ ok: false, error: `A Steam respondeu HTTP ${response.status}.` }, 502);
  }

  const xml = await response.text();
  const errorText = xmlTag(xml, "error");
  if (errorText) {
    if (/could not be found/i.test(errorText)) {
      return json({ ok: false, error: "Perfil não encontrado na Steam." }, 404);
    }
    return json({ ok: false, error: errorText }, 502);
  }

  if (!xmlTag(xml, "profile")) {
    return json({ ok: false, error: "A Steam devolveu uma resposta inválida." }, 502);
  }

  const id64Raw = xmlTag(xml, "steamID64");
  const id64 =
    id64Raw && isValidId64(id64Raw)
      ? id64Raw
      : target.kind === "id64"
        ? target.id64
        : null;

  if (!id64) {
    return json(
      { ok: false, error: "A Steam não informou o SteamID. O perfil pode estar privado." },
      502,
    );
  }

  const vacRaw = xmlTag(xml, "vacBanned");
  return json({
    ok: true,
    profile: {
      steamId64: id64,
      vanity:
        xmlTag(xml, "customURL") ??
        (target.kind === "vanity" ? target.vanity : null),
      nome: xmlTag(xml, "steamID"),
      avatar: xmlTag(xml, "avatarFull") ?? xmlTag(xml, "avatarMedium"),
      privacidade: xmlTag(xml, "privacyState"),
      vac: vacRaw === null ? null : vacRaw === "1",
      pais: xmlTag(xml, "location"),
      membroDesde: xmlTag(xml, "memberSince"),
      perfilUrl: `https://steamcommunity.com/profiles/${id64}`,
    },
  });
}

function redirectBack(
  origin: string,
  status: "ok" | "erro",
  motivo?: string,
): Response {
  const query =
    status === "ok"
      ? "?steam=ok"
      : `?steam=erro&motivo=${encodeURIComponent(motivo ?? "erro")}`;
  return Response.redirect(`${origin}/${query}#/minha-conta`, 303);
}

async function fallbackOrigin(): Promise<string> {
  try {
    const { data } = await admin
      .from("app_settings")
      .select("allowed_origins")
      .eq("id", 1)
      .maybeSingle();
    const origins = Array.isArray(data?.allowed_origins) ? data.allowed_origins : [];
    return typeof origins[0] === "string" ? origins[0] : "";
  } catch {
    return "";
  }
}

async function handleOpenId(url: URL): Promise<Response> {
  const state = url.searchParams.get("state") ?? "";

  if (!/^[0-9a-f-]{36}$/i.test(state)) {
    const origin = await fallbackOrigin();
    return origin ? redirectBack(origin, "erro", "state") : html("Verificação inválida.", 400);
  }

  const { data, error } = await admin
    .from("steam_link_states")
    .select("*")
    .eq("state", state)
    .maybeSingle();

  if (error || !data) {
    const origin = await fallbackOrigin();
    return origin ? redirectBack(origin, "erro", "state") : html("Verificação expirada.", 400);
  }

  const row = data as StateRow;
  const origin = row.return_origin;

  if (row.used_at || new Date(row.expires_at).getTime() <= Date.now()) {
    return redirectBack(origin, "erro", "state");
  }

  // Nonce é de uso único, mesmo se a verificação falhar.
  await admin
    .from("steam_link_states")
    .update({ used_at: new Date().toISOString() })
    .eq("state", state);

  if (url.searchParams.get("openid.mode") !== "id_res") {
    return redirectBack(origin, "erro", "cancelado");
  }

  const expected = new URL(url.toString());
  expected.search = `?state=${encodeURIComponent(state)}`;
  const returnTo = url.searchParams.get("openid.return_to") ?? "";

  try {
    const parsed = new URL(returnTo);
    const matches =
      parsed.origin === expected.origin &&
      parsed.pathname === expected.pathname &&
      parsed.searchParams.get("state") === state;
    if (!matches) return redirectBack(origin, "erro", "openid");
  } catch {
    return redirectBack(origin, "erro", "openid");
  }

  if (!(url.searchParams.get("openid.op_endpoint") ?? "").startsWith(OPENID_ENDPOINT)) {
    return redirectBack(origin, "erro", "openid");
  }

  const claimed = (url.searchParams.get("openid.claimed_id") ?? "").match(STEAM_ID_PATTERN);
  if (!claimed || !isValidId64(claimed[1])) {
    return redirectBack(origin, "erro", "openid");
  }
  const id64 = claimed[1];

  // Confirma a assinatura direto na Steam (server-to-server).
  const form = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("openid.")) form.append(key, value);
  });
  form.set("openid.mode", "check_authentication");

  let check: Response;
  try {
    check = await fetch(OPENID_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "SourceDayZ/1.0 (Steam OpenID)",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return redirectBack(origin, "erro", "openid");
  }

  const checkText = await check.text();
  if (!check.ok || !/is_valid\s*:\s*true/i.test(checkText)) {
    return redirectBack(origin, "erro", "openid");
  }

  const { data: other } = await admin
    .from("profiles")
    .select("id")
    .eq("steam->>steamId64", id64)
    .neq("id", row.user_id)
    .maybeSingle();

  if (other) return redirectBack(origin, "erro", "em_uso");

  const { data: own, error: ownError } = await admin
    .from("profiles")
    .select("steam")
    .eq("id", row.user_id)
    .maybeSingle();

  if (ownError || !own) return redirectBack(origin, "erro", "save");

  const previous = (own.steam ?? {}) as Record<string, unknown>;
  const same = previous.steamId64 === id64;
  const meta = steamMeta(id64);
  const steam = {
    entrada: same && typeof previous.entrada === "string" ? previous.entrada : "Steam OpenID",
    steamId64: id64,
    steamId2: meta.steamId2,
    steamId3: meta.steamId3,
    accountId: meta.accountId,
    vanity: same ? previous.vanity ?? null : null,
    nome: same ? previous.nome ?? null : null,
    avatar: same ? previous.avatar ?? null : null,
    perfilUrl: `https://steamcommunity.com/profiles/${id64}`,
    verificado: true,
    origem: "openid",
    perfilPublico: same ? previous.perfilPublico ?? false : false,
    privacidade: same ? previous.privacidade ?? null : null,
    vac: same ? previous.vac ?? null : null,
    pais: same ? previous.pais ?? null : null,
    membroDesde: same ? previous.membroDesde ?? null : null,
    atualizadoEm: new Date().toISOString(),
  };

  const { error: updateError } = await admin
    .from("profiles")
    .update({ steam })
    .eq("id", row.user_id);

  if (updateError) {
    console.error("steam update failed", updateError);
    return redirectBack(origin, "erro", updateError.code === "23505" ? "em_uso" : "save");
  }

  return redirectBack(origin, "ok");
}

Deno.serve(async (request) => {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    if (url.searchParams.has("profile")) return await handleProfile(url);
    if (url.searchParams.has("state") || url.searchParams.has("openid.mode")) {
      return await handleOpenId(url);
    }
    return json({ ok: false, error: "missing_action" }, 400);
  } catch (error) {
    console.error("steam function error", error);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
