import { useState, type FormEvent } from "react";
import { USING_SUPABASE, loginAccount, registerAccount } from "../lib/accounts";
import { useLocale } from "../lib/i18n";
import { AUTH_COPY } from "../content/auth-i18n";

type Mode = "entrar" | "criar";

interface AuthPanelProps {
  initialMode?: Mode;
  onSuccess?: () => void;
  compact?: boolean;
}

export function AuthPanel({ initialMode = "entrar", onSuccess, compact = false }: AuthPanelProps) {
  const { locale } = useLocale();
  const copy = AUTH_COPY[locale];
  const [modo, setModo] = useState<Mode>(initialMode);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function trocarModo(next: Mode) {
    setModo(next);
    setErro(null);
    setAviso(null);
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setAviso(null);

    if (modo === "criar" && senha !== confirmar) {
      setErro(copy.passwordsMismatch);
      return;
    }
    if (modo === "criar" && !aceite) {
      setErro(USING_SUPABASE ? copy.consentRequiredOnline : copy.consentRequiredLocal);
      return;
    }

    setEnviando(true);
    try {
      const result =
        modo === "criar"
          ? await registerAccount({ nome, email, senha })
          : await loginAccount({ email, senha });

      if (!result.ok) {
        setErro(result.error);
        return;
      }

      if (result.needsConfirmation) {
        setModo("entrar");
        setSenha("");
        setConfirmar("");
        setAviso(copy.confirmationSent);
        return;
      }

      onSuccess?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`auth ${compact ? "auth-compact" : ""}`}>
      <div className="auth-head">
        <span className="sd-soon-pill">{copy.pill}</span>
        <h3 id="sd-login-title">{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </div>

      <div className="auth-tabs" role="tablist" aria-label={copy.tabsAria}>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "entrar"}
          className={modo === "entrar" ? "on" : ""}
          onClick={() => trocarModo("entrar")}
        >
          {copy.enter}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "criar"}
          className={modo === "criar" ? "on" : ""}
          onClick={() => trocarModo("criar")}
        >
          {copy.create}
        </button>
      </div>

      <form onSubmit={enviar} className="auth-form">
        {modo === "criar" && (
          <label className="sd-field">
            <span>{copy.name}</span>
            <input
              type="text"
              autoComplete="nickname"
              placeholder={copy.namePlaceholder}
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              maxLength={40}
              required
            />
          </label>
        )}

        <label className="sd-field">
          <span>{copy.email}</span>
          <input
            type="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="sd-field">
          <span>{copy.password}</span>
          <input
            type="password"
            autoComplete={modo === "criar" ? "new-password" : "current-password"}
            placeholder={copy.passwordPlaceholder}
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {modo === "criar" && (
          <>
            <label className="sd-field">
              <span>{copy.confirm}</span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={copy.confirmPlaceholder}
                value={confirmar}
                onChange={(event) => setConfirmar(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label className="auth-check">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(event) => setAceite(event.target.checked)}
              />
              <span>{USING_SUPABASE ? copy.consentOnline : copy.consentLocal}</span>
            </label>
          </>
        )}

        {aviso && <p className="auth-success" role="status">{aviso}</p>}
        {erro && <p className="auth-error" role="alert">{erro}</p>}

        <button className="sd-btn primary sd-btn-block" type="submit" disabled={enviando}>
          {enviando
            ? copy.wait
            : modo === "criar"
              ? USING_SUPABASE
                ? copy.create
                : copy.createLocal
              : copy.enter}
        </button>
      </form>

      <p className="sd-modal-foot">{USING_SUPABASE ? copy.footerOnline : copy.footerLocal}</p>
    </div>
  );
}
