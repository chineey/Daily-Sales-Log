# Daily Sales Log

A fast, lightweight web app for a shop owner to log sales and monitor the day's running revenue in real-time.

**Live:** `<your-vercel-url>`  
**Passcode for reviewers:** *(Share this in your submission message, not in the repo)*

---

## Features

- **Log Sales:** Item name, quantity, unit price in Naira (₦), and Lagos timestamp.
- **Quantity Multiplier:** Automatically calculates `Quantity × Unit Price = Total Amount`.
- **Running Total:** Per-row cumulative total calculated directly in PostgreSQL via window functions.
- **Edit & Delete:** Instantly modify or remove any sale; running balances recalculate immediately.
- **Day KPI Summary:** Displays today's total revenue, total sales count, and average transaction size.
- **Lagos Timezone Alignment:** Filters and timestamps strictly under `Africa/Lagos` (UTC+1).
- **Passcode Protection:** Secure session-based authentication using HTTP-only JWT cookies.

---

## Stack

- **Framework:** Next.js 15 (App Router, Server Actions, TypeScript)
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Authentication:** `jose` (Signed JWT session cookies)
- **Styling:** Vanilla CSS (Dark mode, glassmorphism, responsive table)
- **Deployment:** Vercel

---

## Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # add DATABASE_URL, SHOP_PASSCODE, SESSION_SECRET

# 3. Setup database
# Run the SQL in schema.sql against your Neon console

# 4. Start local server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Notes

### What I built
A resilient retail sales logging tool built specifically for high-frequency daily shopkeeping in Nigeria. The app lets a shopkeeper log items with quantity multipliers, view live per-transaction running totals, and update or delete entries with immediate ledger recalculation—all behind a fast passcode-protected session.

### Decisions I made and why

1. **Money stored as integer kobo.**  
   Floating-point math introduces rounding drift (e.g. `0.1 + 0.2 != 0.3`). In business bookkeeping, being off by even 1 kobo damages trust. Storing integer kobo guarantees 100% mathematical accuracy.

2. **"Today" is calculated in Africa/Lagos time, directly in SQL.**  
   Cloud servers default to UTC. A sale logged at 11:30 PM in Lagos would register on the wrong day in UTC. Calculating the date boundary in Postgres (`(sold_at at time zone 'Africa/Lagos')::date`) prevents timezone leaks. Lagos has no daylight saving, keeping offset math simple.

3. **Single SQL window function for running totals.**  
   Instead of calculating running sums in client/server JavaScript memory, `sum(amount_kobo) over (order by sold_at, id)` computes row totals in the database in a single round-trip.

4. **Instant ledger recalculation on Edit & Delete.**  
   Because running balances are generated dynamically by the window function, editing an amount or deleting a transaction automatically recalibrates every subsequent row without manual ledger reconciliation.

5. **Raw SQL with `@neondatabase/serverless`, no ORM.**  
   The application focuses on one table. Raw SQL eliminates heavy ORM dependencies, minimizes bundle size, and ensures near-instant serverless cold starts.

6. **Passcode cookie instead of full OAuth.**  
   For a single shop owner, full authentication adds unnecessary friction. A signed, HTTP-only JWT cookie (`jose`) keeps the dashboard private while keeping setup simple.

### With one more day
- Date picker to view and total any past day
- Export transactions to CSV and PDF receipts
- Hourly sales breakdown chart
- Rate limiting on passcode attempts
