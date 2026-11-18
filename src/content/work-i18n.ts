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

  // Tipos de atualização
  kindPatch: { pt: "Patch", en: "Patch", ru: "Патч" },
  kindImplementation: { pt: "Implementação", en: "Implementation", ru: "Реализация" },
  kindBuild: { pt: "Build", en: "Build", ru: "Сборка" },
  kindAnnouncement: { pt: "Anúncio", en: "Announcement", ru: "Анонс" },

  // Ferramentas do quadro
  toolsConfirmImport: {
    pt: "Importar este arquivo e substituir o quadro atual deste navegador? Exporte uma cópia antes se precisar.",
    en: "Import this file and replace the current board in this browser? Export a copy first if you need one.",
    ru: "Импортировать этот файл и заменить текущую доску в этом браузере? Сначала экспортируйте копию, если она нужна.",
  },
  toolsImported: {
    pt: "Arquivo importado. O quadro deste navegador foi substituído.",
    en: "File imported. This browser's board was replaced.",
    ru: "Файл импортирован. Доска в этом браузере заменена.",
  },
  toolsConfirmReset: {
    pt: "Restaurar o quadro base do site? Tarefas, bugs e atualizações adicionados neste navegador serão descartados.",
    en: "Restore the site's base board? Tasks, bugs and updates added in this browser will be discarded.",
    ru: "Восстановить базовую доску сайта? Задачи, баги и обновления, добавленные в этом браузере, будут удалены.",
  },
  toolsResetDone: {
    pt: "Quadro restaurado a partir de data/board.json.",
    en: "Board restored from data/board.json.",
    ru: "Доска восстановлена из data/board.json.",
  },
  toolsErrorToken: {
    pt: "Informe um token do GitHub com permissão Contents: Read and write.",
    en: "Enter a GitHub token with Contents: Read and write permission.",
    ru: "Укажите токен GitHub с разрешением Contents: Read and write.",
  },
  toolsBoardCommit: {
    pt: "chore(site): atualiza quadro de tarefas e bugs",
    en: "chore(site): update task and bug board",
    ru: "chore(site): обновить доску задач и багов",
  },
  toolsBoardPublished: {
    pt: "Board publicado no GitHub.",
    en: "Board published to GitHub.",
    ru: "Доска опубликована в GitHub.",
  },
  toolsUpdatesCommit: {
    pt: "docs(site): publica atualizações curadas",
    en: "docs(site): publish curated updates",
    ru: "docs(site): опубликовать курируемые обновления",
  },
  toolsUpdatesPublished: {
    pt: "Manifesto de atualizações publicado no GitHub.",
    en: "Updates manifest published to GitHub.",
    ru: "Манифест обновлений опубликован в GitHub.",
  },
  toolsBoardMissing: {
    pt: "O repositório ainda não tem {path}. Publique o board primeiro.",
    en: "The repository does not have {path} yet. Publish the board first.",
    ru: "В репозитории ещё нет {path}. Сначала опубликуйте доску.",
  },
  toolsConfirmPull: {
    pt: "Substituir o quadro deste navegador pelo board publicado no GitHub? As alterações locais não publicadas serão perdidas.",
    en: "Replace this browser's board with the board published on GitHub? Unpublished local changes will be lost.",
    ru: "Заменить доску в этом браузере доской, опубликованной в GitHub? Неопубликованные локальные изменения будут потеряны.",
  },
  toolsPulled: {
    pt: "Board sincronizado a partir do GitHub.",
    en: "Board synced from GitHub.",
    ru: "Доска синхронизирована из GitHub.",
  },
  toolsTitleToggleEdit: {
    pt: "Libera os botões de adicionar, editar, concluir e excluir",
    en: "Enables the add, edit, complete and delete buttons",
    ru: "Включает кнопки добавления, редактирования, завершения и удаления",
  },
  toolsEditOn: { pt: "Edição ativa", en: "Editing active", ru: "Редактирование включено" },
  toolsEditOff: { pt: "Ativar edição", en: "Enable editing", ru: "Включить редактирование" },
  toolsImport: { pt: "Importar", en: "Import", ru: "Импорт" },
  toolsExportBoard: { pt: "Exportar board", en: "Export board", ru: "Экспорт доски" },
  toolsExportUpdates: { pt: "Exportar updates", en: "Export updates", ru: "Экспорт обновлений" },
  toolsResetBase: { pt: "Restaurar base", en: "Restore base", ru: "Восстановить базу" },
  toolsViewCommit: { pt: "ver commit ↗", en: "view commit ↗", ru: "открыть коммит ↗" },
  toolsPublishAdvanced: {
    pt: "Publicação avançada · GitHub",
    en: "Advanced publishing · GitHub",
    ru: "Расширенная публикация · GitHub",
  },
  toolsTokenLabel: { pt: "Token do GitHub", en: "GitHub token", ru: "Токен GitHub" },
  toolsTokenHint: {
    pt: "Sem token, use Exportar board e commite o arquivo manualmente.",
    en: "Without a token, use Export board and commit the file manually.",
    ru: "Без токена используйте «Экспорт доски» и закоммитьте файл вручную.",
  },
  toolsPublishing: { pt: "Publicando...", en: "Publishing...", ru: "Публикация..." },
  toolsPublishBoard: {
    pt: "Publicar {path}",
    en: "Publish {path}",
    ru: "Опубликовать {path}",
  },
  toolsPublishUpdates: {
    pt: "Publicar {path}",
    en: "Publish {path}",
    ru: "Опубликовать {path}",
  },
  toolsPulling: { pt: "Puxando...", en: "Pulling...", ru: "Загрузка..." },
  toolsPullBoard: {
    pt: "Puxar board do GitHub",
    en: "Pull board from GitHub",
    ru: "Загрузить доску из GitHub",
  },

  // Registro de atualizações
  updatesKicker: {
    pt: "registro curado · publicado pelo GitHub",
    en: "curated log · published via GitHub",
    ru: "курируемый журнал · публикуется через GitHub",
  },
  updatesTitle: { pt: "Atualizações do projeto", en: "Project updates", ru: "Обновления проекта" },
  updatesLead: {
    pt: "Este é o changelog mantido à mão. Quem tem a source adiciona aqui e publica o arquivo {path} no repositório; o site reconhece o manifesto e os commits automaticamente na aba Feed do GitHub.",
    en: "This is the hand-maintained changelog. Anyone with the source adds entries here and publishes the {path} file to the repository; the site recognizes the manifest and the commits automatically in the GitHub Feed tab.",
    ru: "Это changelog, поддерживаемый вручную. У кого есть исходники, добавляет записи здесь и публикует файл {path} в репозитории; сайт автоматически распознаёт манифест и коммиты на вкладке GitHub Feed.",
  },
  updatesNew: { pt: "+ Nova atualização", en: "+ New update", ru: "+ Новое обновление" },
  updatesExport: { pt: "Exportar updates", en: "Export updates", ru: "Экспорт обновлений" },
  updatesBy: { pt: "por {author}", en: "by {author}", ru: "автор: {author}" },
  updatesReference: { pt: "referência ↗", en: "reference ↗", ru: "ссылка ↗" },
  updatesEmpty: {
    pt: "Nenhuma atualização curada ainda. Ative a edição e adicione a primeira.",
    en: "No curated updates yet. Enable editing and add the first one.",
    ru: "Курируемых обновлений пока нет. Включите редактирование и добавьте первое.",
  },
  updatesPublish: { pt: "Publicar no GitHub", en: "Publish to GitHub", ru: "Опубликовать в GitHub" },
  updatesModalEdit: { pt: "Editar atualização", en: "Edit update", ru: "Редактировать обновление" },
  updatesModalNew: { pt: "Nova atualização", en: "New update", ru: "Новое обновление" },
  updatesModalSubtitle: {
    pt: "O que mudou, quando e em qual versão.",
    en: "What changed, when and in which version.",
    ru: "Что изменилось, когда и в какой версии.",
  },
  updatesFormTitle: { pt: "Título *", en: "Title *", ru: "Заголовок *" },
  updatesFormTitlePh: {
    pt: "Patch V38, build E7, nova frente...",
    en: "Patch V38, build E7, new front...",
    ru: "Патч V38, сборка E7, новое направление...",
  },
  updatesFormSummary: { pt: "Resumo *", en: "Summary *", ru: "Краткое описание *" },
  updatesFormSummaryPh: {
    pt: "O que mudou e qual é o impacto para quem joga.",
    en: "What changed and what is the impact for players.",
    ru: "Что изменилось и как это влияет на игроков.",
  },
  updatesFormDetails: { pt: "Detalhes", en: "Details", ru: "Подробности" },
  updatesFormDetailsPh: {
    pt: "Arquivos, hashes, testes, pendências.",
    en: "Files, hashes, tests, pending items.",
    ru: "Файлы, хеши, тесты, незавершённое.",
  },
  updatesFormType: { pt: "Tipo", en: "Type", ru: "Тип" },
  updatesFormDate: { pt: "Data", en: "Date", ru: "Дата" },
  updatesFormVersion: { pt: "Versão / build", en: "Version / build", ru: "Версия / сборка" },
  updatesFormAuthor: { pt: "Autor", en: "Author", ru: "Автор" },
  updatesFormAuthorPh: { pt: "quem publicou", en: "who published", ru: "кто опубликовал" },
  updatesFormUrl: { pt: "Link de referência", en: "Reference link", ru: "Ссылка" },
  updatesErrTitle: {
    pt: "Informe o título da atualização.",
    en: "Enter the update title.",
    ru: "Укажите заголовок обновления.",
  },
  updatesErrSummary: {
    pt: "Escreva um resumo do que mudou.",
    en: "Write a summary of what changed.",
    ru: "Напишите краткое описание изменений.",
  },
  updatesSave: { pt: "Salvar atualização", en: "Save update", ru: "Сохранить обновление" },
  updatesRemoveConfirm: {
    pt: "Excluir a atualização “{title}”?",
    en: "Delete the update “{title}”?",
    ru: "Удалить обновление «{title}»?",
  },

  // Feed do GitHub
  feedKicker: { pt: "fonte oficial · github", en: "official source · github", ru: "официальный источник · github" },
  feedLead: {
    pt: "Patches e atualizações são reconhecidos direto do repositório. Commits, releases e o manifesto {path} aparecem aqui sem edição manual.",
    en: "Patches and updates are recognized straight from the repository. Commits, releases and the {path} manifest appear here without manual editing.",
    ru: "Патчи и обновления распознаются прямо из репозитория. Коммиты, релизы и манифест {path} появляются здесь без ручного редактирования.",
  },
  feedOpen: { pt: "Abrir no GitHub ↗", en: "Open on GitHub ↗", ru: "Открыть на GitHub ↗" },
  feedLoading: { pt: "Lendo...", en: "Reading...", ru: "Чтение..." },
  feedRefresh: { pt: "Atualizar", en: "Refresh", ru: "Обновить" },
  feedBranch: { pt: "branch {branch}", en: "branch {branch}", ru: "ветка {branch}" },
  feedLastPush: { pt: "último push {date}", en: "last push {date}", ru: "последний push {date}" },
  feedStars: { pt: "{n} estrela(s)", en: "{n} star(s)", ru: "{n} звезда(ы)" },
  feedSynced: { pt: "sincronizado {date}", en: "synced {date}", ru: "синхронизировано {date}" },
  feedError: {
    pt: "Não foi possível ler o GitHub: {error}",
    en: "Could not read GitHub: {error}",
    ru: "Не удалось прочитать GitHub: {error}",
  },
  feedOpenRepo: { pt: "abrir o repositório", en: "open the repository", ru: "открыть репозиторий" },
  feedLoadingLabel: {
    pt: "Lendo commits e releases do GitHub...",
    en: "Reading commits and releases from GitHub...",
    ru: "Чтение коммитов и релизов из GitHub...",
  },
  feedManifestTitle: {
    pt: "Atualizações publicadas no repositório",
    en: "Updates published in the repository",
    ru: "Обновления, опубликованные в репозитории",
  },
  feedManifestEmpty: {
    pt: "O repositório ainda não tem {path}. O feed já mostra commits e releases; para publicar o changelog curado, use Atualizações → Atualizações manuais.",
    en: "The repository does not have {path} yet. The feed already shows commits and releases; to publish the curated changelog, use Updates → Manual updates.",
    ru: "В репозитории ещё нет {path}. Лента уже показывает коммиты и релизы; чтобы опубликовать курируемый changelog, используйте Обновления → Обновления вручную.",
  },
  feedCommitsLabel: { pt: "Commits", en: "Commits", ru: "Коммиты" },
  feedManifestLabel: { pt: "Manifesto", en: "Manifest", ru: "Манифест" },
  feedReleases: { pt: "Releases", en: "Releases", ru: "Релизы" },
  feedOpenRelease: { pt: "abrir release ↗", en: "open release ↗", ru: "открыть релиз ↗" },
  feedRecentCommits: { pt: "Commits recentes", en: "Recent commits", ru: "Последние коммиты" },
  feedNoCommits: {
    pt: "Nenhum commit retornado pela API.",
    en: "No commits returned by the API.",
    ru: "API не вернул ни одного коммита.",
  },
  feedSideKicker: {
    pt: "reconhecimento automático",
    en: "automatic recognition",
    ru: "автоматическое распознавание",
  },
  feedSideTitle: { pt: "O que entra no feed", en: "What enters the feed", ru: "Что попадает в ленту" },
  feedSideCommits: {
    pt: "Commits da branch {branch}",
    en: "Commits from branch {branch}",
    ru: "Коммиты из ветки {branch}",
  },
  feedSideReleases: {
    pt: "Releases publicadas no repositório",
    en: "Releases published in the repository",
    ru: "Релизы, опубликованные в репозитории",
  },
  feedSideManifest: {
    pt: "Manifesto {path} para entradas curadas",
    en: "Manifest {path} for curated entries",
    ru: "Манифест {path} для курируемых записей",
  },
  feedRepoKicker: { pt: "repositório", en: "repository", ru: "репозиторий" },
  feedOwner: { pt: "Owner", en: "Owner", ru: "Владелец" },
  feedBranchLabel: { pt: "Branch", en: "Branch", ru: "Ветка" },
  feedOpenIssues: { pt: "Issues abertas", en: "Open issues", ru: "Открытые issues" },
  feedLastPushLabel: { pt: "Último push", en: "Last push", ru: "Последний push" },
  feedRate: {
    pt: "API do GitHub: {n} requisição(ões) restante(s) nesta hora.",
    en: "GitHub API: {n} request(s) remaining this hour.",
    ru: "API GitHub: {n} запрос(ов) осталось в этот час.",
  },
  feedRateReset: { pt: "Renova {date}.", en: "Renews {date}.", ru: "Обновится {date}." },
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
