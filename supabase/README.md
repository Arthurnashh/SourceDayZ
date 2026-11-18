# SourceDayZ no Supabase

O site funciona em dois modos:

- **Sem chaves** (`VITE_SUPABASE_URL` vazia): contas locais no navegador, como antes.
- **Com chaves**: contas, perfis, avatares, acessos, servidores, convidados e pedidos no Postgres do Supabase.

## Estado atual deste projeto

O projeto real já foi criado e configurado nesta máquina:

| Item | Valor |
|---|---|
| Projeto | `Arthurnashh's Project` (`yquuabmgebitshhcqtku`) |
| Região | `us-east-2` |
| URL | `https://yquuabmgebitshhcqtku.supabase.co` |
| Site | `https://sourcedayz.vercel.app` (projeto `sourcedayz`, deploy automático pela branch `main`) |
| Schema | aplicado em 18/11/2026 (tabelas, funções, RLS, painel admin e bucket `avatars`) |
| Chaves | `site/.env.local` já gravado com URL + publishable key |
| Auth | **Confirm email desligado** para testes; Site URL `http://127.0.0.1:5173` |
| Steam | Edge Function `steam` publicada (OpenID + perfil público) |
| Admin | conta `admin@sourcedayz.com` com `is_admin = true`; senha inicial entregue ao responsável |
| `dev_mode` | `false` (só administradores veem as ferramentas de teste) |

Antes de publicar em um domínio real, troque em **Authentication → URL Configuration**:

- **Site URL**: `https://seudominio.com`
- **Redirect URLs**: `https://seudominio.com/**`

E rode o build de novo para que o `.env.local` entre no pacote.

> As contas de teste usadas na validação foram apagadas. O banco está limpo: resta
> apenas a conta administrativa `admin@sourcedayz.com`, sem servidores, pedidos ou
> acessos. Troque a senha inicial no primeiro login (veja “Painel administrativo”).

## Passo a passo (uma vez)

### 1. Criar o projeto

1. Entre em <https://supabase.com> e crie uma conta (pode entrar com GitHub).
2. Clique em **New project**.
3. Nome: `sourcedayz`. Região: a mais próxima dos jogadores (este projeto está em **us-east-2**). Defina uma senha forte para o banco e guarde.
4. Espere o projeto terminar de provisionar (1–2 minutos).

### 2. Criar o banco

1. No painel do projeto, abra **SQL Editor**.
2. Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Deve terminar sem erro. Se rodar de novo, ele não apaga dados.

### 3. Ligar o site

1. Abra **Project Settings → API**.
2. Copie **Project URL** e a **publishable key** (ou a **anon public key**, em projetos antigos).
3. Crie um arquivo `.env.local` na raiz de `site/`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=COLE_A_ANON_KEY_AQUI
```

4. Reinicie o `npm run dev`.
5. O painel de conta passa a mostrar “Sua conta fica no banco do projeto”.

> A `anon key` é pública de propósito. Quem protege os dados é o RLS + as funções do banco.
> Nunca coloque a `service_role` no site.
>
> O plano free do Supabase pausa o projeto depois de um período sem uso. Para o site em
> produção, mantenha o projeto ativo ou use um plano pago.

### 4. Ajustar o Auth

Em **Authentication → Providers → Email**:

- **Confirm email**: desligado para testar mais rápido; ligado em produção.
- **Site URL**: coloque o endereço real do site (ex.: `https://sourcedayz.com.br`).
- **Redirect URLs**: inclua `http://localhost:5173/**`, `http://127.0.0.1:5173/**` e o domínio real com `/**`. É para lá que o link de confirmação volta (`?auth=confirm`), e o site abre **Minha conta** sozinho depois de validar a sessão.

Com a confirmação ligada, o cadastro mostra “Conta criada! Confirme o e-mail…” e o jogador entra depois de confirmar.

### 5. Virar administrador

Crie sua conta pelo site e depois rode no SQL Editor:

```sql
update public.profiles
set is_admin = true
where email = 'seu@email.com';
```

### 6. Ferramentas de teste

O banco já nasce com `dev_mode = false` por segurança. **Administradores continuam vendo** as ferramentas de teste, então você pode simular pagamento e aprovar o próprio servidor depois do passo 5.

Para liberar a simulação para todos temporariamente:

```sql
update public.app_settings set dev_mode = true;
```

Mantenha `false` quando o site estiver aberto ao público.

