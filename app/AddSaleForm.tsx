"use client";

import { useRef, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { addSale } from "./actions";
import { getLagosDatetimeLocal } from "@/lib/money";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary"
      id="submit-sale-button"
    >
      {pending ? (
        <>
          <span className="spinner" />
          <span>Recording sale...</span>
        </>
      ) : (
        <>
          <span>+ Record Sale</span>
        </>
      )}
    </button>
  );
}

const QUICK_ITEMS = [
  "Bottled water (pack)",
  "Indomie (carton)",
  "Peak milk (tin)",
  "Bread (large)",
  "Eggs (crate)",
  "Rice (5kg)",
  "Groundnut oil (1L)",
  "Soft drink (crate)",
];

export default function AddSaleForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [defaultTime, setDefaultTime] = useState("");
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    // Lagos is UTC+1. Default the input to the current Lagos datetime
    setDefaultTime(getLagosDatetimeLocal());
  }, []);

  async function handleAction(formData: FormData) {
    setError(null);
    setSuccessNotice(false);

    const res = await addSale(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccessNotice(true);
      setItemName("");
      setAmount("");
      // Refresh default time to now
      setDefaultTime(getLagosDatetimeLocal());
      if (formRef.current) {
        formRef.current.reset();
      }
      setTimeout(() => setSuccessNotice(false), 3000);
    }
  }

  return (
    <div className="glass-card">
      <h2 className="form-title">
        <span>🛒</span> Log New Sale
      </h2>
      <p className="form-desc">
        Record each transaction immediately to update today&apos;s running total.
      </p>

      {error && (
        <div className="alert-error" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#6ee7b7",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>✅</span>
          <span>Sale recorded successfully!</span>
        </div>
      )}

      <form ref={formRef} action={handleAction}>
        <div className="form-group">
          <label htmlFor="item_name" className="form-label">
            Item Name
          </label>
          <input
            id="item_name"
            name="item_name"
            type="text"
            required
            className="form-input"
            placeholder="e.g. Indomie (carton)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            autoComplete="off"
          />

          <div className="quick-picks">
            {QUICK_ITEMS.map((item) => (
              <button
                type="button"
                key={item}
                className="quick-pick-btn"
                onClick={() => setItemName(item)}
              >
                + {item}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amount" className="form-label">
            Amount (₦)
          </label>
          <div className="input-wrapper">
            <span className="input-prefix">₦</span>
            <input
              id="amount"
              name="amount"
              type="number"
              step="any"
              min="1"
              required
              inputMode="decimal"
              className="form-input has-prefix"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="sold_at" className="form-label">
            Sale Time (Africa/Lagos)
          </label>
          <input
            id="sold_at"
            name="sold_at"
            type="datetime-local"
            defaultValue={defaultTime}
            key={defaultTime}
            className="form-input"
            required
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
