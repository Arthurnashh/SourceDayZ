import { Fragment, type ReactNode } from "react";

/** Renderizador minimo de markdown: **negrito**, `codigo`, listas e paragrafos.
 *  Linhas consecutivas viram um paragrafo; linhas indentadas continuam o item. */
export function Markdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  let para: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`l${blocks.length}`} className="md-list">
        {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
      </Tag>
    );
    list = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    blocks.push(<p key={`p${blocks.length}`} className="md-p">{inline(para.join(" "))}</p>);
    para = [];
  };
  const flush = () => { flushPara(); flushList(); };

  lines.forEach((raw) => {
    const line = raw.replace(/\s+$/, "");
    const indent = /^\s/.test(raw);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      flushPara();
      if (ordered) flushList();
      ordered = false;
      list.push(bullet[1]);
    } else if (num) {
      flushPara();
      if (!ordered) flushList();
      ordered = true;
      list.push(num[1]);
    } else if (!line.trim()) {
      flush();
    } else if (indent && list.length) {
      list[list.length - 1] += " " + line.trim();
    } else if (indent && para.length) {
      para.push(line.trim());
    } else {
      flushList();
      para.push(line.trim());
    }
  });
  flush();
  return <div className="md">{blocks}</div>;
}

/** Remove a marcacao para usar em previas de texto corrido. */
export function stripMd(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return <code key={i} className="inline-code">{p.slice(1, -1)}</code>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}
