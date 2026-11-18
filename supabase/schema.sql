-- ============================================================
-- SourceDayZ · Supabase
-- Execute este arquivo inteiro no SQL Editor do projeto.
-- Idempotente: pode rodar de novo sem apagar dados.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabelas
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null default '',
  avatar_url text,
  steam jsonb,
  is_admin boolean not null default false,
  is_dev boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- Contas de desenvolvedor: acesso somente leitura aos documentos da source.
-- Projetos criados antes recebem a coluna sem perder dados.
alter table public.profiles
  add column if not exists is_dev boolean not null default false;

create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  dev_mode boolean not null default false,
  allowed_origins text[] not null default array[
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173'
  ],
  updated_at timestamptz not null default now()
);

-- Projetos criados antes do Steam OpenID recebem a coluna sem perder dados.
alter table public.app_settings
  add column if not exists allowed_origins text[] not null default array[
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173'
  ];

-- Gateway de pagamento. O token e o segredo do webhook ficam no banco e só
-- são lidos por funções SECURITY DEFINER de administrador. O cliente recebe
-- apenas "configurado/não configurado".
alter table public.app_settings
  add column if not exists gateway_provider text not null default 'manual',
  add column if not exists gateway_enabled boolean not null default false,
  add column if not exists gateway_environment text not null default 'test',
  add column if not exists gateway_public_key text not null default '',
  add column if not exists gateway_access_token text not null default '',
  add column if not exists gateway_webhook_secret text not null default '',
  add column if not exists gateway_updated_at timestamptz;

-- dev_mode = false por segurança. Admins continuam com as ferramentas.
-- Para liberar simulação para todos durante testes, rode:
--   update public.app_settings set dev_mode = true;
insert into public.app_settings (id, dev_mode)
values (1, false)
on conflict (id) do nothing;

create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('mensal', 'vitalicio', 'cortesia')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text not null,
  status text not null default 'ativo' check (status in ('ativo', 'revogado')),
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  region text not null default 'América do Sul' check (char_length(region) between 2 and 40),
  slots integer not null default 60 check (slots between 20 and 200),
  discord text not null default '' check (char_length(discord) <= 120),
  description text not null default '',
  status text not null default 'em_analise'
    check (status in ('em_analise', 'ativo', 'pausado', 'encerrado')),
  code text not null unique,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  paused_at timestamptz,
  closed_at timestamptz,
  check (char_length(name) between 3 and 60),
  check (char_length(description) <= 400)
);

