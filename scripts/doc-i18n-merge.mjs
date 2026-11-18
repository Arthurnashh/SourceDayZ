import fs from "node:fs";
import path from "node:path";

/**
 * Junta os lotes traduzidos em doc.en.json e doc.ru.json.
 * Uso: node scripts/doc-i18n-merge.mjs <dirDosLotes>
 */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "doc-traducao");
const PARCIAL = process.argv.includes("--parcial");
const doc = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
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
      if (map.has(item.i)) throw new Error(`Índice duplicado ${item.i} em ${file}`);
      map.set(item.i, item);
    }
  }
  if (map.size !== doc.secoes.length && !PARCIAL) {
    throw new Error(`${locale}: ${map.size} seções traduzidas, esperado ${doc.secoes.length}`);
  }
  return map;
}

for (const locale of ["en", "ru"]) {
  const map = carregar(locale);
  const completo = map.size === doc.secoes.length;
  const saida = {
    ...doc,
    locale,
    traduzido: completo,
    parcial: !completo,
    secoes: doc.secoes.map((s, i) => {
      const tr = map.get(i);
      return { ...s, titulo: tr?.titulo ?? s.titulo, md: tr?.md ?? s.md };
    }),
  };
  const file = `public/data/doc.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
  console.log(
    `${file}: ${saida.secoes.length} seções (${map.size} traduzidas, ${completo ? "completo" : "PARCIAL"}), ${fs.statSync(file).size} bytes`
  );
}
