import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BoardTools } from "./BoardTools";
import { Modal } from "./Modal";
import { Loading, SearchInput } from "./ui";
import { useWorkT } from "../content/work-i18n";
import {
  fmtDate,
  nextId,
  type Priority,
  type Resolution,
  type WorkItem,
  type WorkKind,
  type WorkStatus,
  type WorkStore,
} from "../lib/work";

const COLUMN_ORDER: WorkStatus[] = ["andamento", "aberto", "bloqueado", "concluido"];
const PRIORITY_RANK: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};
const PRIORITIES: Priority[] = ["critica", "alta", "media", "baixa"];

function columnLabel(kind: WorkKind, status: WorkStatus, t: (key: string) => string): string {
  if (status === "andamento") return t("statusAndamento");
  if (status === "bloqueado") return kind === "tarefa" ? t("colBlockedTask") : t("statusBloqueado");
  if (status === "concluido") return kind === "tarefa" ? t("colTaskDone") : t("colBugDone");
  return kind === "tarefa" ? t("colTaskOpen") : t("colBugOpen");
}

function newItem(kind: WorkKind, items: WorkItem[], areas: string[]): WorkItem {
  const now = new Date().toISOString();
  return {
    id: nextId(kind, items),
    kind,
    titulo: "",
    descricao: "",
    area: areas[0] ?? "Geral",
    status: "aberto",
    prioridade: "media",
    severidade: kind === "bug" ? "media" : undefined,
    local: "",
    passos: "",
    responsavel: "",
    etiquetas: [],
    criadoEm: now,
    atualizadoEm: now,
    origem: "manual",
  };
}

function sortItems(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    const priority = PRIORITY_RANK[a.prioridade] - PRIORITY_RANK[b.prioridade];
    if (priority !== 0) return priority;
    return b.atualizadoEm.localeCompare(a.atualizadoEm);
  });
}

interface WorkBoardProps {
  kind: WorkKind;
  store: WorkStore;
  title: string;
  intro: string;
}

