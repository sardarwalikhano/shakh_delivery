create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  requested_role text not null default 'customer' check (requested_role in ('customer','merchant','captain')),
  approved_role text not null default 'customer' check (approved_role in ('customer','merchant','captain','admin','super_admin')),
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  category text not null check (category in ('restaurant','grocery','produce')),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  price_iqd bigint not null check (price_iqd >= 0),
  share_reward_iqd bigint not null default 0 check (share_reward_iqd >= 0),
  merchant_commission_iqd bigint not null default 0 check (merchant_commission_iqd >= 0),
  share_reward_enabled boolean not null default false,
  is_available boolean not null default true
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  owner_type text not null check (owner_type in ('merchant','captain','customer')),
  balance_iqd bigint not null default 0 check (balance_iqd >= 0),
  unique(owner_id, owner_type)
);

create table public.wallet_topup_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  requested_by uuid not null references public.profiles(id),
  amount_iqd bigint not null check (amount_iqd > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  store_id uuid not null references public.stores(id),
  captain_id uuid references public.profiles(id),
  status text not null default 'pending',
  subtotal_iqd bigint not null check (subtotal_iqd >= 0),
  share_reward_iqd bigint not null default 0,
  merchant_commission_iqd bigint not null default 0,
  delivery_fee_iqd bigint not null default 0,
  delivery_commission_iqd bigint not null default 0,
  delivery_address text not null,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  order_id uuid references public.orders(id),
  amount_iqd bigint not null,
  entry_type text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_topup_requests enable row level security;
alter table public.orders enable row level security;
alter table public.wallet_ledger enable row level security;

create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "store read approved" on public.stores for select using (is_approved = true);
create policy "product read available" on public.products for select using (is_available = true);
create policy "wallet read own" on public.wallets for select to authenticated using (owner_id = auth.uid());
create policy "topup read own" on public.wallet_topup_requests for select to authenticated using (requested_by = auth.uid());
create policy "topup create own" on public.wallet_topup_requests for insert to authenticated with check (requested_by = auth.uid());
create policy "order read own" on public.orders for select to authenticated using (customer_id = auth.uid() or captain_id = auth.uid());
create policy "ledger read own" on public.wallet_ledger for select to authenticated using (exists (select 1 from public.wallets w where w.id = wallet_id and w.owner_id = auth.uid()));

-- Important: wallet balances, role approvals, commissions and order settlement must only be changed by trusted server-side transactions.
