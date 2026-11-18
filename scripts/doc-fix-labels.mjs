import fs from "node:fs";

/**
 * Traduz os rótulos de campo e os estados das seções F- que foram mantidos
 * em português de propósito durante a tradução (para permitir a montagem
 * automática de funcoes.*.json).
 *
 * IMPORTANTE: rode `funcoes-from-doc.mjs` ANTES deste script.
 *
 * Uso: node scripts/doc-fix-labels.mjs
 */

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

function traduzirLabel(locale, label) {
  const dic = LABELS[locale];
  for (const [pt, alvo] of Object.entries(dic)) {
    if (label === pt) return alvo;
    if (label.startsWith(`${pt} `)) return label.replace(pt, alvo);
  }
  return label;
}

function substituirLabels(locale, md) {
  const linhas = md.split("\n");
  let dentroDeCodigo = false;
  return linhas
    .map((linha) => {
      if (/^\s*```/.test(linha)) {
        dentroDeCodigo = !dentroDeCodigo;
        return linha;
      }
      if (dentroDeCodigo) return linha;
      return linha.replace(/^(\s*)- \*\*(.+?):\*\*/, (_, espaco, label) => {
        return `${espaco}- **${traduzirLabel(locale, label)}:**`;
      });
    })
    .join("\n");
}

function traduzirStatus(locale, titulo) {
  if (locale === "en") {
    return titulo
      .replace(/\*\*parcial\b/g, "**partial")
      .replace(/\*\*completa\b/g, "**complete")
      .replace(/\*\*completas\b/g, "**complete")
      .replace(/\(≈([\d]+)% do corpo\)/g, "(≈$1% of the body)")
      .replace(/\(revisão de (F-\d+)\)/g, "(revision of $1)");
  }
  return titulo
    .replace(/\*\*parcial\b/g, "**частичный")
    .replace(/\*\*completa\b/g, "**полная")
    .replace(/\*\*completas\b/g, "**полные")
    .replace(/\(≈([\d]+)% do corpo\)/g, "(≈$1% тела)")
    .replace(/\(revisão de (F-\d+)\)/g, "(ревизия $1)");
}

for (const locale of ["en", "ru"]) {
  const file = `public/data/doc.${locale}.json`;
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  let secoes = 0;
  for (const s of doc.secoes) {
    const antes = s.md;
    s.md = substituirLabels(locale, s.md);
    if (/^F-\d+/.test(s.titulo)) {
      s.titulo = traduzirStatus(locale, s.titulo);
      secoes++;
    }
    if (s.md !== antes) secoes++;
  }
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), "utf8");
  console.log(`${file}: rótulos/status ajustados (${secoes} alterações de seção)`);
}
