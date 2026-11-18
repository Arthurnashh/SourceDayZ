import motorMd from "../content/motor.md?raw";
import { Md } from "../components/Md";
import { navigate } from "../lib/router";

const STEPS = [
  { id: "sim", nome: "World::Simulate", linha: "world.cpp:11795", desc: "um frame de mundo: caches, GC, veículos, script, terreno, UI, desenho" },
  { id: "prep", nome: "PrepareDraw", linha: "world.cpp:7926", desc: "visibilidade, distâncias e o retângulo de lock do streaming" },
  { id: "scene", nome: "Scene::Draw*", linha: "scene.cpp:11186", desc: "lista de SortObject e lotes de instancing de até 512" },
  { id: "obj", nome: "Object::Draw", linha: "object.cpp:1968", desc: "locks, animação, luzes, texturas e sombra por objeto" },
  { id: "gpu", nome: "EngineDD9 / DX11", linha: "d3d9 · d3d11", desc: "estado, shader e draw call — 51.549 vs 1.211 linhas" },
];

export function Motor() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">arquitetura do motor</span>
          <h1>Motor</h1>
          <p>
            Como o Real Virtuality / Enfusion 0.45 funciona: ordem real do frame, orçamento
            de tempo, modelo de threads, caminho do objeto ao pixel e os dois backends gráficos.
          </p>
        </div>
        <button className="btn primary" onClick={() => navigate("diagrama")}>Abrir diagrama 3D →</button>
      </div>

      <div className="motor-flow">
        {STEPS.map((s, i) => (
          <div className="motor-step" key={s.id}>
            <span className="motor-num">{String(i + 1).padStart(2, "0")}</span>
            <strong>{s.nome}</strong>
            <code>{s.linha}</code>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <section className="panel article">
        <Md text={motorMd} />
      </section>
    </div>
  );
}
