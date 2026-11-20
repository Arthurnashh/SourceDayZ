import { useLocale, type Locale } from "../lib/i18n";

type Tri = Record<Locale, string>;

/**
 * Textos da página "Objetivo e plano" — o roteiro de modernização gráfica
 * do DayZ 0.45 em direção ao visual do 0.62.
 *
 * Tudo aqui foi levantado na source: os caminhos e números de linha citados
 * existem no código. O que ainda depende de teste está marcado como pendência.
 */
export const PLANO_COPY: Record<string, Tri> = {
  "plano.kicker": { pt: "projeto", en: "project", ru: "проект" },
  "plano.title": {
    pt: "Objetivo: levar o 0.45 ao visual do 0.62",
    en: "Objective: bring 0.45 to the 0.62 look",
    ru: "Цель: приблизить 0.45 к виду 0.62",
  },
  "plano.lead": {
    pt: "Modernizar o renderizador DirectX 9 da source, sistema por sistema, até a imagem se aproximar do DayZ 0.62. Um ciclo por vez: alterar, compilar, abrir o jogo, comparar e decidir. DirectX 9 agora; DirectX 11 fica para depois.",
    en: "Modernise the source's DirectX 9 renderer, system by system, until the image approaches DayZ 0.62. One cycle at a time: change, build, open the game, compare, decide. DirectX 9 now; DirectX 11 comes later.",
    ru: "Модернизировать рендерер DirectX 9 из исходников, систему за системой, пока картинка не приблизится к DayZ 0.62. Один цикл за раз: изменить, собрать, открыть игру, сравнить, решить. DirectX 9 сейчас; DirectX 11 позже.",
  },
  "plano.cta": { pt: "Objetivo e plano", en: "Objective & plan", ru: "Цель и план" },

  // Pilares
  "plano.pillars.title": { pt: "Três pilares", en: "Three pillars", ru: "Три опоры" },
  "plano.pillar.light.title": { pt: "Iluminação real", en: "Real lighting", ru: "Настоящее освещение" },
  "plano.pillar.light.desc": {
    pt: "Como o sol, o céu e o rebote do chão chegam aos objetos. É o que decide quanto cada face recebe — antes de qualquer curva de cor.",
    en: "How sun, sky and ground bounce reach objects. This decides how much light each face gets — before any colour curve.",
    ru: "Как солнце, небо и отражение от земли попадают на объекты. Именно это решает, сколько света получает каждая грань — до любых кривых цвета.",
  },
  "plano.pillar.shadow.title": { pt: "Sombras", en: "Shadows", ru: "Тени" },
  "plano.pillar.shadow.desc": {
    pt: "Borda, penumbra, resolução e precisão. A sombra do motor é um passe de tela (SSSM), não PCF por objeto: é ali que se melhora.",
    en: "Edge, penumbra, resolution and precision. The engine's shadow is a screen pass (SSSM), not per-object PCF: that is where to improve.",
    ru: "Край, полутень, разрешение и точность. Тень в движке — это экранный проход (SSSM), а не PCF на объект: улучшать нужно там.",
  },
  "plano.pillar.atmo.title": { pt: "Atmosfera e final", en: "Atmosphere and finish", ru: "Атмосфера и финал" },
  "plano.pillar.atmo.desc": {
    pt: "Céu, neblina, noite, nuvens, vegetação e tonemapping. Fecha o visual sem esconder o que a iluminação já faz.",
    en: "Sky, fog, night, clouds, vegetation and tonemapping. It closes the look without hiding what the lighting already does.",
    ru: "Небо, туман, ночь, облака, растительность и тональная компрессия. Завершает вид, не скрывая то, что уже делает освещение.",
  },

  // Método
  "plano.method.title": { pt: "Método obrigatório", en: "Mandatory method", ru: "Обязательный метод" },
  "plano.method.lead": {
    pt: "Cinco passos por melhoria. Nada de cinco sistemas na mesma compilação.",
    en: "Five steps per improvement. Never five systems in one build.",
    ru: "Пять шагов на улучшение. Никак не пять систем в одной сборке.",
  },
  "plano.method.s1.t": { pt: "Alterar um código", en: "Change one piece of code", ru: "Изменить один фрагмент" },
  "plano.method.s1.d": {
    pt: "Uma única mudança isolada, com valor nomeado e reversão óbvia.",
    en: "One isolated change, with a named value and an obvious revert.",
    ru: "Одно изолированное изменение, с именованным значением и очевидным откатом.",
  },
  "plano.method.s2.t": { pt: "Compilar", en: "Build", ru: "Собрать" },
  "plano.method.s2.d": {
    pt: "build-editor-v1.cmd gera cpp-out-editor-v1\\DayZInt.exe, copiado para o pacote jogável.",
    en: "build-editor-v1.cmd produces cpp-out-editor-v1\\DayZInt.exe, copied into the playable package.",
    ru: "build-editor-v1.cmd собирает cpp-out-editor-v1\\DayZInt.exe, копируется в игровой пакет.",
  },
  "plano.method.s3.t": { pt: "Abrir o DayZ", en: "Open DayZ", ru: "Открыть DayZ" },
  "plano.method.s3.d": {
    pt: "Mesmo save, mesmo local, mesmo horário e mesmo clima do teste anterior.",
    en: "Same save, same spot, same time and weather as the previous test.",
    ru: "Тот же сейв, место, время и погода, что и в прошлом тесте.",
  },
  "plano.method.s4.t": { pt: "Comparar", en: "Compare", ru: "Сравнить" },
  "plano.method.s4.d": {
    pt: "Antes e depois lado a lado. Se a diferença não aparece, o código não está no caminho ativo.",
    en: "Before and after side by side. If nothing shows, the code is not on the active path.",
    ru: "До и после рядом. Если разницы нет — код не на активном пути.",
  },
  "plano.method.s5.t": { pt: "Decidir", en: "Decide", ru: "Решить" },
  "plano.method.s5.d": {
    pt: "Manter, ajustar o valor ou reverter. Só então o próximo ciclo começa.",
    en: "Keep, tune the value or revert. Only then does the next cycle start.",
    ru: "Оставить, настроить значение или откатить. Только потом начинается следующий цикл.",
  },

  // Fases
  "plano.phases.title": { pt: "Plano fase por fase", en: "Phase-by-phase plan", ru: "План по фазам" },
  "plano.phases.lead": {
    pt: "Sete fases. Cada uma entrega algo visível e deixa o motor num estado estável para a seguinte.",
    en: "Seven phases. Each delivers something visible and leaves the engine stable for the next one.",
    ru: "Семь фаз. Каждая даёт видимый результат и оставляет движок стабильным для следующей.",
  },
  "plano.phases.col.fase": { pt: "Fase", en: "Phase", ru: "Фаза" },
  "plano.phases.col.goal": { pt: "Objetivo", en: "Goal", ru: "Задача" },
  "plano.phases.col.exit": { pt: "Entrega", en: "Deliverable", ru: "Результат" },

  "plano.phase.what": { pt: "O que fazer", en: "What to do", ru: "Что делать" },
  "plano.phase.image": { pt: "O que muda na imagem", en: "What changes on screen", ru: "Что меняется на экране" },
  "plano.phase.expect": { pt: "Resultado esperado", en: "Expected result", ru: "Ожидаемый результат" },
  "plano.phase.revert": { pt: "Reverter", en: "Revert", ru: "Откат" },

  // Ciclos
  "plano.cycles.title": { pt: "Ciclos de implementação", en: "Implementation cycles", ru: "Циклы внедрения" },
  "plano.cycles.lead": {
    pt: "Ordem exata dos primeiros testes. Cada linha é uma compilação e uma comparação.",
    en: "Exact order of the first tests. Each row is one build and one comparison.",
    ru: "Точный порядок первых тестов. Каждая строка — одна сборка и одно сравнение.",
  },
  "plano.cycles.col.n": { pt: "#", en: "#", ru: "#" },
  "plano.cycles.col.pillar": { pt: "Pilar", en: "Pillar", ru: "Опора" },
  "plano.cycles.col.change": { pt: "Alteração", en: "Change", ru: "Изменение" },
  "plano.cycles.col.expect": { pt: "Diferença esperada", en: "Expected difference", ru: "Ожидаемая разница" },
  "plano.cycles.col.revert": { pt: "Reversão", en: "Revert", ru: "Откат" },

  // Pendências
  "plano.pending.title": { pt: "Pendências técnicas", en: "Open technical items", ru: "Открытые технические вопросы" },
  "plano.pending.lead": {
    pt: "O que ainda precisa de um teste antes de virar código. Nada aqui foi assumido como resolvido.",
    en: "What still needs a test before becoming code. Nothing here is assumed solved.",
    ru: "Что ещё требует теста до превращения в код. Ничего здесь не считается решённым.",
  },

  // Primeira tarefa
  "plano.first.title": { pt: "Primeira tarefa após autorização", en: "First task after approval", ru: "Первая задача после разрешения" },
  "plano.first.lead": {
    pt: "Luz rebatida/bidirecional em lib\\d3d9\\engdd9.cpp: ComputeBackReflection e ComputeGroundReflection. Dois coeficientes e um log único de diagnóstico.",
    en: "Bounce/bidirectional light in lib\\d3d9\\engdd9.cpp: ComputeBackReflection and ComputeGroundReflection. Two coefficients and a single diagnostic log.",
    ru: "Отражённый/двунаправленный свет в lib\\d3d9\\engdd9.cpp: ComputeBackReflection и ComputeGroundReflection. Два коэффициента и один диагностический лог.",
  },
  "plano.first.why": {
    pt: "O valor vira PSC_LDirectionGround, que entra em light.indirect multiplicado por max(-nDotL,0). Ou seja: atua exatamente nas faces que hoje não recebem sol — verso das copas, troncos, faces inferiores e paredes em sombra.",
    en: "The value becomes PSC_LDirectionGround, which feeds light.indirect multiplied by max(-nDotL,0). That is: it acts exactly on the faces that get no sun today — leaf backs, trunks, undersides and shaded walls.",
    ru: "Значение становится PSC_LDirectionGround и входит в light.indirect, умноженное на max(-nDotL,0). То есть действует именно на грани, которые сегодня не получают солнца: обратная сторона листвы, стволы, нижние грани и затенённые стены.",
  },
  "plano.first.check": {
    pt: "O mesmo build imprime uma linha com _bidirect e _groundReflection. Se vierem zero, o coeficiente não tem efeito e o plano passa a somar uma fração da difusa — decidido com dado, não no escuro.",
    en: "The same build prints one line with _bidirect and _groundReflection. If they are zero, the coefficient has no effect and the plan adds a fraction of the diffuse instead — decided from data, not in the dark.",
    ru: "Эта же сборка печатает строку с _bidirect и _groundReflection. Если они нулевые, коэффициент не действует, и план добавляет долю диффуза — решение по данным, а не вслепую.",
  },
  "plano.first.test": {
    pt: "Floresta densa ao meio-dia, contra a luz. Observar o verso das copas e o contraste copa↔tronco. Céu, neblina e brilho do sol não devem mudar.",
    en: "Dense forest at noon, shooting into the light. Watch leaf backs and canopy↔trunk contrast. Sky, fog and sun brightness must not change.",
    ru: "Густой лес в полдень, съёмка против света. Смотреть обратную сторону кроны и контраст крона↔ствол. Небо, туман и яркость солнца меняться не должны.",
  },
  "plano.first.revert": {
    pt: "Coeficientes de volta para 1.0 — o comportamento volta a ser exatamente o atual.",
    en: "Coefficients back to 1.0 — behaviour returns exactly to today's.",
    ru: "Коэффициенты обратно на 1.0 — поведение возвращается к текущему.",
  },

  // Estado atual e roadmap F7-F25
  "plano.state.title": { pt: "Onde estamos agora", en: "Where we are now", ru: "Где мы сейчас" },
  "plano.state.lead": {
    pt: "Fotografia do projeto neste ponto: o que já foi aprovado, o que está em teste e o que segue aberto. Nada aqui é promessa — é o que o build e o log mostram.",
    en: "A snapshot of the project at this point: what is approved, what is under test and what remains open. Nothing here is a promise — it is what the build and the log show.",
    ru: "Срез проекта на этот момент: что уже принято, что тестируется и что осталось открытым. Здесь нет обещаний — только то, что видно по сборке и логу.",
  },
  "plano.roadmap.title": { pt: "Roadmap F7 a F25", en: "Roadmap F7 to F25", ru: "План F7–F25" },
  "plano.roadmap.lead": {
    pt: "Cada fase abaixo foi classificada lendo o código real desta source, não por intenção. \"Existe\" significa que há implementação identificada com arquivo e função; \"parcial\" que existe só parte; \"novo\" que precisa de código; \"complexo\" que deve esperar o DX11.",
    en: "Every phase below was classified by reading this source's real code, not by intention. \"Exists\" means there is an implementation identified with file and function; \"partial\" means only part exists; \"new\" needs code; \"complex\" should wait for DX11.",
    ru: "Каждая фаза классифицирована по реальному коду этой source, а не по замыслу. «Есть» — реализация найдена с файлом и функцией; «частично» — есть только часть; «новое» — нужен код; «сложно» — ждёт DX11.",
  },
  "plano.roadmap.col.phase": { pt: "Fase", en: "Phase", ru: "Фаза" },
  "plano.roadmap.col.theme": { pt: "Tema e o que existe hoje", en: "Theme and what exists today", ru: "Тема и что уже есть" },
  "plano.roadmap.col.status": { pt: "Situação", en: "Status", ru: "Статус" },
  "plano.roadmap.col.files": { pt: "Arquivos e shaders", en: "Files and shaders", ru: "Файлы и шейдеры" },
  "plano.roadmap.col.first": { pt: "Primeiro ciclo", en: "First cycle", ru: "Первый цикл" },
  "plano.blocks.title": { pt: "Ordem de execução", en: "Execution order", ru: "Порядок работ" },
  "plano.blocks.lead": {
    pt: "A ordem não é a numérica: segue impacto visual, risco, dependência e custo. Se uma fase precisa de outra antes, ela sobe ou desce na fila com justificativa.",
    en: "The order is not numeric: it follows visual impact, risk, dependency and cost. If a phase needs another first, it moves in the queue with a reason.",
    ru: "Порядок не числовой: он следует визуальному эффекту, риску, зависимостям и цене. Если фазе нужна другая, она меняет место с обоснованием.",
  },
  "plano.method.extra.title": { pt: "O que torna um ciclo válido", en: "What makes a cycle valid", ru: "Что делает цикл действительным" },
  "plano.method.extra.lead": {
    pt: "Quatro regras que valem para todo ciclo, inclusive nas fases profundas do motor.",
    en: "Four rules that hold for every cycle, including the deep engine phases.",
    ru: "Четыре правила для каждого цикла, включая глубокие фазы движка.",
  },
  "plano.method.extra.r1.t": { pt: "Um ciclo, uma mudança", en: "One cycle, one change", ru: "Один цикл — одно изменение" },
  "plano.method.extra.r1.d": {
    pt: "Nunca misturar subsistemas no mesmo build. Se a imagem mudou, precisa haver uma causa única.",
    en: "Never mix subsystems in the same build. If the image changed, there must be a single cause.",
    ru: "Не смешивать подсистемы в одной сборке. Если картинка изменилась, причина должна быть одна.",
  },
  "plano.method.extra.r2.t": { pt: "Backup antes de tocar", en: "Backup before touching", ru: "Бэкап до правки" },
  "plano.method.extra.r2.d": {
    pt: "Cada ciclo começa com cópia datada em BACKUPS\\, e um valor só sobe depois de instrumentado e medido no log.",
    en: "Every cycle starts with a dated copy in BACKUPS\\, and a value only goes up after being instrumented and measured in the log.",
    ru: "Каждый цикл начинается с копии с датой в BACKUPS\\, а значение растёт только после замера в логе.",
  },
  "plano.method.extra.r3.t": { pt: "Diferença visível ou não entra", en: "Visible difference or it does not go in", ru: "Нет видимой разницы — не входит" },
  "plano.method.extra.r3.d": {
    pt: "Se o ciclo não muda a imagem, ele precisa justificar qual ganho visual concreto ele habilita depois. Refatoração sem alvo visual é recusada.",
    en: "If the cycle does not change the image, it must justify which concrete visual gain it enables later. Refactoring without a visual target is refused.",
    ru: "Если цикл не меняет картинку, он должен обосновать, какой конкретный визуальный выигрыш даёт позже. Рефакторинг без визуальной цели отклоняется.",
  },
  "plano.method.extra.r4.t": { pt: "Aprovar ou reverter", en: "Approve or revert", ru: "Принять или откатить" },
  "plano.method.extra.r4.d": {
    pt: "Todo ciclo termina com veredito do teste ao vivo, no mesmo horário, clima e local. Reverter é resultado válido, não fracasso.",
    en: "Every cycle ends with a live-test verdict, at the same time, weather and place. Reverting is a valid outcome, not a failure.",
    ru: "Каждый цикл заканчивается решением по живому тесту в одно время, погоду и место. Откат — допустимый итог, не провал.",
  },

  // Concluidos e situacao dos ciclos
  "plano.done.title": { pt: "Feito e concluído", en: "Done and completed", ru: "Сделано и завершено" },
  "plano.done.lead": {
    pt: "Tudo o que já entrou no jogo, com a evidência no código ou no build. \"Concluído\" = aplicado e aprovado no teste ao vivo; \"aguardando veredito\" = aplicado e buildado, falta o olho no jogo.",
    en: "Everything already in the game, with evidence in code or build. \"Completed\" = applied and approved in the live test; \"awaiting verdict\" = applied and built, waiting for the in-game eye.",
    ru: "Всё, что уже в игре, с подтверждением в коде или сборке. «Завершено» — применено и принято на живом тесте; «ждёт решения» — применено и собрано, нужен взгляд в игре.",
  },
  "plano.done.col.item": { pt: "Item", en: "Item", ru: "Пункт" },
  "plano.done.col.phase": { pt: "Fase / ciclo", en: "Phase / cycle", ru: "Фаза / цикл" },
  "plano.done.col.where": { pt: "Onde está", en: "Where it is", ru: "Где находится" },
  "plano.done.col.status": { pt: "Situação", en: "Status", ru: "Статус" },
  "plano.done.state.done": { pt: "concluído", en: "completed", ru: "завершено" },
  "plano.done.state.review": { pt: "aguardando veredito", en: "awaiting verdict", ru: "ждёт решения" },
  "plano.cycles.col.state": { pt: "Situação", en: "Status", ru: "Статус" },
  "plano.cycle.done": { pt: "concluído", en: "completed", ru: "завершено" },
  "plano.cycle.reverted": { pt: "revertido", en: "reverted", ru: "откат" },
  "plano.cycle.test": { pt: "em teste", en: "under test", ru: "в тесте" },
  "plano.cycle.todo": { pt: "pendente", en: "pending", ru: "ожидает" },
  "plano.cycle.folded": { pt: "absorvido", en: "absorbed", ru: "поглощён" },
};

