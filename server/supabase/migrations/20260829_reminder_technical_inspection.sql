alter table public.vehicle_reminders
  drop constraint if exists vehicle_reminders_reminder_type_check;

update public.vehicle_reminders
set reminder_type = 'TECHNICAL_INSPECTION'
where reminder_type = 'TUV';

alter table public.vehicle_reminders
  add constraint vehicle_reminders_reminder_type_check
  check (reminder_type in ('TECHNICAL_INSPECTION', 'INSURANCE', 'SERVICE', 'OIL_CHANGE', 'TIRE_CHANGE', 'OTHER'));
