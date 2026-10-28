-- Add indexes for foreign-key columns identified by Supabase Performance Advisor.
-- These indexes improve joins and parent-row delete/update checks without changing row access.
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists orders_captain_id_idx on public.orders (captain_id);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_shared_by_idx on public.orders (shared_by);
create index if not exists orders_store_id_idx on public.orders (store_id);
create index if not exists product_share_links_sharer_id_idx on public.product_share_links (sharer_id);
create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists stores_owner_id_idx on public.stores (owner_id);
create index if not exists wallet_ledger_order_id_idx on public.wallet_ledger (order_id);
create index if not exists wallet_ledger_wallet_id_idx on public.wallet_ledger (wallet_id);
create index if not exists wallet_topup_requests_requested_by_idx on public.wallet_topup_requests (requested_by);
create index if not exists wallet_topup_requests_reviewed_by_idx on public.wallet_topup_requests (reviewed_by);
create index if not exists wallet_topup_requests_wallet_id_idx on public.wallet_topup_requests (wallet_id);
