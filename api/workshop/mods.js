const json = (res, status, value) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Método não permitido." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json(res, 503, { error: "Workshop indisponível: configuração do banco ausente." });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/workshop_list_mods`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_limit: 200, p_offset: 0 }),
    });

    if (!response.ok) {
      const detail = await response.text();
      const migrationMissing = response.status === 404 || /workshop_list_mods|schema cache/i.test(detail);
      return json(res, migrationMissing ? 503 : 502, {
        error: migrationMissing
          ? "O banco do Workshop ainda não está configurado. Aplique supabase/workshopMods.sql no Supabase."
          : "Não foi possível carregar o catálogo do Workshop.",
      });
    }

    return json(res, 200, await response.json());
  } catch {
    return json(res, 502, { error: "Não foi possível conectar ao banco do Workshop." });
  }
}
