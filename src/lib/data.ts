import { useEffect, useState } from "react";
import type {
  Achado, Alerta, BugsData, Comentario, ComentariosIndex, DocData, Ferramenta,
  Funcao, GlossarioData, Meta, Patch, SourceData
} from "../types";
import type { Locale } from "./i18n";

const BASE = `${import.meta.env.BASE_URL}data/`;
const cache = new Map<string, Promise<unknown>>();

export function getJSON<T>(name: string): Promise<T> {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(BASE + name).then((r) => {
        if (!r.ok) throw new Error(`Falha ao carregar ${name} (${r.status})`);
        return r.json() as Promise<T>;
      })
    );
  }
  return cache.get(name) as Promise<T>;
}

/**
 * Carrega `nome.en.json` / `nome.ru.json` quando existir. Se a tradução
 * ainda não foi publicada, o arquivo em PT mantém a página funcionando.
 */
async function getLocalized<T>(name: string, locale: Locale): Promise<T> {
  if (locale === "pt") return getJSON<T>(name);
  try {
    return await getJSON<T>(name.replace(/\.json$/, `.${locale}.json`));
  } catch {
    return getJSON<T>(name);
  }
}

export const getMeta = () => getJSON<Meta>("meta.json");
export const getFuncoes = (locale: Locale = "pt") => getLocalized<Funcao[]>("funcoes.json", locale);
export const getAchados = (locale: Locale = "pt") => getLocalized<Achado[]>("achados.json", locale);
export const getPatches = () => getJSON<Patch[]>("patches.json");
export const getAlertas = () => getJSON<Alerta[]>("alertas.json");
export const getFerramentas = (locale: Locale = "pt") => getLocalized<Ferramenta[]>("ferramentas.json", locale);
export const getComentariosIndex = () => getJSON<ComentariosIndex>("comentarios-index.json");
export const getDoc = (locale: Locale = "pt") => getLocalized<DocData>("doc.json", locale);
export const getGlossario = (locale: Locale = "pt") => getLocalized<GlossarioData>("glossario.json", locale);
export const getBugs = (locale: Locale = "pt") => getLocalized<BugsData>("bugs.json", locale);
export const getSource = (locale: Locale = "pt") => getLocalized<SourceData>("source.json", locale);

export async function getComentarios(grupo: GrupoRef): Promise<Comentario[]> {
  const parts = await Promise.all(grupo.partes.map((p) => getJSON<Comentario[]>(`comentarios/${p}`)));
  return parts.flat();
}

export interface GrupoRef {
  grupo: string;
  slug: string;
  total: number;
  partes: string[];
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; error: string | null; loading: boolean } {
  return useAsyncInternal(fn, deps);
}

function useAsyncInternal<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading };
}

export function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}
