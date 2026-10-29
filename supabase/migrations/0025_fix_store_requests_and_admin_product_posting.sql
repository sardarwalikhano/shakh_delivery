-- Secure single-shot store requests, grant merchant role on approval, and enable admin product posting.
create or replace function public.request_shakh_store(
  store_name text,
  store_category text,
  store_address text,
  store_city text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := (select auth.uid());
  v_store_id uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if length(btrim(coalesce(store_name, ''))) < 2 or length(btrim(store_name)) > 100 then
    raise exception 'valid store name required';
  end if;
  if store_category not in ('restaurant', 'grocery', 'produce') then
    raise exception 'invalid store category';
  end if;
  if length(btrim(coalesce(store_address, ''))) > 500 or length(btrim(coalesce(store_city, ''))) > 120 then
    raise exception 'store address or city is too long';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_user and p.approved_role in ('customer','merchant')
  ) then
    raise exception 'this account cannot request a store';
  end if;
  if exists (select 1 from public.stores s where s.owner_id = v_user) then
    raise exception 'a store request already exists for this account';
  end if;
  insert into public.stores(owner_id, name, category, address, city, is_approved, review_status, is_accepting_orders)
  values (v_user, btrim(store_name), store_category, btrim(coalesce(store_address,'')), btrim(coalesce(store_city,'')), false, 'pending', false)
  returning id into v_store_id;
  return v_store_id;
end;
$function$;

revoke all on function public.request_shakh_store(text,text,text,text) from public, anon;
grant execute on function public.request_shakh_store(text,text,text,text) to authenticated;
revoke insert on public.stores from authenticated;

create or replace function public.review_store(target_store_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_owner uuid;
begin
  if not public.is_shakh_admin() then raise exception 'not authorized'; end if;
  select owner_id into v_owner
  from public.stores
  where id = target_store_id and review_status = 'pending'
  for update;
  if not found then raise exception 'store not found or already reviewed'; end if;

  update public.stores
  set is_approved = approve,
      review_status = case when approve then 'approved' else 'rejected' end
  where id = target_store_id;

  if approve then
    update public.profiles
    set requested_role = 'merchant', approved_role = 'merchant'
    where id = v_owner;
    insert into public.wallets(owner_id, owner_type)
    values (v_owner, 'merchant')
    on conflict (owner_id, owner_type) do nothing;
  end if;
end;
$function$;
revoke all on function public.review_store(uuid, boolean) from public, anon;
grant execute on function public.review_store(uuid, boolean) to authenticated;

create policy "admin create products in any store" on public.products
for insert to authenticated
with check (public.is_shakh_admin() and exists (
  select 1 from public.stores s where s.id = products.store_id and s.is_approved
));
create policy "admin update products in any store" on public.products
for update to authenticated
using (public.is_shakh_admin())
with check (public.is_shakh_admin() and exists (
  select 1 from public.stores s where s.id = products.store_id and s.is_approved
));
create policy "admin delete products" on public.products
for delete to authenticated
using (public.is_shakh_admin());
grant insert, update, delete on public.products to authenticated;

insert into public.stores(owner_id, name, category, address, city, is_approved, review_status, is_accepting_orders)
select p.id, 'بازاڕی شاخ', c.category, 'بازاڕی شاخ', 'هەولێر', true, 'approved', true
from (
  select id from public.profiles where approved_role = 'super_admin' order by created_at asc limit 1
) p
cross join (values ('restaurant'), ('grocery'), ('produce')) as c(category)
where not exists (
  select 1 from public.stores s
  where s.owner_id = p.id and s.name = 'بازاڕی شاخ' and s.category = c.category
);
