# Shakh Delivery

Kurdish Sorani (RTL) marketplace starter for restaurant meals, groceries, and fresh produce.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Resend for server-side transactional email

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the public Supabase URL and anon key.
4. Configure Resend secrets only in server/deployment environment variables.
5. Run `npm run dev`.

## Database
The starter migration is in `supabase/migrations/0001_core.sql`. Review it against the live Supabase schema before applying it to another environment. Wallet settlement, order creation, role approvals, and commission calculations must be implemented as server-side atomic transactions before production use.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`: public project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable/anon key, protected by RLS
- `RESEND_API_KEY`: server-only Resend key; never commit it
- `RESEND_FROM_EMAIL`: sender on a verified Resend domain
- `INTERNAL_EMAIL_TOKEN`: server-only token for internal notification calls

## Status
The landing page and starter schema are in progress. Authentication flows, seller/captain dashboards backed by live data, secure order settlement, email event wiring, automated tests, and deployment/domain configuration still need completion. Demo product and dashboard values are illustrative, not live marketplace data.
