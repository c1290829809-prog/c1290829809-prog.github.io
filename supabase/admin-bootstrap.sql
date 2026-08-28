-- 先在 Supabase Dashboard → Authentication → Users 创建邮箱密码用户。
-- 然后把下面 target_email 改为你的管理员邮箱并运行本文件。

do $$
declare
  target_email text := 'YOUR_ADMIN_EMAIL';
  target_user_id uuid;
begin
  if target_email = 'YOUR_ADMIN_EMAIL' then
    raise exception '请先把 YOUR_ADMIN_EMAIL 替换为管理员邮箱';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'Authentication 中没有找到邮箱 %，请先创建用户',target_email;
  end if;

  insert into public.admin_users(user_id)
  values(target_user_id)
  on conflict(user_id) do nothing;
end $$;

select users.email,admins.created_at
from public.admin_users admins
join auth.users users on users.id=admins.user_id
order by admins.created_at;
