import fs from "node:fs";

const doc = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
const funcoes = JSON.parse(fs.readFileSync("public/data/funcoes.json", "utf8"));

function parseSecao(md) {
  const blocos = [];
  let atual = null;
  for (const line of md.split("\n")) {
    const m = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (m) {
      if (atual) blocos.push(atual);
      atual = { label: m[1], text: m[2] };
    } else if (atual) {
      atual.text += `\n${line}`;
    }
  }
  if (atual) blocos.push(atual);
  return blocos.map((b) => ({ label: b.label, text: b.text.trim() }));
}

const secoes = doc.secoes.filter((s) => /^F-\d+/.test(s.titulo));
const porId = new Map(secoes.map((s) => [s.titulo.match(/^(F-\d+)/)[1], s]));

const campos = ["local", "assinatura", "papel", "fluxo", "aprendi", "risco"];
const matches = new Map();
const naoMapeados = [];

for (const f of funcoes) {
  const sec = porId.get(f.id);
  if (!sec) {
    naoMapeados.push(`${f.id}: seção ausente`);
    continue;
  }
  const blocos = parseSecao(sec.md);
  for (const campo of campos) {
    const valor = (f[campo] ?? "").trim();
    if (!valor) continue;
    const achou = blocos.find((b) => b.text === valor);
    if (achou) {
      const k = `${campo} <- ${achou.label}`;
      matches.set(k, (matches.get(k) ?? 0) + 1);
    } else {
      const parcial = blocos.find((b) => b.text.startsWith(valor.slice(0, 80)));
      naoMapeados.push(`${f.id}.${campo}: sem match exato (${parcial ? `parcial ${parcial.label}` : "nenhum"})`);
    }
  }
}

console.log("MATCHES");
for (const [k, n] of [...matches.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(4)}  ${k}`);
}
console.log(`\nNAO MAPEADOS: ${naoMapeados.length}`);
for (const n of naoMapeados.slice(0, 40)) console.log(n);
