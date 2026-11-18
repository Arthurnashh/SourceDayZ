// Criação de contas de desenvolvedor pelo painel.
// Deploy: supabase functions deploy admin-dev --no-verify-jwt --use-api
//
// POST { display_name, email, password }
//   Authorization: Bearer <jwt do admin logado>
//
// A senha é definida pelo admin, enviada uma única vez e nunca volta na
// resposta. O papel is_dev libera a leitura da documentação da source; não
// concede poderes administrativos.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

function cleanName(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Use POST." });
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return json(401, { ok: false, error: "Entre como administrador para criar contas." });
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return json(401, { ok: false, error: "Sessão expirada. Entre novamente." });
  }

  const { data: caller, error: callerError } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (callerError || !caller?.is_admin) {
    return json(403, { ok: false, error: "Só administradores podem criar contas dev." });
  }

  let body: { display_name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Corpo inválido." });
  }

  const displayName = cleanName(body.display_name);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (displayName.length < 2) {
    return json(400, { ok: false, error: "Informe um nome com pelo menos 2 caracteres." });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return json(400, { ok: false, error: "Informe um e-mail válido." });
  }
  if (password.length < 8) {
    return json(400, { ok: false, error: "A senha precisa ter pelo menos 8 caracteres." });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "";
    if (/already|exists|registered|duplicate/i.test(message)) {
      return json(409, { ok: false, error: "Já existe uma conta com este e-mail." });
    }
    return json(400, {
      ok: false,
      error: `Não foi possível criar a conta: ${message || "erro desconhecido"}`,
    });
  }

  const userId = created.user.id;

  // O trigger de cadastro cria o perfil. A atualização garante o papel dev
  // mesmo se o trigger estiver desativado em algum ambiente.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ display_name: displayName, email, is_dev: true })
    .eq("id", userId);

  if (profileError) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return json(500, {
      ok: false,
      error: "A conta foi criada, mas o papel dev não pôde ser aplicado. Crie novamente ou marque dev pelo painel.",
    });
  }

  await admin.from("admin_log").insert({
    admin_id: authData.user.id,
    action: "account.create_dev",
    target: userId,
    detail: { email },
  });

  return json(200, {
    ok: true,
    account: { id: userId, email, display_name: displayName },
  });
});
