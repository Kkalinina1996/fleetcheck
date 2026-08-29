alter table public.vehicles
  add column if not exists qr_access_token uuid unique,
  add column if not exists qr_access_enabled boolean not null default false,
  add column if not exists qr_access_updated_at timestamptz;

create unique index if not exists vehicles_qr_access_token_unique
  on public.vehicles (qr_access_token)
  where qr_access_token is not null;

create index if not exists vehicles_qr_access_enabled_index
  on public.vehicles (qr_access_token)
  where qr_access_enabled = true;
