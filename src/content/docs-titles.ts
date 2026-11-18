import type { Locale } from "../lib/i18n";

/**
 * Títulos das seções do documento-mestre (1.md). Os capítulos de nível 1 a 3
 * têm tradução; as subseções de nível 4 mantêm o título original em PT-BR.
 */
const DOC_TITLES: Record<string, Record<Locale, string>> = {
  "1.md — Estudo da source do DayZ (Bohemia Interactive)": {
    pt: "1.md — Estudo da source do DayZ (Bohemia Interactive)",
    en: "1.md — DayZ source study (Bohemia Interactive)",
    ru: "1.md — Исследование исходников DayZ (Bohemia Interactive)"
  },
  "0. Método, cobertura e reprodutibilidade": {
    pt: "0. Método, cobertura e reprodutibilidade",
    en: "0. Method, coverage and reproducibility",
    ru: "0. Метод, охват и воспроизводимость"
  },
  "0.1 Ferramenta de indexação": {
    pt: "0.1 Ferramenta de indexação",
    en: "0.1 Indexing tool",
    ru: "0.1 Инструмент индексации"
  },
  "0.2 Números medidos (não estimados)": {
    pt: "0.2 Números medidos (não estimados)",
    en: "0.2 Measured numbers (not estimates)",
    ru: "0.2 Измеренные числа (не оценки)"
  },
  "0.3 Estado de cobertura": {
    pt: "0.3 Estado de cobertura",
    en: "0.3 Coverage status",
    ru: "0.3 Состояние охвата"
  },
  "1. As linguagens que a source usa": {
    pt: "1. As linguagens que a source usa",
    en: "1. The languages the source uses",
    ru: "1. Языки, которые использует исходник"
  },
  "1.1 Enforce Script (Enfusion)": {
    pt: "1.1 Enforce Script (Enfusion)",
    en: "1.1 Enforce Script (Enfusion)",
    ru: "1.1 Enforce Script (Enfusion)"
  },
  "1.2 SQF / SQS (script legado)": {
    pt: "1.2 SQF / SQS (script legado)",
    en: "1.2 SQF / SQS (legacy script)",
    ru: "1.2 SQF / SQS (устаревший скрипт)"
  },
  "1.3 C++ da Bohemia (padrões que se repetem em 1,4 M linhas)": {
    pt: "1.3 C++ da Bohemia (padrões que se repetem em 1,4 M linhas)",
    en: "1.3 Bohemia C++ (patterns repeated across 1.4M lines)",
    ru: "1.3 C++ от Bohemia (паттерны, повторяющиеся в 1,4 млн строк)"
  },
  "1.4 Config (ParamFile)": {
    pt: "1.4 Config (ParamFile)",
    en: "1.4 Config (ParamFile)",
    ru: "1.4 Config (ParamFile)"
  },
  "2. Mapa da source — cada pasta": {
    pt: "2. Mapa da source — cada pasta",
    en: "2. Source map — every folder",
    ru: "2. Карта исходников — каждая папка"
  },
  "2.1 As quatro raízes de código que importam": {
    pt: "2.1 As quatro raízes de código que importam",
    en: "2.1 The four code roots that matter",
    ru: "2.1 Четыре корня кода, которые важны"
  },
  "2.2 Variantes históricas no disco": {
    pt: "2.2 Variantes históricas no disco",
    en: "2.2 Historical variants on disk",
    ru: "2.2 Исторические варианты на диске"
  },
  "3. Estudo função por função — Onda 1": {
    pt: "3. Estudo função por função — Onda 1",
    en: "3. Function-by-function study — Wave 1",
    ru: "3. Изучение функция за функцией — Волна 1"
  },
  "3.1 Entrada do processo": {
    pt: "3.1 Entrada do processo",
    en: "3.1 Process entry",
    ru: "3.1 Вход процесса"
  },
  "3.2 Loop de mundo (o coração do frame)": {
    pt: "3.2 Loop de mundo (o coração do frame)",
    en: "3.2 World loop (the heart of the frame)",
    ru: "3.2 Цикл мира (сердце кадра)"
  },
  "3.3 Rede (cliente e servidor)": {
    pt: "3.3 Rede (cliente e servidor)",
    en: "3.3 Network (client and server)",
    ru: "3.3 Сеть (клиент и сервер)"
  },
  "3.4 Script VM (Enforce)": {
    pt: "3.4 Script VM (Enforce)",
    en: "3.4 Script VM (Enforce)",
    ru: "3.4 Script VM (Enforce)"
  },
  "3.5 IA / infectados (gameplay)": {
    pt: "3.5 IA / infectados (gameplay)",
    en: "3.5 AI / infected (gameplay)",
    ru: "3.5 ИИ / заражённые (геймплей)"
  },
  "3.6 Listas de desenho (scene)": {
    pt: "3.6 Listas de desenho (scene)",
    en: "3.6 Draw lists (scene)",
    ru: "3.6 Списки отрисовки (scene)"
  },
  "3.7 Backend D3D11 (o caminho novo)": {
    pt: "3.7 Backend D3D11 (o caminho novo)",
    en: "3.7 D3D11 backend (the new path)",
    ru: "3.7 Бэкенд D3D11 (новый путь)"
  },
  "3.8 Onda 2 — rede em profundidade (cliente e servidor)": {
    pt: "3.8 Onda 2 — rede em profundidade (cliente e servidor)",
    en: "3.8 Wave 2 — network in depth (client and server)",
    ru: "3.8 Волна 2 — сеть в глубину (клиент и сервер)"
  },
  "3.9 Onda 3 — o caminho de desenho (clutter → seção → primitiva → instancing)": {
    pt: "3.9 Onda 3 — o caminho de desenho (clutter → seção → primitiva → instancing)",
    en: "3.9 Wave 3 — the draw path (clutter → section → primitive → instancing)",
    ru: "3.9 Волна 3 — путь отрисовки (clutter → секция → примитив → instancing)"
  },
  "3.10 Onda 4 — submissão de primitiva e tex-gen (D3D9)": {
    pt: "3.10 Onda 4 — submissão de primitiva e tex-gen (D3D9)",
    en: "3.10 Wave 4 — primitive submission and tex-gen (D3D9)",
    ru: "3.10 Волна 4 — отправка примитивов и tex-gen (D3D9)"
  },
  "3.11 Onda 6 — texturas e shaders do backend DX11": {
    pt: "3.11 Onda 6 — texturas e shaders do backend DX11",
    en: "3.11 Wave 6 — DX11 backend textures and shaders",
    ru: "3.11 Волна 6 — текстуры и шейдеры бэкенда DX11"
  },
  "3.12 Placar das ondas 1 a 6": {
    pt: "3.12 Placar das ondas 1 a 6",
    en: "3.12 Scoreboard for waves 1 to 6",
    ru: "3.12 Счёт волн 1–6"
  },
  "4. DirectX 9 → DirectX 10 / 11": {
    pt: "4. DirectX 9 → DirectX 10 / 11",
    en: "4. DirectX 9 → DirectX 10 / 11",
    ru: "4. DirectX 9 → DirectX 10 / 11"
  },
  "4.1 Resposta direta à pergunta \"DX10 ou DX11?\"": {
    pt: "4.1 Resposta direta à pergunta \"DX10 ou DX11?\"",
    en: "4.1 Direct answer to \"DX10 or DX11?\"",
    ru: "4.1 Прямой ответ на вопрос «DX10 или DX11?»"
  },
  "4.2 Tamanho real do trabalho (medido)": {
    pt: "4.2 Tamanho real do trabalho (medido)",
    en: "4.2 Real size of the work (measured)",
    ru: "4.2 Реальный объём работы (измерено)"
  },
  "4.3 Mapa de tradução D3D9 → D3D11 (o que muda de verdade)": {
    pt: "4.3 Mapa de tradução D3D9 → D3D11 (o que muda de verdade)",
    en: "4.3 D3D9 → D3D11 translation map (what really changes)",
    ru: "4.3 Карта перевода D3D9 → D3D11 (что действительно меняется)"
  },
  "4.4 O que existe hoje em `lib/d3d11/` (inventário verificado)": {
    pt: "4.4 O que existe hoje em `lib/d3d11/` (inventário verificado)",
    en: "4.4 What exists today in `lib/d3d11/` (verified inventory)",
    ru: "4.4 Что есть сегодня в `lib/d3d11/` (проверенный инвентарь)"
  },
  "4.5 Achados de portabilidade (bugs concretos encontrados na leitura)": {
    pt: "4.5 Achados de portabilidade (bugs concretos encontrados na leitura)",
    en: "4.5 Portability findings (concrete bugs found while reading)",
    ru: "4.5 Находки по переносимости (конкретные баги при чтении)"
  },
  "4.6 Plano de migração em fases (com critério de aceite)": {
    pt: "4.6 Plano de migração em fases (com critério de aceite)",
    en: "4.6 Phased migration plan (with acceptance criteria)",
    ru: "4.6 Поэтапный план миграции (с критериями приёмки)"
  },
  "4.7 DX11 vai melhorar o FPS? (resposta honesta)": {
    pt: "4.7 DX11 vai melhorar o FPS? (resposta honesta)",
    en: "4.7 Will DX11 improve FPS? (an honest answer)",
    ru: "4.7 Улучшит ли DX11 FPS? (честный ответ)"
  },
  "5. O motor: arquitetura, otimização e gráfico": {
    pt: "5. O motor: arquitetura, otimização e gráfico",
    en: "5. The engine: architecture, optimisation and graphics",
    ru: "5. Движок: архитектура, оптимизация и графика"
  },
  "5.1 Ordem real do frame (evidência de linha)": {
    pt: "5.1 Ordem real do frame (evidência de linha)",
    en: "5.1 Real frame order (line evidence)",
    ru: "5.1 Реальный порядок кадра (доказательства по строкам)"
  },
  "5.2 Modelo de threads": {
    pt: "5.2 Modelo de threads",
    en: "5.2 Thread model",
    ru: "5.2 Модель потоков"
  },
  "5.3 Instrumentação disponível (de graça, já no binário)": {
    pt: "5.3 Instrumentação disponível (de graça, já no binário)",
    en: "5.3 Available instrumentation (free, already in the binary)",
    ru: "5.3 Доступная инструментация (бесплатно, уже в бинарнике)"
  },
  "5.4 Suspeitos técnicos, com evidência e teste": {
    pt: "5.4 Suspeitos técnicos, com evidência e teste",
    en: "5.4 Technical suspects, with evidence and test",
    ru: "5.4 Технические подозреваемые, с доказательствами и тестом"
  },
  "5.5 Melhorias de gráfico (ordenadas por custo/benefício)": {
    pt: "5.5 Melhorias de gráfico (ordenadas por custo/benefício)",
    en: "5.5 Graphics improvements (ordered by cost/benefit)",
    ru: "5.5 Улучшения графики (по стоимости/выгоде)"
  },
  "5.6 Modding: a consequência de não existir `modded`": {
    pt: "5.6 Modding: a consequência de não existir `modded`",
    en: "5.6 Modding: the consequence of no `modded`",
    ru: "5.6 Моддинг: последствия отсутствия `modded`"
  },
  "5.7 Teto técnico imposto por `extern/`": {
    pt: "5.7 Teto técnico imposto por `extern/`",
    en: "5.7 Technical ceiling imposed by `extern/`",
    ru: "5.7 Технический потолок из-за `extern/`"
  },
  "6. Fila de estudo (próximas ondas)": {
    pt: "6. Fila de estudo (próximas ondas)",
    en: "6. Study queue (next waves)",
    ru: "6. Очередь изучения (следующие волны)"
  },
  "6.1 Regra de registro das próximas ondas": {
    pt: "6.1 Regra de registro das próximas ondas",
    en: "6.1 Logging rule for the next waves",
    ru: "6.1 Правило записи следующих волн"
  },
  "7. Resumo executivo em 10 linhas": {
    pt: "7. Resumo executivo em 10 linhas",
    en: "7. Executive summary in 10 lines",
    ru: "7. Резюме в 10 строках"
  },
  "8. Mineração de comentários — o que os próprios devs escreveram": {
    pt: "8. Mineração de comentários — o que os próprios devs escreveram",
    en: "8. Comment mining — what the developers themselves wrote",
    ru: "8. Анализ комментариев — что писали сами разработчики"
  },
  "8.1 Ferramenta e escala (medida, não estimada)": {
    pt: "8.1 Ferramenta e escala (medida, não estimada)",
    en: "8.1 Tool and scale (measured, not estimated)",
    ru: "8.1 Инструмент и масштаб (измерено, не оценено)"
  },
  "8.2 A negação existe — mas em inglês (e a source não tem português)": {
    pt: "8.2 A negação existe — mas em inglês (e a source não tem português)",
    en: "8.2 Negation exists — but in English (and the source has no Portuguese)",
    ru: "8.2 Отрицание существует — но на английском (а в исходниках нет португальского)"
  },
  "8.3 As duas convenções da BI: `\\patch` e `news:` — changelog embutido": {
    pt: "8.3 As duas convenções da BI: `\\patch` e `news:` — changelog embutido",
    en: "8.3 BI's two conventions: `\\patch` and `news:` — built-in changelog",
    ru: "8.3 Две конвенции BI: `\\patch` и `news:` — встроенный changelog"
  },
  "8.4 O mapa de dívida do DX11 está escrito no código": {
    pt: "8.4 O mapa de dívida do DX11 está escrito no código",
    en: "8.4 The DX11 debt map is written in the code",
    ru: "8.4 Карта техдолга DX11 записана в коде"
  },
  "8.5 A descoberta mais forte desta seção: o DX11 é cópia literal do DX9": {
    pt: "8.5 A descoberta mais forte desta seção: o DX11 é cópia literal do DX9",
    en: "8.5 The strongest finding of this section: DX11 is a literal copy of DX9",
    ru: "8.5 Сильнейшая находка раздела: DX11 — буквальная копия DX9"
  },
  "8.6 HACKs: os pontos onde o motor desvia de si mesmo": {
    pt: "8.6 HACKs: os pontos onde o motor desvia de si mesmo",
    en: "8.6 HACKs: where the engine deviates from itself",
    ru: "8.6 HACK: места, где движок отклоняется от себя"
  },
  "8.7 Achados novos registrados a partir dos comentários": {
    pt: "8.7 Achados novos registrados a partir dos comentários",
    en: "8.7 New findings recorded from the comments",
    ru: "8.7 Новые находки, записанные по комментариям"
  },
  "8.8 Como consultar o corpus": {
    pt: "8.8 Como consultar o corpus",
    en: "8.8 How to query the corpus",
    ru: "8.8 Как искать по корпусу"
  }
};

export function docsTitle(locale: Locale, titulo: string): string {
  return DOC_TITLES[titulo]?.[locale] ?? titulo;
}
