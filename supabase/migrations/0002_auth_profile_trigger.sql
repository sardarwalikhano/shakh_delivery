-- Create a profile for each new auth user. The requested role is not an authorization grant.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'requested_role', 'customer');
  if requested not in ('customer', 'merchant', 'captain') then
    requested := 'customer';
  end if;

  insert into public.profiles (id, display_name, phone, requested_role, approved_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    requested,
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public;
revoke all on function public.handle_new_user_profile() from anon;
revoke all on function public.handle_new_user_profile() from authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
