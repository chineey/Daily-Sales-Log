import { sql } from "@/lib/db";
import { formatNaira, formatTime } from "@/lib/money";
import AddSaleForm from "./AddSaleForm";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

interface SaleRow {
  id: string | number;
  item_name: string;
  amount_kobo: string | number;
  sold_at: string;
  running_total_kobo: string | number;
}

export default async function DashboardPage() {
  let rows: SaleRow[] = [];
  let dbError: string | null = null;

  try {
    const result = await sql`
      select id, item_name, amount_kobo, sold_at,
             sum(amount_kobo) over (order by sold_at, id) as running_total_kobo
      from sales
      where (sold_at at time zone 'Africa/Lagos')::date
          = (now()     at time zone 'Africa/Lagos')::date
      order by sold_at, id
    `;
    rows = result as unknown as SaleRow[];
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Database query failed:", errorMsg);
    dbError = errorMsg;
  }

  const dayTotalKobo =
    rows.length > 0
      ? Number(rows[rows.length - 1].running_total_kobo)
      : 0;
  const totalCount = rows.length;

  // Format today's date in Lagos time for the header
  const todayFormatted = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "full",
  }).format(new Date());

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">₦</div>
          <div>
            <h1 className="brand-title">Daily Sales Log</h1>
            <div className="brand-subtitle">
              <span>{todayFormatted}</span>
              <span className="live-badge">
                <span className="live-dot" /> Live (Africa/Lagos)
              </span>
            </div>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost"
            title="Log out of session"
            id="logout-button"
          >
            Sign out ↗
          </button>
        </form>
      </header>

      {/* Database Warning Banner if not connected */}
      {dbError && (
        <div
          style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.35)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            color: "#fca5a5",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
            ⚠️ Database connection required
          </div>
          <div style={{ fontSize: "0.875rem", color: "#fecdd3" }}>
            {dbError.includes("does not exist") ? (
              <>
                The <code>sales</code> table does not exist yet. Please run the SQL in{" "}
                <code>schema.sql</code> on your Neon database console.
              </>
            ) : (
              <>
                Unable to reach database: {dbError}. Please ensure <code>DATABASE_URL</code> is set in <code>.env.local</code>.
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Hero */}
      <section className="summary-grid">
        <div className="glass-card hero-total-card">
          <div className="card-label">
            <span>📊</span> Today&apos;s Running Revenue
          </div>
          <div className="card-total-amount" id="total-revenue-display">
            {formatNaira(dayTotalKobo)}
          </div>
          <div className="card-subtext">
            <span className="stat-chip">
              Total Transactions: <strong>{totalCount}</strong>
            </span>
            <span className="stat-chip">
              Currency: <strong>NGN (₦)</strong>
            </span>
            <span className="stat-chip">
              Storage: <strong>Integer Kobo</strong>
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="card-label">
            <span>⏱️</span> Today&apos;s Snapshot
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--text-muted)" }}>First Sale:</span>
              <strong style={{ color: "#ffffff" }}>
                {rows.length > 0 ? formatTime(rows[0].sold_at) : "—"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Latest Sale:</span>
              <strong style={{ color: "#ffffff" }}>
                {rows.length > 0 ? formatTime(rows[rows.length - 1].sold_at) : "—"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Average / Sale:</span>
              <strong style={{ color: "var(--accent-emerald)" }}>
                {rows.length > 0 ? formatNaira(Math.round(dayTotalKobo / rows.length)) : "₦0.00"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Add Sale Form + Transactions Table */}
      <main className="dashboard-grid">
        <section aria-label="Add Sale Form Section">
          <AddSaleForm />
        </section>

        <section aria-label="Transactions List Section" className="glass-card">
          <div className="table-header-row">
            <h2 className="table-title">
              <span>📋</span> Today&apos;s Transactions
            </h2>
            <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
              {rows.length} {rows.length === 1 ? "sale" : "sales"} recorded
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3 className="empty-title">No sales recorded yet today</h3>
              <p className="empty-desc">
                Use the form on the left to log your first sale. Your transactions and running balance will appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="sales-table" id="sales-transactions-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Running Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <span className="time-badge">
                          {formatTime(sale.sold_at)}
                        </span>
                      </td>
                      <td className="item-cell">{sale.item_name}</td>
                      <td className="amount-cell" style={{ textAlign: "right" }}>
                        {formatNaira(sale.amount_kobo)}
                      </td>
                      <td className="running-cell" style={{ textAlign: "right" }}>
                        {formatNaira(sale.running_total_kobo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
