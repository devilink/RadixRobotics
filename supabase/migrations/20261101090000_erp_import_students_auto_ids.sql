-- =============================================================================
-- RADIX ERP — Migration 13: student import with auto IDs and soft class matching
-- =============================================================================
-- Replaces public.erp_import_students (migration 10) with the same signature:
--
--   * Rows without a Roll No / Student ID get one from the database, numbered
--     per institution: STU-0001, STU-0002, … (continuing after the highest
--     existing STU-number). Imports at one institution are serialised with an
--     advisory lock so two uploads can never hand out the same ID. A dry run
--     assigns the same IDs the real upload will, so the preview matches.
--   * A Class / Batch that is not found no longer fails the row: the student is
--     imported without an enrolment and the row gets a note.
--
-- Extra keys in the result:
--   codes: [{ row, code }]     IDs generated for rows that had none
--   notes: [{ row, message }]  things that were left out of an imported row
-- =============================================================================

create or replace function public.erp_import_students(
  p_institution uuid,
  p_rows jsonb,
  p_dry_run boolean default true,
  p_skip_invalid boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_errors jsonb := '[]'::jsonb;
  v_notes jsonb := '[]'::jsonb;
  v_codes jsonb := '[]'::jsonb;
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

        v_member := public.erp_create_member(
          p_institution, 'student',
          r ->> 'first_name', coalesce(r ->> 'last_name', ''), v_code,
          nullif(r ->> 'email', ''), nullif(r ->> 'phone', ''), null, nullif(r ->> 'start_date', '')::date, null,
          jsonb_build_object('registration_number', coalesce(r ->> 'registration_number', ''),
                             'admission_date', coalesce(r ->> 'admission_date', '')));

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

    if p_dry_run or (jsonb_array_length(v_errors) > 0 and not p_skip_invalid) or v_ok = 0 then
      raise exception using errcode = 'RDXRB', message = 'rollback';
    end if;

    insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
    values (v_uid, p_institution, 'student_import', '', 'import',
            jsonb_build_object('rows', jsonb_array_length(p_rows), 'imported', v_ok,
                               'skipped', jsonb_array_length(v_errors),
                               'generated_ids', jsonb_array_length(v_codes)));
  exception when sqlstate 'RDXRB' then
    v_rolled_back := true;
  end;

  return jsonb_build_object(
    'ok', v_ok, 'enrolled', v_enrolled, 'guardians', v_guardians,
    'errors', v_errors, 'notes', v_notes, 'codes', v_codes, 'saved', not v_rolled_back);
end $$;

revoke all on function public.erp_import_students(uuid, jsonb, boolean, boolean) from public, anon;
grant execute on function public.erp_import_students(uuid, jsonb, boolean, boolean) to authenticated;
