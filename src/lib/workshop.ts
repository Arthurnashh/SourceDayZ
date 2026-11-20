import { getSupabaseClient } from "./accounts";

export const WORKSHOP_FILE_BUCKET = "workshop-mod-files";
export const WORKSHOP_COVER_BUCKET = "workshop-mod-covers";

export const WORKSHOP_CATEGORIES = [
  { id: "armas", label: "Armas e equipamentos" },
  { id: "mapas", label: "Mapas e locais" },
  { id: "sobrevivencia", label: "Sobrevivência" },
  { id: "veiculos", label: "Veículos" },
  { id: "interface", label: "Interface e HUD" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "outros", label: "Outros" },
] as const;

export type WorkshopCategory = (typeof WORKSHOP_CATEGORIES)[number]["id"];

export interface WorkshopMod {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  title: string;
  summary: string;
  description: string;
  category: WorkshopCategory;
  gameVersion: string;
  version: string;
  tags: string[];
  installation: string;
  coverPath: string | null;
  filePath: string;
  fileName: string;
  fileSize: number;
  downloads: number;
  status: "published" | "draft" | "hidden";
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopVersion {
  id: string;
  version: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  notes: string;
  createdAt: string;
}

export interface WorkshopComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
}

export interface WorkshopRating {
  modId: string;
  average: number;
  count: number;
  myRating: number;
}

export interface WorkshopDetails {
  mod: WorkshopMod | null;
  versions: WorkshopVersion[];
  comments: WorkshopComment[];
  ratings: WorkshopRating[];
}

export interface WorkshopModInput {
  title: string;
  summary: string;
  description: string;
  category: WorkshopCategory;
  gameVersion: string;
  version: string;
  tags: string[];
  installation: string;
  releaseNotes: string;
  manifestUrl: string;
  cover: File | null;
}

export interface UploadProgress {
  name: string;
  percent: number;
}

interface RawMod {
  id: string;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string | null;
  title: string;
  summary: string;
  description: string;
  category: WorkshopCategory;
  game_version: string;
  version: string;
  tags: string[] | null;
  installation: string;
  cover_path: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  download_count: number;
  status?: "published" | "draft" | "hidden";
  created_at: string;
  updated_at: string;
}

interface RawVersion {
  id: string;
  version: string;
  file_path: string;
  file_name: string;
  file_size: number;
  notes: string;
  created_at: string;
}

function clientOrThrow() {
  const client = getSupabaseClient();
  if (!client) throw new Error("O Workshop precisa do Supabase configurado.");
  return client;
}

