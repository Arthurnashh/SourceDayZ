import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useCurrentAccount } from "../lib/accounts";
import { navigate } from "../lib/router";
import {
  WORKSHOP_CATEGORIES,
  canUseWorkshop,
  createWorkshopMod,
  deleteWorkshopComment,
  deleteWorkshopMod,
  downloadWorkshopMod,
  downloadWorkshopVersion,
  formatWorkshopSize,
  loadMyWorkshopMods,
  loadWorkshopCatalog,
  loadWorkshopDetails,
  loadWorkshopRatings,
  loadWorkshopSubscriptions,
  saveWorkshopRating,
  setWorkshopModStatus,
  setWorkshopSubscription,
  submitWorkshopComment,
  updateWorkshopMod,
  workshopCategoryLabel,
  workshopCoverUrl,
  type WorkshopComment,
  type WorkshopDetails,
  type WorkshopMod,
  type WorkshopModInput,
  type WorkshopRating,
  type WorkshopVersion,
  type UploadProgress,
} from "../lib/workshop";
import "../workshop.css";

type Shelf = "explorar" | "biblioteca" | "minhas";
type Sort = "recentes" | "populares" | "avaliados";
type RatedMod = WorkshopRating;

function Icon({ path, size = 18 }: { path: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function ratingFor(modId: string, ratings: RatedMod[]) {
  const entry = ratings.find((rating) => rating.modId === modId);
  return { average: entry?.average ?? 0, count: entry?.count ?? 0 };
}

function Stars({ value, count }: { value: number; count: number }) {
  return (
    <span className="wm-stars" aria-label={count ? "Nota " + value.toFixed(1) + " de 5, " + count + " avaliações" : "Sem avaliações"}>
      <span className="wm-stars-glyph">{[1, 2, 3, 4, 5].map((star) => <i key={star} className={value >= star - 0.35 ? "filled" : ""}>★</i>)}</span>
      <small>{count ? value.toFixed(1) + " · " + count : "Novo"}</small>
    </span>
  );
}

function Avatar({ name, source, small = false }: { name: string; source: string | null; small?: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [source]);
  return (
    <span className={"wm-avatar" + (small ? " small" : "")}>
      {source && !broken ? <img src={source} alt="" onError={() => setBroken(true)} /> : (name.trim()[0] ?? "S").toUpperCase()}
    </span>
  );
}

function Cover({ mod, compact = false }: { mod: WorkshopMod; compact?: boolean }) {
  const url = workshopCoverUrl(mod.coverPath);
  return (
    <div className={"wm-cover" + (compact ? " compact" : "")}>
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <div className="wm-cover-fallback">
          <img src="/media/dayz045/hero-window.jpg" alt="" loading="lazy" />
          <span className="wm-cover-mark">SD</span>
        </div>
      )}
      <span className="wm-cover-category">{workshopCategoryLabel(mod.category)}</span>
      {mod.status !== "published" && <span className="wm-cover-status">{mod.status === "hidden" ? "OCULTO" : "RASCUNHO"}</span>}
    </div>
  );
}

