import { useLocale, type Locale } from "../lib/i18n";

/**
 * Conteudo da aba "Port DX11": o plano de troca do Direct3D 9 pelo Direct3D 11
 * e a remocao fisica do DX9 da source.
 *
 * Regra deste arquivo: todo numero e todo caminho citado foi levantado na
 * source (`lib\lib.vcxproj` + os 18 TUs do escopo). O que ainda nao foi
 * executado esta marcado com status `next` ou `doing` — nunca `done` sem
 * build e teste registrados.
 */

/** Texto em tres idiomas; `ru` pode faltar e cai para `en`. */
export type L = { pt: string; en: string; ru?: string };

/** done = concluido e testado · doing = em andamento · next = proximo · blocked = travado. */
export type PhaseStatus = "done" | "doing" | "next" | "blocked";

export interface Phase {
  /** D0..D8 */
  id: string;
  title: L;
  goal: L;
  status: PhaseStatus;
  tasks: L[];
  /** Criterio objetivo para a fase contar como concluida. */
  gate: L;
  /** Arquivos que a fase cria ou toca. */
  deliverable: string;
  /** O que quebra se a fase for feita fora de ordem. */
  risk?: L;
  /** Como desfazer sem deixar residuo. */
  revert: L;
}

export const DX11_STATS = {
  /** 990 = 943 chamadas diretas + 45 globais D3DX (arredondado). */
  calls: 990,
  /** 17 TUs apagados; o 18º (ShaderCompileCache.cpp) é convertido, não apagado. */
  files: 17,
  phases: 9,
  done: 0,
  /** metodos de d3d9.h realmente usados. */
  apis: 77,
};

