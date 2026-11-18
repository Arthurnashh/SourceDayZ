import type { Locale } from "../lib/i18n";

export interface DocsGateCopy {
  brandTag: string;
  back: string;
  loadingEyebrow: string;
  loadingTitle: string;
  loadingText: string;
  loginEyebrow: string;
  loginTitleA: string;
  loginTitleB: string;
  loginLead: string;
  loginBullets: Array<{ title: string; text: string }>;
  loginNote: string;
  deniedEyebrow: string;
  deniedTitleA: string;
  deniedTitleB: string;
  deniedLead: string;
  deniedNote: string;
  deniedSignOut: string;
  deniedAccount: string;
  deniedHome: string;
}

const PT: DocsGateCopy = {
  brandTag: "source · restrito",
  back: "← Voltar ao site",
  loadingEyebrow: "documentação da source",
  loadingTitle: "Verificando seu acesso…",
  loadingText: "A documentação é liberada apenas para contas de desenvolvedor aprovadas.",
  loginEyebrow: "documentação da source",
  loginTitleA: "A source é para a equipe.",
  loginTitleB: "Entre com sua conta dev.",
  loginLead:
    "Os documentos técnicos do projeto ficam restritos a desenvolvedores aprovados pelo administrador. Entre com a conta criada para você.",
  loginBullets: [
    { title: "Acesso por conta", text: "O papel de desenvolvedor é gravado no banco e conferido a cada sessão." },
    { title: "Somente leitura", text: "A documentação descreve a source; nada aqui altera o jogo ou os servidores." },
    { title: "Sem dados de jogadores", text: "Ser dev não dá acesso ao painel administrativo nem às contas do site." },
  ],
  loginNote: "Ainda não tem conta dev? Peça ao administrador do projeto para criar a sua.",
  deniedEyebrow: "acesso restrito",
  deniedTitleA: "Esta área é da equipe.",
  deniedTitleB: "Sua conta ainda não é dev.",
  deniedLead:
    "Você está conectado, mas esta conta não tem o papel de desenvolvedor. Peça ao administrador para liberar o acesso à documentação da source.",
  deniedNote: "Se você já pediu a liberação, saia e entre novamente para atualizar a sessão.",
  deniedSignOut: "Sair desta conta",
  deniedAccount: "Conta conectada",
  deniedHome: "Ir para o site",
};

const EN: DocsGateCopy = {
  brandTag: "source · restricted",
  back: "← Back to site",
  loadingEyebrow: "source documentation",
  loadingTitle: "Checking your access…",
  loadingText: "Documentation is only available to approved developer accounts.",
  loginEyebrow: "source documentation",
  loginTitleA: "The source is for the team.",
  loginTitleB: "Sign in with your dev account.",
  loginLead:
    "The project's technical documents are restricted to developers approved by the administrator. Sign in with the account created for you.",
  loginBullets: [
    { title: "Account-based access", text: "The developer role is stored in the database and checked on every session." },
    { title: "Read only", text: "The documentation describes the source; nothing here changes the game or the servers." },
    { title: "No player data", text: "Being a dev does not grant access to the admin panel or site accounts." },
  ],
  loginNote: "No dev account yet? Ask the project administrator to create one for you.",
  deniedEyebrow: "restricted access",
  deniedTitleA: "This area is for the team.",
  deniedTitleB: "Your account is not a dev yet.",
  deniedLead:
    "You are signed in, but this account does not have the developer role. Ask the administrator to unlock the source documentation for you.",
  deniedNote: "If you already requested access, sign out and sign in again to refresh the session.",
  deniedSignOut: "Sign out of this account",
  deniedAccount: "Signed in as",
  deniedHome: "Go to the site",
};

const RU: DocsGateCopy = {
  brandTag: "исходники · закрыто",
  back: "← Назад на сайт",
  loadingEyebrow: "документация исходников",
  loadingTitle: "Проверяем доступ…",
  loadingText: "Документация доступна только подтверждённым аккаунтам разработчиков.",
  loginEyebrow: "документация исходников",
  loginTitleA: "Исходники — для команды.",
  loginTitleB: "Войдите аккаунтом разработчика.",
  loginLead:
    "Технические документы проекта доступны только разработчикам, одобренным администратором. Войдите аккаунтом, который был создан для вас.",
  loginBullets: [
    { title: "Доступ по аккаунту", text: "Роль разработчика хранится в базе и проверяется в каждой сессии." },
    { title: "Только чтение", text: "Документация описывает исходники; здесь ничего не меняет игру или серверы." },
    { title: "Без данных игроков", text: "Роль dev не даёт доступа к админ-панели или аккаунтам сайта." },
  ],
  loginNote: "Ещё нет аккаунта разработчика? Попросите администратора проекта создать его.",
  deniedEyebrow: "закрытый доступ",
  deniedTitleA: "Эта зона — для команды.",
  deniedTitleB: "У вашего аккаунта пока нет роли dev.",
  deniedLead:
    "Вы вошли, но у этого аккаунта нет роли разработчика. Попросите администратора открыть доступ к документации исходников.",
  deniedNote: "Если доступ уже запрошен, выйдите и войдите снова, чтобы обновить сессию.",
  deniedSignOut: "Выйти из аккаунта",
  deniedAccount: "Вы вошли как",
  deniedHome: "Перейти на сайт",
};

export const DOCS_GATE_COPY: Record<Locale, DocsGateCopy> = { pt: PT, en: EN, ru: RU };
