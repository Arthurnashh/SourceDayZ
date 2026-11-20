const json = (res, status, value) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método não permitido." });
  }

  let body = req.body || {};
  if (typeof req.body === "string") {
    try { body = JSON.parse(req.body); } catch { return json(res, 400, { error: "Corpo da solicitação inválido." }); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json(res, 400, { error: "Corpo da solicitação inválido." });
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken : "";
  if ((!refreshToken && (!email || !password)) || (refreshToken && (email || password))) {
    return json(res, 400, { error: "Informe e-mail e senha ou uma sessão válida." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return json(res, 503, { error: "Autenticação do Workshop indisponível." });

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const grant = refreshToken ? "refresh_token" : "password";
  try {
    const authResponse = await fetch(`${baseUrl}/auth/v1/token?grant_type=${grant}`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : { email, password }),
    });
    const auth = await authResponse.json();
    if (!authResponse.ok || !auth.access_token || !auth.user?.id) {
      const status = authResponse.status === 400 || authResponse.status === 401 ? 401 : 502;
      const message = /email not confirmed/i.test(String(auth.msg || auth.message || auth.error_description || ""))
        ? "Confirme o e-mail da conta SourceDayZ antes de entrar."
        : status === 401 ? "E-mail ou senha incorretos." : "Não foi possível autenticar a conta SourceDayZ.";
      return json(res, status, { error: message });
    }

    const profileResponse = await fetch(
      `${baseUrl}/rest/v1/profiles?select=steam&id=eq.${encodeURIComponent(auth.user.id)}`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${auth.access_token}` } },
    );
    const [profile] = profileResponse.ok ? await profileResponse.json() : [];
    const steam = profile?.steam && typeof profile.steam === "object" ? profile.steam : null;
    const steamVerified = steam?.verificado === true && typeof steam?.steamId64 === "string" && steam.steamId64.length > 0;

    return json(res, 200, {
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      expiresIn: Number(auth.expires_in || 3600),
      userId: auth.user.id,
      email: auth.user.email || email,
      steamVerified,
      steamName: steam?.nome || null,
    });
  } catch {
    return json(res, 502, { error: "Não foi possível conectar à conta SourceDayZ." });
  }
}
