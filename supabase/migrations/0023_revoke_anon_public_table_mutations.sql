-- Remove direct mutation privileges from unauthenticated API role.
-- Public marketplace SELECT access remains governed by existing grants and RLS.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE
    public.profiles,
    public.stores,
    public.products,
    public.orders,
    public.order_items,
    public.product_share_links,
    public.wallets,
    public.wallet_ledger,
    public.wallet_topup_requests
  FROM anon;
