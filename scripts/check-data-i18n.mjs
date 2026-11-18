import fs from "node:fs";

/**
 * Auditoria heurística de conteúdo em português nos arquivos localizados.
 * Não é um teste linguístico: aponta campos que claramente continuam em PT.
 */
const ACENTOS = /[ãõáéíóúâêôçà]/gi;
const PALAVRAS = /\b(não|uma|para|com|dos|das|pelo|pela|isso|este|esta|esse|essa|quando|porque|também|já|é|são|foi|ser|tem|têm|linhas|arquivo|código|função|funções|engine|jogo|memória|fonte|saída|entrada|primeiro|depois|antes|sobre|entre|sem|mais|como|onde|qual|quais|todo|toda|todos|todas)\b/gi;

function limpar(texto) {
  return texto
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]+`/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
}

function pontuar(texto) {
  const limpo = limpar(texto);
  const acentos = (limpo.match(ACENTOS) ?? []).length;
  const palavras = (limpo.match(PALAVRAS) ?? []).length;
  return { acentos, palavras, score: acentos * 3 + palavras };
}

function walk(valor, path, out) {
  if (typeof valor === "string") {
    if (valor.length < 15) return;
    const p = pontuar(valor);
    if (p.acentos >= 2 || p.palavras >= 3) {
      out.push({ path, ...p, sample: valor.replace(/\s+/g, " ").slice(0, 110) });
    }
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => walk(v, `${path}[${i}]`, out));
    return;
  }
  if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) walk(v, path ? `${path}.${k}` : k, out);
  }
}

const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.error("Uso: node scripts/check-data-i18n.mjs <arquivo.json> [...]");
  process.exit(2);
}

let total = 0;
for (const file of arquivos) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const out = [];
  walk(json, "", out);
  out.sort((a, b) => b.score - a.score);
  total += out.length;
  console.log(`\n### ${file}: ${out.length} campo(s) suspeito(s)`);
  for (const o of out.slice(0, 12)) {
    console.log(`  ${o.path}  [a=${o.acentos} p=${o.palavras}]  ${o.sample}`);
  }
}

process.exitCode = total ? 1 : 0;
