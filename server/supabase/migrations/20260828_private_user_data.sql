create unique index if not exists vehicles_private_owner_plate_unique
on public.vehicles (owner_user_id, lower(plate_number))
where owner_type = 'PRIVATE' and owner_user_id is not null;

create index if not exists reports_private_owner_created_index
on public.reports (created_by, created_at desc)
where company_id is null;

create policy "Private owners can read their vehicles"
on public.vehicles for select to authenticated
using (
  owner_type = 'PRIVATE'
  and owner_user_id = auth.uid()
  and company_id is null
);

create policy "Private owners can create their vehicles"
on public.vehicles for insert to authenticated
with check (
  owner_type = 'PRIVATE'
  and owner_user_id = auth.uid()
  and company_id is null
);

create policy "Private owners can update their vehicles"
on public.vehicles for update to authenticated
using (
  owner_type = 'PRIVATE'
  and owner_user_id = auth.uid()
  and company_id is null
)
with check (
  owner_type = 'PRIVATE'
  and owner_user_id = auth.uid()
  and company_id is null
);

create policy "Private owners can read their reports"
on public.reports for select to authenticated
using (
  company_id is null
  and created_by = auth.uid()
  and exists (
    select 1 from public.vehicles
    where vehicles.id = reports.vehicle_id
      and vehicles.owner_type = 'PRIVATE'
      and vehicles.owner_user_id = auth.uid()
      and vehicles.company_id is null
  )
);

create policy "Private owners can create their reports"
on public.reports for insert to authenticated
with check (
  company_id is null
  and created_by = auth.uid()
  and exists (
    select 1 from public.vehicles
    where vehicles.id = reports.vehicle_id
      and vehicles.owner_type = 'PRIVATE'
      and vehicles.owner_user_id = auth.uid()
      and vehicles.company_id is null
  )
);

create policy "Private owners upload vehicle report media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-reports'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Private owners read vehicle report media"
on storage.objects for select to authenticated
using (
  bucket_id = 'vehicle-reports'
  and split_part(name, '/', 1) = auth.uid()::text
);
