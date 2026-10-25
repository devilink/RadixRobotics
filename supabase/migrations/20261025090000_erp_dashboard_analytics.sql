-- =============================================================================
-- RADIX ERP — Migration 11: daily aggregates for the dashboard year heatmaps
-- =============================================================================
-- Both functions are SECURITY INVOKER, so RLS decides which rows are counted:
-- each user sees totals only for the institutions (and, for inventory, the
-- role) they already have access to. Days are Asia/Kolkata calendar days.
-- =============================================================================

-- One row per day with any attendance of the given kind ('student' or 'staff').
-- attended/expected follow the dashboard's rate definition:
-- (present + late + ½ half-day) ÷ (marked − excused − on leave).
create or replace function public.erp_attendance_calendar(
  p_category text default 'all',
  p_kind text default 'student',
  p_days integer default 371)
returns table (
  day date, marked bigint, present bigint, absent bigint, late bigint,
  excused bigint, half_day bigint, on_leave bigint, attended numeric, expected bigint)
language sql stable security invoker set search_path = '' as $$
  select s.session_date,
         count(*),
         count(*) filter (where r.status = 'present'),
         count(*) filter (where r.status = 'absent'),
         count(*) filter (where r.status = 'late'),
         count(*) filter (where r.status = 'excused'),
         count(*) filter (where r.status = 'half_day'),
         count(*) filter (where r.status = 'on_leave'),
         sum(case when r.status in ('present', 'late') then 1 when r.status = 'half_day' then 0.5 else 0 end),
         count(*) filter (where r.status not in ('excused', 'on_leave'))
  from public.attendance_records r
  join public.attendance_sessions s on s.id = r.session_id
  join public.institutions i on i.id = s.institution_id
  where i.status = 'active'
    and (p_category = 'all' or i.institution_type::text = p_category)
    and r.kind::text = p_kind
    and s.session_date between (now() at time zone 'Asia/Kolkata')::date - (least(greatest(p_days, 1), 740) - 1)
                           and (now() at time zone 'Asia/Kolkata')::date
  group by s.session_date
  order by s.session_date
$$;

-- One row per day with any stock movement. Inventory RLS limits this to Super Admins.
create or replace function public.erp_inventory_calendar(p_days integer default 371)
returns table (day date, movements bigint, units_in bigint, units_out bigint, issued bigint, received bigint)
language sql stable security invoker set search_path = '' as $$
  select (m.occurred_at at time zone 'Asia/Kolkata')::date,
         count(*),
         coalesce(sum(greatest(m.quantity_change, 0)), 0)::bigint,
         coalesce(sum(greatest(-m.quantity_change, 0)), 0)::bigint,
         coalesce(-sum(m.quantity_change) filter (where m.movement_type = 'issue'), 0)::bigint,
         coalesce(sum(m.quantity_change) filter (where m.movement_type = 'receive'), 0)::bigint
  from public.inventory_movements m
  where (m.occurred_at at time zone 'Asia/Kolkata')::date
        >= (now() at time zone 'Asia/Kolkata')::date - (least(greatest(p_days, 1), 740) - 1)
  group by 1
  order by 1
$$;

revoke all on function public.erp_attendance_calendar(text, text, integer) from public, anon;
revoke all on function public.erp_inventory_calendar(integer) from public, anon;
grant execute on function public.erp_attendance_calendar(text, text, integer) to authenticated, service_role;
grant execute on function public.erp_inventory_calendar(integer) to authenticated, service_role;
