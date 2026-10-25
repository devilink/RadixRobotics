-- =============================================================================
-- RADIX ERP — Migration 5: transactional write functions and report queries
-- =============================================================================
-- Write functions are SECURITY DEFINER: each one authenticates the caller,
-- re-checks permissions against the target institution, validates input and
-- performs all changes in a single transaction. Report functions are
-- SECURITY INVOKER so RLS limits them to what the caller may see.
--
-- Error codes surfaced to the app:
--   42501 permission denied · P0002 not found · 22023 invalid input
--   55000 invalid state     · 23505 duplicate  · 23514 rule violation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Internal helpers
-- -----------------------------------------------------------------------------
create or replace function erp_private.require_user()
returns uuid language plpgsql stable set search_path = '' as $$
declare v uuid := auth.uid();
begin
  if v is null or not exists (select 1 from public.profiles where id = v and is_active) then
    raise exception 'You must be signed in with an active account' using errcode = '42501';
  end if;
  return v;
end $$;

create or replace function erp_private.institution_today(p_institution uuid)
returns date language sql stable security definer set search_path = '' as $$
  select (now() at time zone timezone)::date from public.institutions where id = p_institution
$$;

-- 'HH:MM' on a local date in the institution's time zone → timestamptz.
create or replace function erp_private.local_ts(p_date date, p_hhmm text, p_tz text)
returns timestamptz language plpgsql stable set search_path = '' as $$
begin
  if p_hhmm is null or btrim(p_hhmm) = '' then return null; end if;
  if p_hhmm !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Invalid time "%": use HH:MM (24-hour)', p_hhmm using errcode = '22023';
  end if;
  return (p_date + p_hhmm::time) at time zone p_tz;
end $$;

