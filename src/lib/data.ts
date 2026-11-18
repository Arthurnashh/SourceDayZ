import type {
  Achado, Alerta, BugsData, Comentario, ComentariosIndex, DocData, Ferramenta,
  Funcao, GlossarioData, Meta, Patch, SourceData
} from "../types";

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

export const getMeta = () => getJSON<Meta>("meta.json");
export const getFuncoes = () => getJSON<Funcao[]>("funcoes.json");
export const getAchados = () => getJSON<Achado[]>("achados.json");
export const getPatches = () => getJSON<Patch[]>("patches.json");
export const getAlertas = () => getJSON<Alerta[]>("alertas.json");
export const getFerramentas = () => getJSON<Ferramenta[]>("ferramentas.json");
export const getComentariosIndex = () => getJSON<ComentariosIndex>("comentarios-index.json");
export const getDoc = () => getJSON<DocData>("doc.json");
export const getGlossario = () => getJSON<GlossarioData>("glossario.json");
export const getBugs = () => getJSON<BugsData>("bugs.json");
export const getSource = () => getJSON<SourceData>("source.json");

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

export function useAsync<T>(fn: () => Promise<T>): { data: T | null; error: string | null; loading: boolean } {
  return useAsyncInternal(fn);
}

import { useEffect, useState } from "react";

function useAsyncInternal<T>(fn: () => Promise<T>) {
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
  }, []);
  return { data, error, loading };
}

export function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}
