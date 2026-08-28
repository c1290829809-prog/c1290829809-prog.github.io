-- 循迹 Supabase 安全初始化（PostgreSQL）
-- 可重复执行。执行后匿名用户无法修改地点、爱豆、作品或城市。

create table if not exists public.places (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.idols (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.works (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.cities (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.feedback (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.events (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());

alter table public.places enable row level security;
alter table public.idols enable row level security;
alter table public.works enable row level security;
alter table public.cities enable row level security;
alter table public.feedback enable row level security;
alter table public.events enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()); $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

-- 清除旧的宽松策略，避免新旧策略同时存在时继续放行匿名写入。
do $$
declare target_table text; policy_row record;
begin
  foreach target_table in array array['places','idols','works','cities','feedback','events','admin_users'] loop
    for policy_row in select policyname from pg_policies where schemaname='public' and tablename=target_table loop
      execute format('drop policy if exists %I on public.%I',policy_row.policyname,target_table);
    end loop;
  end loop;
end $$;

revoke all on public.places,public.idols,public.works,public.cities,public.feedback,public.events,public.admin_users from anon,authenticated;
grant select on public.places,public.idols,public.works,public.cities to anon,authenticated;
grant insert,update,delete on public.places,public.idols,public.works,public.cities to authenticated;
grant insert on public.feedback,public.events to anon,authenticated;
grant select,update,delete on public.feedback,public.events to authenticated;

create policy "places public published read" on public.places for select to anon,authenticated using ((data->>'status'='published') or public.is_admin());
create policy "places admin write" on public.places for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "idols public read" on public.idols for select to anon,authenticated using (true);
create policy "idols admin write" on public.idols for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "works public read" on public.works for select to anon,authenticated using (true);
create policy "works admin write" on public.works for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cities public read" on public.cities for select to anon,authenticated using (true);
create policy "cities admin write" on public.cities for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "feedback public submit" on public.feedback for insert to anon,authenticated with check (data->>'status'='unread' and coalesce(data->>'content','')<>'' and data->>'reply' is null);
create policy "feedback admin manage" on public.feedback for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "events public submit" on public.events for insert to anon,authenticated with check (data->>'type' in ('page_view','favorite_click','route_generate','route_add','search_submit') and coalesce(data->>'time','')<>'');
create policy "events admin manage" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());

select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('places','idols','works','cities','feedback','events','admin_users') order by tablename;
