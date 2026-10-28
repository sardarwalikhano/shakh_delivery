-- Order lifecycle, item snapshots, secure checkout, captain assignment, and atomic delivery settlement.
alter table public.orders add column if not exists shared_by uuid references public.profiles(id), add column if not exists settled_at timestamptz, add column if not exists delivery_address_label text;
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 product_id uuid not null references public.products(id), product_name text not null,
 quantity integer not null default 1 check(quantity between 1 and 50),
 unit_price_iqd bigint not null check(unit_price_iqd>=0),
 share_reward_iqd bigint not null default 0 check(share_reward_iqd>=0),
 merchant_commission_iqd bigint not null default 0 check(merchant_commission_iqd>=0),
 created_at timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_status_created_at_idx on public.orders(status,created_at);
alter table public.order_items enable row level security;
drop policy if exists "order items related users read" on public.order_items;
create policy "order items related users read" on public.order_items for select to authenticated using (
 exists(select 1 from public.orders o where o.id=order_items.order_id and (
 o.customer_id=(select auth.uid()) or o.captain_id=(select auth.uid()) or public.is_shakh_admin()
 or exists(select 1 from public.stores s where s.id=o.store_id and s.owner_id=(select auth.uid()))))
);
create or replace function public.create_shakh_order(product_ids uuid[], delivery_address text, idempotency_key text, shared_by uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
 v_customer uuid := (select auth.uid()); v_store uuid; v_order uuid; v_subtotal bigint; v_commission bigint; v_reward bigint;
 v_delivery_fee bigint := 1000; v_address text := btrim(coalesce(delivery_address,'')); v_count integer;
begin
 if v_customer is null then raise exception 'authentication required'; end if;
 if v_address='' or length(v_address)<5 or length(v_address)>500 then raise exception 'valid delivery address required'; end if;
 if product_ids is null or cardinality(product_ids)<1 or cardinality(product_ids)>30 then raise exception 'cart must contain 1 to 30 products'; end if;
 if idempotency_key is null or length(btrim(idempotency_key))<12 then raise exception 'valid idempotency key required'; end if;
 if shared_by=v_customer then shared_by:=null; end if;
 select o.id into v_order from public.orders o where o.idempotency_key=btrim(idempotency_key);
 if v_order is not null then if exists(select 1 from public.orders o where o.id=v_order and o.customer_id=v_customer) then return v_order; end if; raise exception 'idempotency key already used'; end if;
 select p.store_id into v_store from public.products p join public.stores s on s.id=p.store_id where p.id=product_ids[1] and p.is_available and s.is_approved;
 if v_store is null then raise exception 'product unavailable'; end if;
 if exists(select 1 from unnest(product_ids) as requested(id) left join public.products p on p.id=requested.id and p.is_available left join public.stores s on s.id=p.store_id and s.is_approved where p.id is null or p.store_id<>v_store or s.id is null) then raise exception 'all cart products must be available from one approved store'; end if;
 select count(*) into v_count from unnest(product_ids);
 if v_count<>(select count(distinct x) from unnest(product_ids) x) then raise exception 'duplicate products are not supported'; end if;
 select coalesce(sum(p.price_iqd),0),coalesce(sum(p.merchant_commission_iqd),0),coalesce(sum(case when shared_by is not null and p.share_reward_enabled then p.share_reward_iqd else 0 end),0)
 into v_subtotal,v_commission,v_reward from public.products p where p.id=any(product_ids);
 insert into public.orders(customer_id,store_id,status,subtotal_iqd,share_reward_iqd,merchant_commission_iqd,delivery_fee_iqd,delivery_commission_iqd,delivery_address,idempotency_key,shared_by,delivery_address_label)
 values(v_customer,v_store,'pending',v_subtotal,v_reward,v_commission,v_delivery_fee,round(v_delivery_fee*0.20),v_address,btrim(idempotency_key),shared_by,v_address) returning id into v_order;
 insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_iqd,share_reward_iqd,merchant_commission_iqd)
 select v_order,p.id,p.name,1,p.price_iqd,case when shared_by is not null and p.share_reward_enabled then p.share_reward_iqd else 0 end,p.merchant_commission_iqd from public.products p where p.id=any(product_ids);
 return v_order;
