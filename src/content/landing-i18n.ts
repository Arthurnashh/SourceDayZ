import type { Locale } from "../lib/i18n";

export interface LandingCopy {
  nav: Array<{ id: string; label: string }>;
  brandTag: string;
  enter: string;
  myAccount: string;
  free: string;
  mobileLogin: string;
  aria: {
    brand: string;
    nav: string;
    openMenu: string;
    features: string;
    serverTabs: string;
    footerNav: string;
    closeLogin: string;
    heroPhoto: string;
    projectPhoto: string;
  };
  hero: {
    eyebrow: string;
    titleBefore: string;
    titleEm: string;
    titleAfter: string;
    sub: string;
    ctaServers: string;
    ctaAccount: string;
    tags: string[];
    rail: Array<{ label: string; value: string }>;
  };
  servers: {
    eyebrow: string;
    title: string;
    lead: string;
    tabOfficial: string;
    tabCommunity: string;
    tabCommunitySmall: string;
    official: {
      type: string;
      title: string;
      text: string;
      ip: string;
      statusOnline: string;
      statusOffline: string;
      statusChecking: string;
      statusUnavailable: string;
      playersLabel: string;
      slotsLabel: string;
      meta: string[];
      button: string;
      copied: string;
    };
    officialGhost: {
      status: string;
      title: string;
      text: string;
      foot: string;
    };
    community: {
      type: string;
      title: string;
      status: string;
      text: string;
      members: string;
      online: string;
      since: string;
      date: string;
      join: string;
      note: string;
    };
    communityGhost: {
      status: string;
      title: string;
      text: string;
      foot: string;
    };
    footnoteBefore: string;
    footnoteLink: string;
    footnoteAfter: string;
  };
  project: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    lead: string;
    text: string;
    pillars: Array<{ n: string; title: string; text: string }>;
    legal: string;
    photoTag: string;
  };
  roadmap: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{ n: string; title: string; text: string; status: string }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    lead: string;
    noteLabel: string;
    noteTitle: string;
    noteText: string;
    loginAnswerOnline: string;
    loginAnswerLocal: string;
    items: Array<{ q: string; a: string; useLoginAnswer?: boolean }>;
  };
  cta: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    text: string;
    create: string;
    myAccount: string;
    servers: string;
  };
  footer: {
    tagline: string;
    account: string;
    discord: string;
    legal: string;
    credits: string;
    rights: string;
  };
}

