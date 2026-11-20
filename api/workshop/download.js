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

  const modId = typeof req.body?.modId === "string" ? req.body.modId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(modId)) {
    return json(res, 400, { error: "Identificador de mod inválido." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json(res, 503, { error: "Workshop indisponível: configuração do banco ausente." });
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  try {
    const recordResponse = await fetch(`${baseUrl}/rest/v1/rpc/workshop_record_download`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_mod_id: modId }),
    });

    if (!recordResponse.ok) {
      const detail = await recordResponse.text();
      const migrationMissing = recordResponse.status === 404 || /workshop_record_download|schema cache/i.test(detail);
      return json(res, migrationMissing ? 503 : 404, {
        error: migrationMissing
          ? "O banco do Workshop ainda não está configurado. Aplique supabase/workshopMods.sql no Supabase."
          : "Este mod não está disponível para download.",
      });
    }

    const [file] = await recordResponse.json();
    if (!file?.file_path || !file?.file_name) {
      return json(res, 404, { error: "Este mod não está disponível para download." });
    }

    const encodedPath = file.file_path.split("/").map(encodeURIComponent).join("/");
    const signedResponse = await fetch(`${baseUrl}/storage/v1/object/sign/workshop-mod-files/${encodedPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ expiresIn: 3600 }),
    });

    if (!signedResponse.ok) {
      return json(res, 502, { error: "Não foi possível gerar o link seguro deste mod." });
    }

    const signed = await signedResponse.json();
    const signedPath = String(signed.signedURL || "");
    if (!signedPath) return json(res, 502, { error: "O armazenamento não retornou um link para o mod." });

    const downloadUrl = signedPath.startsWith("http")
      ? new URL(signedPath).toString()
      : new URL(`/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`, baseUrl).toString();
    downloadUrl.searchParams.set("download", file.file_name);
    return json(res, 200, { url: downloadUrl, fileName: file.file_name, version: file.version || "" });
  } catch {
    return json(res, 502, { error: "Não foi possível preparar o download deste mod." });
  }
}
