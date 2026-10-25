-- =============================================================================
-- RADIX ERP — Migration 4: authorization helpers, grants and Row-Level Security
-- =============================================================================
-- Every ERP table has RLS enabled. Most writes are performed through
-- SECURITY DEFINER functions (migration 5) that re-check permissions, so the
-- `authenticated` role only receives direct write grants on simple tables.
--
-- Policy pattern for permission P on column institution_id:
--   (select erp_private.has_platform_permission('P'))
--     or institution_id in (select erp_private.institutions_with('P'))
-- Both sub-selects are uncorrelated, so Postgres evaluates them once per
-- statement instead of once per row.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER: read RBAC tables without RLS recursion)
-- -----------------------------------------------------------------------------
create or replace function erp_private.has_platform_permission(p_perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_role_assignments a
    join public.role_permissions rp on rp.role_key = a.role_key
    join public.profiles pr on pr.id = a.user_id
    where a.user_id = auth.uid()
      and a.institution_id is null
      and rp.permission_key = p_perm
      and pr.is_active
  )
$$;

create or replace function erp_private.institutions_with(p_perm text)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select a.institution_id
  from public.user_role_assignments a
  join public.role_permissions rp on rp.role_key = a.role_key
  join public.profiles pr on pr.id = a.user_id
  where a.user_id = auth.uid()
    and a.institution_id is not null
    and rp.permission_key = p_perm
    and pr.is_active
$$;

create or replace function erp_private.has_permission(p_perm text, p_institution uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select erp_private.has_platform_permission(p_perm)
      or exists (select 1 from erp_private.institutions_with(p_perm) i where i = p_institution)
$$;

create or replace function erp_private.my_person_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select person_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function erp_private.my_membership_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.institution_memberships m
  where m.person_id = erp_private.my_person_id()
$$;

create or replace function erp_private.my_institution_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.institution_id from public.institution_memberships m
  where m.person_id = erp_private.my_person_id()
$$;

-- Classes/batches the current user teaches.
create or replace function erp_private.my_group_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select ga.group_id from public.group_assignments ga
  join public.institution_memberships m on m.id = ga.membership_id
  where m.person_id = erp_private.my_person_id() and m.status = 'active'
$$;

-- Classes/batches the current user is enrolled in (student self-service).
create or replace function erp_private.my_enrolled_group_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select e.group_id from public.enrollments e
  join public.institution_memberships m on m.id = e.membership_id
  where m.person_id = erp_private.my_person_id()
$$;

-- Student memberships enrolled in a class/batch the current user teaches.
create or replace function erp_private.my_assigned_student_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select distinct e.membership_id from public.enrollments e
  where e.group_id in (select erp_private.my_group_ids())
$$;

-- Users holding any role at an institution where the caller has users.manage.
create or replace function erp_private.manageable_user_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select a.user_id from public.user_role_assignments a
  where a.institution_id in (select erp_private.institutions_with('users.manage'))
$$;

grant execute on all functions in schema erp_private to authenticated;

-- -----------------------------------------------------------------------------
-- Grants: start from nothing, then add exactly what the policies allow.
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'permissions','roles','role_permissions','people','profiles','institutions','campuses',
    'user_role_assignments','institution_memberships','student_profiles','work_shifts',
    'employee_profiles','guardians','guardian_student_relationships','learning_groups',
    'enrollments','group_assignments','audit_logs','attendance_sessions','attendance_records',
    'attendance_correction_requests','leave_requests'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

grant insert, update on public.institutions to authenticated;
grant insert, update, delete on public.campuses to authenticated;
grant insert, update, delete on public.work_shifts to authenticated;
grant insert, update on public.employee_profiles to authenticated;
grant insert, update on public.learning_groups to authenticated;
grant insert, update, delete on public.enrollments to authenticated;
grant insert, update, delete on public.group_assignments to authenticated;

-- -----------------------------------------------------------------------------
-- Catalogue tables: readable by any signed-in user (no personal data).
-- -----------------------------------------------------------------------------
create policy permissions_read on public.permissions for select to authenticated using (true);
create policy roles_read on public.roles for select to authenticated using (true);
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Profiles & role assignments
-- -----------------------------------------------------------------------------
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid()
  or (select erp_private.has_platform_permission('users.manage'))
  or id in (select erp_private.manageable_user_ids())
);

create policy ura_read on public.user_role_assignments for select to authenticated using (
  user_id = auth.uid()
  or (select erp_private.has_platform_permission('users.manage'))
  or institution_id in (select erp_private.institutions_with('users.manage'))
);

