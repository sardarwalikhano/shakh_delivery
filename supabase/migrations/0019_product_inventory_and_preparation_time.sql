alter table public.products add column if not exists stock_quantity integer null, add column if not exists preparation_time_minutes integer null;
alter table public.products drop constraint if exists products_stock_quantity_check;
alter table public.products add constraint products_stock_quantity_check check (stock_quantity is null or stock_quantity >= 0);
alter table public.products drop constraint if exists products_preparation_time_minutes_check;
alter table public.products add constraint products_preparation_time_minutes_check check (preparation_time_minutes is null or preparation_time_minutes between 1 and 1440);
create or replace function public.create_shakh_order(product_ids uuid[], delivery_address text, idempotency_key text, share_token uuid DEFAULT NULL::uuid)
returns uuid language plpgsql security definer set search_path to ''
as $function$
declare
 v_customer uuid := (select auth.uid()); v_store uuid; v_order uuid; v_subtotal bigint; v_commission bigint; v_reward bigint;
 v_delivery_fee bigint := 1000; v_address text := btrim(coalesce(delivery_address,'')); v_count integer; v_shared_by uuid; v_shared_product uuid;
begin
 if v_customer is null then raise exception 'authentication required'; end if;
 if v_address='' or length(v_address)<5 or length(v_address)>500 then raise exception 'valid delivery address required'; end if;
 if product_ids is null or cardinality(product_ids)<1 or cardinality(product_ids)>30 then raise exception 'cart must contain 1 to 30 products'; end if;
 if idempotency_key is null or length(btrim(idempotency_key))<12 then raise exception 'valid idempotency key required'; end if;
 select o.id into v_order from public.orders o where o.idempotency_key=btrim(idempotency_key);
 if v_order is not null then if exists(select 1 from public.orders o where o.id=v_order and o.customer_id=v_customer) then return v_order; end if; raise exception 'idempotency key already used'; end if;
 perform 1 from public.products p where p.id=any(product_ids) order by p.id for update;
 select p.store_id into v_store from public.products p join public.stores s on s.id=p.store_id where p.id=product_ids[1] and p.is_available and (p.stock_quantity is null or p.stock_quantity>0) and s.is_approved and s.is_accepting_orders;
 if v_store is null then raise exception 'product unavailable or out of stock'; end if;
 if exists(select 1 from unnest(product_ids) as requested(id) left join public.products p on p.id=requested.id and p.is_available left join public.stores s on s.id=p.store_id and s.is_approved and s.is_accepting_orders where p.id is null or p.store_id<>v_store or s.id is null or (p.stock_quantity is not null and p.stock_quantity<1)) then raise exception 'all cart products must be available from one approved store and in stock'; end if;
 select count(*) into v_count from unnest(product_ids);
 if v_count<>(select count(distinct x) from unnest(product_ids) x) then raise exception 'duplicate products are not supported'; end if;
 if share_token is not null then
  select l.sharer_id,l.product_id into v_shared_by,v_shared_product from public.product_share_links l where l.token=share_token;
  if v_shared_by is null or v_shared_by=v_customer or not (v_shared_product=any(product_ids)) then raise exception 'invalid product share token'; end if;
 end if;
 select coalesce(sum(p.price_iqd),0),coalesce(sum(p.merchant_commission_iqd),0),coalesce(sum(case when v_shared_by is not null and p.id=v_shared_product and p.share_reward_enabled then p.share_reward_iqd else 0 end),0)
 into v_subtotal,v_commission,v_reward from public.products p where p.id=any(product_ids);
 insert into public.orders(customer_id,store_id,status,subtotal_iqd,share_reward_iqd,merchant_commission_iqd,delivery_fee_iqd,delivery_commission_iqd,delivery_address,idempotency_key,shared_by,delivery_address_label)
 values(v_customer,v_store,'pending',v_subtotal,v_reward,v_commission,v_delivery_fee,round(v_delivery_fee*0.20),v_address,btrim(idempotency_key),v_shared_by,v_address) returning id into v_order;
 insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_iqd,share_reward_iqd,merchant_commission_iqd)
 select v_order,p.id,p.name,1,p.price_iqd,case when v_shared_by is not null and p.id=v_shared_product and p.share_reward_enabled then p.share_reward_iqd else 0 end,p.merchant_commission_iqd from public.products p where p.id=any(product_ids);
 update public.products set stock_quantity=stock_quantity-1 where id=any(product_ids) and stock_quantity is not null;
 return v_order;
end; $function$;