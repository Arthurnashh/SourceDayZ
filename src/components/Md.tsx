import { Fragment, type ReactNode } from "react";

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang: string; code: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; text: string }
  | { t: "img"; alt: string; src: string }
  | { t: "hr" };

/** Renderizador de markdown proprio: titulos, paragrafos, listas, tabelas,
 *  blocos de codigo, citacao e regra horizontal. Sem dependencia externa. */
export function Md({ text }: { text: string }) {
  const blocks = parse(text);
  return (
    <div className="md">
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b)}</Fragment>
      ))}
    </div>
  );
}

function diffLineClass(line: string): string {
  if (
    line.startsWith("diff --git") ||
    line.startsWith("index ") ||
    line.startsWith("---") ||
    line.startsWith("+++")
  ) return "md-diff-meta";
  if (line.startsWith("@@")) return "md-diff-hunk";
  if (line.startsWith("+")) return "md-diff-add";
  if (line.startsWith("-")) return "md-diff-del";
  return "md-diff-ctx";
}

function renderBlock(b: Block): ReactNode {
  switch (b.t) {
    case "h": {
      const Tag = (`h${Math.min(6, b.level + 1)}`) as "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag className={`md-h md-h${b.level}`}>{inline(b.text)}</Tag>;
    }
    case "p":
      return <p className="md-p">{inline(b.text)}</p>;
    case "ul":
      return (
        <ul className="md-list">
          {b.items.map((it, k) => <li key={k}>{inline(it)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="md-list">
          {b.items.map((it, k) => <li key={k}>{inline(it)}</li>)}
        </ol>
      );
    case "code":
      return (
        <pre className={`md-code${b.lang === "diff" ? " md-code-diff" : ""}`}>
          {b.lang && <span className="md-lang">{b.lang}</span>}
          <code>
            {b.lang === "diff"
              ? b.code.split("\n").map((line, k) => (
                  <span key={k} className={`md-diff-line ${diffLineClass(line)}`}>
                    {line || "\u00a0"}
                  </span>
                ))
              : b.code}
          </code>
        </pre>
      );
    case "table":
      return (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>{b.head.map((h, k) => <th key={k}>{inline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, k) => (
                <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return <blockquote className="md-quote">{inline(b.text)}</blockquote>;
    case "img":
      return (
        <figure className="md-figure">
          <img src={b.src} alt={b.alt} loading="eager" />
          {b.alt && <figcaption>{b.alt}</figcaption>}
        </figure>
      );
    case "hr":
      return <hr className="md-hr" />;
    default:
      return null;
  }
}

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;

  const flushList = (items: string[], ordered: boolean) => {
    if (items.length) out.push(ordered ? { t: "ol", items } : { t: "ul", items });
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line.trim()) { i++; continue; }

    // cerca de codigo
    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // fecha
      out.push({ t: "code", lang, code: buf.join("\n") });
      continue;
    }

    // titulo
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push({ t: "h", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    // regra horizontal
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }

    // imagem: ![legenda](url)
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      out.push({ t: "img", alt: img[1].trim(), src: img[2].trim() });
      i++;
      continue;
    }

    // tabela: linha com | seguida de separador
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push({ t: "table", head, rows });
      continue;
    }

    // citacao
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push({ t: "quote", text: buf.join(" ").trim() });
      continue;
    }

    // listas
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
        // continuacao indentada
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
          items[items.length - 1] += " " + lines[i].trim();
          i++;
        }
      }
      flushList(items, false);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i])) {
          items[items.length - 1] += " " + lines[i].trim();
          i++;
        }
      }
      flushList(items, true);
      continue;
    }

    // paragrafo: agrega linhas ate vazio / estrutura
    const buf: string[] = [line.trim()];
    i++;
    while (i < lines.length) {
      const n = lines[i];
      if (!n.trim()) break;
      if (/^(#{1,6}\s|```|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(n)) break;
      if (/^\s*([-*_])\1{2,}\s*$/.test(n)) break;
      buf.push(n.trim());
      i++;
    }
    out.push({ t: "p", text: buf.join(" ") });
  }
  return out;
}

function splitRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (s[i] === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += s[i];
  }
  cells.push(cur.trim());
  return cells;
}

/** Inline: **negrito**, *italico*, `codigo`, [texto](url). */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      return <code key={i} className="inline-code">{p.slice(1, -1)}</code>;
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Remove a marcacao para previas de texto corrido. */
export function stripMd(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
