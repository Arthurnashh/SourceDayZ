import { useState } from "react";
import { useDocsT } from "../content/docs-i18n";
import { LAYER_TEXT, NODE_TEXT, pick } from "../content/diagram-i18n";

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  sub: string;
  grupo: "entrada" | "frame" | "desenho" | "saida";
  detalhe: string;
  evidencia: string;
}

const NODES_BASE: Node[] = [
  {
    id: "winmain", x: 20, y: 40, w: 180, h: 62, titulo: "WinMain", sub: "main.cpp",
    grupo: "entrada",
    detalhe: "Entrada do processo. Cria a janela, inicializa engine, input e loop principal.",
    evidencia: "lib/main.cpp — F-001 (parcial)",
  },
  {
    id: "loop", x: 20, y: 140, w: 180, h: 62, titulo: "Loop principal", sub: "mensagens + frame",
    grupo: "entrada",
    detalhe: "Bombeia mensagens do Windows e chama a simulação de mundo uma vez por frame.",
    evidencia: "lib/main.cpp + World::Simulate",
  },
  {
    id: "sim", x: 250, y: 40, w: 400, h: 62, titulo: "World::Simulate", sub: "world.cpp:11795 · 1.235 linhas",
    grupo: "frame",
    detalhe: "Simula UM frame do mundo. Recebe dois bool& de saída: desenhar cena e desenhar HUD. É o escopo-raiz do perfil (wSimu).",
    evidencia: "world.cpp:11795 (F-002)",
  },
  {
    id: "time", x: 250, y: 120, w: 195, h: 52, titulo: "TimeManager::Frame", sub: "orçamento do frame",
    grupo: "frame",
    detalhe: "Recebe estimateReserve e distribui a folga entre subsistemas. restFrame = 0.045f (~22 FPS) limita a premissa.",
    evidencia: "world.cpp:11894-11950 · H-01",
  },
  {
    id: "script", x: 455, y: 120, w: 195, h: 52, titulo: "SimulateScripts", sub: "SQF + Enforce",
    grupo: "frame",
    detalhe: "Roda antes do desenho: script pode alterar o mundo que será desenhado. SQF coopera com 100 linhas/frame.",
    evidencia: "world.cpp:12213 · lib/scripts.cpp:53-74",
  },
  {
    id: "veh", x: 250, y: 182, w: 195, h: 52, titulo: "SimulateAllVehicles", sub: "física de veículos",
    grupo: "frame",
    detalhe: "Atualiza veículos e física associada dentro do mesmo orçamento de frame.",
    evidencia: "world.cpp:12147",
  },
  {
    id: "land", x: 455, y: 182, w: 195, h: 52, titulo: "SimulateLandscape", sub: "terreno",
    grupo: "frame",
    detalhe: "Simula o terreno antes de PrepareDraw — há potencial de varredura duplicada de grid.",
    evidencia: "world.cpp:12364",
  },
  {
    id: "prep", x: 250, y: 254, w: 400, h: 56, titulo: "World::PrepareDraw", sub: "world.cpp:7926 · 807 linhas",
    grupo: "frame",
    detalhe: "Decide o que será desenhado: três distâncias (objeto, sombra, máxima), retângulo de grid rotation-invariant e lock incremental do _objAroundCam.",
    evidencia: "world.cpp:7926 · F-003 · H-02",
  },
  {
    id: "scene", x: 250, y: 330, w: 400, h: 56, titulo: "Scene::Draw*", sub: "scene.cpp · SortObject",
    grupo: "desenho",
    detalhe: "Lista ordenada de objetos e lotes instanciados de até 512 (maxInstancingChain). GetLandShadowSmooth é calculado por instância.",
    evidencia: "scene.cpp:6108 · F-006 · H-04",
  },
  {
    id: "obj", x: 250, y: 406, w: 400, h: 56, titulo: "Object::Draw", sub: "object.cpp:1968 · 7 operações",
    grupo: "desenho",
    detalhe: "Locks de geometria/VB, AnimationContext, Animate(), SelectAggLights(), PrepareTextures(), OptimizeLevelRendering() e shadowCache.Split(). 6 de 7 por objeto e por frame.",
    evidencia: "object.cpp:1968 · F-005",
  },
  {
    id: "d3d9", x: 700, y: 330, w: 150, h: 52, titulo: "EngineDD9", sub: "51.549 linhas",
    grupo: "saida",
    detalhe: "Backend legado completo: estados, shaders, texturas, instancing emulado e todos os passes.",
    evidencia: "lib/d3d9/ — 42 arquivos, 1.985 funções",
  },
  {
    id: "d3d11", x: 700, y: 406, w: 150, h: 52, titulo: "DX11", sub: "1.211 linhas",
    grupo: "saida",
    detalhe: "Backend novo parcial: device, TL, textura, texto e mesh. Sem sombra, terreno, clutter, pós-processo, SRGB ou MSAA.",
    evidencia: "lib/d3d11/ — 24 arquivos, 117 funções",
  },
  {
    id: "gpu", x: 700, y: 482, w: 150, h: 52, titulo: "GPU / Present", sub: "swap chain",
    grupo: "saida",
    detalhe: "Apresentação do frame. Se Present domina, o problema é GPU; se obDrw domina, é CPU por objeto.",
    evidencia: "Dx11Device.cpp · GPUView / PIX",
  },
];

