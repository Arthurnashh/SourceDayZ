import { useEffect, useState, type FormEvent } from "react";
import { saveAdminOrigins, setAdminDevMode, type AdminSettings } from "../../lib/admin";
import { SectionHead, type AdminNotice } from "./shared";

interface Props {
  settings: AdminSettings | null;
  onSaved: (settings: AdminSettings) => void;
  onNotice: (notice: AdminNotice) => void;
}

export function AdminSettings({ settings, onSaved, onNotice }: Props) {
  const [origins, setOrigins] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setOrigins(settings.site.allowed_origins.join("\n"));
    setDevMode(settings.site.dev_mode);
  }, [settings?.site.allowed_origins, settings?.site.dev_mode]);

  if (!settings) {
    return (
      <div className="adm-page">
        <SectionHead title="Ajustes" subtitle="Carregando configuração…" />
      </div>
    );
  }

  const currentSettings = settings;

  async function saveOrigins(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const list = origins
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    setBusy("origins");
    const result = await saveAdminOrigins(list);
    setBusy(null);
    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }
    onSaved({
      ...currentSettings,
      site: { ...currentSettings.site, allowed_origins: result.data.allowed_origins },
    });
    onNotice({ tone: "ok", text: "Origens permitidas atualizadas." });
  }

  async function toggleDevMode() {
    const next = !devMode;
    const message = next
      ? "Ativar o modo de teste para todos os visitantes? Isso libera ferramentas de simulação no site."
      : "Desligar o modo de teste? As ferramentas de simulação somem para os visitantes.";
    if (!window.confirm(message)) return;

    setBusy("dev");
    const result = await setAdminDevMode(next);
    setBusy(null);
    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }
    setDevMode(result.data.dev_mode);
    onSaved({
      ...currentSettings,
      site: { ...currentSettings.site, dev_mode: result.data.dev_mode },
    });
    onNotice({
      tone: "ok",
      text: result.data.dev_mode ? "Modo de teste ativado." : "Modo de teste desligado.",
    });
  }

  return (
    <div className="adm-page">
      <SectionHead
        title="Ajustes"
        subtitle="Origens do Steam OpenID e ferramentas de teste do site."
      />

      <section className="adm-card">
        <div className="adm-card-head">
          <div>
            <h2>Modo de teste</h2>
            <p>
              Libera simulação de pagamento e ferramentas de desenvolvimento para visitantes.
              Em produção, deixe desligado.
            </p>
          </div>
        </div>

        <div className="adm-admin-toggle">
          <div>
            <strong>{devMode ? "Ligado" : "Desligado"}</strong>
            <p>
              Administradores continuam vendo as ferramentas mesmo com o modo desligado.
            </p>
          </div>
          <button
            className={`sd-btn ${devMode ? "ghost" : "primary"} adm-btn-sm`}
            type="button"
            disabled={busy === "dev"}
            onClick={toggleDevMode}
          >
            {busy === "dev" ? "…" : devMode ? "Desligar modo de teste" : "Ativar modo de teste"}
          </button>
        </div>
      </section>

      <form className="adm-card adm-form-wide" onSubmit={saveOrigins}>
        <div className="adm-card-head">
          <div>
            <h2>Origens permitidas</h2>
            <p>
              Endereços que podem iniciar o vínculo com a Steam. Uma origem por linha, com
              protocolo e porta.
            </p>
          </div>
        </div>

        <label className="sd-field">
          <span>Origens</span>
          <textarea
            className="adm-input adm-textarea"
            rows={6}
            value={origins}
            onChange={(event) => setOrigins(event.target.value)}
            placeholder={"http://127.0.0.1:5173\nhttps://sourcedayz.com"}
            spellCheck={false}
          />
        </label>

        <p className="adm-hint">
          Ao publicar em um domínio próprio, acrescente a origem aqui e atualize também as
          Redirect URLs do Auth no painel do Supabase.
        </p>

        <div className="adm-form-foot">
          <button className="sd-btn primary" type="submit" disabled={busy === "origins"}>
            {busy === "origins" ? "Salvando…" : "Salvar origens"}
          </button>
          <small>Máximo de 10 origens. O Steam OpenID recusa qualquer origem fora desta lista.</small>
        </div>
      </form>
    </div>
  );
}
