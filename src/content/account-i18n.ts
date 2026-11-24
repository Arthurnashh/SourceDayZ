import type { Locale } from "../lib/i18n";

export interface AccountShellCopy {
  header: {
    brandTag: string;
    home: string;
    servers: string;
    faq: string;
    admin: string;
    docs: string;
    signOut: string;
    accountNav: string;
  };
  loading: {
    eyebrow: string;
    title: string;
    text: string;
  };
  gate: {
    brandTag: string;
    back: string;
    eyebrow: string;
    titleA: string;
    titleB: string;
    lead: string;
    bullets: Array<{ title: string; text: string }>;
    noteOnline: string;
    noteLocal: string;
    aria: string;
  };
}

const PT: AccountShellCopy = {
  header: {
    brandTag: "minha conta",
    home: "Início",
    servers: "Servidores",
    faq: "FAQ",
    admin: "Admin",
    docs: "Docs",
    signOut: "Sair",
    accountNav: "Navegação da conta",
  },
  loading: {
    eyebrow: "minha conta",
    title: "Carregando sua conta…",
    text: "Conectando ao banco do SourceDayZ. Isso leva só um instante.",
  },
  gate: {
    brandTag: "painel de acesso",
    back: "← Voltar ao site",
    eyebrow: "minha conta",
    titleA: "Sua conta.",
    titleB: "Seu acesso. Seu servidor.",
    lead: "Um único lugar para entrar no jogo, vincular a Steam e acompanhar o servidor que você abrir. O acesso é gratuito para todos, sem mensalidade ou cobrança.",
    bullets: [
      { title: "Steam vinculada", text: "Nome, SteamID64 e perfil público no mesmo painel." },
      { title: "Acesso gratuito", text: "Permite participar do projeto sem mensalidade ou cobrança." },
      { title: "Abra um servidor", text: "Cadastre e acompanhe o servidor da sua comunidade pelo painel." },
    ],
    noteOnline: "Sua conta fica no banco do projeto e funciona em qualquer dispositivo. Use uma senha exclusiva para este site.",
    noteLocal: "Conta local neste navegador enquanto o backend não entra no ar. Não reutilize uma senha de outro site.",
    aria: "Entrar ou criar conta",
  },
};

const EN: AccountShellCopy = {
  header: {
    brandTag: "my account",
    home: "Home",
    servers: "Servers",
    faq: "FAQ",
    admin: "Admin",
    docs: "Docs",
    signOut: "Sign out",
    accountNav: "Account navigation",
  },
  loading: {
    eyebrow: "my account",
    title: "Loading your account…",
    text: "Connecting to the SourceDayZ database. This only takes a moment.",
  },
  gate: {
    brandTag: "access panel",
    back: "← Back to site",
    eyebrow: "my account",
    titleA: "Your account.",
    titleB: "Your access. Your server.",
    lead: "One place to enter the game, link Steam and follow your server. Access is free for everyone, with no monthly fee or payment.",
    bullets: [
      { title: "Steam linked", text: "Name, SteamID64 and public profile in the same panel." },
      { title: "Free access", text: "Lets you take part in the project without a subscription or payment." },
      { title: "Open a server", text: "Register and manage your community server from the account panel." },
    ],
    noteOnline: "Your account lives in the project database and works on any device. Use a unique password for this site.",
    noteLocal: "Local account in this browser while the backend is not live. Do not reuse a password from another site.",
    aria: "Sign in or create account",
  },
};

const RU: AccountShellCopy = {
  header: {
    brandTag: "моя учётная запись",
    home: "Главная",
    servers: "Серверы",
    faq: "FAQ",
    admin: "Админ",
    docs: "Документация",
    signOut: "Выйти",
    accountNav: "Навигация аккаунта",
  },
  loading: {
    eyebrow: "моя учётная запись",
    title: "Загружаем ваш аккаунт…",
    text: "Подключаемся к базе SourceDayZ. Это займёт мгновение.",
  },
  gate: {
    brandTag: "панель доступа",
    back: "← Назад на сайт",
    eyebrow: "моя учётная запись",
    titleA: "Ваш аккаунт.",
    titleB: "Ваш доступ. Ваш сервер.",
    lead: "Одно место, чтобы войти в игру, привязать Steam и управлять сервером. Доступ бесплатен для всех, без ежемесячной платы.",
    bullets: [
      { title: "Привязан Steam", text: "Имя, SteamID64 и публичный профиль в одной панели." },
      { title: "Бесплатный доступ", text: "Позволяет участвовать в проекте без подписки и оплаты." },
      { title: "Откройте сервер", text: "Добавьте сервер сообщества и управляйте им в панели аккаунта." },
    ],
    noteOnline: "Аккаунт хранится в базе проекта и работает на любом устройстве. Используйте отдельный пароль для этого сайта.",
    noteLocal: "Локальный аккаунт в этом браузере, пока backend не запущен. Не используйте пароль от другого сайта.",
    aria: "Войти или создать аккаунт",
  },
};

export const ACCOUNT_SHELL_COPY: Record<Locale, AccountShellCopy> = { pt: PT, en: EN, ru: RU };
