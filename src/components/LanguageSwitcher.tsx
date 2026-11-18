import { LOCALES, useLocale, type Locale } from "../lib/i18n";

const FLAG_TITLE: Record<Locale, string> = {
  pt: "Português do Brasil",
  en: "English",
  ru: "Русский",
};

function Flag({ locale }: { locale: Locale }) {
  if (locale === "pt") {
    return (
      <svg viewBox="0 0 28 20" aria-hidden="true">
        <rect width="28" height="20" fill="#009b3a" />
        <path d="M14 2.4 25.4 10 14 17.6 2.6 10Z" fill="#fedf00" />
        <circle cx="14" cy="10" r="4.3" fill="#002776" />
        <path d="M9.9 8.4c2.6-.7 5.7-.2 8.2 1.2" stroke="#fff" strokeWidth=".9" fill="none" />
      </svg>
    );
  }

  if (locale === "en") {
    return (
      <svg viewBox="0 0 28 20" aria-hidden="true">
        <rect width="28" height="20" fill="#012169" />
        <path d="m0 0 28 20M28 0 0 20" stroke="#fff" strokeWidth="4" />
        <path d="m0 0 28 20M28 0 0 20" stroke="#c8102e" strokeWidth="2" />
        <path d="M14 0v20M0 10h28" stroke="#fff" strokeWidth="6" />
        <path d="M14 0v20M0 10h28" stroke="#c8102e" strokeWidth="3.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 20" aria-hidden="true">
      <rect width="28" height="6.67" fill="#fff" />
      <rect y="6.67" width="28" height="6.67" fill="#0039a6" />
      <rect y="13.34" width="28" height="6.66" fill="#d52b1e" />
    </svg>
  );
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`lang-switch ${compact ? "compact" : ""}`}
      role="group"
      aria-label="Idioma / Language / Язык"
    >
      {LOCALES.map((item) => (
        <button
          key={item.id}
          type="button"
          className={locale === item.id ? "on" : ""}
          onClick={() => setLocale(item.id)}
          title={FLAG_TITLE[item.id]}
          aria-label={FLAG_TITLE[item.id]}
          aria-pressed={locale === item.id}
        >
          <Flag locale={item.id} />
          {!compact && <span>{item.short}</span>}
        </button>
      ))}
    </div>
  );
}
