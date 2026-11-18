import fs from "node:fs";
import path from "node:path";

/** Junta os lotes de tradução do glossário (PT->RU). */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "glossario-traducao");
const PARCIAL = process.argv.includes("--parcial");
const dados = JSON.parse(fs.readFileSync("public/data/glossario.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

const map = new Map();
for (const lote of manifest.lotes) {
  const file = path.join(DIR, `${lote.arquivo.replace(/\.json$/, "")}.ru.json`);
  if (!fs.existsSync(file)) {
    if (PARCIAL) continue;
    throw new Error(`Faltando ${file}`);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const item of data.itens) {
    if (map.has(item.i)) throw new Error(`Índice duplicado ${item.i} em ${file}`);
    map.set(item.i, item.ru);
  }
}

const saida = {
  ...dados,
  itens: dados.itens.map((item, i) => (map.has(i) ? { ...item, ru: map.get(i) } : item)),
};
const file = "public/data/glossario.ru.json";
fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
console.log(
  `${file}: ${saida.itens.length} itens (${map.size} com RU, ${map.size === dados.itens.length ? "completo" : "PARCIAL"}), ${fs.statSync(file).size} bytes`
);
