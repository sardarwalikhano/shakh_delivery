-- Restrict authenticated marketplace reads while preserving owner/admin access.
-- Permissive SELECT policies are OR-ed, so replace the broad policies rather than adding another one.
drop policy if exists "product read available or own store" on public.products;
create policy "product read available open store or own store"
on public.products for select to authenticated
using (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.owner_id = (select auth.uid())
  )
  or public.is_shakh_admin()
  or (
    is_available = true
    and exists (
      select 1 from public.stores s
      where s.id = products.store_id
        and s.is_approved = true
        and s.is_accepting_orders = true
    )
  )
);

drop policy if exists "store read approved or own" on public.stores;
create policy "store read open or own"
on public.stores for select to authenticated
using (
  owner_id = (select auth.uid())
  or public.is_shakh_admin()
  or (is_approved = true and is_accepting_orders = true)
);
