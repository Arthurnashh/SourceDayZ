import fs from "node:fs";

/** Confere doc.en.json / doc.ru.json contra o doc.json original. */
const locale = process.argv[2] ?? "en";
const original = JSON.parse(fs.readFileSync("public/data/doc.json", "utf8"));
const traduzido = JSON.parse(fs.readFileSync(`public/data/doc.${locale}.json`, "utf8"));

const codeBlocks = (md) => [...md.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
const codeSpans = (md) => {
  const semBlocos = md.replace(/```[\s\S]*?```/g, "");
  return [...semBlocos.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
};
const criticos = (s) => /[\\/._:#()<>]/.test(s) || /[a-z][A-Z]/.test(s);

let erros = 0;
let avisos = 0;

if (traduzido.secoes.length !== original.secoes.length) {
  console.log(`seções ${traduzido.secoes.length} != ${original.secoes.length}`);
  erros++;
}

original.secoes.forEach((o, i) => {
  const t = traduzido.secoes[i];
  if (!t) {
    console.log(`seção ${i}: ausente`);
    erros++;
    return;
  }
  if (o.nivel !== t.nivel) {
    console.log(`seção ${i}: nivel ${t.nivel} != ${o.nivel}`);
    erros++;
  }
  if (!t.titulo?.trim()) {
    console.log(`seção ${i}: título vazio`);
    erros++;
  }
  if (o.md.trim() && !t.md?.trim()) {
    console.log(`seção ${i}: md vazio`);
    erros++;
  }

  const ob = codeBlocks(o.md);
  const tb = codeBlocks(t.md ?? "");
  if (ob.length !== tb.length) {
    console.log(`seção ${i}: blocos ${tb.length} != ${ob.length}`);
    erros++;
  } else {
    for (let b = 0; b < ob.length; b++) {
      if (ob[b] !== tb[b]) {
        console.log(`seção ${i}: bloco ${b} alterado`);
        erros++;
      }
    }
  }

  const ts = new Set(codeSpans(t.md ?? ""));
  const faltando = [...new Set(codeSpans(o.md))].filter((s) => !ts.has(s) && s !== "arquivo:linha");
  const faltandoCriticos = faltando.filter(criticos);
  if (faltandoCriticos.length) {
    console.log(`seção ${i}: código inline crítico ausente: ${faltandoCriticos.slice(0, 5).join(" | ")}`);
    erros++;
  } else if (faltando.length) {
    console.log(`seção ${i}: termos inline traduzidos: ${faltando.slice(0, 5).join(" | ")}`);
    avisos++;
  }
});

const bytes = fs.statSync(`public/data/doc.${locale}.json`).size;
console.log(`\n${locale}: seções=${traduzido.secoes.length} bytes=${bytes} erros=${erros} avisos=${avisos}`);
process.exitCode = erros ? 1 : 0;