const EDGES: [string, string][] = [
  ["winmain", "loop"],
  ["loop", "sim"],
  ["sim", "time"],
  ["sim", "script"],
  ["sim", "veh"],
  ["sim", "land"],
  ["sim", "prep"],
  ["prep", "scene"],
  ["scene", "obj"],
  ["obj", "d3d9"],
  ["obj", "d3d11"],
  ["d3d9", "gpu"],
  ["d3d11", "gpu"],
];

const CORES: Record<Node["grupo"], string> = {
  entrada: "#5ec8f5",
  frame: "#b9f24d",
  desenho: "#b08cff",
  saida: "#f2b544",
};

const CAMADAS_BASE = [
  { base: "Gameplay / Script", desc: "Enforce VM + SQF, missões, ações e UI de jogo", cor: "#5ec8f5", ev: "Enfusion/src/script · lib/scripts.cpp" },
  { base: "IA / Física", desc: "invasores, infectados, veículos e Bullet 2.76", cor: "#b08cff", ev: "zombie.cpp · Bullet 2.76" },
  { base: "Terreno / Streaming", desc: "landscape, clutter, bancos de arquivo e texturas", cor: "#b9f24d", ev: "landClutter.cpp · networkClient.cpp" },
  { base: "Cena / Visibilidade", desc: "PrepareDraw, SortObject e instancing de 512", cor: "#f2b544", ev: "world.cpp:7926 · scene.cpp:6108" },
  { base: "Render / Backends", desc: "Object::Draw, EngineDD9 e Dx11EngineCore", cor: "#ff6f6f", ev: "object.cpp:1968 · lib/d3d9 · lib/d3d11" },
  { base: "GPU", desc: "estado, shader, draw call e present", cor: "#8ba69c", ev: "Dx11Device.cpp · PIX / RenderDoc" },
];