export interface Phase {
  id: string;
  title: Tri;
  goal: Tri;
  what: Tri[];
  image: Tri;
  expect: Tri;
  revert: Tri;
  cycles: string[];
}

const tri = (pt: string, en: string, ru: string): Tri => ({ pt, en, ru });

// ---------------------------------------------------------------------------
// Roadmap F7-F25 - classificado pelo codigo real, nao por intencao.
// "files" fica em ingles/codigo: e caminho de arquivo, nao texto.
// ---------------------------------------------------------------------------
export type RoadmapStatus = "exists" | "partial" | "new" | "complex" | "tbd";

export const ROADMAP_STATUS: Record<RoadmapStatus, Tri> = {
  exists: tri("existe e aprimorável", "exists, improvable", "есть, можно улучшить"),
  partial: tri("parcialmente existente", "partially exists", "есть частично"),
  new: tri("novo, viável no DX9", "new, viable on DX9", "новое, возможно на DX9"),
  complex: tri("complexo no DX9 — reavaliar no DX11", "complex on DX9 — revisit on DX11", "сложно на DX9 — вернуться в DX11"),
  tbd: tri("ainda não confirmado", "not confirmed yet", "ещё не подтверждено"),
};

export interface RoadmapPhase {
  id: string;
  title: Tri;
  status: RoadmapStatus;
  files: string;
  now: Tri;
  first: Tri;
}

