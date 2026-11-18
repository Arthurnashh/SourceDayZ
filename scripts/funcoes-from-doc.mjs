import fs from "node:fs";

/**
 * Monta funcoes.en.json / funcoes.ru.json a partir das seções F- do documento
 * traduzido. As seções preservam os rótulos em português, o que permite
 * reconstruir os campos com fidelidade.
 *
 * Uso: node scripts/funcoes-from-doc.mjs
 */

const LOCALES = ["en", "ru"];
const funcoes = JSON.parse(fs.readFileSync("public/data/funcoes.json", "utf8"));

const LABELS = {
  en: {
    Local: "Location",
    Assinatura: "Signature",
    Assinaturas: "Signatures",
    Papel: "Role",
    Fluxo: "Flow",
    Risco: "Risk",
    Pendência: "Pending",
    Corpo: "Body",
    Detalhe: "Detail",
    "O que aprendi": "What I learned",
    "Ordem real": "Actual order",
    "Estrutura do job": "Job structure",
    "Variante base": "Base variant",
    Reancoragem: "Re-anchoring",
    Assimetria: "Asymmetry",
  },
  ru: {
    Local: "Место",
    Assinatura: "Сигнатура",
    Assinaturas: "Сигнатуры",
    Papel: "Роль",
    Fluxo: "Поток",
    Risco: "Риск",
    Pendência: "Незавершённое",
    Corpo: "Тело",
    Detalhe: "Деталь",
    "O que aprendi": "Что я узнал",
    "Ordem real": "Реальный порядок",
    "Estrutura do job": "Структура задачи",
    "Variante base": "Базовый вариант",
    Reancoragem: "Перепривязка",
    Assimetria: "Асимметрия",
  }
};

/** Traduz o rótulo para exibição, inclusive variantes com parênteses. */
function traduzirLabel(locale, label) {
  const dic = LABELS[locale];
  for (const [pt, alvo] of Object.entries(dic)) {
    if (label === pt) return alvo;
    if (label.startsWith(`${pt} `)) return label.replace(pt, alvo);
    if (label.startsWith(`${pt}:`)) return label.replace(pt, alvo);
  }
  return label;
}

function parseBlocos(md) {
  const blocos = [];
  let atual = null;
  for (const linha of md.split("\n")) {
    const m = linha.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (m) {
      if (atual) blocos.push(atual);
      atual = { label: m[1], text: m[2] };
    } else if (atual) {
      atual.text += `\n${linha}`;
    }
  }
  if (atual) blocos.push(atual);
  return blocos.map((b) => ({ label: b.label, text: b.text.trim() }));
}

function ehLocal(label) {
  return /^Local\b/.test(label);
}
function ehAssinatura(label) {
  return /^Assinatura/.test(label);
}
function ehPapel(label) {
  return /^Papel\b/.test(label);
}
function ehFluxo(label) {
  return /^Fluxo\b/.test(label) || /^Ordem real\b/.test(label);
}
function ehAprendi(label) {
  return /^O que aprendi\b/.test(label);
}
function ehRisco(label) {
  return /^Risco\b/.test(label) || /^Pendência\b/.test(label);
}

function blocoMd(locale, bloco) {
  const label = traduzirLabel(locale, bloco.label);
  return `- **${label}:**${bloco.text ? `\n${bloco.text}` : ""}`;
}

function montar(locale, doc) {
  const secoes = new Map();
  for (const s of doc.secoes) {
    const m = s.titulo.match(/^(F-\d+)/);
    if (m) secoes.set(m[1], s);
  }

  let usandoLote = 0;
  const saida = funcoes.map((f) => {
    // F-001..F-005 já têm tradução dedicada de melhor qualidade.
    const dedicado = JSON.parse(
      fs.readFileSync(
        `${process.env.TEMP}\\opencode\\funcoes-traducao\\lote-01.${locale}.json`,
        "utf8"
      )
    );
    const achado = dedicado.itens.find((i) => i.id === f.id);
    if (achado) {
      usandoLote++;
      return { ...f, ...achado, id: f.id };
    }

    const secao = secoes.get(f.id);
    if (!secao) return f;

    const blocos = parseBlocos(secao.md);
    const local = [];
    const assinatura = [];
    const papel = [];
    const fluxo = [];
    const aprendi = [];
    const risco = [];

    const texto = (b) =>
      b.text.replace(/^- \*\*(.+?):\*\*/gm, (_, label) => `- **${traduzirLabel(locale, label)}:**`);

    for (const b of blocos) {
      if (ehAssinatura(b.label)) assinatura.push(texto(b));
      else if (ehPapel(b.label)) papel.push(texto(b));
      else if (ehFluxo(b.label)) fluxo.push(texto(b));
      else if (ehAprendi(b.label)) aprendi.push(texto(b));
      else if (ehRisco(b.label)) risco.push(texto(b));
      else if (ehLocal(b.label)) local.unshift(texto(b));
      else local.push(blocoMd(locale, { ...b, text: texto(b) }));
    }

    let titulo = secao.titulo
      .replace(/^F-\d+\s+—\s+/, "")
      .replace(/\s+—\s+\*\*.*$/, "")
      .replace(/`/g, "")
      .trim();

    return {
      ...f,
      titulo: titulo || f.titulo,
      local: local.join("\n\n") || f.local,
      assinatura: assinatura.join("\n\n") || f.assinatura,
      papel: papel.join("\n\n"),
      fluxo: fluxo.join("\n\n"),
      aprendi: aprendi.join("\n\n") || f.aprendi,
      risco: risco.join("\n\n") || f.risco,
    };
  });

  const file = `public/data/funcoes.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
  console.log(
    `${file}: ${saida.length} funções (${usandoLote} do lote dedicado, ${saida.length - usandoLote} do documento), ${fs.statSync(file).size} bytes`
  );
}

for (const locale of LOCALES) {
  const doc = JSON.parse(fs.readFileSync(`public/data/doc.${locale}.json`, "utf8"));
  montar(locale, doc);
}
