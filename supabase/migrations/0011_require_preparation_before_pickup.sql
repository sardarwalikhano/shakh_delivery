-- Require merchant preparation before a captain can pick up an order.
-- The server-side RPC remains the source of truth; UI gating is supplemental.
create or replace function public.advance_shakh_order(target_order_id uuid, next_status text)
returns void language plpgsql security definer set search_path to ''
as $function$
declare
 v_user uuid := (select auth.uid());
 v_order public.orders%rowtype;
 v_merchant_wallet uuid;
 v_captain_wallet uuid;
 v_sharer_wallet uuid;
 v_total_debit bigint;
 v_captain_net bigint;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_order from public.orders where id=target_order_id for update;
 if not found then raise exception 'order not found'; end if;
 if next_status='preparing' then
  if not exists(select 1 from public.stores s where s.id=v_order.store_id and s.owner_id=v_user) then raise exception 'store owner required'; end if;
  if v_order.status<>'accepted' then raise exception 'order must be accepted first'; end if;
  update public.orders set status='preparing' where id=target_order_id; return;
 elsif next_status='picked_up' then
  if v_order.captain_id<>v_user then raise exception 'assigned captain required'; end if;
  if v_order.status<>'preparing' then raise exception 'merchant must prepare the order before pickup'; end if;
  update public.orders set status='picked_up' where id=target_order_id; return;
 elsif next_status='delivering' then
  if v_order.captain_id<>v_user or v_order.status<>'picked_up' then raise exception 'order must be picked up first'; end if;
  update public.orders set status='delivering' where id=target_order_id; return;
 elsif next_status='delivered' then
  if v_order.captain_id<>v_user or v_order.status<>'delivering' then raise exception 'only assigned captain can complete an order in delivery'; end if;
  if v_order.settled_at is not null then raise exception 'order already settled'; end if;
  select w.id into v_merchant_wallet from public.wallets w
   where w.owner_id=(select s.owner_id from public.stores s where s.id=v_order.store_id) and w.owner_type='merchant' for update;
  v_total_debit:=v_order.merchant_commission_iqd+v_order.share_reward_iqd;
  if v_total_debit>0 and v_merchant_wallet is null then raise exception 'merchant wallet not found'; end if;
  if v_total_debit>0 and (select balance_iqd from public.wallets where id=v_merchant_wallet)<v_total_debit then raise exception 'merchant wallet has insufficient balance'; end if;
  if v_order.merchant_commission_iqd>0 then
   update public.wallets set balance_iqd=balance_iqd-v_order.merchant_commission_iqd where id=v_merchant_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description)
   values(v_merchant_wallet,target_order_id,-v_order.merchant_commission_iqd,'merchant_commission','Order commission');
  end if;
  if v_order.share_reward_iqd>0 then
   update public.wallets set balance_iqd=balance_iqd-v_order.share_reward_iqd where id=v_merchant_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description)
   values(v_merchant_wallet,target_order_id,-v_order.share_reward_iqd,'share_reward','Share reward funded by merchant');
  end if;
  if v_order.shared_by is not null and v_order.share_reward_iqd>0 then
   insert into public.wallets(owner_id,owner_type,balance_iqd) values(v_order.shared_by,'customer',0) on conflict(owner_id,owner_type) do nothing;
   select id into v_sharer_wallet from public.wallets where owner_id=v_order.shared_by and owner_type='customer' for update;
   update public.wallets set balance_iqd=balance_iqd+v_order.share_reward_iqd where id=v_sharer_wallet;
   insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description)
   values(v_sharer_wallet,target_order_id,v_order.share_reward_iqd,'share_reward','Reward for shared product');
  end if;
  v_captain_net:=v_order.delivery_fee_iqd-v_order.delivery_commission_iqd;
  insert into public.wallets(owner_id,owner_type,balance_iqd) values(v_user,'captain',0) on conflict(owner_id,owner_type) do nothing;
  select id into v_captain_wallet from public.wallets where owner_id=v_user and owner_type='captain' for update;
  update public.wallets set balance_iqd=balance_iqd+v_captain_net where id=v_captain_wallet;
  insert into public.wallet_ledger(wallet_id,order_id,amount_iqd,entry_type,description)
  values(v_captain_wallet,target_order_id,v_captain_net,'delivery_earning','Delivery fee after platform commission');
  update public.orders set status='delivered',settled_at=now() where id=target_order_id; return;
 else
  raise exception 'unsupported status transition';
 end if;
end;
$function$;
revoke all on function public.advance_shakh_order(uuid,text) from public,anon;
grant execute on function public.advance_shakh_order(uuid,text) to authenticated;
