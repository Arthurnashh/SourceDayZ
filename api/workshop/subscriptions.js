const json = (res, status, value) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Método não permitido." });
  }

  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return json(res, 401, { error: "Entre na conta SourceDayZ para continuar." });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return json(res, 503, { error: "Workshop indisponível: configuração do banco ausente." });

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${match[1]}`,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "GET") {
      const response = await fetch(`${baseUrl}/rest/v1/rpc/workshop_my_subscriptions`, {
        method: "POST",
        headers,
        body: "{}",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        return json(res, response.status === 404 ? 503 : 401, {
          error: response.status === 404
            ? "O banco do Workshop ainda não está configurado. Aplique supabase/workshopMods.sql no Supabase."
            : "Sua sessão expirou. Entre novamente na conta SourceDayZ.",
        });
      }
      return json(res, 200, result || []);
    }

    let body = req.body || {};
    if (typeof req.body === "string") {
      try { body = JSON.parse(req.body); } catch { return json(res, 400, { error: "Corpo da solicitação inválido." }); }
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json(res, 400, { error: "Corpo da solicitação inválido." });
    const modId = typeof body.modId === "string" ? body.modId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(modId)) {
      return json(res, 400, { error: "Identificador de mod inválido." });
    }

    const response = await fetch(`${baseUrl}/rest/v1/rpc/workshop_set_subscription`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_mod_id: modId, p_subscribed: body.subscribed !== false }),
    });
    const result = response.ok ? await response.json().catch(() => true) : await response.text();
    if (!response.ok) {
      const detail = String(result || "");
      const migrationMissing = response.status === 404 || /workshop_set_subscription|schema cache/i.test(detail);
      const steamRequired = /steam_link_required/i.test(detail);
      const notAuthenticated = response.status === 401 || /not_authenticated/i.test(detail);
      return json(res, migrationMissing ? 503 : notAuthenticated ? 401 : steamRequired ? 403 : 400, {
        error: migrationMissing
          ? "O banco do Workshop ainda não está configurado. Aplique supabase/workshopMods.sql no Supabase."
          : steamRequired
            ? "Vincule e verifique sua conta Steam no perfil SourceDayZ antes de se inscrever."
            : notAuthenticated ? "Entre novamente na conta SourceDayZ." : "Não foi possível atualizar sua inscrição no mod.",
      });
    }
    return json(res, 200, { subscribed: body.subscribed !== false });
  } catch {
    return json(res, 502, { error: "Não foi possível atualizar sua biblioteca de mods." });
  }
}
