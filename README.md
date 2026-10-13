# Daily Sales Log

A fast, reliable web application for a shop owner to log sales, track real-time revenue, and inspect the day's running totals.

**Live:** `<your-vercel-url>` *(Configure upon Vercel deployment)*  
**Passcode for reviewers:** *(Provided during submission)*

---

## Features

- **Rapid Sale Logging:** Log transactions with item name, quantity, unit price in Naira (₦), and exact Lagos timestamp.
- **Quantity Multiplier:** Supports quantity inputs that dynamically multiply unit price (`Quantity × Unit Price = Total Amount`) with real-time UI preview.
- **Real-Time Running Totals:** Automatic per-row running total calculated directly in PostgreSQL via window functions (`SUM(...) OVER (...)`).
- **Edit & Delete Transactions:** Seamlessly modify or remove any recorded entry directly from the dashboard table; all running balances and KPIs recalculate instantaneously.
- **Today's Revenue KPI:** High-visibility overview of total daily revenue, transaction count, average sale value, and first/latest sale times.
- **Timezone-Aware:** Accurate tracking under the `Africa/Lagos` timezone (UTC+1).
- **Passcode Authentication:** Secure shopkeeper login with signed, HTTP-only JWT session cookies.
- **Responsive & Mobile-First:** Designed with a sleek, dark-mode glassmorphic aesthetic optimized for desktop and mobile phones.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Server Components)
- **Language:** TypeScript
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **Authentication:** `jose` (JWT cookie verification via Edge Middleware)
- **Styling:** Modern Vanilla CSS (Design system with custom tokens, glassmorphism, responsive tables)
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
CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  item_name TEXT NOT NULL CHECK (length(trim(item_name)) > 0),
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales (sold_at);
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Notes

### What I built
A clean, resilient daily sales logging system tailored for high-frequency retail transactions in Nigeria. The app allows the shopkeeper to rapidly log sales with quantity multipliers and automatic Lagos time alignment, immediately view real-time per-transaction running totals, edit or delete recorded sales with instant recalculation, and access a summary of the day's sales while keeping sensitive financial figures behind secure passcode authentication.

### Decisions I made and why
1. **Money stored as integer kobo.** Floating-point arithmetic introduces rounding drift (e.g., `0.1 + 0.2 != 0.3`). In business and bookkeeping, a balance off by even 1 kobo erodes trust. Storing amounts in integer kobo guarantees 100% mathematical precision.
2. **"Today" is calculated in Africa/Lagos time, in SQL.** Cloud serverless functions typically execute in UTC. Without explicit timezone handling, a sale made late evening in Lagos (UTC+1) would register on tomorrow's log in UTC. Evaluating the day boundary directly in Postgres using `(sold_at at time zone 'Africa/Lagos')::date` guarantees accurate local day boundaries without daylight saving bugs.
3. **Single SQL Window Function (`sum(amount_kobo) over (...)`).** Instead of fetching rows and calculating running balances on the server or client in separate passes, the SQL query computes running balances directly in the database engine in one round-trip.
4. **Instantaneous recalculation on Edit and Delete.** Because running totals are computed dynamically in the window function, modifying an item's amount, quantity, or time—or deleting an entry entirely—automatically recalibrates every subsequent running total without manual ledger reconciliation or database desynchronization.
5. **Server components and server actions with raw SQL, no ORM.** The application has a focused domain: one table and core operational queries. Using `@neondatabase/serverless` directly keeps bundle size minimal, cold starts near-instant, and eliminates ORM overhead.
6. **Passcode cookie instead of heavyweight OAuth/auth provider.** For a single shopkeeper or cashier station, standard multi-tenant auth is unnecessary friction. A cryptographically signed, HTTP-only JWT session cookie (`jose`) protects all dashboard operations while keeping setup frictionless.

### With one more day
- Date picker to view and total any past day
- Daily summary analytics: top items, sales grouped by hour
- Export transactions to CSV / PDF receipts
- Unit and integration tests for money helpers, quantity multipliers, and window queries
- Rate limiting on passcode login attempts
