import { useEffect, useState, type ReactNode } from "react";
import { navigate, useRoute } from "../lib/router";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useDocsT } from "../content/docs-i18n";

interface NavItem {
  key: string;
  icon: ReactNode;
  grupo: string;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  { grupo: "estudo", key: "visao-geral", icon: icon("M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z") },
  { grupo: "estudo", key: "documento", icon: icon("M4 4h11l5 5v11H4zM15 4v5h5M8 13h8M8 17h5") },
  { grupo: "estudo", key: "fonte", icon: icon("M3 6h6l2 2h10v11H3zM3 6v13M7 12h4M7 16h7") },
  { grupo: "estudo", key: "motor", icon: icon("M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z") },
  { grupo: "estudo", key: "diagrama", icon: icon("M4 5h6v5H4zM14 14h6v5h-6zM4 15h6v4H4zM10 7h4v9") },
  { grupo: "estudo", key: "linguagens", icon: icon("M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14") },
  { grupo: "codigo", key: "funcoes", icon: icon("M8 3H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2M16 3h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2") },
  { grupo: "codigo", key: "comentarios", icon: icon("M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5") },
  { grupo: "codigo", key: "patches", icon: icon("M20 12l-8 8-8-8V4h8zM7.5 8h.01") },
  { grupo: "codigo", key: "achados", icon: icon("M12 2 2 21h20L12 2zM12 9v5M12 17.5v.5") },
  { grupo: "codigo", key: "bugs", icon: icon("M8 6h8v4a4 4 0 0 1-8 0zM8 9H5M19 9h-3M8 13H5M19 13h-3M12 14v6M9 20h6M9 3l1.5 3M15 3l-1.5 3") },
  { grupo: "projeto", key: "plano", icon: icon("M12 3v18M5 8l7-5 7 5M4 21h16M7 21v-7h10v7") },
  { grupo: "projeto", key: "passo-a-passo", icon: icon("M4 6h5v5H4zM15 6h5v5h-5zM4 15h5v5H4zM15 15h5v5h-5zM9 8.5h6M9 17.5h6M6.5 11v4") },
  { grupo: "projeto", key: "atualizacoes", icon: icon("M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5") },
  { grupo: "projeto", key: "pendencias", icon: icon("M9 3h6v3H9zM6 6h12v15H6zM9 12l2 2 4-4M9 17h4") },
  { grupo: "dados", key: "dicionario", icon: icon("M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2zM8 7h8M8 11h8M8 15h5") },
  { grupo: "dados", key: "ferramentas", icon: icon("M14.7 6.3a4 4 0 0 0-5.4 5.2L3 18v2h3l6.5-6.3a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.3-2.3z") },
];

export function Layout({ children }: { children: ReactNode }) {
  const route = useRoute();
  const { t, locale } = useDocsT();
  const current = route.parts[0] ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [route.path]);

  const grupos = Array.from(new Set(NAV.map((n) => n.grupo)));

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand" onClick={() => navigate("")} title={t("layout.home")}>
          <span className="brand-mark">DZ</span>
          <span className="brand-text">
            <strong>Source Explorer</strong>
            <small>DayZ 0.45.124252</small>
          </span>
        </div>
        <nav className="nav">
          {grupos.map((g) => (
            <div className="nav-group" key={g}>
              <span className="nav-grupo">{t(`nav.group.${g}`)}</span>
              {NAV.filter((n) => n.grupo === g).map((n) => (
                <button
                  key={n.key}
                  className={`nav-item ${current === n.key ? "active" : ""}`}
                  onClick={() => navigate(n.key)}
                >
                  {n.icon}
                  <span>{t(`nav.${n.key}`)}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="dot" /> {t("layout.localBase")}
          <code>SOURCE DEFINITIVA\DayZ-0.45.124252</code>
          <small>
            170 {t("layout.functions")} · 180.545 {t("layout.comments")}
          </small>
          <div className="sidebar-lang">
            <LanguageSwitcher />
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu" onClick={() => setOpen((v) => !v)} aria-label={t("layout.menu")}>
            <span /><span /><span />
          </button>
          <div className="crumb">
            <span>{t("layout.studyOfSource")}</span>
            <i>/</i>
            <strong>{t(`nav.${current || "visao-geral"}`)}</strong>
          </div>
          <div className="top-right">
            <LanguageSwitcher compact />
            <span className="chip">Enforce · SQF · C++</span>
            <span className="chip accent">DX9 · v141</span>
          </div>
        </header>
        {locale !== "pt" && (
          <div className="corpus-banner">
            <span className="corpus-dot" />
            {t("docs.corpusBanner")}
          </div>
        )}
        <main className="content">{children}</main>
        <footer className="foot">{t("layout.footer")}</footer>
      </div>
    </div>
  );
}
