import type { Locale } from "../lib/i18n";
import { useLocale } from "../lib/i18n";

type Tri = Record<Locale, string>;

/**
 * Textos do quadro de trabalho (Registro de bugs e Tarefas). Os dados que a
 * equipe digita continuam no idioma original; estes são só os rótulos da UI.
 */
const WORK_COPY: Record<string, Tri> = {
  kickerTask: { pt: "quadro de tarefas", en: "task board", ru: "доска задач" },
  kickerBug: { pt: "registro de bugs", en: "bug log", ru: "журнал багов" },
  errorBase: {
    pt: "A base do quadro não carregou: {error}. Você ainda pode criar itens locais e exportar.",
    en: "The board base did not load: {error}. You can still create local items and export.",
    ru: "База доски не загрузилась: {error}. Вы всё ещё можете создавать локальные элементы и экспортировать.",
  },
  statTotal: { pt: "Total", en: "Total", ru: "Всего" },
  statProgress: { pt: "Em andamento", en: "In progress", ru: "В работе" },
  statOpenTask: { pt: "Abertas", en: "Open", ru: "Открыто" },
  statOpenBug: { pt: "Abertos", en: "Open", ru: "Открыто" },
  statDoneTask: { pt: "Concluídas", en: "Completed", ru: "Завершено" },
  statDoneBug: { pt: "Corrigidos", en: "Fixed", ru: "Исправлено" },
  statBlocked: { pt: "Bloqueados", en: "Blocked", ru: "Заблокировано" },
  statAttempts: { pt: "Tentativas registradas", en: "Recorded attempts", ru: "Записанных попыток" },
  searchTask: { pt: "Buscar tarefa, área, etiqueta...", en: "Search task, area, tag...", ru: "Поиск задачи, области, тега..." },
  searchBug: { pt: "Buscar bug, sintoma, arquivo...", en: "Search bug, symptom, file...", ru: "Поиск бага, симптома, файла..." },
  priorityAll: { pt: "toda prioridade", en: "all priorities", ru: "все приоритеты" },
  areaAll: { pt: "toda área", en: "all areas", ru: "все области" },
  severityAll: { pt: "toda severidade", en: "all severities", ru: "все важности" },
  count: { pt: "{n} de {total}", en: "{n} of {total}", ru: "{n} из {total}" },
  newTask: { pt: "Nova tarefa", en: "New task", ru: "Новая задача" },
  newBug: { pt: "Novo bug", en: "New bug", ru: "Новый баг" },
  emptyFiltered: { pt: "Nenhum item com os filtros atuais.", en: "No items with the current filters.", ru: "Нет элементов с текущими фильтрами." },
  empty: { pt: "Nada aqui.", en: "Nothing here.", ru: "Здесь пусто." },
  modalEdit: { pt: "Editar {id}", en: "Edit {id}", ru: "Редактировать {id}" },
  modalNew: { pt: "Novo {kind}", en: "New {kind}", ru: "Новый {kind}" },
  subtitleTask: {
    pt: "Descreva o trabalho, a área e o próximo passo.",
    en: "Describe the work, the area and the next step.",
    ru: "Опишите работу, область и следующий шаг.",
  },
  subtitleBug: {
    pt: "Descreva o sintoma, onde acontece e como reproduzir.",
    en: "Describe the symptom, where it happens and how to reproduce it.",
    ru: "Опишите симптом, где он проявляется и как воспроизвести.",
  },
  resolveTask: { pt: "Concluir tarefa", en: "Complete task", ru: "Завершить задачу" },
  resolveBug: { pt: "Marcar bug como corrigido", en: "Mark bug as fixed", ru: "Отметить баг исправленным" },
  reproduce: { pt: "Como reproduzir", en: "How to reproduce", ru: "Как воспроизвести" },
  updated: { pt: "atualizado {date}", en: "updated {date}", ru: "обновлено {date}" },
  outcome: { pt: "Desfecho registrado", en: "Outcome recorded", ru: "Результат записан" },
  attemptsShort: { pt: "{n} tentativa(s)", en: "{n} attempt(s)", ru: "{n} попыт(ка/ки)" },
  whatWas: { pt: "O que era", en: "What it was", ru: "Что было" },
  whatDone: { pt: "O que foi feito", en: "What was done", ru: "Что сделано" },
  howFixed: { pt: "Como corrigiu", en: "How it was fixed", ru: "Как исправлено" },
  howDone: { pt: "Como concluiu", en: "How it was completed", ru: "Как завершено" },
  whatUsed: { pt: "O que usou", en: "What was used", ru: "Что использовалось" },
  fieldAttempts: { pt: "Tentativas", en: "Attempts", ru: "Попытки" },
  resolvedAt: { pt: "Resolvido em", en: "Resolved at", ru: "Решено" },
  commit: { pt: "Commit / PR", en: "Commit / PR", ru: "Коммит / PR" },
  actionComplete: { pt: "Concluir", en: "Complete", ru: "Завершить" },
  actionFix: { pt: "Corrigir", en: "Fix", ru: "Исправить" },
  actionStart: { pt: "Iniciar", en: "Start", ru: "Начать" },
  actionBlock: { pt: "Bloquear", en: "Block", ru: "Блокировать" },
  actionResume: { pt: "Retomar", en: "Resume", ru: "Возобновить" },
  actionReopen: { pt: "Reabrir", en: "Reopen", ru: "Переоткрыть" },
  actionEdit: { pt: "Editar", en: "Edit", ru: "Редактировать" },
  actionDelete: { pt: "Excluir", en: "Delete", ru: "Удалить" },
  confirmDelete: {
    pt: "Excluir {id} — “{title}”? Essa ação remove o item deste navegador.",
    en: "Delete {id} — “{title}”? This removes the item from this browser.",
    ru: "Удалить {id} — «{title}»? Действие удалит элемент из этого браузера.",
  },
  loading: { pt: "Carregando o quadro...", en: "Loading the board...", ru: "Загрузка доски..." },
  formTitle: { pt: "Título *", en: "Title *", ru: "Заголовок *" },
  formDesc: { pt: "Descrição *", en: "Description *", ru: "Описание *" },
  formArea: { pt: "Área", en: "Area", ru: "Область" },
  formOwner: { pt: "Responsável", en: "Owner", ru: "Ответственный" },
  formPriority: { pt: "Prioridade", en: "Priority", ru: "Приоритет" },
  formStatus: { pt: "Status", en: "Status", ru: "Статус" },
  formSeverity: { pt: "Severidade", en: "Severity", ru: "Важность" },
  formWhere: { pt: "Onde acontece", en: "Where it happens", ru: "Где происходит" },
  formSteps: { pt: "Como reproduzir", en: "How to reproduce", ru: "Как воспроизвести" },
  formTags: { pt: "Etiquetas", en: "Tags", ru: "Теги" },
  formTagsHint: {
    pt: "Ex.: E7, lanterna, ui.pbo, prioridade alta.",
    en: "E.g. E7, flashlight, ui.pbo, high priority.",
    ru: "Напр. E7, фонарь, ui.pbo, высокий приоритет.",
  },
  formCancel: { pt: "Cancelar", en: "Cancel", ru: "Отмена" },
  formSave: { pt: "Salvar", en: "Save", ru: "Сохранить" },
  errTitle: { pt: "Informe um título.", en: "Enter a title.", ru: "Укажите заголовок." },
  errDesc: {
    pt: "Descreva o item para que outra pessoa consiga entender.",
    en: "Describe the item so someone else can understand it.",
    ru: "Опишите элемент так, чтобы другой человек понял.",
  },
  statusDone: {
    pt: "Concluído — use “Reabrir” no card para voltar ao quadro.",
    en: "Completed — use “Reopen” on the card to return it to the board.",
    ru: "Завершено — используйте «Переоткрыть» на карточке, чтобы вернуть в доску.",
  },
  phTitleTask: { pt: "O que precisa ser feito?", en: "What needs to be done?", ru: "Что нужно сделать?" },
  phTitleBug: { pt: "Qual é o sintoma?", en: "What is the symptom?", ru: "В чём симптом?" },
  phDesc: {
    pt: "Contexto, impacto e o que já se sabe.",
    en: "Context, impact and what is already known.",
    ru: "Контекст, влияние и что уже известно.",
  },
  phArea: { pt: "Animações, UI, Mapa...", en: "Animations, UI, Map...", ru: "Анимации, UI, Карта..." },
  phOwner: { pt: "quem está tocando", en: "who is working on it", ru: "кто занимается" },
  phSteps: {
    pt: "Passos, item equipado e ação executada.",
    en: "Steps, equipped item and action performed.",
    ru: "Шаги, надетый предмет и выполненное действие.",
  },
  phTags: { pt: "separadas por vírgula", en: "comma separated", ru: "через запятую" },
  blameBug: { pt: "O que era (sintoma e causa)", en: "What it was (symptom and cause)", ru: "Что было (симптом и причина)" },
  blameTask: { pt: "O que foi feito", en: "What was done", ru: "Что сделано" },
  fixBug: { pt: "Como foi corrigido", en: "How it was fixed", ru: "Как исправлено" },
  fixTask: { pt: "Como foi concluído", en: "How it was completed", ru: "Как завершено" },
  usedBug: { pt: "O que foi usado para corrigir", en: "What was used to fix it", ru: "Что использовалось для исправления" },
  usedTask: { pt: "O que foi usado para concluir", en: "What was used to complete it", ru: "Что использовалось для завершения" },
  resIntroBug: {
    pt: "Todo bug corrigido precisa de um desfecho completo.",
    en: "Every fixed bug needs a complete outcome.",
    ru: "Каждый исправленный баг требует полного результата.",
  },
  resIntroTask: {
    pt: "Toda tarefa concluída precisa de um desfecho completo.",
    en: "Every completed task needs a complete outcome.",
    ru: "Каждая завершённая задача требует полного результата.",
  },
  resIntroText: {
    pt: "Explique o suficiente para outra pessoa entender o problema e repetir a solução. Esse texto fica visível no card e no histórico do projeto.",
    en: "Explain enough for someone else to understand the problem and repeat the solution. This text stays visible on the card and in the project history.",
    ru: "Объясните достаточно, чтобы другой человек понял проблему и повторил решение. Текст остаётся на карточке и в истории проекта.",
  },
  phBlameBug: {
    pt: "O que o jogador via, qual era a causa medida e onde ela estava.",
    en: "What the player saw, what the measured cause was and where it was.",
    ru: "Что видел игрок, какова измеренная причина и где она находилась.",
  },
  phBlameTask: {
    pt: "Qual era o problema ou a pendência e o que precisava ser entregue.",
    en: "What the problem or pending item was and what had to be delivered.",
    ru: "В чём была проблема или незавершённое и что нужно было сделать.",
  },
  phFix: {
    pt: "A mudança feita, com arquivo, função ou pacote quando possível.",
    en: "The change made, with file, function or package when possible.",
    ru: "Сделанное изменение, с файлом, функцией или пакетом, когда возможно.",
  },
  phUsed: {
    pt: "Ferramentas, logs, hashes, builds, restore points, commits e testes.",
    en: "Tools, logs, hashes, builds, restore points, commits and tests.",
    ru: "Инструменты, логи, хеши, сборки, точки восстановления, коммиты и тесты.",
  },
  attemptsLabel: {
    pt: "Tentativas antes de resolver *",
    en: "Attempts before solving *",
    ru: "Попыток до решения *",
  },
  attemptsHint: {
    pt: "Conte também as tentativas que falharam.",
    en: "Count the failed attempts too.",
    ru: "Считайте и неудачные попытки.",
  },
  commitLabel: { pt: "Commit / PR (opcional)", en: "Commit / PR (optional)", ru: "Коммит / PR (необязательно)" },
  commitPh: {
    pt: "SHA, URL do commit ou número do PR",
    en: "SHA, commit URL or PR number",
    ru: "SHA, URL коммита или номер PR",
  },
  resError: {
    pt: "Preencha o que era, como corrigiu e o que foi usado.",
    en: "Fill in what it was, how it was fixed and what was used.",
    ru: "Заполните, что было, как исправлено и что использовалось.",
  },
  saveFix: {
    pt: "Salvar e marcar como corrigido",
    en: "Save and mark as fixed",
    ru: "Сохранить и отметить исправленным",
  },
  saveDone: { pt: "Salvar e concluir", en: "Save and complete", ru: "Сохранить и завершить" },
  prioBaixa: { pt: "Baixa", en: "Low", ru: "Низкий" },
  prioMedia: { pt: "Média", en: "Medium", ru: "Средний" },
  prioAlta: { pt: "Alta", en: "High", ru: "Высокий" },
  prioCritica: { pt: "Crítica", en: "Critical", ru: "Критический" },
  statusAberto: { pt: "Aberto", en: "Open", ru: "Открыто" },
  statusAndamento: { pt: "Em andamento", en: "In progress", ru: "В работе" },
  statusBloqueado: { pt: "Bloqueado", en: "Blocked", ru: "Заблокировано" },
  statusConcluido: { pt: "Concluído", en: "Completed", ru: "Завершено" },
  colTaskOpen: { pt: "Abertas", en: "Open", ru: "Открыто" },
  colTaskDone: { pt: "Concluídas", en: "Completed", ru: "Завершено" },
  colBugOpen: { pt: "Abertos", en: "Open", ru: "Открыто" },
  colBugDone: { pt: "Corrigidos", en: "Fixed", ru: "Исправлено" },
  colBlockedTask: { pt: "Bloqueadas", en: "Blocked", ru: "Заблокировано" },
};

export function useWorkT() {
  const { locale } = useLocale();

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const entry = WORK_COPY[key];
    let text = entry?.[locale] ?? entry?.pt ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };

  return { t, locale };
}
