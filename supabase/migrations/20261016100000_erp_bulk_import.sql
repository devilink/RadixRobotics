-- =============================================================================
-- RADIX ERP — Migration 10: spreadsheet imports (students, inventory)
-- =============================================================================
-- The app reads an uploaded Excel/CSV file or a Google Sheet, validates the
-- cells, and sends the rows here as JSON. Each import runs in one transaction:
--
--   p_dry_run       true  → check every row against the real data and roll
--                           everything back (used for the preview)
--   p_skip_invalid  false → if any row fails, nothing is imported
--                   true  → rows that fail are skipped, the rest are kept
--
-- Rows are written through the same definer functions and constraints as the
-- one-at-a-time screens, so permissions, uniqueness and audit logging apply.
-- Returns { "ok": int, "errors": [{ "row": int, "message": text }], ... }.
-- =============================================================================

-- A user-facing message for an error caught inside an import.
create or replace function erp_private.import_error_message(p_state text, p_message text, p_constraint text)
returns text language sql immutable set search_path = '' as $$
  select case
    -- Postgres truncates long constraint names to 63 characters, so match the prefix.
    when p_constraint like 'institution_memberships_institution_id_member_type_m%'
      then 'This roll number / ID is already used by another student here'
    when p_constraint = 'inventory_items_sku_key' then 'This SKU already exists'
    when p_constraint = 'inventory_kit_components_kit_id_component_id_key' then 'A component is listed twice for this kit'
    when p_state in ('42501', 'P0002', '22023', '55000', '23514', '23505', 'P0001')
         and p_message !~* 'violates|duplicate key' then p_message
    when p_state = '23505' then 'This record already exists'
    when p_state = '23514' then 'Some values are not allowed'
    when p_state in ('22P02', '22007', '22008', '22003') then 'A value is in the wrong format'
    else 'This row could not be imported'
  end
$$;

