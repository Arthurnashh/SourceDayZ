import fs from "node:fs";
import path from "node:path";

/** Junta a tradução do board. */
const DIR = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "board-traducao");
const board = JSON.parse(fs.readFileSync("public/data/board.json", "utf8"));

for (const locale of ["en", "ru"]) {
  const file = path.join(DIR, `lote-01.${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const itens = new Map(data.itens.map((i) => [i.id, i]));
  const updates = new Map(data.updates.map((u) => [u.id, u]));

  const saida = {
    ...board,
    items: board.items.map((i) => {
      const tr = itens.get(i.id);
      if (!tr) return i;
      return {
        ...i,
        titulo: tr.titulo,
        descricao: tr.descricao,
        area: tr.area,
        responsavel: tr.responsavel,
        etiquetas: tr.etiquetas,
        passos: tr.passos || undefined,
        desfecho: i.desfecho
          ? {
              ...i.desfecho,
              oQueEra: tr.desfecho.oQueEra,
              comoCorrigiu: tr.desfecho.comoCorrigiu,
              oQueUsou: tr.desfecho.oQueUsou,
            }
          : undefined,
      };
    }),
    updates: board.updates.map((u) => {
      const tr = updates.get(u.id);
      if (!tr) return u;
      return {
        ...u,
        titulo: tr.titulo,
        resumo: tr.resumo,
        detalhes: tr.detalhes || undefined,
        autor: tr.autor,
      };
    }),
  };

  const out = `public/data/board.${locale}.json`;
  fs.writeFileSync(out, JSON.stringify(saida, null, 2), "utf8");
  console.log(`${out}: ${saida.items.length} itens, ${saida.updates.length} updates, ${fs.statSync(out).size} bytes`);
}
