import fs from "node:fs";
import path from "node:path";

/** Divide achados.json em lotes de tradução. */
const MAX = Number(process.argv[2] ?? 12000);
const OUT = process.argv[3] ?? path.join(process.env.TEMP ?? ".", "opencode", "achados-traducao");
const dados = JSON.parse(fs.readFileSync("public/data/achados.json", "utf8"));

fs.mkdirSync(OUT, { recursive: true });

const lotes = [];
let atual = [];
let chars = 0;

const flush = () => {
  if (!atual.length) return;
  const n = String(lotes.length + 1).padStart(2, "0");
  const arquivo = `lote-${n}.json`;
  fs.writeFileSync(path.join(OUT, arquivo), JSON.stringify({ lote: n, itens: atual }, null, 2), "utf8");
  lotes.push({ arquivo, inicio: atual[0].id, fim: atual[atual.length - 1].id, itens: atual.length, chars });
  atual = [];
  chars = 0;
};

for (const a of dados) {
  const item = { id: a.id, tipo: a.tipo, resumo: a.resumo, campos: a.campos, texto: a.texto };
  const itemChars =
    a.resumo.length + a.texto.length + Object.values(a.campos).reduce((n, v) => n + v.length, 0);
  if (atual.length && chars + itemChars > MAX) flush();
  atual.push(item);
  chars += itemChars;
}
flush();

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ origem: "public/data/achados.json", maxChars: MAX, lotes }, null, 2),
  "utf8"
);

console.log(`lotes: ${lotes.length} | destino: ${OUT}`);
for (const l of lotes) console.log(`${l.arquivo} itens=${l.itens} chars=${l.chars} ${l.inicio}..${l.fim}`);
