# Daily Sales Log

A fast, reliable web application for a shop owner to log sales, track real-time revenue, and inspect the day's running totals.

**Live:** `<your-vercel-url>` *(Configure upon Vercel deployment)*  
**Passcode for reviewers:** *(Provided during submission)*

---

## Features

- **Rapid Sale Logging:** Log transactions with item name, amount in Naira (₦), and exact Lagos timestamp.
- **Real-Time Running Totals:** Automatic per-row running total calculated directly via PostgreSQL window functions.
- **Today's Revenue KPI:** High-visibility overview of total daily revenue, transaction count, and average sale size.
- **Timezone-Aware:** Accurate tracking under the `Africa/Lagos` timezone (UTC+1).
- **Passcode Authentication:** Secure shopkeeper login with signed, HTTP-only JWT session cookies.
- **Responsive & Mobile-First:** Designed with a sleek, dark-mode glassmorphic aesthetic optimized for desktop and mobile phones.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Server Components)
- **Language:** TypeScript
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **Authentication:** `jose` (JWT cookie verification via Edge Middleware)
- **Styling:** Modern Vanilla CSS (Design system with HSL tokens, glassmorphism, responsive tables)
- **Deployment:** Vercel

---

## Run Locally

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "Daily Sales Log"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the values:
```env
DATABASE_URL=postgres://user:password@endpoint-pooler.region.neon.tech/neondb?sslmode=require
SHOP_PASSCODE=1234
SESSION_SECRET=a_secure_random_string_of_at_least_32_characters
```

### 3. Initialize Database Schema
Run the SQL queries in `schema.sql` against your Neon database SQL editor:
```sql
create table sales (
  id          bigserial primary key,
  item_name   text   not null check (length(trim(item_name)) > 0),
  amount_kobo bigint not null check (amount_kobo > 0),
  sold_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index sales_sold_at_idx on sales (sold_at);
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Notes

### What I built
A clean, resilient daily sales logging system tailored for high-frequency retail transactions in Nigeria. The app allows the shopkeeper to rapidly log sales with automatic Lagos time alignment, immediately view real-time per-transaction running totals, and access a summary of the day's sales while keeping sensitive financial figures behind secure passcode authentication.

### Decisions I made and why
1. **Money stored as integer kobo.** Floating-point arithmetic introduces rounding drift (e.g., 0.1 + 0.2 != 0.3). In business and bookkeeping, a balance off by even 1 kobo erodes trust. Storing amounts in integer kobo guarantees 100% mathematical precision.
2. **"Today" is calculated in Africa/Lagos time, in SQL.** Cloud serverless functions typically execute in UTC. Without explicit timezone handling, a sale made late evening in Lagos (UTC+1) would register on tomorrow's log in UTC. Evaluating the day boundary directly in Postgres using `(sold_at at time zone 'Africa/Lagos')::date` guarantees accurate local day boundaries without complex daylight saving shifts.
3. **Single SQL Window Function (`sum(amount_kobo) over (...)`).** Instead of fetching rows and calculating running balances on the server or client in separate passes, the SQL query computes running balances directly in the database engine in one round-trip.
4. **Server components and server actions with raw SQL, no ORM.** The application has a focused domain: one table and two primary operations. Using `@neondatabase/serverless` directly keeps bundle size minimal, cold starts near-instant, and eliminates ORM overhead.
5. **Passcode cookie instead of heavyweight OAuth/auth provider.** For a single shopkeeper or cashier station, standard multi-tenant auth is unnecessary friction. A cryptographically signed, HTTP-only JWT session cookie (`jose`) protects all dashboard operations while keeping setup frictionless.

### With one more day
- Date picker to view and total any past day
- Edit and delete a sale, with a soft delete
- Daily summary: top items, sales by hour
- Export to CSV
- Tests for the money helpers and the total query
- Rate limiting on the login
