import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { AuthPanel } from "../components/AuthPanel";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLocale } from "../lib/i18n";
import { ACCOUNT_SHELL_COPY } from "../content/account-i18n";
import {
  USING_SUPABASE,
  clearSteamProfile,
  changeAccountPassword,
  createServer,
  formatDate,
  getAccess,
  getOwnedServer,
  initials,
  logoutAccount,
  resetAccountData,
  saveSteamProfile,
  serverStatusLabel,
  setServerStatus,
  startSteamOpenId,
  updateAccountProfile,
  updateSteamName,
  useAccountStore,
  useCurrentAccount,
  type Account,
  type AccessInfo,
  type HostedServer,
} from "../lib/accounts";
import {
  createSteamProfile,
  enrichSteamProfile,
  parseSteamTarget,
  steamPrivacyLabel,
} from "../lib/steam";
import { navigate } from "../lib/router";

const DISCORD_URL = "https://discord.gg/4yvv6KrxwD";

type NoticeTone = "ok" | "bad" | "warn";
type Notice = { tone: NoticeTone; text: string };
type Notify = (notice: Notice) => void;

const REGIOES = [
  "América do Sul",
  "América do Norte",
  "Europa",
  "Ásia",
  "Oceania",
  "Outra",
];

function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Esse arquivo não é uma imagem válida."));
      image.onload = () => {
        const side = 320;
        const canvas = document.createElement("canvas");
        canvas.width = side;
        canvas.height = side;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        const scale = Math.max(side / image.width, side / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (side - width) / 2, (side - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function AvatarView({
  nome,
  src,
  size = 88,
}: {
  nome: string;
  src: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <span className="acc-avatar" style={{ width: size, height: size }}>
      {src && !broken ? (
        <img
          src={src}
          alt={`Foto de ${nome}`}
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">{initials(nome)}</span>
      )}
    </span>
  );
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  return (
    <div className={`acc-notice ${notice.tone}`} role="status">
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso">
        ×
      </button>
    </div>
  );
}

function steamReturnNotice(status: string, motivo: string): Notice {
  if (status === "ok") {
    return { tone: "ok", text: "Steam verificada com sucesso." };
  }

  const messages: Record<string, string> = {
    state: "A verificação expirou. Clique em “Verificar com Steam” de novo.",
    cancelado: "A verificação foi cancelada na Steam.",
    openid: "A Steam não confirmou este vínculo. Tente de novo.",
    em_uso: "Esta conta Steam já está vinculada a outro jogador.",
    save: "A Steam confirmou, mas não foi possível salvar. Tente de novo.",
  };

  return {
    tone: "bad",
    text: messages[motivo] ?? "Não foi possível verificar a Steam. Tente de novo.",
  };
}

function AccountHeader({ account }: { account: Account }) {
  const { locale } = useLocale();
  const copy = ACCOUNT_SHELL_COPY[locale].header;

  function irParaSite(id: string) {
    navigate("");
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <header className="acc-top">
      <button
        className="sd-brand"
        onClick={() => navigate("")}
        aria-label="SourceDayZ — voltar ao site"
      >
        <span className="sd-mark">SD</span>
        <span className="sd-brand-text">
          <strong>SOURCEDAYZ</strong>
          <small>{copy.brandTag}</small>
        </span>
      </button>

      <nav className="acc-nav" aria-label={copy.accountNav}>
        <button type="button" onClick={() => navigate("")}>
          {copy.home}
        </button>
        <button type="button" onClick={() => irParaSite("servidores")}>
          {copy.servers}
        </button>
        <button type="button" onClick={() => irParaSite("faq")}>
          {copy.faq}
        </button>
        {(account.isDev || account.isAdmin) && (
          <button
            className="acc-nav-dev"
            type="button"
            onClick={() => navigate("documento")}
          >
            {copy.docs}
          </button>
        )}
        {account.isAdmin && (
          <button
            className="acc-nav-admin"
            type="button"
            onClick={() => navigate("admin")}
          >
            {copy.admin}
          </button>
        )}
        <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener">
          Discord ↗
        </a>
      </nav>

      <div className="acc-top-actions">
        <LanguageSwitcher compact />
        <span className="acc-top-user">
          <AvatarView
            nome={account.nome}
            src={account.avatar ?? account.steam?.avatar ?? null}
            size={30}
          />
          <strong>{account.nome}</strong>
        </span>
        <button
          className="sd-login"
          type="button"
          onClick={async () => {
            await logoutAccount();
            navigate("");
          }}
        >
          {copy.signOut}
        </button>
      </div>
    </header>
  );
}

function ContaLoading() {
  const { locale } = useLocale();
  const copy = ACCOUNT_SHELL_COPY[locale].loading;
  return (
    <div className="sd acc">
      <main className="acc-gate acc-gate-loading">
        <section className="acc-gate-copy">
          <p className="sd-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="acc-gate-lead">{copy.text}</p>
        </section>
      </main>
    </div>
  );
}

function ContaGate({ error }: { error?: string | null }) {
  const { locale } = useLocale();
  const copy = ACCOUNT_SHELL_COPY[locale].gate;
  return (
    <div className="sd acc">
      <header className="acc-top acc-top-gate">
        <button className="sd-brand" onClick={() => navigate("")}>
          <span className="sd-mark">SD</span>
          <span className="sd-brand-text">
            <strong>SOURCEDAYZ</strong>
            <small>{copy.brandTag}</small>
          </span>
        </button>
        <LanguageSwitcher compact />
        <button className="sd-btn ghost acc-back" type="button" onClick={() => navigate("")}>
          {copy.back}
        </button>
      </header>

      <main className="acc-gate">
        <section className="acc-gate-copy">
          <p className="sd-eyebrow">{copy.eyebrow}</p>
          <h1>
            {copy.titleA}
            <br />
            {copy.titleB}
          </h1>
          <p className="acc-gate-lead">{copy.lead}</p>

          <ul className="acc-gate-list">
            {copy.bullets.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="acc-gate-note">
            {USING_SUPABASE ? copy.noteOnline : copy.noteLocal}
          </p>
        </section>

        <section className="acc-gate-card" aria-label={copy.aria}>
          {error && (
            <p className="acc-inline-error" role="alert">
              {error}
            </p>
          )}
          <AuthPanel initialMode="entrar" />
        </section>
      </main>
    </div>
  );
}

function ProfileCard({ account, onNotice }: { account: Account; onNotice: Notify }) {
  const [nome, setNome] = useState(account.nome);
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNome(account.nome);
  }, [account.nome]);

  async function escolherFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onNotice({ tone: "bad", text: "Escolha um arquivo JPG, PNG ou WebP." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onNotice({ tone: "bad", text: "A imagem pode ter no máximo 8 MB." });
      return;
    }
    try {
      const dataUrl = await fileToAvatar(file);
      const result = await updateAccountProfile(account.id, { avatar: dataUrl });
      onNotice(
        result.ok
          ? { tone: "ok", text: "Foto de perfil atualizada." }
          : { tone: "bad", text: result.error },
      );
    } catch (error) {
      onNotice({
        tone: "bad",
        text: error instanceof Error ? error.message : "Não foi possível usar essa imagem.",
      });
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    try {
      const result = await updateAccountProfile(account.id, { nome });
      onNotice(
        result.ok
          ? { tone: "ok", text: "Perfil atualizado." }
          : { tone: "bad", text: result.error },
      );
    } finally {
      setSalvando(false);
    }
  }

  async function removerFoto() {
    const result = await updateAccountProfile(account.id, { avatar: null });
    if (result.ok) onNotice({ tone: "ok", text: "Foto removida. A inicial do nome volta a aparecer." });
    else onNotice({ tone: "bad", text: result.error });
  }

  const avatarSrc = account.avatar ?? account.steam?.avatar ?? null;

  return (
    <section className="acc-card" id="perfil">
      <div className="acc-card-head">
        <div>
          <p className="acc-kicker">identidade</p>
          <h2>Perfil</h2>
        </div>
        <span className="acc-card-tag">foto e nome</span>
      </div>

      <div className="acc-profile-row">
        <AvatarView nome={account.nome} src={avatarSrc} size={88} />
        <div className="acc-profile-actions">
          <button
            className="sd-btn"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            Trocar foto
          </button>
          {account.avatar && (
            <button className="acc-linkbtn" type="button" onClick={removerFoto}>
              Remover
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={escolherFoto}
            hidden
          />
          <small>JPG, PNG ou WebP · recorte quadrado de 320 px.</small>
        </div>
      </div>

      <form className="acc-form" onSubmit={salvar}>
        <label className="sd-field">
          <span>Nome no site</span>
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            maxLength={40}
            required
          />
        </label>
        <label className="sd-field">
          <span>E-mail</span>
          <input type="email" value={account.email} readOnly />
        </label>
        <div className="acc-form-foot">
          <button
            className="sd-btn primary"
            type="submit"
            disabled={salvando || nome.trim() === account.nome}
          >
            {salvando ? "Salvando…" : "Salvar perfil"}
          </button>
          <small>
            Conta criada em {formatDate(account.criadoEm)} · último acesso{" "}
            {formatDateTime(account.ultimoLogin)}
          </small>
        </div>
      </form>
    </section>
  );
}

function SecurityCard({ onNotice }: { onNotice: Notify }) {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!USING_SUPABASE) return null;

  async function trocar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (senha !== confirmar) {
      onNotice({ tone: "bad", text: "As senhas não conferem." });
      return;
    }

    setSalvando(true);
    const result = await changeAccountPassword(senha);
    setSalvando(false);

    if (!result.ok) {
      onNotice({ tone: "bad", text: result.error });
      return;
    }

    setSenha("");
    setConfirmar("");
    onNotice({ tone: "ok", text: "Senha atualizada. Use a nova senha no próximo login." });
  }

  return (
    <section className="acc-card" id="seguranca">
      <div className="acc-card-head">
        <div>
          <h2>Senha e segurança</h2>
          <p>Contas criadas pelo administrador devem trocar a senha inicial aqui.</p>
        </div>
      </div>

      <form className="acc-form" onSubmit={trocar}>
        <div className="acc-form-grid">
          <label className="sd-field">
            <span>Nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              minLength={8}
              placeholder="mínimo de 8 caracteres"
              required
            />
          </label>
          <label className="sd-field">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(event) => setConfirmar(event.target.value)}
              minLength={8}
              placeholder="repita a nova senha"
              required
            />
          </label>
        </div>
        <button className="sd-btn primary" type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Trocar senha"}
        </button>
        <small>A sessão atual continua ativa depois da troca.</small>
      </form>
    </section>
  );
}

function SteamCard({ account, onNotice }: { account: Account; onNotice: Notify }) {
  const [entrada, setEntrada] = useState("");
  const [nomeManual, setNomeManual] = useState(account.steam?.nome ?? "");
  const [buscando, setBuscando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const autoConsultou = useRef(false);
  const steam = account.steam;

  useEffect(() => {
    setNomeManual(account.steam?.nome ?? "");
  }, [account.steam?.nome]);

  // O OpenID chega só com o SteamID. Busca nome/avatar uma vez; se a Steam
  // estiver fora do ar, o selo de verificação continua válido.
  useEffect(() => {
    if (!steam?.verificado || steam.perfilPublico || autoConsultou.current) return;
    autoConsultou.current = true;
    setBuscando(true);
    void enrichSteamProfile(steam).then(async (result) => {
      setBuscando(false);
      if (!result.ok) return;
      const saved = await saveSteamProfile(account.id, result.profile);
      if (saved.ok) {
        onNotice({ tone: "ok", text: "Steam verificada e perfil sincronizado." });
      }
    });
  }, [steam?.verificado, steam?.perfilPublico, account.id]);

  async function verificar() {
    setErro(null);
    setVerificando(true);
    const result = await startSteamOpenId();
    if (!result.ok) {
      setVerificando(false);
      setErro(result.error);
      return;
    }
    window.location.assign(result.url);
  }

  async function vincular(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    const parsed = parseSteamTarget(entrada);
    if (!parsed.ok) {
      setErro(parsed.error);
      return;
    }

    const base = createSteamProfile(entrada, parsed.target);
    const savedBase = await saveSteamProfile(account.id, base);
    if (!savedBase.ok) {
      setErro(savedBase.error);
      return;
    }
    setEntrada("");
    setBuscando(true);
    const result = await enrichSteamProfile(base);
    setBuscando(false);

    if (result.ok) {
      const saved = await saveSteamProfile(account.id, result.profile);
      if (!saved.ok) {
        setErro(saved.error);
        onNotice({ tone: "bad", text: saved.error });
        return;
      }
      onNotice({ tone: "ok", text: "Vínculo manual salvo e perfil público sincronizado." });
    } else {
      onNotice({
        tone: "warn",
        text: `Vínculo manual salvo, mas o perfil não respondeu: ${result.error}`,
      });
    }
  }

  async function atualizar() {
    if (!steam) return;
    setErro(null);
    setBuscando(true);
    const result = await enrichSteamProfile(steam);
    setBuscando(false);
    if (result.ok) {
      const saved = await saveSteamProfile(account.id, result.profile);
      if (!saved.ok) {
        setErro(saved.error);
        onNotice({ tone: "bad", text: saved.error });
        return;
      }
      onNotice({ tone: "ok", text: "Dados da Steam atualizados." });
    } else {
      setErro(result.error);
      onNotice({ tone: "warn", text: `Não foi possível atualizar: ${result.error}` });
    }
  }

  async function desvincular() {
    if (!window.confirm("Desvincular este perfil da Steam?")) return;
    const result = await clearSteamProfile(account.id);
    setErro(null);
    onNotice(
      result.ok
        ? { tone: "ok", text: "Steam desvinculada." }
        : { tone: "bad", text: result.error },
    );
  }

  async function salvarNome() {
    const result = await updateSteamName(account.id, nomeManual);
    onNotice(
      result.ok
        ? { tone: "ok", text: "Nome da Steam salvo." }
        : { tone: "bad", text: result.error },
    );
  }

  const statusLine = steam
    ? steam.verificado
      ? `conta confirmada pela Steam${steam.privacidade ? ` · ${steamPrivacyLabel(steam.privacidade)}` : ""}`
      : steam.perfilPublico
        ? `${steamPrivacyLabel(steam.privacidade)} · sem verificação de posse`
        : "vínculo manual · perfil ainda não consultado"
    : "";

  return (
    <section className="acc-card" id="steam">
      <div className="acc-card-head">
        <div>
          <p className="acc-kicker">vínculo</p>
          <h2>Steam</h2>
        </div>
        {steam && (
          <span className={`acc-card-tag ${steam.verificado ? "ok" : "warn"}`}>
            {steam.verificado
              ? "verificada pela Steam"
              : USING_SUPABASE
                ? "sem verificação"
                : "vínculo local"}
          </span>
        )}
      </div>

      {!steam ? (
        <>
          <p className="acc-card-sub">
            Entre na página oficial da Steam para provar que a conta é sua. O SourceDayZ nunca
            vê sua senha.
          </p>

          {USING_SUPABASE ? (
            <button
              className="sd-btn primary sd-btn-block acc-steam-openid"
              type="button"
              onClick={verificar}
              disabled={verificando || buscando}
            >
              {verificando ? "Abrindo a Steam…" : "Vincular com Steam"}
            </button>
          ) : (
            <p className="acc-small">
              A verificação oficial precisa do banco conectado. No modo local, use o vínculo
              manual abaixo.
            </p>
          )}

          {erro && <p className="acc-inline-error" role="alert">{erro}</p>}

          <details className="acc-steam-manual">
            <summary>Prefiro colar o link manualmente</summary>
            <p className="acc-small">
              O vínculo manual não prova que a conta Steam é sua.
            </p>
            <form className="acc-form" onSubmit={vincular}>
              <label className="sd-field">
                <span>Perfil da Steam</span>
                <input
                  type="text"
                  placeholder="steamcommunity.com/id/seunome"
                  value={entrada}
                  onChange={(event) => setEntrada(event.target.value)}
                  required
                />
              </label>
              <button className="sd-btn" type="submit" disabled={buscando}>
                {buscando ? "Consultando Steam…" : "Vincular manualmente"}
              </button>
            </form>
          </details>
        </>
      ) : (
        <>
          {steam.verificado && (
            <div className="acc-steam-verified">
              <strong>Conta Steam verificada</strong>
              <span>O Steam OpenID confirmou que este perfil é seu.</span>
            </div>
          )}

          <div className="acc-steam-id">
            <AvatarView nome={steam.nome ?? account.nome} src={steam.avatar} size={64} />
            <div>
              <strong>{steam.nome ?? "Perfil da Steam"}</strong>
              <span>{statusLine}</span>
              <a href={steam.perfilUrl} target="_blank" rel="noreferrer noopener">
                Abrir perfil ↗
              </a>
            </div>
          </div>

          <dl className="acc-data">
            <div>
              <dt>SteamID64</dt>
              <dd>{steam.steamId64 ?? "resolvido ao consultar"}</dd>
            </div>
            <div>
              <dt>SteamID</dt>
              <dd>{steam.steamId2 ?? "—"}</dd>
            </div>
            <div>
              <dt>Conta Steam</dt>
              <dd>{steam.accountId ?? "—"}</dd>
            </div>
            <div>
              <dt>VAC</dt>
              <dd>
                {steam.vac === null
                  ? "não consultado"
                  : steam.vac
                    ? "registro de banimento"
                    : "sem banimentos"}
              </dd>
            </div>
            {steam.pais && (
              <div>
                <dt>Local</dt>
                <dd>{steam.pais}</dd>
              </div>
            )}
            {steam.membroDesde && (
              <div>
                <dt>Na Steam desde</dt>
                <dd>{steam.membroDesde}</dd>
              </div>
            )}
          </dl>

          {!steam.nome && (
            <div className="acc-inline-form">
              <label className="sd-field">
                <span>Nome exibido na Steam</span>
                <input
                  type="text"
                  value={nomeManual}
                  onChange={(event) => setNomeManual(event.target.value)}
                  placeholder="Caso o perfil seja privado"
                  maxLength={60}
                />
              </label>
              <button className="sd-btn" type="button" onClick={salvarNome}>
                Salvar nome
              </button>
            </div>
          )}

          {erro && <p className="acc-inline-error" role="alert">{erro}</p>}

          <div className="acc-row-actions">
            {!steam.verificado && USING_SUPABASE && (
              <button
                className="sd-btn primary"
                type="button"
                onClick={verificar}
                disabled={verificando || buscando}
              >
                {verificando ? "Abrindo a Steam…" : "Verificar com Steam"}
              </button>
            )}
            <button
              className={steam.verificado ? "sd-btn primary" : "sd-btn"}
              type="button"
              onClick={atualizar}
              disabled={buscando}
            >
              {buscando ? "Consultando…" : "Atualizar dados"}
            </button>
            <button className="acc-linkbtn" type="button" onClick={desvincular}>
              Desvincular
            </button>
          </div>

          {steam.atualizadoEm && (
            <p className="acc-small">
              Última consulta: {formatDateTime(steam.atualizadoEm)} ·{" "}
              {steam.perfilPublico
                ? "dados do perfil público da Steam"
                : USING_SUPABASE
                  ? "vínculo salvo no seu perfil"
                  : "vínculo salvo só neste navegador"}
            </p>
          )}
        </>
      )}

      <p className="acc-footnote">
        {steam?.verificado
          ? "Conta verificada pelo Steam OpenID. O SourceDayZ nunca recebe sua senha da Steam."
          : USING_SUPABASE
            ? "O vínculo manual não prova posse. Use “Verificar com Steam” para confirmar que a conta é sua."
            : "No modo local o vínculo fica só neste navegador e não é verificado pela Steam."}
      </p>
    </section>
  );
}

function AccessCard({ access }: { access: AccessInfo }) {
  return (
    <section className="acc-card acc-access" id="acesso">
      <div className="acc-card-head">
        <div>
          <p className="acc-kicker">acesso gratuito</p>
          <h2>Seu acesso</h2>
        </div>
        <span className="acc-status on">ativo</span>
      </div>

      <div className="acc-access-on">
        <div>
          <strong>{access.rotulo}</strong>
          <p>{access.detalhe}</p>
        </div>
      </div>
      <p className="acc-small">Sem mensalidade, assinatura ou cobrança para jogar.</p>
    </section>
  );
}

function ServerCard({
  account,
  server,
  onNotice,
}: {
  account: Account;
  server: HostedServer | null;
  onNotice: Notify;
}) {
  const [nome, setNome] = useState("");
  const [regiao, setRegiao] = useState(REGIOES[0]);
  const [slots, setSlots] = useState(60);
  const [discord, setDiscord] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOcupado(true);
    try {
      const result = await createServer(account.id, { nome, regiao, slots, discord, descricao });
      if (!result.ok) {
        onNotice({ tone: "bad", text: result.error });
        return;
      }
      setNome("");
      setDiscord("");
      setDescricao("");
      onNotice({
        tone: "ok",
        text: "Servidor criado e enviado para análise.",
      });
    } finally {
      setOcupado(false);
    }
  }

  async function mudarStatus(status: "ativo" | "pausado" | "encerrado") {
    if (!server) return;
    if (
      status === "encerrado" &&
      !window.confirm("Encerrar este servidor? Esta ação não pode ser desfeita.")
    ) {
      return;
    }
    setOcupado(true);
    try {
      const result = await setServerStatus(account.id, server.id, status);
      if (!result.ok) {
        onNotice({ tone: "bad", text: result.error });
        return;
      }
      if (status === "ativo") {
        onNotice({ tone: "ok", text: "Servidor reativado." });
      } else if (status === "pausado") {
        onNotice({
          tone: "warn",
          text: "Servidor pausado.",
        });
      } else {
        onNotice({ tone: "warn", text: "Servidor encerrado." });
      }
    } finally {
      setOcupado(false);
    }
  }

  if (!server) {
    return (
      <section className="acc-card acc-server" id="servidor">
        <div className="acc-card-head">
          <div>
            <p className="acc-kicker">hospedagem</p>
            <h2>Abrir um servidor</h2>
          </div>
          <span className="acc-card-tag">comunidade</span>
        </div>

        <div className="acc-benefit">
          <strong>Acesso gratuito para todos</strong>
          <p>
            Todos podem jogar sem assinatura ou cobrança. O servidor é uma opção para sua comunidade.
          </p>
        </div>

        <form className="acc-form" onSubmit={criar}>
          <label className="sd-field">
            <span>Nome do servidor</span>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: REMANESCENT Z"
              maxLength={60}
              required
            />
          </label>
          <div className="acc-form-grid">
            <label className="sd-field">
              <span>Região</span>
              <select value={regiao} onChange={(event) => setRegiao(event.target.value)}>
                {REGIOES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="sd-field">
              <span>Slots</span>
              <input
                type="number"
                min={20}
                max={200}
                value={slots}
                onChange={(event) => setSlots(Number(event.target.value))}
                required
              />
            </label>
          </div>
          <label className="sd-field">
            <span>Discord do servidor (opcional)</span>
            <input
              type="text"
              value={discord}
              onChange={(event) => setDiscord(event.target.value)}
              placeholder="discord.gg/..."
              maxLength={120}
            />
          </label>
          <label className="sd-field">
            <span>Descrição curta</span>
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Regras, mods, horário de testes…"
              maxLength={400}
              rows={3}
            />
          </label>
          <button className="sd-btn primary sd-btn-block" type="submit" disabled={ocupado}>
            {ocupado ? "Enviando…" : "Solicitar abertura"}
          </button>
          <p className="acc-small">
            A abertura passa por análise para confirmar que o servidor é do projeto.
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="acc-card acc-server" id="servidor">
      <div className="acc-card-head">
        <div>
          <p className="acc-kicker">seu servidor</p>
          <h2>{server.nome}</h2>
        </div>
        <span className={`acc-server-status ${server.status}`}>
          {serverStatusLabel(server.status)}
        </span>
      </div>

      <div className="acc-server-meta">
        <span>{server.regiao}</span>
        <span>{server.slots} slots</span>
        <span>criado em {formatDate(server.criadoEm)}</span>
      </div>

      {server.descricao && <p className="acc-card-sub">{server.descricao}</p>}

      {server.status === "em_analise" && (
        <div className="acc-callout warn">
          <strong>Em análise</strong>
          <p>A equipe está revisando a solicitação do servidor.</p>
        </div>
      )}

      {server.status === "ativo" && (
        <div className="acc-callout ok">
          <strong>Servidor ativo</strong>
          <p>O acesso ao SourceDayZ é gratuito para você e para todos os jogadores.</p>
        </div>
      )}

      {server.status === "pausado" && (
        <div className="acc-callout warn">
          <strong>Servidor pausado</strong>
          <p>O servidor está pausado. Reative-o quando quiser voltar a listá-lo.</p>
        </div>
      )}

      <div className="acc-row-actions acc-server-actions">
        {server.status === "ativo" && (
          <button
            className="sd-btn"
            type="button"
            onClick={() => mudarStatus("pausado")}
            disabled={ocupado}
          >
            Pausar servidor
          </button>
        )}
        {server.status === "pausado" && (
          <button
            className="sd-btn primary"
            type="button"
            onClick={() => mudarStatus("ativo")}
            disabled={ocupado}
          >
            Reativar servidor
          </button>
        )}
        {server.status !== "encerrado" && (
          <button
            className="acc-linkbtn danger"
            type="button"
            onClick={() => mudarStatus("encerrado")}
            disabled={ocupado}
          >
            Encerrar servidor
          </button>
        )}
      </div>

      {server.discord && (
        <p className="acc-small">
          Discord: <span className="acc-mono">{server.discord}</span>
        </p>
      )}
    </section>
  );
}

function DevCard({
  account,
  server,
  onNotice,
}: {
  account: Account;
  server: HostedServer | null;
  onNotice: Notify;
}) {
  const [ocupado, setOcupado] = useState(false);

  async function aprovarServidor() {
    if (!server) return;
    setOcupado(true);
    try {
      const result = await setServerStatus(account.id, server.id, "ativo");
      onNotice(
        result.ok
          ? { tone: "ok", text: "Servidor aprovado." }
          : { tone: "bad", text: result.error },
      );
    } finally {
      setOcupado(false);
    }
  }

  function limparTudo() {
    if (!window.confirm("Apagar todas as contas e servidores deste navegador?")) return;
    if (!window.confirm("Isso não pode ser desfeito. Confirmar?")) return;
    resetAccountData();
    navigate("");
  }

  return (
    <details className="acc-dev">
      <summary>
        {USING_SUPABASE
          ? "Ferramentas de teste · desenvolvimento"
          : "Ferramentas de teste · ambiente local"}
      </summary>
      <p>
        {USING_SUPABASE
          ? "Estas ações usam funções de desenvolvimento do banco. Desligue o modo de teste no Supabase antes de abrir ao público."
          : "As ações simulam a aprovação do servidor apenas neste navegador."}
      </p>
      <div className="acc-dev-actions">
        {server?.status === "em_analise" && (
          <button className="sd-btn" type="button" onClick={aprovarServidor} disabled={ocupado}>
            Aprovar servidor
          </button>
        )}
        {!USING_SUPABASE && (
          <button className="acc-linkbtn danger" type="button" onClick={limparTudo}>
            Apagar dados de contas deste navegador
          </button>
        )}
      </div>
    </details>
  );
}

function AccountFooter() {
  return (
    <footer className="acc-foot">
      <span>SourceDayZ · projeto independente, sem vínculo com a Bohemia Interactive.</span>
      <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener">
        Discord ↗
      </a>
    </footer>
  );
}

type SteamReturn = { status: string; motivo: string };

export function MinhaConta({
  steamReturn,
  onSteamHandled,
}: {
  steamReturn: SteamReturn | null;
  onSteamHandled: () => void;
}) {
  const store = useAccountStore();
  const account = useCurrentAccount();
  const [notice, setNotice] = useState<Notice | null>(null);
  const handledSteam = useRef(false);

  // Só confirma o sucesso depois que o banco carregou o perfil; um ?steam=ok
  // colado à mão não engana o aviso.
  useEffect(() => {
    if (!steamReturn || handledSteam.current || !store.ready || !account) return;
    handledSteam.current = true;

    if (steamReturn.status === "ok" && !account.steam?.verificado) {
      setNotice({
        tone: "warn",
        text: "A verificação terminou, mas o vínculo ainda não aparece. Recarregue a página.",
      });
    } else {
      setNotice(steamReturnNotice(steamReturn.status, steamReturn.motivo));
    }

    // Consome o resultado: sair e voltar para Minha conta não repete o aviso.
    onSteamHandled();
  }, [steamReturn, store.ready, account, onSteamHandled]);

  if (!store.ready) return <ContaLoading />;
  if (!account) return <ContaGate error={store.error} />;

  const server = getOwnedServer(store, account.id);
  const access = getAccess(account, store.servers);

  return (
    <div className="sd acc">
      <AccountHeader account={account} />

      <main className="acc-main">
        <section className="acc-hero">
          <div className="acc-hero-id">
            <AvatarView
              nome={account.nome}
              src={account.avatar ?? account.steam?.avatar ?? null}
              size={92}
            />
            <div>
              <p className="sd-eyebrow">minha conta</p>
              <h1>{account.nome}</h1>
              <p className="acc-hero-meta">
                {account.email}
                {account.steam?.nome ? ` · Steam: ${account.steam.nome}` : " · Steam não vinculada"}
              </p>
            </div>
          </div>

          <div className={`acc-hero-status ${access.ativo ? "on" : "off"}`}>
            <span className="acc-pill">{access.ativo ? access.rotulo : "Sem acesso ativo"}</span>
            <strong>{access.ativo ? access.detalhe : "Acesso gratuito para todos"}</strong>
            {access.ativo ? (
              <small>Acesso gratuito para todos</small>
            ) : (
              <button
                className="sd-btn primary"
                type="button"
                onClick={() =>
                  document
                    .getElementById("acesso")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Ver acesso
              </button>
            )}
          </div>
        </section>

        {store.error && (
          <div className="acc-notice bad" role="status">
            <span>{store.error}</span>
          </div>
        )}
        {notice && <NoticeBar notice={notice} onClose={() => setNotice(null)} />}

        <div className="acc-grid">
          <div className="acc-col">
            <AccessCard access={access} />
            <ProfileCard account={account} onNotice={setNotice} />
            <SecurityCard onNotice={setNotice} />
            <SteamCard account={account} onNotice={setNotice} />
          </div>

          <div className="acc-col">
            <ServerCard account={account} server={server} onNotice={setNotice} />
            {store.devMode && (
              <DevCard account={account} server={server} onNotice={setNotice} />
            )}
          </div>
        </div>
      </main>

      <AccountFooter />
    </div>
  );
}
