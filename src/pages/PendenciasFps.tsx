import fpsMd from "../content/fps-drop.md?raw";
import fpsCodigo from "../content/fps-codigo.md?raw";
import { Md } from "../components/Md";

export function PendenciasFps() {
  return (
    <div className="fps-tab">
      <div className="fps-priority">
        <div className="fps-priority-top">
          <span className="badge red">PRIORIDADE ALTA</span>
          <span className="fps-priority-kicker">frente dedicada · engine 0.45 · Release</span>
        </div>
        <p className="fps-priority-lead">
          A F2 trouxe personagem e casas/árvores de volta, mas <strong>a grama aparece só de vez em
          quando</strong> e <strong>a sombra do personagem fica nas costas</strong>. O FPS ficou
          baixo. A frente está pausada; o roteiro para retomar está em <strong>Ponto de retomada</strong>.
        </p>
        <p className="fps-priority-hint">
          <strong>Pista dos devs:</strong> “processamento de objetos antes da renderização — tudo
          dentro de <code>Scene::DrawObject***</code>, preparação de materiais, polígonos e outras
          merdas.” É essa frase que guia todos os cortes A–F e a correção F2.
        </p>
        <p className="fps-priority-hint">
          <strong>Código antes/depois:</strong> todos os patches, arquivo por arquivo, estão em{" "}
          <button
            type="button"
            className="fps-code-jump"
            onClick={() => document.getElementById("codigo-antes-e-depois")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Código antes e depois (tipo git)
          </button>
          , no fim desta aba, com linhas <code>-</code>/<code>+</code> e o <code>.diff</code> para baixar.
        </p>
        <div className="fps-priority-grid">
          <div><small>status</small><strong>pausada · retomar em A–E</strong></div>
          <div><small>teste F2</small><strong>personagem/casas ok · grama/sombra falham</strong></div>
          <div><small>FPS F2</small><strong>baixo · sem ganho</strong></div>
          <div><small>ganho declarado</small><strong>nenhum</strong></div>
        </div>
      </div>
      <Md text={fpsMd} />
      <div id="codigo-antes-e-depois" className="fps-code-section">
        <Md text={fpsCodigo} />
      </div>
    </div>
  );
}
