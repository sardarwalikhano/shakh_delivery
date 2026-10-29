-- Allow authenticated merchants to update operational/store profile fields.
-- RLS policy "merchant update own store operations" still restricts updates to an
-- approved merchant's own store and preserves the owner_id check.
-- Approval and review state columns intentionally remain non-updatable directly.
GRANT UPDATE (name, category, address, city, is_accepting_orders)
  ON TABLE public.stores TO authenticated;