export const ROADMAP: RoadmapPhase[] = [
  {
    id: "F7",
    title: tri("Iluminação da vegetação", "Vegetation lighting", "Освещение растительности"),
    status: "partial",
    files: "VS.hlsl NormalMapThroughFunction; PS.h NormalMap*Through, SpecularNormalMapGrass, GrassAToC; VSTerrainGrass.hlsl",
    now: tri(
      "Folhas já usam variantes \"Through\" (luz vinda de trás) e a grama tem shader próprio com vento e alpha-to-coverage. O peso da translucidez vem do material dentro do PBO.",
      "Leaves already use the \"Through\" variants (back-light) and grass has its own shader with wind and alpha-to-coverage. The translucency weight comes from the material inside the PBO.",
      "Листья уже используют варианты \"Through\" (свет сзади), а трава имеет свой шейдер с ветром и alpha-to-coverage. Вес просвечивания берётся из материала внутри PBO.",
    ),
    first: tri(
      "Primeiro ciclo: um coeficiente global de back-light no shader, para a folha acender contra o sol.",
      "First cycle: one global back-light coefficient in the shader, so leaves glow against the sun.",
      "Первый цикл: один глобальный коэффициент back-light в шейдере, чтобы листва светилась против солнца.",
    ),
  },
  {
    id: "F8",
    title: tri("Sistema de materiais", "Material system", "Система материалов"),
    status: "exists",
    files: "PS.hlsl e PSBasic.hlsl NormalMap/Specular*; engdd9.cpp VSC_LDirectionD/S; engddT.cpp AutodetectAnisotropy",
    now: tri(
      "Difuso + especular Blinn-Phong com potência vinda do material e normal map presente. Não existe PBR nem mapas de roughness/metal no conteúdo 0.45.",
      "Diffuse + Blinn-Phong specular with material-driven power and normal maps present. There is no PBR and no roughness/metal maps in the 0.45 content.",
      "Диффуз + блик Блинна-Фонга с силой из материала и normal map. В контенте 0.45 нет PBR и карт roughness/metal.",
    ),
    first: tri(
      "Primeiro ciclo: curva de especular por potência (normalizar o hot spot), não \"mais brilho\" — o ciclo 3 mostrou que subir o global deixa a pele molhada.",
      "First cycle: specular curve by power (normalise the hot spot), not \"more shine\" — cycle 3 showed that raising the global makes skin look wet.",
      "Первый цикл: кривая блика по мощности (нормализовать hot spot), а не «больше блеска» — цикл 3 показал, что глобальное усиление делает кожу мокрой.",
    ),
  },
  {
    id: "F9",
    title: tri("Iluminação indireta e AO", "Indirect lighting and AO", "Непрямое освещение и AO"),
    status: "exists",
    files: "engdd9.cpp ComputeBackReflection/ComputeGroundReflection; PSSAO em postProcess.cpp; PS.hlsl PSPostProcessSSAO*",
    now: tri(
      "Existe luz rebatida por coeficiente (ciclo 1), luz hemisférica do chão e SSAO em tela cheia. Não existe GI real: o indireto é aproximação por cor de chão.",
      "There is bounce light by coefficient (cycle 1), hemispheric ground light and full-screen SSAO. There is no real GI: indirect light is an approximation by ground colour.",
      "Есть отражённый свет по коэффициенту (цикл 1), полусферический свет от земли и SSAO на весь экран. Настоящего GI нет: непрямой свет — приближение цветом земли.",
    ),
    first: tri(
      "Primeiro ciclo: intensidade e raio do SSAO — escurecimento de contato em canto de casa e base de árvore, o que mais \"moderniza\" uma cena parada.",
      "First cycle: SSAO intensity and radius — contact darkening in wall corners and tree bases, what most \"modernises\" a still scene.",
      "Первый цикл: сила и радиус SSAO — затемнение контакта в углах и у основания деревьев, что сильнее всего «осовременивает» статичную сцену.",
    ),
  },
  {
    id: "F10",
    title: tri("Iluminação volumétrica", "Volumetric lighting", "Объёмное освещение"),
    status: "exists",
    files: "PS.hlsl PSPostProcessGodRays* (1369-1480); engine.hpp PEGodRays; postProcess.cpp PFXGodRays; scene.cpp fog",
    now: tri(
      "God rays completos já existem: máscara do sol, redução, dilatação, blur e composição. É efeito de tela cheia — funciona com sol visível, não gera feixe entre árvores.",
      "God rays already exist in full: sun mask, shrink, dilate, blur and composite. It is a full-screen effect — it works with a visible sun, it does not create beams between trees.",
      "God rays уже есть целиком: маска солнца, сжатие, расширение, blur и композиция. Это эффект на весь экран — работает при видимом солнце, но не даёт лучей между деревьями.",
    ),
    first: tri(
      "Primeiro ciclo: ajustar os parâmetros existentes (intensidade, comprimento, overburn) e colorir a névoa pelo céu.",
      "First cycle: tune the existing parameters (intensity, length, overburn) and colour the fog from the sky.",
      "Первый цикл: настроить существующие параметры (сила, длина, overburn) и окрасить туман цветом неба.",
    ),
  },
  {
    id: "F11",
    title: tri("Renderizador de terreno", "Terrain renderer", "Рендер ландшафта"),
    status: "exists",
    files: "VSTerrain.hlsl; PS.h Terrain15/TerrainX/TerrainSNX/Road2Pass; landscape.cpp",
    now: tri(
      "Mistura de camadas por máscara (satMap) com detalhe e normais; estrada em dois passes (Road2Pass) para evitar z-fighting. Sem parallax nem triplanar.",
      "Layer blending by mask (satMap) with detail and normals; road in two passes (Road2Pass) to avoid z-fighting. No parallax or triplanar.",
      "Смешивание слоёв по маске (satMap) с детализацией и нормалями; дорога в два прохода (Road2Pass) против z-fighting. Нет parallax и triplanar.",
    ),
    first: tri(
      "Primeiro ciclo: detalhe de perto (detail map + normais) e mistura mais suave entre camadas.",
      "First cycle: close-up detail (detail map + normals) and smoother blending between layers.",
      "Первый цикл: детализация вблизи (detail map + нормали) и более мягкое смешивание слоёв.",
    ),
  },
  {
    id: "F12",
    title: tri("Renderização da água", "Water rendering", "Рендер воды"),
    status: "exists",
    files: "VSWater.hlsl, VSCalmWater.hlsl, VSShore.hlsl; PS.h Water, GetWaterFinalColor",
    now: tri(
      "Fresnel já existe nos shaders; reflexo é aproximado por cor de céu + especular do sol; margem com passe próprio (VSShore) e espuma. Sem reflexo planar ou SSR.",
      "Fresnel already exists in the shaders; reflection is approximated by sky colour + sun specular; shoreline has its own pass (VSShore) and foam. No planar or SSR reflection.",
      "Fresnel уже есть в шейдерах; отражение приближено цветом неба + бликом солнца; берег имеет свой проход (VSShore) и пену. Нет planar/SSR отражений.",
    ),
    first: tri(
      "Primeiro ciclo: Fresnel mais forte e cor por profundidade; depois normal map em duas escalas.",
      "First cycle: stronger Fresnel and colour by depth; then normal map in two scales.",
      "Первый цикл: усилить Fresnel и цвет по глубине; затем normal map в двух масштабах.",
    ),
  },
  {
    id: "F13",
    title: tri("Nuvens e céu", "Clouds and sky", "Облака и небо"),
    status: "exists",
    files: "SimulWeather/SimulSkyRendererBase.cpp:332-345; SimulCloudRendererBase.cpp; landWeather.cpp",
    now: tri(
      "O céu visível é o Simul Weather, e ele lê apenas mie, rayleigh e swBrightness do LandLighting — _sky não pinta a tela. Foi o que explicou os ciclos de céu sem efeito.",
      "The visible sky is Simul Weather, and it reads only mie, rayleigh and swBrightness from LandLighting — _sky does not paint the screen. That explains the sky cycles with no effect.",
      "Видимое небо — Simul Weather, он читает только mie, rayleigh и swBrightness из LandLighting; _sky не рисует экран. Это объясняет циклы неба без эффекта.",
    ),
    first: tri(
      "Ciclo em andamento: fechar o poente com mie/rayleigh medidos no log, e nuvens quentes.",
      "Cycle in progress: close the sunset with mie/rayleigh measured in the log, and warm clouds.",
      "Текущий цикл: довести закат с mie/rayleigh по логу и тёплые облака.",
    ),
  },
  {
    id: "F14",
    title: tri("Materiais molhados", "Wet materials", "Мокрые материалы"),
    status: "partial",
    files: "postProcess.cpp PEWetDistortion (11322); PS.hlsl PSPostProcessWet*",
    now: tri(
      "Só existe distorção de tela na chuva. Nenhum material escurece ou ganha brilho quando molha.",
      "Only screen distortion exists in the rain. No material darkens or gains shine when wet.",
      "Есть только искажение экрана в дождь. Ни один материал не темнеет и не блестит от влаги.",
    ),
    first: tri(
      "Primeiro ciclo: uma constante global de wetness vinda do clima, escurecendo o albedo e subindo o especular.",
      "First cycle: one global wetness constant from weather, darkening albedo and raising specular.",
      "Первый цикл: глобальная константа wetness из погоды — темнее albedo, сильнее блик.",
    ),
  },
  {
    id: "F15",
    title: tri("Sombras avançadas", "Advanced shadows", "Продвинутые тени"),
    status: "exists",
    files: "engine.hpp:1000 cascatas; engdd9.cpp:19323-19384; landscape.cpp:6037; PSBasicSSSM.hlsl; PS.hlsl:751-795",
    now: tri(
      "4 cascatas com razão 3.0 (250 / 83 / 28 / 9 m), shadow map 2048 (shadowQuality=4), comparação bilinear de 4 taps e SSSM com 9 taps. Bias vem só do plano de projeção.",
      "4 cascades at ratio 3.0 (250 / 83 / 28 / 9 m), 2048 shadow map (shadowQuality=4), 4-tap bilinear compare and 9-tap SSSM. Bias comes only from the projection plane.",
      "4 каскада с шагом 3.0 (250 / 83 / 28 / 9 м), карта 2048 (shadowQuality=4), билинейное сравнение 4 тапа и SSSM 9 тапов. Bias только из плоскости проекции.",
    ),
    first: tri(
      "Feito agora: shadowQuality 5 (4096). Próximos ciclos: comparação suave por texel e bias por cascata.",
      "Done now: shadowQuality 5 (4096). Next cycles: soft compare by texel and per-cascade bias.",
      "Сделано сейчас: shadowQuality 5 (4096). Далее: мягкое сравнение по текселю и bias на каскад.",
    ),
  },
  {
    id: "F16",
    title: tri("Texturas e streaming", "Textures and streaming", "Текстуры и streaming"),
    status: "exists",
    files: "txtD3D9.cpp; engddT.cpp SetAnisotropyQuality/AnisotropyLevel/AutodetectAnisotropy",
    now: tri(
      "Filtragem anisotrópica automática por tipo de material; estradas e terreno recebem menos. Não há streaming por orçamento de VRAM — carrega tudo.",
      "Automatic anisotropic filtering per material type; roads and terrain get less. No VRAM-budget streaming — everything is loaded.",
      "Автоматическая анизотропия по типу материала; дороги и ландшафт получают меньше. Нет streaming по бюджету VRAM — грузится всё.",
    ),
    first: tri(
      "Primeiro ciclo: AF 8-16x em terreno/estrada e mip bias — barato e mensurável.",
      "First cycle: 8-16x AF on terrain/road plus mip bias — cheap and measurable.",
      "Первый цикл: AF 8-16x на ландшафт/дорогу и mip bias — дёшево и измеримо.",
    ),
  },
  {
    id: "F17",
    title: tri("LOD e visibilidade", "LOD and visibility", "LOD и видимость"),
    status: "partial",
    files: "Shape/LOD selection; frustum culling em engdd9.cpp; sem OcclusionQuery no código",
    now: tri(
      "Seleção de LOD por distância e culling por frustum existem. Occlusion culling não existe: zero ocorrências de OcclusionQuery/OcclusionCull na source.",
      "Distance LOD selection and frustum culling exist. Occlusion culling does not: zero occurrences of OcclusionQuery/OcclusionCull in the source.",
      "Выбор LOD по дистанции и frustum culling есть. Occlusion culling отсутствует: ноль вхождений OcclusionQuery/OcclusionCull в исходниках.",
    ),
    first: tri(
      "Primeiro ciclo: histerese de LOD para acabar com o \"pulo\" visual — barato e sem risco.",
      "First cycle: LOD hysteresis to end the visual \"pop\" — cheap, no risk.",
      "Первый цикл: гистерезис LOD, чтобы убрать визуальный «скачок» — дёшево и без риска.",
    ),
  },
  {
    id: "F18",
    title: tri("Transparência e alpha", "Transparency and alpha", "Прозрачность и alpha"),
    status: "exists",
    files: "PS.h GrassAToC/AlphaTest; ordenação de transparentes em engdd9.cpp",
    now: tri(
      "Alpha-to-coverage existe (GrassAToC) e a ordenação é por objeto, não por pixel — folhas sobrepostas geram halo.",
      "Alpha-to-coverage exists (GrassAToC) and sorting is per object, not per pixel — overlapping leaves create halos.",
      "Alpha-to-coverage есть (GrassAToC), сортировка по объекту, не по пикселю — перекрытые листья дают ореол.",
    ),
    first: tri(
      "Primeiro ciclo: AToC em mais materiais de folhagem, com MSAA ligado (feito agora no config).",
      "First cycle: AToC on more foliage materials, with MSAA on (done now in config).",
      "Первый цикл: AToC на большем числе материалов листвы при включённом MSAA (сделано в конфиге).",
    ),
  },
  {
    id: "F19",
    title: tri("Partículas e efeitos", "Particles and effects", "Частицы и эффекты"),
    status: "exists",
    files: "smokes.cpp/.hpp CParticleSource; VSSprite.hlsl; PSSR_Default.hlsl/PSSR_nVidia.hlsl",
    now: tri(
      "Fumaça, fogo, poeira e chuva existem com soft particles por depth. A cor da partícula é praticamente fixa + ambiente.",
      "Smoke, fire, dust and rain exist with depth-based soft particles. Particle colour is basically fixed + ambient.",
      "Дым, огонь, пыль и дождь есть с soft particles по depth. Цвет частицы почти фиксированный + ambient.",
    ),
    first: tri(
      "Primeiro ciclo: multiplicar a fumaça pela cor do sol — reage ao poente sem custo.",
      "First cycle: multiply smoke by the sun colour — reacts to the sunset at no cost.",
      "Первый цикл: умножить дым на цвет солнца — реагирует на закат без затрат.",
    ),
  },
  {
    id: "F20",
    title: tri("Antialiasing", "Antialiasing", "Сглаживание"),
    status: "exists",
    files: "Fxaa3_11.h; PPAA/SMAA.h + AreaTex/SearchTex (postProcess.cpp:2605); engdd9.cpp SetPPAAQuality",
    now: tri(
      "FXAA e SMAA completos já estão no engine. A escolha é só config: quality > 3 vira SMAA (qualidade-3). AToC exige MSAA ligado.",
      "Full FXAA and SMAA are already in the engine. The choice is config only: quality > 3 becomes SMAA (quality-3). AToC requires MSAA on.",
      "FXAA и SMAA целиком уже в движке. Выбор только в конфиге: quality > 3 = SMAA (quality-3). AToC требует MSAA.",
    ),
    first: tri(
      "Feito agora: PPAA=5 (SMAA high) + AToC=1 com FSAA=2.",
      "Done now: PPAA=5 (SMAA high) + AToC=1 with FSAA=2.",
      "Сделано сейчас: PPAA=5 (SMAA high) + AToC=1 при FSAA=2.",
    ),
  },
  {
    id: "F21",
    title: tri("Precisão de profundidade", "Depth precision", "Точность глубины"),
    status: "tbd",
    files: "engdd9.cpp criação do device/depth; Road2Pass como sintoma",
    now: tri(
      "O formato de depth/stencil e o near plane ainda não foram confirmados. O z-fighting visível em estrada parece vir do decal, não da precisão.",
      "The depth/stencil format and near plane are not confirmed yet. Visible road z-fighting seems to come from the decal, not precision.",
      "Формат depth/stencil и near plane ещё не подтверждены. Z-fighting на дороге, похоже, от декали, а не от точности.",
    ),
    first: tri(
      "Primeiro ciclo: instrumentar formato, near e bias antes de mexer em qualquer coisa.",
      "First cycle: instrument format, near and bias before changing anything.",
      "Первый цикл: замерить формат, near и bias до любых изменений.",
    ),
  },
  {
    id: "F22",
    title: tri("Arquitetura dos passes", "Render pass architecture", "Архитектура проходов"),
    status: "exists",
    files: "postProcess.cpp/.hpp (PHandle, prioridade, Commit*)",
    now: tri(
      "Cadeia de pós-processamento com prioridade e dependências funciona. Não há motivo para reescrever.",
      "The post-process chain with priority and dependencies works. There is no reason to rewrite it.",
      "Цепочка постобработки с приоритетами и зависимостями работает. Переписывать незачем.",
    ),
    first: tri(
      "Sem ciclo próprio: só documentar e ajustar ordem quando um efeito exigir.",
      "No cycle of its own: only document and adjust order when an effect requires it.",
      "Без отдельного цикла: только документировать и менять порядок по необходимости.",
    ),
  },
  {
    id: "F23",
    title: tri("Otimização e GPU", "Optimisation and GPU", "Оптимизация и GPU"),
    status: "tbd",
    files: "PROFILE_SCOPE; sem contador de draw calls exposto",
    now: tri(
      "Não há contador de draw calls. Já se sabe, por medição anterior, que drawUI custa 10-16 ms e é o gargalo de FPS — não a cena 3D.",
      "There is no draw call counter. Earlier measurement already shows drawUI costs 10-16 ms and is the FPS bottleneck — not the 3D scene.",
      "Счётчика draw calls нет. Ранее измерено: drawUI стоит 10-16 мс и является узким местом FPS, а не 3D-сцена.",
    ),
    first: tri(
      "Primeiro ciclo: instrumentar draw calls e tempo por passe antes de otimizar.",
      "First cycle: instrument draw calls and per-pass time before optimising.",
      "Первый цикл: замерить draw calls и время по проходам до оптимизации.",
    ),
  },
  {
    id: "F24",
    title: tri("Arquitetura de shaders", "Shader architecture", "Архитектура шейдеров"),
    status: "exists",
    files: "PS.h/PS.hlsl/VS.h/VS.hlsl/common.h; macros XXD/XXC/XXS; ShaderCompileCache.cpp",
    now: tri(
      "Variantes geradas por macro e compiladas em runtime, com cache em bin\\*.shdc. O .hlsl é lido do disco: mudar shader não exige recompilar o exe.",
      "Variants generated by macros and compiled at runtime, cached in bin\\*.shdc. The .hlsl is read from disk: changing a shader does not require rebuilding the exe.",
      "Варианты генерируются макросами и компилируются в runtime, кэш в bin\\*.shdc. .hlsl читается с диска: правка шейдера не требует пересборки exe.",
    ),
    first: tri(
      "Sem refatoração: só manter e documentar.",
      "No refactor: just maintain and document.",
      "Без рефакторинга: только поддерживать и документировать.",
    ),
  },
  {
    id: "F25",
    title: tri("Validação global", "Global validation", "Общая проверка"),
    status: "new",
    files: "build-editor-v1.cmd, build-sqfexec-v128.cmd, RPT, FPS-DIAG",
    now: tri(
      "Cada bloco termina com build de cliente e servidor, marcador no RPT e comparação no mesmo horário/clima/local.",
      "Each block ends with client and server builds, an RPT marker and a comparison at the same time/weather/place.",
      "Каждый блок завершается сборкой клиента и сервера, маркером в RPT и сравнением в одно время/погоду/место.",
    ),
    first: tri(
      "Rodar a matriz: amanhecer, meio-dia, entardecer, noite × limpo, nublado, chuva.",
      "Run the matrix: dawn, noon, dusk, night × clear, overcast, rain.",
      "Прогнать матрицу: рассвет, полдень, закат, ночь × ясно, облачно, дождь.",
    ),
  },
];