O dia a dia agora é pelo **painel administrativo** (`/#/admin`). O SQL abaixo continua
valendo como plano B se o painel estiver indisponível:

```sql
-- troque o id pelo servidor desejado
with aprovado as (
  update public.servers
  set status = 'ativo', activated_at = coalesce(activated_at, now())
  where id = 'COLE-O-ID-AQUI'
  returning id, owner_id
)
insert into public.grants (user_id, kind, starts_at, source, status)
select owner_id, 'vitalicio', now(), 'servidor:' || id, 'ativo'
from aprovado;
```

## Painel administrativo

Abra `/#/admin` (em produção, `https://seudominio.com/#/admin`) e entre com uma conta
que tenha `is_admin = true`. A conta inicial é:

| Campo | Valor |
|---|---|
| E-mail | `admin@sourcedayz.com` |
| Senha | a senha inicial foi entregue no chat; **troque no primeiro acesso** |

Para trocar a senha: **Authentication → Users** no painel do Supabase → conta → envie a
recuperação, ou use “Esqueci minha senha” no site quando o SMTP estiver configurado.

O painel tem sete abas:

- **Visão geral**: contagens, receita dos últimos 30 dias, fila de servidores, pedidos
  pendentes e últimas ações.
- **Contas**: busca e filtros; renomear; copiar ID; promover/remover administrador;
  conceder acesso mensal, cortesia ou vitalício; revogar acessos; ver Steam, pedidos e
  servidor da conta.
- **Servidores**: aprovar, pausar, reativar e encerrar. Aprovar cria o acesso vitalício do
  dono; pausar e encerrar revogam esse acesso; reativar devolve.
- **Pedidos**: conferir valor e jogador e clicar em **Marcar pago** para liberar 30 dias,
  ou **Cancelar**. O botão é para conferência manual do Pix/cartão.
- **Gateway**: provedor (manual, Mercado Pago ou Stripe), ambiente, chave pública, token,
  segredo do webhook e liga/desliga. As credenciais ficam no banco e **nunca voltam ao
  navegador**; a resposta traz apenas `has_access_token` / `has_webhook_secret`.
- **Ajustes**: modo de teste (`dev_mode`) e origens permitidas do Steam OpenID.
- **Histórico**: últimas ações administrativas registradas em `admin_log`.

A autorização real é feita no banco: todas as RPCs `admin_*` são `SECURITY DEFINER` e
começam com `if not public.is_admin() then raise exception 'not_admin'`. Esconder um
botão na interface não é a proteção.

### RPCs administrativas

| RPC | Para quê |
|---|---|
| `admin_dashboard()` | métricas da visão geral |
| `admin_list_accounts(p_search, p_filter)` | listar/filtrar contas |
| `admin_update_account(p_user_id, p_display_name)` | renomear conta |
| `admin_set_admin(p_user_id, p_enabled)` | promover/remover admin |
| `admin_grant_access(p_user_id, p_kind, p_days)` | conceder acesso |
| `admin_revoke_grant(p_grant_id)` | revogar acesso |
| `admin_list_servers()` | fila e detalhes dos servidores |
| `admin_set_server_status(p_server_id, p_status, p_note)` | aprovar/pausar/reativar/encerrar |
| `admin_list_orders()` | pedidos com dados do jogador |
| `admin_set_order_status(p_order_id, p_status)` | marcar pago/cancelado |
| `admin_get_settings()` | estado do site e do gateway (sem segredos) |
| `admin_set_gateway(...)` | salvar credenciais e modo de cobrança |
| `admin_set_origins(p_origins)` | origens do Steam OpenID (máx. 10) |
| `admin_set_dev_mode(p_enabled)` | modo de teste |
| `admin_list_log(p_limit)` | histórico administrativo |

Todas são revogadas de `public`/`anon` e liberadas apenas para `authenticated`; a
checagem de admin acontece dentro da função. A tabela `admin_log` também tem RLS e não
aceita escrita direta do cliente.

### Gateway: o que está pronto e o que não está

O painel **guarda** provedor, ambiente e credenciais e permite ativar o gateway. Ainda
**não existe checkout nem webhook**: nenhum pagamento é cobrado ou confirmado
automaticamente. Até essa etapa ser publicada, o fluxo oficial é o manual:

1. O jogador cria o pedido mensal de R$ 25 no site.
2. Você confere o Pix/cartão no seu recebedor.
3. Em **Pedidos → Marcar pago**, o banco libera 30 dias de acesso e registra no histórico.

