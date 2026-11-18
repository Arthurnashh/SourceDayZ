import fs from "node:fs";
const d = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
const statuses = d.secoes
  .filter((s) => /^F-\d+/.test(s.titulo))
  .map((s) => s.titulo.split("—").slice(2).join("—").trim());
console.log([...new Set(statuses)].join("\n"));