export interface RoadmapBlock {
  id: string;
  title: Tri;
  phases: string;
  why: Tri;
}

export const ROADMAP_BLOCKS: RoadmapBlock[] = [
  {
    id: "A",
    title: tri("Céu e atmosfera", "Sky and atmosphere", "Небо и атмосфера"),
    phases: "F13 → F10",
    why: tri(
      "É o que já está em teste e o único caminho comprovado para mudar o céu (Simul Weather).",
      "It is what is already under test and the only proven path to change the sky (Simul Weather).",
      "Это уже тестируется и единственный проверенный путь менять небо (Simul Weather).",
    ),
  },
  {
    id: "B",
    title: tri("Superfícies", "Surfaces", "Поверхности"),
    phases: "F8 → F7 → F11 → F12",
    why: tri(
      "Material antes de vegetação: a folha herda a resposta especular/difusa que F8 definir.",
      "Material before vegetation: leaves inherit the specular/diffuse response F8 defines.",
      "Материал раньше растительности: листва наследует отклик F8.",
    ),
  },
  {
    id: "C",
    title: tri("Luz e sombra", "Light and shadow", "Свет и тень"),
    phases: "F15 → F9 → F14",
    why: tri(
      "Sombra antes de AO: os dois usam profundidade, e ajustar sombra primeiro evita mascarar artefato de AO. Molhado depende do especular de F8.",
      "Shadow before AO: both use depth, and fixing shadow first avoids masking AO artefacts. Wet depends on F8 specular.",
      "Тень раньше AO: оба используют depth; сначала тень, чтобы не маскировать артефакты AO. Мокрое зависит от блика F8.",
    ),
  },
  {
    id: "D",
    title: tri("Acabamento", "Finishing", "Отделка"),
    phases: "F20 → F19 → F18 → F16",
    why: tri(
      "AToC exige MSAA, então AA vem antes. O resto é ganho barato e mensurável.",
      "AToC requires MSAA, so AA comes first. The rest is cheap, measurable gain.",
      "AToC требует MSAA, поэтому AA раньше. Остальное — дешёвый измеримый выигрыш.",
    ),
  },
  {
    id: "E",
    title: tri("Estrutura", "Structure", "Структура"),
    phases: "F17 → F21 → F23 → F22/F24",
    why: tri(
      "Otimizar antes de estabilizar a imagem é retrabalho. F22 e F24 não têm ciclo próprio sem objetivo visual.",
      "Optimising before the image is stable is rework. F22 and F24 have no cycle of their own without a visual goal.",
      "Оптимизировать до стабилизации картинки — переделка. У F22 и F24 нет своего цикла без визуальной цели.",
    ),
  },
];

