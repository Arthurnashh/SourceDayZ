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