export function WorkBoard({ kind, store, title, intro }: WorkBoardProps) {
  const { t } = useWorkT();
  const prio = (value: Priority) => t(`prio${value.charAt(0).toUpperCase()}${value.slice(1)}`);
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<"todas" | Priority>("todas");
  const [area, setArea] = useState("todas");
  const [severity, setSeverity] = useState<"todas" | Priority>("todas");
  const [editMode, setEditMode] = useState(() => {
    try {
      return localStorage.getItem("sourcedayz.board.edit") === "1";
    } catch {
      return false;
    }
  });
  const [formItem, setFormItem] = useState<WorkItem | null>(null);
  const [resolutionItem, setResolutionItem] = useState<WorkItem | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem("sourcedayz.board.edit", editMode ? "1" : "0");
    } catch {
      // storage opcional
    }
  }, [editMode]);

  const items = useMemo(
    () => (store.state?.items ?? []).filter((item) => item.kind === kind),
    [store.state, kind]
  );
  const areas = useMemo(
    () => Array.from(new Set(items.map((item) => item.area))).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (priority !== "todas" && item.prioridade !== priority) return false;
      if (area !== "todas" && item.area !== area) return false;
      if (kind === "bug" && severity !== "todas" && item.severidade !== severity) return false;
      if (!needle) return true;
      return [
        item.id,
        item.titulo,
        item.descricao,
        item.area,
        item.local,
        item.responsavel,
        item.etiquetas.join(" "),
        item.desfecho?.oQueEra,
        item.desfecho?.comoCorrigiu,
        item.desfecho?.oQueUsou,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, q, priority, area, severity, kind]);

  const grouped = useMemo(() => {
    const map: Record<WorkStatus, WorkItem[]> = {
      aberto: [],
      andamento: [],
      bloqueado: [],
      concluido: [],
    };
    filtered.forEach((item) => map[item.status].push(item));
    COLUMN_ORDER.forEach((status) => {
      map[status] = sortItems(map[status]);
    });
    return map;
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: items.length,
      andamento: items.filter((item) => item.status === "andamento").length,
      abertos: items.filter((item) => item.status === "aberto").length,
      concluidos: items.filter((item) => item.status === "concluido").length,
      bloqueados: items.filter((item) => item.status === "bloqueado").length,
      tentativas: items.reduce((sum, item) => sum + (item.desfecho?.tentativas ?? 0), 0),
    }),
    [items]
  );

  const saveItem = (item: WorkItem) => {
    store.saveItem(item);
  };

  const quickStatus = (item: WorkItem, status: WorkStatus) => {
    store.saveItem({ ...item, status });
  };

  const deleteItem = (item: WorkItem) => {
    if (
      window.confirm(t("confirmDelete", { id: item.id, title: item.titulo }))
    ) {
      store.deleteItem(item.id);
    }
  };

  const saveResolution = (resolution: Resolution) => {
    if (!resolutionItem) return;
    store.saveItem({
      ...resolutionItem,
      status: "concluido",
      desfecho: resolution,
    });
    setResolutionItem(null);
  };

  if (store.loading && !store.state) {
    return <Loading label={t("loading")} />;
  }

  return (
    <div className="wb">
      <div className="wb-top">
        <div className="wb-title">
          <span className="kicker">
            {kind === "tarefa" ? t("kickerTask") : t("kickerBug")}
          </span>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
        <BoardTools store={store} editMode={editMode} onEditMode={setEditMode} />
      </div>

      {store.error && (
        <div className="errorbox">
          {t("errorBase", { error: store.error })}
        </div>
      )}

      <div className="wb-stats">
        <StatBox label={t("statTotal")} value={stats.total} tone="neutral" />
        <StatBox label={t("statProgress")} value={stats.andamento} tone="blue" />
        <StatBox label={kind === "tarefa" ? t("statOpenTask") : t("statOpenBug")} value={stats.abertos} tone="amber" />
        <StatBox
          label={kind === "tarefa" ? t("statDoneTask") : t("statDoneBug")}
          value={stats.concluidos}
          tone="lime"
        />
        <StatBox label={t("statBlocked")} value={stats.bloqueados} tone="violet" />
        <StatBox label={t("statAttempts")} value={stats.tentativas} tone="neutral" />
      </div>

      <div className="wb-toolbar">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder={kind === "tarefa" ? t("searchTask") : t("searchBug")}
        />
        <select value={priority} onChange={(event) => setPriority(event.target.value as "todas" | Priority)}>
          <option value="todas">{t("priorityAll")}</option>
          {PRIORITIES.map((value) => (
            <option value={value} key={value}>
              {prio(value)}
            </option>
          ))}
        </select>
        <select value={area} onChange={(event) => setArea(event.target.value)}>
          <option value="todas">{t("areaAll")}</option>
          {areas.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
        {kind === "bug" && (
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as "todas" | Priority)}
          >
            <option value="todas">{t("severityAll")}</option>
            {PRIORITIES.map((value) => (
              <option value={value} key={value}>
                {prio(value)}
              </option>
            ))}
          </select>
        )}
        <span className="count">{t("count", { n: filtered.length, total: items.length })}</span>
        {editMode && (
          <button
            className="wb-btn primary wb-add"
            onClick={() => setFormItem(newItem(kind, items, areas))}
          >
            + {kind === "tarefa" ? t("newTask") : t("newBug")}
          </button>
        )}
      </div>

      <div className="wb-board">
        {COLUMN_ORDER.map((status) => (
          <section className={`wb-col ${status}`} key={status}>
            <header className="wb-col-head">
              <span className={`wb-dot ${status}`} />
              <strong>{columnLabel(kind, status, t)}</strong>
              <small>{grouped[status].length}</small>
            </header>
            <div className="wb-col-body">
              {grouped[status].map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  editMode={editMode}
                  expanded={Boolean(expanded[item.id])}
                  onToggle={() =>
                    setExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))
                  }
                  onResolve={() => setResolutionItem(item)}
                  onEdit={() => setFormItem({ ...item })}
                  onDelete={() => deleteItem(item)}
                  onQuickStatus={(next) => quickStatus(item, next)}
                />
              ))}
              {grouped[status].length === 0 && (
                <div className="wb-col-empty">
                  {q || priority !== "todas" || area !== "todas" || severity !== "todas"
                    ? t("emptyFiltered")
                    : t("empty")}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {formItem && (
        <Modal
          title={
            items.some((item) => item.id === formItem.id)
              ? t("modalEdit", { id: formItem.id })
              : t("modalNew", { kind: kind === "tarefa" ? t("newTask") : t("newBug") })
          }
          subtitle={
            kind === "tarefa"
              ? t("subtitleTask")
              : t("subtitleBug")
          }
          onClose={() => setFormItem(null)}
        >
          <ItemForm
            item={formItem}
            kind={kind}
            areas={areas}
            onCancel={() => setFormItem(null)}
            onSave={(saved) => {
              saveItem(saved);
              setFormItem(null);
            }}
          />
        </Modal>
      )}

      {resolutionItem && (
        <Modal
          title={kind === "tarefa" ? t("resolveTask") : t("resolveBug")}
          subtitle={`${resolutionItem.id} — ${resolutionItem.titulo}`}
          onClose={() => setResolutionItem(null)}
          wide
        >
          <ResolutionForm
            item={resolutionItem}
            kind={kind}
            onCancel={() => setResolutionItem(null)}
            onSave={saveResolution}
          />
        </Modal>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "blue" | "amber" | "lime" | "violet";
}) {
  return (
    <div className={`wb-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Card({
  item,
  editMode,
  expanded,
  onToggle,
  onResolve,
  onEdit,
  onDelete,
  onQuickStatus,
}: {
  item: WorkItem;
  editMode: boolean;
  expanded: boolean;
  onToggle: () => void;
  onResolve: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQuickStatus: (status: WorkStatus) => void;
}) {
  const { t, locale } = useWorkT();
  const prio = (value: Priority) => t(`prio${value.charAt(0).toUpperCase()}${value.slice(1)}`);
  const status = t(
    item.status === "aberto"
      ? "statusAberto"
      : item.status === "andamento"
        ? "statusAndamento"
        : item.status === "bloqueado"
          ? "statusBloqueado"
          : "statusConcluido"
  );
  const resolution = item.desfecho;
  return (
    <article className={`wb-card ${item.status} p-${item.prioridade}`}>
      <header className="wb-card-head">
        <span className="wb-id">{item.id}</span>
        <span className={`wb-prio ${item.prioridade}`}>{prio(item.prioridade)}</span>
        {item.kind === "bug" && item.severidade && (
          <span className={`wb-sev ${item.severidade}`}>{prio(item.severidade)}</span>
        )}
        <span className="wb-area">{item.area}</span>
      </header>
      <h4>{item.titulo}</h4>
      {item.descricao && <p>{item.descricao}</p>}
      {item.local && <code className="wb-local">{item.local}</code>}
      {item.passos && (
        <details className="wb-steps">
          <summary>{t("reproduce")}</summary>
          <p>{item.passos}</p>
        </details>
      )}
      <div className="wb-meta">
        <span className={`wb-status ${item.status}`}>{status}</span>
        {item.responsavel && <span>@{item.responsavel}</span>}
        <span>{t("updated", { date: fmtDate(item.atualizadoEm, false, locale) })}</span>
      </div>
      {item.etiquetas.length > 0 && (
        <div className="wb-tags">
          {item.etiquetas.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      {resolution && item.status === "concluido" && (
        <div className="wb-resolution">
          <button className="wb-resolution-toggle" onClick={onToggle} aria-expanded={expanded}>
            <span>{t("outcome")}</span>
            <small>{t("attemptsShort", { n: resolution.tentativas })}</small>
            <b>{expanded ? "−" : "+"}</b>
          </button>
          {expanded && (
            <dl>
              <div>
                <dt>{item.kind === "bug" ? t("whatWas") : t("whatDone")}</dt>
                <dd>{resolution.oQueEra}</dd>
              </div>
              <div>
                <dt>{item.kind === "bug" ? t("howFixed") : t("howDone")}</dt>
                <dd>{resolution.comoCorrigiu}</dd>
              </div>
              <div>
                <dt>{t("whatUsed")}</dt>
                <dd>{resolution.oQueUsou}</dd>
              </div>
              <div>
                <dt>{t("fieldAttempts")}</dt>
                <dd>{resolution.tentativas}</dd>
              </div>
              {resolution.commit && (
                <div>
                  <dt>{t("commit")}</dt>
                  <dd>
                    <code>{resolution.commit}</code>
                  </dd>
                </div>
              )}
              <div>
                <dt>{t("resolvedAt")}</dt>
                <dd>{fmtDate(resolution.resolvidoEm, true, locale)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
      {editMode && (
        <div className="wb-actions">
          {item.status !== "concluido" && (
            <button className="wb-mini primary" onClick={onResolve}>
              {item.kind === "tarefa" ? t("actionComplete") : t("actionFix")}
            </button>
          )}
          {item.status === "aberto" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              {t("actionStart")}
            </button>
          )}
          {item.status === "andamento" && (
            <button className="wb-mini" onClick={() => onQuickStatus("bloqueado")}>
              {t("actionBlock")}
            </button>
          )}
          {item.status === "bloqueado" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              {t("actionResume")}
            </button>
          )}
          {item.status === "concluido" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              {t("actionReopen")}
            </button>
          )}
          <button className="wb-mini" onClick={onEdit}>
            {t("actionEdit")}
          </button>
          <button className="wb-mini danger" onClick={onDelete}>
            {t("actionDelete")}
          </button>
        </div>
      )}
    </article>
  );
}

function ItemForm({
  item,
  kind,
  areas,
  onCancel,
  onSave,
}: {
  item: WorkItem;
  kind: WorkKind;
  areas: string[];
  onCancel: () => void;
  onSave: (item: WorkItem) => void;
}) {
  const { t } = useWorkT();
  const prio = (value: Priority) => t(`prio${value.charAt(0).toUpperCase()}${value.slice(1)}`);
  const statusOpt = (value: WorkStatus) =>
    t(value === "aberto" ? "statusAberto" : value === "andamento" ? "statusAndamento" : value === "bloqueado" ? "statusBloqueado" : "statusConcluido");
  const [draft, setDraft] = useState<WorkItem>({ ...item });
  const [tags, setTags] = useState(item.etiquetas.join(", "));
  const [error, setError] = useState<string | null>(null);
  const listId = `wb-areas-${kind}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.titulo.trim()) {
      setError(t("errTitle"));
      return;
    }
    if (!draft.descricao.trim()) {
      setError(t("errDesc"));
      return;
    }
    onSave({
      ...draft,
      titulo: draft.titulo.trim(),
      descricao: draft.descricao.trim(),
      area: draft.area.trim() || "Geral",
      local: draft.local?.trim() || undefined,
      passos: draft.passos?.trim() || undefined,
      responsavel: draft.responsavel?.trim() || undefined,
      etiquetas: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      atualizadoEm: new Date().toISOString(),
    });
  };

  return (
    <form className="wb-form" onSubmit={submit}>
      <div className="wb-field">
        <label htmlFor="wb-title">{t("formTitle")}</label>
        <input
          id="wb-title"
          value={draft.titulo}
          autoFocus
          onChange={(event) => setDraft({ ...draft, titulo: event.target.value })}
          placeholder={kind === "tarefa" ? t("phTitleTask") : t("phTitleBug")}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-desc">{t("formDesc")}</label>
        <textarea
          id="wb-desc"
          value={draft.descricao}
          onChange={(event) => setDraft({ ...draft, descricao: event.target.value })}
          placeholder={t("phDesc")}
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-area">{t("formArea")}</label>
          <input
            id="wb-area"
            list={listId}
            value={draft.area}
            onChange={(event) => setDraft({ ...draft, area: event.target.value })}
            placeholder={t("phArea")}
          />
          <datalist id={listId}>
            {areas.map((value) => (
              <option value={value} key={value} />
            ))}
          </datalist>
        </div>
        <div className="wb-field">
          <label htmlFor="wb-owner">{t("formOwner")}</label>
          <input
            id="wb-owner"
            value={draft.responsavel ?? ""}
            onChange={(event) => setDraft({ ...draft, responsavel: event.target.value })}
            placeholder={t("phOwner")}
          />
        </div>
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-priority">{t("formPriority")}</label>
          <select
            id="wb-priority"
            value={draft.prioridade}
            onChange={(event) =>
              setDraft({ ...draft, prioridade: event.target.value as Priority })
            }
          >
            {PRIORITIES.map((value) => (
              <option value={value} key={value}>
                {prio(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="wb-field">
          <label>{t("formStatus")}</label>
          {draft.status === "concluido" ? (
            <div className="wb-readonly">
              {t("statusDone")}
            </div>
          ) : (
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as WorkStatus })
              }
            >
              <option value="aberto">{statusOpt("aberto")}</option>
              <option value="andamento">{statusOpt("andamento")}</option>
              <option value="bloqueado">{statusOpt("bloqueado")}</option>
            </select>
          )}
        </div>
      </div>

      {kind === "bug" && (
        <>
          <div className="wb-grid2">
            <div className="wb-field">
              <label htmlFor="wb-severity">{t("formSeverity")}</label>
              <select
                id="wb-severity"
                value={draft.severidade ?? "media"}
                onChange={(event) =>
                  setDraft({ ...draft, severidade: event.target.value as Priority })
                }
              >
                {PRIORITIES.map((value) => (
                  <option value={value} key={value}>
                    {prio(value)}
                  </option>
                ))}
              </select>
            </div>
            <div className="wb-field">
              <label htmlFor="wb-local">{t("formWhere")}</label>
              <input
                id="wb-local"
                value={draft.local ?? ""}
                onChange={(event) => setDraft({ ...draft, local: event.target.value })}
                placeholder="file, RTM, PBO, screen..."
              />
            </div>
          </div>
          <div className="wb-field">
            <label htmlFor="wb-steps">{t("formSteps")}</label>
            <textarea
              id="wb-steps"
              value={draft.passos ?? ""}
              onChange={(event) => setDraft({ ...draft, passos: event.target.value })}
              placeholder={t("phSteps")}
            />
          </div>
        </>
      )}

      <div className="wb-field">
        <label htmlFor="wb-tags">{t("formTags")}</label>
        <input
          id="wb-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder={t("phTags")}
        />
        <span className="wb-hint">{t("formTagsHint")}</span>
      </div>

      {error && <div className="wb-form-error">{error}</div>}

      <div className="wb-actions-row">
        <button type="button" className="wb-btn ghost" onClick={onCancel}>
          {t("formCancel")}
        </button>
        <button type="submit" className="wb-btn primary">
          {t("formSave")}
        </button>
      </div>
    </form>
  );
}

function ResolutionForm({
  item,
  kind,
  onCancel,
  onSave,
}: {
  item: WorkItem;
  kind: WorkKind;
  onCancel: () => void;
  onSave: (resolution: Resolution) => void;
}) {
  const t = useWorkT().t;
  const [oQueEra, setOQueEra] = useState(item.desfecho?.oQueEra ?? "");
  const [comoCorrigiu, setComoCorrigiu] = useState(item.desfecho?.comoCorrigiu ?? "");
  const [oQueUsou, setOQueUsou] = useState(item.desfecho?.oQueUsou ?? "");
  const [tentativas, setTentativas] = useState(String(item.desfecho?.tentativas ?? 1));
  const [commit, setCommit] = useState(item.desfecho?.commit ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!oQueEra.trim() || !comoCorrigiu.trim() || !oQueUsou.trim()) {
      setError(t("resError"));
      return;
    }
    const attempts = Math.max(1, Math.round(Number(tentativas) || 1));
    onSave({
      oQueEra: oQueEra.trim(),
      comoCorrigiu: comoCorrigiu.trim(),
      oQueUsou: oQueUsou.trim(),
      tentativas: attempts,
      commit: commit.trim() || undefined,
      resolvidoEm: new Date().toISOString(),
    });
  };

  const blameLabel = kind === "bug" ? t("blameBug") : t("blameTask");
  const fixLabel = kind === "bug" ? t("fixBug") : t("fixTask");
  const usedLabel = kind === "bug" ? t("usedBug") : t("usedTask");

  return (
    <form className="wb-form" onSubmit={submit}>
      <div className="wb-resolution-intro">
        <strong>
          {kind === "bug" ? t("resIntroBug") : t("resIntroTask")}
        </strong>
        <p>{t("resIntroText")}</p>
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-what">{blameLabel} *</label>
        <textarea
          id="wb-resolution-what"
          value={oQueEra}
          autoFocus
          onChange={(event) => setOQueEra(event.target.value)}
          placeholder={kind === "bug" ? t("phBlameBug") : t("phBlameTask")}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-how">{fixLabel} *</label>
        <textarea
          id="wb-resolution-how"
          value={comoCorrigiu}
          onChange={(event) => setComoCorrigiu(event.target.value)}
          placeholder={t("phFix")}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-used">{usedLabel} *</label>
        <textarea
          id="wb-resolution-used"
          value={oQueUsou}
          onChange={(event) => setOQueUsou(event.target.value)}
          placeholder={t("phUsed")}
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-attempts">{t("attemptsLabel")}</label>
          <input
            id="wb-attempts"
            type="number"
            min={1}
            max={999}
            value={tentativas}
            onChange={(event) => setTentativas(event.target.value)}
          />
          <span className="wb-hint">{t("attemptsHint")}</span>
        </div>
        <div className="wb-field">
          <label htmlFor="wb-commit">{t("commitLabel")}</label>
          <input
            id="wb-commit"
            value={commit}
            onChange={(event) => setCommit(event.target.value)}
            placeholder={t("commitPh")}
          />
        </div>
      </div>

      {error && <div className="wb-form-error">{error}</div>}

      <div className="wb-actions-row">
        <button type="button" className="wb-btn ghost" onClick={onCancel}>
          {t("formCancel")}
        </button>
        <button type="submit" className="wb-btn primary">
          {kind === "bug" ? t("saveFix") : t("saveDone")}
        </button>
      </div>
    </form>
  );
}