export interface StateItem {
  id: string;
  label: Tri;
  value: Tri;
  tone: "lime" | "amber" | "blue" | "violet" | "red";
}

export const CURRENT_STATE: StateItem[] = [
  {
    id: "ciclos",
    label: tri("Ciclos concluídos", "Completed cycles", "Завершённые циклы"),
    value: tri(
      "1 a 9 — rebote, SSSM, névoa, flare, bloom/SSAO e céu. Os ciclos 3 (especular global) e 6 (pow do céu) foram revertidos por teste.",
      "1 to 9 — bounce, SSSM, fog, flare, bloom/SSAO and sky. Cycles 3 (global specular) and 6 (sky pow) were reverted after testing.",
      "1–9 — отражение, SSSM, туман, flare, bloom/SSAO и небо. Циклы 3 (глобальный блик) и 6 (pow неба) откатаны после проверки.",
    ),
    tone: "lime",
  },
  {
    id: "sync",
    label: tri("Tempo e clima", "Time and weather", "Время и погода"),
    value: tri(
      "Sincronização servidor → cliente corrigida e validada ao vivo: setDate, setOvercast, setFog e setRain chegam por ApplyWeatherMessage. O horário é do servidor, nunca travado no cliente.",
      "Server → client sync fixed and validated live: setDate, setOvercast, setFog and setRain arrive via ApplyWeatherMessage. Time belongs to the server, never frozen in the client.",
      "Синхронизация сервер → клиент исправлена и проверена вживую: setDate, setOvercast, setFog, setRain приходят через ApplyWeatherMessage. Время задаёт сервер, не клиент.",
    ),
    tone: "blue",
  },
  {
    id: "ceu",
    label: tri("Diagnóstico do céu", "Sky finding", "Диагностика неба"),
    value: tri(
      "O céu visível é Simul Weather e lê só mie, rayleigh e swBrightness. Tingir _sky não muda a tela — foi por isso que os ciclos de céu não apareceram.",
      "The visible sky is Simul Weather and reads only mie, rayleigh and swBrightness. Tinting _sky does not change the screen — that is why sky cycles did not show.",
      "Видимое небо — Simul Weather, читает только mie, rayleigh, swBrightness. Окраска _sky не меняет экран — поэтому циклы неба не были видны.",
    ),
    tone: "violet",
  },
  {
    id: "agora",
    label: tri("Aplicado no build atual", "Applied in the current build", "Применено в текущей сборке"),
    value: tri(
      "Concluído: sombras 4096 (shadowQuality 5), SMAA high (PPAA=5), AToC=1 com FSAA=2 e tonemap com pivô em 0.5 (contraste 1.25, saturação 1.35). Falta apenas o veredito visual.",
      "Completed: 4096 shadows (shadowQuality 5), SMAA high (PPAA=5), AToC=1 with FSAA=2 and pivot tonemap at 0.5 (contrast 1.25, saturation 1.35). Only the visual verdict is missing.",
      "Готово: тени 4096 (shadowQuality 5), SMAA high (PPAA=5), AToC=1 при FSAA=2 и tonemap с pivot 0.5 (контраст 1.25, насыщенность 1.35). Осталось только визуальное решение.",
    ),
    tone: "lime",
  },
  {
    id: "aberto",
    label: tri("Ainda aberto", "Still open", "Ещё открыто"),
    value: tri(
      "Poente laranja ainda não aprovado visualmente; drawUI custa 10-16 ms e é o gargalo de FPS; logs F9-* e F15-* são diagnósticos e saem no fim do bloco.",
      "Orange sunset not visually approved yet; drawUI costs 10-16 ms and is the FPS bottleneck; F9-* and F15-* logs are diagnostics and will be removed at the end of the block.",
      "Оранжевый закат ещё не подтверждён визуально; drawUI стоит 10-16 мс и тормозит FPS; логи F9-*/F15-* диагностические и будут убраны в конце блока.",
    ),
    tone: "red",
  },
];

// ---------------------------------------------------------------------------
// O que ja foi feito - cada item com a evidencia real (arquivo/linha ou build)
// ---------------------------------------------------------------------------
export interface DoneItem {
  id: string;
  phase: string;
  title: Tri;
  where: string;
  status: "done" | "review";
}

export const DONE: DoneItem[] = [
  {
    id: "D1",
    phase: "F1 · ciclo 1",
    title: tri("Luz rebatida / bidirecional", "Bounce / bidirectional light", "Отражённый/двусторонний свет"),
    where: "lib\\engdd9.cpp — s_bounceBidirectCoef = 12.0f (ComputeBackReflection / ComputeGroundReflection)",
    status: "done",
  },
  {
    id: "D2",
    phase: "F2 · ciclo 2",
    title: tri("SSSM com 9 taps", "SSSM with 9 taps", "SSSM с 9 тапами"),
    where: "PS.hlsl — PSPostProcessSSSMBH/BV, kernel gaussiano sigma 3.5, ±8 texels",
    status: "done",
  },
  {
    id: "D3",
    phase: "F3 · ciclo 5",
    title: tri("Névoa com profundidade", "Fog with depth", "Туман с глубиной"),
    where: "lib\\scene.cpp:488 — startFactor 0.32 / 0.80",
    status: "done",
  },
  {
    id: "D4",
    phase: "F3 · ciclo 7",
    title: tri("Flare do sol contido", "Contained sun flare", "Сдержанный flare солнца"),
    where: "lib\\scene.cpp:4984 — intensity 30 → 10",
    status: "done",
  },
  {
    id: "D5",
    phase: "F3 · ciclo 8",
    title: tri("Bloom e SSAO calibrados", "Bloom and SSAO calibrated", "Bloom и SSAO откалиброваны"),
    where: "bloom threshold 1.25, BloomImgScale 0.55, ssaoEnabled=1",
    status: "done",
  },
  {
    id: "D6",
    phase: "F6 · correção de cor",
    title: tri("Correção de cor base", "Base colour correction", "Базовая коррекция цвета"),
    where: "postProcess.hpp PPColors::SetDefaultValues — brightness/contraste/saturação",
    status: "done",
  },
  {
    id: "D7",
    phase: "infra · F10",
    title: tri("Tempo e clima do servidor chegam ao cliente", "Server time and weather reach the client", "Время и погода сервера доходят до клиента"),
    where: "landWeather.cpp ApplyWeatherMsg (SetDate) + gameStateExt.cpp UpdateRemote + networkServer.cpp no join — validado ao vivo",
    status: "done",
  },
  {
    id: "D8",
    phase: "diagnóstico · F13",
    title: tri("Descoberto o céu real do 0.45 (Simul Weather)", "0.45's real sky found (Simul Weather)", "Найдено реальное небо 0.45 (Simul Weather)"),
    where: "SimulWeather\\SimulSkyRendererBase.cpp:332-345 — lê mie, rayleigh e swBrightness",
    status: "done",
  },
  {
    id: "D9",
    phase: "F15 · ciclo atual",
    title: tri("Sombras em 4096 por cascata", "4096 shadows per cascade", "Тени 4096 на каскад"),
    where: "perfil: shadowQuality=5 → _sbSize = 1024 << 2 (engdd9.cpp:19389)",
    status: "review",
  },
  {
    id: "D10",
    phase: "F20 · ciclo atual",
    title: tri("SMAA High ligado", "SMAA High enabled", "SMAA High включён"),
    where: "DayZ.cfg: PPAA=5 → SetPPAAQuality lê quality > 3 como SMAA preset 2",
    status: "review",
  },
  {
    id: "D11",
    phase: "F18/F20 · ciclo atual",
    title: tri("Alpha-to-coverage nas folhas", "Alpha-to-coverage on leaves", "Alpha-to-coverage на листве"),
    where: "DayZ.cfg: AToC=1 com FSAA=2 (SetAToC exige MSAA)",
    status: "review",
  },
  {
    id: "D12",
    phase: "F6 · ciclo atual",
    title: tri("Tonemap com pivô em 0.5", "Pivot tonemap at 0.5", "Tonemap с pivot 0.5"),
    where: "postProcess.hpp (contraste 1.25, offset 0.012, saturação 1.35) + PS.hlsl PsPpColors",
    status: "review",
  },
];

// Situação de cada ciclo ja executado (a tabela CYCLES nao carrega estado)
export const CYCLE_STATE: Record<string, "done" | "reverted" | "test" | "todo" | "folded"> = {
  "1": "done",
  "2": "done",
  "3": "reverted",
  "4": "folded",
  "5": "done",
  "6": "reverted",
  "7": "done",
  "8": "done",
  "9": "test",
  "10": "todo",
  "11": "todo",
};

