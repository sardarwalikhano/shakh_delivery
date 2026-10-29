-- Public product images; only owners of approved stores may upload, replace, or delete images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "product images upload by store owner" on storage.objects;
create policy "product images upload by store owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
    and s.owner_id = (select auth.uid()) and s.is_approved = true
  )
);
drop policy if exists "product images update by store owner" on storage.objects;
create policy "product images update by store owner" on storage.objects
for update to authenticated using (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
    and s.owner_id = (select auth.uid()) and s.is_approved = true
  )
) with check (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
    and s.owner_id = (select auth.uid()) and s.is_approved = true
  )
);
drop policy if exists "product images delete by store owner" on storage.objects;
create policy "product images delete by store owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s where s.id::text = (storage.foldername(name))[1]
    and s.owner_id = (select auth.uid()) and s.is_approved = true
  )
);