create table if not exists public.server_guests (
  server_id uuid not null references public.servers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  steam_name text,
  joined_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (server_id, user_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null default 'mensal' check (plan = 'mensal'),
  amount_cents integer not null default 2500 check (amount_cents >= 0),
  status text not null default 'aguardando'
    check (status in ('aguardando', 'pago', 'cancelado')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  method text check (method in ('pix', 'cartao') or method is null)
);

-- Nonce de uso único para o retorno do Steam OpenID. Só o backend lê.
create table if not exists public.steam_link_states (
  state uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  return_origin text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  used_at timestamptz
);

-- Histórico do painel administrativo. Não tem policy: só as RPCs de admin leem.
create table if not exists public.admin_log (
  id bigserial primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists grants_user_idx on public.grants (user_id, status, ends_at);
create index if not exists steam_link_states_user_idx
  on public.steam_link_states (user_id, created_at desc);
create index if not exists servers_owner_idx on public.servers (owner_id, status);
create index if not exists server_guests_user_idx on public.server_guests (user_id);
create unique index if not exists servers_code_norm_idx
  on public.servers (upper(replace(code, '-', '')));
create index if not exists admin_log_created_idx on public.admin_log (created_at desc);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create unique index if not exists orders_one_pending_idx
  on public.orders (user_id) where status = 'aguardando';
-- Uma conta Steam só pode pertencer a um jogador do site.
create unique index if not exists profiles_steam_id64_idx
  on public.profiles ((steam ->> 'steamId64'))
  where steam is not null and (steam ->> 'steamId64') is not null;

-- ------------------------------------------------------------
-- 2. Funções auxiliares
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- Desenvolvedor aprovado enxerga a documentação da source. Admin também,
-- porque administra as contas. O cliente nunca decide isso sozinho.
create or replace function public.is_dev()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
      or coalesce((select p.is_dev from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.dev_tools_enabled()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
      or coalesce((select s.dev_mode from public.app_settings s where s.id = 1), false);
$$;

-- Auxiliares das policies. SECURITY DEFINER evita recursão de RLS entre
-- servers e server_guests.
create or replace function public.owns_server(p_server_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.servers s
    where s.id = p_server_id and s.owner_id = auth.uid()
  );
$$;

create or replace function public.is_server_guest(p_server_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.server_guests g
    where g.server_id = p_server_id and g.user_id = auth.uid()
  );
$$;

-- Cria o perfil quando uma conta é registrada no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(coalesce(new.email, 'jogador'), '@', 1)
      ),
      40
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Impede que o próprio jogador altere is_admin/email pelo cliente.
create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.display_name := btrim(regexp_replace(coalesce(new.display_name, ''), '\s+', ' ', 'g'));
  if char_length(new.display_name) < 2 then
    raise exception 'invalid_name';
  end if;
  if char_length(new.display_name) > 40 then
    new.display_name := left(new.display_name, 40);
  end if;

  if new.avatar_url is not null and char_length(new.avatar_url) > 2048 then
    raise exception 'invalid_avatar';
  end if;
  if new.steam is not null and pg_column_size(new.steam) > 20000 then
    raise exception 'invalid_steam';
  end if;

  -- O cliente nunca marca o próprio vínculo como verificado. Só o backend
  -- (service_role, sem auth.uid()) grava origem=openid. Se o SteamID mudar,
  -- a verificação antiga cai e o vínculo volta a ser manual.
  if new.steam is not null and auth.uid() is not null and new.steam is distinct from old.steam then
    if new.steam ->> 'steamId64' is distinct from old.steam ->> 'steamId64' then
      new.steam := jsonb_set(new.steam, '{verificado}', 'false'::jsonb, true);
      new.steam := jsonb_set(new.steam, '{origem}', '"manual"'::jsonb, true);
    else
      new.steam := jsonb_set(
        new.steam,
        '{verificado}',
        coalesce(old.steam -> 'verificado', 'false'::jsonb),
        true
      );
      new.steam := jsonb_set(
        new.steam,
        '{origem}',
        coalesce(old.steam -> 'origem', '"manual"'::jsonb),
        true
      );
    end if;
  end if;

  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.is_dev := old.is_dev;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. Triggers
-- ------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- ------------------------------------------------------------
-- 4. RPCs (toda escrita passa por aqui)
-- ------------------------------------------------------------

create or replace function public.create_server(
  p_name text,
  p_region text,
  p_slots integer,
  p_discord text,
  p_description text
)
returns public.servers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_server public.servers;
  i integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 3 or char_length(p_name) > 60 then
    raise exception 'invalid_name';
  end if;
  if p_slots is null or p_slots < 20 or p_slots > 200 then
    raise exception 'invalid_slots';
  end if;
  if char_length(coalesce(p_description, '')) > 400 then
    raise exception 'invalid_description';
  end if;
  if exists (
    select 1 from public.servers
    where owner_id = v_uid and status <> 'encerrado'
  ) then
    raise exception 'already_has_server';
  end if;

  for i in 1..20 loop
    v_code := 'SDZ-' || (
      select string_agg(
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1),
        ''
      )
      from generate_series(1, 6)
    );
    begin
      insert into public.servers (
        owner_id, name, region, slots, discord, description, code
      )
      values (
        v_uid,
        p_name,
        left(coalesce(nullif(btrim(p_region), ''), 'América do Sul'), 40),
        p_slots,
        left(btrim(coalesce(p_discord, '')), 120),
        btrim(coalesce(p_description, '')),
        v_code
      )
      returning * into v_server;
      return v_server;
    exception when unique_violation then
      -- código repetido: tenta outro
    end;
  end loop;

  raise exception 'code_generation_failed';
end;
$$;

create or replace function public.set_server_status(p_server_id uuid, p_status text)
returns public.servers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_server public.servers;
  v_source text := 'servidor:' || p_server_id;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_server
  from public.servers
  where id = p_server_id
  for update;

  if not found then
    raise exception 'server_not_found';
  end if;
  if v_server.owner_id <> v_uid then
    raise exception 'not_owner';
  end if;
  if p_status not in ('ativo', 'pausado', 'encerrado') then
    raise exception 'invalid_status';
  end if;

  if not (
    (v_server.status = 'em_analise' and p_status in ('ativo', 'encerrado')) or
    (v_server.status = 'ativo' and p_status in ('pausado', 'encerrado')) or
    (v_server.status = 'pausado' and p_status in ('ativo', 'encerrado'))
  ) then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'ativo' and v_server.status = 'em_analise'
     and not public.dev_tools_enabled() then
    raise exception 'approval_required';
  end if;

  update public.servers
  set status = p_status,
      activated_at = case
        when p_status = 'ativo' then coalesce(activated_at, now())
        else activated_at
      end,
      paused_at = case
        when p_status = 'pausado' then now()
        when p_status = 'ativo' then null
        else paused_at
      end,
      closed_at = case
        when p_status = 'encerrado' then now()
        else closed_at
      end
  where id = p_server_id
  returning * into v_server;

  if p_status in ('pausado', 'encerrado') then
    update public.grants
    set status = 'revogado'
    where user_id = v_uid
      and source = v_source
      and status = 'ativo';
  elsif p_status = 'ativo' then
    if not exists (
      select 1 from public.grants
      where user_id = v_uid
        and source = v_source
        and status = 'ativo'
    ) then
      insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
      values (v_uid, 'vitalicio', now(), null, v_source, 'ativo');
    end if;
  end if;

  return v_server;
end;
$$;

create or replace function public.redeem_server_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_server public.servers;
  v_count integer;
  v_expires timestamptz := now() + interval '30 days';
  v_name text;
  v_steam text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if v_code = '' then
    raise exception 'invalid_code';
  end if;

  select * into v_server
  from public.servers
  where upper(replace(code, '-', '')) = v_code
  for update;

  if not found then
    raise exception 'code_not_found';
  end if;
  if v_server.status <> 'ativo' then
    raise exception 'server_inactive';
  end if;
  if v_server.owner_id = v_uid then
    raise exception 'owner_cannot_redeem';
  end if;

  select count(*) into v_count
  from public.server_guests
  where server_id = v_server.id;

  if v_count >= 20 then
    raise exception 'limit_reached';
  end if;
  if exists (
    select 1 from public.server_guests
    where server_id = v_server.id and user_id = v_uid
  ) then
    raise exception 'already_redeemed';
  end if;

  select p.display_name, p.steam ->> 'nome'
  into v_name, v_steam
  from public.profiles p
  where p.id = v_uid;

  insert into public.server_guests (server_id, user_id, name, steam_name, expires_at)
  values (v_server.id, v_uid, coalesce(v_name, 'Jogador'), v_steam, v_expires);

  insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
  values (
    v_uid,
    'cortesia',
    now(),
    v_expires,
    'servidor:' || v_server.id || ':jogador',
    'ativo'
  );

  return jsonb_build_object(
    'server_id', v_server.id,
    'expires_at', v_expires,
    'remaining', 20 - (v_count + 1)
  );
end;
$$;

create or replace function public.create_monthly_order()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_existed boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_order
  from public.orders
  where user_id = v_uid and status = 'aguardando'
  order by created_at desc
  limit 1;

  if found then
    v_existed := true;
  else
    begin
      insert into public.orders (user_id, plan, amount_cents, status)
      values (v_uid, 'mensal', 2500, 'aguardando')
      returning * into v_order;
    exception when unique_violation then
      select * into v_order
      from public.orders
      where user_id = v_uid and status = 'aguardando'
      order by created_at desc
      limit 1;
      v_existed := true;
    end;
  end if;

  return jsonb_build_object('order', to_jsonb(v_order), 'ja_existia', v_existed);
end;
$$;

-- SOMENTE desenvolvimento: libera o pedido sem gateway.
-- Desligue com: update public.app_settings set dev_mode = false;
create or replace function public.dev_pay_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_base timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.dev_tools_enabled() then
    raise exception 'dev_disabled';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status <> 'aguardando' then
    raise exception 'order_not_pending';
  end if;

  select coalesce(max(ends_at), now())
  into v_base
  from public.grants
  where user_id = v_uid
    and kind = 'mensal'
    and status = 'ativo'
    and ends_at > now();

  insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
  values (
    v_uid,
    'mensal',
    now(),
    v_base + interval '30 days',
    'pedido:' || v_order.id,
    'ativo'
  );

  update public.orders
  set status = 'pago', paid_at = now()
  where id = v_order.id;
end;
$$;

-- Cria um nonce de uso único para o jogador voltar do Steam OpenID.
-- A origem é validada contra a lista do app_settings para evitar open redirect.
create or replace function public.create_steam_link_state(p_origin text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_origin text := regexp_replace(coalesce(p_origin, ''), '/+$', '');
  v_state uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if v_origin = '' or v_origin <> coalesce(p_origin, '') then
    raise exception 'origin_not_allowed';
  end if;

  if not exists (
    select 1
    from public.app_settings s
    where s.id = 1 and v_origin = any (s.allowed_origins)
  ) then
    raise exception 'origin_not_allowed';
  end if;

  delete from public.steam_link_states where user_id = v_uid;

  insert into public.steam_link_states (user_id, return_origin)
  values (v_uid, v_origin)
  returning state into v_state;

  return v_state;
end;
$$;

-- ------------------------------------------------------------
-- 4b. Administração
-- ------------------------------------------------------------

-- Registro interno. Não é exposto como RPC.
create or replace function public.admin_log_write(
  p_action text,
  p_target text,
  p_detail jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.admin_log (admin_id, action, target, detail)
  values (auth.uid(), p_action, p_target, coalesce(p_detail, '{}'::jsonb));
$$;

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return jsonb_build_object(
    'accounts', (select count(*) from public.profiles),
    'admins', (select count(*) from public.profiles where is_admin),
    'devs', (select count(*) from public.profiles where is_dev),
    'steam_verified', (
      select count(*) from public.profiles where steam ->> 'verificado' = 'true'
    ),
    'servers_total', (select count(*) from public.servers),
    'servers_pending', (select count(*) from public.servers where status = 'em_analise'),
    'servers_active', (select count(*) from public.servers where status = 'ativo'),
    'servers_paused', (select count(*) from public.servers where status = 'pausado'),
    'servers_closed', (select count(*) from public.servers where status = 'encerrado'),
    'guests', (select count(*) from public.server_guests),
    'grants_active', (
      select count(*) from public.grants
      where status = 'ativo' and (ends_at is null or ends_at > now())
    ),
    'orders_pending', (select count(*) from public.orders where status = 'aguardando'),
    'orders_paid', (select count(*) from public.orders where status = 'pago'),
    'revenue_cents', coalesce(
      (select sum(amount_cents) from public.orders where status = 'pago'), 0
    ),
    'revenue_30d_cents', coalesce((
      select sum(amount_cents) from public.orders
      where status = 'pago' and paid_at is not null and paid_at > now() - interval '30 days'
    ), 0),
    'gateway_ready', coalesce((
      select gateway_enabled and (gateway_provider = 'manual' or gateway_access_token <> '')
      from public.app_settings where id = 1
    ), false)
  );
end;
$$;

create or replace function public.admin_list_accounts(
  p_search text default '',
  p_limit integer default 300
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_search text := lower(btrim(coalesce(p_search, '')));
  v_limit integer := greatest(1, least(coalesce(p_limit, 300), 500));
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'display_name', q.display_name,
        'email', q.email,
        'avatar_url', q.avatar_url,
        'steam', q.steam,
        'is_admin', q.is_admin,
        'is_dev', q.is_dev,
        'created_at', q.created_at,
        'last_login_at', q.last_login_at,
        'grants', coalesce(q.grants, '[]'::jsonb),
        'server', q.server,
        'orders_count', q.orders_count,
        'spent_cents', q.spent_cents
      )
      order by q.created_at desc
    )
    from (
      select
        p.id,
        p.display_name,
        p.email,
        p.avatar_url,
        p.steam,
        p.is_admin,
        p.is_dev,
        p.created_at,
        p.last_login_at,
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'kind', g.kind,
              'starts_at', g.starts_at,
              'ends_at', g.ends_at,
              'source', g.source,
              'status', g.status,
              'created_at', g.created_at
            )
            order by g.created_at desc
          )
          from public.grants g
          where g.user_id = p.id
        ) as grants,
        (
          select jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'status', s.status,
            'code', s.code,
            'slots', s.slots,
            'created_at', s.created_at
          )
          from public.servers s
          where s.owner_id = p.id
          order by s.created_at desc
          limit 1
        ) as server,
        (select count(*) from public.orders o where o.user_id = p.id) as orders_count,
        coalesce((
          select sum(o.amount_cents) from public.orders o
          where o.user_id = p.id and o.status = 'pago'
        ), 0) as spent_cents
      from public.profiles p
      where v_search = ''
         or lower(p.display_name) like '%' || v_search || '%'
         or lower(p.email) like '%' || v_search || '%'
      order by p.created_at desc
      limit v_limit
    ) q
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_update_account(
  p_user_id uuid,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_display_name, ''), '\s+', ' ', 'g'));
  v_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 40 then
    raise exception 'invalid_name';
  end if;

  update public.profiles
  set display_name = v_name
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'user_not_found';
  end if;

  perform public.admin_log_write(
    'account.rename',
    p_user_id::text,
    jsonb_build_object('name', v_name)
  );

  return jsonb_build_object('id', v_profile.id, 'display_name', v_profile.display_name);
