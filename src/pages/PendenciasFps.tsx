import { Md } from "../components/Md";
import { useDocsT } from "../content/docs-i18n";
import { useMd } from "../lib/content";

export function PendenciasFps() {
  const { t } = useDocsT();
  const fpsMd = useMd("fps-drop");
  const fpsCodigo = useMd("fps-codigo");

  return (
    <div className="fps-tab">
      <div className="fps-priority">
        <div className="fps-priority-top">
          <span className="badge red">{t("pending.fps.badge")}</span>
          <span className="fps-priority-kicker">{t("pending.fps.kicker")}</span>
        </div>
        <p className="fps-priority-lead">{t("pending.fps.lead")}</p>
        <p className="fps-priority-hint">{t("pending.fps.hint")}</p>
        <p className="fps-priority-hint">
          <strong>{t("pending.fps.code")}:</strong>{" "}
          <button
            type="button"
            className="fps-code-jump"
            onClick={() => document.getElementById("codigo-antes-e-depois")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            {t("pending.fps.code")}
          </button>{" "}
          {t("pending.fps.codeHint")}
        </p>
        <div className="fps-priority-grid">
          <div><small>{t("pending.fps.status")}</small><strong>{t("pending.fps.statusValue")}</strong></div>
          <div><small>{t("pending.fps.test")}</small><strong>{t("pending.fps.testValue")}</strong></div>
          <div><small>{t("pending.fps.fps")}</small><strong>{t("pending.fps.fpsValue")}</strong></div>
          <div><small>{t("pending.fps.gain")}</small><strong>{t("pending.fps.gainValue")}</strong></div>
        </div>
      </div>
      <Md text={fpsMd} />
      <div id="codigo-antes-e-depois" className="fps-code-section">
        <Md text={fpsCodigo} />
      </div>
    </div>
  );
}
