-- Role approval and dashboard access for Shakh.
-- Privileged roles are assigned only by an existing admin/super_admin.
create or replace function public.is_shakh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.approved_role in ('admin', 'super_admin')
  );
$$;
revoke all on function public.is_shakh_admin() from public;
grant execute on function public.is_shakh_admin() to authenticated;

drop policy if exists "profile read own" on public.profiles;
create policy "profiles own or admin read" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_shakh_admin());

drop policy if exists "order read own" on public.orders;
create policy "orders customer captain merchant admin read" on public.orders
for select to authenticated
using (
  customer_id = (select auth.uid())
  or captain_id = (select auth.uid())
  or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid()))
  or public.is_shakh_admin()
);

create or replace function public.review_role_request(target_user_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester public.profiles%rowtype;
begin
  if not public.is_shakh_admin() then
    raise exception 'not_authorized';
  end if;
  select * into requester from public.profiles where id = target_user_id for update;
  if not found then raise exception 'profile_not_found'; end if;
  if requester.requested_role not in ('merchant','captain') then
    raise exception 'no_pending_role_request';
  end if;
  update public.profiles
    set approved_role = case when approve then requester.requested_role else 'customer' end
    where id = target_user_id;
  if approve then
    insert into public.wallets(owner_id, owner_type)
      values (target_user_id, requester.requested_role)
      on conflict (owner_id, owner_type) do nothing;
  end if;
end;
$$;
revoke all on function public.review_role_request(uuid, boolean) from public;
grant execute on function public.review_role_request(uuid, boolean) to authenticated;

-- Admins can review role requests via the security-definer function; clients cannot
-- write approved_role directly. Do not add a client-side profile update policy.
