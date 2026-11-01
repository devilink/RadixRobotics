-- =============================================================================
-- RADIX ERP — Migration 13: student import with auto IDs, soft class matching
-- and force upload
-- =============================================================================
-- Replaces public.erp_import_students (migration 10). It gains p_force; calls
-- without it behave as before, so the app keeps working either way.
--
--   * Rows without a Roll No / Student ID get one from the database, numbered
--     per institution: STU-0001, STU-0002, … (continuing after the highest
--     existing STU-number). Imports at one institution are serialised with an
--     advisory lock so two uploads can never hand out the same ID. A dry run
--     assigns the same IDs the real upload will, so the preview matches.
--   * A Class / Batch that is not found no longer fails the row: the student is
--     imported without an enrolment and the row gets a note.
--   * p_force (force upload): rows with problems are skipped rather than
--     blocking the rest, a Roll No that already belongs to another student is
--     replaced by a generated ID (the original is noted), and each row's
--     extra_notes (original values that did not fit a field) is saved to the
--     student's notes.
--
-- Extra keys in the result:
--   codes:   [{ row, code }]     IDs generated for rows
--   notes:   [{ row, message }]  things that were changed or left out of an imported row
--   members: [{ row, id }]       membership id of each imported student (links to edit them)
--
-- Also replaces public.erp_update_member (migration 5, same signature) so the
-- edit screen can change a student's notes: p_details.notes is applied only when
-- the key is present, so other callers leave notes untouched.
-- =============================================================================

drop function if exists public.erp_import_students(uuid, jsonb, boolean, boolean);

