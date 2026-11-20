import { fetchWorkshopManifest } from "../../server/workshop-manifest.js";

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
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return json(res, 400, { error: "Corpo da solicitação inválido." }); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.url !== "string" || body.url.length > 1000) {
    return json(res, 400, { error: "Informe o link do manifesto do mod." });
  }
  try {
    const result = await fetchWorkshopManifest(body.url);
    return json(res, 200, result);
  } catch (error) {
    return json(res, Number(error?.statusCode) || 502, { error: error instanceof Error ? error.message : "Não foi possível validar o manifesto." });
  }
}
