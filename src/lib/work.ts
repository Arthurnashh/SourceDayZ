import { useEffect, useState } from "react";

export type WorkKind = "tarefa" | "bug";
export type WorkStatus = "aberto" | "andamento" | "bloqueado" | "concluido";
export type Priority = "baixa" | "media" | "alta" | "critica";
export type UpdateKind = "patch" | "implementacao" | "build" | "anuncio";
export type Origin = "base" | "manual" | "github";

export interface Resolution {
  oQueEra: string;
  comoCorrigiu: string;
  oQueUsou: string;
  tentativas: number;
  commit?: string;
  resolvidoEm: string;
}

export interface WorkItem {
  id: string;
  kind: WorkKind;
  titulo: string;
  descricao: string;
  area: string;
  status: WorkStatus;
  prioridade: Priority;
  severidade?: Priority;
  local?: string;
  passos?: string;
  responsavel?: string;
  etiquetas: string[];
  criadoEm: string;
  atualizadoEm: string;
  desfecho?: Resolution;
  origem: Origin;
}

export interface UpdateEntry {
  id: string;
  tipo: UpdateKind;
  titulo: string;
  resumo: string;
  detalhes?: string;
  data: string;
  versao?: string;
  autor?: string;
  url?: string;
  origem: "manual" | "github";
  criadoEm: string;
}

export interface BoardState {
  version: number;
  seedVersion: number;
  items: WorkItem[];
  updates: UpdateEntry[];
  removedSeedIds: string[];
  updatedAt: string;
}

export interface WorkStore {
  state: BoardState | null;
  loading: boolean;
  error: string | null;
  saveItem: (item: WorkItem) => void;
  deleteItem: (id: string) => void;
  addUpdate: (update: UpdateEntry) => void;
  updateUpdate: (update: UpdateEntry) => void;
  deleteUpdate: (id: string) => void;
  importBoard: (raw: unknown) => void;
  replaceBoard: (board: BoardState) => void;
  reset: () => Promise<void>;
  exportBoard: () => void;
  exportUpdates: () => void;
}

const STORAGE_KEY = "sourcedayz.board.v1";
const STATUSES: WorkStatus[] = ["aberto", "andamento", "bloqueado", "concluido"];
const PRIORITIES: Priority[] = ["baixa", "media", "alta", "critica"];
const KINDS: WorkKind[] = ["tarefa", "bug"];
const UPDATE_KINDS: UpdateKind[] = ["patch", "implementacao", "build", "anuncio"];
const ORIGINS: Origin[] = ["base", "manual", "github"];

