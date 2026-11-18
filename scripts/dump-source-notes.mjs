import fs from "node:fs";

const s = JSON.parse(fs.readFileSync("public/data/source.json", "utf8"));
console.log("### arquivos_raiz");
for (const a of s.arquivos_raiz) if (a.nota) console.log(`${a.nome}\t${a.nota}`);
console.log("\n### dirs");
for (const d of s.dirs) {
  if (d.nota) console.log(`${d.nome}\t${d.nota}`);
  for (const f of d.filhos ?? []) if (f.nota) console.log(`${d.nome}/${f.nome}\t${f.nota}`);
}
