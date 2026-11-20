-- SourceDayZ Workshop Mods
-- Apply after supabase/schema.sql in the Supabase SQL Editor.

create table if not exists public.workshop_mods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 80),
  summary text not null check (char_length(btrim(summary)) between 12 and 220),
  description text not null check (char_length(btrim(description)) between 20 and 12000),
  category text not null check (category in ('armas', 'mapas', 'sobrevivencia', 'veiculos', 'interface', 'ferramentas', 'outros')),
  game_version text not null default '0.45.124252' check (char_length(game_version) <= 40),
  version text not null check (char_length(btrim(version)) between 1 and 32),
  tags text[] not null default '{}',
  installation text not null check (char_length(btrim(installation)) between 5 and 3000),
  cover_path text,
  file_path text not null,
  file_name text not null,
  file_size bigint not null check (file_size > 0),
  download_count bigint not null default 0 check (download_count >= 0),
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshop_mods_tags_limit check (cardinality(tags) <= 8)
);

create table if not exists public.workshop_mod_versions (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.workshop_mods(id) on delete cascade,
  version text not null check (char_length(btrim(version)) between 1 and 32),
  file_path text not null,
  file_name text not null,
  file_size bigint not null check (file_size > 0),
  notes text not null default '' check (char_length(notes) <= 3000),
  created_by uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  unique (mod_id, version)
);

create table if not exists public.workshop_comments (
  id uuid primary key default gen_random_uuid(),
  mod_id uuid not null references public.workshop_mods(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  body text not null check (char_length(btrim(body)) between 2 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.workshop_ratings (
  mod_id uuid not null references public.workshop_mods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (mod_id, user_id)
);

create table if not exists public.workshop_subscriptions (
  mod_id uuid not null references public.workshop_mods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (mod_id, user_id)
);

create index if not exists workshop_mods_catalog_idx on public.workshop_mods(status, created_at desc);
create index if not exists workshop_mods_category_idx on public.workshop_mods(category, created_at desc) where status = 'published';
create index if not exists workshop_mods_owner_idx on public.workshop_mods(owner_id, updated_at desc);
create index if not exists workshop_versions_mod_idx on public.workshop_mod_versions(mod_id, created_at desc);
create index if not exists workshop_comments_mod_idx on public.workshop_comments(mod_id, created_at desc);

create or replace function public.workshop_set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.workshop_protect_download_count()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if auth.role() in ('anon', 'authenticated')
     and current_setting('app.workshop_system_write', true) is distinct from '1' then
    new.download_count := old.download_count;
  end if;
  return new;
end;
$$;

drop trigger if exists workshop_mods_updated_at on public.workshop_mods;
create trigger workshop_mods_updated_at before update on public.workshop_mods
for each row execute function public.workshop_set_updated_at();

drop trigger if exists workshop_mods_protect_download_count on public.workshop_mods;
create trigger workshop_mods_protect_download_count before update on public.workshop_mods
for each row execute function public.workshop_protect_download_count();

alter table public.workshop_mods enable row level security;
alter table public.workshop_mod_versions enable row level security;
alter table public.workshop_comments enable row level security;
alter table public.workshop_ratings enable row level security;
alter table public.workshop_subscriptions enable row level security;

drop policy if exists workshop_mods_public_read on public.workshop_mods;
create policy workshop_mods_public_read on public.workshop_mods
  for select to anon, authenticated using (status = 'published');
drop policy if exists workshop_mods_owner_read on public.workshop_mods;
create policy workshop_mods_owner_read on public.workshop_mods
  for select to authenticated using (owner_id = auth.uid() or public.is_admin());
drop policy if exists workshop_mods_insert on public.workshop_mods;
create policy workshop_mods_insert on public.workshop_mods
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists workshop_mods_update on public.workshop_mods;
create policy workshop_mods_update on public.workshop_mods
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
drop policy if exists workshop_mods_delete on public.workshop_mods;
create policy workshop_mods_delete on public.workshop_mods
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists workshop_versions_public_read on public.workshop_mod_versions;
create policy workshop_versions_public_read on public.workshop_mod_versions
  for select to anon, authenticated using (exists (
    select 1 from public.workshop_mods m where m.id = mod_id and m.status = 'published'
  ));
drop policy if exists workshop_versions_owner_read on public.workshop_mod_versions;
create policy workshop_versions_owner_read on public.workshop_mod_versions
  for select to authenticated using (exists (
    select 1 from public.workshop_mods m
    where m.id = mod_id and (m.owner_id = auth.uid() or public.is_admin())
  ));
drop policy if exists workshop_versions_insert on public.workshop_mod_versions;
create policy workshop_versions_insert on public.workshop_mod_versions
  for insert to authenticated with check (created_by = auth.uid() and exists (
    select 1 from public.workshop_mods m where m.id = mod_id and m.owner_id = auth.uid()
  ));
drop policy if exists workshop_versions_delete on public.workshop_mod_versions;
create policy workshop_versions_delete on public.workshop_mod_versions
  for delete to authenticated using (exists (
    select 1 from public.workshop_mods m
    where m.id = mod_id and (m.owner_id = auth.uid() or public.is_admin())
  ));

drop policy if exists workshop_comments_insert on public.workshop_comments;
create policy workshop_comments_insert on public.workshop_comments
  for insert to authenticated with check (author_id = auth.uid() and exists (
    select 1 from public.workshop_mods m where m.id = mod_id and m.status = 'published'
  ));
drop policy if exists workshop_comments_delete on public.workshop_comments;
create policy workshop_comments_delete on public.workshop_comments
  for delete to authenticated using (
    author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.workshop_mods m
      where m.id = mod_id and m.owner_id = auth.uid()
    )
  );

drop policy if exists workshop_ratings_public_read on public.workshop_ratings;
drop policy if exists workshop_ratings_owner_read on public.workshop_ratings;
create policy workshop_ratings_owner_read on public.workshop_ratings
  for select to authenticated using (user_id = auth.uid());
drop policy if exists workshop_ratings_insert on public.workshop_ratings;
create policy workshop_ratings_insert on public.workshop_ratings
  for insert to authenticated with check (user_id = auth.uid() and exists (
    select 1 from public.workshop_mods m where m.id = mod_id and m.status = 'published'
  ));
drop policy if exists workshop_ratings_update on public.workshop_ratings;
create policy workshop_ratings_update on public.workshop_ratings
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (
    select 1 from public.workshop_mods m where m.id = mod_id and m.status = 'published'
  ));
drop policy if exists workshop_ratings_delete on public.workshop_ratings;
create policy workshop_ratings_delete on public.workshop_ratings
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists workshop_subscriptions_read on public.workshop_subscriptions;
create policy workshop_subscriptions_read on public.workshop_subscriptions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists workshop_subscriptions_insert on public.workshop_subscriptions;
create policy workshop_subscriptions_insert on public.workshop_subscriptions
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.steam ->> 'verificado' = 'true'
        and coalesce(p.steam ->> 'steamId64', '') <> ''
    )
    and exists (
      select 1 from public.workshop_mods m where m.id = mod_id and m.status = 'published'
    )
  );