function ModCard({
  mod,
  rating,
  subscribed,
  busy,
  onOpen,
  onSubscribe,
}: {
  mod: WorkshopMod;
  rating: { average: number; count: number };
  subscribed: boolean;
  busy: boolean;
  onOpen: () => void;
  onSubscribe: () => void;
}) {
  return (
    <article className="wm-card">
      <button className="wm-card-open" onClick={onOpen} aria-label={"Abrir " + mod.title}>
        <Cover mod={mod} />
        <span className="wm-card-body">
          <span className="wm-card-title">{mod.title}</span>
          <span className="wm-card-summary">{mod.summary}</span>
          <span className="wm-card-author">
            <Avatar name={mod.ownerName} source={mod.ownerAvatar} small />
            <span>{mod.ownerName}</span>
            <span className="wm-card-dot" />
            <span>v{mod.version}</span>
          </span>
        </span>
      </button>
      <div className="wm-card-foot">
        <Stars value={rating.average} count={rating.count} />
        <span className="wm-card-downloads"><Icon path="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" size={15} />{mod.downloads.toLocaleString("pt-BR")}</span>
        <button
          className={"wm-save" + (subscribed ? " saved" : "")}
          onClick={onSubscribe}
          disabled={busy}
          aria-label={subscribed ? "Remover da biblioteca" : "Adicionar à biblioteca"}
          title={subscribed ? "Na sua biblioteca" : "Adicionar à biblioteca"}
        >
          <Icon path={subscribed ? "m5 12 4 4L19 6" : "M12 5v14m-7-7h14"} size={17} />
        </button>
      </div>
    </article>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="wm-empty">
      <span className="wm-empty-icon"><Icon path="M4 7h16M4 12h16M4 17h16M7 4v16M17 4v16" size={25} /></span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action && <button className="wm-button primary" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

export function WorkshopMods({ modId }: { modId: string | null }) {
  const account = useCurrentAccount();
  const [shelf, setShelf] = useState<Shelf>("explorar");
  const [sort, setSort] = useState<Sort>("recentes");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [catalog, setCatalog] = useState<WorkshopMod[]>([]);
  const [myMods, setMyMods] = useState<WorkshopMod[]>([]);
  const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<RatedMod[]>([]);
  const [details, setDetails] = useState<WorkshopDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsSteamLink, setNeedsSteamLink] = useState(false);
  const [formError, setFormError] = useState("");
  const [reload, setReload] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkshopMod | null>(null);
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const [busyId, setBusyId] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let active = true;
    if (!canUseWorkshop()) {
      setLoading(false);
      setError("O banco do Workshop não está conectado neste ambiente.");
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    const load = async () => {
      try {
        const publicMods = await loadWorkshopCatalog();
        if (!active) return;
        setCatalog(publicMods);

        let mine: WorkshopMod[] = [];
        let subscriptions: string[] = [];
        if (account) {
          [mine, subscriptions] = await Promise.all([
            loadMyWorkshopMods(account.id, account.nome, account.avatar ?? account.steam?.avatar ?? null),
            loadWorkshopSubscriptions(account.id),
          ]);
          if (!active) return;
        } else {
          setMyMods([]);
          setSubscriptionIds([]);
        }

        const allMods = [...publicMods, ...mine];
        const ratingRows = await loadWorkshopRatings(Array.from(new Set(allMods.map((mod) => mod.id))));
        if (!active) return;
        setMyMods(mine);
        setSubscriptionIds(subscriptions);
        setRatings(ratingRows);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar o Workshop.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [account?.id, account?.nome, account?.avatar, reload]);

  useEffect(() => {
    let active = true;
    if (!modId) {
      setDetails(null);
      setDetailLoading(false);
      return () => { active = false; };
    }
    if (!canUseWorkshop()) {
      setDetails(null);
      setDetailLoading(false);
      return () => { active = false; };
    }
    setDetailLoading(true);
    setDetails(null);
    void loadWorkshopDetails(modId)
      .then((data) => { if (active) setDetails(data); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Não foi possível abrir este mod."); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [modId, reload]);

  const visibleMods = useMemo(() => {
    let source = shelf === "minhas"
      ? myMods
      : shelf === "biblioteca"
        ? catalog.filter((mod) => subscriptionIds.includes(mod.id))
        : catalog;
    if (category !== "todos") source = source.filter((mod) => mod.category === category);
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    if (needle) {
      source = source.filter((mod) =>
        [mod.title, mod.summary, mod.description, mod.ownerName, mod.tags.join(" ")]
          .join(" ").toLocaleLowerCase("pt-BR").includes(needle),
      );
    }
    const sorted = [...source];
    if (sort === "populares") sorted.sort((a, b) => b.downloads - a.downloads);
    else if (sort === "avaliados") {
      sorted.sort((a, b) => ratingFor(b.id, ratings).average - ratingFor(a.id, ratings).average);
    } else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [shelf, myMods, catalog, subscriptionIds, category, query, sort, ratings]);

  const detail = details?.mod ?? (modId ? [...catalog, ...myMods].find((mod) => mod.id === modId) ?? null : null);
  const ownsDetail = Boolean(account && detail && account.id === detail.ownerId);
  const isSubscribed = Boolean(detail && subscriptionIds.includes(detail.id));
  const currentRating = details?.ratings[0]?.myRating ?? 0;

  function promptLogin() {
    if (!canUseWorkshop()) {
      setError("O Workshop precisa ser conectado ao Supabase antes de publicar e salvar mods.");
      return;
    }
    setAuthOpen(true);
  }

  function openPublish() {
    setError("");
    setFormError("");
    if (!canUseWorkshop()) return promptLogin();
    if (!account) return promptLogin();
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(mod: WorkshopMod) {
    setError("");
    setFormError("");
    setEditing(mod);
    setFormOpen(true);
  }

  async function toggleSubscription(mod: WorkshopMod) {
    if (!account) return promptLogin();
    const currentlySaved = subscriptionIds.includes(mod.id);
    if (!currentlySaved && !(account.steam?.verificado && account.steam.steamId64)) {
      setNeedsSteamLink(true);
      setError("Para se inscrever, primeiro vincule e verifique sua conta Steam no seu perfil.");
      return;
    }
    setBusyId(mod.id);
    setError("");
    setNeedsSteamLink(false);
    try {
      await setWorkshopSubscription(account.id, mod.id, !currentlySaved);
      setSubscriptionIds((current) => currentlySaved
        ? current.filter((id) => id !== mod.id)
        : [...current, mod.id]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar sua biblioteca.");
    } finally {
      setBusyId("");
    }
  }

  async function saveForm(input: WorkshopModInput) {
    if (!account) return promptLogin();
    setError("");
    setFormError("");
    setUpload({ name: "Preparando publicação...", percent: 0 });
    try {
      if (editing) {
        await updateWorkshopMod(editing, account.id, input, setUpload);
        setFormOpen(false);
        setEditing(null);
        setUpload(null);
        setFormError("");
        setReload((current) => current + 1);
      } else {
        await createWorkshopMod(account.id, input, setUpload);
        setFormOpen(false);
        setUpload(null);
        setFormError("");
        setShelf("minhas");
        setReload((current) => current + 1);
      }
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Não foi possível salvar o mod.");
      setUpload(null);
    }
  }

  async function changeStatus(mod: WorkshopMod) {
    if (!account) return;
    setBusyId(mod.id);
    setError("");
    try {
      await setWorkshopModStatus(mod.id, account.id, mod.status === "hidden" ? "published" : "hidden");
      setReload((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível alterar a publicação.");
    } finally {
      setBusyId("");
    }
  }

  async function removeMod(mod: WorkshopMod) {
    if (!account || !window.confirm("Excluir o mod " + mod.title + " e todos os arquivos enviados? Esta ação não pode ser desfeita.")) return;
    setBusyId(mod.id);
    setError("");
    try {
      await deleteWorkshopMod(mod, account.id);
      setReload((current) => current + 1);
      navigate("workshopMods");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o mod.");
    } finally {
      setBusyId("");
    }
  }

  async function download(mod: WorkshopMod) {
    if (!account) return promptLogin();
    if (!(account.steam?.verificado && account.steam.steamId64)) {
      setNeedsSteamLink(true);
      setError("Para baixar, vincule e verifique sua conta Steam no seu perfil.");
      return;
    }
    setBusyId("download-" + mod.id);
    setError("");
    setNeedsSteamLink(false);
    try {
      if (!subscriptionIds.includes(mod.id)) {
        await setWorkshopSubscription(account.id, mod.id, true);
        setSubscriptionIds((current) => current.includes(mod.id) ? current : [...current, mod.id]);
      }
      await downloadWorkshopMod(mod);
      setReload((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível preparar o download.");
    } finally {
      setBusyId("");
    }
  }

  async function downloadVersion(version: WorkshopVersion) {
    if (!account) return promptLogin();
    if (!(account.steam?.verificado && account.steam.steamId64)) {
      setNeedsSteamLink(true);
      setError("Para baixar, vincule e verifique sua conta Steam no seu perfil.");
      return;
    }
    if (!detail || !subscriptionIds.includes(detail.id)) {
      setError("Inscreva-se no mod antes de baixar uma versão.");
      return;
    }
    try {
      await downloadWorkshopVersion(version);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível preparar o download.");
    }
  }

  async function rate(value: number) {
    if (!account || !detail) return promptLogin();
    setBusyId("rating");
    setError("");
    try {
      await saveWorkshopRating(detail.id, account.id, value);
      setReload((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar sua avaliação.");
    } finally {
      setBusyId("");
    }
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || !detail) return promptLogin();
    if (commentText.trim().length < 2) return;
    setSendingComment(true);
    setError("");
    try {
      await submitWorkshopComment(detail.id, account.id, commentText);
      setCommentText("");
      setReload((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível publicar o comentário.");
    } finally {
      setSendingComment(false);
    }
  }

  async function removeComment(comment: WorkshopComment) {
    if (!window.confirm("Excluir este comentário?")) return;
    try {
      await deleteWorkshopComment(comment.id);
      setReload((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o comentário.");
    }
  }

  function openMod(mod: WorkshopMod) {
    setError("");
    navigate("workshopMods/" + mod.id);
  }

  const allRatings = detail ? ratingFor(detail.id, details?.ratings ?? []) : { average: 0, count: 0 };

  return (
    <div className="sd wm-shell">
      <header className="wm-top">
        <button className="wm-brand" onClick={() => navigate("")} aria-label="SourceDayZ">
          <span className="sd-mark">SD</span>
          <span className="sd-brand-text"><strong>SOURCEDAYZ</strong><small>COMMUNITY MOD WORKSHOP</small></span>
        </button>
        <nav className="wm-top-nav" aria-label="Navegação do Workshop">
          <button className={!modId && shelf === "explorar" ? "active" : ""} onClick={() => { navigate("workshopMods"); setShelf("explorar"); }}>EXPLORAR</button>
          <button className={!modId && shelf === "biblioteca" ? "active" : ""} onClick={() => account ? setShelf("biblioteca") : promptLogin()}>MINHA BIBLIOTECA</button>
          <button className={!modId && shelf === "minhas" ? "active" : ""} onClick={() => account ? setShelf("minhas") : promptLogin()}>MINHAS PUBLICAÇÕES</button>
        </nav>
        <div className="wm-top-actions">
          <LanguageSwitcher compact />
          {account ? (
            <button className="wm-account" onClick={() => navigate("minha-conta")}>
              <Avatar name={account.nome} source={account.avatar ?? account.steam?.avatar ?? null} small />
              <span>{account.nome}</span>
            </button>
          ) : (
            <button className="wm-login" onClick={promptLogin}>ENTRAR</button>
          )}
        </div>
      </header>

      <div className="wm-layout">
        <aside className="wm-sidebar">
          <div className="wm-sidebar-heading">SOURCE / WORKSHOP</div>
          <button className={"wm-side-link" + (!modId && shelf === "explorar" ? " active" : "")} onClick={() => { navigate("workshopMods"); setShelf("explorar"); }}>
            <Icon path="M3 4h8v7H3zM13 4h8v4h-8zM13 10h8v10h-8zM3 13h8v7H3z" /> Descobrir mods
          </button>
          <button className={"wm-side-link" + (shelf === "biblioteca" && !modId ? " active" : "")} onClick={() => account ? setShelf("biblioteca") : promptLogin()}>
            <Icon path="M5 4h14v17H5zM8 8h8M8 12h8M8 16h5" /> Minha biblioteca
            {subscriptionIds.length > 0 && <span className="wm-count">{subscriptionIds.length}</span>}
          </button>
          <button className={"wm-side-link" + (shelf === "minhas" && !modId ? " active" : "")} onClick={() => account ? setShelf("minhas") : promptLogin()}>
            <Icon path="M4 20V5l8-3 8 3v15l-8-3zM12 2v15M7 6h2M15 6h2" /> Minhas publicações
          </button>

          <div className="wm-side-divider" />
          <div className="wm-sidebar-heading">CATEGORIAS</div>
          <button className={"wm-category-link" + (category === "todos" ? " active" : "")} onClick={() => setCategory("todos")}>
            Todas as categorias <span>{shelf === "minhas" ? myMods.length : catalog.length}</span>
          </button>
          {WORKSHOP_CATEGORIES.map((item) => (
            <button key={item.id} className={"wm-category-link" + (category === item.id ? " active" : "")} onClick={() => setCategory(item.id)}>
              {item.label}<span>{(shelf === "minhas" ? myMods : catalog).filter((mod) => mod.category === item.id).length}</span>
            </button>
          ))}
          <div className="wm-sidebar-foot">
            <span className="wm-live-dot" /> Oficina SourceDayZ
            <small>Mods da comunidade em um só lugar.</small>
          </div>
        </aside>

        <main className="wm-main">
          {!modId ? (
            <>
              <section className="wm-hero">
                <img src="/media/dayz045/hero-window.jpg" alt="" />
                <div className="wm-hero-shade" />
                <div className="wm-hero-content">
                  <div className="wm-eyebrow"><span className="wm-live-dot" /> OFICINA DA COMUNIDADE</div>
                  <h1>Mods para <em>sobreviver.</em></h1>
                  <p>Descubra, instale e compartilhe criações feitas por quem vive DayZ.</p>
                  <button className="wm-button primary" onClick={openPublish}>
                    <Icon path="M12 5v14m-7-7h14" /> PUBLICAR UM MOD
                  </button>
                </div>
                <div className="wm-hero-stats">
                  <div><strong>{catalog.length.toLocaleString("pt-BR")}</strong><span>mods publicados</span></div>
                  <div><strong>{subscriptionIds.length.toLocaleString("pt-BR")}</strong><span>na sua biblioteca</span></div>
                </div>
              </section>

              <div className="wm-toolbar">
                <div className="wm-shelf-tabs">
                  <button className={shelf === "explorar" ? "active" : ""} onClick={() => setShelf("explorar")}>Explorar</button>
                  <button className={shelf === "biblioteca" ? "active" : ""} onClick={() => account ? setShelf("biblioteca") : promptLogin()}>Sua biblioteca</button>
                  <button className={shelf === "minhas" ? "active" : ""} onClick={() => account ? setShelf("minhas") : promptLogin()}>Suas publicações</button>
                </div>
                <button className="wm-publish-mobile" onClick={openPublish}><Icon path="M12 5v14m-7-7h14" /> Publicar</button>
              </div>

              <div className="wm-filterbar">
                <label className="wm-search">
                  <Icon path="M20 20l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mods, criadores ou tags" />
                  {query && <button onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
                </label>
                <label className="wm-select-label">
                  <span>CATEGORIA</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="todos">Todas</option>
                    {WORKSHOP_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="wm-select-label">
                  <span>ORDENAR POR</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                    <option value="recentes">Mais recentes</option>
                    <option value="populares">Mais baixados</option>
                    <option value="avaliados">Melhor avaliados</option>
                  </select>
                </label>
              </div>

              {error && <div className="wm-alert" role="alert"><span>{error}</span>{needsSteamLink && <button type="button" onClick={() => navigate("minha-conta")}>VINCULAR STEAM</button>}<button onClick={() => { setError(""); setNeedsSteamLink(false); }} aria-label="Fechar aviso">×</button></div>}
              {loading ? (
                <div className="wm-loading"><span className="wm-spinner" /> Preparando o catálogo...</div>
              ) : visibleMods.length ? (
                <>
                  <div className="wm-results-head">
                    <div><span className="wm-results-kicker">{shelf === "minhas" ? "SUAS CRIAÇÕES" : shelf === "biblioteca" ? "SALVOS PARA MAIS TARDE" : "CATÁLOGO"}</span><h2>{shelf === "minhas" ? "Minhas publicações" : shelf === "biblioteca" ? "Minha biblioteca" : "Explore a oficina"}</h2></div>
                    <span>{visibleMods.length} {visibleMods.length === 1 ? "mod" : "mods"}</span>
                  </div>
                  <div className="wm-grid">
                    {visibleMods.map((mod) => (
                      <ModCard
                        key={mod.id}
                        mod={mod}
                        rating={ratingFor(mod.id, ratings)}
                        subscribed={subscriptionIds.includes(mod.id)}
                        busy={busyId === mod.id}
                        onOpen={() => openMod(mod)}
                        onSubscribe={() => void toggleSubscription(mod)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title={shelf === "minhas" ? "Sua oficina começa aqui" : shelf === "biblioteca" ? "Sua biblioteca está vazia" : query || category !== "todos" ? "Nenhum mod encontrado" : "A oficina está pronta para receber mods"}
                  body={shelf === "minhas" ? "Publique sua primeira criação e compartilhe com a comunidade SourceDayZ." : shelf === "biblioteca" ? "Salve os mods que quer acompanhar e eles aparecem aqui." : query || category !== "todos" ? "Tente outra busca ou escolha uma categoria diferente." : "Quando a comunidade publicar os primeiros arquivos, eles vão aparecer neste catálogo."}
                  action={shelf === "minhas" ? { label: "Publicar meu primeiro mod", onClick: openPublish } : undefined}
                />
              )}
            </>
          ) : (
            <section className="wm-detail-wrap">
              <button className="wm-back" onClick={() => navigate("workshopMods")}><Icon path="M15 18l-6-6 6-6M9 12h12" size={17} /> VOLTAR AO WORKSHOP</button>
              {error && <div className="wm-alert" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Fechar aviso">×</button></div>}
              {detailLoading ? <div className="wm-loading"><span className="wm-spinner" /> Carregando o mod...</div> : detail ? (
                <ModDetail
                  mod={detail}
                  details={details}
                  owns={ownsDetail}
                  subscribed={isSubscribed}
                  currentRating={currentRating}
                  ratingSummary={allRatings}
                  accountId={account?.id ?? null}
                  busyId={busyId}
                  commentText={commentText}
                  sendingComment={sendingComment}
                  onCommentChange={setCommentText}
                  onSubscribe={() => void toggleSubscription(detail)}
                  onDownload={() => void download(detail)}
                  onRate={(value) => void rate(value)}
                  onCommentSubmit={postComment}
                  onDeleteComment={(comment) => void removeComment(comment)}
                  onEdit={() => openEdit(detail)}
                  onDelete={() => void removeMod(detail)}
                  onToggleStatus={() => void changeStatus(detail)}
                  onDownloadVersion={(version) => void downloadVersion(version)}
                />
              ) : (
                <EmptyState title="Mod não encontrado" body="Ele pode ter sido removido ou não está publicado." action={{ label: "Voltar para explorar", onClick: () => navigate("workshopMods") }} />
              )}
            </section>
          )}
        </main>
      </div>

      {authOpen && (
        <div className="wm-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className="wm-auth-modal" role="dialog" aria-modal="true" aria-labelledby="wm-auth-title">
            <button className="wm-modal-close" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button>
            <div className="wm-modal-heading"><span className="wm-eyebrow">IDENTIDADE SOURCEDAYZ</span><h2 id="wm-auth-title">Entre para participar</h2><p>Use sua conta SourceDayZ para publicar e salvar mods na biblioteca.</p></div>
            <AuthPanel compact onSuccess={() => { setAuthOpen(false); setError(""); }} />
          </section>
        </div>
      )}

      {formOpen && account && (
        <ModForm
          initial={editing}
          saving={Boolean(upload)}
          upload={upload}
          externalError={formError}
          onClose={() => { setFormOpen(false); setEditing(null); setUpload(null); }}
          onSave={saveForm}
        />
      )}
    </div>
  );
}

function ModDetail({
  mod,
  details,
  owns,
  subscribed,
  currentRating,
  ratingSummary,
  accountId,
  busyId,
  commentText,
  sendingComment,
  onCommentChange,
  onSubscribe,
  onDownload,
  onRate,
  onCommentSubmit,
  onDeleteComment,
  onEdit,
  onDelete,
  onToggleStatus,
  onDownloadVersion,
}: {
  mod: WorkshopMod;
  details: WorkshopDetails | null;
  owns: boolean;
  subscribed: boolean;
  currentRating: number;
  ratingSummary: { average: number; count: number };
  accountId: string | null;
  busyId: string;
  commentText: string;
  sendingComment: boolean;
  onCommentChange: (value: string) => void;
  onSubscribe: () => void;
  onDownload: () => void;
  onRate: (value: number) => void;
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteComment: (comment: WorkshopComment) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onDownloadVersion: (version: WorkshopVersion) => void;
}) {
  const cover = workshopCoverUrl(mod.coverPath);
  return (
    <div className="wm-detail">
      <div className="wm-detail-hero" style={cover ? { backgroundImage: "linear-gradient(90deg, rgba(6,10,8,.97) 4%, rgba(6,10,8,.78) 58%, rgba(6,10,8,.28)), url(" + JSON.stringify(cover) + ")" } : undefined}>
        <div className="wm-detail-copy">
          <span className="wm-eyebrow"><span className="wm-detail-pill">{workshopCategoryLabel(mod.category)}</span> DAYZ COMMUNITY MOD</span>
          <h1>{mod.title}</h1>
          <p>{mod.summary}</p>
          <div className="wm-detail-author"><Avatar name={mod.ownerName} source={mod.ownerAvatar} /><span><small>PUBLICADO POR</small><strong>{mod.ownerName}</strong></span><i /> <span><small>VERSÃO</small><strong>{mod.version}</strong></span><i /><span><small>ATUALIZADO</small><strong>{shortDate(mod.updatedAt)}</strong></span></div>
        </div>
        <div className="wm-detail-actions">
          <button className="wm-button primary" onClick={onDownload} disabled={busyId === "download-" + mod.id}>
            <Icon path="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
            {busyId === "download-" + mod.id ? "PREPARANDO..." : subscribed ? "BAIXAR MOD" : "INSCREVER-SE E BAIXAR"}
          </button>
          <button className={"wm-button" + (subscribed ? " saved" : "")} onClick={onSubscribe}>
            <Icon path={subscribed ? "m5 12 4 4L19 6" : "M12 5v14m-7-7h14"} />
            {subscribed ? "NA SUA BIBLIOTECA" : "ADICIONAR À BIBLIOTECA"}
          </button>
          {owns && <div className="wm-owner-actions"><button onClick={onEdit}>Editar publicação</button><button onClick={onToggleStatus}>{mod.status === "hidden" ? "Republicar" : "Ocultar"}</button><button className="danger" onClick={onDelete}>Excluir mod</button></div>}
        </div>
      </div>

      <div className="wm-detail-columns">
        <div className="wm-detail-main">
          <section className="wm-panel">
            <div className="wm-panel-heading"><div><span className="wm-results-kicker">SOBRE ESTE MOD</span><h2>Descrição</h2></div><span className="wm-mod-version">DayZ {mod.gameVersion || "—"}</span></div>
            <p className="wm-description">{mod.description}</p>
            {!!mod.tags.length && <div className="wm-tags">{mod.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
          </section>

          <section className="wm-panel">
            <div className="wm-panel-heading"><div><span className="wm-results-kicker">COMO USAR</span><h2>Instalação</h2></div><span className="wm-file-size">{formatWorkshopSize(mod.fileSize)}</span></div>
            <p className="wm-description wm-install">{mod.installation}</p>
            <div className="wm-file-row"><Icon path="M4 4h10l6 6v10H4zM14 4v6h6M8 14h8M8 17h6" /><span><strong>{mod.fileName}</strong><small>{mod.filePath.startsWith("github:") ? "Arquivos individuais no GitHub · " : "Arquivo compactado · "}{formatWorkshopSize(mod.fileSize)}</small></span><button onClick={onDownload} disabled={busyId === "download-" + mod.id}>{subscribed ? (mod.filePath.startsWith("github:") ? "Ver arquivos" : "Baixar") : "Inscrever e baixar"}</button></div>
          </section>

          <section className="wm-panel">
            <div className="wm-panel-heading"><div><span className="wm-results-kicker">VERSÕES</span><h2>Histórico de atualizações</h2></div><span className="wm-version-count">{details?.versions.length ?? 0}</span></div>
            <div className="wm-version-list">
              {details?.versions.length ? details.versions.map((version, index) => (
                <article className="wm-version-row" key={version.id}>
                  <span className={"wm-version-node" + (index === 0 ? " current" : "")}><Icon path="M5 12h14M12 5v14" size={13} /></span>
                  <div><strong>Versão {version.version}{index === 0 && <i>ATUAL</i>}</strong><small>{shortDate(version.createdAt)} · {formatWorkshopSize(version.fileSize)}</small>{version.notes && <p>{version.notes}</p>}</div>
                  {index === 0 && <button className="wm-version-download" onClick={() => version.filePath.startsWith("github:") ? onDownload() : onDownloadVersion(version)} aria-label={"Baixar versão " + version.version}><Icon path="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></button>}
                </article>
              )) : <p className="wm-muted">Nenhuma versão registrada ainda.</p>}
            </div>
          </section>
        </div>

        <aside className="wm-detail-aside">
          <section className="wm-panel wm-rating-panel">
            <span className="wm-results-kicker">AVALIAÇÃO DA COMUNIDADE</span>
            <div className="wm-rating-big">{ratingSummary.count ? ratingSummary.average.toFixed(1) : "—"}<span> / 5</span></div>
            <Stars value={ratingSummary.average} count={ratingSummary.count} />
            <div className="wm-rate-input"><span>Sua nota</span><div>{[1, 2, 3, 4, 5].map((star) => <button key={star} className={currentRating >= star ? "selected" : ""} onClick={() => onRate(star)} aria-label={"Avaliar com " + star + " estrelas"}>★</button>)}</div></div>
          </section>
          <section className="wm-panel wm-stats-panel">
            <span className="wm-results-kicker">DETALHES</span>
            <dl><div><dt>Downloads</dt><dd>{mod.downloads.toLocaleString("pt-BR")}</dd></div><div><dt>Tamanho</dt><dd>{formatWorkshopSize(mod.fileSize)}</dd></div><div><dt>Versão do jogo</dt><dd>{mod.gameVersion || "—"}</dd></div><div><dt>Publicado</dt><dd>{shortDate(mod.createdAt)}</dd></div></dl>
          </section>
        </aside>
      </div>

      <section className="wm-panel wm-comments">
        <div className="wm-panel-heading"><div><span className="wm-results-kicker">FEEDBACK</span><h2>Comentários</h2></div><span className="wm-version-count">{details?.comments.length ?? 0}</span></div>
        <form className="wm-comment-form" onSubmit={onCommentSubmit}>
          <textarea value={commentText} onChange={(event) => onCommentChange(event.target.value)} placeholder={accountId ? "Conte para a comunidade o que achou deste mod" : "Entre para deixar um comentário"} maxLength={2000} rows={3} />
          <div><small>{commentText.length}/2000</small><button className="wm-button primary" type="submit" disabled={!commentText.trim() || sendingComment}>{sendingComment ? "PUBLICANDO..." : "PUBLICAR COMENTÁRIO"}</button></div>
        </form>
        <div className="wm-comment-list">
          {details?.comments.length ? details.comments.map((comment) => (
            <article className="wm-comment" key={comment.id}>
              <Avatar name={comment.authorName} source={comment.authorAvatar} />
              <div><header><strong>{comment.authorName}</strong><time>{shortDate(comment.createdAt)}</time>{(accountId === comment.authorId || owns) && <button onClick={() => onDeleteComment(comment)}>Excluir</button>}</header><p>{comment.body}</p></div>
            </article>
          )) : <p className="wm-muted">Ainda não há comentários. Seja o primeiro a compartilhar sua experiência.</p>}
        </div>
      </section>
    </div>
  );
}

function ModForm({
  initial,
  saving,
  upload,
  externalError,
  onClose,
  onSave,
}: {
  initial: WorkshopMod | null;
  saving: boolean;
  upload: UploadProgress | null;
  externalError: string;
  onClose: () => void;
  onSave: (input: WorkshopModInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<WorkshopMod["category"]>(initial?.category ?? "sobrevivencia");
  const [gameVersion, setGameVersion] = useState(initial?.gameVersion ?? "");
  const [version, setVersion] = useState(initial?.version ?? "1.0.0");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [installation, setInstallation] = useState(initial?.installation ?? "");
  const [releaseNotes, setReleaseNotes] = useState("");
  const existingManifestUrl = initial?.filePath.startsWith("github:") ? initial.filePath.slice("github:".length) : "";
  const [manifestUrl, setManifestUrl] = useState(existingManifestUrl);
  const [cover, setCover] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!initial && !manifestUrl.trim()) return setFormError("Informe o link raw do manifest.json no GitHub antes de publicar.");
    if (initial && manifestUrl.trim() && manifestUrl.trim() !== existingManifestUrl && version.trim() === initial.version) return setFormError("Use um número de versão diferente ao trocar o manifesto do mod.");
    if (cover && cover.size > 10 * 1024 * 1024) return setFormError("A imagem de capa pode ter no máximo 10 MB.");
    await onSave({
      title,
      summary,
      description,
      category,
      gameVersion,
      version,
      tags: tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8),
      installation,
      releaseNotes,
      manifestUrl,
      cover,
    });
  }

  return (
    <div className="wm-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="wm-form-modal" role="dialog" aria-modal="true" aria-labelledby="wm-form-title">
        <header className="wm-form-head"><div><span className="wm-results-kicker">{initial ? "GERENCIAR PUBLICAÇÃO" : "OFICINA DA COMUNIDADE"}</span><h2 id="wm-form-title">{initial ? "Editar mod" : "Publicar um mod"}</h2><p>Compartilhe uma criação para a comunidade SourceDayZ.</p></div><button className="wm-modal-close" onClick={onClose} disabled={saving} aria-label="Fechar">×</button></header>
        <form className="wm-form" onSubmit={(event) => void submit(event)}>
          <div className="wm-form-grid">
            <label><span>Nome do mod *</span><input required minLength={3} maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Sobrevivência expandida" /></label>
            <label><span>Categoria *</span><select required value={category} onChange={(event) => setCategory(event.target.value as WorkshopMod["category"])}>{WORKSHOP_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="wide"><span>Resumo *</span><input required minLength={12} maxLength={220} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Uma frase que apresenta seu mod" /></label>
            <label><span>Versão do mod *</span><input required maxLength={32} value={version} onChange={(event) => setVersion(event.target.value)} placeholder="1.0.0" /></label>
            <label><span>Versão do DayZ</span><input maxLength={40} value={gameVersion} onChange={(event) => setGameVersion(event.target.value)} placeholder="Ex.: 1.28" /></label>
            <label className="wide"><span>Descrição completa *</span><textarea required minLength={20} maxLength={12000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explique o que o mod adiciona e como funciona." /></label>
            <label><span>Tags (separadas por vírgula)</span><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="pvp, mapa, sobrevivência" /></label>
            <label className="wide"><span>Como instalar *</span><textarea required minLength={5} maxLength={3000} rows={3} value={installation} onChange={(event) => setInstallation(event.target.value)} placeholder="Passo a passo para instalar e ativar o mod." /></label>
            <label className="wide"><span>Manifesto do mod no GitHub {initial ? "(opcional)" : "*"}</span><input type="url" value={manifestUrl} onChange={(event) => setManifestUrl(event.target.value)} placeholder="https://raw.githubusercontent.com/Arthurnashh/SourceDayZ/COMMIT_SHA/mods/@MeuMod/manifest.json" required={!initial} /><small>{manifestUrl ? "Os arquivos serão baixados individualmente e fixados neste commit do repositório público SourceDayZ." : initial ? "Cole um novo manifesto para publicar uma versão. Deixe em branco para editar só os dados." : "Envie os arquivos sem compactar para mods/@NomeDoMod/ e cole o link raw do manifest.json usando o SHA completo do commit."}</small></label>
            {initial && <label><span>Notas desta versão</span><textarea maxLength={3000} rows={2} value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} placeholder="O que mudou nesta atualização?" /></label>}
            {!initial && <label><span>Notas da versão inicial</span><input maxLength={3000} value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} placeholder="Resumo opcional da primeira versão" /></label>}
            <label className="wide"><span>Imagem de capa (opcional)</span><input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => setCover(event.target.files?.[0] ?? null)} /><small>{cover ? cover.name + " · " + formatWorkshopSize(cover.size) : initial ? "Escolha uma imagem para trocar a capa atual." : "PNG, JPG, WebP ou AVIF; até 10 MB."}</small></label>
          </div>
          {(formError || externalError) && <div className="wm-alert" role="alert">{formError || externalError}</div>}
          {upload && <div className="wm-upload-progress"><div><span>Enviando {upload.name}</span><strong>{upload.percent}%</strong></div><progress value={upload.percent} max={100} /></div>}
          <footer className="wm-form-actions"><button type="button" className="wm-button" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="wm-button primary" disabled={saving}>{saving ? "VALIDANDO MANIFESTO..." : initial ? "SALVAR ALTERAÇÕES" : "PUBLICAR MOD"}</button></footer>
        </form>
      </section>
    </div>
  );
}

