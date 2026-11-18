import fs from "node:fs";
import path from "node:path";

/** Prepara o lote único de tradução do board (itens + updates). */
const OUT = process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "board-traducao");
const board = JSON.parse(fs.readFileSync("public/data/board.json", "utf8"));
fs.mkdirSync(OUT, { recursive: true });

const itens = board.items.map((i) => ({
  id: i.id,
  titulo: i.titulo,
  descricao: i.descricao,
  area: i.area,
  responsavel: i.responsavel ?? "",
  etiquetas: i.etiquetas ?? [],
  passos: i.passos ?? "",
  desfecho: i.desfecho
    ? {
        oQueEra: i.desfecho.oQueEra,
        comoCorrigiu: i.desfecho.comoCorrigiu,
        oQueUsou: i.desfecho.oQueUsou,
      }
    : null,
}));

const updates = board.updates.map((u) => ({
  id: u.id,
  titulo: u.titulo,
  resumo: u.resumo,
  detalhes: u.detalhes ?? "",
  autor: u.autor ?? "",
}));

fs.writeFileSync(
  path.join(OUT, "lote-01.json"),
  JSON.stringify({ lote: "01", itens, updates }, null, 2),
  "utf8"
);

const chars =
  JSON.stringify(itens).length + JSON.stringify(updates).length;
console.log(`lote-01.json: ${itens.length} itens, ${updates.length} updates, ${chars} bytes`);