export const DX11_PHASES: Phase[] = [
  {
    id: "D0",
    status: "next",
    title: {
      pt: "Baseline: travar o que funciona",
      en: "Baseline: freeze what works",
    },
    goal: {
      pt: "Antes de tocar em qualquer linha, ter uma build reproduzivel e uma referencia visual do DX9 atual. Sem isso nao existe como provar que o port nao quebrou nada.",
      en: "Before touching a single line, have a reproducible build and a visual reference of the current DX9. Without it there is no way to prove the port did not break anything.",
    },
    tasks: [
      { pt: "Rodar build\\buildRelease.bat e confirmar verde (MSBuild Game.sln, Retail x64).", en: "Run build\\buildRelease.bat and confirm green (MSBuild Game.sln, Retail x64)." },
      { pt: "Guardar o DayZ.exe gerado como referencia do DX9 (nao sobrescrever).", en: "Keep the produced DayZ.exe as the DX9 reference (do not overwrite)." },
      { pt: "Capturar 8 cenas fixas: interior, floresta, cidade, agua, noite, mapa, inventario, HUD.", en: "Capture 8 fixed scenes: interior, forest, town, water, night, map, inventory, HUD." },
      { pt: "Registrar save, horario, clima e resolucao de cada captura.", en: "Record save, time, weather and resolution for each capture." },
    ],
    gate: {
      pt: "Build verde em 2 execucoes seguidas + pasta de capturas versionada com os 8 PNG.",
      en: "Green build twice in a row + captures folder with the 8 PNGs committed.",
    },
    deliverable: "docs\\d3d11-port\\baseline\\",
    revert: { pt: "Nada a reverter: a fase nao altera codigo.", en: "Nothing to revert: the phase changes no code." },
  },
  {
    id: "D1",
    status: "next",
    title: {
      pt: "Slot do backend (compila, nao executa)",
      en: "Backend slot (builds, does not run)",
    },
    goal: {
      pt: "Criar o lugar exato do EngineDD11 reaproveitando o encaixe que o projeto ja tem: CreateEngineD3D9 em lib\\main.cpp:12336, o #if _ENABLE_DX10 e a flag ForceDX9. Nesta fase o backend existe e devolve NULL.",
      en: "Create the exact place for EngineDD11 by reusing the hook the project already has: CreateEngineD3D9 at lib\\main.cpp:12336, the #if _ENABLE_DX10 block and the ForceDX9 flag. In this phase the backend exists and returns NULL.",
    },
    tasks: [
      { pt: "Criar lib\\d3d11\\engdd11.hpp + engdd11.cpp com class EngineDD11 : public Engine.", en: "Create lib\\d3d11\\engdd11.hpp + engdd11.cpp with class EngineDD11 : public Engine." },
      { pt: "Implementar Engine *CreateEngineD3D11(CreateEnginePars &pars) devolvendo NULL.", en: "Implement Engine *CreateEngineD3D11(CreateEnginePars &pars) returning NULL." },
      { pt: "Declarar em lib\\engineDll.hpp e adicionar o #if _ENABLE_DX11 em main.cpp ao lado do bloco DX10.", en: "Declare it in lib\\engineDll.hpp and add #if _ENABLE_DX11 in main.cpp next to the DX10 block." },
      { pt: "Definir _ENABLE_DX11 0 em todas as configs (afx, console, normal, retail, server, xbox...).", en: "Define _ENABLE_DX11 0 in every config (afx, console, normal, retail, server, xbox...)." },
    ],
    gate: {
      pt: "Game.sln compila; DayZ.exe abre identico ao baseline; com -dx11 o jogo falha de forma limpa e controlada.",
      en: "Game.sln builds; DayZ.exe opens identical to baseline; with -dx11 the game fails cleanly and in a controlled way.",
    },
    deliverable: "lib\\d3d11\\engdd11.cpp · lib\\engineDll.hpp · lib\\main.cpp · lib\\*Config.h",
    risk: { pt: "Nenhum em runtime: a flag fica desligada e o codigo novo nao e chamado.", en: "None at runtime: the flag stays off and the new code is never called." },
    revert: { pt: "Apagar lib\\d3d11 e as duas linhas de main.cpp.", en: "Delete lib\\d3d11 and the two lines in main.cpp." },
  },
  {
    id: "D2",
    status: "next",
    title: {
      pt: "Device, swapchain e clear",
      en: "Device, swapchain and clear",
    },
    goal: {
      pt: "Abrir janela e chegar ao primeiro pixel com D3D11 puro: D3D11CreateDevice, DXGI swapchain, RTV/DSV e Present. O jogo ainda nao desenha: modo bootstrap, para isolar falha de device de falha de render.",
      en: "Open a window and reach the first pixel with pure D3D11: D3D11CreateDevice, DXGI swapchain, RTV/DSV and Present. The game does not draw yet: bootstrap mode, to separate device failure from render failure.",
    },
    tasks: [
      { pt: "D3D11CreateDevice com feature level 11_0 e debug layer ligada em Debug.", en: "D3D11CreateDevice with feature level 11_0 and the debug layer on in Debug." },
      { pt: "Swapchain com B8G8R8A8_UNORM / B8G8R8X8_UNORM e DXGI_SWAP_EFFECT_FLIP_DISCARD.", en: "Swapchain with B8G8R8A8_UNORM / B8G8R8X8_UNORM and DXGI_SWAP_EFFECT_FLIP_DISCARD." },
      { pt: "DSV D24_UNORM_S8_UINT e ClearRenderTargetView/ClearDepthStencilView por frame.", en: "D24_UNORM_S8_UINT DSV and per-frame ClearRenderTargetView/ClearDepthStencilView." },
      { pt: "Tratar resize, alt-tab, minimizar e GetDeviceRemovedReason.", en: "Handle resize, alt-tab, minimize and GetDeviceRemovedReason." },
    ],
    gate: {
      pt: "Janela abre, limpa na cor certa, sobrevive a 20 resizes e a 5 ciclos de alt-tab sem device removed.",
      en: "Window opens, clears to the right colour, survives 20 resizes and 5 alt-tab cycles with no device removed.",
    },
    deliverable: "lib\\d3d11\\engdd11.cpp (Init/Present/Resize)",
    risk: { pt: "Dois swapchains no mesmo HWND brigam pelo Present — a fase tem de ser modo exclusivo.", en: "Two swapchains on the same HWND fight over Present — the phase must be exclusive mode." },
    revert: { pt: "Flag _ENABLE_DX11 volta a 0; nada do DX9 foi alterado.", en: "Set _ENABLE_DX11 back to 0; no DX9 code was touched." },
  },
  {
    id: "D3",
    status: "next",
    title: {
      pt: "Recursos, shaders e cbuffers",
      en: "Resources, shaders and cbuffers",
    },
    goal: {
      pt: "Provar o caminho completo de um draw: buffer, input layout, shader SM5 compilado em runtime e constantes saindo de cbuffer em vez de registrador solto.",
      en: "Prove the full path of one draw: buffer, input layout, SM5 shader compiled at runtime and constants coming from a cbuffer instead of loose registers.",
    },
    tasks: [
      { pt: "CreateBuffer/CreateTexture2D + SRV/RTV/DSV (views explicitas e guardadas, nunca por frame).", en: "CreateBuffer/CreateTexture2D + SRV/RTV/DSV (explicit, stored views, never per frame)." },
      { pt: "Trocar D3DXCompileShader_Cached por D3DCompile mantendo o cache em disco do ShaderCompileCache.", en: "Replace D3DXCompileShader_Cached with D3DCompile keeping the ShaderCompileCache disk cache." },
      { pt: "Gerar os cbuffers a partir de VSC_LIST/PSC_LIST (common.h): c0..c45 + free space, c0..c26 + livre.", en: "Generate cbuffers from VSC_LIST/PSC_LIST (common.h): c0..c45 + free space, c0..c26 + free." },
      { pt: "Converter uma familia piloto (objeto basico) de SM3 para SM5, sem mudar a matematica.", en: "Convert one pilot family (basic object) from SM3 to SM5 without changing the maths." },
    ],
    gate: {
      pt: "Um cubo texturizado com VS/PS compilados dos .hlsl convertidos, 1 draw call, zero erro no debug layer.",
      en: "A textured cube with VS/PS compiled from the converted .hlsl, 1 draw call, zero debug layer errors.",
    },
    deliverable: "lib\\d3d11\\ (buffers, shaders, cbuffer) · ShaderCompileCache.cpp",
    risk: { pt: "D3DCompile rejeita sintaxe SM2/SM3 (sampler2D, tex2D): a conversao do shader e o trabalho real.", en: "D3DCompile rejects SM2/SM3 syntax (sampler2D, tex2D): shader conversion is the real work." },
    revert: { pt: "Fase inteira atras da flag; o DX9 continua sendo o caminho padrao.", en: "The whole phase sits behind the flag; DX9 remains the default path." },
  },
  {
    id: "D4",
    status: "next",
    title: {
      pt: "Estados e cache de PSO",
      en: "State and PSO cache",
    },
    goal: {
      pt: "Os 108 D3DRS_* e 13 D3DSAMP_* nao podem ser aplicados um a um no D3D11. O engine ja espelha tudo em RendState por contexto, entao o PSO e derivado por hash — em um unico ponto, PBIDrawIndexedPrimitive::Do.",
      en: "The 108 D3DRS_* and 13 D3DSAMP_* cannot be applied one by one in D3D11. The engine already mirrors everything in RendState per context, so the PSO is derived by hash — at a single point, PBIDrawIndexedPrimitive::Do.",
    },
    tasks: [
      { pt: "Mapear os 30 estados com efeito real para BlendState/RasterizerState/DepthStencilState.", en: "Map the 30 states with real effect to BlendState/RasterizerState/DepthStencilState." },
      { pt: "Chave de PSO: hash(renderState, samplerState, VS, PS, input layout, formatos de RT, sample count, predication).", en: "PSO key: hash(renderState, samplerState, VS, PS, input layout, RT formats, sample count, predication)." },
      { pt: "Traduzir D3DRS_SRGBWRITEENABLE/D3DSAMP_SRGBTEXTURE para formato _SRGB na view.", en: "Translate D3DRS_SRGBWRITEENABLE/D3DSAMP_SRGBTEXTURE into a _SRGB view format." },
      { pt: "Alpha test: clip() no PS com alphaRef vindo do cbuffer (nao existe estado no D3D11).", en: "Alpha test: clip() in the PS with alphaRef from the cbuffer (no such state in D3D11)." },
      { pt: "Substituir os 3 hacks de vendor (AToC ATI/NVIDIA, shadow buffer INTZ/DF24) por recursos nativos.", en: "Replace the 3 vendor hacks (AToC ATI/NVIDIA, INTZ/DF24 shadow buffer) with native resources." },
    ],
    gate: {
      pt: "Os 30 estados aplicados corretamente; nenhuma chamada por-estado no frame; cache com hit rate medido.",
      en: "The 30 states applied correctly; no per-state call in the frame; cache hit rate measured.",
    },
    deliverable: "lib\\d3d11\\ (estado/PSO) · mapeamento de D3DSetRenderState/D3DSetSamplerState",
    risk: { pt: "Misturar estado de predicao com oclusao: NPredicationModes e predicao de estado, nao culling.", en: "Confusing predication state with occlusion: NPredicationModes is state predication, not culling." },
    revert: { pt: "Cache desligavel: cair para aplicacao direta de estado (mais lento, correto).", en: "Cache can be disabled: fall back to direct state application (slower, correct)." },
  },
  {
    id: "D5",
    status: "next",
    title: {
      pt: "Geometria do mundo (primeiro frame real)",
      en: "World geometry (first real frame)",
    },
    goal: {
      pt: "Terreno, objetos e vegetacao desenhados pelo D3D11 com as 22 vertex declarations convertidas e texturas carregadas por DirectXTex. E o primeiro frame comparavel ao baseline.",
      en: "Terrain, objects and vegetation drawn by D3D11 with the 22 converted vertex declarations and textures loaded through DirectXTex.",
    },
    tasks: [
      { pt: "As 22 vertexDecl* + as geradas por CreateVertexDeclaration viram D3D11_INPUT_ELEMENT_DESC.", en: "The 22 vertexDecl* plus the generated ones become D3D11_INPUT_ELEMENT_DESC." },
      { pt: "Input layout com chave (declId, vsId): no D3D11 o layout e amarrado ao VS, nao ao draw.", en: "Input layout keyed by (declId, vsId): in D3D11 the layout is bound to the VS, not the draw." },
      { pt: "Instancing: SetStreamSourceFreq vira INPUT_PER_INSTANCE_DATA + InstanceDataStepRate.", en: "Instancing: SetStreamSourceFreq becomes INPUT_PER_INSTANCE_DATA + InstanceDataStepRate." },
      { pt: "POSITIONT e PSIZE nao existem: VS trivial para screen-space e quad gerado por SV_VertexID.", en: "POSITIONT and PSIZE do not exist: trivial VS for screen space and a quad generated by SV_VertexID." },
      { pt: "D3DXLoadSurfaceFromFileInMemory/GetImageInfo/FilterTexture viram DirectXTex.", en: "D3DXLoadSurfaceFromFileInMemory/GetImageInfo/FilterTexture become DirectXTex." },
    ],
    gate: {
      pt: "Mundo visivel com materiais basicos; 8 cenas comparadas com o baseline e diferencas catalogadas.",
      en: "World visible with basic materials; 8 scenes compared against baseline with differences catalogued.",
    },
    deliverable: "lib\\d3d11\\ (IA, textura, materiais) · Enfusion\\src\\render\\enf_texture.cpp",
    risk: { pt: "Comparar sem baseline da D0 transforma qualquer diferenca em discussao sem prova.", en: "Comparing without the D0 baseline turns every difference into an argument without proof." },
    revert: { pt: "Flag por tipo de geometria: terreno, objeto e vegetacao ligam separado.", en: "Per-geometry flag: terrain, objects and vegetation toggle separately." },
  },
  {
    id: "D6",
    status: "next",
    title: {
      pt: "Pos-processamento (552 das 990 chamadas)",
      en: "Post-processing (552 of 990 calls)",
    },
    goal: {
      pt: "O maior bloco do port. StretchRect, GetSurfaceLevel por frame e LockRect em tabela de conversao viram cadeia de RTs, views guardadas e UpdateSubresource.",
      en: "The largest block of the port. StretchRect, per-frame GetSurfaceLevel and LockRect on conversion tables become an RT chain, stored views and UpdateSubresource.",
    },
    tasks: [
      { pt: "Grafo de RTs explicito: cada passe declara entrada/saida; nenhum GetSurfaceLevel no frame.", en: "Explicit RT graph: every pass declares input/output; no GetSurfaceLevel in the frame." },
      { pt: "StretchRect com mudanca de formato vira passe de blit com sampler (nao existe copy convertendo formato).", en: "StretchRect with a format change becomes a blit pass with a sampler (no copy converts format)." },
      { pt: "LockRect das tabelas _tableTc/_tableTcSystem: gerar em RAM e subir uma vez com UpdateSubresource.", en: "LockRect on the _tableTc/_tableTcSystem tables: build in RAM and upload once with UpdateSubresource." },
      { pt: "HDR A16B16G16R16F/G16R16F, SSAO, SSSM, bloom, god rays, DOF e AA (FXAA/SMAA) em SM5.", en: "HDR A16B16G16R16F/G16R16F, SSAO, SSSM, bloom, god rays, DOF and AA (FXAA/SMAA) in SM5." },
      { pt: "Auditar GetCurrRenderTargetAsTexture: ler RT que esta sendo escrita e erro de API no D3D11.", en: "Audit GetCurrRenderTargetAsTexture: reading the RT being written is an API error in D3D11." },
    ],
    gate: {
      pt: "Imagem final equivalendo ao baseline nas 8 cenas; nenhum read-while-bound; debug layer limpo.",
      en: "Final image matching baseline on the 8 scenes; no read-while-bound; clean debug layer.",
    },
    deliverable: "lib\\d3d11\\postProcess* · lib\\d3d9\\postProcess.cpp (referencia)",
    risk: { pt: "Parte do encadeamento e decidida por flag de qualidade em runtime: precisa de trace (RenderDoc) para fechar o grafo.", en: "Part of the chain is decided by runtime quality flags: needs a trace (RenderDoc) to close the graph." },
    revert: { pt: "Manter o pos-processo em D3D9 convivendo (dois devices) ate esta fase fechar.", en: "Keep post-processing on D3D9 coexisting (two devices) until this phase closes." },
  },
  {
    id: "D7",
    status: "next",
    title: {
      pt: "Enfusion e SimulWeather",
      en: "Enfusion and SimulWeather",
    },
    goal: {
      pt: "Fechar os vazamentos de D3D9 fora de lib\\d3d9: 7 arquivos do Enfusion que furam a abstracao Engine, e o SimulWeather, que e biblioteca de terceiro com backend DX9.",
      en: "Close the D3D9 leaks outside lib\\d3d9: 7 Enfusion files that bypass the Engine abstraction, and SimulWeather, a third-party library with a DX9 backend.",
    },
    tasks: [
      { pt: "enf_shapes (91) e enf_rendmain (87): redirecionar para Engine ou portar direto.", en: "enf_shapes (91) and enf_rendmain (87): redirect to Engine or port directly." },
      { pt: "enf_texture (15), enf_texture_loader (6), enf_rendrendertarget (6), enf_rendswapchain (4), enf_vertexdeclaration (3).", en: "enf_texture (15), enf_texture_loader (6), enf_rendrendertarget (6), enf_rendswapchain (4), enf_vertexdeclaration (3)." },
      { pt: "SimulWeather: decidir entre backend DX11 do Simul ou desligar nuvens volumetricas na primeira entrega.", en: "SimulWeather: decide between the Simul DX11 backend or disabling volumetric clouds in the first delivery." },
    ],
    gate: {
      pt: "HUD, shapes e materiais do Enfusion corretos; nuvens com decisao registrada e documentada.",
      en: "Enfusion HUD, shapes and materials correct; clouds with a recorded, documented decision.",
    },
    deliverable: "Enfusion\\src\\render\\* · lib\\SimulWeather\\*",
    risk: { pt: "SimulWeather nao tem fonte aberta do backend DX11: pode virar dependencia comercial.", en: "SimulWeather has no open DX11 backend source: it may become a commercial dependency." },
    revert: { pt: "Nuvens desligadas por flag; resto do ceu continua funcionando.", en: "Clouds off by flag; the rest of the sky keeps working." },
  },
  {
    id: "D8",
    status: "next",
    title: {
      pt: "Remocao do DX9 (fase final, e ela e fisica)",
      en: "DX9 removal (final phase, and it is physical)",
    },
    goal: {
      pt: "Apagar o DX9 da source: nao deixar o codigo antigo convivendo. Nada de dois renderizadores no mesmo build — o DX9 sai do .vcxproj, do include path e do link.",
      en: "Delete DX9 from the source: do not leave the old code coexisting. No two renderers in the same build — DX9 leaves the .vcxproj, the include path and the linker.",
    },
    tasks: [
      { pt: "Ligar _ENABLE_DX11 1 e apagar o bloco #if _ENABLE_DX10 de todas as configs.", en: "Turn _ENABLE_DX11 to 1 and delete the #if _ENABLE_DX10 block from every config." },
      { pt: "Remover CreateEngineD3D9, a opcao -dx9 e a flag ForceDX9 do main.cpp.", en: "Remove CreateEngineD3D9, the -dx9 option and the ForceDX9 flag from main.cpp." },
      { pt: "Apagar lib\\d3d9\\* (18 TUs + 168 metodos de wrapper) e ShaderSources_3_0 depois da conversao SM5.", en: "Delete lib\\d3d9\\* (18 TUs + 168 wrapper methods) and ShaderSources_3_0 after the SM5 conversion." },
      { pt: "Tirar d3d9.lib/d3dx9.lib/d3dcompiler antigo do lib.vcxproj e o extern\\DXSDK do include path.", en: "Remove d3d9.lib/d3dx9.lib/old d3dcompiler from lib.vcxproj and extern\\DXSDK from the include path." },
      { pt: "Gate de grep: nenhum IDirect3D*, D3DX*, D3DFMT_* ou D3DRS_* no codigo compilado.", en: "Grep gate: no IDirect3D*, D3DX*, D3DFMT_* or D3DRS_* in compiled code." },
    ],
    gate: {
      pt: "Build sem d3d9.lib, sem d3dx9.h, sem IDirect3D*; jogo roda so em D3D11; baseline visual equivalente.",
      en: "Build without d3d9.lib, without d3dx9.h, without IDirect3D*; game runs on D3D11 only; equivalent visual baseline.",
    },
    deliverable: "lib\\lib.vcxproj · lib\\main.cpp · lib\\*Config.h · remocao de lib\\d3d9",
    risk: { pt: "Deletar antes da D5/D6 fecharem deixa o jogo sem render. Esta fase e a ultima, sempre.", en: "Deleting before D5/D6 close leaves the game without a renderer. This phase is always last." },
    revert: { pt: "Nao tem: e a unica fase sem volta. Por isso e a ultima.", en: "None: it is the only one-way phase. That is why it is last." },
  },
];