const PT: LandingCopy = {
  nav: [
    { id: "inicio", label: "Início" },
    { id: "servidores", label: "Servidores" },
    { id: "projeto", label: "Projeto" },
    { id: "roadmap", label: "Roadmap" },
    { id: "faq", label: "FAQ" },
  ],
  brandTag: "projeto da comunidade",
  enter: "Entrar",
  myAccount: "Minha conta",
  free: "grátis",
  mobileLogin: "Entrar · criar conta",
  aria: {
    brand: "SourceDayZ — voltar ao topo",
    nav: "Navegação principal",
    openMenu: "Abrir menu",
    features: "Características do projeto",
    serverTabs: "Tipos de servidor",
    footerNav: "Links do rodapé",
    closeLogin: "Fechar login",
    heroPhoto: "Uma casa de madeira em Chernarus com a janela iluminada durante a noite",
    projectPhoto: "Grupo de sobreviventes ao redor de uma fogueira em Chernarus",
  },
  hero: {
    eyebrow: "projeto independente · 2026",
    titleBefore: "Sua história em ",
    titleEm: "Chernarus",
    titleAfter: " começa aqui.",
    sub: "SourceDayZ é um projeto de sobrevivência feito pela comunidade. O servidor oficial já está online; o servidor Modded da comunidade continua em desenvolvimento. Sem vínculo com a Bohemia Interactive.",
    ctaServers: "Conhecer os servidores",
    ctaAccount: "Entrar",
    tags: ["mundo persistente", "sem pay-to-win", "PC · standalone"],
    rail: [
      { label: "servidor oficial", value: "Online" },
      { label: "servidor da comunidade", value: "1 Modded em desenvolvimento" },
      { label: "contas de jogador", value: "Abertas" },
      { label: "primeiro wipe", value: "A definir" },
    ],
  },
  servers: {
    eyebrow: "onde jogar",
    title: "Escolha o seu mundo.",
    lead: "O servidor oficial já está online. O REMANESCENTZ PREVALECE é o servidor Modded da comunidade e continua em desenvolvimento.",
    tabOfficial: "Servidores oficiais",
    tabCommunity: "Servidores da comunidade",
    tabCommunitySmall: "Modded · em desenvolvimento",
    official: {
      type: "oficial · no mods · regular",
      title: "SourceDayZ Oficial",
      text: "Servidor online de DayZ Oldschool 0.45 (2014), sem mods e com dificuldade Regular.",
      ip: "3.143.228.170",
      statusOnline: "online",
      statusOffline: "offline",
      statusChecking: "consultando",
      statusUnavailable: "indisponível",
      playersLabel: "jogadores online",
      slotsLabel: "vagas disponíveis",
      meta: ["DayZ Oldschool 0.45 · 2014", "No Mods", "Regular"],
      button: "Copiar IP",
      copied: "IP copiado",
    },
    officialGhost: {
      status: "em breve",
      title: "Próximo mundo oficial",
      text: "A equipe vai abrir novos servidores conforme a comunidade crescer. Esta lista será atualizada aqui, sem datas inventadas.",
      foot: "aguardando definição de regras e wipe",
    },
    community: {
      type: "comunidade · modded · independente",
      title: "REMANESCENTZ PREVALECE",
      status: "em desenvolvimento ativo",
      text: "Servidor Modded da comunidade em desenvolvimento. Acompanhe testes e avisos pelo Discord.",
      members: "membros",
      online: "online agora",
      since: "Existe desde",
      date: "14/06/2025 · 17:51",
      join: "Entrar no Discord",
      note: "Convite permanente do servidor",
    },
    communityGhost: {
      status: "em breve",
      title: "Próximo da lista",
      text: "Novos mundos independentes poderão entrar na lista com regras e mods definidos por quem administra.",
      foot: "cadastro ainda não disponível",
    },
    footnoteBefore: "O servidor oficial está online. O REMANESCENTZ PREVALECE é o servidor Modded da comunidade e segue em desenvolvimento — acompanhe pelo ",
    footnoteLink: "Discord",
    footnoteAfter: ".",
  },
  project: {
    eyebrow: "quem somos",
    titleA: "Independente por escolha.",
    titleB: "Comunidade por princípio.",
    lead: "O SourceDayZ nasceu de jogadores que querem um mundo de sobrevivência sem concessões. Partimos da base do DayZ 0.45 para construir um projeto próprio — um mundo persistente e interativo, com servidores, regras e progressão geridos pela comunidade.",
    text: "Não somos a Bohemia Interactive, não falamos em nome dela e não temos qualquer vínculo oficial com a empresa. O que nos move é simples: sobrevivência sem atalhos pagos, regras claras e espaço para construir junto.",
    pillars: [
      { n: "01", title: "Independente de verdade", text: "Sem afiliação, endosso ou suporte da Bohemia Interactive. O projeto é mantido por jogadores." },
      { n: "02", title: "Sem pay-to-win", text: "Nenhuma vantagem é vendida. Equipamento, base e progressão se conquistam em jogo." },
      { n: "03", title: "Comunidade primeiro", text: "Regras, eventos e rumos do projeto são discutidos com quem realmente joga." },
    ],
    legal: "DayZ é uma marca da Bohemia Interactive. O SourceDayZ é um projeto de fãs, sem afiliação, endosso ou suporte da empresa.",
    photoTag: "chernarus · base 0.45 · 2014",
  },
  roadmap: {
    eyebrow: "antes do primeiro spawn",
    title: "O caminho até o acesso.",
    lead: "Sem datas prometidas. Cada etapa só avança quando estiver realmente pronta — e o aviso aparece primeiro nesta página.",
    steps: [
      { n: "01", title: "Fundação", text: "Cliente, mundo e a base do projeto funcionando.", status: "concluído" },
      { n: "02", title: "Servidores", text: "Servidor oficial online e servidor Modded da comunidade em desenvolvimento.", status: "em andamento" },
      { n: "03", title: "Acesso", text: "Contas gratuitas, vínculo com a Steam e acesso aberto a todos.", status: "aberto" },
      { n: "04", title: "Primeiro wipe", text: "Abertura pública e o começo da primeira temporada.", status: "a definir" },
    ],
  },
  faq: {
    eyebrow: "visitantes",
    title: "Perguntas de quem acabou de chegar.",
    lead: "O essencial para entender o projeto. O servidor oficial já está online; o servidor Modded da comunidade segue em desenvolvimento.",
    noteLabel: "acesso",
    noteTitle: "Conta de jogador · aberta",
    noteText: "Crie sua conta, vincule a Steam e jogue gratuitamente, sem mensalidade.",
    loginAnswerOnline: "Crie sua conta pelo botão Entrar, vincule a Steam e acompanhe o projeto em Minha conta. O acesso ao SourceDayZ é gratuito para todos e não exige assinatura ou pagamento. Sua conta fica no banco do projeto e funciona em qualquer dispositivo.",
    loginAnswerLocal: "Crie sua conta pelo botão Entrar, vincule a Steam e acompanhe o projeto em Minha conta. O acesso é gratuito para todos e não exige pagamento. Nesta versão, a conta fica no navegador; sincronização e vínculo oficial com a Steam chegam com o backend.",
    items: [
      { q: "O que é o SourceDayZ?", a: "Um projeto de sobrevivência independente ambientado em Chernarus, feito pela comunidade. O servidor oficial já está online, e o REMANESCENTZ PREVALECE é o servidor Modded da comunidade em desenvolvimento." },
      { q: "Preciso comprar DayZ para jogar?", a: "Não. O cliente é próprio do projeto e será distribuído por aqui quando o acesso abrir. Você não vai precisar comprar outro jogo para participar." },
      { q: "Quando os servidores abrem?", a: "O servidor oficial já está online. O servidor Modded REMANESCENTZ PREVALECE está em desenvolvimento; acompanhe os testes e avisos pelo Discord." },
      { q: "Como funciona o login?", a: "", useLoginAnswer: true },
      { q: "O projeto tem relação com a Bohemia Interactive?", a: "Nenhuma. O SourceDayZ é um projeto de fãs, sem afiliação, endosso ou suporte da Bohemia Interactive. DayZ é uma marca da Bohemia Interactive; este projeto tem identidade e operação próprias." },
      { q: "Posso divulgar meu servidor?", a: "Sim. Crie sua conta, cadastre seu servidor em Minha conta e envie para análise. O acesso ao SourceDayZ é gratuito para todos os jogadores." },
    ],
  },
  cta: {
    eyebrow: "o próximo wipe",
    titleA: "A próxima história em Chernarus",
    titleB: "pode ser a sua.",
    text: "O servidor oficial já está online. O servidor Modded da comunidade está em desenvolvimento — acompanhe as novidades pelo Discord.",
    create: "Criar conta",
    myAccount: "Minha conta",
    servers: "Ver servidores",
  },
  footer: {
    tagline: "Sobrevivência independente, feita pela comunidade.",
    account: "Minha conta",
    discord: "Discord ↗",
    legal: "Projeto de fãs, sem afiliação, endosso ou suporte da Bohemia Interactive. DayZ é uma marca da Bohemia Interactive.",
    credits: "Screenshots de DayZ 0.45: comunidade r/dayz.",
    rights: "© 2026 SourceDayZ.",
  },
};

