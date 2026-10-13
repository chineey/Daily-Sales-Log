-- Schema for Daily Sales Log
create table sales (
  id          bigserial primary key,
  item_name   text   not null check (length(trim(item_name)) > 0),
  amount_kobo bigint not null check (amount_kobo > 0),
  sold_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index sales_sold_at_idx on sales (sold_at);