Ativar Mercado Pago/Stripe no painel antes do checkout existir só muda o rótulo do modo;
não cobra ninguém. Para produção, mantenha **Manual** até o webhook entrar no ar.

## Steam OpenID

O botão **Vincular com Steam** em Minha conta usa o Steam OpenID oficial.

Como funciona:

1. O site pede um nonce ao banco (`create_steam_link_state`) e abre a página da Steam.
2. A Steam devolve o jogador para a Edge Function `steam`.
3. A função confere a assinatura direto na Steam, confirma o SteamID64 e grava
   `verificado: true` e `origem: "openid"` no perfil.
4. O site volta para Minha conta e busca nome/avatar no perfil público.

A função não precisa de Steam Web API key: ela lê o XML público (`?xml=1`) no
servidor, sem depender de proxy de terceiros.

### Publicar em um domínio

Inclua a origem do site no banco, senão o botão recusa por segurança:

```sql
update public.app_settings
set allowed_origins = allowed_origins || array['https://seudominio.com']
where not ('https://seudominio.com' = any(allowed_origins));
```

Também troque a **Site URL** e as **Redirect URLs** do Auth para o domínio real.

### Deploy da função

```bash
npx supabase functions deploy steam --project-ref yquuabmgebitshhcqtku --no-verify-jwt --use-api
```

O código está em `supabase/functions/steam/index.ts` e o `supabase/config.toml`
já marca a função com `verify_jwt = false` (a volta da Steam não tem JWT do Supabase).

### Segurança do vínculo

- Nonce aleatório, de uso único, expira em 10 minutos.
- A origem de retorno só pode ser uma das `allowed_origins` (evita open redirect).
- Uma conta Steam só pode pertencer a um jogador (índice único).
- O trigger `protect_profile` impede o cliente de marcar `verificado: true` ou
  `origem: openid` sozinho; só a função com `service_role` grava o selo.
- O vínculo manual continua disponível, mas aparece como **sem verificação**.
- O site nunca pede a senha da Steam: a pessoa entra na página oficial da Steam e volta.

## O que já está no banco

| Tabela | Para quê |
|---|---|
| `profiles` | nome, e-mail, avatar, dados da Steam, admin |
| `grants` | acesso mensal, vitalício e cortesia |
| `servers` | servidor do jogador, status e código |
| `server_guests` | os 20 primeiros de cada servidor |
| `orders` | pedidos de assinatura |
| `steam_link_states` | nonces de uso único do Steam OpenID |
| `app_settings` | ferramentas de teste, origens permitidas e credenciais do gateway |
| `admin_log` | auditoria das ações administrativas |

Funções (RPC): `create_server`, `set_server_status`, `redeem_server_code`,
`create_monthly_order`, `dev_pay_order`, `dev_tools_enabled`,
`create_steam_link_state` e todas as `admin_*` listadas acima.

Edge Function: `steam` (OpenID + leitura do perfil público).

Bucket `avatars`: leitura pública, escrita apenas na pasta do próprio usuário.

## Segurança

- Todas as tabelas têm RLS.
- Ninguém altera `grants` pelo cliente: só as funções `SECURITY DEFINER`.
- O dono do servidor não resgata o próprio código.
- O código do servidor só é legível pelo dono, pelos convidados e por admins.
- O limite de 20 vagas é conferido no banco, com lock na linha do servidor.
- `is_admin` e `email` são protegidos por trigger.
- O selo `verificado` da Steam só é gravado pelo backend; o cliente não consegue forjar.
- O código do servidor é único e gerado no banco.
- Toda ação do painel confere `is_admin()` dentro da RPC, não só na interface.
- `admin_log` tem RLS e não aceita escrita direta de `anon`/`authenticated`.
- Token e segredo do gateway nunca são devolvidos ao navegador; só os indicadores
  `has_access_token` e `has_webhook_secret`.
- A conta admin inicial deve ter a senha trocada; o cadastro público nunca cria admin.

## Ainda falta (próximas etapas)

1. **Pagamento real**: checkout Mercado Pago/Stripe + webhook em Edge Function usando
   `service_role`, atualizando `orders` e `grants`. Hoje o painel guarda as credenciais,
   mas a liberação é manual em **Pedidos → Marcar pago**.
2. **Publicar em domínio próprio**: trocar Site URL/Redirect URLs, acrescentar a origem
   em **Ajustes** e gerar o build de novo.