end;
$$;

create or replace function public.admin_set_admin(
  p_user_id uuid,
  p_is_admin boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if p_user_id = v_uid and not p_is_admin then
    raise exception 'cannot_demote_self';
  end if;

  -- Evita que dois admins se rebaixem ao mesmo tempo e deixem o site sem nenhum.
  perform pg_advisory_xact_lock(hashtext('public.admin_set_admin'));

  if not p_is_admin and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'last_admin';
  end if;

  update public.profiles
  set is_admin = p_is_admin
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'user_not_found';
  end if;

  perform public.admin_log_write(
    'account.admin',
    p_user_id::text,
    jsonb_build_object('is_admin', p_is_admin)
  );

  return jsonb_build_object('id', v_profile.id, 'is_admin', v_profile.is_admin);
end;
$$;

-- Promove ou remove o papel de desenvolvedor. O desenvolvedor lê a
-- documentação da source; não ganha poderes administrativos.
create or replace function public.admin_set_dev(
  p_user_id uuid,
  p_is_dev boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  update public.profiles
  set is_dev = p_is_dev
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'user_not_found';
  end if;

  perform public.admin_log_write(
    'account.dev',
    p_user_id::text,
    jsonb_build_object('is_dev', p_is_dev)
  );

  return jsonb_build_object('id', v_profile.id, 'is_dev', v_profile.is_dev);
end;
$$;

create or replace function public.admin_grant_access(
  p_user_id uuid,
  p_kind text,
  p_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := lower(btrim(coalesce(p_kind, '')));
  v_days integer := greatest(1, least(coalesce(p_days, 30), 3650));
  v_base timestamptz := now();
  v_grant public.grants;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_kind not in ('mensal', 'vitalicio', 'cortesia') then
    raise exception 'invalid_kind';
  end if;

  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user_not_found';
  end if;

  if v_kind = 'vitalicio' and exists (
    select 1 from public.grants
    where user_id = p_user_id and kind = 'vitalicio' and status = 'ativo'
  ) then
    raise exception 'grant_exists';
  end if;

  if v_kind in ('mensal', 'cortesia') then
    select coalesce(max(ends_at), now())
    into v_base
    from public.grants
    where user_id = p_user_id
      and kind = v_kind
      and status = 'ativo'
      and ends_at is not null
      and ends_at > now();
  end if;

  insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
  values (
    p_user_id,
    v_kind,
    now(),
    case
      when v_kind = 'vitalicio' then null
      else v_base + make_interval(days => v_days)
    end,
    'admin:' || v_uid::text,
    'ativo'
  )
  returning * into v_grant;

  perform public.admin_log_write(
    'access.grant',
    p_user_id::text,
    jsonb_build_object(
      'kind', v_kind,
      'days', case when v_kind = 'vitalicio' then null else v_days end
    )
  );

  return jsonb_build_object(
    'id', v_grant.id,
    'kind', v_grant.kind,
    'starts_at', v_grant.starts_at,
    'ends_at', v_grant.ends_at,
    'status', v_grant.status
  );
end;
$$;

create or replace function public.admin_revoke_grant(p_grant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_grant public.grants;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select * into v_grant
  from public.grants
  where id = p_grant_id
  for update;

  if not found then
    raise exception 'grant_not_found';
  end if;
  if v_grant.status <> 'ativo' then
    raise exception 'grant_not_active';
  end if;

  -- O acesso vitalício do dono é consequência do servidor ativo. Para
  -- revogá-lo, o admin precisa pausar ou encerrar o servidor primeiro.
  if v_grant.kind = 'vitalicio' and v_grant.source like 'servidor:%' then
    if exists (
      select 1 from public.servers s
      where 'servidor:' || s.id = v_grant.source and s.status = 'ativo'
    ) then
      raise exception 'grant_locked_server';
    end if;
  end if;

  update public.grants
  set status = 'revogado'
  where id = p_grant_id;

  perform public.admin_log_write(
    'access.revoke',
    v_grant.user_id::text,
    jsonb_build_object('grant_id', v_grant.id, 'kind', v_grant.kind)
  );

  return jsonb_build_object('id', v_grant.id, 'status', 'revogado');
end;
$$;

create or replace function public.admin_list_servers()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'region', s.region,
        'slots', s.slots,
        'discord', s.discord,
        'description', s.description,
        'status', s.status,
        'code', s.code,
        'created_at', s.created_at,
        'activated_at', s.activated_at,
        'paused_at', s.paused_at,
        'closed_at', s.closed_at,
        'owner_id', s.owner_id,
        'owner_name', p.display_name,
        'owner_email', p.email,
        'owner_steam', p.steam ->> 'nome',
        'owner_steam_verified', coalesce(p.steam ->> 'verificado' = 'true', false),
        'guest_count', (
          select count(*) from public.server_guests g where g.server_id = s.id
        ),
        'lifetime_active', exists (
          select 1 from public.grants gr
          where gr.user_id = s.owner_id
            and gr.source = 'servidor:' || s.id
            and gr.kind = 'vitalicio'
            and gr.status = 'ativo'
        )
      )
      order by s.created_at desc
    )
    from public.servers s
    join public.profiles p on p.id = s.owner_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_set_server_status(
  p_server_id uuid,
  p_status text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_server public.servers;
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_old_status text;
  v_source text := 'servidor:' || p_server_id;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_status not in ('ativo', 'pausado', 'encerrado') then
    raise exception 'invalid_status';
  end if;

  select * into v_server
  from public.servers
  where id = p_server_id
  for update;

  if not found then
    raise exception 'server_not_found';
  end if;

  v_old_status := v_server.status;
  if v_old_status = v_status then
    raise exception 'invalid_transition';
  end if;
  if v_old_status = 'em_analise' and v_status = 'pausado' then
    raise exception 'invalid_transition';
  end if;
  if v_old_status = 'encerrado' and v_status = 'pausado' then
    raise exception 'invalid_transition';
  end if;

  -- Um jogador só pode manter um servidor ativo por vez. Reativar um servidor
  -- antigo enquanto outro está no ar deixaria dois códigos válidos e dois
  -- acessos vitalícios para a mesma conta.
  if v_status = 'ativo' and exists (
    select 1 from public.servers s
    where s.owner_id = v_server.owner_id
      and s.status = 'ativo'
      and s.id <> p_server_id
  ) then
    raise exception 'owner_has_active_server';
  end if;

  update public.servers
  set status = v_status,
      activated_at = case
        when v_status = 'ativo' then coalesce(activated_at, now())
        else activated_at
      end,
      paused_at = case
        when v_status = 'pausado' then now()
        when v_status = 'ativo' then null
        else paused_at
      end,
      closed_at = case
        when v_status = 'encerrado' then now()
        when v_status = 'ativo' then null
        else closed_at
      end
  where id = p_server_id
  returning * into v_server;

  if v_status = 'ativo' then
    if not exists (
      select 1 from public.grants
      where user_id = v_server.owner_id
        and source = v_source
        and kind = 'vitalicio'
        and status = 'ativo'
    ) then
      insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
      values (v_server.owner_id, 'vitalicio', now(), null, v_source, 'ativo');
    end if;
  elsif v_status in ('pausado', 'encerrado') then
    update public.grants
    set status = 'revogado'
    where user_id = v_server.owner_id
      and source = v_source
      and status = 'ativo';
  end if;

  perform public.admin_log_write(
    'server.status',
    p_server_id::text,
    jsonb_build_object(
      'from', v_old_status,
      'to', v_status,
      'note', left(coalesce(p_note, ''), 200)
    )
  );

  return jsonb_build_object(
    'id', v_server.id,
    'status', v_server.status,
    'activated_at', v_server.activated_at,
    'paused_at', v_server.paused_at,
    'closed_at', v_server.closed_at
  );
end;
$$;

create or replace function public.admin_list_orders()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'user_name', p.display_name,
        'user_email', p.email,
        'plan', o.plan,
        'amount_cents', o.amount_cents,
        'status', o.status,
        'created_at', o.created_at,
        'paid_at', o.paid_at,
        'method', o.method
      )
      order by o.created_at desc
    )
    from public.orders o
    join public.profiles p on p.id = o.user_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_base timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_status not in ('pago', 'cancelado') then
    raise exception 'invalid_status';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status <> 'aguardando' then
    raise exception 'order_not_pending';
  end if;

  if v_status = 'pago' then
    select coalesce(max(ends_at), now())
    into v_base
    from public.grants
    where user_id = v_order.user_id
      and kind = 'mensal'
      and status = 'ativo'
      and ends_at > now();

    insert into public.grants (user_id, kind, starts_at, ends_at, source, status)
    values (
      v_order.user_id,
      'mensal',
      now(),
      v_base + interval '30 days',
      'pedido:' || v_order.id,
      'ativo'
    );

    update public.orders
    set status = 'pago', paid_at = now()
    where id = v_order.id
    returning * into v_order;
  else
    update public.orders
    set status = 'cancelado'
    where id = v_order.id
    returning * into v_order;
  end if;

  perform public.admin_log_write(
    'order.status',
    p_order_id::text,
    jsonb_build_object(
      'from', 'aguardando',
      'to', v_status,
      'user_id', v_order.user_id
    )
  );

  return jsonb_build_object(
    'id', v_order.id,
    'status', v_order.status,
    'paid_at', v_order.paid_at
  );
end;
$$;

create or replace function public.admin_get_settings()
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return (
    select jsonb_build_object(
      'gateway', jsonb_build_object(
        'provider', gateway_provider,
        'enabled', gateway_enabled,
        'environment', gateway_environment,
        'public_key', gateway_public_key,
        'has_access_token', gateway_access_token <> '',
        'has_webhook_secret', gateway_webhook_secret <> '',
        'updated_at', gateway_updated_at
      ),
      'site', jsonb_build_object(
        'allowed_origins', to_jsonb(allowed_origins),
        'dev_mode', dev_mode
      )
    )
    from public.app_settings
    where id = 1
  );
end;
$$;

create or replace function public.admin_set_gateway(
  p_provider text,
  p_enabled boolean,
  p_environment text,
  p_public_key text default '',
  p_access_token text default null,
  p_webhook_secret text default null,
  p_clear_access_token boolean default false,
  p_clear_webhook_secret boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_provider text := lower(btrim(coalesce(p_provider, '')));
  v_environment text := lower(btrim(coalesce(p_environment, 'test')));
  v_enabled boolean := coalesce(p_enabled, false);
  v_public_key text := btrim(coalesce(p_public_key, ''));
  v_access_token text := nullif(btrim(coalesce(p_access_token, '')), '');
  v_webhook_secret text := nullif(btrim(coalesce(p_webhook_secret, '')), '');
  v_has_token boolean;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if v_provider not in ('manual', 'mercadopago', 'stripe') then
    raise exception 'gateway_provider_invalid';
  end if;
  if v_environment not in ('test', 'production') then
    raise exception 'gateway_environment_invalid';
  end if;
  if char_length(v_public_key) > 500
     or char_length(coalesce(v_access_token, '')) > 4000
     or char_length(coalesce(v_webhook_secret, '')) > 1000 then
    raise exception 'gateway_value_too_long';
  end if;

  select gateway_access_token <> '' into v_has_token
  from public.app_settings
  where id = 1;
  v_has_token := coalesce(v_has_token, false);

  if p_clear_access_token then
    v_has_token := false;
  elsif v_access_token is not null then
    v_has_token := true;
  end if;

  if v_enabled and v_provider <> 'manual' and not v_has_token then
    raise exception 'gateway_token_required';
  end if;

  update public.app_settings
  set gateway_provider = v_provider,
      gateway_enabled = v_enabled,
      gateway_environment = v_environment,
      gateway_public_key = v_public_key,
      gateway_access_token = case
        when p_clear_access_token then ''
        when v_access_token is not null then v_access_token
        else gateway_access_token
      end,
      gateway_webhook_secret = case
        when p_clear_webhook_secret then ''
        when v_webhook_secret is not null then v_webhook_secret
        else gateway_webhook_secret
      end,
      gateway_updated_at = now()
  where id = 1;

  perform public.admin_log_write(
    'gateway.update',
    null,
    jsonb_build_object(
      'provider', v_provider,
      'environment', v_environment,
      'enabled', v_enabled,
      'has_token', v_has_token
    )
  );

  return public.admin_get_settings();
end;
$$;

create or replace function public.admin_set_origins(p_origins text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_origins text[];
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select array_agg(distinct btrim(o) order by btrim(o))
  into v_origins
  from unnest(coalesce(p_origins, array[]::text[])) o
  where btrim(o) <> '';

  if v_origins is null
     or array_length(v_origins, 1) is null
     or array_length(v_origins, 1) > 10 then
    raise exception 'invalid_origins';
  end if;

  if exists (
    select 1 from unnest(v_origins) o
    where o !~ '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'
  ) then
    raise exception 'invalid_origins';
  end if;

  update public.app_settings
  set allowed_origins = v_origins,
      updated_at = now()
  where id = 1;

  perform public.admin_log_write(
    'site.origins',
    null,
    jsonb_build_object('origins', to_jsonb(v_origins))
  );

  return jsonb_build_object('allowed_origins', to_jsonb(v_origins));
end;
$$;

create or replace function public.admin_set_dev_mode(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enabled boolean := coalesce(p_enabled, false);
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  update public.app_settings
  set dev_mode = v_enabled,
      updated_at = now()
  where id = 1;

  perform public.admin_log_write(
    'site.dev_mode',
    null,
    jsonb_build_object('enabled', v_enabled)
  );

  return jsonb_build_object('dev_mode', v_enabled);
end;
$$;

create or replace function public.admin_list_log(p_limit integer default 100)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'admin_id', l.admin_id,
        'admin_name', p.display_name,
        'admin_email', p.email,
        'action', l.action,
        'target', l.target,
        'detail', l.detail,
        'created_at', l.created_at
      )
      order by l.created_at desc
    )
    from (
      select *
      from public.admin_log
      order by created_at desc
      limit greatest(1, least(coalesce(p_limit, 100), 300))
    ) l
    left join public.profiles p on p.id = l.admin_id
  ), '[]'::jsonb);
