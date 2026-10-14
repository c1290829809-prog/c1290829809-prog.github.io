-- 循迹普通用户账号与个人数据云同步
-- 可重复执行，不会删除现有业务数据。

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from anon,authenticated;
grant select,insert,update,delete on public.user_preferences to authenticated;

drop policy if exists "users manage own preferences" on public.user_preferences;
create policy "users manage own preferences"
on public.user_preferences
for all
to authenticated
using (auth.uid()=user_id)
with check (auth.uid()=user_id);

select tablename,rowsecurity
from pg_tables
where schemaname='public' and tablename='user_preferences';
