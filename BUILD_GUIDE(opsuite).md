# Daily Sales Log: Build Guide

**Stack:** Next.js (App Router, TypeScript) on Vercel, Neon Postgres, passcode login, amounts in Naira (₦).
**Deadline:** 24 hours from when you got the brief. Target finishing in 4 to 6 hours of real work and leave the rest as buffer.

---

## 1. What you must deliver

- [ ] Log a sale: item name, amount, time
- [ ] Running total for everything sold that day
- [ ] 10 to 15 sales recorded **through the live app** (not seeded by a script)
- [ ] Dashboard: transactions table + running total
- [ ] Deployed live, connected to a real database
- [ ] GitHub repo with a README that has a **Notes** section
- [ ] Submit: live link + repo link

---

## 2. Time plan

| Block | Task | Time |
|---|---|---|
| 1 | Create Neon DB, run schema | 15 min |
| 2 | Scaffold Next.js, env vars, DB helper | 20 min |
| 3 | Passcode login + middleware | 30 min |
| 4 | Add sale form (server action) | 45 min |
| 5 | Dashboard table + totals | 45 min |
| 6 | Deploy to Vercel, test on live URL | 30 min |
| 7 | Enter 10 to 15 sales on the live app | 20 min |
| 8 | README, cleanup, submit | 30 min |

---

## 3. Setup

### Neon
1. Create a project at neon.tech. Copy the **pooled** connection string.
2. Open the SQL editor and run the schema below.

### Schema

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

Amounts are stored as integer kobo (₦1 = 100 kobo) so there are no floating point errors.

### Project

```bash
npx create-next-app@latest daily-sales-log --typescript --app --eslint
cd daily-sales-log
npm i @neondatabase/serverless jose
```

### `.env.local` (never commit this)

```
DATABASE_URL=postgres://...neon.tech/neondb?sslmode=require
SHOP_PASSCODE=choose-something
SESSION_SECRET=any-long-random-string-32-chars-or-more
```

Add a `.env.example` with the same keys and empty values, and commit that instead.

---

## 4. Suggested file layout

```
app/
  page.tsx            # dashboard (server component)
  login/page.tsx      # passcode form
  actions.ts          # addSale, login, logout server actions
  AddSaleForm.tsx     # client component for the form
lib/
  db.ts               # neon client
  money.ts            # naira <-> kobo helpers, formatting
  auth.ts             # sign/verify session cookie
middleware.ts         # protects everything except /login
```

---

## 5. Key code

### `lib/db.ts`

```ts
import { neon } from "@neondatabase/serverless";
export const sql = neon(process.env.DATABASE_URL!);
```

### `lib/money.ts`

```ts
export const toKobo = (naira: string) => Math.round(parseFloat(naira) * 100);

export const formatNaira = (kobo: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(Number(kobo) / 100);

export const formatTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
```

### `lib/auth.ts`

```ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export const signSession = () =>
  new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

export async function verifySession(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
```

### `middleware.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();
  const ok = await verifySession(req.cookies.get("session")?.value);
  if (!ok) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
```

### `app/actions.ts`

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { toKobo } from "@/lib/money";

export async function login(formData: FormData) {
  if (formData.get("passcode") !== process.env.SHOP_PASSCODE) {
    redirect("/login?error=1");
  }
  (await cookies()).set("session", await signSession(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function addSale(formData: FormData) {
  const name = String(formData.get("item_name") ?? "").trim();
  const kobo = toKobo(String(formData.get("amount") ?? ""));
  const when = String(formData.get("sold_at") ?? ""); // "2026-10-13T14:30" in Lagos time

  if (!name || !Number.isFinite(kobo) || kobo <= 0) return;

  // Lagos is UTC+1 all year (no daylight saving), so append the offset.
  const soldAt = when ? `${when}:00+01:00` : new Date().toISOString();

  await sql`insert into sales (item_name, amount_kobo, sold_at)
            values (${name}, ${kobo}, ${soldAt})`;
  revalidatePath("/");
}
```

### Dashboard query (in `app/page.tsx`)

The table needs a per-row running total, and the header needs the day total. One query covers both with a window function:

```ts
const rows = await sql`
  select id, item_name, amount_kobo, sold_at,
         sum(amount_kobo) over (order by sold_at, id) as running_total_kobo
  from sales
  where (sold_at at time zone 'Africa/Lagos')::date
      = (now()     at time zone 'Africa/Lagos')::date
  order by sold_at, id`;

const dayTotal = rows.length ? rows[rows.length - 1].running_total_kobo : 0;
```

Render:
- A big **Today's total** card with `formatNaira(dayTotal)` and the sale count.
- A table with columns: Time, Item, Amount, Running total.
- The `AddSaleForm` above or beside the table. Default the time input to the current Lagos time.

