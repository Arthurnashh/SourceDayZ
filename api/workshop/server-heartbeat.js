import { callWorkshopRpc, clientIpFromRequest, jsonResponse } from "../../server/workshop-server-registry.js";

const FOLDER_PATTERN = /^@[A-Za-z0-9._-]{1,80}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return jsonResponse(res, 405, { error: "Método não permitido." });
  }

  const authorization = req.headers?.authorization || "";
  const tokenMatch = String(authorization).match(/^Bearer\s+([a-f0-9]{64})$/i);
  if (!tokenMatch) return jsonResponse(res, 401, { error: "Credencial do servidor ausente ou inválida." });

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return jsonResponse(res, 400, { error: "Corpo da solicitação inválido." });
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonResponse(res, 400, { error: "Corpo da solicitação inválido." });
  }

  const serverName = typeof body.serverName === "string" ? body.serverName.trim() : "";
  const port = Number(body.port);
  const mods = Array.isArray(body.mods) ? [...new Set(body.mods)] : null;
  if (serverName.length < 3 || serverName.length > 120) {
    return jsonResponse(res, 400, { error: "O servidor precisa de um nome entre 3 e 120 caracteres." });
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return jsonResponse(res, 400, { error: "Porta do servidor inválida." });
  }
  if (!mods || mods.length > 32 || mods.some((folder) => typeof folder !== "string" || !FOLDER_PATTERN.test(folder))) {
    return jsonResponse(res, 400, { error: "A lista deve conter até 32 pastas de mod no formato @NomeDoMod." });
  }

  try {
    const result = await callWorkshopRpc("workshop_server_heartbeat", {
      p_token: tokenMatch[1].toLowerCase(),
      p_server_name: serverName,
      p_game_port: port,
      p_public_ip: clientIpFromRequest(req),
      p_mod_folders: mods,
    });

    if (result?.ok !== true) return jsonResponse(res, 502, { error: "O banco não confirmou o registro do servidor." });
    return jsonResponse(res, 200, result);
  } catch (error) {
    const code = String(error?.message || "");
    const missingMigration = error?.statusCode === 404 || /workshop_server_heartbeat|schema cache/i.test(code);
    const unauthorized = /server_auth_invalid/i.test(code);
    const invalidServer = /server_name_invalid|server_port_invalid|server_mod_folder_invalid/i.test(code);
    const status = missingMigration ? 503 : unauthorized ? 401 : invalidServer ? 400 : 502;
    return jsonResponse(res, status, {
      error: missingMigration
        ? "A integração de servidores ainda não foi configurada no Supabase."
        : unauthorized
          ? "A credencial deste servidor não foi reconhecida."
          : invalidServer
            ? "Os dados enviados pelo servidor são inválidos."
            : "Não foi possível registrar os mods deste servidor no Workshop.",
    });
  }
}
