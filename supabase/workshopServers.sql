-- SourceDayZ Workshop server registry and mod synchronization.
-- Apply after workshopMods.sql. The token hash below only authorizes the local
-- DayZ 0.45.124252 server; the raw token stays in the server host's AppData.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.workshop_server_registry (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  server_name text not null check (char_length(btrim(server_name)) between 3 and 120),
  game_port integer not null check (game_port between 1 and 65535),
  public_ip inet,
  mod_folders text[] not null default '{}',
  enabled boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshop_server_mod_folders_limit check (cardinality(mod_folders) <= 32)
);

create index if not exists workshop_server_registry_public_idx
  on public.workshop_server_registry(enabled, server_name, game_port);

alter table public.workshop_server_registry enable row level security;
revoke all on public.workshop_server_registry from anon, authenticated;

create or replace function public.workshop_server_heartbeat(
  p_token text,
  p_server_name text,
  p_game_port integer,
  p_public_ip inet,
  p_mod_folders text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_token_hash text;
  v_server public.workshop_server_registry%rowtype;
  v_folders text[];
  v_published_mods jsonb;
  v_unpublished_folders jsonb;
  v_ip inet;
begin
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'server_auth_invalid';
  end if;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  select * into v_server
    from public.workshop_server_registry
   where token_hash = v_token_hash and enabled
   for update;
  if not found then raise exception 'server_auth_invalid'; end if;

  if p_server_name is null or char_length(btrim(p_server_name)) not between 3 and 120 then
    raise exception 'server_name_invalid';
  end if;
  if p_game_port is null or p_game_port not between 1 and 65535 then
    raise exception 'server_port_invalid';
  end if;
  if coalesce(array_length(p_mod_folders, 1), 0) > 32 then
    raise exception 'server_mod_folder_invalid';
  end if;
  if exists (
    select 1
      from unnest(coalesce(p_mod_folders, '{}'::text[])) as input(folder)
     where btrim(folder) !~ '^@[A-Za-z0-9._-]{1,80}$'
  ) then
    raise exception 'server_mod_folder_invalid';
  end if;

  select coalesce(array_agg(distinct btrim(folder) order by btrim(folder)), '{}'::text[])
    into v_folders
    from unnest(coalesce(p_mod_folders, '{}'::text[])) as input(folder)
   where btrim(folder) <> '';

  v_ip := coalesce(p_public_ip, v_server.public_ip);
  update public.workshop_server_registry
     set server_name = btrim(p_server_name),
         game_port = p_game_port,
         public_ip = v_ip,
         mod_folders = v_folders,
         last_seen_at = now(),
         updated_at = now()
   where id = v_server.id;

  select coalesce(
           jsonb_agg(jsonb_build_object('id', m.id::text, 'folder', m.file_name) order by m.file_name),
           '[]'::jsonb
         )
    into v_published_mods
    from public.workshop_mods m
    join unnest(v_folders) as requested(folder)
      on lower(m.file_name) = lower(requested.folder)
   where m.status = 'published';

  select coalesce(jsonb_agg(to_jsonb(requested.folder) order by requested.folder), '[]'::jsonb)
    into v_unpublished_folders
    from unnest(v_folders) as requested(folder)
   where not exists (
     select 1 from public.workshop_mods m
      where m.status = 'published' and lower(m.file_name) = lower(requested.folder)
   );

  return jsonb_build_object(
    'ok', true,
    'serverName', btrim(p_server_name),
    'ip', v_ip::text,
    'port', p_game_port,
    'mods', v_published_mods,
    'unpublishedFolders', v_unpublished_folders
  );
end;
$$;

create or replace function public.workshop_server_manifest()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'servers', coalesce(jsonb_agg(server_row.entry order by server_row.server_name, server_row.game_port), '[]'::jsonb)
  )
  from (
    select r.server_name,
           r.game_port,
           jsonb_build_object(
             'ip', r.public_ip::text,
             'name', r.server_name,
             'port', r.game_port,
             'mods', coalesce((
               select jsonb_agg(jsonb_build_object('id', m.id::text, 'folder', m.file_name) order by m.file_name)
                 from unnest(r.mod_folders) as requested(folder)
                 join public.workshop_mods m on lower(m.file_name) = lower(requested.folder)
                where m.status = 'published'
             ), '[]'::jsonb)
           ) as entry
      from public.workshop_server_registry r
     where r.enabled and r.last_seen_at is not null
  ) as server_row;
$$;

revoke all on function public.workshop_server_heartbeat(text, text, integer, inet, text[]) from public;
grant execute on function public.workshop_server_heartbeat(text, text, integer, inet, text[]) to anon, authenticated;
revoke all on function public.workshop_server_manifest() from public;
grant execute on function public.workshop_server_manifest() to anon, authenticated;

insert into public.workshop_server_registry (token_hash, server_name, game_port, enabled)
values ('cb9a6144c0c6af35bb14b49cc1b96e8e7277f7560956eb45f439c6ce0b25ff22', 'DayZ 0.45.124252 Local Server', 2302, true)
on conflict (token_hash) do update
  set server_name = excluded.server_name,
      game_port = excluded.game_port,
      enabled = true,
      updated_at = now();
