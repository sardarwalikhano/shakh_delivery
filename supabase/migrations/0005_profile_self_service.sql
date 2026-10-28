-- Allow users to update only their own display name and phone number.
-- Column-level grants prevent changing requested_role or approved_role from the client.
revoke update on table public.profiles from authenticated;
grant update (display_name, phone) on table public.profiles to authenticated;

drop policy if exists "Users update own profile details" on public.profiles;
create policy "Users update own profile details"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
