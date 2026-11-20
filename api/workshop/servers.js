import { callWorkshopRpc, jsonResponse } from "../../server/workshop-server-registry.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return jsonResponse(res, 405, { error: "Método não permitido." });
  }

  try {
    const manifest = await callWorkshopRpc("workshop_server_manifest", {});
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.servers)) {
      return jsonResponse(res, 502, { error: "O manifesto de servidores retornou dados inválidos." });
    }
    return jsonResponse(res, 200, manifest);
  } catch (error) {
    const message = String(error?.message || "");
    const missingMigration = error?.statusCode === 404 || /workshop_server_manifest|schema cache/i.test(message);
    return jsonResponse(res, missingMigration ? 503 : Number(error?.statusCode) || 502, {
      error: missingMigration
        ? "A integração de servidores ainda não foi configurada no Supabase."
        : "Não foi possível carregar o manifesto dos servidores.",
    });
  }
}
