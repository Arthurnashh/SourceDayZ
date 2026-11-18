import fs from "node:fs";

/**
 * Gera bugs.en.json / bugs.ru.json reaproveitando a tradução dos achados.
 * Os 163 itens vindos de comentários são o texto original em inglês dos
 * comentários da source e permanecem como evidência.
 */
const bugs = JSON.parse(fs.readFileSync("public/data/bugs.json", "utf8"));

const CATEGORIAS = {
  en: {
    render: "Render / DX11",
    rede: "Network / server",
    terreno: "Terrain / clutter",
    ia: "AI / infected",
    fisica: "Physics / collision",
    streaming: "Streaming / IO",
    script: "Script VM / gameplay",
    ui: "UI / HUD",
    som: "Sound / audio",
    outros: "Other",
  },
  ru: {
    render: "Рендер / DX11",
    rede: "Сеть / сервер",
    terreno: "Ландшафт / clutter",
    ia: "ИИ / заражённые",
    fisica: "Физика / коллизии",
    streaming: "Стриминг / IO",
    script: "Script VM / геймплей",
    ui: "UI / HUD",
    som: "Звук / аудио",
    outros: "Прочее",
  },
};

for (const locale of ["en", "ru"]) {
  const achados = JSON.parse(fs.readFileSync(`public/data/achados.${locale}.json`, "utf8"));
  const map = new Map(achados.map((a) => [a.id, a]));
  let traduzidos = 0;

  const saida = {
    ...bugs,
    categorias: bugs.categorias.map((c) => ({
      ...c,
      nome: CATEGORIAS[locale][c.slug] ?? c.nome,
    })),
    itens: bugs.itens.map((b) => {
      const a = map.get(b.id);
      if (!a) return b;
      traduzidos++;
      return {
        ...b,
        titulo: a.resumo,
        local: a.campos?.Local ?? b.local,
        campos: a.campos,
        texto: a.texto,
      };
    }),
  };

  const file = `public/data/bugs.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(saida, null, 2), "utf8");
  console.log(`${file}: ${saida.itens.length} itens (${traduzidos} traduzidos), ${fs.statSync(file).size} bytes`);
}
