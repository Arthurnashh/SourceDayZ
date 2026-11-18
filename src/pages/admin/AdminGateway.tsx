import { useEffect, useState, type FormEvent } from "react";
import { formatDateTime } from "../../lib/accounts";
import {
  saveAdminGateway,
  type AdminSettings,
  type SaveGatewayInput,
} from "../../lib/admin";
import { SectionHead, type AdminNotice } from "./shared";

interface Props {
  settings: AdminSettings | null;
  onSaved: (settings: AdminSettings) => void;
  onNotice: (notice: AdminNotice) => void;
}

const PROVIDERS: Array<[SaveGatewayInput["provider"], string]> = [
  ["manual", "Manual (conferência no painel)"],
  ["mercadopago", "Mercado Pago"],
  ["stripe", "Stripe"],
];

function emptyForm(): SaveGatewayInput {
  return {
    provider: "manual",
    enabled: false,
    environment: "test",
    publicKey: "",
    accessToken: "",
    webhookSecret: "",
    clearAccessToken: false,
    clearWebhookSecret: false,
  };
}

export function AdminGateway({ settings, onSaved, onNotice }: Props) {
  const [form, setForm] = useState<SaveGatewayInput>(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      provider: settings.gateway.provider,
      enabled: settings.gateway.enabled,
      environment: settings.gateway.environment,
      publicKey: settings.gateway.public_key,
      accessToken: "",
      webhookSecret: "",
      clearAccessToken: false,
      clearWebhookSecret: false,
    });
  }, [
    settings?.gateway.provider,
    settings?.gateway.enabled,
    settings?.gateway.environment,
    settings?.gateway.public_key,
    settings?.gateway.has_access_token,
    settings?.gateway.has_webhook_secret,
    settings?.gateway.updated_at,
  ]);

  if (!settings) {
    return (
      <div className="adm-page">
        <SectionHead title="Gateway" subtitle="Carregando configuração…" />
      </div>
    );
  }

  const gateway = settings.gateway;
  const tokenReady = gateway.has_access_token || form.accessToken.trim().length > 0;
  const statusLabel =
    gateway.provider === "manual"
      ? "Modo manual"
      : gateway.enabled && tokenReady
        ? `Ativo · ${gateway.provider}`
        : gateway.enabled
          ? "Ativo, mas sem token"
          : "Pausado";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await saveAdminGateway(form);
    setBusy(false);

    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }

    onSaved(result.data);
    onNotice({ tone: "ok", text: "Configuração do gateway salva." });
  }

  return (
    <div className="adm-page">
      <SectionHead
        title="Gateway"
        subtitle="Credenciais e modo de cobrança do acesso mensal."
      />

      <div className="adm-gateway-status">
        <div className={`adm-gateway-dot ${gateway.enabled ? "on" : ""}`} />
        <div>
          <strong>{statusLabel}</strong>
          <span>
            {gateway.provider === "manual"
              ? "Os pedidos são liberados manualmente na aba Pedidos."
              : `${gateway.environment === "production" ? "Produção" : "Testes"} · ${
                  gateway.has_access_token ? "token salvo" : "sem token"
                } · ${gateway.has_webhook_secret ? "webhook salvo" : "sem segredo de webhook"}`}
          </span>
        </div>
        <small>
          {gateway.updated_at ? `atualizado ${formatDateTime(gateway.updated_at)}` : "nunca configurado"}
        </small>
      </div>

      <div className="adm-note warn">
        <strong>Cobrança automática ainda não publicada</strong>
        <span>
          As credenciais ficam guardadas no banco e não voltam para o navegador. O checkout e o
          webhook do provedor entram numa próxima etapa. Até lá, use o modo manual para liberar
          os pedidos depois de conferir o pagamento.
        </span>
      </div>

      <form className="adm-card adm-form-wide" onSubmit={save}>
        <div className="adm-form-grid">
          <label className="sd-field">
            <span>Provedor</span>
            <select
              className="adm-input"
              value={form.provider}
              onChange={(event) =>
                setForm({ ...form, provider: event.target.value as SaveGatewayInput["provider"] })
              }
            >
              {PROVIDERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="sd-field">
            <span>Ambiente</span>
            <select
              className="adm-input"
              value={form.environment}
              onChange={(event) =>
                setForm({
                  ...form,
                  environment: event.target.value as SaveGatewayInput["environment"],
                })
              }
            >
              <option value="test">Testes / sandbox</option>
              <option value="production">Produção</option>
            </select>
          </label>
        </div>

        <label className="adm-switch">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          <span>
            <strong>Ativar gateway</strong>
            <small>Quando ativo, o provedor escolhido passa a ser o modo oficial do site.</small>
          </span>
        </label>

        {form.provider !== "manual" && (
          <>
            <div className="adm-form-grid">
              <label className="sd-field">
                <span>Chave pública / publishable key</span>
                <input
                  className="adm-input"
                  value={form.publicKey}
                  onChange={(event) => setForm({ ...form, publicKey: event.target.value })}
                  placeholder={
                    form.provider === "stripe" ? "pk_test_…" : "APP_USR-… / chave pública"
                  }
                  maxLength={500}
                />
              </label>

              <label className="sd-field">
                <span>Token de acesso / secret key</span>
                <input
                  className="adm-input"
                  type="password"
                  value={form.accessToken}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      accessToken: event.target.value,
                      clearAccessToken: false,
                    })
                  }
                  placeholder={gateway.has_access_token ? "•••••••• (já salvo)" : "cole o token"}
                  autoComplete="new-password"
                  maxLength={4000}
                />
              </label>
            </div>

            <label className="sd-field">
              <span>Segredo do webhook</span>
              <input
                className="adm-input"
                type="password"
                value={form.webhookSecret}
                onChange={(event) =>
                  setForm({
                    ...form,
                    webhookSecret: event.target.value,
                    clearWebhookSecret: false,
                  })
                }
                placeholder={gateway.has_webhook_secret ? "•••••••• (já salvo)" : "opcional nesta etapa"}
                autoComplete="new-password"
                maxLength={1000}
              />
            </label>

            <div className="adm-checks">
              <label>
                <input
                  type="checkbox"
                  checked={form.clearAccessToken}
                  onChange={(event) =>
                    setForm({ ...form, clearAccessToken: event.target.checked })
                  }
                />
                Apagar o token salvo
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.clearWebhookSecret}
                  onChange={(event) =>
                    setForm({ ...form, clearWebhookSecret: event.target.checked })
                  }
                />
                Apagar o segredo do webhook
              </label>
            </div>
          </>
        )}

        <div className="adm-form-foot">
          <button className="sd-btn primary" type="submit" disabled={busy}>
            {busy ? "Salvando…" : "Salvar configuração"}
          </button>
          <small>
            O token e o segredo nunca são devolvidos ao navegador. Só administradores leem o
            estado “configurado”.
          </small>
        </div>
      </form>
    </div>
  );
}
