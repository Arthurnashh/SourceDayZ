const texto = `### 4.1 Pipeline de render

O **pipeline** usa \`ID3D11DeviceContext\` e o arquivo \`lib/d3d11/engdd11.cpp:412\` como referência.

| Etapa | Chamada | Custo |
|---|---|---|
| Limpeza | \`ClearRenderTargetView\` | baixo |
| Desenho | \`DrawIndexed\` | alto |

ZXQF0ZXQ

> Regra: nada entra sem evidência. Ver \`D:\\SOURCEDAYZS!!\\tools\\scan_source.py\`.
`;

function proteger(md) {
  const blocos = [];
  let out = md.replace(/```[\s\S]*?```/g, (m) => {
    blocos.push(m);
    return `ZXQF${blocos.length - 1}ZXQ`;
  });
  const inlines = [];
  out = out.replace(/`[^`\n]+`/g, (m) => {
    inlines.push(m);
    return `ZXQI${inlines.length - 1}ZXQ`;
  });
  return { out, blocos, inlines };
}

async function google(q, sl, tl) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j[0].map((p) => p[0]).join("");
}

function restaurar(t, blocos, inlines) {
  return t
    .replace(/\s*ZXQF\s*(\d+)\s*ZXQ\s*/gi, (_, n) => `\n${blocos[Number(n)]}\n`)
    .replace(/\s*ZXQI\s*(\d+)\s*ZXQ\s*/gi, (_, n) => inlines[Number(n)]);
}

for (const tl of ["en", "ru"]) {
  const { out, blocos, inlines } = proteger(texto);
  const tr = await google(out, "pt", tl);
  console.log(`\n===== ${tl} =====\n${restaurar(tr, blocos, inlines)}`);
}
