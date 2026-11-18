import type { Locale } from "../lib/i18n";

interface Copy {
  pt: string;
  en: string;
  ru: string;
}

/** Texto de apoio do diagrama do motor (os identificadores de código não mudam). */
export const NODE_TEXT: Record<string, Record<"sub" | "detalhe", Copy>> = {
  winmain: {
    sub: { pt: "main.cpp", en: "main.cpp", ru: "main.cpp" },
    detalhe: {
      pt: "Entrada do processo. Cria a janela, inicializa engine, input e loop principal.",
      en: "Process entry. Creates the window, initialises the engine, input and the main loop.",
      ru: "Вход процесса. Создаёт окно, инициализирует движок, ввод и главный цикл.",
    },
  },
  loop: {
    sub: { pt: "mensagens + frame", en: "messages + frame", ru: "сообщения + кадр" },
    detalhe: {
      pt: "Bombeia mensagens do Windows e chama a simulação de mundo uma vez por frame.",
      en: "Pumps Windows messages and calls the world simulation once per frame.",
      ru: "Обрабатывает сообщения Windows и вызывает симуляцию мира один раз за кадр.",
    },
  },
  sim: {
    sub: {
      pt: "world.cpp:11795 · 1.235 linhas",
      en: "world.cpp:11795 · 1,235 lines",
      ru: "world.cpp:11795 · 1 235 строк",
    },
    detalhe: {
      pt: "Simula UM frame do mundo. Recebe dois bool& de saída: desenhar cena e desenhar HUD. É o escopo-raiz do perfil (wSimu).",
      en: "Simulates ONE world frame. Receives two output bool&: draw scene and draw HUD. It is the root scope of the profile (wSimu).",
      ru: "Симулирует ОДИН кадр мира. Получает два выходных bool&: рисовать сцену и рисовать HUD. Это корневая область профиля (wSimu).",
    },
  },
  time: {
    sub: { pt: "orçamento do frame", en: "frame budget", ru: "бюджет кадра" },
    detalhe: {
      pt: "Recebe estimateReserve e distribui a folga entre subsistemas. restFrame = 0.045f (~22 FPS) limita a premissa.",
      en: "Takes estimateReserve and splits the remaining time across subsystems. restFrame = 0.045f (~22 FPS) bounds the premise.",
      ru: "Принимает estimateReserve и распределяет остаток между подсистемами. restFrame = 0.045f (~22 FPS) ограничивает предпосылку.",
    },
  },
  script: {
    sub: { pt: "SQF + Enforce", en: "SQF + Enforce", ru: "SQF + Enforce" },
    detalhe: {
      pt: "Roda antes do desenho: script pode alterar o mundo que será desenhado. SQF coopera com 100 linhas/frame.",
      en: "Runs before drawing: script can change the world that will be drawn. SQF yields at 100 lines/frame.",
      ru: "Выполняется до отрисовки: скрипт может изменить мир, который будет нарисован. SQF уступает на 100 строках/кадр.",
    },
  },
  veh: {
    sub: { pt: "física de veículos", en: "vehicle physics", ru: "физика транспорта" },
    detalhe: {
      pt: "Atualiza veículos e física associada dentro do mesmo orçamento de frame.",
      en: "Updates vehicles and their physics inside the same frame budget.",
      ru: "Обновляет транспорт и связанную физику в рамках того же бюджета кадра.",
    },
  },
  land: {
    sub: { pt: "terreno", en: "terrain", ru: "ландшафт" },
    detalhe: {
      pt: "Simula o terreno antes de PrepareDraw — há potencial de varredura duplicada de grid.",
      en: "Simulates the terrain before PrepareDraw — there is potential for duplicated grid scanning.",
      ru: "Симулирует ландшафт перед PrepareDraw — возможна повторная развёртка сетки.",
    },
  },
  prep: {
    sub: {
      pt: "world.cpp:7926 · 807 linhas",
      en: "world.cpp:7926 · 807 lines",
      ru: "world.cpp:7926 · 807 строк",
    },
    detalhe: {
      pt: "Decide o que será desenhado: três distâncias (objeto, sombra, máxima), retângulo de grid rotation-invariant e lock incremental do _objAroundCam.",
      en: "Decides what will be drawn: three distances (object, shadow, maximum), rotation-invariant grid rectangle and incremental lock of _objAroundCam.",
      ru: "Решает, что будет нарисовано: три дистанции (объект, тень, максимум), rotation-invariant прямоугольник сетки и инкрементальная блокировка _objAroundCam.",
    },
  },
  scene: {
    sub: { pt: "scene.cpp · SortObject", en: "scene.cpp · SortObject", ru: "scene.cpp · SortObject" },
    detalhe: {
      pt: "Lista ordenada de objetos e lotes instanciados de até 512 (maxInstancingChain). GetLandShadowSmooth é calculado por instância.",
      en: "Sorted object list and instanced batches up to 512 (maxInstancingChain). GetLandShadowSmooth is computed per instance.",
      ru: "Отсортированный список объектов и инстанс-батчи до 512 (maxInstancingChain). GetLandShadowSmooth вычисляется на каждый экземпляр.",
    },
  },
  obj: {
    sub: {
      pt: "object.cpp:1968 · 7 operações",
      en: "object.cpp:1968 · 7 operations",
      ru: "object.cpp:1968 · 7 операций",
    },
    detalhe: {
      pt: "Locks de geometria/VB, AnimationContext, Animate(), SelectAggLights(), PrepareTextures(), OptimizeLevelRendering() e shadowCache.Split(). 6 de 7 por objeto e por frame.",
      en: "Geometry/VB locks, AnimationContext, Animate(), SelectAggLights(), PrepareTextures(), OptimizeLevelRendering() and shadowCache.Split(). 6 of 7 per object and per frame.",
      ru: "Блокировки геометрии/VB, AnimationContext, Animate(), SelectAggLights(), PrepareTextures(), OptimizeLevelRendering() и shadowCache.Split(). 6 из 7 на объект и на кадр.",
    },
  },
  d3d9: {
    sub: { pt: "51.549 linhas", en: "51,549 lines", ru: "51 549 строк" },
    detalhe: {
      pt: "Backend legado completo: estados, shaders, texturas, instancing emulado e todos os passes.",
      en: "Complete legacy backend: states, shaders, textures, emulated instancing and all passes.",
      ru: "Полный устаревший бэкенд: состояния, шейдеры, текстуры, эмулированный instancing и все проходы.",
    },
  },
  d3d11: {
    sub: { pt: "1.211 linhas", en: "1,211 lines", ru: "1 211 строк" },
    detalhe: {
      pt: "Backend novo parcial: device, TL, textura, texto e mesh. Sem sombra, terreno, clutter, pós-processo, SRGB ou MSAA.",
      en: "Partial new backend: device, TL, texture, text and mesh. No shadows, terrain, clutter, post-processing, SRGB or MSAA.",
      ru: "Частичный новый бэкенд: device, TL, текстура, текст и mesh. Без теней, ландшафта, clutter, постобработки, SRGB и MSAA.",
    },
  },
  gpu: {
    sub: { pt: "swap chain", en: "swap chain", ru: "swap chain" },
    detalhe: {
      pt: "Apresentação do frame. Se Present domina, o problema é GPU; se obDrw domina, é CPU por objeto.",
      en: "Frame presentation. If Present dominates, the problem is the GPU; if obDrw dominates, it is per-object CPU.",
      ru: "Презентация кадра. Если доминирует Present — проблема в GPU; если obDrw — в CPU на объект.",
    },
  },
};

