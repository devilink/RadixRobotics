-- =============================================================================
-- RADIX ERP — Migration 14: delete students
-- =============================================================================
-- public.erp_delete_students(p_memberships uuid[]) permanently deletes student
-- records the caller manages (students.manage at the student's institution).
--
-- Everything hanging off a membership cascades (profile, enrolments, guardian
-- links, attendance), so two cases are refused instead of silently losing data:
--   * the student has attendance records: mark them Left instead, which keeps
--     registers and reports intact;
--   * the person has a portal login: remove the login first (needs the auth
--     admin API, which the app does from Admin -> Users).
-- The person row is removed when they have no other role anywhere, and guardian
-- contacts are removed when no other student uses them. Each deletion is audited.
--
-- Returns { deleted: int, blocked: [{ id, name, reason }] }.
-- =============================================================================

create or replace function public.erp_delete_students(p_memberships uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_deleted integer := 0;
  v_blocked jsonb := '[]'::jsonb;
  v_id uuid;
  m public.institution_memberships;
  p public.people;
  v_name text;
  v_guardians uuid[];
begin
  if p_memberships is null or cardinality(p_memberships) = 0 then
    raise exception 'Choose at least one student' using errcode = '22023';
  end if;
  if cardinality(p_memberships) > 500 then
    raise exception 'Delete at most 500 students at a time' using errcode = '22023';
  end if;

  foreach v_id in array (select array_agg(distinct x) from unnest(p_memberships) x) loop
    select * into m from public.institution_memberships where id = v_id for update;
    if not found or m.member_type <> 'student'
       or not erp_private.has_permission('students.manage', m.institution_id) then
      v_blocked := v_blocked || jsonb_build_object('id', v_id, 'name', null, 'reason', 'Student not found');
      continue;
    end if;
    select * into p from public.people where id = m.person_id;
    v_name := btrim(p.first_name || ' ' || p.last_name);

    if exists (select 1 from public.attendance_records a where a.membership_id = v_id) then
      v_blocked := v_blocked || jsonb_build_object('id', v_id, 'name', v_name,
        'reason', 'Has attendance records. Set their status to Left instead, which keeps their history');
      continue;
    end if;
    if exists (select 1 from public.profiles pr where pr.person_id = m.person_id) then
      v_blocked := v_blocked || jsonb_build_object('id', v_id, 'name', v_name,
        'reason', 'Has a portal login. Remove the login first (Admin → Users)');
      continue;
    end if;

    select coalesce(array_agg(g.guardian_id), '{}') into v_guardians
    from public.guardian_student_relationships g where g.student_membership_id = v_id;

    insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, old_data)
    values (v_uid, m.institution_id, 'institution_membership', v_id::text, 'delete',
            jsonb_build_object('member_code', m.member_code, 'name', v_name, 'member_type', m.member_type));

    delete from public.institution_memberships where id = v_id;

    -- Tidy up what only this student used.
    delete from public.guardians gu
    where gu.id = any (v_guardians)
      and not exists (select 1 from public.guardian_student_relationships r where r.guardian_id = gu.id);
    if not exists (select 1 from public.institution_memberships o where o.person_id = m.person_id) then
      delete from public.people where id = m.person_id;
    end if;

    v_deleted := v_deleted + 1;
  end loop;

  return jsonb_build_object('deleted', v_deleted, 'blocked', v_blocked);
end $$;

revoke all on function public.erp_delete_students(uuid[]) from public, anon;
grant execute on function public.erp_delete_students(uuid[]) to authenticated;
