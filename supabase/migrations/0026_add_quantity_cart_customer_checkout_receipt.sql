alter table public.orders
  add column if not exists customer_name text not null default '',
  add column if not exists customer_phone text not null default '';

create or replace function public.create_shakh_order_v2(
  product_ids uuid[],
  product_quantities integer[],
  customer_name text,
  customer_phone text,
  delivery_address text,
  idempotency_key text,
  shared_by_user uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_customer uuid := (select auth.uid());
  v_store uuid;
  v_order uuid;
  v_subtotal bigint;
  v_commission bigint;
  v_reward bigint;
  v_delivery_fee bigint := 1000;
  v_address text := btrim(coalesce(delivery_address, ''));
  v_name text := btrim(coalesce(customer_name, ''));
  v_phone text := btrim(coalesce(customer_phone, ''));
  v_count integer;
begin
  if v_customer is null then raise exception 'authentication required'; end if;
  if length(v_name) < 2 or length(v_name) > 100 then raise exception 'ناوی کڕیار دروست نییە'; end if;
  if length(v_phone) < 7 or length(v_phone) > 30 then raise exception 'ژمارەی مۆبایل دروست نییە'; end if;
  if length(v_address) < 5 or length(v_address) > 500 then raise exception 'ناونیشانی گەیاندن دروست نییە'; end if;
  if product_ids is null or product_quantities is null
     or cardinality(product_ids) < 1 or cardinality(product_ids) > 30
     or cardinality(product_ids) <> cardinality(product_quantities) then
    raise exception 'سەبەتەی کڕین دروست نییە';
  end if;
  if exists(select 1 from unnest(product_quantities) q where q < 1 or q > 50) then raise exception 'ژمارەی هەر بەرهەم دەبێت لە ١ تا ٥٠ بێت'; end if;
  if idempotency_key is null or length(btrim(idempotency_key)) < 12 then raise exception 'valid idempotency key required'; end if;
  if shared_by_user = v_customer then shared_by_user := null; end if;
  select o.id into v_order from public.orders o where o.idempotency_key = btrim(idempotency_key);
  if v_order is not null then
    if exists(select 1 from public.orders o where o.id = v_order and o.customer_id = v_customer) then return v_order; end if;
    raise exception 'idempotency key already used';
  end if;
  select count(*) into v_count from unnest(product_ids) as ids(id);
  if v_count <> (select count(distinct ids.id) from unnest(product_ids) as ids(id)) then raise exception 'duplicate products must be combined into quantities'; end if;
  select p.store_id into v_store from public.products p join public.stores s on s.id=p.store_id
  where p.id=product_ids[1] and p.is_available and s.is_approved and s.is_accepting_orders;
  if v_store is null then raise exception 'product unavailable or store closed'; end if;
  perform 1 from public.products p where p.id=any(product_ids) order by p.id for update;
  if exists (
    select 1 from unnest(product_ids,product_quantities) as req(id,qty)
    left join public.products p on p.id=req.id and p.is_available
    left join public.stores s on s.id=p.store_id and s.is_approved and s.is_accepting_orders
    where p.id is null or p.store_id<>v_store or s.id is null or (p.stock_quantity is not null and p.stock_quantity<req.qty)
  ) then raise exception 'هەموو بەرهەمەکان بەردەست نین یان ستۆکیان بەس نییە'; end if;
  select coalesce(sum(p.price_iqd*req.qty),0),coalesce(sum(p.merchant_commission_iqd*req.qty),0),
    coalesce(sum(case when shared_by_user is not null and p.share_reward_enabled then p.share_reward_iqd*req.qty else 0 end),0)
  into v_subtotal,v_commission,v_reward
  from unnest(product_ids,product_quantities) as req(id,qty) join public.products p on p.id=req.id;
  insert into public.orders(customer_id,store_id,status,subtotal_iqd,share_reward_iqd,merchant_commission_iqd,delivery_fee_iqd,delivery_commission_iqd,delivery_address,idempotency_key,shared_by,delivery_address_label,customer_name,customer_phone)
  values(v_customer,v_store,'pending',v_subtotal,v_reward,v_commission,v_delivery_fee,round(v_delivery_fee*0.20),v_address,btrim(idempotency_key),shared_by_user,v_address,v_name,v_phone)
  returning id into v_order;
  insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_iqd,share_reward_iqd,merchant_commission_iqd)
  select v_order,p.id,p.name,req.qty,p.price_iqd,
    case when shared_by_user is not null and p.share_reward_enabled then p.share_reward_iqd*req.qty else 0 end,
    p.merchant_commission_iqd*req.qty
  from unnest(product_ids,product_quantities) as req(id,qty) join public.products p on p.id=req.id;
  update public.products p set stock_quantity=p.stock_quantity-req.qty
  from unnest(product_ids,product_quantities) as req(id,qty) where p.id=req.id and p.stock_quantity is not null;
  update public.profiles set display_name=v_name,phone=v_phone where id=v_customer;
  return v_order;
end;
$function$;
revoke all on function public.create_shakh_order_v2(uuid[],integer[],text,text,text,text,uuid) from public,anon;
grant execute on function public.create_shakh_order_v2(uuid[],integer[],text,text,text,text,uuid) to authenticated;
