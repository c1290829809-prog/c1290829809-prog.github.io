-- 在 schema.sql 和 admin-bootstrap.sql 成功执行后运行。
-- 期望：content_anon_write 全部为 false；feedback/events 的 public_insert 为 true。

select
  has_table_privilege('anon','public.places','insert,update,delete') as places_anon_write,
  has_table_privilege('anon','public.idols','insert,update,delete') as idols_anon_write,
  has_table_privilege('anon','public.works','insert,update,delete') as works_anon_write,
  has_table_privilege('anon','public.cities','insert,update,delete') as cities_anon_write,
  has_table_privilege('anon','public.feedback','insert') as feedback_public_insert,
  has_table_privilege('anon','public.events','insert') as events_public_insert;

select tablename,policyname,cmd,roles
from pg_policies
where schemaname='public'
  and tablename in ('places','idols','works','cities','feedback','events','admin_users')
order by tablename,policyname;

select
  (select count(*) from public.places) as places,
  (select count(*) from public.idols) as idols,
  (select count(*) from public.works) as works,
  (select count(*) from public.cities) as cities,
  (select count(*) from public.feedback) as feedback,
  (select count(*) from public.events) as events,
  (select count(*) from public.admin_users) as admins;
