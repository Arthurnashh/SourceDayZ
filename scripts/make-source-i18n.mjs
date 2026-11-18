import fs from "node:fs";

const origem = JSON.parse(fs.readFileSync("public/data/source.json", "utf8"));

const EN = {
  "Numero de build compilado no binario.": "Build number compiled into the binary.",
  "Solucao Visual Studio 2010 (6 projetos).": "Visual Studio 2010 solution (6 projects).",
  "Projeto auxiliar de build (36 MB, gerado).": "Auxiliary build project (36 MB, generated).",
  "Solucao gemea, mesmos 6 projetos.": "Twin solution, same 6 projects.",
  "Visualizador de tipos para o depurador do Visual Studio.": "Type visualizer for the Visual Studio debugger.",
  "116 PBOs + 116 assinaturas .bisign: o conteudo empacotado (mapas, objetos, texturas, som).": "116 PBOs + 116 .bisign signatures: the packaged content (maps, objects, textures, sound).",
  "O jogo e o motor: world, scene, object, rede, IA, UI, d3d9, d3d11.": "The game and the engine: world, scene, object, network, AI, UI, d3d9, d3d11.",
  "SDKs de terceiros: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, Botan, RotorLib, SimulWeather.": "Third-party SDKs: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, Botan, RotorLib, SimulWeather.",
  "Configuracao do jogo (CfgVehicles, CfgWeapons, UI) e o projeto cfg.": "Game configuration (CfgVehicles, CfgWeapons, UI) and the cfg project.",
  "5 familias de alocador: JEMalloc, NedMalloc, TBB3, TBB4, TCMalloc.": "5 allocator families: JEMalloc, NedMalloc, TBB3, TBB4, TCMalloc.",
  "Criador de PBO (empacotador oficial da engine).": "PBO creator (the engine's official packer).",
  "Ferramenta de console que lista/extrai o conteudo de um PBO.": "Console tool that lists/extracts the contents of a PBO.",
  "Manual de comandos SQF gerado do proprio motor (comref.xml).": "SQF command manual generated from the engine itself (comref.xml).",
  "Biblioteca base: parser, streams, ParamFile, rede, matematica, threads.": "Base library: parser, streams, ParamFile, network, math, threads.",
  "Engine nova: VM de script Enforce, render, fisica, animacao, audio.": "New engine: Enforce script VM, render, physics, animation, audio.",
  "Utilitarios internos (atualizador SVN, setup, HTML).": "Internal utilities (SVN updater, setup, HTML).",
  "Gerador/aplicador de patch de addon (OFP).": "OFP addon patch generator/applier.",
  "Runtime de voz (speech recognition), KBBase e arvores.": "Voice runtime (speech recognition), KBBase and trees.",
  "Config do motor compilada como C++ (cfg*.hpp, config.cpp).": "Engine config compiled as C++ (cfg*.hpp, config.cpp).",
  "Containers, strings, arquivos, memoria e threads da camada base.": "Containers, strings, files, memory and threads of the base layer.",
  "Instalador e rotinas de deploy.": "Installer and deploy routines.",
  "Otimizador de modelos/mundos: gera .p3d/.wrp finais e alimenta os PBOs.": "Model/world optimizer: generates the final .p3d/.wrp and feeds the PBOs.",
  "Ferramenta de merge de texturas.": "Texture merge tool.",
  "Documentacao interna.": "Internal documentation.",
  "Editor de modelos legado (Buldozer), usado para validar .p3d.": "Legacy model editor (Buldozer), used to validate .p3d.",
  "Chaves de CD historicas da Bohemia.": "Historical Bohemia CD keys.",
  "Criador de patch para addons OFP.": "Patch creator for OFP addons.",
  "Base de usuarios internos.": "Internal user database.",
  "Captura e analise de perfil de frame.": "Frame profile capture and analysis.",
  "Utilitario de registro/licenca.": "Registration/license utility.",
  "Chave de servidor.": "Server key.",
  "Editor de config.cpp/ParamFile.": "config.cpp/ParamFile editor.",
  "Reempacotador de PBO para Xbox 360.": "PBO repacker for Xbox 360.",
  "Verificador de integridade de PBO.": "PBO integrity checker.",
  "Build legado em GNU make (Linux/gcc), anterior ao Visual Studio.": "Legacy GNU make build (Linux/gcc), before Visual Studio.",
  "Exemplo de launcher.": "Sample launcher.",
  "Projeto que compila o lancador de servidor dedicado.": "Project that compiles the dedicated server launcher.",
  "Utilitario de acesso a posicao/memoria.": "Position/memory access utility.",
  "Bibliotecas de fisica (ODE/RigidBody).": "Physics libraries (ODE/RigidBody).",
  "Exemplo de extensao nativa (DLL) do motor.": "Example of a native engine extension (DLL).",
  "Serializacao auxiliar.": "Auxiliary serialization.",
  "Empacotamento/protecao de dados.": "Data packaging/protection.",
  "Pasta de saida auxiliar (vazia neste snapshot).": "Auxiliary output folder (empty in this snapshot).",
  "Variante historica do projeto (vazia).": "Historical variant of the project (empty).",
  "Variante historica do projeto (vazia).": "Historical variant of the project (empty)."
};

