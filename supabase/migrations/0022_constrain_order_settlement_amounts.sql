-- Enforce monetary invariants on orders independently of RPC validation.
alter table public.orders
  add constraint orders_merchant_commission_nonnegative_check
  check (merchant_commission_iqd >= 0) not valid;
alter table public.orders validate constraint orders_merchant_commission_nonnegative_check;

alter table public.orders
  add constraint orders_share_reward_nonnegative_check
  check (share_reward_iqd >= 0) not valid;
alter table public.orders validate constraint orders_share_reward_nonnegative_check;

alter table public.orders
  add constraint orders_delivery_fee_nonnegative_check
  check (delivery_fee_iqd >= 0) not valid;
alter table public.orders validate constraint orders_delivery_fee_nonnegative_check;

alter table public.orders
  add constraint orders_delivery_commission_nonnegative_check
  check (delivery_commission_iqd >= 0) not valid;
alter table public.orders validate constraint orders_delivery_commission_nonnegative_check;

alter table public.orders
  add constraint orders_delivery_commission_within_fee_check
  check (delivery_commission_iqd <= delivery_fee_iqd) not valid;
alter table public.orders validate constraint orders_delivery_commission_within_fee_check;
