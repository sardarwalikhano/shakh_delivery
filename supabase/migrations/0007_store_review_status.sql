alter table public.stores add column if not exists review_status text not null default 'pending' check (review_status in ('pending','approved','rejected'));
update public.stores set review_status = case when is_approved then 'approved' else 'pending' end;

create or replace function public.review_store(target_store_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_shakh_admin() then raise exception 'not authorized'; end if;
  update public.stores
  set is_approved = approve,
      review_status = case when approve then 'approved' else 'rejected' end
  where id = target_store_id and review_status = 'pending';
  if not found then raise exception 'store not found or already reviewed'; end if;
end;
$$;
revoke all on function public.review_store(uuid, boolean) from public, anon;
grant execute on function public.review_store(uuid, boolean) to authenticated;