-- -----------------------------------------------------------------------------
-- Institutions & campuses
-- -----------------------------------------------------------------------------
create policy institutions_read on public.institutions for select to authenticated using (
  (select erp_private.has_platform_permission('institutions.view'))
  or id in (select erp_private.institutions_with('institutions.view'))
  or id in (select erp_private.my_institution_ids())
);
create policy institutions_insert on public.institutions for insert to authenticated with check (
  (select erp_private.has_platform_permission('institutions.manage'))
);
create policy institutions_update on public.institutions for update to authenticated
  using ((select erp_private.has_platform_permission('institutions.manage'))
         or id in (select erp_private.institutions_with('institutions.manage')))
  with check ((select erp_private.has_platform_permission('institutions.manage'))
         or id in (select erp_private.institutions_with('institutions.manage')));

create policy campuses_read on public.campuses for select to authenticated using (
  (select erp_private.has_platform_permission('institutions.view'))
  or institution_id in (select erp_private.institutions_with('institutions.view'))
  or institution_id in (select erp_private.my_institution_ids())
);
create policy campuses_write on public.campuses for all to authenticated
  using ((select erp_private.has_platform_permission('institutions.manage'))
         or institution_id in (select erp_private.institutions_with('institutions.manage')))
  with check ((select erp_private.has_platform_permission('institutions.manage'))
         or institution_id in (select erp_private.institutions_with('institutions.manage')));

-- -----------------------------------------------------------------------------
-- People & memberships
-- -----------------------------------------------------------------------------
create policy memberships_read on public.institution_memberships for select to authenticated using (
  (member_type = 'student' and (
      (select erp_private.has_platform_permission('students.view'))
      or institution_id in (select erp_private.institutions_with('students.view'))
      or (institution_id in (select erp_private.institutions_with('students.view_assigned'))
          and id in (select erp_private.my_assigned_student_ids()))
  ))
  or (member_type <> 'student' and (
      (select erp_private.has_platform_permission('staff.view'))
      or institution_id in (select erp_private.institutions_with('staff.view'))
      or (select erp_private.has_platform_permission('staff_attendance.view'))
      or institution_id in (select erp_private.institutions_with('staff_attendance.view'))
  ))
  or id in (select erp_private.my_membership_ids())
);

-- A person is visible when at least one of their memberships is visible.
create policy people_read on public.people for select to authenticated using (
  id in (select m.person_id from public.institution_memberships m)
  or id = (select erp_private.my_person_id())
);

create policy student_profiles_read on public.student_profiles for select to authenticated using (
  membership_id in (select m.id from public.institution_memberships m where m.member_type = 'student')
);

create policy work_shifts_read on public.work_shifts for select to authenticated using (
  (select erp_private.has_platform_permission('staff.view'))
  or institution_id in (select erp_private.institutions_with('staff.view'))
  or institution_id in (select erp_private.institutions_with('staff_attendance.view'))
  or (select erp_private.has_platform_permission('staff_attendance.view'))
);
create policy work_shifts_write on public.work_shifts for all to authenticated
  using ((select erp_private.has_platform_permission('staff.manage'))
         or institution_id in (select erp_private.institutions_with('staff.manage')))
  with check ((select erp_private.has_platform_permission('staff.manage'))
         or institution_id in (select erp_private.institutions_with('staff.manage')));

-- HR details: only hr.view, or the employee themself.
create policy employee_profiles_read on public.employee_profiles for select to authenticated using (
  (select erp_private.has_platform_permission('hr.view'))
  or institution_id in (select erp_private.institutions_with('hr.view'))
  or membership_id in (select erp_private.my_membership_ids())
);
create policy employee_profiles_write on public.employee_profiles for all to authenticated
  using (((select erp_private.has_platform_permission('staff.manage'))
          or institution_id in (select erp_private.institutions_with('staff.manage')))
         and ((select erp_private.has_platform_permission('hr.view'))
          or institution_id in (select erp_private.institutions_with('hr.view'))))
  with check (((select erp_private.has_platform_permission('staff.manage'))
          or institution_id in (select erp_private.institutions_with('staff.manage')))
         and ((select erp_private.has_platform_permission('hr.view'))
          or institution_id in (select erp_private.institutions_with('hr.view'))));