drop policy if exists workshop_subscriptions_delete on public.workshop_subscriptions;
create policy workshop_subscriptions_delete on public.workshop_subscriptions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.workshop_mods to authenticated;
grant select, insert, delete on public.workshop_mod_versions to authenticated;
grant select, insert, delete on public.workshop_comments to authenticated;
grant select, insert, update, delete on public.workshop_ratings to authenticated;
grant select, insert, delete on public.workshop_subscriptions to authenticated;
grant select on public.workshop_mods, public.workshop_mod_versions, public.workshop_ratings to anon;
revoke select on public.workshop_ratings from anon;
revoke all on public.workshop_comments, public.workshop_subscriptions from anon;

create or replace function public.workshop_list_mods(p_limit integer default 120, p_offset integer default 0)
returns table (
  id uuid, owner_id uuid, owner_name text, owner_avatar text,
  title text, summary text, description text, category text, game_version text,
  version text, tags text[], installation text, cover_path text, file_path text,
  file_name text, file_size bigint, download_count bigint,
  created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select m.id, m.owner_id, p.display_name, p.avatar_url,
         m.title, m.summary, m.description, m.category, m.game_version,
         m.version, m.tags, m.installation, m.cover_path, m.file_path,
         m.file_name, m.file_size, m.download_count, m.created_at, m.updated_at
  from public.workshop_mods m
  join public.profiles p on p.id = m.owner_id
  where m.status = 'published'
  order by m.created_at desc
  limit greatest(1, least(coalesce(p_limit, 120), 200))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.workshop_get_mod(p_mod_id uuid)
returns table (
  id uuid, owner_id uuid, owner_name text, owner_avatar text,
  title text, summary text, description text, category text, game_version text,
  version text, tags text[], installation text, cover_path text, file_path text,
  file_name text, file_size bigint, download_count bigint,
  created_at timestamptz, updated_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select m.id, m.owner_id, p.display_name, p.avatar_url,
         m.title, m.summary, m.description, m.category, m.game_version,
         m.version, m.tags, m.installation, m.cover_path, m.file_path,
         m.file_name, m.file_size, m.download_count, m.created_at, m.updated_at
  from public.workshop_mods m
  join public.profiles p on p.id = m.owner_id
  where m.id = p_mod_id
    and (m.status = 'published' or m.owner_id = auth.uid() or public.is_admin());
$$;

create or replace function public.workshop_public_comments(p_mod_id uuid)
returns table (id uuid, author_id uuid, author_name text, author_avatar text, body text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp
as $$
  select c.id, c.author_id, p.display_name, p.avatar_url, c.body, c.created_at
  from public.workshop_comments c
  join public.profiles p on p.id = c.author_id
  join public.workshop_mods m on m.id = c.mod_id
  where c.mod_id = p_mod_id and m.status = 'published'
  order by c.created_at desc
  limit 100;
$$;

create or replace function public.workshop_rating_stats(p_mod_id uuid default null)
returns table (mod_id uuid, rating_average numeric, rating_count bigint, my_rating smallint)
language sql stable security definer set search_path = public, pg_temp
as $$
  select m.id,
         coalesce(round(avg(r.rating)::numeric, 2), 0),
         count(r.rating),
         max(r.rating) filter (where r.user_id = auth.uid())
  from public.workshop_mods m
  left join public.workshop_ratings r on r.mod_id = m.id
  where m.status = 'published' and (p_mod_id is null or m.id = p_mod_id)
  group by m.id;
$$;

create or replace function public.workshop_record_download(p_mod_id uuid)
returns table (file_path text, file_name text, version text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id
      and p.steam ->> 'verificado' = 'true'
      and coalesce(p.steam ->> 'steamId64', '') <> ''
  ) then
    raise exception 'steam_link_required';
  end if;

  if not exists (
    select 1 from public.workshop_subscriptions s
    where s.user_id = v_user_id and s.mod_id = p_mod_id
  ) and not exists (
    select 1 from public.workshop_mods m
    where m.id = p_mod_id and m.owner_id = v_user_id
  ) then
    raise exception 'workshop_subscription_required';
  end if;

  perform set_config('app.workshop_system_write', '1', true);
  return query
  update public.workshop_mods m
     set download_count = m.download_count + 1
   where m.id = p_mod_id and (m.status = 'published' or m.owner_id = v_user_id)
  returning m.file_path, m.file_name, m.version;
  if not found then
    raise exception 'workshop_mod_unavailable';
  end if;
end;
$$;

create or replace function public.workshop_set_subscription(p_mod_id uuid, p_subscribed boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if coalesce(p_subscribed, false) then
    if not exists (
      select 1 from public.profiles p
      where p.id = v_user_id
        and p.steam ->> 'verificado' = 'true'
        and coalesce(p.steam ->> 'steamId64', '') <> ''
    ) then
      raise exception 'steam_link_required';
    end if;

    if not exists (
      select 1 from public.workshop_mods m
      where m.id = p_mod_id and m.status = 'published'
    ) then
      raise exception 'workshop_mod_unavailable';
    end if;

    insert into public.workshop_subscriptions (mod_id, user_id)
    values (p_mod_id, v_user_id)
    on conflict (mod_id, user_id) do nothing;
  else
    delete from public.workshop_subscriptions s
    where s.mod_id = p_mod_id and s.user_id = v_user_id;
  end if;

  return true;
end;
$$;

create or replace function public.workshop_my_subscriptions()
returns table (mod_id uuid, version text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp
as $$
  select s.mod_id, m.version, s.created_at
  from public.workshop_subscriptions s
  join public.workshop_mods m on m.id = s.mod_id
  where s.user_id = auth.uid() and m.status = 'published'
  order by s.created_at desc;
$$;

create or replace function public.workshop_can_read_file(p_path text)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workshop_mods m
    where (m.file_path = p_path or exists (
      select 1 from public.workshop_mod_versions v where v.mod_id = m.id and v.file_path = p_path
    ))
      and (
        m.owner_id = auth.uid()
        or public.is_admin()
        or (
          m.status = 'published'
          and exists (
            select 1 from public.workshop_subscriptions s
            where s.mod_id = m.id and s.user_id = auth.uid()
          )
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.steam ->> 'verificado' = 'true'
              and coalesce(p.steam ->> 'steamId64', '') <> ''
          )
        )
      )
  );
$$;

revoke all on function public.workshop_list_mods(integer, integer) from public;
revoke all on function public.workshop_get_mod(uuid) from public;
revoke all on function public.workshop_public_comments(uuid) from public;
revoke all on function public.workshop_rating_stats(uuid) from public;
revoke all on function public.workshop_record_download(uuid) from public;
revoke all on function public.workshop_set_subscription(uuid, boolean) from public;
revoke all on function public.workshop_my_subscriptions() from public;
revoke all on function public.workshop_can_read_file(text) from public;
grant execute on function public.workshop_list_mods(integer, integer) to anon, authenticated;
grant execute on function public.workshop_get_mod(uuid) to anon, authenticated;
grant execute on function public.workshop_public_comments(uuid) to anon, authenticated;
grant execute on function public.workshop_rating_stats(uuid) to anon, authenticated;
grant execute on function public.workshop_record_download(uuid) to authenticated;
grant execute on function public.workshop_set_subscription(uuid, boolean) to authenticated;
grant execute on function public.workshop_my_subscriptions() to authenticated;
grant execute on function public.workshop_can_read_file(text) to anon, authenticated;

insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'workshop-mod-files', 'workshop-mod-files', false,
  array['application/zip', 'application/x-zip-compressed', 'application/x-7z-compressed',
        'application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream']
)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workshop-mod-covers', 'workshop-mod-covers', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists workshop_files_insert on storage.objects;
create policy workshop_files_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'workshop-mod-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists workshop_files_select on storage.objects;
create policy workshop_files_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'workshop-mod-files' and public.workshop_can_read_file(name));
drop policy if exists workshop_files_delete on storage.objects;
create policy workshop_files_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'workshop-mod-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists workshop_covers_insert on storage.objects;
create policy workshop_covers_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'workshop-mod-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists workshop_covers_delete on storage.objects;
create policy workshop_covers_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'workshop-mod-covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