export const CYCLE_STATE_NOTE: Record<string, Tri> = {
  "1": tri("aprovado — coeficiente 12.0", "approved — coefficient 12.0", "принято — коэффициент 12.0"),
  "2": tri("aprovado — 9 taps", "approved — 9 taps", "принято — 9 тапов"),
  "3": tri("revertido — 0.8 voltou para 0.5 (pele molhada)", "reverted — 0.8 back to 0.5 (wet skin)", "откат — 0.8 вернули на 0.5 (мокрая кожа)"),
  "4": tri("absorvido pelo ciclo 2 — a penumbra maior veio no kernel novo", "absorbed by cycle 2 — wider penumbra came with the new kernel", "поглощён циклом 2 — широкая полутень пришла с новым ядром"),
  "5": tri("aprovado — 0.32/0.80", "approved — 0.32/0.80", "принято — 0.32/0.80"),
  "6": tri("revertido — pow 3 voltou para 6", "reverted — pow 3 back to 6", "откат — pow 3 вернули на 6"),
  "7": tri("aprovado — 30 → 10", "approved — 30 → 10", "принято — 30 → 10"),
  "8": tri("aprovado — bloom 1.25 + SSAO", "approved — bloom 1.25 + SSAO", "принято — bloom 1.25 + SSAO"),
  "9": tri("em teste — mie/rayleigh aplicados, poente ainda não aprovado", "under test — mie/rayleigh applied, sunset not approved yet", "в тесте — mie/rayleigh применены, закат ещё не принят"),
  "10": tri("pendente", "pending", "ожидает"),
  "11": tri("pendente — o pivô de contraste já entrou como preparação", "pending — the contrast pivot already landed as a preparation", "ожидает — pivot контраста уже внесён как подготовка"),
};

export const PHASES: Phase[] = [
  {
    id: "F0",
    title: tri("F0 — Baseline", "F0 — Baseline", "F0 — Базовая версия"),
    goal: tri(
      "Colocar a source sob controle de versão antes de qualquer alteração de imagem.",
      "Put the source under version control before any image change.",
      "Поставить исходники под контроль версий до любых изменений картинки.",
    ),
    what: [
      tri("Versionar a source (hoje não há .git) e commitar os patches que já existem: grama e editor2.", "Version the source (there is no .git today) and commit the existing patches: grass and editor2.", "Поставить исходники под git (сейчас .git нет) и закоммитить текущие патчи: трава и editor2."),
      tri("Tirar 3 capturas: floresta ao meio-dia, cidade no fim da tarde, campo à noite — mesmo save.", "Take 3 captures: forest at noon, town at dusk, field at night — same save.", "Снять 3 кадра: лес в полдень, город на закате, поле ночью — тот же сейв."),
      tri("Guardar as capturas junto de uma tag para virar o \"antes\" de todo ciclo seguinte.", "Store the captures with a tag so they become the \"before\" of every later cycle.", "Сохранить кадры вместе с тегом — они станут «до» для всех следующих циклов."),
    ],
    image: tri(
      "Nada. Nenhuma linha de render é tocada nesta fase.",
      "Nothing. No render line is touched in this phase.",
      "Ничего. Ни одна строка рендера в этой фазе не меняется.",
    ),
    expect: tri(
      "Tag baseline-antes-modernizacao + 3 capturas de referência. É o que permite provar depois o que melhorou e reverter sem discussão.",
      "Tag baseline-antes-modernizacao + 3 reference captures. It is what lets you prove later what improved and revert without argument.",
      "Тег baseline-antes-modernizacao + 3 эталонных кадра. Именно это позволяет потом доказать улучшение и откатиться без споров.",
    ),
    revert: tri("Não se aplica — nenhuma alteração de código.", "Not applicable — no code change.", "Не применимо — изменений кода нет."),
    cycles: [],
  },
  {
    id: "F1",
    title: tri("F1 — Iluminação real", "F1 — Real lighting", "F1 — Настоящее освещение"),
    goal: tri(
      "Mudar como a luz chega aos objetos: rebote do chão, luz do céu, sol por horário e resposta especular. Ainda não é cor.",
      "Change how light reaches objects: ground bounce, sky light, sun by time of day and specular response. Still not colour.",
      "Изменить то, как свет попадает на объекты: отражение от земли, свет неба, солнце по времени суток и блики. Это ещё не цвет.",
    ),
    what: [
      tri("Luz rebatida: coeficientes nomeados em ComputeBackReflection e ComputeGroundReflection (engdd9.cpp) + 1 log dos valores crus.", "Bounce light: named coefficients in ComputeBackReflection and ComputeGroundReflection (engdd9.cpp) + 1 log of the raw values.", "Отражённый свет: именованные коэффициенты в ComputeBackReflection и ComputeGroundReflection (engdd9.cpp) + 1 лог сырых значений."),
      tri("Ambiente hemisférico: garantir que céu em cima e chão embaixo participem em RecalculateLighting (scene.cpp).", "Hemispheric ambient: make sure sky above and ground below take part in RecalculateLighting (scene.cpp).", "Полусферический ambient: убедиться, что небо сверху и земля снизу участвуют в RecalculateLighting (scene.cpp)."),
      tri("Luz do céu e do horizonte (LSky / LHorizon) entrando nos objetos, não só no fundo.", "Sky and horizon light (LSky / LHorizon) reaching objects, not only the background.", "Свет неба и горизонта (LSky / LHorizon) попадает на объекты, а не только на фон."),
      tri("Especular: devolver o expoente do material em vez de zero nos constantes do pixel shader.", "Specular: return the material exponent instead of zero in the pixel shader constants.", "Блик: возвращать показатель материала вместо нуля в константах пиксельного шейдера."),
    ],
    image: tri(
      "As faces viradas para o chão e as opostas ao sol deixam de ser pretas ou cinzentas e passam a receber luz indireta. Metais e plásticos ganham brilho direcional.",
      "Faces turned to the ground and faces away from the sun stop being black or grey and start receiving indirect light. Metals and plastics gain directional highlights.",
      "Грани, обращённые к земле и от солнца, перестают быть чёрными или серыми и получают отражённый свет. Металл и пластик получают направленный блик.",
    ),
    expect: tri(
      "Floresta e paredes sombreadas param de parecer chapadas; o volume aparece nas copas e nos muros. É o maior salto visual do projeto — e o mais fácil de exagerar, por isso são três ciclos separados.",
      "Forest and shaded walls stop looking flat; volume appears in canopies and walls. It is the biggest visual jump of the project — and the easiest to overdo, hence three separate cycles.",
      "Лес и затенённые стены перестают быть плоскими; появляется объём в кронах и стенах. Это самый большой визуальный скачок проекта — и его легче всего переусердствовать, поэтому здесь три отдельных цикла.",
    ),
    revert: tri(
      "Coeficientes de volta para 1.0 — o comportamento volta a ser exatamente o atual.",
      "Coefficients back to 1.0 — behaviour returns exactly to today's.",
      "Коэффициенты обратно на 1.0 — поведение возвращается к текущему.",
    ),
    cycles: ["1", "3", "6"],
  },
  {
    id: "F2",
    title: tri("F2 — Sombras", "F2 — Shadows", "F2 — Тени"),
    goal: tri(
      "Melhorar o passe de sombra que já existe (SSSM). Não se cria PCF novo por objeto.",
      "Improve the shadow pass that already exists (SSSM). No new per-object PCF.",
      "Улучшить существующий проход теней (SSSM). Новый PCF на объект не создаётся.",
    ),
    what: [
      tri("Confirmar pelo log qual técnica de shadow buffer está ativa (UseShadowMapSB) antes de mexer em qualquer número.", "Confirm from the log which shadow buffer technique is active (UseShadowMapSB) before touching any number.", "Подтвердить по логу, какая техника shadow buffer активна (UseShadowMapSB), прежде чем менять числа."),
      tri("Subir os taps do SSSM de 4 para 9 (3×3), mantendo os pesos bilineares e o blurCoef.", "Raise SSSM taps from 4 to 9 (3×3), keeping the bilinear weights and blurCoef.", "Поднять выборки SSSM с 4 до 9 (3×3), сохранив билинейные веса и blurCoef."),
      tri("Alargar a penumbra pelo blurCoef — sem deslocar o centro da amostragem.", "Widen the penumbra via blurCoef — without shifting the sampling centre.", "Расширить полутень через blurCoef — не смещая центр выборки."),
      tri("Só se ainda faltar: mexer na resolução do mapa de sombra.", "Only if still lacking: change the shadow map resolution.", "Только если всё ещё не хватает: менять разрешение карты теней."),
    ],
    image: tri(
      "Borda dura de sombra vira degradê; sombra de folhagem fica menos serrilhada; o contato do objeto com o chão deixa de parecer recortado.",
      "Hard shadow edge turns into a gradient; foliage shadows get less jagged; the object-ground contact stops looking cut out.",
      "Жёсткий край тени становится градиентом; тень листвы меньше рвётся; контакт объекта с землёй перестаёт выглядеть вырезанным.",
    ),
    expect: tri(
      "Borda macia e penumbra maior sem a sombra andar de lugar. Se ela deslocar, o offset do tap está errado: reverte e refaz. Comparar frametime — 9 taps custam fill rate.",
      "Soft edge and wider penumbra without the shadow moving. If it shifts, the tap offset is wrong: revert and redo. Compare frametime — 9 taps cost fill rate.",
      "Мягкий край и широкая полутень без смещения тени. Если тень сдвинулась — неверное смещение выборки: откатить и переделать. Сравнить frametime — 9 выборок стоят fill rate.",
    ),
    revert: tri("#define de volta para 4 taps e blurCoef anterior.", "#define back to 4 taps and previous blurCoef.", "#define обратно на 4 выборки и прежний blurCoef."),
    cycles: ["2", "4"],
  },
  {
    id: "F3",
    title: tri("F3 — Atmosfera e céu", "F3 — Atmosphere and sky", "F3 — Атмосфера и небо"),
    goal: tri(
      "Dar distância e continuidade: neblina com profundidade, horizonte sem emenda e halo do sol no entardecer.",
      "Give distance and continuity: fog with depth, a seamless horizon and a sun halo at dusk.",
      "Дать дистанцию и непрерывность: туман с глубиной, горизонт без шва и ореол солнца на закате.",
    ),
    what: [
      tri("Densidade da neblina (lnInv / expCoef em scene.cpp), separando \"longe\" de \"lavado\".", "Fog density (lnInv / expCoef in scene.cpp), separating \"far\" from \"washed out\".", "Плотность тумана (lnInv / expCoef в scene.cpp), отделяя «далеко» от «замыто»."),
      tri("Cor do fog por horário, em outro build.", "Fog colour by time of day, in another build.", "Цвет тумана по времени суток, в другой сборке."),
      tri("Passar aroundSun também para o horizonte (ML_Horizon), não só para o céu.", "Pass aroundSun to the horizon too (ML_Horizon), not only to the sky.", "Передавать aroundSun и на горизонт (ML_Horizon), не только на небо."),
      tri("Gradiente do horizonte por ângulo (VLDirectionSky / PSHorizon), em vez de só textura.", "Horizon gradient by angle (VLDirectionSky / PSHorizon), instead of texture only.", "Градиент горизонта по углу (VLDirectionSky / PSHorizon) вместо только текстуры."),
    ],
    image: tri(
      "As camadas de árvore se separam (a de trás não parece igual à da frente); o pôr do sol para de ter emenda entre céu e horizonte; o halo do sol se espalha pela linha do horizonte.",
      "Tree layers separate (the back one no longer looks like the front); sunset stops having a seam between sky and horizon; the sun halo spreads along the horizon line.",
      "Планы деревьев разделяются (задний больше не похож на передний); закат перестаёт иметь шов между небом и горизонтом; ореол солнца расходится по линии горизонта.",
    ),
    expect: tri(
      "Entardecer contínuo, sem linha onde o céu vira chão, e neblina que dá distância em vez de leitar a tela. Se o fog esconder o erro de F1, o valor está alto.",
      "A continuous dusk with no line where sky becomes ground, and fog that gives distance instead of washing the screen. If fog hides an F1 mistake, the value is too high.",
      "Непрерывный закат без линии, где небо становится землёй, и туман, дающий дистанцию вместо замыливания экрана. Если туман скрывает ошибку F1 — значение слишком велико.",
    ),
    revert: tri("Constantes anteriores de lnInv, cor do fog e aroundSun.", "Previous lnInv, fog colour and aroundSun constants.", "Прежние константы lnInv, цвета тумана и aroundSun."),
    cycles: ["5", "7", "8"],
  },
  {
    id: "F4",
    title: tri("F4 — Noite e nuvens", "F4 — Night and clouds", "F4 — Ночь и облака"),
    goal: tri(
      "Resolver a noite e o tempo nublado — só depois de F1 a F3 estarem estáveis.",
      "Sort out night and overcast weather — only after F1 to F3 are stable.",
      "Разобраться с ночью и облачностью — только после стабилизации F1–F3.",
    ),
    what: [
      tri("Curva de visibilidade das estrelas, em vez de limiar liga/desliga.", "Star visibility curve, instead of an on/off threshold.", "Кривая видимости звёзд вместо порога вкл/выкл."),
      tri("Halo lunar proporcional à fase da lua (cheia / nova).", "Moon halo proportional to the moon phase (full / new).", "Ореол луны пропорционально фазе (полная / новая)."),
      tri("Azul noturno vindo da luz, não de filtro de tela; checar se _nightEye cruza o limiar.", "Night blue coming from light, not a screen filter; check whether _nightEye crosses the threshold.", "Ночной синий из света, а не из экранного фильтра; проверить, переходит ли _nightEye порог."),
      tri("Queda de luz sob nublado, calibrada por config antes de recompilar.", "Light falloff under overcast, tuned by config before rebuilding.", "Спад света при облачности, настроенный конфигом до пересборки."),
    ],
    image: tri(
      "A noite fica legível sem parecer que alguém pintou a tela de azul; o céu nublado escurece de forma gradual em vez de dar degrau.",
      "Night becomes readable without looking like someone painted the screen blue; overcast darkens gradually instead of stepping.",
      "Ночь становится читаемой без ощущения, что экран покрасили в синий; облачное небо темнеет постепенно, без ступеньки.",
    ),
    expect: tri(
      "Dá para andar de noite lendo o terreno, com o azul vindo da luz real. Lua cheia marca presença; céu parcialmente nublado ainda mostra estrelas.",
      "You can walk at night reading the terrain, with the blue coming from real light. A full moon is present; a partly cloudy sky still shows stars.",
      "Ночью можно идти, читая рельеф, а синий исходит от реального света. Полная луна заметна; частично облачное небо всё ещё показывает звёзды.",
    ),
    revert: tri("Constantes anteriores de estrelas, halo e queda de luz.", "Previous star, halo and light falloff constants.", "Прежние константы звёзд, ореола и спада света."),
    cycles: ["9", "10"],
  },
  {
    id: "F5",
    title: tri("F5 — Vegetação", "F5 — Vegetation", "F5 — Растительность"),
    goal: tri(
      "Consertar o que ficou áspero por causa do alpha — sem tocar em iluminação.",
      "Fix what was left rough because of alpha — without touching lighting.",
      "Исправить то, что осталось грубым из-за alpha — не трогая освещение.",
    ),
    what: [
      tri("Alpha-to-coverage nas folhas, em vez de recorte puro.", "Alpha-to-coverage on leaves, instead of a hard cut-out.", "Alpha-to-coverage на листве вместо жёсткого вырезания."),
      tri("Distância de grama como parâmetro (hoje é patch no exe — pendência P3).", "Grass distance as a parameter (today it is a patch in the exe — pending P3).", "Дистанция травы как параметр (сегодня это патч в exe — вопрос P3)."),
      tri("Thinning por faixa de distância, para a transição não ser um corte.", "Thinning per distance band, so the transition is not a cut.", "Прореживание по диапазонам дистанции, чтобы переход не был обрывом."),
      tri("Conferir normais e translucidez das árvores (pendência P6) antes de mexer em folhagem.", "Check tree normals and translucency (pending P6) before touching foliage.", "Проверить нормали и просвечивание деревьев (вопрос P6) до правки листвы."),
    ],
    image: tri(
      "O recorte da folha fica menos serrilhado e a grama para de \"pular\" quando você anda.",
      "The leaf cut-out becomes less jagged and the grass stops \"popping\" as you walk.",
      "Вырезание листвы становится менее рваным, а трава перестаёт «прыгать» при ходьбе.",
    ),
    expect: tri(
      "Bordas de folha melhores e grama distante sem popping, com o custo medido — alpha-to-coverage pesa no fill rate.",
      "Better leaf edges and distant grass without popping, with the cost measured — alpha-to-coverage is heavy on fill rate.",
      "Лучшие края листвы и дальняя трава без мерцания, с измеренной стоимостью — alpha-to-coverage нагружает fill rate.",
    ),
    revert: tri("Voltar o recorte antigo e a distância anterior de grama.", "Return the old cut-out and the previous grass distance.", "Вернуть прежнее вырезание и прежнюю дистанцию травы."),
    cycles: [],
  },
  {
    id: "F6",
    title: tri("F6 — Calibração", "F6 — Calibration", "F6 — Калибровка"),
    goal: tri(
      "Fechar o conjunto: tonemap escolhido por teste, matriz de horários e climas, e o que dói no frametime.",
      "Close the set: tonemap chosen by test, time/weather matrix, and what hurts frametime.",
      "Закрыть набор: тональная кривая по тесту, матрица времени и погоды и то, что бьёт по frametime.",
    ),
    what: [
      tri("Escolher o tonemap por comparação (Filmic é candidato, não decisão) nos dois pontos de inicialização.", "Choose the tonemap by comparison (Filmic is a candidate, not a decision) at both init points.", "Выбрать тональную кривую сравнением (Filmic — кандидат, не решение) в двух точках инициализации."),
      tri("Rodar a matriz completa: amanhecer, meio-dia, entardecer, noite × limpo, nublado, chuva.", "Run the full matrix: dawn, noon, dusk, night × clear, overcast, rain.", "Прогнать полную матрицу: рассвет, полдень, закат, ночь × ясно, облачно, дождь."),
      tri("Atacar o que dói no frametime — o RPT mostra drawUI acima da cena 3D (pendência P8).", "Attack what hurts frametime — the RPT shows drawUI above the 3D scene (pending P8).", "Заняться тем, что бьёт по frametime — RPT показывает drawUI выше 3D-сцены (вопрос P8)."),
    ],
    image: tri(
      "Contraste e saturação finais. É aqui que o conjunto \"assenta\" — antes disso, tonemap só maquia erro de luz.",
      "Final contrast and saturation. This is where the set \"settles\" — before that, tonemap only masks lighting mistakes.",
      "Финальный контраст и насыщенность. Здесь набор «устаканивается» — до этого тональная кривая лишь маскирует ошибки света.",
    ),
    expect: tri(
      "Conjunto validado em todos os horários e climas, com custo conhecido — e base pronta para a futura fase DX11, sem começar DX11 agora.",
      "A set validated in every time and weather, with known cost — and a base ready for the future DX11 phase, without starting DX11 now.",
      "Набор проверен во всех условиях, стоимость известна — и база готова к будущей фазе DX11, без начала DX11 сейчас.",
    ),
    revert: tri("Tonemap de volta para Reinhard e fator de nuvem em 1.0.", "Tonemap back to Reinhard and cloud factor at 1.0.", "Тональная кривая обратно на Reinhard и фактор облачности 1.0."),
    cycles: ["11"],
  },
];

