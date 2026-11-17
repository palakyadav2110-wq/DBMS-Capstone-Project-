# SmartPark — Full-stack DBMS capstone

A responsive Next.js + TypeScript + Tailwind web app using Supabase Auth and PostgreSQL, intended for Netlify deployment.

## Included features
- Premium responsive homepage
- Supabase email/password sign-up, sign-in, sign-out, and email confirmation callback
- Customer dashboard
- Vehicle registration and removal
- Parking locations and slot browsing
- Reservation creation via PostgreSQL RPC
- Booking history and safe cancellation
- Staff check-in/check-out and charge calculation
- Admin location, slot, and pricing management
- Nine-table PostgreSQL schema, indexes, constraints, RLS, and audit records
- SQL seed data and viva query examples

## 1. Create Supabase project
Create a new project at https://supabase.com/dashboard. Prefer a region near your users, such as Mumbai if available. Save the database password privately.

## 2. Apply the SQL migration
In Supabase SQL Editor, create a new query and paste the complete contents of:
`supabase/migrations/202610260001_smartpark_initial_schema.sql`

Run it once on a new project. Confirm it completes. If you get an error, read and fix the first error rather than repeatedly running a partially applied migration.

## 3. Add sample data
In SQL Editor, run `supabase/seed.sql` once. This creates a demo lot, sample slots, and pricing rules.

## 4. Configure Supabase environment
Copy `.env.example` to `.env.local` and fill in the project URL and publishable key from the Supabase dashboard:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never put a secret/service-role key in browser code or any `NEXT_PUBLIC_` variable. Do not commit `.env.local`.

## 5. Install and run
Use Node.js 20.9+ (Node 22 recommended):

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 6. Create the first admin
1. Sign up in the app and confirm email if Supabase requires it.
2. In Supabase Authentication → Users, copy your account UUID.
3. In SQL Editor run:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE-YOUR-AUTH-USER-UUID-HERE';
```

To promote a second account to staff, replace the UUID and set `role = 'staff'`.

Signup never accepts a role from the user. New profiles default to `customer`.

## 7. Configure email confirmation
In Supabase Authentication → URL Configuration:
- Site URL for local development: `http://localhost:3000`
- Add redirect URL: `http://localhost:3000/auth/callback`
- Later add your Netlify production URL and `https://YOUR-SITE.netlify.app/auth/callback`

The app callback exchanges the email-confirmation code for a session. Email delivery depends on the Supabase project's configured authentication email provider and limits.

## 8. Deploy to Netlify
1. Push this project to GitHub.
2. In Netlify select Add new project → Import an existing project.
3. Choose the repository and let Netlify detect Next.js.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` to the site's environment variables. Set the site URL to your production Netlify URL.
5. Deploy and add `https://YOUR-SITE.netlify.app/auth/callback` to Supabase Authentication redirect URLs.
6. Redeploy after changing environment variables.

Use the official Netlify Next.js adapter/integration rather than exporting a static site: server actions and Supabase SSR authentication require server-side support.

## 9. Role-specific pages
- Customer: `/dashboard`, `/locations`, `/vehicles`, `/bookings`
- Staff: `/staff`
- Admin: `/admin`

The staff and admin pages verify the authenticated user's database profile role. RLS remains enabled at the database layer too.

## Database notes
- Booking writes are made through `create_booking`, not a direct table insert.
- `bookings_no_overlapping_active_slot` is a PostgreSQL exclusion constraint that prevents overlapping active reservations for a slot.
- `cancel_booking` only permits the owner to cancel future confirmed reservations.
- Staff RPCs create parking sessions and calculate exit charges.
- The payment table records payment status only. No real payment gateway is connected.
- Billing policy: minimum one hour, then round up each started hour. Change the RPC if your assignment requires a different tariff.
- For a real production system, further review is needed for staff workflows, rate effective-date overlap, payment reconciliation, abuse protection, and operational monitoring.

## Free-tier approach
- One Supabase project and one Netlify site.
- Use local builds during development; avoid paid add-ons.
- Keep sample data small and avoid uploading large media.
- Free-tier limits and inactivity policies can change; check the current dashboards before relying on them.

## DBMS concepts to explain
Normalization, foreign keys, constraints, transactions, exclusion constraints, indexes, joins, aggregate queries, RLS, triggers, stored functions, and audit logs.