Add `export const dynamic = "force-dynamic";` to the page so it never serves stale data.

---

## 6. Form details that make it feel finished

- Disable the submit button while pending (`useFormStatus`).
- Clear the form after a successful submit.
- `inputmode="decimal"` on the amount field.
- Show an empty state: "No sales yet today."
- Mobile friendly layout, since a shop owner will likely use a phone.

---

## 7. Deploy

1. Push to GitHub (check `.env.local` is in `.gitignore`).
2. Import the repo in Vercel.
3. Add `DATABASE_URL`, `SHOP_PASSCODE`, `SESSION_SECRET` under Environment Variables (or use the Vercel Neon integration, which adds `DATABASE_URL` for you).
4. Deploy, open the live URL, log in, add one sale, and refresh to confirm it persists.

---

## 8. Record the sales (on the live app)

Log these through the deployed form. Adjust the times to today. Shuffling a few out of order is useful because it proves the table sorts by time and the running total recalculates correctly.

| # | Time | Item | Amount (₦) |
|---|---|---|---|
| 1 | 08:05 | Bottled water (pack) | 1,500 |
| 2 | 08:40 | Indomie (carton) | 9,800 |
| 3 | 09:15 | Peak milk (tin) | 1,200 |
| 4 | 09:50 | Bread (large) | 2,000 |
| 5 | 10:30 | Eggs (crate) | 4,500 |
| 6 | 11:10 | Rice (5kg) | 8,500 |
| 7 | 11:45 | Groundnut oil (1L) | 3,200 |
| 8 | 12:20 | Sugar (1kg) | 1,800 |
| 9 | 13:05 | Soft drink (crate) | 5,500 |
| 10 | 14:00 | Tomato paste (tin) | 700 |
| 11 | 15:25 | Detergent (1kg) | 2,400 |
| 12 | 16:10 | Beans (paint bucket) | 6,000 |

Total should be **₦47,100**. Check that your dashboard agrees.

---

## 9. README template

Copy this into `README.md` and fill in the live link.

````md
# Daily Sales Log

A small app for a shop owner to log sales and see the day's running total.

**Live:** <your-vercel-url>
**Passcode for reviewers:** <share this in the submission message, not in the repo>

## Features
- Log a sale with item name, amount, and time
- Dashboard table of today's sales with a running total per row
- Day total at the top
- Passcode login

## Stack
Next.js (App Router, TypeScript), Neon Postgres, Vercel.

## Run locally
```bash
npm i
cp .env.example .env.local   # fill in DATABASE_URL, SHOP_PASSCODE, SESSION_SECRET
npm run dev
```
Run the SQL in `schema.sql` against your Neon database first.

## Notes

### What I built
<2 to 3 sentences in your own words.>

### Decisions I made and why
1. **Money stored as integer kobo.** Floats drift on addition, and a sales total that is off by a kobo is a trust problem for a shop owner.
2. **"Today" is calculated in Africa/Lagos time, in SQL.** Servers run in UTC, so a sale at 11:30pm in Lagos would land on the wrong day. Lagos has no daylight saving, which keeps the offset handling simple.
3. **Server components and server actions with raw SQL, no ORM.** The app has one table and two queries. Fewer dependencies and fewer moving parts.
4. **Passcode cookie instead of full auth.** One shop owner, one secret. A signed, httpOnly JWT cookie is enough and keeps the data off the public internet.

### With one more day
- Date picker to view and total any past day
- Edit and delete a sale, with a soft delete
- Daily summary: top items, sales by hour
- Export to CSV
- Tests for the money helpers and the total query
- Rate limiting on the login
````

Replace the decisions with what you actually did if you change anything. Reviewers can tell when the notes do not match the code. Keep the wording natural and in your own voice.

---

## 10. Final checklist before you submit

- [ ] Live URL opens in an incognito window and asks for the passcode
- [ ] 12 sales visible, total matches the table above
- [ ] Data persists after a hard refresh and after a new deploy
- [ ] No secrets in the repo (`git log -p | grep -i postgres` returns nothing)
- [ ] `.env.example` and `schema.sql` are committed
- [ ] README has Notes with your own decisions
- [ ] Repo is public (or the reviewer has access)
- [ ] Submission message includes live link, repo link, and the reviewer passcode

---

## 11. Common traps

- **Using `new Date()` for "today" in JS on the server.** It will be UTC. Do the day filter in SQL as shown.
- **Forgetting `force-dynamic`.** The dashboard may cache and look like it is not saving.
- **Unpooled Neon connection string** on serverless. Use the pooled one.
- **`bigint` comes back as a string** from Neon. Wrap in `Number()` before formatting, as `formatNaira` does.
- **Seeding with a script.** The brief says record them yourself in the app, so use the form.
