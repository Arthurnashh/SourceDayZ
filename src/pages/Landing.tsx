import { useEffect, useRef, useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { USING_SUPABASE, useCurrentAccount } from "../lib/accounts";
import { useLocale } from "../lib/i18n";
import { navigate } from "../lib/router";
import { LANDING_COPY } from "../content/landing-i18n";

type AbaServidores = "oficiais" | "comunidade";

type DiscordStats = {
  membros: number;
  online: number;
};

const DISCORD_URL = "https://discord.gg/4yvv6KrxwD";
const DISCORD_API = "https://discord.com/api/v9/invites/4yvv6KrxwD?with_counts=true";

function DiscordGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>
  );
}

function irPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Landing() {
  const { locale } = useLocale();
  const copy = LANDING_COPY[locale];
  const workshopLabel = locale === "ru" ? "МАСТЕРСКАЯ МОДОВ" : "WORKSHOP MODS";
  const [aba, setAba] = useState<AbaServidores>("oficiais");
  const [loginAberto, setLoginAberto] = useState(false);
  const [authMode, setAuthMode] = useState<"entrar" | "criar">("entrar");
  const [menuAberto, setMenuAberto] = useState(false);
  const [discord, setDiscord] = useState<DiscordStats>({ membros: 175, online: 17 });
  const fecharRef = useRef<HTMLButtonElement>(null);
  const conta = useCurrentAccount();

  useEffect(() => {
    if (aba !== "comunidade") return;

    const controller = new AbortController();
    fetch(DISCORD_API, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            approximate_member_count?: number;
            approximate_presence_count?: number;
          } | null,
        ) => {
          if (!data) return;
          setDiscord({
            membros: data.approximate_member_count ?? 175,
            online: data.approximate_presence_count ?? 17,
          });
        },
      )
      .catch(() => {});

    return () => controller.abort();
  }, [aba]);

  useEffect(() => {
    if (!loginAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLoginAberto(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [loginAberto]);

  const navegar = (id: string) => {
    setMenuAberto(false);
    irPara(id);
  };

  const abrirConta = (modo: "entrar" | "criar" = "entrar") => {
    setMenuAberto(false);
    if (conta) {
      navigate("minha-conta");
      return;
    }
    setAuthMode(modo);
    setLoginAberto(true);
  };

  return (
    <div className="sd">
      <header className="sd-top">
        <button
          className="sd-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={copy.aria.brand}
        >
          <span className="sd-mark">SD</span>
          <span className="sd-brand-text">
            <strong>SOURCEDAYZ</strong>
            <small>{copy.brandTag}</small>
          </span>
        </button>

        <nav className="sd-nav" aria-label={copy.aria.nav}>
          {copy.nav.map((item) => (
            <button key={item.id} onClick={() => navegar(item.id)}>
              {item.label}
            </button>
          ))}
          <button className="sd-nav-workshop" onClick={() => navigate("workshopMods")}>
            {workshopLabel}
          </button>
        </nav>

        <div className="sd-top-actions">
          <LanguageSwitcher />
          <button className="sd-login" onClick={() => abrirConta("entrar")}>
            {conta ? copy.myAccount : copy.enter}
            <span className="sd-login-dot" />
          </button>
          <button
            className={`sd-burger ${menuAberto ? "on" : ""}`}
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={copy.aria.openMenu}
            aria-expanded={menuAberto}
            aria-controls="sd-menu-mobile"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {menuAberto && (
        <div className="sd-mobile" id="sd-menu-mobile">
          {copy.nav.map((item) => (
            <button key={item.id} onClick={() => navegar(item.id)}>
              {item.label}
            </button>
          ))}
          <button onClick={() => { setMenuAberto(false); navigate("workshopMods"); }}>
            {workshopLabel}
          </button>
          <div className="sd-mobile-lang">
            <LanguageSwitcher />
          </div>
          <button
            className="sd-mobile-login"
            onClick={() => {
              setMenuAberto(false);
              abrirConta("entrar");
            }}
          >
            {conta ? copy.myAccount : copy.mobileLogin}
          </button>
        </div>
      )}

      <main>
        <section className="sd-hero" id="inicio">
          <div className="sd-hero-media">
            <img
              src="/media/dayz045/hero-window.jpg"
              alt={copy.aria.heroPhoto}
            />
          </div>
          <div className="sd-hero-veil" />

          <div className="sd-hero-inner">
            <div className="sd-hero-copy">
              <p className="sd-eyebrow">
                <i className="sd-pulse" />
                {copy.hero.eyebrow}
              </p>
              <h1>
                {copy.hero.titleBefore}
                <em>{copy.hero.titleEm}</em>
                {copy.hero.titleAfter}
              </h1>
              <p className="sd-hero-sub">{copy.hero.sub}</p>

              <div className="sd-actions">
                <button className="sd-btn primary" onClick={() => navegar("servidores")}>
                  {copy.hero.ctaServers}
                  <span aria-hidden="true">→</span>
                </button>
                <button className="sd-btn" onClick={() => abrirConta("entrar")}>
                  {conta ? copy.myAccount : copy.hero.ctaAccount}
                  {!conta && <span className="sd-soon">{copy.free}</span>}
                </button>
              </div>

              <ul className="sd-tags" aria-label={copy.aria.features}>
                {copy.hero.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="sd-rail">
            <div className="sd-rail-inner">
              {copy.hero.rail.map((item) => (
                <div className="sd-rail-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sd-sec sd-servers" id="servidores">
          <div className="sd-wrap">
            <div className="sd-sec-head">
              <div>
                <p className="sd-eyebrow">{copy.servers.eyebrow}</p>
                <h2 className="sd-h2">{copy.servers.title}</h2>
              </div>
              <p className="sd-lead">{copy.servers.lead}</p>
            </div>

            <div className="sd-tabs" role="tablist" aria-label={copy.aria.serverTabs}>
              <button
                id="sd-tab-oficiais"
                className={`sd-tab ${aba === "oficiais" ? "on" : ""}`}
                role="tab"
                aria-selected={aba === "oficiais"}
                aria-controls="sd-painel-servidores"
                onClick={() => setAba("oficiais")}
              >
                {copy.servers.tabOfficial}
                <small>{copy.servers.tabOfficialSmall}</small>
              </button>
              <button
                id="sd-tab-comunidade"
                className={`sd-tab ${aba === "comunidade" ? "on" : ""}`}
                role="tab"
                aria-selected={aba === "comunidade"}
                aria-controls="sd-painel-servidores"
                onClick={() => setAba("comunidade")}
              >
                {copy.servers.tabCommunity}
                <small>{copy.servers.tabCommunitySmall}</small>
              </button>
            </div>

            <div
              id="sd-painel-servidores"
              role="tabpanel"
              aria-labelledby={aba === "oficiais" ? "sd-tab-oficiais" : "sd-tab-comunidade"}
            >
              {aba === "oficiais" ? (
                <div className="sd-server-grid">
                  <article className="sd-server">
                    <div className="sd-server-media">
                      <img
                        src="/media/dayz045/sniper.jpg"
                        alt={copy.servers.official.title}
                      />
                      <span className="sd-status">{copy.servers.tabOfficialSmall}</span>
                    </div>
                    <div className="sd-server-body">
                      <p className="sd-server-type">{copy.servers.official.type}</p>
                      <h3>{copy.servers.official.title}</h3>
                      <p>{copy.servers.official.text}</p>
                      <ul className="sd-server-meta">
                        {copy.servers.official.meta.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <button className="sd-btn sd-btn-block" disabled>
                        {copy.servers.official.button}
                      </button>
                    </div>
                  </article>

                  <article className="sd-server sd-ghost">
                    <span className="sd-ghost-num">02</span>
                    <span className="sd-status">{copy.servers.tabOfficialSmall}</span>
                    <h3>{copy.servers.officialGhost.title}</h3>
                    <p>{copy.servers.officialGhost.text}</p>
                    <span className="sd-ghost-line" />
                    <p className="sd-ghost-foot">{copy.servers.officialGhost.foot}</p>
                  </article>
                </div>
              ) : (
                <div className="sd-server-grid">
                  <article className="sd-server sd-invite">
                    <div className="sd-invite-cover">
                      <img
                        className="sd-invite-backdrop"
                        src="/media/discord/remanescentz-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <div className="sd-invite-veil" aria-hidden="true" />
                      <img
                        className="sd-invite-watermark"
                        src="/media/discord/remanescentz-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <span className="sd-status">{copy.servers.community.status}</span>

                      <div className="sd-invite-identity">
                        <img
                          className="sd-invite-icon"
                          src="/media/discord/remanescentz-icon.png"
                          alt={copy.servers.community.title}
                        />
                        <div>
                          <p className="sd-server-type">{copy.servers.community.type}</p>
                          <h3>{copy.servers.community.title}</h3>
                          <span className="sd-invite-handle">discord.gg/4yvv6KrxwD</span>
                        </div>
                      </div>
                    </div>

                    <div className="sd-server-body">
                      <p>{copy.servers.community.text}</p>

                      <div className="sd-invite-stats">
                        <div>
                          <strong>{discord.membros}</strong>
                          <span>{copy.servers.community.members}</span>
                        </div>
                        <div>
                          <strong>{discord.online}</strong>
                          <span>{copy.servers.community.online}</span>
                        </div>
                      </div>

                      <p className="sd-invite-since">
                        {copy.servers.community.since}{" "}
                        <time dateTime="2025-06-14T17:51">{copy.servers.community.date}</time>
                      </p>

                      <a
                        className="sd-btn primary sd-btn-block sd-discord-btn"
                        href={DISCORD_URL}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <DiscordGlyph />
                        {copy.servers.community.join}
                        <span aria-hidden="true">↗</span>
                      </a>
                      <p className="sd-invite-note">{copy.servers.community.note}</p>
                    </div>
                  </article>

                  <article className="sd-server sd-ghost">
                    <span className="sd-ghost-num">02</span>
                    <span className="sd-status">{copy.servers.tabOfficialSmall}</span>
                    <h3>{copy.servers.communityGhost.title}</h3>
                    <p>{copy.servers.communityGhost.text}</p>
                    <span className="sd-ghost-line" />
                    <p className="sd-ghost-foot">{copy.servers.communityGhost.foot}</p>
                  </article>
                </div>
              )}
            </div>

            <p className="sd-footnote">
              {copy.servers.footnoteBefore}
              <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener">
                {copy.servers.footnoteLink}
              </a>
              {copy.servers.footnoteAfter}
            </p>
          </div>
        </section>

        <section className="sd-sec sd-project" id="projeto">
          <div className="sd-wrap sd-project-grid">
            <div className="sd-project-media">
              <img
                src="/media/dayz045/campfire-portrait.jpg"
                alt={copy.aria.projectPhoto}
              />
              <span className="sd-photo-tag">{copy.project.photoTag}</span>
            </div>

            <div className="sd-project-copy">
              <p className="sd-eyebrow">{copy.project.eyebrow}</p>
              <h2 className="sd-h2">
                {copy.project.titleA}
                <br />
                {copy.project.titleB}
              </h2>
              <p className="sd-lead">{copy.project.lead}</p>
              <p className="sd-project-p">{copy.project.text}</p>

              <div className="sd-pillars">
                {copy.project.pillars.map((p) => (
                  <div className="sd-pillar" key={p.n}>
                    <span className="sd-pillar-n">{p.n}</span>
                    <div>
                      <strong>{p.title}</strong>
                      <p>{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="sd-legal">{copy.project.legal}</p>
            </div>
          </div>
        </section>

        <section className="sd-sec sd-roadmap" id="roadmap">
          <div className="sd-wrap">
            <div className="sd-sec-head">
              <div>
                <p className="sd-eyebrow">{copy.roadmap.eyebrow}</p>
                <h2 className="sd-h2">{copy.roadmap.title}</h2>
              </div>
              <p className="sd-lead">{copy.roadmap.lead}</p>
            </div>

            <div className="sd-road">
              {copy.roadmap.steps.map((step, index) => (
                <div className={`sd-step ${["done", "current", "current", ""][index] ?? ""}`} key={step.n}>
                  <div className="sd-step-bar">
                    <span />
                  </div>
                  <span className="sd-step-n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <em>{step.status}</em>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sd-sec sd-faq" id="faq">
          <div className="sd-wrap sd-faq-grid">
            <div>
              <p className="sd-eyebrow">{copy.faq.eyebrow}</p>
              <h2 className="sd-h2">{copy.faq.title}</h2>
              <p className="sd-lead">{copy.faq.lead}</p>
              <div className="sd-faq-note">
                <span>{copy.faq.noteLabel}</span>
                <strong>{copy.faq.noteTitle}</strong>
                <p>{copy.faq.noteText}</p>
              </div>
            </div>

            <div className="sd-faq-list">
              {copy.faq.items.map((item) => (
                <details key={item.q} name="sd-faq">
                  <summary>{item.q}</summary>
                  <p>
                    {item.useLoginAnswer
                      ? USING_SUPABASE
                        ? copy.faq.loginAnswerOnline
                        : copy.faq.loginAnswerLocal
                      : item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="sd-cta">
          <div className="sd-cta-bg" />
          <div className="sd-cta-inner">
            <p className="sd-eyebrow">{copy.cta.eyebrow}</p>
            <h2>
              {copy.cta.titleA}
              <br />
              {copy.cta.titleB}
            </h2>
            <p>{copy.cta.text}</p>
            <div className="sd-actions">
              <button className="sd-btn primary" onClick={() => abrirConta("criar")}>
                {conta ? copy.cta.myAccount : copy.cta.create}
                {!conta && <span className="sd-soon dark">{copy.free}</span>}
              </button>
              <button className="sd-btn ghost" onClick={() => navegar("servidores")}>
                {copy.cta.servers}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="sd-foot">
        <div className="sd-foot-inner">
          <div className="sd-foot-brand">
            <span className="sd-mark small">SD</span>
            <div>
              <strong>SOURCEDAYZ</strong>
              <p>{copy.footer.tagline}</p>
            </div>
          </div>

          <nav className="sd-foot-nav" aria-label={copy.aria.footerNav}>
            {copy.nav.map((item) => (
              <button key={item.id} onClick={() => navegar(item.id)}>
                {item.label}
              </button>
            ))}
            <button onClick={() => navigate("workshopMods")}>{workshopLabel}</button>
            <button onClick={() => abrirConta("entrar")}>
              {conta ? copy.footer.account : copy.enter}
            </button>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener">
              {copy.footer.discord}
            </a>
          </nav>

          <div className="sd-foot-legal">
            <p>{copy.footer.legal}</p>
            <p>
              {copy.footer.credits} <span>{copy.footer.rights}</span>
            </p>
          </div>
        </div>
      </footer>

      {loginAberto && (
        <div
          className="sd-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginAberto(false);
          }}
        >
          <div
            className="sd-modal sd-modal-auth"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sd-login-title"
          >
            <button
              className="sd-modal-x"
              onClick={() => setLoginAberto(false)}
              aria-label={copy.aria.closeLogin}
              ref={fecharRef}
            >
              ×
            </button>

            <AuthPanel
              initialMode={authMode}
              onSuccess={() => {
                setLoginAberto(false);
                navigate("minha-conta");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
