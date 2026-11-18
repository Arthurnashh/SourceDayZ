import fs from "node:fs";

function shape(v, depth = 0) {
  if (v === null) return "null";
  if (Array.isArray(v)) return v.length ? `[${shape(v[0], depth + 1)} x${v.length}]` : "[]";
  if (typeof v === "object") {
    if (depth > 2) return "{...}";
    return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${shape(x, depth + 1)}`).join(", ")} }`;
  }
  if (typeof v === "string") return `str(${v.length})`;
  return typeof v;
}

for (const nome of ["bugs.json", "glossario.json", "board.json", "source.json", "comentarios-index.json", "secoes.json", "alertas.json", "patches.json", "meta.json", "ferramentas.json"]) {
  const json = JSON.parse(fs.readFileSync(`public/data/${nome}`, "utf8"));
  console.log(`\n### ${nome}\n${shape(json)}`);
  const amostra = Array.isArray(json) ? json[0] : json;
  console.log(JSON.stringify(amostra, null, 2).slice(0, 900));
}
