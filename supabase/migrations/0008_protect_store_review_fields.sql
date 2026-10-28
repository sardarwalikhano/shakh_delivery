-- Store approval is exclusively controlled by the review_store RPC.
revoke update on table public.stores from authenticated;
drop policy if exists "merchant update own store" on public.stores;
