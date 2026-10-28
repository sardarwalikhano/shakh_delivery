-- Evaluate auth.uid() once per statement in these RLS policies.
-- Preserve the same ownership checks and UPDATE row-identity checks.
drop policy if exists "wallet read own" on public.wallets;
create policy "wallet read own" on public.wallets
for select to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "topup read own" on public.wallet_topup_requests;
create policy "topup read own" on public.wallet_topup_requests
for select to authenticated
using (requested_by = (select auth.uid()));

drop policy if exists "ledger read own" on public.wallet_ledger;
create policy "ledger read own" on public.wallet_ledger
for select to authenticated
using (exists (
  select 1 from public.wallets w
  where w.id = wallet_ledger.wallet_id
    and w.owner_id = (select auth.uid())
));

drop policy if exists "Users update own profile details" on public.profiles;
create policy "Users update own profile details" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