/** Estagios da remocao fisica — a resposta para "como o DX9 sai de vez". */
export const DX11_STAGES: { id: string; title: L; desc: L }[] = [
  {
    id: "1",
    title: { pt: "Convivencia (D1–D7)", en: "Coexistence (D1–D7)" },
    desc: {
      pt: "Os dois backends existem no mesmo arquivo fonte, mas so um esta ligado. _ENABLE_DX11 alterna o caminho em main.cpp. O DX9 continua sendo o padrao e o jogo do dia a dia nao muda.",
      en: "Both backends exist in the same source tree, but only one is enabled. _ENABLE_DX11 switches the path in main.cpp. DX9 stays the default and the daily game does not change.",
    },
  },
  {
    id: "2",
    title: { pt: "Troca do padrao (fim da D7)", en: "Default swap (end of D7)" },
    desc: {
      pt: "_ENABLE_DX11 passa a 1 no Retail. O DX9 continua no projeto como fallback por 1 ciclo de build, so para comparar. Ninguem adiciona codigo novo no DX9 nesse periodo.",
      en: "_ENABLE_DX11 becomes 1 in Retail. DX9 stays in the project as a fallback for one build cycle, only for comparison. Nobody adds new code to DX9 during this period.",
    },
  },
  {
    id: "3",
    title: { pt: "Remocao (D8)", en: "Removal (D8)" },
    desc: {
      pt: "Apaga os arquivos, tira libs e include path, remove as flags. O build fica com um unico renderizador. O grep gate prova que nao sobrou D3D9 no codigo compilado.",
      en: "Delete the files, drop libs and include paths, remove the flags. The build keeps a single renderer. The grep gate proves no D3D9 remains in compiled code.",
    },
  },
];

