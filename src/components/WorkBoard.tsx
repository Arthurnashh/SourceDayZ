import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BoardTools } from "./BoardTools";
import { Modal } from "./Modal";
import { Loading, SearchInput } from "./ui";
import {
  fmtDate,
  nextId,
  PRIORITY_LABEL,
  statusLabel,
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

function columnLabel(kind: WorkKind, status: WorkStatus): string {
  if (kind === "tarefa") {
    return { aberto: "Abertas", andamento: "Em andamento", bloqueado: "Bloqueadas", concluido: "Concluídas" }[status];
  }
  return { aberto: "Abertos", andamento: "Em andamento", bloqueado: "Bloqueados", concluido: "Corrigidos" }[status];
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
      window.confirm(
        `Excluir ${item.id} — “${item.titulo}”? Essa ação remove o item deste navegador.`
      )
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
    return <Loading label="Carregando o quadro..." />;
  }

  return (
    <div className="wb">
      <div className="wb-top">
        <div className="wb-title">
          <span className="kicker">
            {kind === "tarefa" ? "quadro de tarefas" : "registro de bugs"}
          </span>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
        <BoardTools store={store} editMode={editMode} onEditMode={setEditMode} />
      </div>

      {store.error && (
        <div className="errorbox">
          A base do quadro não carregou: {store.error}. Você ainda pode criar itens locais e
          exportar.
        </div>
      )}

      <div className="wb-stats">
        <StatBox label="Total" value={stats.total} tone="neutral" />
        <StatBox label="Em andamento" value={stats.andamento} tone="blue" />
        <StatBox label={kind === "tarefa" ? "Abertas" : "Abertos"} value={stats.abertos} tone="amber" />
        <StatBox
          label={kind === "tarefa" ? "Concluídas" : "Corrigidos"}
          value={stats.concluidos}
          tone="lime"
        />
        <StatBox label="Bloqueados" value={stats.bloqueados} tone="violet" />
        <StatBox label="Tentativas registradas" value={stats.tentativas} tone="neutral" />
      </div>

      <div className="wb-toolbar">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder={kind === "tarefa" ? "Buscar tarefa, área, etiqueta..." : "Buscar bug, sintoma, arquivo..."}
        />
        <select value={priority} onChange={(event) => setPriority(event.target.value as "todas" | Priority)}>
          <option value="todas">toda prioridade</option>
          {PRIORITIES.map((value) => (
            <option value={value} key={value}>
              {PRIORITY_LABEL[value]}
            </option>
          ))}
        </select>
        <select value={area} onChange={(event) => setArea(event.target.value)}>
          <option value="todas">toda área</option>
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
            <option value="todas">toda severidade</option>
            {PRIORITIES.map((value) => (
              <option value={value} key={value}>
                {PRIORITY_LABEL[value]}
              </option>
            ))}
          </select>
        )}
        <span className="count">{filtered.length} de {items.length}</span>
        {editMode && (
          <button
            className="wb-btn primary wb-add"
            onClick={() => setFormItem(newItem(kind, items, areas))}
          >
            + {kind === "tarefa" ? "Nova tarefa" : "Novo bug"}
          </button>
        )}
      </div>

      <div className="wb-board">
        {COLUMN_ORDER.map((status) => (
          <section className={`wb-col ${status}`} key={status}>
            <header className="wb-col-head">
              <span className={`wb-dot ${status}`} />
              <strong>{columnLabel(kind, status)}</strong>
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
                    ? "Nenhum item com os filtros atuais."
                    : "Nada aqui."}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {formItem && (
        <Modal
          title={items.some((item) => item.id === formItem.id) ? `Editar ${formItem.id}` : `Novo ${kind}`}
          subtitle={
            kind === "tarefa"
              ? "Descreva o trabalho, a área e o próximo passo."
              : "Descreva o sintoma, onde acontece e como reproduzir."
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
          title={kind === "tarefa" ? "Concluir tarefa" : "Marcar bug como corrigido"}
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
  const resolution = item.desfecho;
  const status = statusLabel(item.kind, item.status);
  return (
    <article className={`wb-card ${item.status} p-${item.prioridade}`}>
      <header className="wb-card-head">
        <span className="wb-id">{item.id}</span>
        <span className={`wb-prio ${item.prioridade}`}>{PRIORITY_LABEL[item.prioridade]}</span>
        {item.kind === "bug" && item.severidade && (
          <span className={`wb-sev ${item.severidade}`}>{PRIORITY_LABEL[item.severidade]}</span>
        )}
        <span className="wb-area">{item.area}</span>
      </header>
      <h4>{item.titulo}</h4>
      {item.descricao && <p>{item.descricao}</p>}
      {item.local && <code className="wb-local">{item.local}</code>}
      {item.passos && (
        <details className="wb-steps">
          <summary>Como reproduzir</summary>
          <p>{item.passos}</p>
        </details>
      )}
      <div className="wb-meta">
        <span className={`wb-status ${item.status}`}>{status}</span>
        {item.responsavel && <span>@{item.responsavel}</span>}
        <span>atualizado {fmtDate(item.atualizadoEm)}</span>
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
            <span>Desfecho registrado</span>
            <small>{resolution.tentativas} tentativa(s)</small>
            <b>{expanded ? "−" : "+"}</b>
          </button>
          {expanded && (
            <dl>
              <div>
                <dt>{item.kind === "bug" ? "O que era" : "O que foi feito"}</dt>
                <dd>{resolution.oQueEra}</dd>
              </div>
              <div>
                <dt>{item.kind === "bug" ? "Como corrigiu" : "Como concluiu"}</dt>
                <dd>{resolution.comoCorrigiu}</dd>
              </div>
              <div>
                <dt>O que usou</dt>
                <dd>{resolution.oQueUsou}</dd>
              </div>
              <div>
                <dt>Tentativas</dt>
                <dd>{resolution.tentativas}</dd>
              </div>
              {resolution.commit && (
                <div>
                  <dt>Commit / PR</dt>
                  <dd>
                    <code>{resolution.commit}</code>
                  </dd>
                </div>
              )}
              <div>
                <dt>Resolvido em</dt>
                <dd>{fmtDate(resolution.resolvidoEm, true)}</dd>
              </div>
            </dl>
          )}
        </div>
      )}
      {editMode && (
        <div className="wb-actions">
          {item.status !== "concluido" && (
            <button className="wb-mini primary" onClick={onResolve}>
              {item.kind === "tarefa" ? "Concluir" : "Corrigir"}
            </button>
          )}
          {item.status === "aberto" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              Iniciar
            </button>
          )}
          {item.status === "andamento" && (
            <button className="wb-mini" onClick={() => onQuickStatus("bloqueado")}>
              Bloquear
            </button>
          )}
          {item.status === "bloqueado" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              Retomar
            </button>
          )}
          {item.status === "concluido" && (
            <button className="wb-mini" onClick={() => onQuickStatus("andamento")}>
              Reabrir
            </button>
          )}
          <button className="wb-mini" onClick={onEdit}>
            Editar
          </button>
          <button className="wb-mini danger" onClick={onDelete}>
            Excluir
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
  const [draft, setDraft] = useState<WorkItem>({ ...item });
  const [tags, setTags] = useState(item.etiquetas.join(", "));
  const [error, setError] = useState<string | null>(null);
  const listId = `wb-areas-${kind}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.titulo.trim()) {
      setError("Informe um título.");
      return;
    }
    if (!draft.descricao.trim()) {
      setError("Descreva o item para que outra pessoa consiga entender.");
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
        <label htmlFor="wb-title">Título *</label>
        <input
          id="wb-title"
          value={draft.titulo}
          autoFocus
          onChange={(event) => setDraft({ ...draft, titulo: event.target.value })}
          placeholder={kind === "tarefa" ? "O que precisa ser feito?" : "Qual é o sintoma?"}
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-desc">Descrição *</label>
        <textarea
          id="wb-desc"
          value={draft.descricao}
          onChange={(event) => setDraft({ ...draft, descricao: event.target.value })}
          placeholder="Contexto, impacto e o que já se sabe."
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-area">Área</label>
          <input
            id="wb-area"
            list={listId}
            value={draft.area}
            onChange={(event) => setDraft({ ...draft, area: event.target.value })}
            placeholder="Animações, UI, Mapa..."
          />
          <datalist id={listId}>
            {areas.map((value) => (
              <option value={value} key={value} />
            ))}
          </datalist>
        </div>
        <div className="wb-field">
          <label htmlFor="wb-owner">Responsável</label>
          <input
            id="wb-owner"
            value={draft.responsavel ?? ""}
            onChange={(event) => setDraft({ ...draft, responsavel: event.target.value })}
            placeholder="quem está tocando"
          />
        </div>
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-priority">Prioridade</label>
          <select
            id="wb-priority"
            value={draft.prioridade}
            onChange={(event) =>
              setDraft({ ...draft, prioridade: event.target.value as Priority })
            }
          >
            {PRIORITIES.map((value) => (
              <option value={value} key={value}>
                {PRIORITY_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="wb-field">
          <label>Status</label>
          {draft.status === "concluido" ? (
            <div className="wb-readonly">
              Concluído — use “Reabrir” no card para voltar ao quadro.
            </div>
          ) : (
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as WorkStatus })
              }
            >
              <option value="aberto">{statusLabel(kind, "aberto")}</option>
              <option value="andamento">{statusLabel(kind, "andamento")}</option>
              <option value="bloqueado">{statusLabel(kind, "bloqueado")}</option>
            </select>
          )}
        </div>
      </div>

      {kind === "bug" && (
        <>
          <div className="wb-grid2">
            <div className="wb-field">
              <label htmlFor="wb-severity">Severidade</label>
              <select
                id="wb-severity"
                value={draft.severidade ?? "media"}
                onChange={(event) =>
                  setDraft({ ...draft, severidade: event.target.value as Priority })
                }
              >
                {PRIORITIES.map((value) => (
                  <option value={value} key={value}>
                    {PRIORITY_LABEL[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="wb-field">
              <label htmlFor="wb-local">Onde acontece</label>
              <input
                id="wb-local"
                value={draft.local ?? ""}
                onChange={(event) => setDraft({ ...draft, local: event.target.value })}
                placeholder="arquivo, RTM, PBO, tela..."
              />
            </div>
          </div>
          <div className="wb-field">
            <label htmlFor="wb-steps">Como reproduzir</label>
            <textarea
              id="wb-steps"
              value={draft.passos ?? ""}
              onChange={(event) => setDraft({ ...draft, passos: event.target.value })}
              placeholder="Passos, item equipado e ação executada."
            />
          </div>
        </>
      )}

      <div className="wb-field">
        <label htmlFor="wb-tags">Etiquetas</label>
        <input
          id="wb-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="separadas por vírgula"
        />
        <span className="wb-hint">Ex.: E7, lanterna, ui.pbo, prioridade alta.</span>
      </div>

      {error && <div className="wb-form-error">{error}</div>}

      <div className="wb-actions-row">
        <button type="button" className="wb-btn ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="wb-btn primary">
          Salvar
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
  const [oQueEra, setOQueEra] = useState(item.desfecho?.oQueEra ?? "");
  const [comoCorrigiu, setComoCorrigiu] = useState(item.desfecho?.comoCorrigiu ?? "");
  const [oQueUsou, setOQueUsou] = useState(item.desfecho?.oQueUsou ?? "");
  const [tentativas, setTentativas] = useState(String(item.desfecho?.tentativas ?? 1));
  const [commit, setCommit] = useState(item.desfecho?.commit ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!oQueEra.trim() || !comoCorrigiu.trim() || !oQueUsou.trim()) {
      setError("Preencha o que era, como corrigiu e o que foi usado.");
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

  const blameLabel = kind === "bug" ? "O que era (sintoma e causa)" : "O que foi feito";
  const fixLabel = kind === "bug" ? "Como foi corrigido" : "Como foi concluído";
  const usedLabel = kind === "bug" ? "O que foi usado para corrigir" : "O que foi usado para concluir";

  return (
    <form className="wb-form" onSubmit={submit}>
      <div className="wb-resolution-intro">
        <strong>
          {kind === "bug"
            ? "Todo bug corrigido precisa de um desfecho completo."
            : "Toda tarefa concluída precisa de um desfecho completo."}
        </strong>
        <p>
          Explique o suficiente para outra pessoa entender o problema e repetir a solução. Esse
          texto fica visível no card e no histórico do projeto.
        </p>
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-what">{blameLabel} *</label>
        <textarea
          id="wb-resolution-what"
          value={oQueEra}
          autoFocus
          onChange={(event) => setOQueEra(event.target.value)}
          placeholder={
            kind === "bug"
              ? "O que o jogador via, qual era a causa medida e onde ela estava."
              : "Qual era o problema ou a pendência e o que precisava ser entregue."
          }
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-how">{fixLabel} *</label>
        <textarea
          id="wb-resolution-how"
          value={comoCorrigiu}
          onChange={(event) => setComoCorrigiu(event.target.value)}
          placeholder="A mudança feita, com arquivo, função ou pacote quando possível."
        />
      </div>

      <div className="wb-field">
        <label htmlFor="wb-resolution-used">{usedLabel} *</label>
        <textarea
          id="wb-resolution-used"
          value={oQueUsou}
          onChange={(event) => setOQueUsou(event.target.value)}
          placeholder="Ferramentas, logs, hashes, builds, restore points, commits e testes."
        />
      </div>

      <div className="wb-grid2">
        <div className="wb-field">
          <label htmlFor="wb-attempts">Tentativas antes de resolver *</label>
          <input
            id="wb-attempts"
            type="number"
            min={1}
            max={999}
            value={tentativas}
            onChange={(event) => setTentativas(event.target.value)}
          />
          <span className="wb-hint">Conte também as tentativas que falharam.</span>
        </div>
        <div className="wb-field">
          <label htmlFor="wb-commit">Commit / PR (opcional)</label>
          <input
            id="wb-commit"
            value={commit}
            onChange={(event) => setCommit(event.target.value)}
            placeholder="SHA, URL do commit ou número do PR"
          />
        </div>
      </div>

      {error && <div className="wb-form-error">{error}</div>}

      <div className="wb-actions-row">
        <button type="button" className="wb-btn ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="wb-btn primary">
          {kind === "bug" ? "Salvar e marcar como corrigido" : "Salvar e concluir"}
        </button>
      </div>
    </form>
  );
}
