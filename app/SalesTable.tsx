"use client";

import { useState } from "react";
import { formatNaira, formatTime, formatLagosDatetimeInput, toKobo } from "@/lib/money";
import { deleteSale, updateSale } from "./actions";

export interface SaleRow {
  id: string | number;
  item_name: string;
  amount_kobo: string | number;
  quantity?: number;
  sold_at: string;
  running_total_kobo: string | number;
}

interface SalesTableProps {
  rows: SaleRow[];
}

export default function SalesTable({ rows }: SalesTableProps) {
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnitAmount, setEditUnitAmount] = useState("");
  const [editTime, setEditTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function startEdit(sale: SaleRow) {
    // If item name contains (×N), extract base name and quantity
    const qtyMatch = sale.item_name.match(/^(.*?)(?:\s*\([×x](\d+)\))?$/);
    const baseName = qtyMatch ? qtyMatch[1].trim() : sale.item_name;
    const qty = sale.quantity || (qtyMatch && qtyMatch[2] ? parseInt(qtyMatch[2], 10) : 1);

    const totalKobo = Number(sale.amount_kobo);
    const unitKobo = Math.round(totalKobo / Math.max(1, qty));
    const unitNaira = (unitKobo / 100).toFixed(2);

    setEditingSale(sale);
    setEditName(baseName);
    setEditQuantity(qty);
    setEditUnitAmount(unitNaira);
    setEditTime(formatLagosDatetimeInput(sale.sold_at));
    setErrorMessage(null);
  }

  function closeEdit() {
    setEditingSale(null);
    setErrorMessage(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;
    setIsSaving(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("id", String(editingSale.id));
    formData.append("item_name", editName);
    formData.append("quantity", String(editQuantity));
    formData.append("amount", editUnitAmount);
    formData.append("sold_at", editTime);

    const res = await updateSale(formData);
    setIsSaving(false);
    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      setEditingSale(null);
    }
  }

  async function handleDelete(sale: SaleRow) {
    const confirmed = window.confirm(
      `Delete transaction "${sale.item_name}" for ${formatNaira(sale.amount_kobo)}?`
    );
    if (!confirmed) return;

    setDeletingId(sale.id);
    const res = await deleteSale(sale.id);
    setDeletingId(null);
    if (res?.error) {
      alert(res.error);
    }
  }

  const editUnitKobo = toKobo(editUnitAmount);
  const editTotalKobo = editUnitKobo * Math.max(1, editQuantity);

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h3 className="empty-title">No sales recorded yet today</h3>
        <p className="empty-desc">
          Use the form on the left to log your first sale. Your transactions, running balance, and actions will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="sales-table" id="sales-transactions-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Item</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Running Total</th>
              <th style={{ textAlign: "center", width: "90px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <span className="time-badge">{formatTime(sale.sold_at)}</span>
                </td>
                <td className="item-cell">
                  <span>{sale.item_name}</span>
                </td>
                <td className="amount-cell" style={{ textAlign: "right" }}>
                  {formatNaira(sale.amount_kobo)}
                </td>
                <td className="running-cell" style={{ textAlign: "right" }}>
                  {formatNaira(sale.running_total_kobo)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="action-btns">
                    <button
                      type="button"
                      className="btn-action btn-edit"
                      onClick={() => startEdit(sale)}
                      title="Edit sale"
                      id={`edit-sale-${sale.id}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(sale)}
                      disabled={deletingId === sale.id}
                      title="Delete sale"
                      id={`delete-sale-${sale.id}`}
                    >
                      {deletingId === sale.id ? (
                        <span className="spinner" style={{ width: 12, height: 12 }} />
                      ) : (
                        "🗑️"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span>✏️</span> Edit Sale Entry
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={closeEdit}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="alert-error" role="alert">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit_item_name">
                  Item Name
                </label>
                <input
                  id="edit_item_name"
                  type="text"
                  required
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr",
                  gap: "0.85rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="edit_quantity">
                    Quantity
                  </label>
                  <input
                    id="edit_quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="form-input"
                    style={{ textAlign: "center", fontWeight: 700 }}
                    value={editQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditQuantity(Number.isFinite(val) && val > 0 ? val : 1);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit_amount">
                    Unit Price (₦)
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₦</span>
                    <input
                      id="edit_amount"
                      type="number"
                      step="any"
                      min="1"
                      required
                      inputMode="decimal"
                      className="form-input has-prefix"
                      value={editUnitAmount}
                      onChange={(e) => setEditUnitAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Live Multiplier Preview */}
              {editUnitKobo > 0 && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px dashed rgba(16, 185, 129, 0.35)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.6rem 0.85rem",
                    marginBottom: "1.1rem",
                    fontSize: "0.825rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {editQuantity} × {formatNaira(editUnitKobo)} =
                  </span>
                  <strong
                    style={{
                      color: "var(--accent-emerald)",
                      fontSize: "1.05rem",
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    New Total: {formatNaira(editTotalKobo)}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="edit_sold_at">
                  Sale Time (Africa/Lagos)
                </label>
                <input
                  id="edit_sold_at"
                  type="datetime-local"
                  required
                  className="form-input"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "auto", minWidth: "140px" }}
                  disabled={isSaving}
                  id="save-edit-button"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
