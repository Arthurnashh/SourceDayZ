import fs from "node:fs";

const doc = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
const secoes = doc.secoes;

let totalMd = 0;
let totalCode = 0;
let withMd = 0;
let withCode = 0;
const buckets = {};

for (const s of secoes) {
  const md = s.md ?? "";
  totalMd += md.length;
  if (md.trim()) withMd += 1;
  const blocks = [...md.matchAll(/```[\s\S]*?```/g)];
  if (blocks.length) withCode += 1;
  for (const b of blocks) totalCode += b[0].length;
  const kb = Math.ceil(md.length / 5000) * 5;
  buckets[kb] = (buckets[kb] ?? 0) + 1;
}

console.log(JSON.stringify({
  secoes: secoes.length,
  withMd,
  withCode,
  totalMd,
  totalCode,
  prose: totalMd - totalCode,
  buckets,
  maior: Math.max(...secoes.map((s) => s.md?.length ?? 0)),
}, null, 2));
