import fs from "node:fs";
import path from "node:path";

/**
 * Valida os lotes traduzidos contra os originais.
 * Uso: node scripts/doc-i18n-check.mjs <dirDosLotes> <en|ru>
 */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "doc-traducao");
const LOCALE = process.argv[3] ?? "en";
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

const codeBlocks = (md) => [...md.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
const codeSpans = (md) => {
  const semBlocos = md.replace(/```[\s\S]*?```/g, "");
  return [...semBlocos.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
};
const tableRows = (md) => md.split("\n").filter((l) => l.trim().startsWith("|")).length;
const headings = (md) => md.split("\n").filter((l) => /^#{1,6}\s/.test(l)).length;
const links = (md) => [...md.matchAll(/https?:\/\/[^\s)\]>]+/g)].map((m) => m[0]);
const paths = (md) =>
  [...md.matchAll(/[A-Za-z0-9_./\\-]+\.(?:cpp|h|hpp|c|cc|json|md|pbo|paa|p3d|rtm|sqf|inl|txt|dll|exe|py|bat|cfg)\b/g)].map(
    (m) => m[0]
  );

let erros = 0;
let avisos = 0;

for (const lote of manifest.lotes) {
  const base = lote.arquivo.replace(/\.json$/, "");
  const original = JSON.parse(fs.readFileSync(path.join(DIR, `${base}.json`), "utf8"));
  const traduzidoFile = path.join(DIR, `${base}.${LOCALE}.json`);
  if (!fs.existsSync(traduzidoFile)) {
    console.log(`FALTANDO ${traduzidoFile}`);
    erros++;
    continue;
  }
  const traduzido = JSON.parse(fs.readFileSync(traduzidoFile, "utf8"));
  if (traduzido.itens.length !== original.itens.length) {
    console.log(`${base}: itens ${traduzido.itens.length} != ${original.itens.length}`);
    erros++;
  }

  for (let k = 0; k < original.itens.length; k++) {
    const o = original.itens[k];
    const t = traduzido.itens[k];
    if (!t) {
      console.log(`${base} item ${o.i}: ausente`);
      erros++;
      continue;
    }
    if (t.i !== o.i) {
      console.log(`${base} item ${k}: i ${t.i} != ${o.i}`);
      erros++;
    }
    if (!t.titulo?.trim()) {
      console.log(`${base} item ${o.i}: título vazio`);
      erros++;
    }
    if (o.md.trim() && !t.md?.trim()) {
      console.log(`${base} item ${o.i}: md vazio`);
      erros++;
    }

    const ob = codeBlocks(o.md);
    const tb = codeBlocks(t.md ?? "");
    if (ob.length !== tb.length) {
      console.log(`${base} item ${o.i}: blocos ${tb.length} != ${ob.length}`);
      erros++;
    } else {
      for (let b = 0; b < ob.length; b++) {
        if (ob[b] !== tb[b]) {
          console.log(`${base} item ${o.i}: bloco ${b} alterado`);
          erros++;
        }
      }
    }

    const os = codeSpans(o.md);
    const ts = new Set(codeSpans(t.md ?? ""));
    const faltando = [...new Set(os)].filter((s) => !ts.has(s));
    // Termos genéricos podem ser traduzidos (`arquivo:linha` -> `file:line`).
    // Identificadores, caminhos e símbolos, não.
    const EXCECOES = new Set(["arquivo:linha"]);
    const critico = (s) => /[\\/._:#()<>]/.test(s) || /[a-z][A-Z]/.test(s);
    const criticos = faltando.filter((s) => critico(s) && !EXCECOES.has(s));
    const comuns = faltando.filter((s) => !critico(s) || EXCECOES.has(s));
    if (criticos.length) {
      console.log(`${base} item ${o.i}: ${criticos.length} código(s) inline crítico(s) ausente(s): ${criticos.slice(0, 5).join(" | ")}`);
      erros++;
    }
    if (comuns.length) {
      console.log(`${base} item ${o.i}: ${comuns.length} termo(s) inline traduzido(s): ${comuns.slice(0, 5).join(" | ")}`);
      avisos++;
    }

    if (tableRows(t.md ?? "") !== tableRows(o.md)) {
      console.log(`${base} item ${o.i}: linhas de tabela ${tableRows(t.md ?? "")} != ${tableRows(o.md)}`);
      avisos++;
    }
    if (headings(t.md ?? "") !== headings(o.md)) {
      console.log(`${base} item ${o.i}: títulos ${headings(t.md ?? "")} != ${headings(o.md)}`);
      avisos++;
    }

    const ol = links(o.md);
    const tl = new Set(links(t.md ?? ""));
    const linksFaltando = [...new Set(ol)].filter((u) => !tl.has(u));
    if (linksFaltando.length) {
      console.log(`${base} item ${o.i}: ${linksFaltando.length} link(s) ausente(s)`);
      avisos++;
    }

    const op = [...new Set(paths(o.md))];
    const tp = new Set(paths(t.md ?? ""));
    const pathsFaltando = op.filter((p) => !tp.has(p));
    if (pathsFaltando.length) {
      console.log(`${base} item ${o.i}: ${pathsFaltando.length} caminho(s) ausente(s): ${pathsFaltando.slice(0, 5).join(" | ")}`);
      avisos++;
    }
  }
}

console.log(`\n${LOCALE}: erros=${erros} avisos=${avisos}`);
process.exitCode = erros ? 1 : 0;