/** Os 18 TUs que desaparecem, com a fase em que cada um pode ser apagado. */
export const DX11_TARGETS: { file: string; calls: number; until: string }[] = [
  { file: "lib\\d3d9\\postProcess.cpp", calls: 552, until: "D6" },
  { file: "lib\\d3d9\\engdd9.cpp", calls: 147, until: "D5" },
  { file: "Enfusion\\src\\baseWorld\\enf_shapes.cpp", calls: 91, until: "D7" },
  { file: "Enfusion\\src\\render\\enf_rendmain.cpp", calls: 87, until: "D7" },
  { file: "Enfusion\\src\\render\\enf_texture.cpp", calls: 15, until: "D7" },
  { file: "lib\\d3d9\\txtD3D9.cpp", calls: 10, until: "D5" },
  { file: "Enfusion\\src\\render\\enf_texture_loader.cpp", calls: 6, until: "D7" },
  { file: "Enfusion\\src\\render\\enf_rendrendertarget.cpp", calls: 6, until: "D7" },
  { file: "lib\\SimulWeather\\SimulCommonDX9.cpp", calls: 6, until: "D7" },
  { file: "lib\\SimulWeather\\SimulCloudRendererDX9.cpp", calls: 5, until: "D7" },
  { file: "Enfusion\\src\\render\\enf_rendswapchain.cpp", calls: 4, until: "D7" },
  { file: "lib\\d3d9\\pushBuffer.cpp", calls: 3, until: "D5" },
  { file: "Enfusion\\src\\render\\enf_vertexdeclaration.cpp", calls: 3, until: "D7" },
  { file: "Enfusion\\src\\materials\\enf_imaterialsystem.cpp", calls: 3, until: "D7" },
  { file: "lib\\d3d9\\d3d9Buffers.cpp", calls: 2, until: "D5" },
  { file: "Enfusion\\src\\engine\\enf_winengine.cpp", calls: 2, until: "D7" },
  { file: "Enfusion\\src\\render\\enf_rendshaders.cpp", calls: 1, until: "D7" },
];