export const STATUS_LABEL: Record<WorkStatus, string> = {
  aberto: "Aberto",
  andamento: "Em andamento",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

export const STATUS_LABEL_TASK: Record<WorkStatus, string> = {
  aberto: "Aberta",
  andamento: "Em andamento",
  bloqueado: "Bloqueada",
  concluido: "Concluída",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const UPDATE_KIND_LABEL: Record<UpdateKind, string> = {
  patch: "Patch",
  implementacao: "Implementação",
  build: "Build",
  anuncio: "Anúncio",
};

export function statusLabel(kind: WorkKind, status: WorkStatus): string {
  return kind === "tarefa" ? STATUS_LABEL_TASK[status] : STATUS_LABEL[status];
}

export function fmtDate(value: string, withTime = false, locale = "pt-BR"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const tag =
    locale === "pt" ? "pt-BR" : locale === "ru" ? "ru-RU" : locale === "en" ? "en-GB" : locale;
  return date.toLocaleDateString(tag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function nextId(kind: WorkKind, items: WorkItem[]): string {
  const prefix = kind === "tarefa" ? "T" : "B";
  const max = items
    .filter((item) => item.kind === kind)
    .reduce((acc, item) => {
      const match = item.id.match(/(\d+)$/);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function date(value: unknown, fallback = new Date().toISOString()): string {
  const raw = text(value);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function pick<T extends string>(value: unknown, valid: readonly T[], fallback: T): T {
  return valid.includes(value as T) ? (value as T) : fallback;
}

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item).trim()).filter(Boolean);
}

function boolString(value: unknown): string | undefined {
  const raw = text(value).trim();
  return raw ? raw : undefined;
}

function normalizeResolution(raw: unknown): Resolution | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const oQueEra = text(value.oQueEra).trim();
  const comoCorrigiu = text(value.comoCorrigiu).trim();
  const oQueUsou = text(value.oQueUsou).trim();
  if (!oQueEra && !comoCorrigiu && !oQueUsou) return undefined;
  return {
    oQueEra,
    comoCorrigiu,
    oQueUsou,
    tentativas: Math.max(1, Math.round(Number(value.tentativas) || 1)),
    commit: boolString(value.commit),
    resolvidoEm: date(value.resolvidoEm),
  };
}

export function normalizeItem(raw: unknown): WorkItem | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const titulo = text(value.titulo).trim();
  if (!titulo) return null;
  const kind = pick(value.kind, KINDS, "tarefa");
  const now = new Date().toISOString();
  return {
    id: text(value.id).trim() || `${kind === "tarefa" ? "T" : "B"}-000`,
    kind,
    titulo,
    descricao: text(value.descricao),
    area: text(value.area, "Geral").trim() || "Geral",
    status: pick(value.status, STATUSES, "aberto"),
    prioridade: pick(value.prioridade, PRIORITIES, "media"),
    severidade: kind === "bug" ? pick(value.severidade, PRIORITIES, "media") : undefined,
    local: boolString(value.local),
    passos: boolString(value.passos),
    responsavel: boolString(value.responsavel),
    etiquetas: list(value.etiquetas),
    criadoEm: date(value.criadoEm, now),
    atualizadoEm: date(value.atualizadoEm, now),
    desfecho: normalizeResolution(value.desfecho),
    origem: pick(value.origem, ORIGINS, "manual"),
  };
}

export function normalizeUpdate(raw: unknown): UpdateEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const titulo = text(value.titulo).trim();
  if (!titulo) return null;
  return {
    id: text(value.id).trim() || `U-${Date.now()}`,
    tipo: pick(value.tipo, UPDATE_KINDS, "anuncio"),
    titulo,
    resumo: text(value.resumo),
    detalhes: boolString(value.detalhes),
    data: date(value.data),
    versao: boolString(value.versao),
    autor: boolString(value.autor),
    url: boolString(value.url),
    origem: value.origem === "github" ? "github" : "manual",
    criadoEm: date(value.criadoEm),
  };
}

export function normalizeBoard(raw: unknown): BoardState {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray(value.items)
    ? value.items
    : Array.isArray(raw)
      ? raw
      : [];
  const updatesRaw = Array.isArray(value.updates) ? value.updates : [];
  const items = itemsRaw.map(normalizeItem).filter((item): item is WorkItem => Boolean(item));
  const updates = updatesRaw
    .map(normalizeUpdate)
    .filter((update): update is UpdateEntry => Boolean(update));
  return {
    version: 1,
    seedVersion: Number(value.seedVersion) || 1,
    items,
    updates,
    removedSeedIds: list(value.removedSeedIds),
    updatedAt: date(value.updatedAt),
  };
}

function emptyBoard(): BoardState {
  return {
    version: 1,
    seedVersion: 1,
    items: [],
    updates: [],
    removedSeedIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function readLocal(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeBoard(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(state: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Navegador sem storage / cota cheia: o estado continua em memória.
  }
}

async function fetchSeed(): Promise<BoardState> {
  const url = `${import.meta.env.BASE_URL}data/board.json`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar ${url} (${response.status})`);
  return normalizeBoard(await response.json());
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useWorkStore(): WorkStore {
  const [state, setState] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const local = readLocal();
    if (local) {
      setState(local);
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    fetchSeed()
      .then((seed) => {
        if (!alive) return;
        setState(seed);
        writeLocal(seed);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : String(err));
        setState(emptyBoard());
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (state) writeLocal(state);
  }, [state]);

  const update = (change: (current: BoardState) => BoardState) => {
    setState((current) => {
      if (!current) return current;
      const next = change(current);
      return { ...next, updatedAt: new Date().toISOString() };
    });
  };

  const saveItem = (item: WorkItem) => {
    update((current) => {
      const now = new Date().toISOString();
      const nextItem: WorkItem = {
        ...item,
        criadoEm: item.criadoEm || now,
        atualizadoEm: now,
      };
      const exists = current.items.some((entry) => entry.id === item.id);
      return {
        ...current,
        items: exists
          ? current.items.map((entry) => (entry.id === item.id ? nextItem : entry))
          : [nextItem, ...current.items],
        removedSeedIds: current.removedSeedIds.filter((id) => id !== item.id),
      };
    });
  };

  const deleteItem = (id: string) => {
    update((current) => {
      const target = current.items.find((item) => item.id === id);
      return {
        ...current,
        items: current.items.filter((item) => item.id !== id),
        removedSeedIds:
          target?.origem === "base" && !current.removedSeedIds.includes(id)
            ? [...current.removedSeedIds, id]
            : current.removedSeedIds,
      };
    });
  };

  const addUpdate = (updateEntry: UpdateEntry) => {
    update((current) => ({
      ...current,
      updates: [updateEntry, ...current.updates],
    }));
  };

  const updateUpdate = (updateEntry: UpdateEntry) => {
    update((current) => ({
      ...current,
      updates: current.updates.map((entry) =>
        entry.id === updateEntry.id ? updateEntry : entry
      ),
    }));
  };

  const deleteUpdate = (id: string) => {
    update((current) => ({
      ...current,
      updates: current.updates.filter((entry) => entry.id !== id),
    }));
  };

  const importBoard = (raw: unknown) => {
    setState(normalizeBoard(raw));
    setError(null);
  };

  const replaceBoard = (board: BoardState) => {
    setState(normalizeBoard(board));
    setError(null);
  };

  const reset = async () => {
    setLoading(true);
    setError(null);
    try {
      const seed = await fetchSeed();
      setState(seed);
      writeLocal(seed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportBoard = () => {
    if (state) downloadJSON("board.json", state);
  };

  const exportUpdates = () => {
    if (!state) return;
    downloadJSON("updates.json", {
      version: 1,
      updatedAt: new Date().toISOString(),
      updates: state.updates
        .filter((entry) => entry.origem === "manual")
        .sort((a, b) => b.data.localeCompare(a.data)),
    });
  };

  return {
    state,
    loading,
    error,
    saveItem,
    deleteItem,
    addUpdate,
    updateUpdate,
    deleteUpdate,
    importBoard,
    replaceBoard,
    reset,
    exportBoard,
    exportUpdates,
  };
}
