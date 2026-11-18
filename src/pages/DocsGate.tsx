import { AuthPanel } from "../components/AuthPanel";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { DOCS_GATE_COPY } from "../content/docs-gate-i18n";
import { logoutAccount, type Account } from "../lib/accounts";
import { useLocale } from "../lib/i18n";
import { navigate } from "../lib/router";

interface Props {
  mode: "loading" | "login" | "denied";
  account?: Account | null;
}

export function DocsGate({ mode, account }: Props) {
  const { locale } = useLocale();
  const copy = DOCS_GATE_COPY[locale];

  return (
    <div className="sd acc">
      <header className="acc-top acc-top-gate">
        <button className="sd-brand" type="button" onClick={() => navigate("")}>
          <span className="sd-mark">SD</span>
          <span className="sd-brand-text">
            <strong>SOURCEDAYZ</strong>
            <small>{copy.brandTag}</small>
          </span>
        </button>
        <LanguageSwitcher compact />
        <button className="sd-btn ghost acc-back" type="button" onClick={() => navigate("")}>
          {copy.back}
        </button>
      </header>

      {mode === "loading" && (
        <main className="acc-gate acc-gate-loading">
          <section className="acc-gate-copy">
            <p className="sd-eyebrow">{copy.loadingEyebrow}</p>
            <h1>{copy.loadingTitle}</h1>
            <p className="acc-gate-lead">{copy.loadingText}</p>
          </section>
        </main>
      )}

      {mode === "login" && (
        <main className="acc-gate">
          <section className="acc-gate-copy">
            <p className="sd-eyebrow">{copy.loginEyebrow}</p>
            <h1>
              {copy.loginTitleA}
              <br />
              {copy.loginTitleB}
            </h1>
            <p className="acc-gate-lead">{copy.loginLead}</p>

            <ul className="acc-gate-list">
              {copy.loginBullets.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            <p className="acc-gate-note">{copy.loginNote}</p>
          </section>

          <section className="acc-gate-card" aria-label={copy.loginEyebrow}>
            <AuthPanel initialMode="entrar" />
          </section>
        </main>
      )}

      {mode === "denied" && (
        <main className="acc-gate">
          <section className="acc-gate-copy">
            <p className="sd-eyebrow">{copy.deniedEyebrow}</p>
            <h1>
              {copy.deniedTitleA}
              <br />
              {copy.deniedTitleB}
            </h1>
            <p className="acc-gate-lead">{copy.deniedLead}</p>
            <p className="acc-gate-note">{copy.deniedNote}</p>

            <div className="sd-actions">
              <button
                className="sd-btn primary"
                type="button"
                onClick={async () => {
                  await logoutAccount();
                  navigate("");
                }}
              >
                {copy.deniedSignOut}
              </button>
              <button className="sd-btn" type="button" onClick={() => navigate("")}>
                {copy.deniedHome}
              </button>
            </div>
          </section>

          <section className="acc-gate-card acc-docs-account">
            <span className="sd-eyebrow">{copy.deniedAccount}</span>
            <strong>{account?.nome ?? ""}</strong>
            <span>{account?.email ?? ""}</span>
          </section>
        </main>
      )}
    </div>
  );
}
