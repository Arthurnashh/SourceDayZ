import fs from "node:fs";
import path from "node:path";

/** Divide o glossário em lotes para tradução PT->RU. */
const MAX = Number(process.argv[2] ?? 10000);
const OUT = process.argv[3] ?? path.join(process.env.TEMP ?? ".", "opencode", "glossario-traducao");
const dados = JSON.parse(fs.readFileSync("public/data/glossario.json", "utf8"));

fs.mkdirSync(OUT, { recursive: true });

const lotes = [];
let atual = [];
let chars = 0;

const flush = () => {
  if (!atual.length) return;
  const n = String(lotes.length + 1).padStart(2, "0");
  const arquivo = `lote-${n}.json`;
  fs.writeFileSync(path.join(OUT, arquivo), JSON.stringify({ lote: n, itens: atual }, null, 2), "utf8");
  lotes.push({ arquivo, inicio: atual[0].i, fim: atual[atual.length - 1].i, itens: atual.length, chars });
  atual = [];
  chars = 0;
};

dados.itens.forEach((item, i) => {
  const entrada = { i, en: item.en, pt: item.pt, tipo: item.tipo };
  const tamanho = item.en.length + item.pt.length;
  if (atual.length && chars + tamanho > MAX) flush();
  atual.push(entrada);
  chars += tamanho;
});
flush();

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ origem: "public/data/glossario.json", maxChars: MAX, lotes }, null, 2),
  "utf8"
);

console.log(`lotes: ${lotes.length} | destino: ${OUT}`);
for (const l of lotes) console.log(`${l.arquivo} itens=${l.itens} chars=${l.chars} ${l.inicio}..${l.fim}`);