const EN: LandingCopy = {
  nav: [
    { id: "inicio", label: "Home" },
    { id: "servidores", label: "Servers" },
    { id: "projeto", label: "Project" },
    { id: "roadmap", label: "Roadmap" },
    { id: "faq", label: "FAQ" },
  ],
  brandTag: "community project",
  enter: "Sign in",
  myAccount: "My account",
  free: "free",
  mobileLogin: "Sign in · create account",
  aria: {
    brand: "SourceDayZ — back to top",
    nav: "Main navigation",
    openMenu: "Open menu",
    features: "Project features",
    serverTabs: "Server types",
    footerNav: "Footer links",
    closeLogin: "Close sign in",
    heroPhoto: "A wooden house in Chernarus with a lit window at night",
    projectPhoto: "A group of survivors around a campfire in Chernarus",
  },
  hero: {
    eyebrow: "independent project · 2026",
    titleBefore: "Your story in ",
    titleEm: "Chernarus",
    titleAfter: " starts here.",
    sub: "SourceDayZ is a survival project built by the community, for the community. Not affiliated with Bohemia Interactive. Official servers are coming soon — and the community already has its first world in development.",
    ctaServers: "Explore the servers",
    ctaAccount: "Sign in",
    tags: ["persistent world", "no pay-to-win", "PC · standalone"],
    rail: [
      { label: "official server", value: "Online" },
      { label: "community server", value: "1 Modded in development" },
      { label: "player accounts", value: "Open" },
      { label: "first wipe", value: "To be announced" },
    ],
  },
  servers: {
    eyebrow: "where to play",
    title: "Choose your world.",
    lead: "The official server is online. REMANESCENTZ PREVALECE is the community's Modded server and remains in development.",
    tabOfficial: "Official servers",
    tabCommunity: "Community servers",
    tabCommunitySmall: "Modded · in development",
    official: {
      type: "official · no mods · regular",
      title: "SourceDayZ Official",
      text: "Online DayZ Oldschool 0.45 (2014) server, no mods, Regular difficulty.",
      ip: "3.143.228.170",
      statusOnline: "online",
      statusOffline: "offline",
      statusChecking: "checking",
      statusUnavailable: "unavailable",
      playersLabel: "players online",
      slotsLabel: "open slots",
      meta: ["DayZ Oldschool 0.45 · 2014", "No Mods", "Regular"],
      button: "Copy IP",
      copied: "IP copied",
    },
    officialGhost: {
      status: "coming soon",
      title: "Next official world",
      text: "The team will open new servers as the community grows. This list will be updated here, with no made-up dates.",
      foot: "awaiting rules and wipe definition",
    },
    community: {
      type: "community · modded · independent",
      title: "REMANESCENTZ PREVALECE",
      status: "active development",
      text: "The community's Modded server is in development. Follow tests and announcements on Discord.",
      members: "members",
      online: "online now",
      since: "Around since",
      date: "06/14/2025 · 17:51",
      join: "Join the Discord",
      note: "Permanent server invite",
    },
    communityGhost: {
      status: "coming soon",
      title: "Next on the list",
      text: "New independent worlds will be able to join the list with rules and mods defined by their owners.",
      foot: "registration not available yet",
    },
    footnoteBefore: "The official server is online. REMANESCENTZ PREVALECE is the community's Modded server in development — follow it on ",
    footnoteLink: "Discord",
    footnoteAfter: ".",
  },
  project: {
    eyebrow: "who we are",
    titleA: "Independent by choice.",
    titleB: "Community by principle.",
    lead: "SourceDayZ was born from players who want a survival world with no compromises. We started from the DayZ 0.45 base to build our own project — a persistent, interactive world with servers, rules and progression managed by the community.",
    text: "We are not Bohemia Interactive, we do not speak for them and we have no official ties to the company. What drives us is simple: survival without paid shortcuts, clear rules and room to build together.",
    pillars: [
      { n: "01", title: "Truly independent", text: "No affiliation, endorsement or support from Bohemia Interactive. The project is run by players." },
      { n: "02", title: "No pay-to-win", text: "No advantages are sold. Gear, bases and progression are earned in-game." },
      { n: "03", title: "Community first", text: "Rules, events and the project's direction are discussed with the people who actually play." },
    ],
    legal: "DayZ is a trademark of Bohemia Interactive. SourceDayZ is a fan project, not affiliated with, endorsed or supported by the company.",
    photoTag: "chernarus · 0.45 base · 2014",
  },
  roadmap: {
    eyebrow: "before the first spawn",
    title: "The road to access.",
    lead: "No promised dates. Each stage only moves forward when it is truly ready — and the news appears here first.",
    steps: [
      { n: "01", title: "Foundation", text: "Client, world and the project's base working.", status: "completed" },
      { n: "02", title: "Servers", text: "Official server online; community Modded server in development.", status: "in progress" },
      { n: "03", title: "Access", text: "Free accounts, Steam linking and access open to everyone.", status: "open" },
      { n: "04", title: "First wipe", text: "Public opening and the start of the first season.", status: "to be announced" },
    ],
  },
  faq: {
    eyebrow: "visitors",
    title: "Questions from newcomers.",
    lead: "The essentials to understand the project. The official server is online; the community Modded server is in development.",
    noteLabel: "access",
    noteTitle: "Player account · open",
    noteText: "Create your account, link Steam and play for free. No monthly fee.",
    loginAnswerOnline: "Create an account with the Sign in button, link Steam and follow the project in My account. SourceDayZ access is free for everyone; no subscription or payment is required. Your account lives in the project database and works on any device.",
    loginAnswerLocal: "Create an account with the Sign in button, link Steam and follow the project in My account. Access is free for everyone; no payment is required. In this version, the account stays in your browser; sync and official Steam linking come with the backend.",
    items: [
      { q: "What is SourceDayZ?", a: "A community-built independent survival project set in Chernarus. The official server is online, and REMANESCENTZ PREVALECE is the community's Modded server in development." },
      { q: "Do I need to buy DayZ to play?", a: "No. The client belongs to the project and will be distributed here when access opens. You will not need to buy another game to take part." },
      { q: "When do the servers open?", a: "The official server is already online. The REMANESCENTZ PREVALECE community Modded server is in development; follow testing and announcements on Discord." },
      { q: "How does login work?", a: "", useLoginAnswer: true },
      { q: "Is the project related to Bohemia Interactive?", a: "No. SourceDayZ is a fan project, not affiliated with, endorsed or supported by Bohemia Interactive. DayZ is a trademark of Bohemia Interactive; this project has its own identity and operation." },
      { q: "Can I promote my server?", a: "Yes. Create an account, add your server in My account and submit it for review. SourceDayZ access is free for all players." },
    ],
  },
  cta: {
    eyebrow: "the next wipe",
    titleA: "The next story in Chernarus",
    titleB: "could be yours.",
    text: "The official server is online. The community's Modded server is in development — follow updates on Discord.",
    create: "Create account",
    myAccount: "My account",
    servers: "View servers",
  },
  footer: {
    tagline: "Independent survival, built by the community.",
    account: "My account",
    discord: "Discord ↗",
    legal: "Fan project, not affiliated with, endorsed or supported by Bohemia Interactive. DayZ is a trademark of Bohemia Interactive.",
    credits: "DayZ 0.45 screenshots: r/dayz community.",
    rights: "© 2026 SourceDayZ.",
  },
};

