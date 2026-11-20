import { isIP } from "node:net";

export function jsonResponse(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
}

export function clientIpFromRequest(req) {
  const realIp = req.headers?.["x-real-ip"];
  const forwarded = req.headers?.["x-forwarded-for"];
  const candidates = [realIp, forwarded]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().replace(/^\[|\]$/g, ""));

  return candidates.find((value) => isIP(value)) || null;
}

export async function callWorkshopRpc(name, payload) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    const error = new Error("Workshop indisponível: configuração do banco ausente.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${encodeURIComponent(name)}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const raw = await response.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = new Error(typeof body?.message === "string" ? body.message : "Falha na consulta do Workshop.");
    error.statusCode = response.status;
    error.code = body?.code;
    throw error;
  }

  return body;
}