const RU = {
  "Numero de build compilado no binario.": "Номер сборки, скомпилированный в бинарник.",
  "Solucao Visual Studio 2010 (6 projetos).": "Решение Visual Studio 2010 (6 проектов).",
  "Projeto auxiliar de build (36 MB, gerado).": "Вспомогательный проект сборки (36 МБ, сгенерирован).",
  "Solucao gemea, mesmos 6 projetos.": "Парное решение, те же 6 проектов.",
  "Visualizador de tipos para o depurador do Visual Studio.": "Визуализатор типов для отладчика Visual Studio.",
  "116 PBOs + 116 assinaturas .bisign: o conteudo empacotado (mapas, objetos, texturas, som).": "116 PBO + 116 подписей .bisign: упакованный контент (карты, объекты, текстуры, звук).",
  "O jogo e o motor: world, scene, object, rede, IA, UI, d3d9, d3d11.": "Игра и движок: world, scene, object, сеть, ИИ, UI, d3d9, d3d11.",
  "SDKs de terceiros: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, Botan, RotorLib, SimulWeather.": "Сторонние SDK: Boost, Bullet 2.76, DirectX SDK 2010, Steamworks, Botan, RotorLib, SimulWeather.",
  "Configuracao do jogo (CfgVehicles, CfgWeapons, UI) e o projeto cfg.": "Конфигурация игры (CfgVehicles, CfgWeapons, UI) и проект cfg.",
  "5 familias de alocador: JEMalloc, NedMalloc, TBB3, TBB4, TCMalloc.": "5 семейств аллокаторов: JEMalloc, NedMalloc, TBB3, TBB4, TCMalloc.",
  "Criador de PBO (empacotador oficial da engine).": "Создатель PBO (официальный упаковщик движка).",
  "Ferramenta de console que lista/extrai o conteudo de um PBO.": "Консольная утилита, которая перечисляет/извлекает содержимое PBO.",
  "Manual de comandos SQF gerado do proprio motor (comref.xml).": "Руководство по командам SQF, сгенерированное из самого движка (comref.xml).",
  "Biblioteca base: parser, streams, ParamFile, rede, matematica, threads.": "Базовая библиотека: парсер, потоки, ParamFile, сеть, математика, потоки выполнения.",
  "Engine nova: VM de script Enforce, render, fisica, animacao, audio.": "Новый движок: VM скриптов Enforce, рендер, физика, анимация, аудио.",
  "Utilitarios internos (atualizador SVN, setup, HTML).": "Внутренние утилиты (обновление SVN, установка, HTML).",
  "Gerador/aplicador de patch de addon (OFP).": "Генератор/применитель патчей для аддонов OFP.",
  "Runtime de voz (speech recognition), KBBase e arvores.": "Голосовой рантайм (распознавание речи), KBBase и деревья.",
  "Config do motor compilada como C++ (cfg*.hpp, config.cpp).": "Конфигурация движка, скомпилированная как C++ (cfg*.hpp, config.cpp).",
  "Containers, strings, arquivos, memoria e threads da camada base.": "Контейнеры, строки, файлы, память и потоки базового слоя.",
  "Instalador e rotinas de deploy.": "Установщик и процедуры развёртывания.",
  "Otimizador de modelos/mundos: gera .p3d/.wrp finais e alimenta os PBOs.": "Оптимизатор моделей/миров: создаёт финальные .p3d/.wrp и наполняет PBO.",
  "Ferramenta de merge de texturas.": "Инструмент слияния текстур.",
  "Documentacao interna.": "Внутренняя документация.",
  "Editor de modelos legado (Buldozer), usado para validar .p3d.": "Устаревший редактор моделей (Buldozer), используется для проверки .p3d.",
  "Chaves de CD historicas da Bohemia.": "Исторические CD-ключи Bohemia.",
  "Criador de patch para addons OFP.": "Создатель патчей для аддонов OFP.",
  "Base de usuarios internos.": "Внутренняя база пользователей.",
  "Captura e analise de perfil de frame.": "Захват и анализ профиля кадра.",
  "Utilitario de registro/licenca.": "Утилита регистрации/лицензии.",
  "Chave de servidor.": "Серверный ключ.",
  "Editor de config.cpp/ParamFile.": "Редактор config.cpp/ParamFile.",
  "Reempacotador de PBO para Xbox 360.": "Перепаковщик PBO для Xbox 360.",
  "Verificador de integridade de PBO.": "Проверка целостности PBO.",
  "Build legado em GNU make (Linux/gcc), anterior ao Visual Studio.": "Устаревшая сборка GNU make (Linux/gcc), до Visual Studio.",
  "Exemplo de launcher.": "Пример лаунчера.",
  "Projeto que compila o lancador de servidor dedicado.": "Проект, который компилирует лаунчер выделенного сервера.",
  "Utilitario de acesso a posicao/memoria.": "Утилита доступа к позиции/памяти.",
  "Bibliotecas de fisica (ODE/RigidBody).": "Библиотеки физики (ODE/RigidBody).",
  "Exemplo de extensao nativa (DLL) do motor.": "Пример нативного расширения движка (DLL).",
  "Serializacao auxiliar.": "Вспомогательная сериализация.",
  "Empacotamento/protecao de dados.": "Упаковка/защита данных.",
  "Pasta de saida auxiliar (vazia neste snapshot).": "Вспомогательная папка вывода (пуста в этом снимке).",
  "Variante historica do projeto (vazia).": "Исторический вариант проекта (пуст).",
  "Variante historica do projeto (vazia).": "Исторический вариант проекта (пуст)."
};

function aplicar(dic, locale) {
  const copia = structuredClone(origem);
  const traduzir = (nota) => {
    if (!nota) return nota;
    const t = dic[nota];
    if (!t) throw new Error(`Nota sem tradução ${locale}: ${nota}`);
    return t;
  };
  for (const a of copia.arquivos_raiz) a.nota = traduzir(a.nota);
  for (const d of copia.dirs) {
    d.nota = traduzir(d.nota);
    for (const f of d.filhos ?? []) f.nota = traduzir(f.nota);
  }
  const file = `public/data/source.${locale}.json`;
  fs.writeFileSync(file, JSON.stringify(copia, null, 2), "utf8");
  console.log(`${file}: ${fs.statSync(file).size} bytes`);
}

aplicar(EN, "en");
aplicar(RU, "ru");
