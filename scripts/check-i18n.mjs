import fs from "node:fs";
import path from "node:path";

const dict = fs.readFileSync("src/content/docs-i18n.ts", "utf8");
const work = fs.readFileSync("src/content/work-i18n.ts", "utf8");
const keys = new Set();
for (const source of [dict, work]) {
  for (const m of source.matchAll(/^ {2}"?([\w.]+)"?:/gm)) keys.add(m[1]);
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(p);
  }
}
walk("src");

const used = new Set();
for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  for (const m of code.matchAll(/\bt\("([^"]+)"/g)) used.add(m[1]);
}

const missing = [...used].filter((k) => !keys.has(k) && !k.includes("${"));
const unused = [...keys].filter((k) => !used.has(k));
console.log("chaves no dicionario:", keys.size, "| usadas:", used.size);
console.log("FALTANDO:\n" + missing.sort().join("\n"));
console.log("NAO USADAS (" + unused.length + "):\n" + unused.sort().join("\n"));