export interface Cycle {
  n: string;
  pillar: "light" | "shadow" | "atmo" | "sky" | "night";
  where: string;
  change: Tri;
  expect: Tri;
  revert: Tri;
}

export const CYCLES: Cycle[] = [
  {
    n: "1",
    pillar: "light",
    where: "engdd9.cpp · ComputeBackReflection 8046 / ComputeGroundReflection 8062",
    change: {
      pt: "Multiplicar _bidirect e _groundReflection por coeficientes nomeados (2.0 inicial) + 1 log dos valores crus.",
      en: "Multiply _bidirect and _groundReflection by named coefficients (2.0 to start) + 1 log of the raw values.",
      ru: "Умножить _bidirect и _groundReflection на именованные коэффициенты (2.0 для старта) + 1 лог сырых значений.",
    },
    expect: {
      pt: "Verso das copas, troncos e faces inferiores ganham luz; a floresta deixa de ser silhueta chapada.",
      en: "Leaf backs, trunks and undersides gain light; the forest stops being a flat silhouette.",
      ru: "Обратная сторона кроны, стволы и нижние грани получают свет; лес перестаёт быть плоским силуэтом.",
    },
    revert: { pt: "Coeficientes → 1.0", en: "Coefficients → 1.0", ru: "Коэффициенты → 1.0" },
  },
  {
    n: "2",
    pillar: "shadow",
    where: "PS.hlsl · PSSPostProcessSSSM_Default / _nVidia, 620-651",
    change: {
      pt: "Passar de 4 para 9 taps (3×3) mantendo os pesos bilineares e o blurCoef; log da técnica de SB no mesmo build.",
      en: "Go from 4 to 9 taps (3×3) keeping the bilinear weights and blurCoef; log the SB technique in the same build.",
      ru: "Перейти с 4 на 9 выборок (3×3), сохранив билинейные веса и blurCoef; лог техники SB в той же сборке.",
    },
    expect: {
      pt: "Borda da sombra suave, sem mover a sombra de lugar.",
      en: "Soft shadow edge, without moving the shadow.",
      ru: "Мягкий край тени без смещения самой тени.",
    },
    revert: { pt: "#define de volta para 4 taps", en: "#define back to 4 taps", ru: "#define обратно на 4 выборки" },
  },
  {
    n: "3",
    pillar: "light",
    where: "engdd9.cpp · SetPixelShaderConstantDBS 11568-11575",
    change: {
      pt: "Ajustar a meia-ângulo do especular (b = 0.5 → 0.75) e, depois, o ganho c = 1000.",
      en: "Adjust the specular half-angle (b = 0.5 → 0.75) and, later, the gain c = 1000.",
      ru: "Настроить полуугол блика (b = 0.5 → 0.75) и затем усиление c = 1000.",
    },
    expect: {
      pt: "Highlight mais fechado em concreto e metal, sem alterar a difusa.",
      en: "Tighter highlight on concrete and metal, without touching diffuse.",
      ru: "Более узкий блик на бетоне и металле без изменения диффуза.",
    },
    revert: { pt: "b → 0.5", en: "b → 0.5", ru: "b → 0.5" },
  },
  {
    n: "4",
    pillar: "shadow",
    where: "PS.hlsl 556-680 · PPSSSM::Do",
    change: {
      pt: "Aumentar o raio de penumbra (blurCoef) com a mesma contagem de taps.",
      en: "Increase penumbra radius (blurCoef) with the same tap count.",
      ru: "Увеличить радиус полутени (blurCoef) при том же числе выборок.",
    },
    expect: {
      pt: "Transição sombra→luz mais longa, sombra com aparência fotográfica.",
      en: "Longer shadow→light transition, a photographic-looking shadow.",
      ru: "Более длинный переход тень→свет, фотографический вид тени.",
    },
    revert: { pt: "constante anterior", en: "previous constant", ru: "прежняя константа" },
  },
  {
    n: "5",
    pillar: "atmo",
    where: "scene.cpp · EngineProperties::ComputeFogParams 526",
    change: {
      pt: "Ajustar lnInv (densidade exponencial) e, depois, a cor do fog em 2593-2621.",
      en: "Adjust lnInv (exponential density) and, later, the fog colour at 2593-2621.",
      ru: "Настроить lnInv (экспоненциальную плотность) и затем цвет тумана в 2593-2621.",
    },
    expect: {
      pt: "Planos de árvore separados; profundidade atmosférica na floresta.",
      en: "Separated tree layers; atmospheric depth in the forest.",
      ru: "Разделённые планы деревьев; атмосферная глубина в лесу.",
    },
    revert: { pt: "valor anterior de lnInv", en: "previous lnInv", ru: "прежний lnInv" },
  },
  {
    n: "6",
    pillar: "sky",
    where: "VS.hlsl · VLDirectionSky 278-283",
    change: {
      pt: "Expoente do ambiente hemisférico: pow(coef, 6) → 3 a 8.",
      en: "Hemispheric ambient exponent: pow(coef, 6) → 3 to 8.",
      ru: "Показатель полусферического ambient: pow(coef, 6) → от 3 до 8.",
    },
    expect: {
      pt: "A luz do céu se espalha de outro jeito nos objetos; muda floresta e sombras.",
      en: "Sky light spreads differently on objects; forest and shadows change.",
      ru: "Свет неба иначе распределяется по объектам; меняются лес и тени.",
    },
    revert: { pt: "expoente de volta a 6", en: "exponent back to 6", ru: "показатель обратно на 6" },
  },
  {
    n: "7",
    pillar: "sky",
    where: "engdd9.cpp · ML_Horizon 8153-8162",
    change: {
      pt: "Passar também aroundSun para o horizonte, e não só sky.",
      en: "Pass aroundSun to the horizon as well, not only sky.",
      ru: "Передавать также aroundSun и на горизонт, а не только sky.",
    },
    expect: {
      pt: "Entardecer sem corte entre céu e horizonte.",
      en: "Dusk without a seam between sky and horizon.",
      ru: "Закат без шва между небом и горизонтом.",
    },
    revert: { pt: "constante anterior", en: "previous constant", ru: "прежняя константа" },
  },
  {
    n: "8",
    pillar: "sky",
    where: "PS.h · PSHorizon 4517",
    change: {
      pt: "Misturar a cor do céu com uma cor de horizonte por saturate(dirY).",
      en: "Blend the sky colour with a horizon colour by saturate(dirY).",
      ru: "Смешать цвет неба с цветом горизонта по saturate(dirY).",
    },
    expect: {
      pt: "Horizonte mais claro que o zênite — o degradê que hoje só existe na textura.",
      en: "Horizon brighter than zenith — the gradient that today only lives in the texture.",
      ru: "Горизонт светлее зенита — градиент, который сегодня есть только в текстуре.",
    },
    revert: { pt: "remover o blend", en: "remove the blend", ru: "убрать смешивание" },
  },
  {
    n: "9",
    pillar: "night",
    where: "landscape.cpp 6565 / 6513 · lights.hpp MoonPhase",
    change: {
      pt: "Curva de visibilidade das estrelas e, em outro build, halo lunar proporcional à fase.",
      en: "Star visibility curve and, in another build, moon halo proportional to phase.",
      ru: "Кривая видимости звёзд и, в другой сборке, ореол луны пропорционально фазе.",
    },
    expect: {
      pt: "Noite parcialmente nublada com estrelas; lua cheia marcante.",
      en: "Partly cloudy night still showing stars; a strong full moon.",
      ru: "Частично облачная ночь со звёздами; выразительная полная луна.",
    },
    revert: { pt: "constantes anteriores", en: "previous constants", ru: "прежние константы" },
  },
  {
    n: "10",
    pillar: "atmo",
    where: "SWLayersCount (DayZ.cfg) / scene.cpp 2482-2491",
    change: {
      pt: "Calibrar cobertura de nuvens por config (sem recompilar) e depois suavizar a queda de luz sob nublado.",
      en: "Calibrate cloud coverage by config (no rebuild) and then smooth the light falloff under overcast.",
      ru: "Настроить облачность через конфиг (без пересборки), затем смягчить спад света при облачности.",
    },
    expect: {
      pt: "Céu nublado sem degrau de luminosidade.",
      en: "Overcast sky without a brightness step.",
      ru: "Облачное небо без ступеньки яркости.",
    },
    revert: { pt: "config volta a 64 / fator 1.0", en: "config back to 64 / factor 1.0", ru: "конфиг обратно на 64 / множитель 1.0" },
  },
  {
    n: "11",
    pillar: "atmo",
    where: "postProcess.cpp 8458-8459 e 8487-8488",
    change: {
      pt: "Trocar o tonemap padrão de Reinhard para Filmic nos dois pontos de inicialização.",
      en: "Switch the default tonemap from Reinhard to Filmic at both init points.",
      ru: "Сменить тональную кривую по умолчанию с Reinhard на Filmic в двух точках инициализации.",
    },
    expect: {
      pt: "Ombro de highlight e contraste global — só faz sentido depois de luz e sombra calibradas.",
      en: "Highlight shoulder and global contrast — only meaningful after lighting and shadows are calibrated.",
      ru: "Плечо светов и общий контраст — имеет смысл только после калибровки света и теней.",
    },
    revert: { pt: "2 linhas → 1 / ReinhardToneMappingPars", en: "2 lines → 1 / ReinhardToneMappingPars", ru: "2 строки → 1 / ReinhardToneMappingPars" },
  },
];

