const texto = "A engine cria o dispositivo Direct3D 11 e o contexto imediato. O caminho quente é `lib/d3d11/engdd11.cpp:412`.";

async function google(q, sl, tl) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j[0].map((p) => p[0]).join("");
}

for (const tl of ["en", "ru"]) {
  try {
    console.log(tl, "=>", await google(texto, "pt", tl));
  } catch (e) {
    console.log(tl, "ERRO", e.message);
  }
}