create or replace function public.erp_import_students(
  p_institution uuid,
  p_rows jsonb,
  p_dry_run boolean default true,
  p_skip_invalid boolean default false,
  p_force boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_skip boolean := p_skip_invalid or p_force;
  v_errors jsonb := '[]'::jsonb;
  v_notes jsonb := '[]'::jsonb;
  v_codes jsonb := '[]'::jsonb;
  v_members jsonb := '[]'::jsonb;
  v_ok integer := 0;
  v_enrolled integer := 0;
  v_guardians integer := 0;
  v_rolled_back boolean := false;
  v_next integer;
  r jsonb;
  v_row integer;
  v_member uuid;
  v_group uuid;
  v_code text;
  v_taken text;
  v_auto boolean;
  v_row_notes text[];
  v_note text;
  v_state text; v_msg text; v_con text;
begin
  if not erp_private.has_permission('students.manage', p_institution) then
    raise exception 'You are not allowed to add students here' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The sheet has no rows to import' using errcode = '22023';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'Import at most 2000 rows at a time' using errcode = '22023';
  end if;

  -- One import at a time per institution, so generated IDs never collide.
  perform pg_advisory_xact_lock(hashtextextended('erp-student-ids:' || p_institution::text, 0));
  select coalesce(max(substring(m.member_code from '^STU-([0-9]{1,9})$')::integer), 0) + 1
    into v_next
  from public.institution_memberships m
  where m.institution_id = p_institution and m.member_type = 'student';

  begin  -- outer block: lets a dry run (or a failed all-or-nothing run) roll back
    for r in select * from jsonb_array_elements(p_rows) loop
      v_row := (r ->> 'row')::integer;
      begin  -- per-row savepoint
        v_row_notes := '{}';

        v_group := null;
        if coalesce(btrim(r ->> 'group'), '') <> '' then
          select g.id into v_group from public.learning_groups g
          where g.institution_id = p_institution and g.status = 'active'
            and lower(g.name) = lower(btrim(r ->> 'group'))
          order by g.academic_year desc nulls last, g.created_at desc
          limit 1;
          if v_group is null then
            v_row_notes := v_row_notes || format('Class / Batch "%s" was not found, so the student was not enrolled in a class', btrim(r ->> 'group'));
          end if;
        end if;

        v_code := nullif(btrim(coalesce(r ->> 'member_code', '')), '');
        v_taken := null;
        if p_force and v_code is not null and exists (
          select 1 from public.institution_memberships m
          where m.institution_id = p_institution and m.member_type = 'student' and m.member_code = v_code) then
          v_taken := v_code;
          v_code := null;
        end if;
        v_auto := v_code is null;
        if v_auto then
          loop
            v_code := 'STU-' || lpad(v_next::text, 4, '0');
            v_next := v_next + 1;
            exit when not exists (
              select 1 from public.institution_memberships m
              where m.institution_id = p_institution and m.member_type = 'student' and m.member_code = v_code);
          end loop;
        end if;
        if v_taken is not null then
          v_row_notes := v_row_notes || format('Roll No %s already belongs to another student, so this student was given %s', v_taken, v_code);
        end if;

        v_member := public.erp_create_member(
          p_institution, 'student',
          r ->> 'first_name', coalesce(r ->> 'last_name', ''), v_code,
          nullif(r ->> 'email', ''), nullif(r ->> 'phone', ''), null, nullif(r ->> 'start_date', '')::date, null,
          jsonb_build_object('registration_number', coalesce(r ->> 'registration_number', ''),
                             'admission_date', coalesce(r ->> 'admission_date', '')));

        if p_force and (coalesce(r ->> 'extra_notes', '') <> '' or v_taken is not null) then
          update public.student_profiles
          set notes = left(concat_ws(E'\n',
                nullif(r ->> 'extra_notes', ''),
                case when v_taken is not null then format('Roll No in the sheet: %s (already used by another student)', v_taken) end), 2000)
          where membership_id = v_member;
        end if;

        if v_group is not null then
          insert into public.enrollments (institution_id, group_id, membership_id, start_date)
          select p_institution, v_group, v_member, m.start_date
          from public.institution_memberships m where m.id = v_member;
          v_enrolled := v_enrolled + 1;
        end if;

        if coalesce(r ->> 'guardian_name', '') <> '' then
          perform public.erp_add_guardian(
            v_member, r ->> 'guardian_name', coalesce(nullif(r ->> 'guardian_relationship', ''), 'guardian'),
            nullif(r ->> 'guardian_phone', ''), nullif(r ->> 'guardian_email', ''), true);
          v_guardians := v_guardians + 1;
        end if;

        v_ok := v_ok + 1;
        v_members := v_members || jsonb_build_object('row', v_row, 'id', v_member);
        if v_auto then
          v_codes := v_codes || jsonb_build_object('row', v_row, 'code', v_code);
        end if;
        foreach v_note in array v_row_notes loop
          v_notes := v_notes || jsonb_build_object('row', v_row, 'message', v_note);
        end loop;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_con = constraint_name;
        v_errors := v_errors || jsonb_build_object(
          'row', v_row, 'message', erp_private.import_error_message(v_state, v_msg, v_con));
      end;
    end loop;

    if p_dry_run or (jsonb_array_length(v_errors) > 0 and not v_skip) or v_ok = 0 then
      raise exception using errcode = 'RDXRB', message = 'rollback';
    end if;

    insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
    values (v_uid, p_institution, 'student_import', '', case when p_force then 'force_import' else 'import' end,
            jsonb_build_object('rows', jsonb_array_length(p_rows), 'imported', v_ok,
                               'skipped', jsonb_array_length(v_errors),
                               'generated_ids', jsonb_array_length(v_codes), 'force', p_force));
  exception when sqlstate 'RDXRB' then
    v_rolled_back := true;
  end;

  return jsonb_build_object(
    'ok', v_ok, 'enrolled', v_enrolled, 'guardians', v_guardians,
    'errors', v_errors, 'notes', v_notes, 'codes', v_codes,
    -- ids only mean something once saved
    'members', case when v_rolled_back then '[]'::jsonb else v_members end,
    'saved', not v_rolled_back);
end $$;

revoke all on function public.erp_import_students(uuid, jsonb, boolean, boolean, boolean) from public, anon;
grant execute on function public.erp_import_students(uuid, jsonb, boolean, boolean, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Editing: erp_update_member now also saves a student's notes.
-- -----------------------------------------------------------------------------
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
      admission_date = nullif(p_details ->> 'admission_date', '')::date,
      notes = case when p_details ? 'notes' then left(nullif(btrim(p_details ->> 'notes'), ''), 2000) else notes end
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
