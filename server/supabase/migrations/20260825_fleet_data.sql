create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete cascade,
  owner_type text not null check (owner_type in ('COMPANY', 'PRIVATE')),
  plate_number text not null,
  brand text not null,
  model text,
  year integer check (year is null or year between 1886 and 2100),
  vehicle_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (owner_type = 'COMPANY' and company_id is not null)
    or (owner_type = 'PRIVATE' and owner_user_id is not null)
  )
);

create unique index if not exists vehicles_company_plate_unique
on public.vehicles (company_id, lower(plate_number))
where company_id is not null;
create index if not exists vehicles_company_id_index on public.vehicles(company_id);
create index if not exists vehicles_owner_user_id_index on public.vehicles(owner_user_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  employee_name text,
  type text not null check (type in ('VEHICLE_OK', 'ISSUE')),
  issue_type text check (issue_type in ('TIRE', 'FUEL', 'ADBLUE', 'OIL_SERVICE', 'LIGHTS', 'DAMAGE', 'WARNING_LIGHT', 'ACCIDENT', 'OTHER')),
  description text,
  status text not null check (status in ('OK', 'OPEN', 'IN_REPAIR', 'RESOLVED')),
  media_type text check (media_type in ('image', 'video')),
  media_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'VEHICLE_OK' and status = 'OK') or type = 'ISSUE'),
  check ((type = 'ISSUE') or issue_type is null)
);

create index if not exists reports_company_created_index on public.reports(company_id, created_at desc);
create index if not exists reports_vehicle_created_index on public.reports(vehicle_id, created_at desc);
create index if not exists reports_active_issues_index on public.reports(vehicle_id, status) where status in ('OPEN', 'IN_REPAIR');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_company_created_index on public.notifications(company_id, created_at desc);
create index if not exists notifications_company_unread_index on public.notifications(company_id, is_read) where is_read = false;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy "Company members can read company vehicles"
on public.vehicles for select to authenticated
using (company_id is not null and public.is_company_member(company_id));
create policy "Company admins manage company vehicles"
on public.vehicles for all to authenticated
using (company_id is not null and public.is_company_admin(company_id))
with check (company_id is not null and public.is_company_admin(company_id));

create policy "Company members can read company reports"
on public.reports for select to authenticated
using (company_id is not null and public.is_company_member(company_id));
create policy "Company members create company reports"
on public.reports for insert to authenticated
with check (company_id is not null and public.is_company_member(company_id));
create policy "Company admins update company reports"
on public.reports for update to authenticated
using (company_id is not null and public.is_company_admin(company_id))
with check (company_id is not null and public.is_company_admin(company_id));

create policy "Company admins read notifications"
on public.notifications for select to authenticated
using (public.is_company_admin(company_id));
create policy "Company admins update notifications"
on public.notifications for update to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));
