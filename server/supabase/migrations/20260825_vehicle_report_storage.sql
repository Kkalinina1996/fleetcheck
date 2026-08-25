insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-reports',
  'vehicle-reports',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Company members upload vehicle report media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-reports'
  and exists (
    select 1 from public.company_members
    where company_members.user_id = auth.uid()
      and company_members.company_id::text = split_part(name, '/', 1)
  )
);

create policy "Company members read vehicle report media"
on storage.objects for select to authenticated
using (
  bucket_id = 'vehicle-reports'
  and exists (
    select 1 from public.company_members
    where company_members.user_id = auth.uid()
      and company_members.company_id::text = split_part(name, '/', 1)
  )
);
