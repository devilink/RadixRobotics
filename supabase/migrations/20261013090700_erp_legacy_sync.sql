-- =============================================================================
-- RADIX ERP — Migration 8: keep the curriculum portal and the ERP in sync
-- =============================================================================
-- The super admin panel provisions schools and Radix Learning Centers in the
-- legacy `public.schools` table (each with an ID + password login). These
-- triggers mirror every add, rename and delete into the ERP, so the bridge in
-- migration 6 is not a one-off copy. Safe to re-run; skipped when the legacy
-- tables do not exist.
-- =============================================================================

do $$
begin
  if to_regclass('public.schools') is null then
    return;
  end if;

  -- Which ERP category a portal tenant belongs to.
  alter table public.schools
    add column if not exists category text not null default 'school';
  if not exists (select 1 from pg_constraint where conname = 'schools_category_check') then
    alter table public.schools
      add constraint schools_category_check check (category in ('school', 'learning_center'));
  end if;
end $$;

-- ERP institution for a portal tenant (created, or linked if the code already exists).
create or replace function erp_private.sync_legacy_school()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if upper(new.custom_id) !~ '^[A-Z0-9][A-Z0-9-]{1,31}$' or length(btrim(new.school_name)) < 2 then
    return new; -- not representable as an ERP institution code; leave portal-only
  end if;

  if tg_op = 'INSERT' then
    insert into public.institutions (code, name, institution_type, legacy_school_id)
    values (upper(new.custom_id), btrim(new.school_name), new.category::public.institution_type, new.custom_id)
    on conflict (code) do update
      set legacy_school_id = coalesce(public.institutions.legacy_school_id, excluded.legacy_school_id)
    returning id into v_id;
    insert into public.campuses (institution_id, name, is_primary)
    values (v_id, 'Main Campus', true)
    on conflict do nothing;
  elsif new.school_name is distinct from old.school_name then
    update public.institutions set name = btrim(new.school_name) where legacy_school_id = new.custom_id;
  end if;
  return new;
end $$;

-- Deleting a tenant in the portal archives its ERP institution (attendance history is kept).
create or replace function erp_private.archive_legacy_school()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.institutions set status = 'archived' where legacy_school_id = old.custom_id;
  return old;
end $$;

-- A portal admin login becomes School Admin (schools) or Centre Manager (centers) in the ERP.
create or replace function erp_private.sync_legacy_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_inst uuid;
  v_type public.institution_type;
begin
  if new.role <> 'school_admin' or new.school_id is null then
    return new;
  end if;
  select id, institution_type into v_inst, v_type from public.institutions where legacy_school_id = new.school_id;
  if v_inst is null or not exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;
  insert into public.user_role_assignments (user_id, role_key, institution_id)
  values (new.id, case when v_type = 'learning_center' then 'centre_manager' else 'school_admin' end, v_inst)
  on conflict do nothing;
  return new;
end $$;

do $$
begin
  if to_regclass('public.schools') is not null then
    drop trigger if exists erp_sync_school on public.schools;
    create trigger erp_sync_school after insert or update of school_name on public.schools
      for each row execute function erp_private.sync_legacy_school();
    drop trigger if exists erp_archive_school on public.schools;
    create trigger erp_archive_school before delete on public.schools
      for each row execute function erp_private.archive_legacy_school();

    -- Catch up on tenants created since the migration 6 bridge ran.
    insert into public.institutions (code, name, institution_type, legacy_school_id)
    select upper(s.custom_id), btrim(s.school_name), s.category::public.institution_type, s.custom_id
    from public.schools s
    where upper(s.custom_id) ~ '^[A-Z0-9][A-Z0-9-]{1,31}$'
      and length(btrim(s.school_name)) >= 2
      and not exists (select 1 from public.institutions i where i.legacy_school_id = s.custom_id)
    on conflict (code) do nothing;
    insert into public.campuses (institution_id, name, is_primary)
    select i.id, 'Main Campus', true
    from public.institutions i
    where i.legacy_school_id is not null
      and not exists (select 1 from public.campuses c where c.institution_id = i.id)
    on conflict do nothing;
  end if;

  if to_regclass('public.user_roles') is not null and to_regclass('public.schools') is not null then
    drop trigger if exists erp_sync_admin on public.user_roles;
    create trigger erp_sync_admin after insert or update of role, school_id on public.user_roles
      for each row execute function erp_private.sync_legacy_admin();

    insert into public.user_role_assignments (user_id, role_key, institution_id)
    select ur.id, case when i.institution_type = 'learning_center' then 'centre_manager' else 'school_admin' end, i.id
    from public.user_roles ur
    join public.profiles p on p.id = ur.id
    join public.institutions i on i.legacy_school_id = ur.school_id
    where ur.role = 'school_admin'
    on conflict do nothing;
  end if;
end $$;

revoke all on function erp_private.sync_legacy_school() from public, anon, authenticated;
revoke all on function erp_private.archive_legacy_school() from public, anon, authenticated;
revoke all on function erp_private.sync_legacy_admin() from public, anon, authenticated;
