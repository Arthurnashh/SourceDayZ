import fs from "node:fs";
import path from "node:path";

/** Conta o texto humano de cada JSON de dados, ignorando código e campos técnicos. */
const DIR = "public/data";
const arquivos = [
  "funcoes.json",
  "achados.json",
  "glossario.json",
  "bugs.json",
  "alertas.json",
  "patches.json",
  "board.json",
  "meta.json",
  "ferramentas.json",
  "source.json",
  "secoes.json",
  "comentarios-index.json",
];

const CODE = /```[\s\S]*?```/g;
const camposTexto = new Set([
  "titulo", "papel", "descricao", "resumo", "texto", "detalhe", "detalhes",
  "evidencia", "impacto", "correcao", "solucao", "nota", "notas", "observacao",
  "explicacao", "exemplo", "pt", "en", "label", "nome", "mensagem", "motivo",
  "conteudo", "comentario", "analise", "hipotese", "risco", "acao", "proximo",
  "desc", "title", "body", "summary",
]);

function textoHumano(valor) {
  if (typeof valor === "string") {
    if (/^[A-Za-z0-9_./\\-]+$/.test(valor)) return 0; // identificador
    if (/^\d+$/.test(valor)) return 0;
    return valor.length;
  }
  if (Array.isArray(valor)) return valor.reduce((n, v) => n + textoHumano(v), 0);
  if (valor && typeof valor === "object") {
    let n = 0;
    for (const [k, v] of Object.entries(valor)) {
      if (k === "md" || k === "code" || k === "codigo") continue;
      if (camposTexto.has(k)) n += textoHumano(v);
    }
    return n;
  }
  return 0;
}

for (const nome of arquivos) {
  const file = path.join(DIR, nome);
  if (!fs.existsSync(file)) continue;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const bruto = JSON.stringify(json).length;
  const humano = textoHumano(json);
  console.log(`${nome.padEnd(24)} bytes=${String(bruto).padStart(8)} texto≈${String(humano).padStart(8)}`);
}