3. **Migrar contas locais**: não é possível importar as senhas (elas foram criadas no navegador). As contas de teste devem ser recriadas no Supabase.
4. **Primeiro teste real do OpenID**: o fluxo já está publicado, mas a validação final exige entrar com uma conta Steam de verdade.
5. **Confirm email em produção**: hoje está desligado para testes.

## Contas de desenvolvedor e idiomas

### Papel `is_dev`

`public.profiles.is_dev` libera a leitura da documentação da source. Não concede
poderes administrativos, acesso a pedidos, contas de jogadores ou escrita em
tabelas. `public.is_dev()` retorna verdadeiro para admins e para contas dev.

- O trigger `protect_profile` impede o jogador de alterar `is_dev` pelo cliente.
- `admin_set_dev(p_user_id, p_is_dev)` promove/remove o papel e grava em `admin_log`.
- `admin_list_accounts` devolve `is_dev`; o painel mostra o selo **dev** e o filtro
  **Devs**.
- O gate das rotas de documentação fica em `src/App.tsx` (`DocsGate`), mas a
  autorização real é sempre conferida no banco.

### Criar conta dev pelo painel

1. Abra **Admin → Contas**.
2. Em **Conta de desenvolvedor**, informe nome, e-mail e senha inicial.
3. A conta é criada por `admin-dev` (Edge Function com `service_role`), já com
   `is_dev = true`. A senha não volta na resposta.
4. Entregue a senha por um canal privado. O desenvolvedor pode trocá-la em
   **Minha conta → Senha e segurança**.

Para promover uma conta que já existe, selecione a conta e use **Tornar dev**.

### Deploy da função `admin-dev`

```bash
npx supabase functions deploy admin-dev --project-ref yquuabmgebitshhcqtku --no-verify-jwt --use-api
```

A função confere o JWT do chamador, exige `is_admin = true` no banco e usa
`SUPABASE_SERVICE_ROLE_KEY` apenas no servidor. Nunca coloque essa chave no site.

### Idiomas

- Bandeiras PT/EN/RU no cabeçalho da landing e da conta.
- Detecção inicial por `navigator.languages`; a escolha fica em
  `localStorage` (`sourcedayz.locale`).
- Visitantes de outros idiomas recebem inglês.
- Landing, login/cadastro, cabeçalho, tela de acesso à conta e gate da
  documentação estão traduzidos. As telas internas de conta e painel seguem em
  português nesta etapa.
- O `lang` do documento é atualizado (`pt-BR`, `en`, `ru`).

### Limite de segurança da documentação

O gate esconde a interface de quem não é dev, mas o build é estático: os arquivos
em `public/data` continuam sendo servidos por URL direta a quem souber o caminho.
Para sigilo real seria necessário mover a documentação para o Supabase Storage
privado (ou uma Edge Function que devolva o conteúdo após validar `is_dev`). Até
lá, trate a source como material interno da equipe, não como segredo.

## Publicar na Vercel

**Publicado em 18/11/2026:** <https://sourcedayz.vercel.app>

O projeto `sourcedayz` está conectado ao repositório
<https://github.com/Arthurnashh/SourceDayZ> e publica automaticamente a cada
push na branch `main`. As variáveis `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` já estão configuradas em Production, Preview e
Development.

O `site/vercel.json` define o build:

- Framework: **Vite**
- Build: `npm run build`
- Saída: `dist`

Para recriar em outra conta/projeto:

1. Envie a pasta `site` para um repositório Git (o projeto local não é um repositório).
2. Na Vercel, importe o repositório e confirme as configurações acima.
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = `https://yquuabmgebitshhcqtku.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = a publishable/anon key do projeto
4. Faça o deploy. As rotas usam hash (`#/documento`), então não é necessário
   configurar rewrites.
5. No Supabase, em **Authentication → URL Configuration**, troque a **Site URL**
   para o domínio da Vercel e inclua o domínio nas **Redirect URLs**.
6. No painel do site, em **Admin → Ajustes → Origens**, adicione o domínio da
   Vercel (a Edge Function `steam` valida essa lista).

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` nas variáveis da Vercel. A chave
`VITE_*` vai para o navegador e só pode ser a anon/publishable.

### Checklist rápido antes de abrir ao público

- [ ] Trocar a senha do admin inicial.
- [ ] Ligar **Confirm email** no Supabase Auth.
- [ ] Revogar qualquer Personal Access Token usado durante a configuração.
- [ ] Revisar as origens permitidas no painel.
- [ ] Decidir se a documentação continuará estática (protegida só pela interface)
      ou se será movida para um bucket privado.