export function Diagrama() {
  const { t, locale } = useDocsT();
  const [selId, setSelId] = useState("sim");
  const [camada, setCamada] = useState(0);
  const [girar, setGirar] = useState(false);

  const NODES = NODES_BASE.map((n) => ({
    ...n,
    sub: pick(NODE_TEXT[n.id].sub, locale),
    detalhe: pick(NODE_TEXT[n.id].detalhe, locale),
  }));
  const CAMADAS = CAMADAS_BASE.map((c) => ({
    ...c,
    nome: pick(LAYER_TEXT[c.base].nome, locale),
    desc: pick(LAYER_TEXT[c.base].desc, locale),
  }));
  const sel = NODES.find((n) => n.id === selId) ?? NODES[0];
  const setSel = (n: Node) => setSelId(n.id);
  const byId = (id: string) => NODES.find((n) => n.id === id)!;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("diagram.kicker")}</span>
          <h1>{t("diagram.title")}</h1>
          <p>{t("diagram.lead")}</p>
        </div>
      </div>

      <section className="panel diagram-panel">
        <div className="diagram-wrap">
          <svg viewBox="0 0 880 560" className="engine-svg" role="img" aria-label={t("diagram.aria")}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2b4339" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {EDGES.map(([a, b]) => {
              const A = byId(a);
              const B = byId(b);
              const x1 = A.x + A.w / 2;
              const y1 = A.y + A.h;
              const x2 = B.x + B.w / 2;
              const y2 = B.y;
              const d = Math.abs(x2 - x1) < 1
                ? `M ${x1} ${y1} L ${x2} ${y2}`
                : `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
              return <path key={`${a}-${b}`} d={d} className="edge" markerEnd="url(#arrow)" />;
            })}

            {NODES.map((n) => {
              const ativo = sel.id === n.id;
              const cor = CORES[n.grupo];
              return (
                <g
                  key={n.id}
                  className={`node ${ativo ? "on" : ""}`}
                  onClick={() => setSel(n)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === "Enter") setSel(n); }}
                >
                  <rect
                    x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
                    fill={ativo ? `${cor}22` : "#0f1714"}
                    stroke={ativo ? cor : "#263a33"}
                    strokeWidth={ativo ? 1.8 : 1}
                    filter={ativo ? "url(#glow)" : undefined}
                  />
                  <text x={n.x + 14} y={n.y + 25} className="node-title" fill={ativo ? cor : "#e7f0ec"}>
                    {n.titulo}
                  </text>
                  <text x={n.x + 14} y={n.y + 43} className="node-sub" fill="#8ba69c">
                    {n.sub}
                  </text>
                </g>
              );
            })}

            <text x="20" y="24" className="col-label">{t("diagram.input")}</text>
            <text x="250" y="24" className="col-label">{t("diagram.frame")}</text>
            <text x="700" y="24" className="col-label">{t("diagram.output")}</text>
          </svg>
        </div>

        <aside className="diagram-info">
          <span className={`dot ${sel.grupo}`} />
          <h3>{sel.titulo}</h3>
          <p>{sel.detalhe}</p>
          <code>{sel.evidencia}</code>
          <div className="diagram-legend">
            <span><i className="lg entrada" /> {t("diagram.legend.input")}</span>
            <span><i className="lg frame" /> {t("diagram.legend.frame")}</span>
            <span><i className="lg desenho" /> {t("diagram.legend.draw")}</span>
            <span><i className="lg saida" /> {t("diagram.legend.output")}</span>
          </div>
        </aside>
      </section>

      <section className="panel stack-panel">
        <div className="stack-head">
          <div>
            <span className="kicker">3D</span>
            <h2>{t("diagram.layers")}</h2>
          </div>
          <button className="btn" onClick={() => setGirar((v) => !v)}>
            {girar ? t("diagram.pause") : t("diagram.rotate")}
          </button>
        </div>

        <div className="stack-body">
          <div className="tower-scene">
            <div className={`tower ${girar ? "spin" : ""}`}>
              {CAMADAS.map((c, i) => (
                <button
                  key={c.nome}
                  className={`layer ${camada === i ? "on" : ""}`}
                  style={{
                    borderColor: c.cor,
                    boxShadow: `0 0 24px ${c.cor}44, inset 0 0 30px ${c.cor}11`,
                    ["--i" as string]: i,
                  }}
                  onClick={() => setCamada(i)}
                >
                  <span className="layer-index">{String(i + 1).padStart(2, "0")}</span>
                  <strong>{c.nome}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="stack-info">
            <span className="chip" style={{ color: CAMADAS[camada].cor, borderColor: CAMADAS[camada].cor }}>
              {t("diagram.layerOf", { n: camada + 1, total: CAMADAS.length })}
            </span>
            <h3>{CAMADAS[camada].nome}</h3>
            <p>{CAMADAS[camada].desc}</p>
            <code>{CAMADAS[camada].ev}</code>
            <div className="layer-list">
              {CAMADAS.map((c, i) => (
                <button key={c.nome} className={i === camada ? "on" : ""} onClick={() => setCamada(i)}>
                  <i style={{ background: c.cor }} />
                  {c.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