create or replace function erp_private.can_mark(p_institution uuid, p_kind public.attendance_kind, p_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select case p_kind
    when 'student' then
      erp_private.has_permission('attendance.mark', p_institution)
      or (erp_private.has_permission('attendance.mark_assigned', p_institution)
          and p_group in (select erp_private.my_group_ids()))
    else erp_private.has_permission('staff_attendance.mark', p_institution)
  end
$$;

create or replace function erp_private.correct_perm(p_kind public.attendance_kind)
returns text language sql immutable set search_path = '' as $$
  select case p_kind when 'student' then 'attendance.correct' else 'staff_attendance.correct' end
$$;

create or replace function erp_private.approve_perm(p_kind public.attendance_kind)
returns text language sql immutable set search_path = '' as $$
  select case p_kind when 'student' then 'attendance.approve' else 'staff_attendance.approve' end
$$;

-- Markers may only touch registers within the institution's back-date window;
-- older registers need the correct permission. Future dates are never allowed.
create or replace function erp_private.check_register_date(
  p_institution uuid, p_kind public.attendance_kind, p_date date)
returns void language plpgsql stable security definer set search_path = '' as $$
declare v_today date; v_days int;
begin
  select (now() at time zone timezone)::date, attendance_backdate_days
    into v_today, v_days from public.institutions where id = p_institution;
  if p_date > v_today then
    raise exception 'Attendance cannot be recorded for a future date' using errcode = '22023';
  end if;
  if p_date < v_today - v_days
     and not erp_private.has_permission(erp_private.correct_perm(p_kind), p_institution) then
    raise exception 'Registers older than % days can only be changed by authorised staff', v_days
      using errcode = '42501';
  end if;
end $$;

-- Members expected on a register: enrolled students for a group register,
-- active non-student members for a staff register (by validity window).
create or replace function erp_private.roster_ids(p_session uuid)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select e.membership_id
  from public.attendance_sessions s
  join public.enrollments e on e.group_id = s.group_id
  join public.institution_memberships m on m.id = e.membership_id
  where s.id = p_session and s.kind = 'student'
    and e.start_date <= s.session_date and (e.end_date is null or e.end_date >= s.session_date)
    and m.start_date <= s.session_date and (m.end_date is null or m.end_date >= s.session_date)
    and (m.status = 'active' or m.end_date is not null)
  union
  select m.id
  from public.attendance_sessions s
  join public.institution_memberships m on m.institution_id = s.institution_id
  where s.id = p_session and s.kind = 'staff' and m.member_type <> 'student'
    and m.start_date <= s.session_date and (m.end_date is null or m.end_date >= s.session_date)
    and (m.status = 'active' or m.end_date is not null)
$$;

create or replace function erp_private.apply_correction(
  p_record uuid, p_status public.attendance_status, p_in timestamptz, p_out timestamptz,
  p_reason text, p_actor uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('erp.audit_reason', p_reason, true);
  update public.attendance_records set
    status = p_status,
    check_in_at = case when p_status in ('present', 'late', 'half_day') then p_in end,
    check_out_at = case when p_status in ('present', 'late', 'half_day') then p_out end,
    corrected_by = p_actor, corrected_at = now(), correction_reason = p_reason,
    updated_by = p_actor, updated_at = now(), version = version + 1
  where id = p_record;
  perform set_config('erp.audit_reason', '', true);
end $$;

-- -----------------------------------------------------------------------------
-- People
-- -----------------------------------------------------------------------------
create or replace function public.erp_create_member(
  p_institution uuid,
  p_member_type public.member_type,
  p_first_name text,
  p_last_name text,
  p_member_code text,
  p_email text default null,
  p_phone text default null,
  p_campus uuid default null,
  p_start_date date default null,
  p_person uuid default null,
  p_details jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_inst public.institutions;
  v_perm text := case when p_member_type = 'student' then 'students.manage' else 'staff.manage' end;
  v_person uuid := p_person;
  v_membership uuid := gen_random_uuid();
begin
  select * into v_inst from public.institutions where id = p_institution;
  if not found or not erp_private.has_permission(v_perm, p_institution) then
    raise exception 'You are not allowed to add this type of member here' using errcode = '42501';
  end if;
  if v_inst.status <> 'active' then
    raise exception 'Institution % is not active', v_inst.name using errcode = '55000';
  end if;
  if (p_member_type = 'student' and v_inst.institution_type = 'head_office')
     or (p_member_type = 'teacher' and v_inst.institution_type <> 'school')
     or (p_member_type = 'employee' and v_inst.institution_type <> 'head_office') then
    raise exception 'A % cannot be added to a % institution', p_member_type, v_inst.institution_type
      using errcode = '23514';
  end if;

  if v_person is not null then
    -- Linking an existing person: the caller must already manage them somewhere.
    if not exists (
      select 1 from public.institution_memberships m
      where m.person_id = v_person
        and (erp_private.has_permission('students.manage', m.institution_id)
             or erp_private.has_permission('staff.manage', m.institution_id))
    ) then
      raise exception 'Person not found' using errcode = 'P0002';
    end if;
  else
    v_person := gen_random_uuid();
    insert into public.people (id, first_name, last_name, email, phone, created_by)
    values (v_person, btrim(p_first_name), coalesce(btrim(p_last_name), ''),
            nullif(lower(btrim(p_email)), ''), nullif(btrim(p_phone), ''), v_uid);
  end if;

  insert into public.institution_memberships
    (id, institution_id, person_id, campus_id, member_type, member_code, start_date, created_by)
  values (v_membership, p_institution, v_person, p_campus, p_member_type, upper(btrim(p_member_code)),
          coalesce(p_start_date, erp_private.institution_today(p_institution)), v_uid);

  if p_member_type = 'student' then
    insert into public.student_profiles (membership_id, registration_number, admission_date)
    values (v_membership, nullif(btrim(p_details ->> 'registration_number'), ''),
            nullif(p_details ->> 'admission_date', '')::date);
  else
    insert into public.employee_profiles (membership_id, institution_id, department, position, employment_type, shift_id)
    values (v_membership, p_institution,
            nullif(btrim(p_details ->> 'department'), ''), nullif(btrim(p_details ->> 'position'), ''),
            nullif(p_details ->> 'employment_type', ''), nullif(p_details ->> 'shift_id', '')::uuid);
  end if;
  return v_membership;
end $$;

create or replace function public.erp_update_member(
  p_membership uuid,
  p_first_name text,
  p_last_name text,
  p_member_code text,
  p_status public.membership_status,
  p_email text default null,
  p_phone text default null,
  p_campus uuid default null,
  p_end_date date default null,
  p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  m public.institution_memberships;
begin
  select * into m from public.institution_memberships where id = p_membership for update;
  if not found or not erp_private.has_permission(
       case when m.member_type = 'student' then 'students.manage' else 'staff.manage' end, m.institution_id) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  update public.people set
    first_name = btrim(p_first_name), last_name = coalesce(btrim(p_last_name), ''),
    email = nullif(lower(btrim(p_email)), ''), phone = nullif(btrim(p_phone), '')
  where id = m.person_id;

  update public.institution_memberships set
    member_code = upper(btrim(p_member_code)), status = p_status, campus_id = p_campus,
    end_date = case when p_status = 'active' then p_end_date
                    else coalesce(p_end_date, erp_private.institution_today(m.institution_id)) end
  where id = p_membership;

  if m.member_type = 'student' then
    update public.student_profiles set
      registration_number = nullif(btrim(p_details ->> 'registration_number'), ''),
      admission_date = nullif(p_details ->> 'admission_date', '')::date
    where membership_id = p_membership;
  elsif erp_private.has_permission('hr.view', m.institution_id) then
    update public.employee_profiles set
      department = nullif(btrim(p_details ->> 'department'), ''),
      position = nullif(btrim(p_details ->> 'position'), ''),
      employment_type = nullif(p_details ->> 'employment_type', ''),
      shift_id = nullif(p_details ->> 'shift_id', '')::uuid
    where membership_id = p_membership;
  end if;
end $$;

create or replace function public.erp_add_guardian(
  p_student uuid, p_full_name text, p_relationship text,
  p_phone text default null, p_email text default null, p_primary boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_inst uuid;
  v_guardian uuid := gen_random_uuid();
begin
  select institution_id into v_inst from public.institution_memberships
  where id = p_student and member_type = 'student';
  if v_inst is null or not erp_private.has_permission('students.manage', v_inst) then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;
  insert into public.guardians (id, full_name, phone, email)
  values (v_guardian, btrim(p_full_name), nullif(btrim(p_phone), ''), nullif(lower(btrim(p_email)), ''));
  if p_primary then
    update public.guardian_student_relationships set is_primary_contact = false
    where student_membership_id = p_student;
  end if;
  insert into public.guardian_student_relationships (guardian_id, student_membership_id, relationship, is_primary_contact)
  values (v_guardian, p_student, p_relationship, p_primary);
  insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
  values (v_uid, v_inst, 'guardians', v_guardian::text, 'insert',
          jsonb_build_object('student_membership_id', p_student, 'relationship', p_relationship));
  return v_guardian;
end $$;

create or replace function public.erp_remove_guardian(p_guardian uuid, p_student uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_inst uuid;
begin
  select institution_id into v_inst from public.institution_memberships where id = p_student;
  if v_inst is null or not erp_private.has_permission('students.manage', v_inst) then
    raise exception 'Student not found' using errcode = 'P0002';
  end if;
  delete from public.guardian_student_relationships
  where guardian_id = p_guardian and student_membership_id = p_student;
  -- Remove the guardian record once no student references it.
  delete from public.guardians g where g.id = p_guardian
    and not exists (select 1 from public.guardian_student_relationships r where r.guardian_id = g.id);
  insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, old_data)
  values (v_uid, v_inst, 'guardians', p_guardian::text, 'delete',
          jsonb_build_object('student_membership_id', p_student));
end $$;

-- -----------------------------------------------------------------------------
-- Attendance registers
-- -----------------------------------------------------------------------------
-- Idempotent: returns the existing register for the same group/date/period.
create or replace function public.erp_open_attendance_session(
  p_institution uuid, p_kind public.attendance_kind, p_date date,
  p_group uuid default null, p_period text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_id uuid;
  v_period text := coalesce(btrim(p_period), '');
begin
  if not erp_private.can_mark(p_institution, p_kind, p_group) then
    raise exception 'You are not allowed to take this register' using errcode = '42501';
  end if;
  if not exists (select 1 from public.institutions where id = p_institution and status = 'active') then
    raise exception 'Institution is not active' using errcode = '55000';
  end if;
  if p_kind = 'student' and not exists (
       select 1 from public.learning_groups
       where id = p_group and institution_id = p_institution and status = 'active') then
    raise exception 'Class or batch not found' using errcode = 'P0002';
  end if;
  if p_kind = 'staff' and p_group is not null then
    raise exception 'Staff registers are not tied to a class or batch' using errcode = '22023';
  end if;
  perform erp_private.check_register_date(p_institution, p_kind, p_date);

  insert into public.attendance_sessions (institution_id, kind, group_id, session_date, period_label, created_by)
  values (p_institution, p_kind, p_group, p_date, v_period, v_uid)
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.attendance_sessions
    where institution_id = p_institution and kind = p_kind
      and group_id is not distinct from p_group and session_date = p_date and period_label = v_period;
  end if;
  return v_id;
end $$;

-- Bulk save. p_entries: [{membership_id, status, check_in?, check_out?, remarks?}]
create or replace function public.erp_save_attendance(
  p_session uuid, p_entries jsonb, p_submit boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  s public.attendance_sessions;
  v_tz text;
  v_total int;
  v_distinct int;
  v_off_roster int;
  v_changed int := 0;
  v_roster int;
  v_marked int;
begin
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found or not erp_private.can_mark(s.institution_id, s.kind, s.group_id) then
    raise exception 'Register not found' using errcode = 'P0002';
  end if;
  if s.status = 'finalized' then
    raise exception 'This register is finalised. Submit a correction instead.' using errcode = '55000';
  end if;
  perform erp_private.check_register_date(s.institution_id, s.kind, s.session_date);
  select timezone into v_tz from public.institutions where id = s.institution_id;

  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Entries must be a list' using errcode = '22023';
  end if;
  if jsonb_array_length(p_entries) > 2000 then
    raise exception 'Too many entries in one save (max 2000)' using errcode = '22023';
  end if;

  select count(*), count(distinct x.membership_id),
         count(*) filter (where x.membership_id not in (select erp_private.roster_ids(s.id))
                            and x.membership_id not in (select r.membership_id from public.attendance_records r where r.session_id = s.id))
    into v_total, v_distinct, v_off_roster
  from jsonb_to_recordset(p_entries) as x(membership_id uuid);

  if v_total <> v_distinct then
    raise exception 'The same person appears more than once in this save' using errcode = '22023';
  end if;
  if v_off_roster > 0 then
    raise exception '% entr% not on this register', v_off_roster, case when v_off_roster = 1 then 'y is' else 'ies are' end
      using errcode = '23514';
  end if;

  if v_total > 0 then
    insert into public.attendance_records as r
      (institution_id, session_id, kind, membership_id, status, check_in_at, check_out_at, remarks, marked_by, updated_by)
    select s.institution_id, s.id, s.kind, x.membership_id, x.status,
           case when x.status in ('present', 'late', 'half_day') then erp_private.local_ts(s.session_date, x.check_in, v_tz) end,
           case when x.status in ('present', 'late', 'half_day') then erp_private.local_ts(s.session_date, x.check_out, v_tz) end,
           nullif(btrim(x.remarks), ''), v_uid, v_uid
    from jsonb_to_recordset(p_entries) as x(membership_id uuid, status public.attendance_status,
                                            check_in text, check_out text, remarks text)
    on conflict (session_id, membership_id) do update set
      status = excluded.status, check_in_at = excluded.check_in_at, check_out_at = excluded.check_out_at,
      remarks = excluded.remarks, updated_by = v_uid, updated_at = now(), version = r.version + 1
    where (r.status, r.check_in_at, r.check_out_at, r.remarks)
          is distinct from (excluded.status, excluded.check_in_at, excluded.check_out_at, excluded.remarks);
    get diagnostics v_changed = row_count;
  end if;

  if p_submit then
    select count(*) into v_roster from erp_private.roster_ids(s.id);
    select count(*) into v_marked from public.attendance_records r
      where r.session_id = s.id and r.membership_id in (select erp_private.roster_ids(s.id));
    if v_roster = 0 then
      raise exception 'Nobody is on this register yet' using errcode = '55000';
    end if;
    if v_marked < v_roster then
      raise exception '% of % people are still unmarked', v_roster - v_marked, v_roster using errcode = '55000';
    end if;
    update public.attendance_sessions set status = 'submitted', submitted_by = v_uid, submitted_at = now()
    where id = s.id and status = 'draft';
  end if;

  return jsonb_build_object('changed', v_changed,
    'status', (select status from public.attendance_sessions where id = s.id));
end $$;

create or replace function public.erp_finalize_attendance_session(p_session uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  s public.attendance_sessions;
begin
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found or not erp_private.has_permission(
       case s.kind when 'student' then 'attendance.finalize' else 'staff_attendance.approve' end, s.institution_id) then
    raise exception 'You are not allowed to finalise this register' using errcode = '42501';
  end if;
  if s.status <> 'submitted' then
    raise exception 'Only submitted registers can be finalised' using errcode = '55000';
  end if;
  update public.attendance_sessions set status = 'finalized', finalized_by = v_uid, finalized_at = now()
  where id = p_session;
end $$;

-- Direct correction by an authorised user (reason mandatory, fully audited).
create or replace function public.erp_correct_attendance(
  p_record uuid, p_status public.attendance_status, p_reason text,
  p_check_in text default null, p_check_out text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  r public.attendance_records;
  v_date date; v_tz text; v_require_approval boolean;
begin
  select * into r from public.attendance_records where id = p_record for update;
  if not found or not erp_private.has_permission(erp_private.correct_perm(r.kind), r.institution_id) then
    raise exception 'You are not allowed to correct this record' using errcode = '42501';
  end if;
  select s.session_date, i.timezone, i.require_correction_approval
    into v_date, v_tz, v_require_approval
  from public.attendance_sessions s join public.institutions i on i.id = s.institution_id
  where s.id = r.session_id;
  if v_require_approval and not erp_private.has_permission(erp_private.approve_perm(r.kind), r.institution_id) then
    raise exception 'Corrections at this institution need approval. Submit a correction request.'
      using errcode = '55000';
  end if;
  if p_reason is null or length(btrim(p_reason)) < 5 then
    raise exception 'A reason of at least 5 characters is required' using errcode = '22023';
  end if;
  if p_status = 'on_leave' and r.kind <> 'staff' then
    raise exception 'On Leave applies only to staff registers' using errcode = '23514';
  end if;
  perform erp_private.apply_correction(p_record, p_status,
    erp_private.local_ts(v_date, p_check_in, v_tz), erp_private.local_ts(v_date, p_check_out, v_tz),
    btrim(p_reason), v_uid);
end $$;

create or replace function public.erp_request_attendance_correction(
  p_record uuid, p_status public.attendance_status, p_reason text,
  p_check_in text default null, p_check_out text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  r public.attendance_records;
  v_date date; v_tz text;
  v_id uuid := gen_random_uuid();
begin
  select * into r from public.attendance_records where id = p_record;
  if not found or not (
    erp_private.has_permission(erp_private.correct_perm(r.kind), r.institution_id)
    or (r.kind = 'student' and (
          erp_private.has_permission('attendance.mark', r.institution_id)
          or (erp_private.has_permission('attendance.mark_assigned', r.institution_id)
              and r.membership_id in (select erp_private.my_assigned_student_ids()))))
    or (r.kind = 'staff' and erp_private.has_permission('staff_attendance.mark', r.institution_id))
    or r.membership_id in (select erp_private.my_membership_ids())
  ) then
    raise exception 'Record not found' using errcode = 'P0002';
  end if;
  if p_reason is null or length(btrim(p_reason)) < 5 then
    raise exception 'A reason of at least 5 characters is required' using errcode = '22023';
  end if;
  select s.session_date, i.timezone into v_date, v_tz
  from public.attendance_sessions s join public.institutions i on i.id = s.institution_id
  where s.id = r.session_id;
  insert into public.attendance_correction_requests
    (id, institution_id, record_id, requested_status, requested_check_in, requested_check_out, reason, requested_by)
  values (v_id, r.institution_id, r.id, p_status,
          erp_private.local_ts(v_date, p_check_in, v_tz), erp_private.local_ts(v_date, p_check_out, v_tz),
          btrim(p_reason), v_uid);
  return v_id;
exception when unique_violation then
  raise exception 'A correction request for this record is already pending' using errcode = '23505';
end $$;

create or replace function public.erp_review_attendance_correction(
  p_request uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  c public.attendance_correction_requests;
  v_kind public.attendance_kind;
begin
  select * into c from public.attendance_correction_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  select kind into v_kind from public.attendance_records where id = c.record_id;
  if not erp_private.has_permission(erp_private.approve_perm(v_kind), c.institution_id) then
    raise exception 'You are not allowed to review this request' using errcode = '42501';
  end if;
  if c.status <> 'pending' then
    raise exception 'This request has already been reviewed' using errcode = '55000';
  end if;
  if c.requested_by = v_uid then
    raise exception 'You cannot review your own correction request' using errcode = '42501';
  end if;
  if p_approve then
    perform erp_private.apply_correction(c.record_id, c.requested_status,
      c.requested_check_in, c.requested_check_out, 'Approved request: ' || c.reason, v_uid);
  end if;
  update public.attendance_correction_requests set
    status = case when p_approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
    reviewed_by = v_uid, reviewed_at = now(), review_note = nullif(btrim(p_note), '')
  where id = p_request;
end $$;

-- -----------------------------------------------------------------------------
-- Leave
-- -----------------------------------------------------------------------------
create or replace function public.erp_request_leave(
  p_membership uuid, p_leave_type text, p_start date, p_end date, p_reason text,
  p_half_day boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  m public.institution_memberships;
  v_id uuid := gen_random_uuid();
begin
  select * into m from public.institution_memberships where id = p_membership;
  if not found or not (
    p_membership in (select erp_private.my_membership_ids())
    or erp_private.has_permission('staff.manage', m.institution_id)
  ) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if m.member_type = 'student' then
    raise exception 'Leave requests are for staff and employees' using errcode = '23514';
  end if;
  if p_end - p_start > 90 then
    raise exception 'A single leave request cannot exceed 90 days' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.leave_requests l
    where l.membership_id = p_membership and l.status in ('pending', 'approved')
      and daterange(l.start_date, l.end_date, '[]') && daterange(p_start, p_end, '[]')
  ) then
    raise exception 'This overlaps an existing pending or approved leave request' using errcode = '23505';
  end if;
  insert into public.leave_requests
    (id, institution_id, membership_id, leave_type, start_date, end_date, half_day, reason, requested_by)
  values (v_id, m.institution_id, p_membership, p_leave_type, p_start, p_end, p_half_day, btrim(p_reason), v_uid);
  return v_id;
end $$;

create or replace function public.erp_review_leave(p_request uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  l public.leave_requests;
begin
  select * into l from public.leave_requests where id = p_request for update;
  if not found or not erp_private.has_permission('leave.approve', l.institution_id) then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if l.status <> 'pending' then
    raise exception 'This request has already been reviewed' using errcode = '55000';
  end if;
  if l.membership_id in (select erp_private.my_membership_ids()) or l.requested_by = v_uid then
    raise exception 'You cannot review your own leave request' using errcode = '42501';
  end if;
  update public.leave_requests set
    status = case when p_approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
    reviewed_by = v_uid, reviewed_at = now(), review_note = nullif(btrim(p_note), '')
  where id = p_request;
end $$;

create or replace function public.erp_cancel_leave(p_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  l public.leave_requests;
begin
  select * into l from public.leave_requests where id = p_request for update;
  if not found or not (
    l.membership_id in (select erp_private.my_membership_ids())
    or erp_private.has_permission('staff.manage', l.institution_id)
  ) then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if l.status <> 'pending' and not (l.status = 'approved' and l.start_date > erp_private.institution_today(l.institution_id)) then
    raise exception 'Only pending or future approved leave can be cancelled' using errcode = '55000';
  end if;
  update public.leave_requests set status = 'cancelled' where id = p_request;
end $$;

-- -----------------------------------------------------------------------------
-- Users and role assignments
-- -----------------------------------------------------------------------------
create or replace function erp_private.can_grant(p_role text, p_institution uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select erp_private.has_platform_permission('users.manage')
      or (p_institution is not null
          and p_institution in (select erp_private.institutions_with('users.manage'))
          and exists (select 1 from public.roles r
                      where r.key = p_role and r.scope = 'institution'
                        and r.key not in ('school_admin', 'centre_manager')))
$$;

create or replace function public.erp_assign_role(p_user uuid, p_role text, p_institution uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_id uuid;
begin
  if not erp_private.can_grant(p_role, p_institution) then
    raise exception 'You are not allowed to grant this role' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  insert into public.user_role_assignments (user_id, role_key, institution_id, granted_by)
  values (p_user, p_role, p_institution, v_uid)
  on conflict do nothing
  returning id into v_id;
  if v_id is null then
    raise exception 'This user already has that role' using errcode = '23505';
  end if;
  return v_id;
end $$;

create or replace function public.erp_revoke_role(p_assignment uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  a public.user_role_assignments;
begin
  select * into a from public.user_role_assignments where id = p_assignment for update;
  if not found or not erp_private.can_grant(a.role_key, a.institution_id) then
    raise exception 'Assignment not found' using errcode = 'P0002';
  end if;
  if a.role_key = 'super_admin'
     and (select count(*) from public.user_role_assignments where role_key = 'super_admin') <= 1 then
    raise exception 'Cannot remove the last Super Admin' using errcode = '55000';
  end if;
  delete from public.user_role_assignments where id = p_assignment;
end $$;

-- Link a login account to a person (so a teacher's account sees their classes).
create or replace function public.erp_link_user_person(p_user uuid, p_membership uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_person uuid;
  v_current uuid;
begin
  select person_id into v_person from public.institution_memberships where id = p_membership;
  if v_person is null then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  select person_id into v_current from public.profiles where id = p_user;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
  if not erp_private.has_platform_permission('users.manage') then
    -- Institution admins: the person must belong only to institutions they manage,
    -- the account must not already be linked, and they cannot link themselves.
    if p_user = v_uid or v_current is not null or exists (
      select 1 from public.institution_memberships m
      where m.person_id = v_person
        and m.institution_id not in (select erp_private.institutions_with('users.manage'))
    ) then
      raise exception 'You are not allowed to link this account' using errcode = '42501';
    end if;
  end if;
  update public.profiles set person_id = v_person,
    full_name = (select btrim(first_name || ' ' || last_name) from public.people where id = v_person)
  where id = p_user;
  insert into public.audit_logs (actor_id, entity_type, entity_id, action, old_data, new_data)
  values (v_uid, 'profiles', p_user::text, 'link_person',
          jsonb_build_object('person_id', v_current), jsonb_build_object('person_id', v_person));
end $$;

-- -----------------------------------------------------------------------------
-- Read models (SECURITY INVOKER: results are limited by RLS)
-- -----------------------------------------------------------------------------
create or replace function public.erp_register_roster(p_session uuid)
returns table (
  membership_id uuid, member_code text, full_name text, member_type public.member_type,
  record_id uuid, status public.attendance_status, check_in text, check_out text, remarks text,
  version int, corrected boolean, on_approved_leave boolean, shift_start time, grace_minutes int,
  on_roster boolean)
language sql stable security invoker set search_path = '' as $$
  with s as (
    select s.*, i.timezone from public.attendance_sessions s
    join public.institutions i on i.id = s.institution_id
    where s.id = p_session
  ),
  roster as (select erp_private.roster_ids(p_session) as membership_id),
  ids as (
    select membership_id from roster
    union
    select r.membership_id from public.attendance_records r join s on r.session_id = s.id
  )
  select m.id, m.member_code, btrim(p.first_name || ' ' || p.last_name), m.member_type,
         r.id, r.status,
         to_char(r.check_in_at at time zone s.timezone, 'HH24:MI'),
         to_char(r.check_out_at at time zone s.timezone, 'HH24:MI'),
         r.remarks, r.version, r.corrected_at is not null,
         exists (select 1 from public.leave_requests l
                 where l.membership_id = m.id and l.status = 'approved'
                   and s.session_date between l.start_date and l.end_date),
         ws.start_time, ws.grace_minutes,
         m.id in (select membership_id from roster)
  from s
  join ids on true
  join public.institution_memberships m on m.id = ids.membership_id
  join public.people p on p.id = m.person_id
  left join public.attendance_records r on r.session_id = s.id and r.membership_id = m.id
  left join public.employee_profiles ep on ep.membership_id = m.id
  left join public.work_shifts ws on ws.id = ep.shift_id
  order by lower(p.first_name), lower(p.last_name), m.member_code
$$;

-- Per-person totals. Rate = (present + late + ½·half_day) / (marked − excused − on_leave).
-- Only people who were on a register are counted, so unscheduled people never
-- dilute the denominator.
create or replace function public.erp_attendance_summary(
  p_institution uuid, p_kind public.attendance_kind, p_from date, p_to date, p_group uuid default null)
returns table (
  membership_id uuid, member_code text, full_name text, member_type public.member_type,
  present int, absent int, late int, excused int, half_day int, on_leave int,
  marked int, expected int, attended numeric, rate numeric)
language sql stable security invoker set search_path = '' as $$
  select m.id, m.member_code, btrim(p.first_name || ' ' || p.last_name), m.member_type,
    count(*) filter (where r.status = 'present')::int,
    count(*) filter (where r.status = 'absent')::int,
    count(*) filter (where r.status = 'late')::int,
    count(*) filter (where r.status = 'excused')::int,
    count(*) filter (where r.status = 'half_day')::int,
    count(*) filter (where r.status = 'on_leave')::int,
    count(*)::int,
    count(*) filter (where r.status not in ('excused', 'on_leave'))::int,
    sum(case when r.status in ('present', 'late') then 1 when r.status = 'half_day' then 0.5 else 0 end),
    case when count(*) filter (where r.status not in ('excused', 'on_leave')) = 0 then null
         else round(100 * sum(case when r.status in ('present', 'late') then 1
                                   when r.status = 'half_day' then 0.5 else 0 end)
                    / count(*) filter (where r.status not in ('excused', 'on_leave')), 1) end
  from public.attendance_records r
  join public.attendance_sessions s on s.id = r.session_id
  join public.institution_memberships m on m.id = r.membership_id
  join public.people p on p.id = m.person_id
  where r.institution_id = p_institution and r.kind = p_kind
    and s.session_date between p_from and p_to
    and (p_group is null or s.group_id = p_group)
  group by m.id, m.member_code, p.first_name, p.last_name, m.member_type
  order by lower(p.first_name), lower(p.last_name)
$$;

create or replace function public.erp_attendance_daily(
  p_institution uuid, p_kind public.attendance_kind, p_from date, p_to date)
returns table (
  day date, registers int, submitted int, marked int, present int, absent int, late int,
  excused int, half_day int, on_leave int, rate numeric)
language sql stable security invoker set search_path = '' as $$
  select s.session_date,
    count(distinct s.id)::int,
    count(distinct s.id) filter (where s.status in ('submitted', 'finalized'))::int,
    count(r.id)::int,
    count(r.id) filter (where r.status = 'present')::int,
    count(r.id) filter (where r.status = 'absent')::int,
    count(r.id) filter (where r.status = 'late')::int,
    count(r.id) filter (where r.status = 'excused')::int,
    count(r.id) filter (where r.status = 'half_day')::int,
    count(r.id) filter (where r.status = 'on_leave')::int,
    case when count(r.id) filter (where r.status not in ('excused', 'on_leave')) = 0 then null
         else round(100 * sum(case when r.status in ('present', 'late') then 1
                                   when r.status = 'half_day' then 0.5 else 0 end)
                    / count(r.id) filter (where r.status not in ('excused', 'on_leave')), 1) end
  from public.attendance_sessions s
  left join public.attendance_records r on r.session_id = s.id
  where s.institution_id = p_institution and s.kind = p_kind
    and s.session_date between p_from and p_to
  group by s.session_date
  order by s.session_date
$$;

create or replace function public.erp_dashboard(p_category text default 'all')
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v jsonb;
begin
  if p_category not in ('all', 'school', 'learning_center') then
    raise exception 'Invalid category' using errcode = '22023';
  end if;
  with inst as (
    select i.id, i.name, i.institution_type, i.working_days,
           (now() at time zone i.timezone)::date as today
    from public.institutions i
    where i.status = 'active' and (p_category = 'all' or i.institution_type::text = p_category)
  ),
  ppl as (
    select count(*) filter (where m.member_type = 'student') as students,
           count(*) filter (where m.member_type in ('teacher', 'instructor')) as teachers,
           count(*) filter (where m.member_type in ('staff', 'employee')) as staff
    from public.institution_memberships m join inst on inst.id = m.institution_id
    where m.status = 'active'
  ),
  today_records as (
    select r.kind, r.status from public.attendance_records r
    join public.attendance_sessions s on s.id = r.session_id
    join inst on inst.id = s.institution_id and s.session_date = inst.today
  ),
  expected as (
    select g.id, g.name, inst.id as institution_id, inst.name as institution_name,
           inst.institution_type, inst.today
    from public.learning_groups g join inst on inst.id = g.institution_id
    where g.status = 'active'
      and extract(isodow from inst.today)::smallint = any (coalesce(g.meeting_days, inst.working_days))
      and exists (select 1 from public.enrollments e
                  where e.group_id = g.id and e.start_date <= inst.today
                    and (e.end_date is null or e.end_date >= inst.today))
  ),
  reg as (
    select ex.*, (
      select case when bool_or(s.status = 'draft') then 'draft'
                  when count(*) > 0 then 'submitted' end
      from public.attendance_sessions s
      where s.group_id = ex.id and s.session_date = ex.today and s.kind = 'student'
    ) as reg_status
    from expected ex
  ),
  trend as (
    select s.session_date as d,
      sum(case when r.status in ('present', 'late') then 1 when r.status = 'half_day' then 0.5 else 0 end) as attended,
      count(*) filter (where r.status not in ('excused', 'on_leave')) as expected
    from public.attendance_records r
    join public.attendance_sessions s on s.id = r.session_id
    join inst on inst.id = s.institution_id
    where r.kind = 'student' and s.session_date between inst.today - 13 and inst.today
    group by s.session_date
  )
  select jsonb_build_object(
    'institutions', (select jsonb_build_object(
        'total', count(*) filter (where institution_type <> 'head_office'),
        'school', count(*) filter (where institution_type = 'school'),
        'learning_center', count(*) filter (where institution_type = 'learning_center')) from inst),
    'people', (select to_jsonb(ppl) from ppl),
    'student_today', (select jsonb_build_object(
        'marked', count(*),
        'present', count(*) filter (where status = 'present'),
        'absent', count(*) filter (where status = 'absent'),
        'late', count(*) filter (where status = 'late'),
        'excused', count(*) filter (where status = 'excused'),
        'half_day', count(*) filter (where status = 'half_day')) from today_records where kind = 'student'),
    'staff_today', (select jsonb_build_object(
        'marked', count(*),
        'present', count(*) filter (where status = 'present'),
        'absent', count(*) filter (where status = 'absent'),
        'late', count(*) filter (where status = 'late'),
        'half_day', count(*) filter (where status = 'half_day'),
        'on_leave', count(*) filter (where status = 'on_leave')) from today_records where kind = 'staff'),
    'registers', (select jsonb_build_object(
        'expected', count(*),
        'submitted', count(*) filter (where reg_status = 'submitted'),
        'draft', count(*) filter (where reg_status = 'draft'),
        'not_started', count(*) filter (where reg_status is null)) from reg),
    'missing', (select coalesce(jsonb_agg(jsonb_build_object(
          'group_id', id, 'group_name', name, 'institution_id', institution_id,
          'institution_name', institution_name, 'institution_type', institution_type,
          'date', today, 'status', coalesce(reg_status, 'not_started'))
          order by institution_name, name), '[]'::jsonb)
        from (select * from reg where reg_status is distinct from 'submitted'
              order by institution_name, name limit 25) x),
    'pending', jsonb_build_object(
        'corrections', (select count(*) from public.attendance_correction_requests c
                        join inst on inst.id = c.institution_id where c.status = 'pending'),
        'leave', (select count(*) from public.leave_requests l
                  join inst on inst.id = l.institution_id where l.status = 'pending')),
    'trend', (select coalesce(jsonb_agg(jsonb_build_object(
          'date', d, 'attended', attended, 'expected', expected,
          'rate', case when expected = 0 then null else round(100 * attended / expected, 1) end)
          order by d), '[]'::jsonb) from trend)
  ) into v;
  return v;
end $$;

create or replace function public.erp_search_members(
  p_category text default 'all',
  p_institution uuid default null,
  p_types public.member_type[] default null,
  p_status public.membership_status default null,
  p_query text default null,
  p_group uuid default null,
  p_limit int default 50,
  p_offset int default 0)
returns table (
  membership_id uuid, person_id uuid, institution_id uuid, institution_name text,
  institution_type public.institution_type, member_type public.member_type, member_code text,
  full_name text, email text, phone text, status public.membership_status, start_date date,
  groups text, total_count bigint)
language sql stable security invoker set search_path = '' as $$
  with q as (
    select '%' || replace(replace(replace(coalesce(btrim(p_query), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat
  ),
  base as (
    select m.id, m.person_id, m.institution_id, i.name as iname, i.institution_type, m.member_type,
           m.member_code, btrim(p.first_name || ' ' || p.last_name) as full_name, p.email, p.phone,
           m.status, m.start_date, p.first_name, p.last_name
    from public.institution_memberships m
    join public.people p on p.id = m.person_id
    join public.institutions i on i.id = m.institution_id
    cross join q
    where (coalesce(p_category, 'all') = 'all' or i.institution_type::text = p_category)
      and (p_institution is null or m.institution_id = p_institution)
      and (p_types is null or m.member_type = any (p_types))
      and (p_status is null or m.status = p_status)
      and (p_group is null
           or exists (select 1 from public.enrollments e where e.group_id = p_group and e.membership_id = m.id)
           or exists (select 1 from public.group_assignments ga where ga.group_id = p_group and ga.membership_id = m.id))
      and (coalesce(btrim(p_query), '') = ''
           or (p.first_name || ' ' || p.last_name) ilike q.pat
           or m.member_code ilike q.pat
           or p.email ilike q.pat)
  )
  select b.id, b.person_id, b.institution_id, b.iname, b.institution_type, b.member_type, b.member_code,
         b.full_name, b.email, b.phone, b.status, b.start_date,
         (select string_agg(g.name, ', ' order by g.name) from (
            select g.name from public.enrollments e join public.learning_groups g on g.id = e.group_id
            where e.membership_id = b.id and (e.end_date is null or e.end_date >= current_date)
            union
            select g.name from public.group_assignments ga join public.learning_groups g on g.id = ga.group_id
            where ga.membership_id = b.id) g),
         count(*) over ()
  from base b
  order by lower(b.first_name), lower(b.last_name), b.member_code
  limit greatest(1, least(coalesce(p_limit, 50), 200)) offset greatest(0, coalesce(p_offset, 0))
$$;

create or replace function public.erp_institution_list(
  p_category text default 'all', p_query text default null, p_status public.record_status default null)
returns table (
  id uuid, code text, name text, institution_type public.institution_type, status public.record_status,
  city text, state text, timezone text, students bigint, staff bigint, groups bigint)
language sql stable security invoker set search_path = '' as $$
  select i.id, i.code, i.name, i.institution_type, i.status, i.city, i.state, i.timezone,
    (select count(*) from public.institution_memberships m
      where m.institution_id = i.id and m.member_type = 'student' and m.status = 'active'),
    (select count(*) from public.institution_memberships m
      where m.institution_id = i.id and m.member_type <> 'student' and m.status = 'active'),
    (select count(*) from public.learning_groups g where g.institution_id = i.id and g.status = 'active')
  from public.institutions i
  where (coalesce(p_category, 'all') = 'all' or i.institution_type::text = p_category)
    and (p_status is null or i.status = p_status)
    and (coalesce(btrim(p_query), '') = ''
         or i.name ilike '%' || btrim(p_query) || '%' or i.code ilike '%' || btrim(p_query) || '%'
         or i.city ilike '%' || btrim(p_query) || '%')
  order by i.institution_type, lower(i.name)
$$;

-- Per-institution attendance status for each institution's local "today".
create or replace function public.erp_institution_attendance_today(p_category text default 'all')
returns table (
  institution_id uuid, name text, institution_type public.institution_type, today date,
  expected_registers int, submitted_registers int, draft_registers int,
  student_marked int, student_present int, student_absent int, student_late int, student_rate numeric,
  staff_marked int, staff_present int, staff_on_leave int)
language sql stable security invoker set search_path = '' as $$
  with inst as (
    select i.id, i.name, i.institution_type, i.working_days, (now() at time zone i.timezone)::date as today
    from public.institutions i
    where i.status = 'active' and (coalesce(p_category, 'all') = 'all' or i.institution_type::text = p_category)
  ),
  exp as (
    select g.institution_id, g.id
    from public.learning_groups g join inst on inst.id = g.institution_id
    where g.status = 'active'
      and extract(isodow from inst.today)::smallint = any (coalesce(g.meeting_days, inst.working_days))
      and exists (select 1 from public.enrollments e where e.group_id = g.id and e.start_date <= inst.today
                  and (e.end_date is null or e.end_date >= inst.today))
  ),
  sess as (
    select s.institution_id, s.group_id, s.kind, s.status from public.attendance_sessions s
    join inst on inst.id = s.institution_id and s.session_date = inst.today
  ),
  rec as (
    select r.institution_id, r.kind, r.status from public.attendance_records r
    join public.attendance_sessions s on s.id = r.session_id
    join inst on inst.id = s.institution_id and s.session_date = inst.today
  )
  select inst.id, inst.name, inst.institution_type, inst.today,
    (select count(*) from exp where exp.institution_id = inst.id)::int,
    (select count(*) from exp where exp.institution_id = inst.id and exists (
        select 1 from sess where sess.group_id = exp.id and sess.status in ('submitted', 'finalized')))::int,
    (select count(*) from exp where exp.institution_id = inst.id and exists (
        select 1 from sess where sess.group_id = exp.id and sess.status = 'draft'))::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'student')::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'student' and rec.status = 'present')::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'student' and rec.status = 'absent')::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'student' and rec.status = 'late')::int,
    (select case when count(*) filter (where status not in ('excused', 'on_leave')) = 0 then null
            else round(100 * sum(case when status in ('present', 'late') then 1 when status = 'half_day' then 0.5 else 0 end)
                       / count(*) filter (where status not in ('excused', 'on_leave')), 1) end
       from rec where rec.institution_id = inst.id and rec.kind = 'student'),
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'staff')::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'staff' and rec.status in ('present', 'late', 'half_day'))::int,
    (select count(*) from rec where rec.institution_id = inst.id and rec.kind = 'staff' and rec.status = 'on_leave')::int
  from inst
  order by inst.institution_type, inst.name
$$;

-- Records a personal-data export in the audit log (and checks the permission).
create or replace function public.erp_log_export(
  p_institution uuid, p_report text, p_params jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := erp_private.require_user();
begin
  if not erp_private.has_permission('reports.export', p_institution) then
    raise exception 'You are not allowed to export reports for this institution' using errcode = '42501';
  end if;
  insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
  values (v_uid, p_institution, 'report_export', left(p_report, 60), 'export', p_params);
end $$;

-- -----------------------------------------------------------------------------
-- Execute grants: only signed-in users may call the API functions.
-- -----------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'erp\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'erp_private'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;
