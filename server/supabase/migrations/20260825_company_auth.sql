create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('COMPANY_ADMIN', 'EMPLOYEE')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;

-- Security-definer helpers avoid recursive RLS checks on company_members.
create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = target_company_id
      and user_id = auth.uid()
      and role = 'COMPANY_ADMIN'
  );
$$;

create policy "Profiles are visible to their owner"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Profiles are editable by their owner"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Company members can read their company"
on public.companies for select
to authenticated
using (public.is_company_member(id));

create policy "Company admins can update their company"
on public.companies for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

create policy "Members can read memberships in their company"
on public.company_members for select
to authenticated
using (public.is_company_member(company_id));

create policy "Company admins can manage memberships"
on public.company_members for all
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));
