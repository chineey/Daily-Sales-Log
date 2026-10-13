CREATE TABLE IF NOT EXISTS sales (
  id BIGSERIAL PRIMARY KEY,
  item_name TEXT NOT NULL CHECK (length(trim(item_name)) > 0),
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales (sold_at);
