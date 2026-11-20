const OWNER = "Arthurnashh";
const REPOSITORY = "SourceDayZ";
const MAX_MANIFEST_BYTES = 512 * 1024;
const MAX_FILES = 5000;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024 * 1024;

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

export function normalizeManifestUrl(value) {
  let url;
  try { url = new URL(String(value || "").trim()); } catch { fail("Cole o link raw do manifest.json no GitHub."); }
  if (url.protocol !== "https:" || url.hostname !== "raw.githubusercontent.com" || url.port || url.username || url.password || url.search || url.hash) {
    fail("O manifesto precisa estar no repositório público SourceDayZ no GitHub.");
  }

  let parts;
  try { parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent); } catch { fail("O link do manifesto está inválido."); }
  const ref = parts[2];
  if (parts.length !== 6 || parts[0] !== OWNER || parts[1] !== REPOSITORY || !/^[a-f0-9]{40}$/i.test(ref || "") || parts[3] !== "mods" || parts[5] !== "manifest.json" || !/^@[A-Za-z0-9._-]{1,80}$/.test(parts[4])) {
    fail("Use o link raw do manifest.json em um commit do repositório SourceDayZ.");
  }

  const folder = parts[4];
  return {
    folder,
    ref: ref.toLowerCase(),
    url: `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}/${ref.toLowerCase()}/mods/${encodeURIComponent(folder)}/manifest.json`,
  };
}

function fileUrlFromSourcePath(sourcePath, folder, ref) {
  if (typeof sourcePath !== "string" || sourcePath.length > 1000 || sourcePath.includes("\\")) fail("O manifesto contém um caminho de arquivo inválido.");
  const parts = sourcePath.split("/");
  if (parts.length < 3 || parts[0] !== "mods" || parts[1] !== folder || parts.some(part => !part || part === "." || part === ".." || part.includes(":") || !/^[A-Za-z0-9 _@().+-]+$/.test(part)) || folder.slice(1).endsWith(".")) {
    fail("O manifesto contém um caminho fora da pasta do mod.");
  }
  const relative = parts.slice(2).join("/");
  if (!/\.(?:pbo|bisign)$/i.test(relative) && !/^(?:keys\/[^/]+\.bikey|(?:mod|meta)\.cpp)$/i.test(relative)) {
    fail("O manifesto só pode listar arquivos do mod, como PBOs, assinaturas, chaves e metadados.");
  }
  const encodedPath = parts.map(encodeURIComponent).join("/");
  return {
    relative,
    url: `https://media.githubusercontent.com/media/${OWNER}/${REPOSITORY}/${ref}/${encodedPath}`,
  };
}

export function validateManifest(manifest, expectedFolder) {
  if (!manifest || manifest.schemaVersion !== 1 || typeof manifest.id !== "string" || !/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(manifest.id)) {
    fail("O manifest.json não corresponde ao formato Workshop SourceDayZ.");
  }
  const folder = manifest.folder;
  if (!/^@[A-Za-z0-9._-]{1,80}$/.test(folder || "") || folder !== expectedFolder) fail("A pasta declarada no manifesto não corresponde ao link.");
  if (!Array.isArray(manifest.files) || manifest.files.length < 1 || manifest.files.length > MAX_FILES) fail("O manifesto não contém uma lista válida de arquivos do mod.");

  const seen = new Set();
  const files = manifest.files.map(entry => {
    const source = fileUrlFromSourcePath(entry?.sourcePath, folder, manifest.ref);
    if (entry.path !== source.relative || seen.has(source.relative)) fail("O manifesto contém caminhos repetidos ou inconsistentes.");
    seen.add(source.relative);
    const sizeBytes = Number(entry.sizeBytes);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_TOTAL_BYTES) fail("O manifesto contém um tamanho de arquivo inválido.");
    if (typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256)) fail("Cada arquivo precisa ter um hash SHA-256 válido.");
    return { path: source.relative, url: source.url, sizeBytes, sha256: entry.sha256.toLowerCase() };
  });

  const totalSizeBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
  if (totalSizeBytes > MAX_TOTAL_BYTES || Number(manifest.totalSizeBytes) !== totalSizeBytes) fail("O tamanho total declarado no manifesto está inconsistente.");

  return {
    schemaVersion: 1,
    id: manifest.id,
    title: typeof manifest.title === "string" ? manifest.title.slice(0, 120) : folder.slice(1),
    folder,
    totalSizeBytes,
    files,
    folderUrl: `https://github.com/${OWNER}/${REPOSITORY}/tree/${manifest.ref}/mods/${encodeURIComponent(folder)}`,
  };
}

export async function fetchWorkshopManifest(value) {
  const normalized = normalizeManifestUrl(value);
  const response = await fetch(normalized.url, {
    headers: { Accept: "application/json", "User-Agent": "SourceDayZ-Workshop" },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const error = new Error(response.status === 404
      ? "Não foi possível acessar o manifesto. Confirme que o repositório SourceDayZ está público e que o arquivo foi enviado."
      : "O GitHub não conseguiu entregar o manifesto deste mod.");
    error.statusCode = response.status === 404 ? 404 : 502;
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("O GitHub retornou uma resposta vazia para o manifesto.");
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    length += chunk.byteLength;
    if (length > MAX_MANIFEST_BYTES) {
      await reader.cancel();
      throw new Error("O manifesto do mod excede o limite de tamanho.");
    }
    chunks.push(Buffer.from(chunk));
  }

  let manifest;
  try { manifest = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new Error("O GitHub retornou um manifest.json inválido."); }
  return { url: normalized.url, manifest: validateManifest({ ...manifest, ref: normalized.ref }, normalized.folder) };
}
