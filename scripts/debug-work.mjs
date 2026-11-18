import fs from "node:fs";

const s = fs.readFileSync("src/content/work-i18n.ts", "utf8");
const lines = s.split(/\r?\n/);
for (const n of [10, 11, 12]) {
  console.log(n, JSON.stringify(lines[n].slice(0, 20)), [...lines[n].slice(0, 6)].map((c) => c.charCodeAt(0)).join(","));
}
const dict = fs.readFileSync("src/content/docs-i18n.ts", "utf8");
for (const n of [10, 11, 12]) {
  const l = dict.split(/\r?\n/)[n];
  console.log("d" + n, JSON.stringify(l.slice(0, 20)), [...l.slice(0, 6)].map((c) => c.charCodeAt(0)).join(","));
}
