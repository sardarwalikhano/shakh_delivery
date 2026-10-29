-- Public marketplace can read only available products in approved stores currently accepting orders.
drop policy if exists "public read available products from open stores" on public.products;
create policy "public read available products from open stores" on public.products
for select to anon, authenticated
using (
  is_available = true
  and exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.is_approved = true
      and s.is_accepting_orders = true
  )
);
drop policy if exists "public read approved open stores" on public.stores;
create policy "public read approved open stores" on public.stores
for select to anon, authenticated
using (is_approved = true and is_accepting_orders = true);
