export interface Funcao {
  id: string;
  numero: number;
  titulo: string;
  simbolos: string[];
  status: string;
  local: string;
  assinatura: string;
  papel: string;
  fluxo: string;
  aprendi: string;
  risco: string;
}

export interface Achado {
  id: string;
  tipo: string;
  resumo: string;
  campos: Record<string, string>;
  texto: string;
}

export interface Patch {
  id: string;
  data: string;
  autor: string;
  texto: string;
  arquivo: string;
  linha: number;
}

export interface Alerta {
  tipo: string;
  file: string;
  line: number;
  texto: string;
}

export interface Ferramenta {
  nome: string;
  descricao: string;
  linhas: number;
}

export interface Comentario {
  file: string;
  line: number;
  kind: string;
  status: string;
  original: string;
  pt: string;
  code: string;
  anchor: string;
  anchor_line: number;
  func: string;
  qual: string;
  cats: string;
}

export interface GrupoComentarios {
  grupo: string;
  slug: string;
  total: number;
  partes: string[];
}

export interface ComentariosIndex {
  total: number;
  grupos: GrupoComentarios[];
  kinds: [string, number][];
  status: [string, number][];
  chunk: number;
}

export interface DocSecao {
  nivel: number;
  titulo: string;
  linha: number;
  linhas: number;
  md: string;
  filhos: number[];
}

export interface DocData {
  titulo: string;
  linhas: number;
  bytes: number;
  secoes: DocSecao[];
  raizes: number[];
}

export interface GlossarioItem {
  en: string;
  pt: string;
  tipo: string;
}

export interface GlossarioData {
  total: number;
  frases: number;
  palavras: number;
  itens: GlossarioItem[];
}

export interface BugItem {
  id: string;
  origem: string;
  tipo: string;
  severidade: string;
  titulo: string;
  local: string;
  campos: Record<string, string>;
  texto: string;
  cats: string[];
}

export interface BugsData {
  total: number;
  achados: number;
  comentarios: number;
  categorias: { slug: string; nome: string; total: number }[];
  itens: BugItem[];
}

export interface SourceFilho {
  nome: string;
  arquivos: number;
  bytes: number;
}

export interface SourceDir extends SourceFilho {
  nota: string;
  filhos: SourceFilho[];
  filhos_total: number;
}

export interface SourceData {
  raiz: string;
  medido_em: string;
  total: { arquivos: number; bytes: number; pastas: number };
  geradas: SourceFilho[];
  arquivos_raiz: { nome: string; bytes: number; nota: string }[];
  dirs: SourceDir[];
}

export interface Meta {
  funcoes: number;
  completas: number;
  parciais: number;
  comentarios: number;
  arquivosComentados: number;
  arquivosFonte: number;
  grupos: number;
  patches: number;
  alertas: number;
  achados: number;
  ferramentas: number;
  topFiles: { file: string; comentarios: number }[];
  kinds: [string, number][];
  status: [string, number][];
  porLinguagem: { nome: string; valor: number }[];
  porPasta: { nome: string; valor: number }[];
  porCategoria: { nome: string; valor: number }[];
}
