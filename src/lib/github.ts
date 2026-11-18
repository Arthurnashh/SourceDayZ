import { normalizeBoard, normalizeUpdate, type BoardState, type UpdateEntry } from "./work";

export const GITHUB_OWNER = "Personed";
export const GITHUB_REPO = "Game";
export const GITHUB_BRANCH = "main";
export const GITHUB_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
export const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
export const GITHUB_BOARD_PATH = "site-data/board.json";
export const GITHUB_UPDATES_PATH = "site-data/updates.json";

const FEED_CACHE_KEY = "sourcedayz.github.feed.v2";
const FEED_TTL = 5 * 60 * 1000;
const TOKEN_KEY = "sourcedayz.github.token";

export interface GithubRepoInfo {
  fullName: string;
  htmlUrl: string;
  description: string;
  defaultBranch: string;
  pushedAt: string;
  stars: number;
  openIssues: number;
  language: string;
}

export interface GithubCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GithubRelease {
  id: number;
  name: string;
  tag: string;
  publishedAt: string;
  url: string;
  body: string;
  prerelease: boolean;
}

export interface GithubRate {
  remaining: number | null;
  reset: string | null;
}

export interface GithubFeedData {
  repo: GithubRepoInfo;
  commits: GithubCommit[];
  releases: GithubRelease[];
  manifest: UpdateEntry[];
  fetchedAt: string;
  rate: GithubRate;
}

interface ApiRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  pushed_at: string;
  stargazers_count: number;
  open_issues_count: number;
  language: string | null;
}

interface ApiCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
}

interface ApiRelease {
  id: number;
  name: string | null;
  tag_name: string;
  published_at: string | null;
  html_url: string;
  body: string | null;
  prerelease: boolean;
}

interface FetchResult<T> {
  data: T;
  rate: GithubRate;
}

function headers(token?: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

function rateFrom(response: Response): GithubRate {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  return {
    remaining: remaining === null ? null : Number(remaining),
    reset: reset === null ? null : new Date(Number(reset) * 1000).toISOString(),
  };
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<FetchResult<T>> {
  const response = await fetch(url, {
    ...init,
    headers: headers(),
  });
  const rate = rateFrom(response);
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ?? "";
    } catch {
      // resposta sem JSON
    }
    if (response.status === 403 && rate.remaining === 0) {
      const when = rate.reset ? new Date(rate.reset).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "mais tarde";
      throw new Error(`Limite da API do GitHub atingido. Tente novamente depois de ${when}.`);
    }
    throw new Error(`GitHub ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return { data: (await response.json()) as T, rate };
}

function mapRepo(repo: ApiRepo): GithubRepoInfo {
  return {
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description ?? "",
    defaultBranch: repo.default_branch,
    pushedAt: repo.pushed_at,
    stars: repo.stargazers_count,
    openIssues: repo.open_issues_count,
    language: repo.language ?? "",
  };
}

function mapCommit(commit: ApiCommit): GithubCommit {
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: (commit.commit.message.split("\n")[0] ?? "").trim(),
    author: commit.commit.author?.name ?? "GitHub",
    date: commit.commit.author?.date ?? "",
    url: commit.html_url,
  };
}

function mapRelease(release: ApiRelease): GithubRelease {
  return {
    id: release.id,
    name: release.name || release.tag_name,
    tag: release.tag_name,
    publishedAt: release.published_at ?? "",
    url: release.html_url,
    body: release.body ?? "",
    prerelease: release.prerelease,
  };
}

function readCache(): GithubFeedData | null {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GithubFeedData;
    if (!parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(feed: GithubFeedData): void {
  try {
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(feed));
  } catch {
    // cache é opcional
  }
}

export function readGithubToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveGithubToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sessão sem storage
  }
}

export async function fetchGithubUpdates(): Promise<UpdateEntry[]> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_UPDATES_PATH}`;
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Manifesto de atualizações: ${response.status}`);
  const body = (await response.json()) as unknown;
  const rawList = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { updates?: unknown }).updates)
      ? (body as { updates: unknown[] }).updates
      : [];
  return rawList
    .map(normalizeUpdate)
    .filter((entry): entry is UpdateEntry => Boolean(entry))
    .map((entry) => ({ ...entry, origem: "github" }));
}

export async function fetchGithubBoard(): Promise<BoardState | null> {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_BOARD_PATH}`;
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Board do GitHub: ${response.status}`);
  return normalizeBoard(await response.json());
}

export async function fetchGithubFeed(force = false): Promise<GithubFeedData> {
  if (!force) {
    const cached = readCache();
    if (cached) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (Number.isFinite(age) && age >= 0 && age < FEED_TTL) return cached;
    }
  }

  const [repoResult, releasesResult, commitsResult, manifest] = await Promise.all([
    fetchJson<ApiRepo>(GITHUB_API),
    fetchJson<ApiRelease[]>(`${GITHUB_API}/releases?per_page=8`).catch(() => null),
    fetchJson<ApiCommit[]>(`${GITHUB_API}/commits?sha=${GITHUB_BRANCH}&per_page=12`).catch(
      () => null
    ),
    fetchGithubUpdates().catch(() => [] as UpdateEntry[]),
  ]);

  const feed: GithubFeedData = {
    repo: mapRepo(repoResult.data),
    commits: commitsResult ? commitsResult.data.map(mapCommit) : [],
    releases: releasesResult ? releasesResult.data.map(mapRelease) : [],
    manifest,
    fetchedAt: new Date().toISOString(),
    rate: repoResult.rate,
  };
  writeCache(feed);
  return feed;
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export interface PublishResult {
  commitUrl: string;
  contentSha: string;
}

export async function publishGithubFile(options: {
  token: string;
  path: string;
  content: string;
  message: string;
}): Promise<PublishResult> {
  if (!options.token.trim()) throw new Error("Informe um token do GitHub com permissão de Contents.");
  const encodedPath = options.path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const url = `${GITHUB_API}/contents/${encodedPath}`;
  const authHeaders = {
    ...headers(options.token.trim()),
    "content-type": "application/json",
  };

  let sha: string | undefined;
  const existing = await fetch(`${url}?ref=${GITHUB_BRANCH}`, { headers: authHeaders });
  if (existing.ok) {
    const body = (await existing.json()) as { sha?: string };
    sha = body.sha;
  } else if (existing.status !== 404) {
    let detail = "";
    try {
      const body = (await existing.json()) as { message?: string };
      detail = body.message ?? "";
    } catch {
      // sem JSON
    }
    throw new Error(`Não foi possível ler ${options.path}: ${existing.status}${detail ? ` (${detail})` : ""}`);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      message: options.message,
      content: toBase64(options.content),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string };
      detail = body.message ?? "";
    } catch {
      // sem JSON
    }
    throw new Error(`Falha ao publicar ${options.path}: ${response.status}${detail ? ` (${detail})` : ""}`);
  }

  const body = (await response.json()) as {
    commit?: { html_url?: string };
    content?: { sha?: string };
  };
  return {
    commitUrl: body.commit?.html_url ?? "",
    contentSha: body.content?.sha ?? "",
  };
}
