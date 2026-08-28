alter table public.reports
  add column if not exists priority text;

alter table public.reports
  drop constraint if exists reports_priority_check;

alter table public.reports
  add constraint reports_priority_check
  check (priority is null or priority in ('ATTENTION', 'URGENT'));

alter table public.reports
  drop constraint if exists reports_issue_type_check;

alter table public.reports
  add constraint reports_issue_type_check
  check (issue_type is null or issue_type in (
    'TIRE', 'FUEL', 'ADBLUE', 'OIL_SERVICE', 'LIGHTS', 'DAMAGE', 'WARNING_LIGHT', 'ACCIDENT', 'OTHER',
    'TIRES_WHEELS', 'ENGINE', 'BRAKES', 'BODY_DAMAGE', 'INTERIOR', 'FLUID_OIL'
  ));

create index if not exists reports_company_priority_index
  on public.reports (company_id, priority)
  where status in ('OPEN', 'IN_REPAIR');
