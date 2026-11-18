import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "pt" | "en" | "ru";

export const LOCALES: Array<{ id: Locale; label: string; short: string }> = [
  { id: "pt", label: "Português", short: "PT" },
  { id: "en", label: "English", short: "EN" },
  { id: "ru", label: "Русский", short: "RU" },
];

const STORAGE_KEY = "sourcedayz.locale";
const HTML_LANG: Record<Locale, string> = { pt: "pt-BR", en: "en", ru: "ru" };
const DOC_TITLES: Record<Locale, string> = {
  pt: "SourceDayZ — Sobrevivência feita pela comunidade",
  en: "SourceDayZ — Survival built by the community",
  ru: "SourceDayZ — Выживание, созданное сообществом",
};
const DOC_DESCRIPTIONS: Record<Locale, string> = {
  pt: "SourceDayZ é um projeto de sobrevivência da comunidade. Servidores oficiais em breve e o primeiro mundo da comunidade em desenvolvimento. Sem vínculo com a Bohemia Interactive.",
  en: "SourceDayZ is a community survival project. Official servers coming soon and the first community world in development. Not affiliated with Bohemia Interactive.",
  ru: "SourceDayZ — survival-проект сообщества. Официальные серверы скоро, первый мир сообщества уже в разработке. Без связи с Bohemia Interactive.",
};

function isLocale(value: string | null): value is Locale {
  return value === "pt" || value === "en" || value === "ru";
}

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // localStorage pode estar bloqueado; segue para o navegador.
  }

  const languages =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of languages) {
    const lang = String(raw ?? "").toLowerCase();
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("ru")) return "ru";
    if (lang.startsWith("en")) return "en";
  }

  // Visitantes de outros idiomas recebem a versão internacional em inglês.
  return "en";
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
    document.title = DOC_TITLES[locale];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", DOC_DESCRIPTIONS[locale]);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", DOC_TITLES[locale]);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", DOC_DESCRIPTIONS[locale]);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // sem persistência, a detecção continua funcionando a cada visita
    }
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: (next) => setLocaleState(next),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useLocale precisa estar dentro de I18nProvider");
  return value;
}

/**
 * Traduz uma chave simples com fallback para o português. As telas públicas
 * usam dicionários próprios; esta função cobre textos compartilhados.
 */
export function translate(
  locale: Locale,
  values: Record<Locale, string>,
  fallback = "pt",
): string {
  return values[locale] ?? values[fallback as Locale] ?? "";
}
