-- Dashboard management features: store/product ownership, top-up review, and admin visibility.
drop policy if exists "store read approved" on public.stores;
create policy "store read approved or own" on public.stores
for select to authenticated
using (is_approved = true or owner_id = (select auth.uid()) or public.is_shakh_admin());
create policy "merchant create own store" on public.stores
for insert to authenticated with check (owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant') and is_approved = false);
create policy "merchant update own store" on public.stores
for update to authenticated using (owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant'))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant') and is_approved = false);
drop policy if exists "product read available" on public.products;
create policy "product read available or own store" on public.products for select to authenticated using (is_available = true or exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid())) or public.is_shakh_admin());
create policy "merchant create products in own store" on public.products for insert to authenticated with check (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant')));
create policy "merchant update products in own store" on public.products for update to authenticated using (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid())) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant'))
with check (exists (select 1 from public.stores s where s.id = products.store_id and s.owner_id = (select auth.uid())) and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.approved_role = 'merchant'));
create policy "admin read all topup requests" on public.wallet_topup_requests for select to authenticated using (public.is_shakh_admin());
create or replace function public.review_wallet_topup(target_request_id uuid, approve boolean) returns void language plpgsql security definer set search_path = '' as $$
declare req public.wallet_topup_requests%rowtype;
begin
 if not public.is_shakh_admin() then raise exception 'not authorized'; end if;
 select * into req from public.wallet_topup_requests where id = target_request_id for update;
 if not found then raise exception 'top-up request not found'; end if;
 if req.status <> 'pending' then raise exception 'top-up request already reviewed'; end if;
 update public.wallet_topup_requests set status = case when approve then 'approved' else 'rejected' end, reviewed_by = (select auth.uid()) where id = req.id;
 if approve then
  update public.wallets set balance_iqd = balance_iqd + req.amount_iqd where id = req.wallet_id;
  insert into public.wallet_ledger(wallet_id, amount_iqd, entry_type, description) values (req.wallet_id, req.amount_iqd, 'topup', 'Top-up approved by administrator');
 end if;
end; $$;
revoke all on function public.review_wallet_topup(uuid, boolean) from public, anon;
grant execute on function public.review_wallet_topup(uuid, boolean) to authenticated;
drop policy if exists "topup create own" on public.wallet_topup_requests;
create policy "topup create own valid wallet" on public.wallet_topup_requests for insert to authenticated with check (requested_by = (select auth.uid()) and status = 'pending' and reviewed_by is null and exists (select 1 from public.wallets w where w.id = wallet_topup_requests.wallet_id and w.owner_id = (select auth.uid()) and w.owner_type in ('merchant','captain')));
create policy "wallet ledger admin read" on public.wallet_ledger for select to authenticated using (public.is_shakh_admin());
create policy "admin read all wallets" on public.wallets for select to authenticated using (public.is_shakh_admin());
create policy "admin read all orders" on public.orders for select to authenticated using (public.is_shakh_admin());
create or replace function public.review_store(target_store_id uuid, approve boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_shakh_admin() then raise exception 'not authorized'; end if;
 update public.stores set is_approved = approve where id = target_store_id and is_approved = false;
 if not found then raise exception 'store not found or already reviewed'; end if;
end; $$;
revoke all on function public.review_store(uuid, boolean) from public, anon;
grant execute on function public.review_store(uuid, boolean) to authenticated;
create policy "admin read all stores" on public.stores for select to authenticated using (public.is_shakh_admin());