end;
$$;

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.grants enable row level security;
alter table public.servers enable row level security;
alter table public.server_guests enable row level security;
alter table public.orders enable row level security;
alter table public.steam_link_states enable row level security;
alter table public.admin_log enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists grants_select on public.grants;
create policy grants_select on public.grants
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- O código do servidor fica na linha: só o dono, os convidados e admins leem.
drop policy if exists servers_select on public.servers;
create policy servers_select on public.servers
  for select to authenticated
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or public.is_server_guest(id)
  );

drop policy if exists guests_select on public.server_guests;
create policy guests_select on public.server_guests
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.owns_server(server_id)
  );

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- app_settings e admin_log não têm policy: só as funções SECURITY DEFINER leem.
revoke all on table public.admin_log from anon, authenticated;

-- ------------------------------------------------------------
-- 6. Permissões
-- ------------------------------------------------------------

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_dev() from public, anon;
revoke execute on function public.dev_tools_enabled() from public, anon;
revoke execute on function public.owns_server(uuid) from public, anon;
revoke execute on function public.is_server_guest(uuid) from public, anon;
revoke execute on function public.create_server(text, text, integer, text, text) from public, anon;
revoke execute on function public.set_server_status(uuid, text) from public, anon;
revoke execute on function public.redeem_server_code(text) from public, anon;
revoke execute on function public.create_monthly_order() from public, anon;
revoke execute on function public.dev_pay_order(uuid) from public, anon;
revoke execute on function public.create_steam_link_state(text) from public, anon;

