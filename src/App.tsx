import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { navigate, useRoute } from "./lib/router";
import { USING_SUPABASE, useAccountStore, useCurrentAccount } from "./lib/accounts";
import type { ComponentType } from "react";
import { Overview } from "./pages/Overview";
import { Functions } from "./pages/Functions";
import { Comments } from "./pages/Comments";
import { Updates } from "./pages/Updates";
import { Findings } from "./pages/Findings";
import { Tools } from "./pages/Tools";
import { Documento } from "./pages/Documento";
import { Fonte } from "./pages/Fonte";
import { Motor } from "./pages/Motor";
import { Diagrama } from "./pages/Diagrama";
import { Linguagens } from "./pages/Linguagens";
import { Bugs } from "./pages/Bugs";
import { Dicionario } from "./pages/Dicionario";
import { Pendencias } from "./pages/Pendencias";
import { Atualizacoes } from "./pages/Atualizacoes";
import { PassoAPasso } from "./pages/PassoAPasso";
import { Dx11 } from "./pages/Dx11";
import { Plano } from "./pages/Plano";
import { Landing } from "./pages/Landing";
import { MinhaConta } from "./pages/MinhaConta";
import { Admin } from "./pages/Admin";
import { DocsGate } from "./pages/DocsGate";
import { WorkshopMods } from "./pages/WorkshopMods";

const ROTAS: Record<string, ComponentType> = {
  "visao-geral": Overview,
  documento: Documento,
  fonte: Fonte,
  motor: Motor,
  diagrama: Diagrama,
  linguagens: Linguagens,
  funcoes: Functions,
  comentarios: Comments,
  achados: Findings,
  bugs: Bugs,
  pendencias: Pendencias,
  atualizacoes: Atualizacoes,
  "passo-a-passo": PassoAPasso,
  dx11: Dx11,
  plano: Plano,
  patches: Updates,
  dicionario: Dicionario,
  ferramentas: Tools,
};

type SteamReturn = { status: string; motivo: string };

export default function App() {
  const route = useRoute();
  const store = useAccountStore();
  const account = useCurrentAccount();

  // Lê a volta do Steam OpenID antes do primeiro render. Se ficasse num
  // useEffect, o efeito filho de MinhaConta rodaria antes e perderia o aviso.
  const [steamReturn, setSteamReturn] = useState<SteamReturn | null>(() => {
    const url = new URL(window.location.href);
    const steam = url.searchParams.get("steam");
    if (!steam) return null;

    const motivo = url.searchParams.get("motivo") ?? "";
    url.searchParams.delete("steam");
    url.searchParams.delete("motivo");
    try {
      window.history.replaceState({}, "", url.toString());
    } catch {
      // se o navegador bloquear, o parâmetro fica na URL sem afetar o app
    }
    return { status: steam, motivo };
  });

  // Volta do link de confirmação de e-mail: o Supabase já trocou o código por
  // uma sessão, então basta abrir Minha conta e limpar o parâmetro.
  useEffect(() => {
    if (!USING_SUPABASE || !store.ready || !account) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") !== "confirm") return;
    url.searchParams.delete("auth");
    window.history.replaceState({}, "", url.toString());
    navigate("minha-conta");
  }, [store.ready, account]);

  // Volta do Steam OpenID: o backend já gravou o vínculo. Abre Minha conta
  // para o painel mostrar o resultado.
  useEffect(() => {
    if (steamReturn) navigate("minha-conta");
  }, [steamReturn]);

  const page = route.parts[0] ?? "";
  const Page = ROTAS[page];

  if (page === "") return <Landing />;
  if (page === "workshopMods") return <WorkshopMods modId={route.parts[1] ?? null} />;
  if (page === "minha-conta") {
    return <MinhaConta steamReturn={steamReturn} onSteamHandled={() => setSteamReturn(null)} />;
  }
  if (page === "admin") return <Admin />;

  // A documentação da source só abre para contas com is_dev (ou admin). O
  // banco também protege os dados; este gate controla a interface. Sem
  // Supabase (modo local de desenvolvimento) não há como autenticar, então o
  // explorador estático continua aberto.
  if (Page && USING_SUPABASE) {
    if (!store.ready) return <DocsGate mode="loading" />;
    if (!account) return <DocsGate mode="login" />;
    if (!account.isDev && !account.isAdmin) {
      return <DocsGate mode="denied" account={account} />;
    }
  }

  return (
    <Layout>
      {Page ? (
        <Page />
      ) : (
        <div className="page">
          <h1>404</h1>
          <p>Rota desconhecida: {route.path}</p>
        </div>
      )}
    </Layout>
  );
}