function mapMod(row: RawMod, fallbackName = "Sobrevivente", fallbackAvatar: string | null = null): WorkshopMod {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name || fallbackName,
    ownerAvatar: row.owner_avatar ?? fallbackAvatar,
    title: row.title,
    summary: row.summary,
    description: row.description,
    category: row.category,
    gameVersion: row.game_version,
    version: row.version,
    tags: Array.isArray(row.tags) ? row.tags : [],
    installation: row.installation,
    coverPath: row.cover_path ?? null,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: Number(row.file_size || 0),
    downloads: Number(row.download_count || 0),
    status: row.status ?? "published",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function workshopError(error: { message?: string; details?: string } | null | undefined): Error {
  const message = [error?.message, error?.details].filter(Boolean).join(" ");
  if (/steam_link_required/i.test(message)) {
    return new Error("Vincule e verifique sua conta Steam no perfil SourceDayZ antes de se inscrever no mod.");
  }
  if (/workshop_subscription_required/i.test(message)) {
    return new Error("Inscreva-se neste mod na Oficina SourceDayZ antes de baixá-lo.");
  }
  if (/not_authenticated/i.test(message)) return new Error("Entre na conta SourceDayZ para continuar.");
  if (/workshop_|schema cache|could not find the function|does not exist/i.test(message)) {
    return new Error("O banco do Workshop ainda não foi configurado. Aplique o arquivo supabase/workshopMods.sql no Supabase.");
  }
  if (/file size|maximum allowed|payload too large|entity too large/i.test(message)) {
    return new Error("O arquivo passou do limite de armazenamento deste projeto Supabase.");
  }
  if (/row-level security|permission denied|not allowed/i.test(message)) {
    return new Error("A permissão do Workshop bloqueou esta ação. Confira se a migração workshopMods.sql foi aplicada.");
  }
  return new Error(message || "Não foi possível concluir a ação no Workshop.");
}

function mapVersion(row: RawVersion): WorkshopVersion {
  return {
    id: row.id,
    version: row.version,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: Number(row.file_size || 0),
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

function newPath(ownerId: string, suffix: string): string {
  return ownerId + "/" + crypto.randomUUID() + "." + suffix;
}

interface ValidatedWorkshopManifest {
  url: string;
  manifest: {
    id: string;
    title: string;
    folder: string;
    totalSizeBytes: number;
    files: Array<{ path: string; url: string; sizeBytes: number; sha256: string }>;
  };
}

async function validateWorkshopManifest(value: string): Promise<ValidatedWorkshopManifest> {
  const response = await fetch("/api/workshop/manifest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: value.trim() }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível validar o manifesto do mod.");
  return result as ValidatedWorkshopManifest;
}

async function uploadCover(ownerId: string, file: File): Promise<string> {
  const client = clientOrThrow();
  const extension =
    file.type === "image/png" ? "png" :
    file.type === "image/avif" ? "avif" :
    file.type === "image/webp" ? "webp" : "jpg";
  const path = newPath(ownerId, extension);
  const { error } = await client.storage.from(WORKSHOP_COVER_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw workshopError(error);
  return path;
}

function bestEffortRemove(bucket: string, paths: string[]): void {
  if (!paths.length) return;
  const client = getSupabaseClient();
  if (client) void client.storage.from(bucket).remove(paths);
}

export async function loadWorkshopCatalog(): Promise<WorkshopMod[]> {
  const client = clientOrThrow();
  const { data, error } = await client.rpc("workshop_list_mods", {
    p_limit: 200,
    p_offset: 0,
  });
  if (error) throw workshopError(error);
  return ((data ?? []) as RawMod[]).map((row) => mapMod(row));
}

export async function loadMyWorkshopMods(
  ownerId: string,
  ownerName: string,
  ownerAvatar: string | null,
): Promise<WorkshopMod[]> {
  const client = clientOrThrow();
  const { data, error } = await client
    .from("workshop_mods")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) throw workshopError(error);
  return ((data ?? []) as RawMod[]).map((row) => mapMod(row, ownerName, ownerAvatar));
}

export async function loadWorkshopSubscriptions(userId: string): Promise<string[]> {
  const client = clientOrThrow();
  const { data, error } = await client
    .from("workshop_subscriptions")
    .select("mod_id")
    .eq("user_id", userId);
  if (error) throw workshopError(error);
  return (data ?? []).map((row) => String(row.mod_id));
}

export async function setWorkshopSubscription(_userId: string, modId: string, subscribed: boolean): Promise<void> {
  const client = clientOrThrow();
  const { error } = await client.rpc("workshop_set_subscription", {
    p_mod_id: modId,
    p_subscribed: subscribed,
  });
  if (error) throw workshopError(error);
}

export async function loadWorkshopRatings(modIds: string[]): Promise<WorkshopRating[]> {
  if (!modIds.length) return [];
  const client = clientOrThrow();
  const { data, error } = await client.rpc("workshop_rating_stats", { p_mod_id: null });
  if (error) throw workshopError(error);
  return (data ?? []).filter((row: Record<string, unknown>) => modIds.includes(String(row.mod_id))).map((row: Record<string, unknown>) => ({
    modId: String(row.mod_id),
    average: Number(row.rating_average || 0),
    count: Number(row.rating_count || 0),
    myRating: Number(row.my_rating || 0),
  } as WorkshopRating));
}

export async function loadWorkshopDetails(modId: string): Promise<WorkshopDetails> {
  const client = clientOrThrow();
  const [modResult, versionsResult, commentsResult, ratingsResult] = await Promise.all([
    client.rpc("workshop_get_mod", { p_mod_id: modId }),
    client.from("workshop_mod_versions").select("*").eq("mod_id", modId).order("created_at", { ascending: false }),
    client.rpc("workshop_public_comments", { p_mod_id: modId }),
    client.rpc("workshop_rating_stats", { p_mod_id: modId }),
  ]);

  if (modResult.error) throw workshopError(modResult.error);
  if (versionsResult.error) throw workshopError(versionsResult.error);
  if (commentsResult.error) throw workshopError(commentsResult.error);
  if (ratingsResult.error) throw workshopError(ratingsResult.error);

  const rawMod = ((modResult.data ?? []) as RawMod[])[0] ?? null;
  const versionRows = (versionsResult.data ?? []) as RawVersion[];
  const comments = (commentsResult.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    authorId: String(row.author_id),
    authorName: String(row.author_name ?? "Sobrevivente"),
    authorAvatar: typeof row.author_avatar === "string" ? row.author_avatar : null,
    body: String(row.body ?? ""),
    createdAt: String(row.created_at),
  }));
  const ratings = (ratingsResult.data ?? []).map((row: Record<string, unknown>) => ({
    modId: String(row.mod_id),
    average: Number(row.rating_average || 0),
    count: Number(row.rating_count || 0),
    myRating: Number(row.my_rating || 0),
  } as WorkshopRating));
  return {
    mod: rawMod ? mapMod(rawMod) : null,
    versions: versionRows.map(mapVersion),
    comments,
    ratings,
  };
}

export async function submitWorkshopComment(modId: string, authorId: string, body: string): Promise<void> {
  const client = clientOrThrow();
  const { error } = await client.from("workshop_comments").insert({
    mod_id: modId,
    author_id: authorId,
    body: body.trim(),
  });
  if (error) throw workshopError(error);
}

export async function deleteWorkshopComment(commentId: string): Promise<void> {
  const client = clientOrThrow();
  const { error } = await client.from("workshop_comments").delete().eq("id", commentId);
  if (error) throw workshopError(error);
}

export async function saveWorkshopRating(modId: string, userId: string, rating: number): Promise<void> {
  const client = clientOrThrow();
  const { error } = await client.from("workshop_ratings").upsert(
    { mod_id: modId, user_id: userId, rating },
    { onConflict: "mod_id,user_id" },
  );
  if (error) throw workshopError(error);
}

export async function downloadWorkshopMod(mod: WorkshopMod): Promise<void> {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  try {
    const client = clientOrThrow();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) throw new Error("Entre novamente na sua conta para baixar este mod.");
    const response = await fetch("/api/workshop/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + sessionData.session.access_token,
      },
      body: JSON.stringify({ modId: mod.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Não foi possível preparar o download deste mod.");
    const target = typeof result.folderUrl === "string" ? result.folderUrl : result.url;
    if (typeof target !== "string" || !target.startsWith("https://")) throw new Error("O servidor não retornou um link de download válido.");
    if (popup) popup.location.href = target;
    else window.location.href = target;
  } catch (error) {
    popup?.close();
    throw error;
  }
}

export async function downloadWorkshopVersion(version: WorkshopVersion): Promise<void> {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  const client = clientOrThrow();
  try {
    const signed = await client.storage.from(WORKSHOP_FILE_BUCKET)
      .createSignedUrl(version.filePath, 90, { download: version.fileName });
    if (signed.error) throw workshopError(signed.error);
    if (popup) popup.location.href = signed.data.signedUrl;
    else window.location.href = signed.data.signedUrl;
  } catch (error) {
    popup?.close();
    throw error;
  }
}

export async function createWorkshopMod(
  ownerId: string,
  input: WorkshopModInput,
  onProgress: (progress: UploadProgress) => void,
): Promise<void> {
  if (!input.manifestUrl.trim()) throw new Error("Informe o link raw do manifest.json do mod no GitHub.");
  const client = clientOrThrow();
  const id = crypto.randomUUID();
  let filePath: string | null = null;
  let coverPath: string | null = null;

  try {
    onProgress({ name: "Validando manifest.json...", percent: 20 });
    const result = await validateWorkshopManifest(input.manifestUrl);
    const manifest = result.manifest;
    filePath = "github:" + result.url;
    onProgress({ name: "Manifesto validado · " + manifest.folder, percent: 85 });
    if (input.cover) coverPath = await uploadCover(ownerId, input.cover);

    const { error: modError } = await client.from("workshop_mods").insert({
      id,
      owner_id: ownerId,
      title: input.title.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      category: input.category,
      game_version: input.gameVersion.trim(),
      version: input.version.trim(),
      tags: input.tags,
      installation: input.installation.trim(),
      cover_path: coverPath,
      file_path: filePath,
      file_name: manifest.folder,
      file_size: manifest.totalSizeBytes,
      status: "published",
    });
    if (modError) throw workshopError(modError);

    const { error: versionError } = await client.from("workshop_mod_versions").insert({
      mod_id: id,
      version: input.version.trim(),
      file_path: filePath,
      file_name: manifest.folder,
      file_size: manifest.totalSizeBytes,
      notes: input.releaseNotes.trim() || "Versão inicial",
      created_by: ownerId,
    });
    if (versionError) {
      await client.from("workshop_mods").delete().eq("id", id);
      throw workshopError(versionError);
    }
  } catch (error) {
    if (coverPath) bestEffortRemove(WORKSHOP_COVER_BUCKET, [coverPath]);
    throw error instanceof Error ? error : new Error("Não foi possível publicar o mod.");
  }
}

export async function updateWorkshopMod(
  mod: WorkshopMod,
  ownerId: string,
  input: WorkshopModInput,
  onProgress: (progress: UploadProgress) => void,
): Promise<void> {
  const client = clientOrThrow();
  let newManifest: ValidatedWorkshopManifest | null = null;
  let newCoverPath: string | null = null;
  let newVersionCreated = false;

  try {
    const currentManifestUrl = mod.filePath.startsWith("github:") ? mod.filePath.slice("github:".length) : "";
    const requestedManifestUrl = input.manifestUrl.trim();
    if (requestedManifestUrl && requestedManifestUrl !== currentManifestUrl) {
      if (input.version.trim() === mod.version) throw new Error("Use um número de versão diferente ao trocar o manifesto do mod.");
      onProgress({ name: "Validando manifest.json...", percent: 20 });
      newManifest = await validateWorkshopManifest(requestedManifestUrl);
      onProgress({ name: "Manifesto validado · " + newManifest.manifest.folder, percent: 85 });
    }
    if (input.cover) newCoverPath = await uploadCover(ownerId, input.cover);

    if (newManifest) {
      const newFilePath = "github:" + newManifest.url;
      const { error: versionError } = await client.from("workshop_mod_versions").insert({
        mod_id: mod.id,
        version: input.version.trim(),
        file_path: newFilePath,
        file_name: newManifest.manifest.folder,
        file_size: newManifest.manifest.totalSizeBytes,
        notes: input.releaseNotes.trim() || "Atualização do mod",
        created_by: ownerId,
      });
      if (versionError) throw workshopError(versionError);
      newVersionCreated = true;
    }

    const patch: Record<string, unknown> = {
      title: input.title.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      category: input.category,
      game_version: input.gameVersion.trim(),
      tags: input.tags,
      installation: input.installation.trim(),
    };
    if (newManifest) {
      patch.version = input.version.trim();
      patch.file_path = "github:" + newManifest.url;
      patch.file_name = newManifest.manifest.folder;
      patch.file_size = newManifest.manifest.totalSizeBytes;
    }
    if (newCoverPath) patch.cover_path = newCoverPath;

    const { error: updateError } = await client.from("workshop_mods")
      .update(patch).eq("id", mod.id).eq("owner_id", ownerId);
    if (updateError) throw workshopError(updateError);
    if (newCoverPath && mod.coverPath) {
      await client.storage.from(WORKSHOP_COVER_BUCKET).remove([mod.coverPath]);
    }
  } catch (error) {
    if (newVersionCreated) {
      await client.from("workshop_mod_versions").delete().eq("mod_id", mod.id).eq("version", input.version.trim());
    }
    if (newCoverPath) bestEffortRemove(WORKSHOP_COVER_BUCKET, [newCoverPath]);
    throw error instanceof Error ? error : new Error("Não foi possível atualizar o mod.");
  }
}

export async function setWorkshopModStatus(
  modId: string,
  ownerId: string,
  status: "published" | "hidden",
): Promise<void> {
  const client = clientOrThrow();
  const { error } = await client.from("workshop_mods")
    .update({ status }).eq("id", modId).eq("owner_id", ownerId);
  if (error) throw workshopError(error);
}

export async function deleteWorkshopMod(mod: WorkshopMod, ownerId: string): Promise<void> {
  const client = clientOrThrow();
  const versionsResult = await client.from("workshop_mod_versions").select("file_path").eq("mod_id", mod.id);
  if (versionsResult.error) throw workshopError(versionsResult.error);

  const paths = new Set<string>([mod.filePath, ...(versionsResult.data ?? []).map(row => String(row.file_path))]
    .filter(path => path && !path.startsWith("github:")));
  const { error } = await client.from("workshop_mods").delete()
    .eq("id", mod.id).eq("owner_id", ownerId);
  if (error) throw workshopError(error);

  if (paths.size) await client.storage.from(WORKSHOP_FILE_BUCKET).remove(Array.from(paths));
  if (mod.coverPath) await client.storage.from(WORKSHOP_COVER_BUCKET).remove([mod.coverPath]);
}

export function workshopCoverUrl(path: string | null): string | null {
  if (!path) return null;
  const client = getSupabaseClient();
  if (!client) return null;
  return client.storage.from(WORKSHOP_COVER_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function formatWorkshopSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return size.toFixed(unit > 0 && size < 10 ? 1 : 0) + " " + units[unit];
}

export function workshopCategoryLabel(category: string): string {
  return WORKSHOP_CATEGORIES.find((item) => item.id === category)?.label ?? "Outros";
}

export function canUseWorkshop(): boolean {
  return Boolean(getSupabaseClient());
}

