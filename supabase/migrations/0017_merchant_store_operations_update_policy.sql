-- Allow approved merchants to edit operational store fields without granting admin review fields.
drop policy if exists "merchant update own store operations" on public.stores;
create policy "merchant update own store operations" on public.stores
for update to authenticated
using (
  owner_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant')
)
with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant')
);