-- Guardian contact details: full students.view only (not teachers' assigned view).
create policy gsr_read on public.guardian_student_relationships for select to authenticated using (
  exists (
    select 1 from public.institution_memberships m
    where m.id = student_membership_id
      and ((select erp_private.has_platform_permission('students.view'))
           or m.institution_id in (select erp_private.institutions_with('students.view')))
  )
  or student_membership_id in (select erp_private.my_membership_ids())
);
create policy guardians_read on public.guardians for select to authenticated using (
  id in (select g.guardian_id from public.guardian_student_relationships g)
);

-- -----------------------------------------------------------------------------
-- Learning groups, enrolments, assignments
-- -----------------------------------------------------------------------------
create policy groups_read on public.learning_groups for select to authenticated using (
  (select erp_private.has_platform_permission('groups.view'))
  or institution_id in (select erp_private.institutions_with('groups.view'))
  or id in (select erp_private.my_group_ids())
  or id in (select erp_private.my_enrolled_group_ids())
);
create policy groups_insert on public.learning_groups for insert to authenticated with check (
  (select erp_private.has_platform_permission('groups.manage'))
  or institution_id in (select erp_private.institutions_with('groups.manage'))
);
create policy groups_update on public.learning_groups for update to authenticated
  using ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage')))
  with check ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage')));

create policy enrollments_read on public.enrollments for select to authenticated using (
  (select erp_private.has_platform_permission('students.view'))
  or institution_id in (select erp_private.institutions_with('students.view'))
  or group_id in (select erp_private.my_group_ids())
  or membership_id in (select erp_private.my_membership_ids())
);
create policy enrollments_write on public.enrollments for all to authenticated
  using ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage'))
         or institution_id in (select erp_private.institutions_with('students.manage')))
  with check ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage'))
         or institution_id in (select erp_private.institutions_with('students.manage')));

create policy group_assignments_read on public.group_assignments for select to authenticated using (
  (select erp_private.has_platform_permission('groups.view'))
  or institution_id in (select erp_private.institutions_with('groups.view'))
  or membership_id in (select erp_private.my_membership_ids())
);
create policy group_assignments_write on public.group_assignments for all to authenticated
  using ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage')))
  with check ((select erp_private.has_platform_permission('groups.manage'))
         or institution_id in (select erp_private.institutions_with('groups.manage')));

-- -----------------------------------------------------------------------------
-- Attendance (read-only for clients; all writes go through definer functions)
-- -----------------------------------------------------------------------------
create policy attendance_sessions_read on public.attendance_sessions for select to authenticated using (
  (kind = 'student' and (
      (select erp_private.has_platform_permission('attendance.view'))
      or institution_id in (select erp_private.institutions_with('attendance.view'))
      or (institution_id in (select erp_private.institutions_with('attendance.view_assigned'))
          and group_id in (select erp_private.my_group_ids()))
  ))
  or (kind = 'staff' and (
      (select erp_private.has_platform_permission('staff_attendance.view'))
      or institution_id in (select erp_private.institutions_with('staff_attendance.view'))
  ))
  or id in (select r.session_id from public.attendance_records r
            where r.membership_id in (select erp_private.my_membership_ids()))
);

create policy attendance_records_read on public.attendance_records for select to authenticated using (
  (kind = 'student' and (
      (select erp_private.has_platform_permission('attendance.view'))
      or institution_id in (select erp_private.institutions_with('attendance.view'))
      or (institution_id in (select erp_private.institutions_with('attendance.view_assigned'))
          and membership_id in (select erp_private.my_assigned_student_ids()))
  ))
  or (kind = 'staff' and (
      (select erp_private.has_platform_permission('staff_attendance.view'))
      or institution_id in (select erp_private.institutions_with('staff_attendance.view'))
  ))
  or membership_id in (select erp_private.my_membership_ids())
);

create policy corrections_read on public.attendance_correction_requests for select to authenticated using (
  requested_by = auth.uid()
  or (select erp_private.has_platform_permission('attendance.approve'))
  or (select erp_private.has_platform_permission('staff_attendance.approve'))
  or institution_id in (select erp_private.institutions_with('attendance.approve'))
  or institution_id in (select erp_private.institutions_with('staff_attendance.approve'))
);

create policy leave_read on public.leave_requests for select to authenticated using (
  membership_id in (select erp_private.my_membership_ids())
  or (select erp_private.has_platform_permission('leave.view'))
  or institution_id in (select erp_private.institutions_with('leave.view'))
);

create policy audit_logs_read on public.audit_logs for select to authenticated using (
  (select erp_private.has_platform_permission('audit.view'))
  or institution_id in (select erp_private.institutions_with('audit.view'))
);
