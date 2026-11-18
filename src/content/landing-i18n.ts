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
    tabOfficialSmall: string;
    tabCommunity: string;
    tabCommunitySmall: string;
    official: {
      type: string;
      title: string;
      text: string;
      meta: string[];
      button: string;
    };
    officialGhost: {
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
    sub: "SourceDayZ é um projeto de sobrevivência feito pela comunidade, para a comunidade. Sem vínculo com a Bohemia Interactive. Servidores oficiais chegam em breve — e a comunidade já tem seu primeiro mundo em desenvolvimento.",
    ctaServers: "Conhecer os servidores",
    ctaAccount: "Entrar",
    tags: ["mundo persistente", "sem pay-to-win", "PC · standalone"],
    rail: [
      { label: "servidores oficiais", value: "Em breve" },
      { label: "servidores da comunidade", value: "1 em desenvolvimento" },
      { label: "contas de jogador", value: "Abertas" },
      { label: "primeiro wipe", value: "A definir" },
    ],
  },
  servers: {
    eyebrow: "onde jogar",
    title: "Escolha o seu mundo.",
    lead: "Os servidores oficiais são mantidos pela equipe do projeto e ainda não abriram. A lista da comunidade já tem seu primeiro projeto em desenvolvimento ativo.",
    tabOfficial: "Servidores oficiais",
    tabOfficialSmall: "em breve",
    tabCommunity: "Servidores da comunidade",
    tabCommunitySmall: "1 em desenvolvimento",
    official: {
      type: "oficial · chernarus",
      title: "Servidor principal",
      text: "O primeiro mundo do SourceDayZ. Regras, wipe e janela de acesso serão anunciados antes da abertura.",
      meta: ["PvP + PvE", "Progressão persistente", "Hospedagem do projeto"],
      button: "Entrar · em breve",
    },
    officialGhost: {
      title: "Próximo mundo oficial",
      text: "A equipe vai abrir novos servidores conforme a comunidade crescer. Esta lista será atualizada aqui, sem datas inventadas.",
      foot: "aguardando definição de regras e wipe",
    },
    community: {
      type: "comunidade · dayz · independente",
      title: "REMANESCENT Z",
      status: "em desenvolvimento ativo",
      text: "Servidor de DayZ da comunidade em desenvolvimento ativo. Testes, avisos e a abertura acontecem no Discord do servidor.",
      members: "membros",
      online: "online agora",
      since: "Existe desde",
      date: "14/06/2025 · 17:51",
      join: "Entrar no Discord",
      note: "Convite permanente do servidor",
    },
    communityGhost: {
      title: "Próximo da lista",
      text: "Novos mundos independentes poderão entrar na lista com regras e mods definidos por quem administra.",
      foot: "cadastro ainda não disponível",
    },
    footnoteBefore: "Servidores oficiais ainda não estão online. O REMANESCENT Z está em desenvolvimento ativo — acompanhe pelo ",
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
      { n: "02", title: "Servidores", text: "Mundos oficiais e a lista da comunidade.", status: "em andamento" },
      { n: "03", title: "Acesso", text: "Contas, vínculo com a Steam e acesso mensal de R$ 25.", status: "beta" },
      { n: "04", title: "Primeiro wipe", text: "Abertura pública e o começo da primeira temporada.", status: "a definir" },
    ],
  },
  faq: {
    eyebrow: "visitantes",
    title: "Perguntas de quem acabou de chegar.",
    lead: "O essencial para entender o projeto antes de entrar no mundo. O login e os servidores ainda estão em preparação.",
    noteLabel: "acesso",
    noteTitle: "Conta de jogador · aberta",
    noteText: "Crie sua conta, vincule a Steam e veja o plano de R$ 25/mês.",
    loginAnswerOnline: "Crie a conta pelo botão Entrar: você define a foto, vincula a Steam e acompanha o acesso em Minha conta. O acesso mensal custa R$ 25; quem abre um servidor ativo ganha acesso vitalício enquanto ele estiver ativo, e os 20 primeiros jogadores do servidor ganham 1 mês grátis. Sua conta fica no banco do projeto e funciona em qualquer dispositivo. A verificação oficial com a Steam e o pagamento real entram nas próximas etapas.",
    loginAnswerLocal: "Crie a conta pelo botão Entrar: você define a foto, vincula a Steam e acompanha o acesso em Minha conta. O acesso mensal custa R$ 25; quem abre um servidor ativo ganha acesso vitalício enquanto ele estiver ativo, e os 20 primeiros jogadores do servidor ganham 1 mês grátis. Nesta versão a conta fica no navegador — a sincronização, o vínculo oficial com a Steam e o pagamento entram com o backend.",
    items: [
      { q: "O que é o SourceDayZ?", a: "Um projeto de sobrevivência independente ambientado em Chernarus, feito pela comunidade. Os servidores oficiais estão em preparação e a lista da comunidade já começou com o REMANESCENT Z, com progressão persistente e regras claras." },
      { q: "Preciso comprar DayZ para jogar?", a: "Não. O cliente é próprio do projeto e será distribuído por aqui quando o acesso abrir. Você não vai precisar comprar outro jogo para participar." },
      { q: "Quando os servidores abrem?", a: "Ainda não há data para os servidores oficiais. O REMANESCENT Z, primeiro projeto da comunidade, está em desenvolvimento ativo e divulga testes e avisos no Discord. Preferimos não prometer uma data antes de o acesso estar realmente pronto." },
      { q: "Como funciona o login?", a: "", useLoginAnswer: true },
      { q: "O projeto tem relação com a Bohemia Interactive?", a: "Nenhuma. O SourceDayZ é um projeto de fãs, sem afiliação, endosso ou suporte da Bohemia Interactive. DayZ é uma marca da Bohemia Interactive; este projeto tem identidade e operação próprias." },
      { q: "Posso divulgar meu servidor?", a: "Sim. Crie sua conta, abra o servidor em Minha conta e compartilhe o código com os primeiros jogadores: cada um ganha 1 mês grátis, até o limite de 20. O dono tem acesso vitalício enquanto o servidor estiver ativo. A abertura passa por análise." },
    ],
  },
  cta: {
    eyebrow: "o próximo wipe",
    titleA: "A próxima história em Chernarus",
    titleB: "pode ser a sua.",
    text: "Os servidores oficiais chegam em breve. O primeiro mundo da comunidade já está em desenvolvimento — e o acesso será liberado por aqui, sem depender da Bohemia Interactive.",
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
      { label: "official servers", value: "Coming soon" },
      { label: "community servers", value: "1 in development" },
      { label: "player accounts", value: "Open" },
      { label: "first wipe", value: "To be announced" },
    ],
  },
  servers: {
    eyebrow: "where to play",
    title: "Choose your world.",
    lead: "Official servers are run by the project team and have not opened yet. The community list already has its first project in active development.",
    tabOfficial: "Official servers",
    tabOfficialSmall: "coming soon",
    tabCommunity: "Community servers",
    tabCommunitySmall: "1 in development",
    official: {
      type: "official · chernarus",
      title: "Main server",
      text: "The first SourceDayZ world. Rules, wipe and the access window will be announced before opening.",
      meta: ["PvP + PvE", "Persistent progression", "Project-hosted"],
      button: "Join · coming soon",
    },
    officialGhost: {
      title: "Next official world",
      text: "The team will open new servers as the community grows. This list will be updated here, with no made-up dates.",
      foot: "awaiting rules and wipe definition",
    },
    community: {
      type: "community · dayz · independent",
      title: "REMANESCENT Z",
      status: "active development",
      text: "A community DayZ server in active development. Tests, announcements and the opening happen on the server's Discord.",
      members: "members",
      online: "online now",
      since: "Around since",
      date: "06/14/2025 · 17:51",
      join: "Join the Discord",
      note: "Permanent server invite",
    },
    communityGhost: {
      title: "Next on the list",
      text: "New independent worlds will be able to join the list with rules and mods defined by their owners.",
      foot: "registration not available yet",
    },
    footnoteBefore: "Official servers are not online yet. REMANESCENT Z is in active development — follow it on ",
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
      { n: "02", title: "Servers", text: "Official worlds and the community list.", status: "in progress" },
      { n: "03", title: "Access", text: "Accounts, Steam linking and R$ 25 monthly access.", status: "beta" },
      { n: "04", title: "First wipe", text: "Public opening and the start of the first season.", status: "to be announced" },
    ],
  },
  faq: {
    eyebrow: "visitors",
    title: "Questions from newcomers.",
    lead: "The essentials to understand the project before entering the world. Login and servers are still being prepared.",
    noteLabel: "access",
    noteTitle: "Player account · open",
    noteText: "Create your account, link Steam and see the R$ 25/month plan.",
    loginAnswerOnline: "Create an account with the Sign in button: set your photo, link Steam and follow your access in My account. Monthly access costs R$ 25; anyone who opens an active server gets lifetime access while it is active, and the first 20 players of the server get 1 month free. Your account lives in the project database and works on any device. Official Steam verification and real payment come in the next stages.",
    loginAnswerLocal: "Create an account with the Sign in button: set your photo, link Steam and follow your access in My account. Monthly access costs R$ 25; anyone who opens an active server gets lifetime access while it is active, and the first 20 players of the server get 1 month free. In this version the account lives in your browser — sync, official Steam linking and payment arrive with the backend.",
    items: [
      { q: "What is SourceDayZ?", a: "A community-built independent survival project set in Chernarus. Official servers are being prepared and the community list has already started with REMANESCENT Z, with persistent progression and clear rules." },
      { q: "Do I need to buy DayZ to play?", a: "No. The client belongs to the project and will be distributed here when access opens. You will not need to buy another game to take part." },
      { q: "When do the servers open?", a: "There is no date for the official servers yet. REMANESCENT Z, the first community project, is in active development and posts tests and announcements on Discord. We prefer not to promise a date before access is truly ready." },
      { q: "How does login work?", a: "", useLoginAnswer: true },
      { q: "Is the project related to Bohemia Interactive?", a: "No. SourceDayZ is a fan project, not affiliated with, endorsed or supported by Bohemia Interactive. DayZ is a trademark of Bohemia Interactive; this project has its own identity and operation." },
      { q: "Can I promote my server?", a: "Yes. Create your account, open the server in My account and share the code with the first players: each gets 1 month free, up to 20. The owner has lifetime access while the server is active. Opening goes through review." },
    ],
  },
  cta: {
    eyebrow: "the next wipe",
    titleA: "The next story in Chernarus",
    titleB: "could be yours.",
    text: "Official servers are coming soon. The first community world is already in development — and access will be released here, without depending on Bohemia Interactive.",
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
    sub: "SourceDayZ — survival-проект, созданный сообществом для сообщества. Мы не связаны с Bohemia Interactive. Официальные серверы скоро появятся, а у сообщества уже есть первый мир в разработке.",
    ctaServers: "Посмотреть серверы",
    ctaAccount: "Войти",
    tags: ["постоянный мир", "без pay-to-win", "ПК · standalone"],
    rail: [
      { label: "официальные серверы", value: "Скоро" },
      { label: "серверы сообщества", value: "1 в разработке" },
      { label: "аккаунты игроков", value: "Открыты" },
      { label: "первый вайп", value: "Будет объявлен" },
    ],
  },
  servers: {
    eyebrow: "где играть",
    title: "Выберите свой мир.",
    lead: "Официальные серверы поддерживаются командой проекта и ещё не открыты. В списке сообщества уже есть первый проект в активной разработке.",
    tabOfficial: "Официальные серверы",
    tabOfficialSmall: "скоро",
    tabCommunity: "Серверы сообщества",
    tabCommunitySmall: "1 в разработке",
    official: {
      type: "официальный · чернарусь",
      title: "Основной сервер",
      text: "Первый мир SourceDayZ. Правила, вайп и окно доступа будут объявлены до открытия.",
      meta: ["PvP + PvE", "Постоянная прогрессия", "Хостинг проекта"],
      button: "Войти · скоро",
    },
    officialGhost: {
      title: "Следующий официальный мир",
      text: "Команда будет открывать новые серверы по мере роста сообщества. Список будет обновляться здесь, без выдуманных дат.",
      foot: "ожидаем определения правил и вайпа",
    },
    community: {
      type: "сообщество · dayz · независимый",
      title: "REMANESCENT Z",
      status: "активная разработка",
      text: "DayZ-сервер сообщества в активной разработке. Тесты, объявления и открытие проходят в Discord сервера.",
      members: "участников",
      online: "онлайн сейчас",
      since: "Существует с",
      date: "14.06.2025 · 17:51",
      join: "Войти в Discord",
      note: "Постоянное приглашение сервера",
    },
    communityGhost: {
      title: "Следующий в списке",
      text: "Новые независимые миры смогут попасть в список с правилами и модами, определёнными их владельцами.",
      foot: "регистрация пока недоступна",
    },
    footnoteBefore: "Официальные серверы ещё не онлайн. REMANESCENT Z в активной разработке — следите в ",
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
      { n: "02", title: "Серверы", text: "Официальные миры и список сообщества.", status: "в процессе" },
      { n: "03", title: "Доступ", text: "Аккаунты, привязка Steam и месячный доступ за R$ 25.", status: "бета" },
      { n: "04", title: "Первый вайп", text: "Публичное открытие и начало первого сезона.", status: "будет объявлено" },
    ],
  },
  faq: {
    eyebrow: "посетителям",
    title: "Вопросы тех, кто только пришёл.",
    lead: "Самое важное, чтобы понять проект до входа в мир. Вход и серверы ещё готовятся.",
    noteLabel: "доступ",
    noteTitle: "Аккаунт игрока · открыт",
    noteText: "Создайте аккаунт, привяжите Steam и посмотрите план за R$ 25/мес.",
    loginAnswerOnline: "Создайте аккаунт кнопкой «Войти»: задайте фото, привяжите Steam и следите за доступом в «Моей учётной записи». Месячный доступ стоит R$ 25; владелец активного сервера получает пожизненный доступ, пока сервер активен, а первые 20 игроков сервера — 1 месяц бесплатно. Аккаунт хранится в базе проекта и работает на любом устройстве. Официальная проверка Steam и реальная оплата появятся на следующих этапах.",
    loginAnswerLocal: "Создайте аккаунт кнопкой «Войти»: задайте фото, привяжите Steam и следите за доступом в «Моей учётной записи». Месячный доступ стоит R$ 25; владелец активного сервера получает пожизненный доступ, пока сервер активен, а первые 20 игроков сервера — 1 месяц бесплатно. В этой версии аккаунт хранится в браузере — синхронизация, официальная привязка Steam и оплата появятся с backend.",
    items: [
      { q: "Что такое SourceDayZ?", a: "Независимый survival-проект, созданный сообществом в Чернаруси. Официальные серверы готовятся, а список сообщества уже начался с REMANESCENT Z — с постоянной прогрессией и понятными правилами." },
      { q: "Нужно ли покупать DayZ, чтобы играть?", a: "Нет. Клиент принадлежит проекту и будет распространяться здесь, когда откроется доступ. Вам не нужно покупать другую игру." },
      { q: "Когда откроются серверы?", a: "Даты официальных серверов пока нет. REMANESCENT Z, первый проект сообщества, активно разрабатывается; тесты и объявления — в Discord. Мы не хотим обещать дату, пока доступ действительно не будет готов." },
      { q: "Как работает вход?", a: "", useLoginAnswer: true },
      { q: "Проект связан с Bohemia Interactive?", a: "Нет. SourceDayZ — фанатский проект, не связанный с Bohemia Interactive, не поддерживаемый и не одобренный ею. DayZ — торговая марка Bohemia Interactive; у проекта своя идентичность и управление." },
      { q: "Могу ли я продвигать свой сервер?", a: "Да. Создайте аккаунт, откройте сервер в «Моей учётной записи» и поделитесь кодом с первыми игроками: каждый получит 1 месяц бесплатно, до 20 человек. Владелец имеет пожизненный доступ, пока сервер активен. Открытие проходит проверку." },
    ],
  },
  cta: {
    eyebrow: "следующий вайп",
    titleA: "Следующая история в Чернаруси",
    titleB: "может быть вашей.",
    text: "Официальные серверы скоро появятся. Первый мир сообщества уже в разработке — доступ будет открыт здесь, без зависимости от Bohemia Interactive.",
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
