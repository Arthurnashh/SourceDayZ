import { Md } from "../components/Md";
import { navigate } from "../lib/router";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

export function Motor() {
  const { t } = useDocsT();
  const motorMd = useMd("motor");

  const STEPS = [
    { id: "sim", nome: "World::Simulate", linha: "world.cpp:11795", desc: t("engine.step.sim") },
    { id: "prep", nome: "PrepareDraw", linha: "world.cpp:7926", desc: t("engine.step.prep") },
    { id: "scene", nome: "Scene::Draw*", linha: "scene.cpp:11186", desc: t("engine.step.scene") },
    { id: "obj", nome: "Object::Draw", linha: "object.cpp:1968", desc: t("engine.step.obj") },
    { id: "gpu", nome: "EngineDD9 / DX11", linha: "d3d9 · d3d11", desc: t("engine.step.gpu") },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">{t("engine.kicker")}</span>
          <h1>{t("engine.title")}</h1>
          <p>{t("engine.lead")}</p>
        </div>
        <button className="btn primary" onClick={() => navigate("diagrama")}>{t("engine.openDiagram")}</button>
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
