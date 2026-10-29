-- Repair live Storage policies so folder ownership is checked against the uploaded object path.
-- Product image objects are stored under <store UUID>/<random filename>.
drop policy if exists "product images upload by store owner" on storage.objects;
create policy "product images upload by store owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
      and s.is_approved = true
  )
);

drop policy if exists "product images update by store owner" on storage.objects;
create policy "product images update by store owner" on storage.objects
for update to authenticated using (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
      and s.is_approved = true
  )
) with check (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
      and s.is_approved = true
  )
);

drop policy if exists "product images delete by store owner" on storage.objects;
create policy "product images delete by store owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-images' and exists (
    select 1 from public.stores s
    where s.id::text = (storage.foldername(name))[1]
      and s.owner_id = (select auth.uid())
      and s.is_approved = true
  )
);
