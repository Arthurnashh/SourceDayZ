import fs from "node:fs";
import path from "node:path";

/**
 * Junta os lotes traduzidos de funcoes.json.
 * Uso: node scripts/funcoes-i18n-merge.mjs <dirDosLotes> [--parcial]
 */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "funcoes-traducao");
const PARCIAL = process.argv.includes("--parcial");
const CAMPOS = ["titulo", "local", "assinatura", "papel", "fluxo", "aprendi", "risco"];
const dados = JSON.parse(fs.readFileSync("public/data/funcoes.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

function carregar(locale) {
  const map = new Map();
  for (const lote of manifest.lotes) {
    const file = path.join(DIR, `${lote.arquivo.replace(/\.json$/, "")}.${locale}.json`);
    if (!fs.existsSync(file)) {
      if (PARCIAL) continue;
      throw new Error(`Faltando ${file}`);
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const item of data.itens) {
      if (map.has(item.id)) throw new Error(`ID duplicado ${item.id} em ${file}`);
      map.set(item.id, item);
    }
  }
  if (map.size !== dados.length && !PARCIAL) {
    throw new Error(`${locale}: ${map.size} funções traduzidas, esperado ${dados.length}`);
  }
  return map;
}

for (const locale of ["en", "ru"]) {
  const map = carregar(locale);
  const saida = dados.map((f) => {
    const tr = map.get(f.id);
    if (!tr) return f;
    const item = { ...f };
    for (const campo of CAMPOS) {
      if (tr[campo] !== undefined) item[campo] = tr[campo];
    }
    return item;
  });
  const file = `public/data/funcoes.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
  console.log(
    `${file}: ${saida.length} funções (${map.size} traduzidas, ${map.size === dados.length ? "completo" : "PARCIAL"}), ${fs.statSync(file).size} bytes`
  );
}
