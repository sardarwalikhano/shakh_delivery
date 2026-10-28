-- Explicitly prevent anonymous callers from invoking privileged admin RPCs.
-- Authenticated users still need these functions for admin checks and review actions.
revoke all on function public.is_shakh_admin() from public, anon;
grant execute on function public.is_shakh_admin() to authenticated;

revoke all on function public.review_role_request(uuid, boolean) from public, anon;
grant execute on function public.review_role_request(uuid, boolean) to authenticated;