export interface Pending {
  id: string;
  text: Tri;
}

export const PENDING: Pending[] = [
  {
    id: "P1",
    text: {
      pt: "Técnica de shadow buffer ativa (INTZ × Default) — sai do log no ciclo 2.",
      en: "Active shadow buffer technique (INTZ × Default) — comes from the log in cycle 2.",
      ru: "Активная техника shadow buffer (INTZ × Default) — из лога в цикле 2.",
    },
  },
  {
    id: "P3",
    text: {
      pt: "O patch de grama está no exe em execução? O LogF GFX-CLUTTER não apareceu no RPT.",
      en: "Is the grass patch in the running exe? The GFX-CLUTTER LogF did not show in the RPT.",
      ru: "Патч травы в текущем exe? LogF GFX-CLUTTER не появился в RPT.",
    },
  },
  {
    id: "P4",
    text: {
      pt: "_nightEye passa o limiar à noite? Define o blue shift e a visão escotópica.",
      en: "Does _nightEye cross the threshold at night? It drives blue shift and scotopic vision.",
      ru: "Переходит ли _nightEye порог ночью? От него зависят синий сдвиг и скотопическое зрение.",
    },
  },
  {
    id: "P6",
    text: {
      pt: "Normais e translucidez das árvores (PFTreeAdv1) — antes de tocar em folhagem.",
      en: "Tree normals and translucency (PFTreeAdv1) — before touching foliage.",
      ru: "Нормали и просвечивание деревьев (PFTreeAdv1) — до правки листвы.",
    },
  },
  {
    id: "P12",
    text: {
      pt: "Origem do fator A/B da cúpula do céu (ambientColor.a) antes dos ciclos 7 e 8.",
      en: "Source of the sky dome A/B factor (ambientColor.a) before cycles 7 and 8.",
      ru: "Источник фактора A/B купола неба (ambientColor.a) до циклов 7 и 8.",
    },
  },
  {
    id: "P13",
    text: {
      pt: "O ChernarusPlus define sky, skyAroundSun, bidirect e groundReflection no world config?",
      en: "Does ChernarusPlus define sky, skyAroundSun, bidirect and groundReflection in the world config?",
      ru: "Задаёт ли ChernarusPlus sky, skyAroundSun, bidirect и groundReflection в конфиге мира?",
    },
  },
  {
    id: "P14",
    text: {
      pt: "As duas camadas de textura do céu (stage 0 e stage 1) estão válidas no pacote atual?",
      en: "Are both sky texture layers (stage 0 and stage 1) valid in the current package?",
      ru: "Оба слоя текстур неба (stage 0 и stage 1) корректны в текущем пакете?",
    },
  },
  {
    id: "P8",
    text: {
      pt: "drawUI custa 8,6-14,1 ms, mais que a cena 3D. Entra na fase F6, não antes.",
      en: "drawUI costs 8.6-14.1 ms, more than the 3D scene. It goes into F6, not earlier.",
      ru: "drawUI стоит 8,6-14,1 мс, больше 3D-сцены. Это в фазе F6, не раньше.",
    },
  },
];

export function usePlanoT() {
  const { locale } = useLocale();

  const tr = (tri: Tri): string => tri[locale] ?? tri.pt;

  const t = (key: string): string => {
    const entry = PLANO_COPY[key];
    return entry ? tr(entry) : key;
  };

  return { t, tr, locale };
}
