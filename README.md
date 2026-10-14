# Daily Sales Log

A fast, reliable web application for a shop owner to log sales, track real-time revenue, and inspect the day's running totals.

**Passcode for reviewers:** 1234

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
A daily sales logging system tailored for retail transactions in Nigeria. The app allows the shopkeeper to rapidly log sales with quantity multipliers and automatic Lagos time alignment, immediately view real-time per-transaction running totals, edit or delete recorded sales with instant recalculation, and access a summary of the day's sales while keeping sensitive financial figures behind secure passcode authentication.

### Decisions I made and why

1. **I store money as whole kobo, not decimals.**
   Computers can get small decimal sums slightly wrong (0.1 + 0.2 comes out as 0.30000000000000004). In a sales log, even a 1 kobo mistake makes the owner stop trusting the numbers. Counting in whole kobo means every total is exact.

2. **"Today" follows Lagos time.**
   The server runs on UTC time, which is one hour behind Lagos. Without a fix, a sale made at 11:30pm in Lagos would show up under tomorrow. The database works out the day using Lagos time, so each sale lands on the right day.

3. **The running total is worked out by the database.**
   Instead of adding up rows in the app, I ask the database for each row's running total in one query. It is faster, and the app has less code that can go wrong.

4. **Edits and deletes fix the totals automatically.**
   Running totals are calculated fresh each time the page loads, not saved. If the shop owner corrects an amount or removes a sale, every total after it updates by itself. There is no stored balance that can drift out of sync.

5. **Simple tools, no extra layers.**
   The app has one table and a few queries, so I wrote the queries directly instead of adding a database framework. That means less code to maintain and a faster app.

6. **A passcode instead of full user accounts.**
   This is meant for one shop owner or one till. Asking them to create accounts and verify emails would be friction for no benefit. A passcode keeps strangers out, and the login is stored securely in the browser.

### With one more day
- Date picker to view and total any past day
- Daily summary analytics: top items, sales grouped by hour
- Export transactions to CSV / PDF receipts
- Unit and integration tests for money helpers, quantity multipliers, and window queries
- Rate limiting on passcode login attempts
