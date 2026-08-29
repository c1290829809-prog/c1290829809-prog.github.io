-- 循迹云端图片存储初始化：可重复执行。
-- 仅管理员可上传、替换或删除；所有访客可读取公开图片。

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('xunji-media','xunji-media',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "xunji media public read" on storage.objects;
drop policy if exists "xunji media admin upload" on storage.objects;
drop policy if exists "xunji media admin update" on storage.objects;
drop policy if exists "xunji media admin delete" on storage.objects;

create policy "xunji media public read" on storage.objects
for select to public using (bucket_id='xunji-media');

create policy "xunji media admin upload" on storage.objects
for insert to authenticated with check (bucket_id='xunji-media' and public.is_admin());

create policy "xunji media admin update" on storage.objects
for update to authenticated using (bucket_id='xunji-media' and public.is_admin()) with check (bucket_id='xunji-media' and public.is_admin());

create policy "xunji media admin delete" on storage.objects
for delete to authenticated using (bucket_id='xunji-media' and public.is_admin());
