create table public.vehicle_reminders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('TUV','INSURANCE','SERVICE','OIL_CHANGE','TIRE_CHANGE','OTHER')),
  due_date date not null,
  note text,
  status text not null default 'UPCOMING' check (status in ('UPCOMING','COMPLETED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((company_id is not null and owner_user_id is null) or (company_id is null and owner_user_id is not null))
);
create index vehicle_reminders_company_due_index on public.vehicle_reminders(company_id, due_date) where status = 'UPCOMING';
create index vehicle_reminders_private_due_index on public.vehicle_reminders(owner_user_id, due_date) where status = 'UPCOMING';
create trigger vehicle_reminders_set_updated_at before update on public.vehicle_reminders for each row execute function public.set_updated_at();
alter table public.vehicle_reminders enable row level security;
create policy "Company members read company reminders" on public.vehicle_reminders for select to authenticated using (company_id is not null and public.is_company_member(company_id));
create policy "Company admins manage company reminders" on public.vehicle_reminders for all to authenticated using (company_id is not null and public.is_company_admin(company_id)) with check (company_id is not null and public.is_company_admin(company_id));
create policy "Private owners read reminders" on public.vehicle_reminders for select to authenticated using (company_id is null and owner_user_id = auth.uid());
create policy "Private owners manage reminders" on public.vehicle_reminders for all to authenticated using (company_id is null and owner_user_id = auth.uid()) with check (company_id is null and owner_user_id = auth.uid());