const RU: LandingCopy = {
  nav: [
    { id: "inicio", label: "Главная" },
    { id: "servidores", label: "Серверы" },
    { id: "projeto", label: "Проект" },
    { id: "roadmap", label: "План" },
    { id: "faq", label: "FAQ" },
  ],
  brandTag: "проект сообщества",
  enter: "Войти",
  myAccount: "Моя учётная запись",
  free: "бесплатно",
  mobileLogin: "Войти · создать аккаунт",
  aria: {
    brand: "SourceDayZ — наверх",
    nav: "Основная навигация",
    openMenu: "Открыть меню",
    features: "Особенности проекта",
    serverTabs: "Типы серверов",
    footerNav: "Ссылки в подвале",
    closeLogin: "Закрыть вход",
    heroPhoto: "Деревянный дом в Чернаруси со светящимся окном ночью",
    projectPhoto: "Группа выживших у костра в Чернаруси",
  },
  hero: {
    eyebrow: "независимый проект · 2026",
    titleBefore: "Ваша история в ",
    titleEm: "Чернаруси",
    titleAfter: " начинается здесь.",
    sub: "SourceDayZ — survival-проект, созданный сообществом. Официальный сервер уже онлайн; Modded-сервер сообщества продолжает разрабатываться. Мы не связаны с Bohemia Interactive.",
    ctaServers: "Посмотреть серверы",
    ctaAccount: "Войти",
    tags: ["постоянный мир", "без pay-to-win", "ПК · standalone"],
    rail: [
      { label: "официальный сервер", value: "Онлайн" },
      { label: "сервер сообщества", value: "1 Modded в разработке" },
      { label: "аккаунты игроков", value: "Открыты" },
      { label: "первый вайп", value: "Будет объявлен" },
    ],
  },
  servers: {
    eyebrow: "где играть",
    title: "Выберите свой мир.",
    lead: "Официальный сервер уже онлайн. REMANESCENTZ PREVALECE — это Modded-сервер сообщества, который продолжает разрабатываться.",
    tabOfficial: "Официальные серверы",
    tabCommunity: "Серверы сообщества",
    tabCommunitySmall: "Modded · в разработке",
    official: {
      type: "официальный · без модов · regular",
      title: "SourceDayZ Official",
      text: "Онлайн-сервер DayZ Oldschool 0.45 (2014), без модов, сложность Regular.",
      ip: "3.143.228.170",
      statusOnline: "онлайн",
      statusOffline: "офлайн",
      statusChecking: "проверка",
      statusUnavailable: "недоступен",
      playersLabel: "игроки онлайн",
      slotsLabel: "свободные места",
      meta: ["DayZ Oldschool 0.45 · 2014", "Без модов", "Regular"],
      button: "Скопировать IP",
      copied: "IP скопирован",
    },
    officialGhost: {
      status: "скоро",
      title: "Следующий официальный мир",
      text: "Команда будет открывать новые серверы по мере роста сообщества. Список будет обновляться здесь, без выдуманных дат.",
      foot: "ожидаем определения правил и вайпа",
    },
    community: {
      type: "сообщество · modded · независимый",
      title: "REMANESCENTZ PREVALECE",
      status: "активная разработка",
      text: "Modded-сервер сообщества находится в разработке. Следите за тестами и объявлениями в Discord.",
      members: "участников",
      online: "онлайн сейчас",
      since: "Существует с",
      date: "14.06.2025 · 17:51",
      join: "Войти в Discord",
      note: "Постоянное приглашение сервера",
    },
    communityGhost: {
      status: "скоро",
      title: "Следующий в списке",
      text: "Новые независимые миры смогут попасть в список с правилами и модами, определёнными их владельцами.",
      foot: "регистрация пока недоступна",
    },
    footnoteBefore: "Официальный сервер онлайн. REMANESCENTZ PREVALECE — Modded-сервер сообщества в разработке; следите в ",
    footnoteLink: "Discord",
    footnoteAfter: ".",
  },
  project: {
    eyebrow: "кто мы",
    titleA: "Независимые по выбору.",
    titleB: "Сообщество по принципу.",
    lead: "SourceDayZ родился из игроков, которые хотят мир выживания без компромиссов. Мы взяли за основу DayZ 0.45, чтобы построить собственный проект — постоянный и интерактивный мир с серверами, правилами и прогрессией, которыми управляет сообщество.",
    text: "Мы не Bohemia Interactive, не говорим от её имени и не имеем официальных связей с компанией. Нами движет простое: выживание без платных преимуществ, понятные правила и возможность строить вместе.",
    pillars: [
      { n: "01", title: "По-настоящему независимые", text: "Без связи с Bohemia Interactive, без её поддержки и одобрения. Проект держится на игроках." },
      { n: "02", title: "Без pay-to-win", text: "Преимущества не продаются. Снаряжение, базы и прогресс добываются в игре." },
      { n: "03", title: "Сообщество прежде всего", text: "Правила, события и направление проекта обсуждаются с теми, кто действительно играет." },
    ],
    legal: "DayZ — торговая марка Bohemia Interactive. SourceDayZ — фанатский проект, не связанный с компанией, не поддерживаемый и не одобренный ею.",
    photoTag: "чернарусь · база 0.45 · 2014",
  },
  roadmap: {
    eyebrow: "перед первым спавном",
    title: "Путь к доступу.",
    lead: "Без обещанных дат. Каждый этап движется дальше только когда действительно готов — и новости появляются здесь первыми.",
    steps: [
      { n: "01", title: "Основа", text: "Клиент, мир и база проекта работают.", status: "завершено" },
      { n: "02", title: "Серверы", text: "Официальный сервер онлайн; Modded-сервер сообщества в разработке.", status: "в процессе" },
      { n: "03", title: "Доступ", text: "Бесплатные аккаунты, привязка Steam и доступ для всех.", status: "открыто" },
      { n: "04", title: "Первый вайп", text: "Публичное открытие и начало первого сезона.", status: "будет объявлено" },
    ],
  },
  faq: {
    eyebrow: "посетителям",
    title: "Вопросы тех, кто только пришёл.",
    lead: "Самое важное о проекте. Официальный сервер уже онлайн; Modded-сервер сообщества находится в разработке.",
    noteLabel: "доступ",
    noteTitle: "Аккаунт игрока · открыт",
    noteText: "Создайте аккаунт, привяжите Steam и играйте бесплатно — без ежемесячной платы.",
    loginAnswerOnline: "Создайте аккаунт кнопкой «Войти», привяжите Steam и следите за проектом в «Моей учётной записи». Доступ к SourceDayZ бесплатен для всех и не требует подписки или оплаты. Аккаунт хранится в базе проекта и работает на любом устройстве.",
    loginAnswerLocal: "Создайте аккаунт кнопкой «Войти», привяжите Steam и следите за проектом в «Моей учётной записи». Доступ бесплатен для всех, оплата не требуется. В этой версии аккаунт хранится в браузере; синхронизация и официальная привязка Steam появятся с backend.",
    items: [
      { q: "Что такое SourceDayZ?", a: "Независимый survival-проект, созданный сообществом в Чернаруси. Официальный сервер уже онлайн, а REMANESCENTZ PREVALECE — Modded-сервер сообщества в разработке." },
      { q: "Нужно ли покупать DayZ, чтобы играть?", a: "Нет. Клиент принадлежит проекту и будет распространяться здесь, когда откроется доступ. Вам не нужно покупать другую игру." },
      { q: "Когда откроются серверы?", a: "Официальный сервер уже онлайн. REMANESCENTZ PREVALECE, Modded-сервер сообщества, находится в разработке; следите за тестами и объявлениями в Discord." },
      { q: "Как работает вход?", a: "", useLoginAnswer: true },
      { q: "Проект связан с Bohemia Interactive?", a: "Нет. SourceDayZ — фанатский проект, не связанный с Bohemia Interactive, не поддерживаемый и не одобренный ею. DayZ — торговая марка Bohemia Interactive; у проекта своя идентичность и управление." },
      { q: "Могу ли я продвигать свой сервер?", a: "Да. Создайте аккаунт, добавьте сервер в «Моей учётной записи» и отправьте его на проверку. Доступ к SourceDayZ бесплатен для всех игроков." },
    ],
  },
  cta: {
    eyebrow: "следующий вайп",
    titleA: "Следующая история в Чернаруси",
    titleB: "может быть вашей.",
    text: "Официальный сервер онлайн. Modded-сервер сообщества находится в разработке — следите за новостями в Discord.",
    create: "Создать аккаунт",
    myAccount: "Моя учётная запись",
    servers: "Посмотреть серверы",
  },
  footer: {
    tagline: "Независимое выживание, созданное сообществом.",
    account: "Моя учётная запись",
    discord: "Discord ↗",
    legal: "Фанатский проект, не связанный с Bohemia Interactive, не поддерживаемый и не одобренный ею. DayZ — торговая марка Bohemia Interactive.",
    credits: "Скриншоты DayZ 0.45: сообщество r/dayz.",
    rights: "© 2026 SourceDayZ.",
  },
};

export const LANDING_COPY: Record<Locale, LandingCopy> = { pt: PT, en: EN, ru: RU };