end; $$;
revoke all on function public.create_shakh_order(uuid[],text,text,uuid) from public,anon;
grant execute on function public.create_shakh_order(uuid[],text,text,uuid) to authenticated;
create or replace function public.claim_delivery_order(target_order_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
 if v_user is null or not exists(select 1 from public.profiles p where p.id=v_user and p.approved_role='captain') then raise exception 'approved captain required'; end if;
 update public.orders set captain_id=v_user,status='accepted' where id=target_order_id and status='pending' and captain_id is null;
 if not found then raise exception 'order is no longer available'; end if;
end; $$;
revoke all on function public.claim_delivery_order(uuid) from public,anon;
grant execute on function public.claim_delivery_order(uuid) to authenticated;
create or replace function public.advance_shakh_order(target_order_id uuid,next_status text) returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_order public.orders%rowtype; v_merchant_wallet uuid; v_captain_wallet uuid; v_sharer_wallet uuid; v_total_debit bigint; v_captain_net bigint;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_order from public.orders where id=target_order_id for update;
 if not found then raise exception 'order not found'; end if;
 if next_status='preparing' then
  if not exists(select 1 from public.stores s where s.id=v_order.store_id and s.owner_id=v_user) then raise exception 'store owner required'; end if;
  if v_order.status<>'accepted' then raise exception 'order must be accepted first'; end if;
  update public.orders set status='preparing' where id=target_order_id; return;
 elsif next_status='picked_up' then
  if v_order.captain_id<>v_user or v_order.status not in ('accepted','preparing') then raise exception 'assigned captain and accepted order required'; end if;
  update public.orders set status='picked_up' where id=target_order_id; return;
 elsif next_status='delivering' then
  if v_order.captain_id<>v_user or v_order.status<>'picked_up' then raise exception 'order must be picked up first'; end if;
  update public.orders set status='delivering' where id=target_order_id; return;
 elsif next_status='delivered' then
  if v_order.captain_id<>v_user or v_order.status<>'delivering' then raise exception 'only assigned captain can complete an order in delivery'; end if;
  if v_order.settled_at is not null then raise exception 'order already settled'; end if;
  select w.id into v_merchant_wallet from public.wallets w where w.owner_id=(select s.owner_id from public.stores s where s.id=v_order.store_id) and w.owner_type='merchant' for update;
  v_total_debit:=v_order.merchant_commission_iqd+v_order.share_reward_iqd;
  if v_total_debit>0 and v_merchant_wallet is null then raise exception 'merchant wallet not found'; end if;
  if v_total_debit>0 and (select balance_iqd from public.wallets where id=v_merchant_wallet)<v_total_debit then raise exception 'merchant wallet has insufficient balance'; end if;
  if v_order.merchant_commission_iqd>0 then
   update public.wallets set balance_iqd=balance_iqd-v_order.merchant_commission_iqd where id=v_merchant_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description) values(v_merchant_wallet,target_order_id,-v_order.merchant_commission_iqd,'merchant_commission','Order commission');
  end if;
  if v_order.share_reward_iqd>0 then
   update public.wallets set balance_iqd=balance_iqd-v_order.share_reward_iqd where id=v_merchant_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description) values(v_merchant_wallet,target_order_id,-v_order.share_reward_iqd,'share_reward','Share reward funded by merchant');
  end if;
  if v_order.shared_by is not null and v_order.share_reward_iqd>0 then
   insert into public.wallets(owner_id,owner_type,balance_iqd) values(v_order.shared_by,'customer',0) on conflict(owner_id,owner_type) do nothing;
   select id into v_sharer_wallet from public.wallets where owner_id=v_order.shared_by and owner_type='customer' for update;
   update public.wallets set balance_iqd=balance_iqd+v_order.share_reward_iqd where id=v_sharer_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description) values(v_sharer_wallet,target_order_id,v_order.share_reward_iqd,'share_reward','Reward for shared product');
  end if;
  v_captain_net:=v_order.delivery_fee_iqd-v_order.delivery_commission_iqd;
  insert into public.wallets(owner_id,owner_type,balance_iqd) values(v_user,'captain',0) on conflict(owner_id,owner_type) do nothing;
  select id into v_captain_wallet from public.wallets where owner_id=v_user and owner_type='captain' for update;
  update public.wallets set balance_iqd=balance_iqd+v_captain_net where id=v_captain_wallet;
  insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description) values(v_captain_wallet,target_order_id,v_captain_net,'delivery_earning','Delivery fee after platform commission');
  update public.orders set status='delivered',settled_at=now() where id=target_order_id; return;
 else raise exception 'unsupported status transition';
 end if;
end; $$;
revoke all on function public.advance_shakh_order(uuid,text) from public,anon;
grant execute on function public.advance_shakh_order(uuid,text) to authenticated;
drop policy if exists "captains see available orders" on public.orders;
create policy "captains see available orders" on public.orders for select to authenticated using(status='pending' and captain_id is null and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.approved_role='captain'));