/** Regras que valem em todas as fases. */
export const DX11_RULES: L[] = [
  {
    pt: "Uma fase por build. Duas fases na mesma compilacao e impossivel saber o que causou a diferenca.",
    en: "One phase per build. Two phases in the same build makes it impossible to know what caused the difference.",
  },
  {
    pt: "Nenhuma fase quebra o build do dia a dia: ate a D7, _ENABLE_DX11 fica 0 no Retail.",
    en: "No phase breaks the daily build: until D7, _ENABLE_DX11 stays 0 in Retail.",
  },
  {
    pt: "Todo numero publicado aqui sai da source (lib\\lib.vcxproj), nao de estimativa.",
    en: "Every number published here comes from the source (lib\\lib.vcxproj), not from an estimate.",
  },
  {
    pt: "Fase so vira `done` com build verde, teste registrado e comparacao visual anexada.",
    en: "A phase only becomes `done` with a green build, a recorded test and an attached visual comparison.",
  },
];

export const DX11_COPY: Record<string, L> = {
  "dx11.kicker": { pt: "projeto · renderizador", en: "project · renderer" },
  "dx11.title": { pt: "Port Direct3D 9 → Direct3D 11", en: "Direct3D 9 → Direct3D 11 port" },
  "dx11.lead": {
    pt: "O plano para remover o DirectX 9 da source e entregar o jogo em DirectX 11. Nove fases, cada uma com criterio de saida objetivo, arquivo responsavel e forma de reverter. O mapeamento tecnico que sustenta o plano esta em docs\\d3d11-port (11 documentos).",
    en: "The plan to remove DirectX 9 from the source and ship the game on DirectX 11. Nine phases, each with an objective exit criterion, the responsible files and a way to revert. The technical mapping behind the plan lives in docs\\d3d11-port (11 documents).",
  },
  "dx11.stat.phases": { pt: "fases", en: "phases" },
  "dx11.stat.phasesHint": { pt: "D0 → D8, uma por build", en: "D0 → D8, one per build" },
  "dx11.stat.done": { pt: "concluidas", en: "completed" },
  "dx11.stat.doneHint": { pt: "mapeamento feito, codigo nao iniciado", en: "mapping done, code not started" },
  "dx11.stat.calls": { pt: "chamadas D3D9", en: "D3D9 calls" },
  "dx11.stat.callsHint": { pt: "943 diretas + 45 D3DX = 990", en: "943 direct + 45 D3DX = 990" },
  "dx11.stat.files": { pt: "arquivos a apagar", en: "files to delete" },
  "dx11.stat.filesHint": {
    pt: "de 18 TUs: 17 saem, ShaderCompileCache.cpp vira D3DCompile",
    en: "of 18 TUs: 17 leave, ShaderCompileCache.cpp becomes D3DCompile",
  },

  "dx11.now.title": { pt: "Estado atual", en: "Current state" },
  "dx11.now.lead": { pt: "O que existe hoje, sem enfeite.", en: "What exists today, no decoration." },
  "dx11.now.mapped": { pt: "Mapeado", en: "Mapped" },
  "dx11.now.mappedDesc": {
    pt: "11 documentos em docs\\d3d11-port: 171 APIs (77 usadas), 108 render states, 13 sampler states, 64 formatos, 22 vertex declarations, 13 funcoes D3DX, registrador→cbuffer de shader, D3D9Ex, pools/locks/queries.",
    en: "11 documents in docs\\d3d11-port: 171 APIs (77 used), 108 render states, 13 sampler states, 64 formats, 22 vertex declarations, 13 D3DX functions, shader register→cbuffer, D3D9Ex, pools/locks/queries.",
  },
  "dx11.now.code": { pt: "Codigo", en: "Code" },
  "dx11.now.codeDesc": {
    pt: "Zero. Nenhum arquivo do renderizador foi criado ainda. A D0 (baseline) e a D1 (slot do backend) sao as proximas acoes e nenhuma delas muda o DX9 que roda hoje.",
    en: "Zero. No renderer file has been created yet. D0 (baseline) and D1 (backend slot) are the next actions and neither changes the DX9 that runs today.",
  },
  "dx11.now.slot": { pt: "Encaixe", en: "Hook" },
  "dx11.now.slotDesc": {
    pt: "O projeto ja tem o encaixe pronto: CreateEngineD3D9 devolve Engine* em lib\\main.cpp:12336, o bloco #if _ENABLE_DX10 chama CreateEngineD3DT, e a flag ForceDX9 existe. lib\\d3dT esta vazio. O EngineDDXB (Xbox 360) implementa 284 dos 394 metodos virtuais e serve de template.",
    en: "The project already has the hook: CreateEngineD3D9 returns Engine* at lib\\main.cpp:12336, the #if _ENABLE_DX10 block calls CreateEngineD3DT, and the ForceDX9 flag exists. lib\\d3dT is empty. EngineDDXB (Xbox 360) implements 284 of the 394 virtual methods and serves as a template.",
  },

  "dx11.phases.title": { pt: "Fases", en: "Phases" },
  "dx11.phases.lead": {
    pt: "Cada fase tem um portao: so fecha quando o criterio de saida for verdadeiro. Enquanto o portao nao passa, a fase nao vira done.",
    en: "Each phase has a gate: it only closes when the exit criterion is true. Until the gate passes, the phase does not become done.",
  },
  "dx11.phase.tasks": { pt: "Tarefas", en: "Tasks" },
  "dx11.phase.gate": { pt: "Portao de saida", en: "Exit gate" },
  "dx11.phase.files": { pt: "Arquivos", en: "Files" },
  "dx11.phase.risk": { pt: "Risco", en: "Risk" },
  "dx11.phase.revert": { pt: "Reversao", en: "Revert" },
  "dx11.status.done": { pt: "concluida", en: "done" },
  "dx11.status.doing": { pt: "em andamento", en: "in progress" },
  "dx11.status.next": { pt: "proxima", en: "next" },
  "dx11.status.blocked": { pt: "travada", en: "blocked" },

  "dx11.remove.title": { pt: "Como o DX9 sai de vez", en: "How DX9 goes away for good" },
  "dx11.remove.lead": {
    pt: "Remover o DX9 nao e conviver com ele para sempre. Sao tres estagios: convivencia com flag, troca do padrao, remocao fisica. O estagio final apaga arquivo, lib e include path.",
    en: "Removing DX9 is not living with it forever. Three stages: coexistence behind a flag, default swap, physical removal. The final stage deletes files, libs and include paths.",
  },
  "dx11.targets.title": { pt: "Os 17 arquivos que desaparecem", en: "The 17 files that disappear" },
  "dx11.targets.lead": {
    pt: "Contagem verificada em lib\\lib.vcxproj. O 18º TU do escopo (lib\\d3d9\\ShaderCompileCache.cpp) nao e apagado: o cache em disco continua e so o compilador muda de D3DXCompileShader para D3DCompile. A coluna 'apagavel em' e a primeira fase em que o arquivo deixa de ser necessario — nunca antes do portao dela passar.",
    en: "Verified against lib\\lib.vcxproj. The 18th TU in scope (lib\\d3d9\\ShaderCompileCache.cpp) is not deleted: the disk cache stays and only the compiler changes from D3DXCompileShader to D3DCompile. The 'deletable in' column is the first phase where the file stops being needed — never before its gate passes.",
  },
  "dx11.targets.col.file": { pt: "Arquivo", en: "File" },
  "dx11.targets.col.calls": { pt: "Chamadas D3D9", en: "D3D9 calls" },
  "dx11.targets.col.until": { pt: "Apagavel em", en: "Deletable in" },

  "dx11.rules.title": { pt: "Regras do port", en: "Port rules" },
  "dx11.next.title": { pt: "Proximo passo", en: "Next step" },
  "dx11.next.lead": {
    pt: "Comeca pela D0. Baseline de build e de imagem antes de qualquer codigo novo. Depois D1: o slot do backend compilando e devolvendo NULL, com a flag desligada.",
    en: "It starts at D0. Build and image baseline before any new code. Then D1: the backend slot compiling and returning NULL, with the flag off.",
  },
  "dx11.next.cta": { pt: "Ver o plano visual (0.62)", en: "See the visual plan (0.62)" },
  "dx11.next.docs": { pt: "Documentacao tecnica", en: "Technical docs" },
};

function pick(v: L, locale: Locale): string {
  if (locale === "pt") return v.pt;
  if (locale === "en") return v.en ?? v.pt;
  return v.ru ?? v.en ?? v.pt;
}

export function useDx11T() {
  const { locale } = useLocale();
  return {
    locale,
    tr: (v: L) => pick(v, locale),
    t: (key: string) => {
      const v = DX11_COPY[key];
      return v ? pick(v, locale) : key;
    },
  };
}

export const DX11_KEYS = Object.keys(DX11_COPY);
