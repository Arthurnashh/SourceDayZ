import type { Locale } from "../lib/i18n";

export interface AuthCopy {
  pill: string;
  title: string;
  subtitle: string;
  tabsAria: string;
  enter: string;
  create: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirm: string;
  confirmPlaceholder: string;
  consentOnline: string;
  consentLocal: string;
  passwordsMismatch: string;
  consentRequiredOnline: string;
  consentRequiredLocal: string;
  confirmationSent: string;
  wait: string;
  createLocal: string;
  footerOnline: string;
  footerLocal: string;
}

const PT: AuthCopy = {
  pill: "conta de jogador",
  title: "Sua conta no SourceDayZ",
  subtitle:
    "Entre para acompanhar seu acesso, vincular a Steam e gerenciar o servidor que você abrir.",
  tabsAria: "Entrar ou criar conta",
  enter: "Entrar",
  create: "Criar conta",
  name: "Nome no site",
  namePlaceholder: "Como você quer ser chamado",
  email: "E-mail",
  emailPlaceholder: "voce@exemplo.com",
  password: "Senha",
  passwordPlaceholder: "mínimo de 8 caracteres",
  confirm: "Confirmar senha",
  confirmPlaceholder: "repita a senha",
  consentOnline:
    "Entendo que estou criando uma conta no SourceDayZ e que devo usar uma senha exclusiva para este site.",
  consentLocal:
    "Entendo que esta conta é local a este navegador enquanto o backend não entra no ar, e que não devo usar uma senha de outro site.",
  passwordsMismatch: "As senhas não conferem.",
  consentRequiredOnline: "Marque o aviso para continuar.",
  consentRequiredLocal: "Marque o aviso de conta local para continuar.",
  confirmationSent: "Conta criada! Confirme o e-mail que enviamos e depois entre por aqui.",
  wait: "Aguarde…",
  createLocal: "Criar conta e entrar",
  footerOnline:
    "Sua conta fica no banco do SourceDayZ e funciona em qualquer dispositivo. O acesso é gratuito para todos, sem mensalidade ou cobrança.",
  footerLocal:
    "Nesta versão, a conta fica neste navegador. O acesso é gratuito; a sincronização e o vínculo oficial com a Steam chegarão com o backend.",
};

const EN: AuthCopy = {
  pill: "player account",
  title: "Your SourceDayZ account",
  subtitle:
    "Sign in to follow your access, link Steam and manage the server you open.",
  tabsAria: "Sign in or create account",
  enter: "Sign in",
  create: "Create account",
  name: "Site name",
  namePlaceholder: "What should we call you",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  passwordPlaceholder: "at least 8 characters",
  confirm: "Confirm password",
  confirmPlaceholder: "repeat the password",
  consentOnline:
    "I understand I am creating a SourceDayZ account and that I should use a unique password for this site.",
  consentLocal:
    "I understand this account is local to this browser while the backend is not live, and that I should not reuse a password from another site.",
  passwordsMismatch: "The passwords do not match.",
  consentRequiredOnline: "Check the notice to continue.",
  consentRequiredLocal: "Check the local account notice to continue.",
  confirmationSent: "Account created! Confirm the email we sent and then sign in here.",
  wait: "Please wait…",
  createLocal: "Create account and sign in",
  footerOnline:
    "Your account lives in the SourceDayZ database and works on any device. Access is free for everyone, with no monthly fee or payment.",
  footerLocal:
    "In this version, your account stays in this browser. Access is free; sync and official Steam linking will arrive with the backend.",
};

const RU: AuthCopy = {
  pill: "аккаунт игрока",
  title: "Ваш аккаунт SourceDayZ",
  subtitle:
    "Войдите, чтобы следить за доступом, привязать Steam и управлять своим сервером.",
  tabsAria: "Войти или создать аккаунт",
  enter: "Войти",
  create: "Создать аккаунт",
  name: "Имя на сайте",
  namePlaceholder: "Как к вам обращаться",
  email: "E-mail",
  emailPlaceholder: "you@example.com",
  password: "Пароль",
  passwordPlaceholder: "не менее 8 символов",
  confirm: "Подтвердите пароль",
  confirmPlaceholder: "повторите пароль",
  consentOnline:
    "Я понимаю, что создаю аккаунт SourceDayZ, и что для этого сайта нужен отдельный пароль.",
  consentLocal:
    "Я понимаю, что аккаунт хранится только в этом браузере, пока backend не запущен, и что нельзя использовать пароль от другого сайта.",
  passwordsMismatch: "Пароли не совпадают.",
  consentRequiredOnline: "Отметьте уведомление, чтобы продолжить.",
  consentRequiredLocal: "Отметьте уведомление о локальном аккаунте, чтобы продолжить.",
  confirmationSent: "Аккаунт создан! Подтвердите письмо и затем войдите здесь.",
  wait: "Подождите…",
  createLocal: "Создать аккаунт и войти",
  footerOnline:
    "Аккаунт хранится в базе SourceDayZ и работает на любом устройстве. Доступ бесплатен для всех, ежемесячной платы нет.",
  footerLocal:
    "В этой версии аккаунт хранится в браузере. Доступ бесплатен; синхронизация и официальная привязка Steam появятся с backend.",
};

export const AUTH_COPY: Record<Locale, AuthCopy> = { pt: PT, en: EN, ru: RU };
