import fs from "node:fs";

const PT = /[ãõáéíóúâêôçà]/i;
const stats = new Map();

function walk(v, path) {
  if (typeof v === "string") {
    if (v.length < 3) return;
    const key = path.replace(/\[\d+\]/g, "[]");
    const s = stats.get(key) ?? { n: 0, chars: 0, pt: 0, sample: "" };
    s.n++;
    s.chars += v.length;
    if (PT.test(v)) s.pt++;
    if (!s.sample && PT.test(v)) s.sample = v.slice(0, 90);
    stats.set(key, s);
    return;
  }
  if (Array.isArray(v)) {
    for (const item of v) walk(item, `${path}[]`);
    return;
  }
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  }
}

for (const nome of ["funcoes.json", "achados.json", "bugs.json", "board.json", "ferramentas.json", "source.json", "secoes.json", "meta.json"]) {
  stats.clear();
  walk(JSON.parse(fs.readFileSync(`public/data/${nome}`, "utf8")), "");
  console.log(`\n### ${nome}`);
  for (const [k, s] of [...stats.entries()].sort((a, b) => b[1].chars - a[1].chars)) {
    if (s.pt === 0 && s.chars < 200) continue;
    console.log(`${k.padEnd(34)} n=${String(s.n).padStart(4)} chars=${String(s.chars).padStart(7)} pt=${String(s.pt).padStart(4)}  ${s.sample.replace(/\n/g, " ")}`);
  }
}
