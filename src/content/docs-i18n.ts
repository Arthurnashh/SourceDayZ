import { useLocale, type Locale } from "../lib/i18n";

type Tri = Record<Locale, string>;

/**
 * Textos da interface do explorador da source. O acervo técnico em si
 * (artigos, funções, achados e comentários) continua em PT-BR/EN original;
 * estes textos cobrem navegação, cabeçalhos, filtros e rótulos.
 */
export const DOCS_COPY: Record<string, Tri> = {
  // Navegação
  "nav.group.estudo": { pt: "estudo", en: "study", ru: "изучение" },
  "nav.group.codigo": { pt: "código", en: "code", ru: "код" },
  "nav.group.projeto": { pt: "projeto", en: "project", ru: "проект" },
  "nav.group.dados": { pt: "dados", en: "data", ru: "данные" },

  "nav.visao-geral": { pt: "Visão geral", en: "Overview", ru: "Обзор" },
  "nav.documento": { pt: "Documento", en: "Document", ru: "Документ" },
  "nav.fonte": { pt: "Código-fonte", en: "Source code", ru: "Исходный код" },
  "nav.motor": { pt: "Motor", en: "Engine", ru: "Движок" },
  "nav.diagrama": { pt: "Diagrama", en: "Diagram", ru: "Диаграмма" },
  "nav.linguagens": { pt: "Linguagens", en: "Languages", ru: "Языки" },
  "nav.funcoes": { pt: "Funções", en: "Functions", ru: "Функции" },
  "nav.comentarios": { pt: "Comentários", en: "Comments", ru: "Комментарии" },
  "nav.patches": { pt: "Patches", en: "Patches", ru: "Патчи" },
  "nav.achados": { pt: "Achados", en: "Findings", ru: "Находки" },
  "nav.bugs": { pt: "Bugs", en: "Bugs", ru: "Баги" },
  "nav.passo-a-passo": { pt: "Passo a passo", en: "Step by step", ru: "Пошагово" },
  "nav.atualizacoes": { pt: "Atualizações", en: "Updates", ru: "Обновления" },
  "nav.pendencias": { pt: "Pendências", en: "Pending", ru: "Незавершённое" },
  "nav.dicionario": { pt: "Dicionário", en: "Dictionary", ru: "Словарь" },
  "nav.plano": { pt: "Objetivo e plano", en: "Objective & plan", ru: "Цель и план" },
  "nav.ferramentas": { pt: "Ferramentas", en: "Tools", ru: "Инструменты" },

  // Layout
  "layout.studyOfSource": { pt: "Estudo da source", en: "Source study", ru: "Изучение исходников" },
  "layout.menu": { pt: "Menu", en: "Menu", ru: "Меню" },
  "layout.home": { pt: "Voltar à página inicial", en: "Back to home", ru: "На главную" },
  "layout.localBase": { pt: "base local", en: "local copy", ru: "локальная копия" },
  "layout.footer": {
    pt: "Dados extraídos do código-fonte em SOURCE DEFINITIVA\\DayZ-0.45.124252 e do estudo 1.md. Traduções automáticas por glossário; entradas marcadas curado são revisão manual.",
    en: "Data extracted from the source in SOURCE DEFINITIVA\\DayZ-0.45.124252 and from the 1.md study. Automatic glossary translations; entries marked curated are manually reviewed.",
    ru: "Данные извлечены из исходников в SOURCE DEFINITIVA\\DayZ-0.45.124252 и из исследования 1.md. Автоматический перевод по глоссарию; записи с пометкой «curado» проверены вручную."
  },
  "layout.functions": { pt: "funções", en: "functions", ru: "функций" },
  "layout.comments": { pt: "comentários", en: "comments", ru: "комментариев" },

  // Comuns
  "common.loadingData": { pt: "Carregando dados...", en: "Loading data...", ru: "Загрузка данных..." },
  "common.error": { pt: "Falha", en: "Error", ru: "Ошибка" },
  "common.search": { pt: "Buscar...", en: "Search...", ru: "Поиск..." },
  "common.clear": { pt: "Limpar", en: "Clear", ru: "Очистить" },
  "common.copy": { pt: "copiar", en: "copy", ru: "копировать" },
  "common.copyCommand": { pt: "Copiar comando", en: "Copy command", ru: "Копировать команду" },
  "common.previous": { pt: "← anterior", en: "← previous", ru: "← назад" },
  "common.next": { pt: "próxima →", en: "next →", ru: "вперёд →" },
  "common.pageOf": { pt: "página {page} de {pages}", en: "page {page} of {pages}", ru: "страница {page} из {pages}" },
  "common.results": { pt: "{n} resultado(s)", en: "{n} result(s)", ru: "{n} результат(ов)" },
  "common.all": { pt: "todas", en: "all", ru: "все" },
  "common.code": { pt: "código", en: "code", ru: "код" },
  "common.files": { pt: "arquivos", en: "files", ru: "файлов" },
  "common.lines": { pt: "linhas", en: "lines", ru: "строк" },
  "common.level": { pt: "nível", en: "level", ru: "уровень" },
  "common.line": { pt: "linha", en: "line", ru: "строка" },
  "common.back": { pt: "← voltar", en: "← back", ru: "← назад" },
  "common.viewAll": { pt: "ver todos →", en: "view all →", ru: "все →" },
  "common.loadMore": { pt: "carregar mais ({n} restantes)", en: "load more ({n} remaining)", ru: "загрузить ещё (осталось {n})" },
  "common.original": { pt: "Original (EN)", en: "Original (EN)", ru: "Оригинал (EN)" },
  "common.translation": { pt: "Tradução (PT-BR)", en: "Translation (PT-BR)", ru: "Перевод (PT-BR)" },
  "common.curated": { pt: "curado", en: "curated", ru: "проверено" },
  "common.whatItDoes": { pt: "O que faz:", en: "What it does:", ru: "Что делает:" },
  "common.status": { pt: "status", en: "status", ru: "статус" },
  "common.severity": { pt: "severidade", en: "severity", ru: "важность" },
  "common.category": { pt: "categoria", en: "category", ru: "категория" },
  "common.type": { pt: "tipo", en: "type", ru: "тип" },

  // Rótulos dos dados de achados e bugs
  "data.field.Local": { pt: "Local", en: "Location", ru: "Место" },
  "data.field.Problema": { pt: "Problema", en: "Problem", ru: "Проблема" },
  "data.field.Impacto": { pt: "Impacto", en: "Impact", ru: "Влияние" },
  "data.field.Suspeito": { pt: "Suspeito", en: "Suspect", ru: "Подозрение" },
  "data.field.Evidência": { pt: "Evidência", en: "Evidence", ru: "Доказательство" },
  "data.field.Como confirmar": { pt: "Como confirmar", en: "How to confirm", ru: "Как подтвердить" },
  "data.field.Correção candidata": { pt: "Correção candidata", en: "Candidate fix", ru: "Возможное исправление" },
  "data.field.Melhoria": { pt: "Melhoria", en: "Improvement", ru: "Улучшение" },
  "data.field.Onde": { pt: "Onde", en: "Where", ru: "Где" },
  "data.field.Custo": { pt: "Custo", en: "Cost", ru: "Стоимость" },
  "data.field.Ganho visual": { pt: "Ganho visual", en: "Visual gain", ru: "Визуальный выигрыш" },
  "data.field.Arquivo": { pt: "Arquivo", en: "File", ru: "Файл" },
  "data.field.Tag": { pt: "Tag", en: "Tag", ru: "Тег" },

  "data.origin.achado": { pt: "achado", en: "finding", ru: "находка" },
  "data.origin.comentário": { pt: "comentário", en: "comment", ru: "комментарий" },

  "data.severity.alta": { pt: "alta", en: "high", ru: "высокая" },
  "data.severity.média": { pt: "média", en: "medium", ru: "средняя" },
  "data.severity.baixa": { pt: "baixa", en: "low", ru: "низкая" },
  "data.severity.melhoria": { pt: "melhoria", en: "improvement", ru: "улучшение" },

  "data.category.render": { pt: "Render / DX11", en: "Render / DX11", ru: "Рендер / DX11" },
  "data.category.rede": { pt: "Rede / servidor", en: "Network / server", ru: "Сеть / сервер" },
  "data.category.terreno": { pt: "Terreno / clutter", en: "Terrain / clutter", ru: "Ландшафт / clutter" },
  "data.category.ia": { pt: "IA / infectados", en: "AI / infected", ru: "ИИ / заражённые" },
  "data.category.fisica": { pt: "Física / colisão", en: "Physics / collision", ru: "Физика / коллизия" },
  "data.category.streaming": { pt: "Streaming / IO", en: "Streaming / IO", ru: "Стриминг / IO" },
  "data.category.script": { pt: "Script VM / gameplay", en: "Script VM / gameplay", ru: "Script VM / геймплей" },
  "data.category.ui": { pt: "UI / HUD", en: "UI / HUD", ru: "UI / HUD" },
  "data.category.som": { pt: "Som / áudio", en: "Sound / audio", ru: "Звук / аудио" },
  "data.category.outros": { pt: "Outros", en: "Other", ru: "Другое" },

  "data.bugType.arquitetura": { pt: "arquitetura", en: "architecture", ru: "архитектура" },
  "data.bugType.hipotese/risco": { pt: "hipótese/risco", en: "hypothesis/risk", ru: "гипотеза/риск" },
  "data.bugType.glossario": { pt: "glossário", en: "glossary", ru: "глоссарий" },

  // Aviso do acervo técnico
  "docs.corpusNote": {
    pt: "O acervo técnico desta seção está em português. Os comentários da source mostram o original em inglês e a tradução PT-BR; a tradução completa para EN/RU será publicada em uma próxima etapa.",
    en: "The technical corpus in this section is currently in Portuguese. Source comments show the original English and the PT-BR translation; full EN/RU translations will be published in a later step.",
    ru: "Технический корпус этого раздела пока на португальском. Комментарии к исходникам показывают оригинал на английском и перевод PT-BR; полный перевод на EN/RU будет опубликован позже."
  },
  "docs.corpusNoteShort": {
    pt: "Conteúdo técnico em PT-BR",
    en: "Technical content in PT-BR",
    ru: "Технический контент на PT-BR"
  },
  "docs.corpusBanner": {
    pt: "",
    en: "The interface is in English. The deep technical articles are being translated from Portuguese — untranslated sections open in the original PT-BR.",
    ru: "Интерфейс на русском. Глубокие технические статьи переводятся с португальского — непереведённые разделы открываются в оригинале на PT-BR."
  },
  "docs.translated": {
    pt: "",
    en: "This article has an English version.",
    ru: "Эта статья переведена на русский."
  },

  // Visão geral
  "overview.kicker": { pt: "código-fonte original · patches compilados", en: "original source code · compiled patches", ru: "исходный код · собранные патчи" },
  "overview.title1": { pt: "Toda a source do DayZ,", en: "The entire DayZ source,", ru: "Весь исходный код DayZ," },
  "overview.title2": { pt: "função por função.", en: "function by function.", ru: "функция за функцией." },
  "overview.lead": {
    pt: "O projeto real da Bohemia Interactive em SOURCE DEFINITIVA: cada função lida, cada comentário traduzido — e as correções já feitas na árvore, compiladas em v141: colisão de zumbi, inclinação ao correr, inventário e menu.",
    en: "The real Bohemia Interactive project in SOURCE DEFINITIVA: every function read, every comment translated — plus the fixes already made in the tree and compiled with v141: zombie collision, running tilt, inventory and menu.",
    ru: "Настоящий проект Bohemia Interactive в SOURCE DEFINITIVA: каждая функция прочитана, каждый комментарий переведён — плюс исправления, уже внесённые в дерево и собранные на v141: столкновения зомби, наклон при беге, инвентарь и меню."
  },
  "overview.explore": { pt: "Explorar funções →", en: "Explore functions →", ru: "Изучить функции →" },
  "overview.changes": { pt: "Mudanças na source", en: "Source changes", ru: "Изменения в исходниках" },
  "overview.diagram": { pt: "Diagrama & motor", en: "Diagram & engine", ru: "Диаграмма и движок" },
  "overview.bugs": { pt: "Bugs & FPS", en: "Bugs & FPS", ru: "Баги и FPS" },
  "overview.updates": { pt: "Atualizações", en: "Updates", ru: "Обновления" },
  "overview.pending": { pt: "Pendências", en: "Pending", ru: "Незавершённое" },
  "overview.completeFunctions": { pt: "funções completas", en: "complete functions", ru: "полных функций" },
  "overview.closedEntries": { pt: "{done} de {total} entradas fechadas", en: "{done} of {total} entries closed", ru: "{done} из {total} записей закрыто" },
  "overview.stat.functions": { pt: "Funções estudadas", en: "Functions studied", ru: "Изучено функций" },
  "overview.stat.functionsHint": { pt: "{done} completas · {partial} parciais", en: "{done} complete · {partial} partial", ru: "{done} полных · {partial} частичных" },
  "overview.stat.comments": { pt: "Comentários anotados", en: "Annotated comments", ru: "Аннотированных комментариев" },
  "overview.stat.commentsHint": { pt: "{n} arquivos", en: "{n} files", ru: "{n} файлов" },
  "overview.stat.patches": { pt: "Patches históricos", en: "Historical patches", ru: "Исторические патчи" },
  "overview.stat.patchesHint": { pt: "tags \\patch do repositório", en: "\\patch tags from the repository", ru: "теги \\patch из репозитория" },
  "overview.stat.pending": { pt: "Pendências & hacks", en: "Pending & hacks", ru: "Незавершённое и хаки" },
  "overview.stat.pendingHint": { pt: "DX11 TODO + HACK", en: "DX11 TODO + HACK", ru: "DX11 TODO + HACK" },
  "overview.stat.findings": { pt: "Achados", en: "Findings", ru: "Находки" },
  "overview.stat.findingsHint": { pt: "A · H · G", en: "A · H · G", ru: "A · H · G" },
  "overview.stat.tools": { pt: "Ferramentas", en: "Tools", ru: "Инструменты" },
  "overview.stat.toolsHint": { pt: "pipeline em Python", en: "Python pipeline", ru: "пайплайн на Python" },
  "overview.languages": { pt: "Linguagens na source", en: "Languages in the source", ru: "Языки в исходниках" },
  "overview.topFiles": { pt: "Arquivos mais comentados", en: "Most commented files", ru: "Самые комментируемые файлы" },
  "overview.recentFindings": { pt: "Achados recentes", en: "Recent findings", ru: "Недавние находки" },
  "overview.recentPatches": { pt: "Patches recentes", en: "Recent patches", ru: "Недавние патчи" },
  "overview.whereToStart": { pt: "Por onde começar", en: "Where to start", ru: "С чего начать" },
  "overview.quick.function": { pt: "Função em destaque", en: "Featured function", ru: "Функция в фокусе" },
  "overview.quick.functionDesc": { pt: "Seleção de pixel shader por material, spec e luzes no backend DX9.", en: "Pixel shader selection by material, spec and lights in the DX9 backend.", ru: "Выбор пиксельного шейдера по материалу, spec и освещению в бэкенде DX9." },
  "overview.quick.comments": { pt: "Comentários", en: "Comments", ru: "Комментарии" },
  "overview.quick.commentsTitle": { pt: "180.545 anotados", en: "180,545 annotated", ru: "180 545 аннотировано" },
  "overview.quick.commentsDesc": { pt: "Original em inglês, tradução PT-BR, código ancorado e função de contexto.", en: "Original English, PT-BR translation, anchored code and context function.", ru: "Оригинал на английском, перевод PT-BR, привязанный код и функция контекста." },
  "overview.quick.performance": { pt: "Performance", en: "Performance", ru: "Производительность" },
  "overview.quick.performanceTitle": { pt: "FPS perto de cidades", en: "FPS near cities", ru: "FPS возле городов" },
  "overview.quick.performanceDesc": { pt: "Dossiê com 6 elos causais, evidência de linha e correções por custo/benefício.", en: "Dossier with 6 causal links, line evidence and cost/benefit fixes.", ru: "Досье с 6 причинными связями, ссылками на строки и исправлениями по стоимости/выгоде." },
  "overview.quick.script": { pt: "Script", en: "Script", ru: "Скрипт" },
  "overview.quick.scriptTitle": { pt: "SQF & Enforce", en: "SQF & Enforce", ru: "SQF и Enforce" },
  "overview.quick.scriptDesc": { pt: "Sintaxe completa das duas linguagens, operadores, VM e armadilhas.", en: "Complete syntax of both languages, operators, VM and pitfalls.", ru: "Полный синтаксис обоих языков, операторы, VM и подводные камни." },
  "overview.quick.project": { pt: "Projeto", en: "Project", ru: "Проект" },
  "overview.quick.projectTitle": { pt: "Mudanças & PBOs", en: "Changes & PBOs", ru: "Изменения и PBO" },
  "overview.quick.projectDesc": { pt: "Patches com arquivo:linha, toolchain v141 e o formato binário dos PBOs.", en: "Patches with file:line, v141 toolchain and the PBO binary format.", ru: "Патчи с файлом:строкой, инструментарий v141 и бинарный формат PBO." },

  // Documento
  "doc.kicker": { pt: "documento-mestre", en: "master document", ru: "основной документ" },
  "doc.title": { pt: "Documento", en: "Document", ru: "Документ" },
  "doc.lead": {
    pt: "O 1.md inteiro, fatiado em {sections} seções navegáveis: {lines} linhas, {kb} KB de estudo da source — método, linguagens, funções, DX11 e motor.",
    en: "The entire 1.md, split into {sections} navigable sections: {lines} lines, {kb} KB of source study — method, languages, functions, DX11 and engine.",
    ru: "Весь 1.md, разбитый на {sections} навигационных разделов: {lines} строк, {kb} КБ исследования исходников — метод, языки, функции, DX11 и движок."
  },
  "doc.search": { pt: "Buscar no documento...", en: "Search the document...", ru: "Поиск по документу..." },
  "doc.nothing": { pt: "Nada encontrado.", en: "Nothing found.", ru: "Ничего не найдено." },
  "doc.subsections": { pt: "Subseções ({n})", en: "Subsections ({n})", ru: "Подразделы ({n})" },
  "doc.lineChip": { pt: "linha {n}", en: "line {n}", ru: "строка {n}" },
  "doc.linesChip": { pt: "{n} linhas de texto", en: "{n} lines of text", ru: "{n} строк текста" },
  "doc.levelChip": { pt: "nível {n}", en: "level {n}", ru: "уровень {n}" },
  "doc.resultMeta": { pt: "nível {level} · linha {line}", en: "level {level} · line {line}", ru: "уровень {level} · строка {line}" },

  // Código-fonte
  "source.kicker": { pt: "código-fonte original · patches compilados e testados", en: "original source code · compiled and tested patches", ru: "исходный код · собранные и проверенные патчи" },
  "source.title": { pt: "Código-fonte", en: "Source code", ru: "Исходный код" },
  "source.lead": {
    pt: "A árvore real do projeto da Bohemia Interactive: {folders} pastas e {files} arquivos ({size}) medidos nesta máquina. O código está em {root} — e esta árvore já foi modificada e recompilada: colisão de zumbi, inclinação ao correr, inventário e menu.",
    en: "The real Bohemia Interactive project tree: {folders} folders and {files} files ({size}) measured on this machine. The code is in {root} — and this tree has already been modified and recompiled: zombie collision, running tilt, inventory and menu.",
    ru: "Настоящее дерево проекта Bohemia Interactive: {folders} папок и {files} файлов ({size}), измерено на этой машине. Код находится в {root} — дерево уже изменено и пересобрано: столкновения зомби, наклон при беге, инвентарь и меню."
  },
  "source.viewChanges": { pt: "Ver mudanças →", en: "View changes →", ru: "Посмотреть изменения →" },
  "source.root": { pt: "raiz do projeto", en: "project root", ru: "корень проекта" },
  "source.measuredOn": { pt: "medido em {date}", en: "measured on {date}", ru: "измерено {date}" },
  "source.tab.estrutura": { pt: "Estrutura", en: "Structure", ru: "Структура" },
  "source.tab.estruturaSub": { pt: "árvore real medida", en: "measured real tree", ru: "измеренное дерево" },
  "source.tab.mudancas": { pt: "Mudanças", en: "Changes", ru: "Изменения" },
  "source.tab.mudancasSub": { pt: "patches compilados", en: "compiled patches", ru: "собранные патчи" },
  "source.tab.compilacao": { pt: "Compilação", en: "Compilation", ru: "Компиляция" },
  "source.tab.compilacaoSub": { pt: "v141 · MSBuild 15", en: "v141 · MSBuild 15", ru: "v141 · MSBuild 15" },
  "source.tab.pbo": { pt: "PBOs", en: "PBOs", ru: "PBO" },
  "source.tab.pboSub": { pt: "formato, bits e ferramentas", en: "format, bits and tools", ru: "формат, биты и инструменты" },
  "source.filter": { pt: "Filtrar pasta, nota ou subpasta...", en: "Filter folder, note or subfolder...", ru: "Фильтр папки, заметки или подпапки..." },
  "source.folders": { pt: "{n} pasta(s)", en: "{n} folder(s)", ru: "{n} папок" },
  "source.filesShort": { pt: "{n} arq.", en: "{n} files", ru: "{n} файлов" },
  "source.moreFolders": { pt: "+{n} subpastas não exibidas", en: "+{n} subfolders not shown", ru: "+{n} подпапок не показано" },
  "source.noFolders": { pt: "Nenhuma pasta para o filtro atual.", en: "No folders for the current filter.", ru: "Нет папок для текущего фильтра." },
  "source.generated": { pt: "Pastas geradas (não são código)", en: "Generated folders (not code)", ru: "Сгенерированные папки (не код)" },
  "source.stats.files": { pt: "Arquivos de código", en: "Code files", ru: "Файлы кода" },
  "source.stats.filesHint": { pt: "sem build/ e dist/", en: "excluding build/ and dist/", ru: "без build/ и dist/" },
  "source.stats.size": { pt: "Tamanho medido", en: "Measured size", ru: "Измеренный размер" },
  "source.stats.sizeHint": { pt: "arquivo por arquivo", en: "file by file", ru: "файл за файлом" },
  "source.stats.folders": { pt: "Pastas de 1º nível", en: "Top-level folders", ru: "Папки первого уровня" },
  "source.stats.foldersHint": { pt: "mais as geradas", en: "plus generated ones", ru: "плюс сгенерированные" },

  // Motor
  "engine.kicker": { pt: "arquitetura do motor", en: "engine architecture", ru: "архитектура движка" },
  "engine.title": { pt: "Motor", en: "Engine", ru: "Движок" },
  "engine.lead": {
    pt: "Como o Real Virtuality / Enfusion 0.45 funciona: ordem real do frame, orçamento de tempo, modelo de threads, caminho do objeto ao pixel e os dois backends gráficos.",
    en: "How Real Virtuality / Enfusion 0.45 works: real frame order, time budget, thread model, the path from object to pixel and both graphics backends.",
    ru: "Как работает Real Virtuality / Enfusion 0.45: реальный порядок кадра, бюджет времени, модель потоков, путь от объекта до пикселя и два графических бэкенда."
  },
  "engine.openDiagram": { pt: "Abrir diagrama 3D →", en: "Open 3D diagram →", ru: "Открыть 3D-диаграмму →" },
  "engine.step.sim": { pt: "um frame de mundo: caches, GC, veículos, script, terreno, UI, desenho", en: "one world frame: caches, GC, vehicles, script, terrain, UI, drawing", ru: "один кадр мира: кэши, GC, транспорт, скрипты, ландшафт, UI, отрисовка" },
  "engine.step.prep": { pt: "visibilidade, distâncias e o retângulo de lock do streaming", en: "visibility, distances and the streaming lock rectangle", ru: "видимость, дистанции и прямоугольник блокировки стриминга" },
  "engine.step.scene": { pt: "lista de SortObject e lotes de instancing de até 512", en: "SortObject list and instancing batches up to 512", ru: "список SortObject и батчи инстансинга до 512" },
  "engine.step.obj": { pt: "locks, animação, luzes, texturas e sombra por objeto", en: "locks, animation, lights, textures and shadows per object", ru: "блокировки, анимация, свет, текстуры и тени на объект" },
  "engine.step.gpu": { pt: "estado, shader e draw call — 51.549 vs 1.211 linhas", en: "state, shader and draw call — 51,549 vs 1,211 lines", ru: "состояние, шейдер и draw call — 51 549 против 1 211 строк" },

  // Diagrama
  "diagram.kicker": { pt: "mapa interativo", en: "interactive map", ru: "интерактивная карта" },
  "diagram.title": { pt: "Diagrama do motor", en: "Engine diagram", ru: "Диаграмма движка" },
  "diagram.lead": {
    pt: "Do WinMain ao Present: clique em qualquer caixa para ver o que ela faz e onde está no código. Abaixo, a pilha de camadas em 3D.",
    en: "From WinMain to Present: click any box to see what it does and where it lives in the code. Below, the layer stack in 3D.",
    ru: "От WinMain до Present: нажмите на любой блок, чтобы увидеть, что он делает и где находится в коде. Ниже — стек слоёв в 3D."
  },
  "diagram.input": { pt: "ENTRADA", en: "INPUT", ru: "ВХОД" },
  "diagram.frame": { pt: "FRAME", en: "FRAME", ru: "КАДР" },
  "diagram.output": { pt: "SAÍDA", en: "OUTPUT", ru: "ВЫХОД" },
  "diagram.legend.input": { pt: "entrada", en: "input", ru: "вход" },
  "diagram.legend.frame": { pt: "frame", en: "frame", ru: "кадр" },
  "diagram.legend.draw": { pt: "desenho", en: "draw", ru: "отрисовка" },
  "diagram.legend.output": { pt: "saída", en: "output", ru: "выход" },
  "diagram.layers": { pt: "Camadas do motor", en: "Engine layers", ru: "Слои движка" },
  "diagram.rotate": { pt: "girar", en: "rotate", ru: "вращать" },
  "diagram.pause": { pt: "pausar rotação", en: "pause rotation", ru: "пауза вращения" },
  "diagram.layerOf": { pt: "camada {n} de {total}", en: "layer {n} of {total}", ru: "слой {n} из {total}" },
  "diagram.aria": { pt: "Fluxo do motor do DayZ", en: "DayZ engine flow", ru: "Поток движка DayZ" },

  // Linguagens
  "languages.kicker": { pt: "as linguagens da source", en: "the languages of the source", ru: "языки исходников" },
  "languages.title": { pt: "Linguagens", en: "Languages", ru: "Языки" },
  "languages.lead": {
    pt: "A source não é monolíngue: convivem C++ de 2010, Enforce (script moderno), SQF/SQS (legado), ParamFile (config) e HLSL. Referência de sintaxe das duas linguagens de script, com evidência no compilador e na VM.",
    en: "The source is not monolingual: 2010-era C++, Enforce (modern script), SQF/SQS (legacy), ParamFile (config) and HLSL coexist. Syntax reference for both scripting languages, with evidence in the compiler and VM.",
    ru: "Исходники не монолингвальны: сосуществуют C++ 2010 года, Enforce (современный скрипт), SQF/SQS (устаревший), ParamFile (конфиг) и HLSL. Справочник по синтаксису двух скриптовых языков с подтверждением в компиляторе и VM."
  },
  "languages.tab.sqfSub": { pt: "1.340 comandos · script legado", en: "1,340 commands · legacy script", ru: "1 340 команд · устаревший скрипт" },
  "languages.tab.enforceSub": { pt: "Enfusion · script moderno", en: "Enfusion · modern script", ru: "Enfusion · современный скрипт" },
  "languages.tab.cpp": { pt: "C++ da BI", en: "BI C++", ru: "C++ от BI" },
  "languages.tab.cppSub": { pt: "padrões de 1,4 M linhas", en: "patterns from 1.4M lines", ru: "паттерны из 1,4 млн строк" },

  // Funções
  "functions.kicker": { pt: "estudo função por função", en: "function-by-function study", ru: "изучение функция за функцией" },
  "functions.title": { pt: "Funções", en: "Functions", ru: "Функции" },
  "functions.lead": { pt: "{n} entradas no formato Local · Assinatura · Papel · Fluxo · O que aprendi · Risco.", en: "{n} entries in the format Location · Signature · Role · Flow · What I learned · Risk.", ru: "{n} записей в формате Локация · Сигнатура · Роль · Поток · Что я узнал · Риск." },
  "functions.search": { pt: "Buscar por ID, símbolo, arquivo ou papel...", en: "Search by ID, symbol, file or role...", ru: "Поиск по ID, символу, файлу или роли..." },
  "functions.filter.all": { pt: "todas", en: "all", ru: "все" },
  "functions.filter.complete": { pt: "completas", en: "complete", ru: "полные" },
  "functions.filter.partial": { pt: "parciais", en: "partial", ru: "частичные" },
  "functions.empty": { pt: "Nenhuma função para “{q}”.", en: "No function for “{q}”.", ru: "Нет функций для «{q}»." },
  "functions.notFound": { pt: "Função {id} não encontrada.", en: "Function {id} not found.", ru: "Функция {id} не найдена." },
  "functions.backAll": { pt: "← todas as funções", en: "← all functions", ru: "← все функции" },
  "functions.noStatus": { pt: "sem status", en: "no status", ru: "без статуса" },
  "functions.block.role": { pt: "Papel", en: "Role", ru: "Роль" },
  "functions.block.flow": { pt: "Fluxo", en: "Flow", ru: "Поток" },
  "functions.block.learned": { pt: "O que aprendi", en: "What I learned", ru: "Что я узнал" },
  "functions.block.risk": { pt: "Risco", en: "Risk", ru: "Риск" },
  "functions.side.local": { pt: "Local", en: "Location", ru: "Локация" },
  "functions.side.signature": { pt: "Assinatura", en: "Signature", ru: "Сигнатура" },
  "functions.side.navigate": { pt: "Navegar", en: "Navigate", ru: "Навигация" },

  // Comentários
  "comments.kicker": { pt: "corpus anotado", en: "annotated corpus", ru: "аннотированный корпус" },
  "comments.title": { pt: "Comentários", en: "Comments", ru: "Комментарии" },
  "comments.lead": {
    pt: "{total} comentários em {groups} grupos. Original, tradução, código ancorado e função de contexto. Carregamento sob demanda.",
    en: "{total} comments in {groups} groups. Original, translation, anchored code and context function. Loaded on demand.",
    ru: "{total} комментариев в {groups} группах. Оригинал, перевод, привязанный код и функция контекста. Загружается по требованию."
  },
  "comments.filterGroups": { pt: "Filtrar grupos...", en: "Filter groups...", ru: "Фильтр групп..." },
  "comments.search": { pt: "Buscar no grupo (texto, arquivo, função)...", en: "Search group (text, file, function)...", ru: "Поиск в группе (текст, файл, функция)..." },
  "comments.summary": { pt: "{total} comentários · {filtered} filtrados", en: "{total} comments · {filtered} filtered", ru: "{total} комментариев · {filtered} отфильтровано" },
  "comments.loadingGroup": { pt: "Carregando grupo...", en: "Loading group...", ru: "Загрузка группы..." },
  "comments.empty": { pt: "Nenhum comentário para os filtros atuais.", en: "No comments for the current filters.", ru: "Нет комментариев для текущих фильтров." },
  "comments.whatItDoes": { pt: "O que faz:", en: "What it does:", ru: "Что делает:" },
  "comments.russianNote": {
    pt: "",
    en: "",
    ru: "Перевод на русский этого корпуса пока недоступен; показан оригинал на английском."
  },

  // Achados
  "findings.kicker": { pt: "catálogo de problemas", en: "problem catalogue", ru: "каталог проблем" },
  "findings.title": { pt: "Achados", en: "Findings", ru: "Находки" },
  "findings.lead": {
    pt: "{a} achados de arquitetura, {h} hipóteses/riscos e {g} ganhos visuais mapeados durante a leitura — todos com local e evidência.",
    en: "{a} architecture findings, {h} hypotheses/risks and {g} visual gains mapped during the reading — all with location and evidence.",
    ru: "{a} архитектурных находок, {h} гипотез/рисков и {g} визуальных улучшений, найденных при чтении — все с локацией и доказательствами."
  },
  "findings.search": { pt: "Buscar por ID, problema, arquivo...", en: "Search by ID, problem, file...", ru: "Поиск по ID, проблеме, файлу..." },
  "findings.type.A": { pt: "Arquitetura / bug concreto", en: "Architecture / concrete bug", ru: "Архитектура / конкретный баг" },
  "findings.type.H": { pt: "Hipótese / risco a confirmar", en: "Hypothesis / risk to confirm", ru: "Гипотеза / риск к подтверждению" },
  "findings.type.G": { pt: "Ganho visual (DX11)", en: "Visual gain (DX11)", ru: "Визуальный выигрыш (DX11)" },
  "findings.empty": { pt: "Nenhum achado para os filtros atuais.", en: "No findings for the current filters.", ru: "Нет находок для текущих фильтров." },

  // Patches
  "patches.kicker": { pt: "histórico & dívida técnica · sincronizado do GitHub", en: "history & technical debt · synced from GitHub", ru: "история и техдолг · синхронизировано с GitHub" },
  "patches.title": { pt: "Patches", en: "Patches", ru: "Патчи" },
  "patches.lead": {
    pt: "Tags \\patch do repositório e os marcadores de portabilidade deixados no código. O histórico abaixo descreve a build local; o feed no fim da página lê os commits e as releases diretamente de Personed/Game, para que patch publicado no repositório apareça aqui sem edição manual.",
    en: "\\patch tags from the repository and the portability markers left in the code. The history below describes the local build; the feed at the end of the page reads commits and releases directly from Personed/Game, so a patch published in the repository appears here without manual editing.",
    ru: "Теги \\patch из репозитория и маркеры переносимости, оставленные в коде. История ниже описывает локальную сборку; лента в конце страницы читает коммиты и релизы напрямую из Personed/Game, поэтому опубликованный патч появляется здесь без ручного редактирования."
  },
  "patches.search": { pt: "Buscar no histórico...", en: "Search the history...", ru: "Поиск по истории..." },
  "patches.by": { pt: "por", en: "by", ru: "от" },
  "patches.empty": { pt: "Nenhum patch encontrado.", en: "No patches found.", ru: "Патчи не найдены." },
  "patches.tab.patches": { pt: "Patches ({n})", en: "Patches ({n})", ru: "Патчи ({n})" },
  "patches.tab.dx11": { pt: "DX11 TODO ({n})", en: "DX11 TODO ({n})", ru: "DX11 TODO ({n})" },
  "patches.tab.hacks": { pt: "HACKs ({n})", en: "HACKs ({n})", ru: "HACK ({n})" },
  "patches.lead1": {
    pt: "Tags",
    en: "Tags",
    ru: "Теги"
  },
  "patches.lead2": {
    pt: "do repositório e os marcadores de portabilidade deixados no código. O histórico abaixo descreve a build local; o feed no fim da página lê os commits e as releases diretamente de",
    en: "from the repository and the portability markers left in the code. The history below describes the local build; the feed at the end of the page reads commits and releases directly from",
    ru: "из репозитория и маркеры переносимости, оставленные в коде. История ниже описывает локальную сборку; лента в конце страницы читает коммиты и релизы напрямую из"
  },
  "patches.lead3": {
    pt: ", para que patch publicado no repositório apareça aqui sem edição manual.",
    en: ", so a patch published in the repository appears here without manual editing.",
    ru: ", поэтому опубликованный патч появляется здесь без ручного редактирования."
  },
  "patches.dx11Title": { pt: "Pendências declaradas no backend DX11", en: "Declared pending items in the DX11 backend", ru: "Заявленные незавершённые места в бэкенде DX11" },
  "patches.hacksTitle": { pt: "Hacks e soluções temporárias", en: "Hacks and temporary solutions", ru: "Хаки и временные решения" },

  // Ferramentas
  "tools.kicker": { pt: "pipeline de estudo", en: "study pipeline", ru: "пайплайн исследования" },
  "tools.title": { pt: "Ferramentas", en: "Tools", ru: "Инструменты" },
  "tools.lead": {
    pt: "{n} scripts Python que extraem, traduzem, ancoram e validam os dados deste site — {lines} linhas no total.",
    en: "{n} Python scripts that extract, translate, anchor and validate this site's data — {lines} lines in total.",
    ru: "{n} Python-скриптов, которые извлекают, переводят, привязывают и проверяют данные сайта — всего {lines} строк."
  },
  "tools.lines": { pt: "{n} linhas", en: "{n} lines", ru: "{n} строк" },
  "tools.how": { pt: "Como o dataset é gerado", en: "How the dataset is generated", ru: "Как создаётся датасет" },
  "tools.step.scan": { pt: "varre a source e grava o índice bruto.", en: "scans the source and writes the raw index.", ru: "сканирует исходники и записывает сырой индекс." },
  "tools.step.annotate": { pt: "traduz, ancora e agrupa os comentários.", en: "translates, anchors and groups the comments.", ru: "переводит, привязывает и группирует комментарии." },
  "tools.step.build": { pt: "consolida funções, achados, patches e ferramentas.", en: "consolidates functions, findings, patches and tools.", ru: "объединяет функции, находки, патчи и инструменты." },
  "tools.step.docs": { pt: "fatia o 1.md, monta o glossário e categoriza os bugs.", en: "splits 1.md, builds the glossary and categorizes bugs.", ru: "разбивает 1.md, собирает глоссарий и категоризирует баги." },
  "tools.step.dev": { pt: "abre este explorador.", en: "opens this explorer.", ru: "открывает этот проводник." },

  // Bugs
  "bugs.kicker": { pt: "registro da equipe & catálogo de problemas", en: "team log & problem catalogue", ru: "журнал команды и каталог проблем" },
  "bugs.title": { pt: "Bugs & problemas", en: "Bugs & issues", ru: "Баги и проблемы" },
  "bugs.lead": {
    pt: "O Registro de bugs é editável: a equipe adiciona o que descobriu, marca como em andamento e, ao corrigir, registra o que era, como resolveu, o que usou e quantas tentativas foram necessárias. O Catálogo traz {total} itens desta build: {findings} achados de leitura (A/H/G) e {comments} marcadores deixados pelos próprios devs (TODO/HACK). A aba FPS em cidades mantém o dossiê do drop de 0-1 FPS separado.",
    en: "The bug log is editable: the team adds what it found, marks items as in progress and, when fixing, records what it was, how it was solved, what was used and how many attempts it took. The catalogue contains {total} items from this build: {findings} reading findings (A/H/G) and {comments} markers left by the devs themselves (TODO/HACK). The FPS in cities tab keeps the 0-1 FPS drop dossier separate.",
    ru: "Журнал багов редактируется: команда добавляет найденное, отмечает в работе и при исправлении записывает, что было, как исправлено, что использовалось и сколько попыток потребовалось. Каталог содержит {total} элементов этой сборки: {findings} находок чтения (A/H/G) и {comments} маркеров, оставленных разработчиками (TODO/HACK). Вкладка FPS в городах хранит досье падения 0-1 FPS отдельно."
  },
  "bugs.tab.registry": { pt: "Registro de bugs", en: "Bug log", ru: "Журнал багов" },
  "bugs.tab.registrySub": { pt: "adicionar · corrigir · excluir", en: "add · fix · delete", ru: "добавить · исправить · удалить" },
  "bugs.tab.catalog": { pt: "Catálogo", en: "Catalogue", ru: "Каталог" },
  "bugs.tab.catalogSub": { pt: "{n} itens categorizados", en: "{n} categorized items", ru: "{n} категоризированных элементов" },
  "bugs.tab.fps": { pt: "FPS em cidades", en: "FPS in cities", ru: "FPS в городах" },
  "bugs.tab.fpsSub": { pt: "dossiê do drop de 0-1 FPS", en: "0-1 FPS drop dossier", ru: "досье падения 0-1 FPS" },
  "bugs.registryIntro": {
    pt: "Adicione bugs descobertos pela equipe, marque o que está em andamento e registre a correção completa. O catálogo automático da source continua na aba ao lado; este registro é o histórico vivo da equipe.",
    en: "Add bugs found by the team, mark what is in progress and record the complete fix. The automatic source catalogue stays in the next tab; this log is the team's living history.",
    ru: "Добавляйте найденные командой баги, отмечайте текущие и записывайте полное исправление. Автоматический каталог исходников остаётся на соседней вкладке; этот журнал — живая история команды."
  },
  "bugs.search": { pt: "Buscar por ID, sintoma, arquivo...", en: "Search by ID, symptom, file...", ru: "Поиск по ID, симптому, файлу..." },
  "bugs.severity.all": { pt: "toda severidade", en: "all severities", ru: "все важности" },
  "bugs.severity.high": { pt: "alta", en: "high", ru: "высокая" },
  "bugs.severity.medium": { pt: "média", en: "medium", ru: "средняя" },
  "bugs.severity.improvement": { pt: "melhoria", en: "improvement", ru: "улучшение" },
  "bugs.empty": { pt: "Nenhum item para os filtros atuais.", en: "No items for the current filters.", ru: "Нет элементов для текущих фильтров." },

  // Dicionário
  "dict.kicker": { pt: "glossário EN → PT-BR", en: "EN → PT-BR glossary", ru: "глоссарий EN → PT-BR" },
  "dict.title": { pt: "Dicionário", en: "Dictionary", ru: "Словарь" },
  "dict.lead": {
    pt: "O glossário determinístico usado pelo anotador de comentários: {n} entradas. Identificadores técnicos, CamelCase, caminhos e trechos entre crases são preservados — só o inglês técnico é traduzido.",
    en: "The deterministic glossary used by the comment annotator: {n} entries. Technical identifiers, CamelCase, paths and backtick snippets are preserved — only technical English is translated.",
    ru: "Детерминированный глоссарий, используемый аннотатором комментариев: {n} записей. Технические идентификаторы, CamelCase, пути и фрагменты в обратных кавычках сохраняются — переводится только технический английский."
  },
  "dict.search": { pt: "Buscar em inglês ou português...", en: "Search in English or Portuguese...", ru: "Поиск на английском или португальском..." },
  "dict.type.all": { pt: "todos os tipos", en: "all types", ru: "все типы" },
  "dict.type.phrase": { pt: "frases", en: "phrases", ru: "фразы" },
  "dict.type.term": { pt: "termos", en: "terms", ru: "термины" },
  "dict.entries": { pt: "Entradas", en: "Entries", ru: "Записи" },
  "dict.entriesHint": { pt: "frases + termos", en: "phrases + terms", ru: "фразы + термины" },
  "dict.phrases": { pt: "Frases", en: "Phrases", ru: "Фразы" },
  "dict.phrasesHint": { pt: "expressões multi-palavra", en: "multi-word expressions", ru: "многословные выражения" },
  "dict.terms": { pt: "Termos", en: "Terms", ru: "Термины" },
  "dict.termsHint": { pt: "palavra única", en: "single word", ru: "одно слово" },
  "dict.empty": { pt: "Nenhuma entrada para os filtros atuais.", en: "No entries for the current filters.", ru: "Нет записей для текущих фильтров." },
  "dict.note": {
    pt: "O glossário traduz EN → PT-BR. A coluna em português permanece assim em EN/RU nesta etapa.",
    en: "The glossary translates EN → PT-BR. The Portuguese column remains as-is in EN/RU at this stage.",
    ru: "Глоссарий переводит EN → PT-BR. Португальская колонка пока остаётся без изменений в EN/RU."
  },

  // Pendências
  "pending.kicker": { pt: "estado do projeto · 18 de novembro de 2026", en: "project status · November 18, 2026", ru: "состояние проекта · 18 ноября 2026" },
  "pending.title": { pt: "Pendências", en: "Pending", ru: "Незавершённое" },
  "pending.lead": {
    pt: "O retrato do que está aberto: animações do DayZ 1.30 dentro do cliente 0.45, menus, FPS e a infraestrutura de builds. A aba Tarefas é um quadro editável: dá para criar, editar, marcar como em andamento e concluir. Ao concluir, o desfecho exige o que era, como foi resolvido, o que foi usado e quantas tentativas foram feitas. A aba Resolver Drop de FPS continua separada e concentra o teste do candidato F, as prints, a correção F2 e todos os diffs de código.",
    en: "A snapshot of what is open: DayZ 1.30 animations inside the 0.45 client, menus, FPS and the build infrastructure. The Tasks tab is an editable board: create, edit, mark as in progress and complete. On completion, the outcome requires what it was, how it was solved, what was used and how many attempts were made. The Resolve FPS Drop tab remains separate and gathers the candidate F test, screenshots, the F2 fix and all code diffs.",
    ru: "Снимок открытых задач: анимации DayZ 1.30 в клиенте 0.45, меню, FPS и инфраструктура сборок. Вкладка «Задачи» — редактируемая доска: создавать, редактировать, отмечать в работе и завершать. При завершении нужно указать, что было, как исправлено, что использовалось и сколько попыток потребовалось. Вкладка «Устранить падение FPS» остаётся отдельной и собирает тест кандидата F, скриншоты, исправление F2 и все диффы кода."
  },
  "pending.stat.animations": { pt: "Animações em 1.30", en: "Animations in 1.30", ru: "Анимации в 1.30" },
  "pending.stat.animationsHint": { pt: "de 2.028 · 68,5% da base", en: "of 2,028 · 68.5% of the base", ru: "из 2 028 · 68,5% базы" },
  "pending.stat.build": { pt: "Build em jogo", en: "In-game build", ru: "Сборка в игре" },
  "pending.stat.buildHint": { pt: "875,8 MiB · sem erro novo", en: "875.8 MiB · no new errors", ru: "875,8 MiB · без новых ошибок" },
  "pending.stat.bugs": { pt: "Bugs abertos", en: "Open bugs", ru: "Открытые баги" },
  "pending.stat.bugsHint": { pt: "registro de bugs · corrigir ou reabrir", en: "bug log · fix or reopen", ru: "журнал багов · исправить или переоткрыть" },
  "pending.stat.tasks": { pt: "Tarefas abertas", en: "Open tasks", ru: "Открытые задачи" },
  "pending.stat.tasksHint": { pt: "quadro editável · em andamento incluso", en: "editable board · including in progress", ru: "редактируемая доска · включая в работе" },
  "pending.stat.priority": { pt: "Prioridade alta", en: "High priority", ru: "Высокий приоритет" },
  "pending.stat.priorityHint": { pt: "F2 parcial · grama/sombra falham", en: "F2 partial · grass/shadow fail", ru: "F2 частично · трава/тень не работают" },
  "pending.stat.baseline": { pt: "Baseline do RPT", en: "RPT baseline", ru: "Базовый RPT" },
  "pending.stat.baselineHint": { pt: "not found / Bad move", en: "not found / Bad move", ru: "not found / Bad move" },
  "pending.tab.fps": { pt: "Resolver Drop de FPS", en: "Resolve FPS drop", ru: "Устранить падение FPS" },
  "pending.tab.fpsSub": { pt: "prioridade alta", en: "high priority", ru: "высокий приоритет" },
  "pending.tab.tasks": { pt: "Tarefas", en: "Tasks", ru: "Задачи" },
  "pending.tab.tasksSub": { pt: "quadro editável · concluir e excluir", en: "editable board · complete and delete", ru: "редактируемая доска · завершить и удалить" },
  "pending.tab.animations": { pt: "Animações", en: "Animations", ru: "Анимации" },
  "pending.tab.animationsSub": { pt: "dossiê 1.30 → 0.45", en: "1.30 → 0.45 dossier", ru: "досье 1.30 → 0.45" },
  "pending.tab.builds": { pt: "Builds E1–E7", en: "Builds E1–E7", ru: "Сборки E1–E7" },
  "pending.tab.buildsSub": { pt: "histórico e testes", en: "history and tests", ru: "история и тесты" },
  "pending.tasksTitle": { pt: "Tarefas do projeto", en: "Project tasks", ru: "Задачи проекта" },
  "pending.tasksIntro": {
    pt: "Crie tarefas, mova para em andamento, bloqueie ou conclua. Ao concluir, o desfecho pede o que foi feito, como, o que foi usado e quantas tentativas foram necessárias.",
    en: "Create tasks, move to in progress, block or complete. On completion, the outcome asks what was done, how, what was used and how many attempts were needed.",
    ru: "Создавайте задачи, переводите в работу, блокируйте или завершайте. При завершении нужно указать, что сделано, как, что использовалось и сколько попыток потребовалось."
  },
  "pending.details": { pt: "Panorama detalhado do que falta", en: "Detailed overview of what is missing", ru: "Подробный обзор того, что осталось" },
  "pending.fps.badge": { pt: "PRIORIDADE ALTA", en: "HIGH PRIORITY", ru: "ВЫСОКИЙ ПРИОРИТЕТ" },
  "pending.fps.kicker": { pt: "frente dedicada · engine 0.45 · Release", en: "dedicated effort · engine 0.45 · Release", ru: "отдельное направление · engine 0.45 · Release" },
  "pending.fps.lead": {
    pt: "A F2 trouxe personagem e casas/árvores de volta, mas a grama aparece só de vez em quando e a sombra do personagem fica nas costas. O FPS ficou baixo. A frente está pausada; o roteiro para retomar está em Ponto de retomada.",
    en: "F2 brought the character and houses/trees back, but the grass only appears occasionally and the character's shadow is on their back. FPS is low. The effort is paused; the plan to resume is in Resume point.",
    ru: "F2 вернула персонажа и дома/деревья, но трава появляется лишь иногда, а тень персонажа оказывается за спиной. FPS низкий. Направление приостановлено; план возобновления — в разделе «Точка возобновления»."
  },
  "pending.fps.hint": {
    pt: "Pista dos devs: “processamento de objetos antes da renderização — tudo dentro de Scene::DrawObject***, preparação de materiais, polígonos e outras merdas.” É essa frase que guia todos os cortes A–F e a correção F2.",
    en: "Dev hint: “object processing before rendering — everything inside Scene::DrawObject***, material preparation, polygons and other crap.” That sentence guides all A–F cuts and the F2 fix.",
    ru: "Подсказка разработчиков: «обработка объектов перед рендерингом — всё внутри Scene::DrawObject***, подготовка материалов, полигоны и прочее дерьмо». Эта фраза направляет все сокращения A–F и исправление F2."
  },
  "pending.fps.code": { pt: "Código antes e depois (tipo git)", en: "Code before and after (git-style)", ru: "Код до и после (в стиле git)" },
  "pending.fps.codeHint": {
    pt: "todos os patches, arquivo por arquivo, estão em Código antes e depois, no fim desta aba, com linhas -/+ e o .diff para baixar.",
    en: "all patches, file by file, are in Code before and after at the end of this tab, with -/+ lines and the .diff to download.",
    ru: "все патчи, файл за файлом, находятся в разделе «Код до и после» в конце вкладки, со строками -/+ и .diff для скачивания."
  },
  "pending.fps.status": { pt: "status", en: "status", ru: "статус" },
  "pending.fps.statusValue": { pt: "pausada · retomar em A–E", en: "paused · resume at A–E", ru: "пауза · возобновить с A–E" },
  "pending.fps.test": { pt: "teste F2", en: "F2 test", ru: "тест F2" },
  "pending.fps.testValue": { pt: "personagem/casas ok · grama/sombra falham", en: "character/houses ok · grass/shadow fail", ru: "персонаж/дома ок · трава/тень не работают" },
  "pending.fps.fps": { pt: "FPS F2", en: "F2 FPS", ru: "FPS F2" },
  "pending.fps.fpsValue": { pt: "baixo · sem ganho", en: "low · no gain", ru: "низкий · без выигрыша" },
  "pending.fps.gain": { pt: "ganho declarado", en: "declared gain", ru: "заявленный выигрыш" },
  "pending.fps.gainValue": { pt: "nenhum", en: "none", ru: "нет" },

  // Atualizações
  "updates.kicker": { pt: "atualizações · github oficial e changelog do projeto", en: "updates · official GitHub and project changelog", ru: "обновления · официальный GitHub и changelog проекта" },
  "updates.title": { pt: "Atualizações", en: "Updates", ru: "Обновления" },
  "updates.lead": {
    pt: "Tudo que foi consertado e tudo que foi criado neste projeto — do motor em v141 e da colisão de zumbi ao WRP do mapa, terreno, navegador, menu de pausa, upDegree e ao porte das 1.390 animações do DayZ 1.30, com as builds E1–E7 e o bug aberto da lanterna. O Feed do GitHub lê commits, releases e o manifesto do repositório Personed/Game; a aba Atualizações manuais é para quem tem a source publicar o changelog curado. A frente de FPS tem aba própria em Pendências → Resolver Drop de FPS.",
    en: "Everything fixed and everything created in this project — from the v141 engine and zombie collision to the map WRP, terrain, browser, pause menu, upDegree and the port of DayZ 1.30's 1,390 animations, with builds E1–E7 and the open flashlight bug. The GitHub feed reads commits, releases and the Personed/Game manifest; the Manual updates tab is for source holders to publish the curated changelog. The FPS effort has its own tab in Pending → Resolve FPS drop.",
    ru: "Всё, что исправлено и создано в проекте — от движка на v141 и столкновений зомби до WRP карты, ландшафта, браузера, меню паузы, upDegree и переноса 1 390 анимаций DayZ 1.30, со сборками E1–E7 и открытым багом фонаря. Лента GitHub читает коммиты, релизы и манифест репозитория Personed/Game; вкладка «Ручные обновления» — для владельцев исходников, публикующих курируемый changelog. У FPS есть отдельная вкладка в «Незавершённое → Устранить падение FPS»."
  },
  "updates.stat.fixed": { pt: "Bugs corrigidos", en: "Fixed bugs", ru: "Исправлено багов" },
  "updates.stat.fixedHint": { pt: "motor, mapa, UI, inventário e builds", en: "engine, map, UI, inventory and builds", ru: "движок, карта, UI, инвентарь и сборки" },
  "updates.stat.impl": { pt: "Implementações", en: "Implementations", ru: "Реализации" },
  "updates.stat.implHint": { pt: "código, pipeline e documentação", en: "code, pipeline and documentation", ru: "код, пайплайн и документация" },
  "updates.stat.animations": { pt: "Animações 1.30", en: "1.30 animations", ru: "Анимации 1.30" },
  "updates.stat.animationsHint": { pt: "de 2.028 · 68,5% · E1–E7", en: "of 2,028 · 68.5% · E1–E7", ru: "из 2 028 · 68,5% · E1–E7" },
  "updates.stat.open": { pt: "Em aberto", en: "Open", ru: "Открыто" },
  "updates.stat.openHint": { pt: "lanterna + pilha · E7 pronta", en: "flashlight + battery · E7 ready", ru: "фонарь + батарея · E7 готова" },
  "updates.step": { pt: "Ver o passo a passo técnico →", en: "View the technical step by step →", ru: "Посмотреть техническое пошаговое руководство →" },
  "updates.pending": { pt: "O que falta", en: "What is missing", ru: "Что осталось" },
  "updates.tab.fixes": { pt: "Bugs corrigidos", en: "Fixed bugs", ru: "Исправленные баги" },
  "updates.tab.fixesSub": { pt: "12 resolvidos · 1 aberto", en: "12 fixed · 1 open", ru: "12 исправлено · 1 открыт" },
  "updates.tab.github": { pt: "Feed do GitHub", en: "GitHub feed", ru: "Лента GitHub" },
  "updates.tab.githubSub": { pt: "commits · releases · Personed/Game", en: "commits · releases · Personed/Game", ru: "коммиты · релизы · Personed/Game" },
  "updates.tab.manual": { pt: "Atualizações manuais", en: "Manual updates", ru: "Ручные обновления" },
  "updates.tab.manualSub": { pt: "quem tem a source publica aqui", en: "source holders publish here", ru: "владельцы исходников публикуют здесь" },
  "updates.tab.impl": { pt: "Novas implementações", en: "New implementations", ru: "Новые реализации" },
  "updates.tab.implSub": { pt: "11 frentes documentadas", en: "11 documented efforts", ru: "11 задокументированных направлений" },
  "updates.tab.animations": { pt: "Animações 1.30", en: "1.30 animations", ru: "Анимации 1.30" },
  "updates.tab.animationsSub": { pt: "1.390 RTMs · E1–E7", en: "1,390 RTMs · E1–E7", ru: "1 390 RTM · E1–E7" },
  "updates.tab.builds": { pt: "Builds E1–E7", en: "Builds E1–E7", ru: "Сборки E1–E7" },
  "updates.tab.buildsSub": { pt: "7 builds · E6 em jogo", en: "7 builds · E6 in game", ru: "7 сборок · E6 в игре" },
  "updates.tab.timeline": { pt: "Linha do tempo", en: "Timeline", ru: "Хронология" },
  "updates.tab.timelineSub": { pt: "16 a 18 de novembro", en: "November 16–18", ru: "16–18 ноября" },

  // Passo a passo
  "walkthrough.kicker": { pt: "animações · passo a passo técnico", en: "animations · technical walkthrough", ru: "анимации · техническое пошаговое руководство" },
  "walkthrough.title": { pt: "Como o 1.30 entrou no 0.45", en: "How 1.30 got into 0.45", ru: "Как 1.30 попал в 0.45" },
  "walkthrough.lead": {
    pt: "O porte completo, na ordem em que aconteceu: extração do PBO, leitura dos dois formatos de RTM, mapeamento dos nomes, validação, trim de ossos, staging, empacotamento e teste. Com o código real, os hexdumps de antes e depois e os números de cada etapa.",
    en: "The complete port, in the order it happened: PBO extraction, reading both RTM formats, name mapping, validation, bone trim, staging, packing and testing. With the real code, before/after hexdumps and the numbers for each step.",
    ru: "Полный перенос в том порядке, в котором он происходил: извлечение PBO, чтение двух форматов RTM, сопоставление имён, проверка, trim костей, staging, упаковка и тест. С реальным кодом, hexdump до и после и цифрами каждого шага."
  },
  "walkthrough.stat.steps": { pt: "Passos", en: "Steps", ru: "Шагов" },
  "walkthrough.stat.stepsHint": { pt: "do baseline ao teste em jogo", en: "from baseline to in-game test", ru: "от базовой линии до теста в игре" },
  "walkthrough.stat.rtms": { pt: "RTMs no acervo", en: "RTMs in the collection", ru: "RTM в коллекции" },
  "walkthrough.stat.rtmsHint": { pt: "DayZ 1.30 · origem do porte", en: "DayZ 1.30 · port source", ru: "DayZ 1.30 · источник переноса" },
  "walkthrough.stat.files": { pt: "Arquivos trocados", en: "Files replaced", ru: "Заменено файлов" },
  "walkthrough.stat.filesHint": { pt: "do manifesto de 1.527 registros", en: "from the 1,527-entry manifest", ru: "из манифеста на 1 527 записей" },
  "walkthrough.stat.trim": { pt: "Trim de ossos", en: "Bone trim", ru: "Trim костей" },
  "walkthrough.stat.trimHint": { pt: "1.425,9 → 1.091,5 MB", en: "1,425.9 → 1,091.5 MB", ru: "1 425,9 → 1 091,5 МБ" },
};

export function useDocsT() {
  const { locale } = useLocale();

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const entry = DOCS_COPY[key];
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
