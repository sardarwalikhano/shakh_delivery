-- Bootstrap the specifically designated super-admin account only after email verification.
create or replace function public.promote_designated_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'sardar.xano59@gmail.com'
     and new.email_confirmed_at is not null then
    update public.profiles
      set approved_role = 'super_admin'
      where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.promote_designated_super_admin() from public;
revoke all on function public.promote_designated_super_admin() from anon;
revoke all on function public.promote_designated_super_admin() from authenticated;
drop trigger if exists zz_promote_designated_super_admin on auth.users;
create trigger zz_promote_designated_super_admin
after insert or update of email_confirmed_at on auth.users
for each row execute function public.promote_designated_super_admin();