-- Administração: o cliente autenticado pode chamar, mas cada função confere
-- is_admin() internamente. O log é interno e não pode ser escrito pelo cliente.
revoke execute on function public.admin_log_write(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_dashboard() from public, anon;
revoke execute on function public.admin_list_accounts(text, integer) from public, anon;
revoke execute on function public.admin_update_account(uuid, text) from public, anon;
revoke execute on function public.admin_set_admin(uuid, boolean) from public, anon;
revoke execute on function public.admin_grant_access(uuid, text, integer) from public, anon;
revoke execute on function public.admin_revoke_grant(uuid) from public, anon;
revoke execute on function public.admin_list_servers() from public, anon;
revoke execute on function public.admin_set_server_status(uuid, text, text) from public, anon;
revoke execute on function public.admin_list_orders() from public, anon;
revoke execute on function public.admin_set_order_status(uuid, text) from public, anon;
revoke execute on function public.admin_get_settings() from public, anon;
revoke execute on function public.admin_set_gateway(text, boolean, text, text, text, text, boolean, boolean) from public, anon;
revoke execute on function public.admin_set_origins(text[]) from public, anon;
revoke execute on function public.admin_set_dev_mode(boolean) from public, anon;
revoke execute on function public.admin_list_log(integer) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_dev() to authenticated;
grant execute on function public.dev_tools_enabled() to authenticated;
grant execute on function public.owns_server(uuid) to authenticated;
grant execute on function public.is_server_guest(uuid) to authenticated;
grant execute on function public.create_server(text, text, integer, text, text) to authenticated;
grant execute on function public.set_server_status(uuid, text) to authenticated;
grant execute on function public.redeem_server_code(text) to authenticated;
grant execute on function public.create_monthly_order() to authenticated;
grant execute on function public.dev_pay_order(uuid) to authenticated;
grant execute on function public.create_steam_link_state(text) to authenticated;

grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_list_accounts(text, integer) to authenticated;
grant execute on function public.admin_update_account(uuid, text) to authenticated;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;
grant execute on function public.admin_set_dev(uuid, boolean) to authenticated;
grant execute on function public.admin_grant_access(uuid, text, integer) to authenticated;
grant execute on function public.admin_revoke_grant(uuid) to authenticated;
grant execute on function public.admin_list_servers() to authenticated;
grant execute on function public.admin_set_server_status(uuid, text, text) to authenticated;
grant execute on function public.admin_list_orders() to authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.admin_get_settings() to authenticated;
grant execute on function public.admin_set_gateway(text, boolean, text, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.admin_set_origins(text[]) to authenticated;
grant execute on function public.admin_set_dev_mode(boolean) to authenticated;
grant execute on function public.admin_list_log(integer) to authenticated;

-- ------------------------------------------------------------
-- 7. Storage dos avatares
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid())
  with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());

-- ============================================================
-- Fim. Depois de criar sua conta no site, torne-se admin com:
--   update public.profiles set is_admin = true where email = 'seu@email';
-- Antes de abrir ao público, desligue as ferramentas de teste:
--   update public.app_settings set dev_mode = false;
-- ============================================================
