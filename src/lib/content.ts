import { useLocale, type Locale } from "./i18n";

/**
 * Markdown da documentação da source.
 *
 * A pasta `src/content/` guarda o texto em português (fonte original do
 * estudo). As traduções ficam em `src/content/en/` e `src/content/ru/` com o
 * mesmo nome de arquivo. Quando a tradução ainda não existe, o site cai no
 * português em vez de mostrar uma página vazia.
 */
const PT = import.meta.glob("../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const EN = import.meta.glob("../content/en/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const RU = import.meta.glob("../content/ru/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const MAPS: Record<Locale, Record<string, string>> = { pt: PT, en: EN, ru: RU };

export function contentPath(name: string, locale: Locale): string {
  return `../content/${locale === "pt" ? "" : `${locale}/`}${name}.md`;
}

export function getContent(name: string, locale: Locale): string | undefined {
  return MAPS[locale][contentPath(name, locale)] ?? PT[contentPath(name, "pt")];
}

export function hasContent(name: string, locale: Locale): boolean {
  return Boolean(MAPS[locale][contentPath(name, locale)]);
}

/** Markdown traduzido para o idioma ativo, com fallback para o português. */
export function useMd(name: string): string {
  const { locale } = useLocale();
  return getContent(name, locale) ?? "";
}

/** Informa se aquele arquivo específico já está traduzido no idioma ativo. */
export function useMdTranslated(name: string): boolean {
  const { locale } = useLocale();
  return locale === "pt" || hasContent(name, locale);
}
