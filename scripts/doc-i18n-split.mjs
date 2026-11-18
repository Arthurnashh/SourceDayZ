import fs from "node:fs";
import path from "node:path";

/**
 * Divide o doc.json em lotes de tradução por tamanho de texto.
 * Uso: node scripts/doc-i18n-split.mjs [maxChars] [outDir]
 */
const MAX = Number(process.argv[2] ?? 12000);
const OUT = process.argv[3] ?? path.join(process.env.TEMP ?? ".", "opencode", "doc-traducao");

const doc = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
fs.mkdirSync(OUT, { recursive: true });

const lotes = [];
let atual = [];
let chars = 0;

const flush = () => {
  if (!atual.length) return;
  const n = String(lotes.length + 1).padStart(2, "0");
  const arquivo = `lote-${n}.json`;
  fs.writeFileSync(
    path.join(OUT, arquivo),
    JSON.stringify({ lote: n, itens: atual }, null, 2),
    "utf8"
  );
  lotes.push({
    arquivo,
    inicio: atual[0].i,
    fim: atual[atual.length - 1].i,
    secoes: atual.length,
    chars,
  });
  atual = [];
  chars = 0;
};

doc.secoes.forEach((s, i) => {
  const md = s.md ?? "";
  if (atual.length && chars + md.length > MAX) flush();
  atual.push({ i, nivel: s.nivel, titulo: s.titulo, md });
  chars += md.length;
});
flush();

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ origem: "public/data/doc.json", maxChars: MAX, lotes }, null, 2),
  "utf8"
);

console.log(`lotes: ${lotes.length} | destino: ${OUT}`);
for (const l of lotes) {
  console.log(`${l.arquivo}  secoes=${l.secoes}  chars=${l.chars}  indices=${l.inicio}-${l.fim}`);
}