-- -----------------------------------------------------------------------------
-- Students
-- Row keys: row, first_name, last_name, member_code, email, phone,
--   registration_number, admission_date, start_date, group,
--   guardian_name, guardian_relationship, guardian_phone, guardian_email
-- -----------------------------------------------------------------------------
create or replace function public.erp_import_students(
  p_institution uuid,
  p_rows jsonb,
  p_dry_run boolean default true,
  p_skip_invalid boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_errors jsonb := '[]'::jsonb;
  v_ok integer := 0;
  v_enrolled integer := 0;
  v_guardians integer := 0;
  v_rolled_back boolean := false;
  r jsonb;
  v_member uuid;
  v_group uuid;
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

  begin  -- outer block: lets a dry run (or a failed all-or-nothing run) roll back
    for r in select * from jsonb_array_elements(p_rows) loop
      begin  -- per-row savepoint
        v_group := null;
        if coalesce(r ->> 'group', '') <> '' then
          select g.id into v_group from public.learning_groups g
          where g.institution_id = p_institution and g.status = 'active'
            and lower(g.name) = lower(btrim(r ->> 'group'))
          order by g.academic_year desc nulls last, g.created_at desc
          limit 1;
          if v_group is null then
            raise exception 'Class / batch "%" was not found at this institution', btrim(r ->> 'group')
              using errcode = 'P0002';
          end if;
        end if;

        v_member := public.erp_create_member(
          p_institution, 'student',
          r ->> 'first_name', coalesce(r ->> 'last_name', ''), r ->> 'member_code',
          r ->> 'email', r ->> 'phone', null, nullif(r ->> 'start_date', '')::date, null,
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
            r ->> 'guardian_phone', r ->> 'guardian_email', true);
          v_guardians := v_guardians + 1;
        end if;
        v_ok := v_ok + 1;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_con = constraint_name;
        v_errors := v_errors || jsonb_build_object(
          'row', (r ->> 'row')::integer, 'message', erp_private.import_error_message(v_state, v_msg, v_con));
      end;
    end loop;

    if p_dry_run or (jsonb_array_length(v_errors) > 0 and not p_skip_invalid) or v_ok = 0 then
      raise exception using errcode = 'RDXRB', message = 'rollback';
    end if;

    insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
    values (v_uid, p_institution, 'student_import', '', 'import',
            jsonb_build_object('rows', jsonb_array_length(p_rows), 'imported', v_ok,
                               'skipped', jsonb_array_length(v_errors)));
  exception when sqlstate 'RDXRB' then
    v_rolled_back := true;
  end;

  return jsonb_build_object(
    'ok', v_ok, 'enrolled', v_enrolled, 'guardians', v_guardians,
    'errors', v_errors, 'saved', not v_rolled_back);
end $$;

-- -----------------------------------------------------------------------------
-- Inventory (Super Admin only)
-- Row keys: row, sku, name, kind, category, unit, unit_cost, reorder_level,
--   storage_location, manufacturer, description, quantity,
--   components: [{ sku, quantity }]   (kits only; replaces the kit's contents)
-- Existing SKUs are updated; blank cells leave the current value unchanged.
-- quantity is stock received now (opening stock for new items).
-- -----------------------------------------------------------------------------
create or replace function public.erp_inventory_import(
  p_rows jsonb,
  p_dry_run boolean default true,
  p_skip_invalid boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_super_admin();
  v_errors jsonb := '[]'::jsonb;
  v_failed integer[] := '{}';
  v_created integer := 0;
  v_updated integer := 0;
  v_units bigint := 0;
  v_rolled_back boolean := false;
  r jsonb;
  c jsonb;
  v_item uuid;
  v_kit uuid;
  v_cat uuid;
  v_comp uuid;
  v_qty integer;
  v_state text; v_msg text; v_con text;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The sheet has no rows to import' using errcode = '22023';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'Import at most 2000 rows at a time' using errcode = '22023';
  end if;

  begin
    -- Pass 1: items, categories and stock.
    for r in select * from jsonb_array_elements(p_rows) loop
      begin
        v_cat := null;
        if coalesce(r ->> 'category', '') <> '' then
          select id into v_cat from public.inventory_categories where lower(name) = lower(btrim(r ->> 'category'));
          if v_cat is null then
            insert into public.inventory_categories (name) values (btrim(r ->> 'category')) returning id into v_cat;
          end if;
        end if;

        select id into v_item from public.inventory_items where sku = upper(btrim(r ->> 'sku'));
        if v_item is null then
          if coalesce(r ->> 'name', '') = '' then
            raise exception 'Name is required for a new item' using errcode = '22023';
          end if;
          insert into public.inventory_items
            (sku, name, kind, category_id, unit, unit_cost, reorder_level, storage_location, manufacturer, description, created_by)
          values (
            upper(btrim(r ->> 'sku')), btrim(r ->> 'name'),
            coalesce(nullif(r ->> 'kind', ''), 'component')::public.inventory_item_kind, v_cat,
            coalesce(nullif(btrim(r ->> 'unit'), ''), 'pcs'),
            nullif(r ->> 'unit_cost', '')::numeric, coalesce(nullif(r ->> 'reorder_level', '')::integer, 0),
            nullif(btrim(r ->> 'storage_location'), ''), nullif(btrim(r ->> 'manufacturer'), ''),
            nullif(btrim(r ->> 'description'), ''), v_uid)
          returning id into v_item;
          v_created := v_created + 1;
        else
          update public.inventory_items set
            name             = coalesce(nullif(btrim(r ->> 'name'), ''), name),
            kind             = coalesce(nullif(r ->> 'kind', '')::public.inventory_item_kind, kind),
            category_id      = coalesce(v_cat, category_id),
            unit             = coalesce(nullif(btrim(r ->> 'unit'), ''), unit),
            unit_cost        = coalesce(nullif(r ->> 'unit_cost', '')::numeric, unit_cost),
            reorder_level    = coalesce(nullif(r ->> 'reorder_level', '')::integer, reorder_level),
            storage_location = coalesce(nullif(btrim(r ->> 'storage_location'), ''), storage_location),
            manufacturer     = coalesce(nullif(btrim(r ->> 'manufacturer'), ''), manufacturer),
            description      = coalesce(nullif(btrim(r ->> 'description'), ''), description)
          where id = v_item;
          v_updated := v_updated + 1;
        end if;

        v_qty := coalesce(nullif(r ->> 'quantity', '')::integer, 0);
        if v_qty < 0 then
          raise exception 'Quantity cannot be negative. Use a stock count on the item page to reduce stock' using errcode = '22023';
        elsif v_qty > 0 then
          perform public.erp_inventory_move(v_item, 'receive', v_qty, null, null, null, 'Spreadsheet import');
          v_units := v_units + v_qty;
        end if;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_con = constraint_name;
        v_failed := v_failed || (r ->> 'row')::integer;
        v_errors := v_errors || jsonb_build_object(
          'row', (r ->> 'row')::integer, 'message', erp_private.import_error_message(v_state, v_msg, v_con));
      end;
    end loop;

    -- Pass 2: kit contents, after every item in the sheet exists.
    for r in select * from jsonb_array_elements(p_rows)
             where jsonb_typeof(value -> 'components') = 'array' and jsonb_array_length(value -> 'components') > 0 loop
      continue when (r ->> 'row')::integer = any (v_failed);
      begin
        select id into v_kit from public.inventory_items where sku = upper(btrim(r ->> 'sku'));
        delete from public.inventory_kit_components where kit_id = v_kit;
        for c in select * from jsonb_array_elements(r -> 'components') loop
          select id into v_comp from public.inventory_items where sku = upper(btrim(c ->> 'sku'));
          if v_comp is null then
            raise exception 'Kit component % was not found', upper(btrim(c ->> 'sku')) using errcode = 'P0002';
          end if;
          insert into public.inventory_kit_components (kit_id, component_id, quantity)
          values (v_kit, v_comp, (c ->> 'quantity')::integer);
        end loop;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text, v_con = constraint_name;
        v_errors := v_errors || jsonb_build_object(
          'row', (r ->> 'row')::integer, 'message', erp_private.import_error_message(v_state, v_msg, v_con));
      end;
    end loop;

    if p_dry_run or (jsonb_array_length(v_errors) > 0 and not p_skip_invalid) or v_created + v_updated = 0 then
      raise exception using errcode = 'RDXRB', message = 'rollback';
    end if;

    insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, new_data)
    values (v_uid, null, 'inventory_import', '', 'import',
            jsonb_build_object('rows', jsonb_array_length(p_rows), 'created', v_created, 'updated', v_updated,
                               'units_received', v_units, 'errors', jsonb_array_length(v_errors)));
  exception when sqlstate 'RDXRB' then
    v_rolled_back := true;
  end;

  return jsonb_build_object(
    'created', v_created, 'updated', v_updated, 'units_received', v_units,
    'errors', v_errors, 'saved', not v_rolled_back);
end $$;

revoke all on function public.erp_import_students(uuid, jsonb, boolean, boolean) from public, anon;
revoke all on function public.erp_inventory_import(jsonb, boolean, boolean) from public, anon;
grant execute on function public.erp_import_students(uuid, jsonb, boolean, boolean) to authenticated;
grant execute on function public.erp_inventory_import(jsonb, boolean, boolean) to authenticated;