export const LAYER_TEXT: Record<string, Record<"nome" | "desc", Copy>> = {
  "Gameplay / Script": {
    nome: { pt: "Gameplay / Script", en: "Gameplay / Script", ru: "Геймплей / Скрипты" },
    desc: {
      pt: "Enforce VM + SQF, missões, ações e UI de jogo",
      en: "Enforce VM + SQF, missions, actions and in-game UI",
      ru: "Enforce VM + SQF, миссии, действия и игровой UI",
    },
  },
  "IA / Física": {
    nome: { pt: "IA / Física", en: "AI / Physics", ru: "ИИ / Физика" },
    desc: {
      pt: "invasores, infectados, veículos e Bullet 2.76",
      en: "invaders, infected, vehicles and Bullet 2.76",
      ru: "захватчики, заражённые, транспорт и Bullet 2.76",
    },
  },
  "Terreno / Streaming": {
    nome: { pt: "Terreno / Streaming", en: "Terrain / Streaming", ru: "Ландшафт / Стриминг" },
    desc: {
      pt: "landscape, clutter, bancos de arquivo e texturas",
      en: "landscape, clutter, file banks and textures",
      ru: "landscape, clutter, файловые банки и текстуры",
    },
  },
  "Cena / Visibilidade": {
    nome: { pt: "Cena / Visibilidade", en: "Scene / Visibility", ru: "Сцена / Видимость" },
    desc: {
      pt: "PrepareDraw, SortObject e instancing de 512",
      en: "PrepareDraw, SortObject and 512-instance batching",
      ru: "PrepareDraw, SortObject и instancing по 512",
    },
  },
  "Render / Backends": {
    nome: { pt: "Render / Backends", en: "Render / Backends", ru: "Рендер / Бэкенды" },
    desc: {
      pt: "Object::Draw, EngineDD9 e Dx11EngineCore",
      en: "Object::Draw, EngineDD9 and Dx11EngineCore",
      ru: "Object::Draw, EngineDD9 и Dx11EngineCore",
    },
  },
  GPU: {
    nome: { pt: "GPU", en: "GPU", ru: "GPU" },
    desc: {
      pt: "estado, shader, draw call e present",
      en: "state, shader, draw call and present",
      ru: "состояние, шейдер, draw call и present",
    },
  },
};

export function pick(copy: Copy, locale: Locale): string {
  return copy[locale] ?? copy.pt;
}
