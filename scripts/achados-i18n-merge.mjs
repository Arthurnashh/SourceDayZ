import fs from "node:fs";
import path from "node:path";

/** Junta os lotes de achados.json traduzidos. */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "achados-traducao");
const PARCIAL = process.argv.includes("--parcial");
const dados = JSON.parse(fs.readFileSync("public/data/achados.json", "utf8"));
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
  return map;
}

for (const locale of ["en", "ru"]) {
  const map = carregar(locale);
  const saida = dados.map((a) => {
    const tr = map.get(a.id);
    if (!tr) return a;
    return { ...a, resumo: tr.resumo, campos: tr.campos, texto: tr.texto };
  });
  const file = `public/data/achados.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
  console.log(
    `${file}: ${saida.length} achados (${map.size} traduzidos, ${map.size === dados.length ? "completo" : "PARCIAL"}), ${fs.statSync(file).size} bytes`
  );
}
