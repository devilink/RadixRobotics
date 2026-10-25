-- =============================================================================
-- RADIX ERP — Migration 6: bridge the existing curriculum portal into the ERP
-- =============================================================================
-- The existing app has `public.schools` and `public.user_roles` (see
-- supabase_rbac_schema.sql). This migration links them to the ERP without
-- modifying or removing them, so the current portal keeps working.
-- Each step is skipped when the legacy table does not exist (fresh databases).
-- =============================================================================

-- Radix's own organisation, used for company employees and HR records.
insert into public.institutions (code, name, institution_type)
values ('RADIX-HQ', 'Radix Robotics Head Office', 'head_office')
on conflict (code) do nothing;

do $$
begin
  if to_regclass('public.schools') is not null then
    alter table public.institutions
      add column if not exists legacy_school_id text unique
        references public.schools(custom_id) on delete set null;

    -- One ERP school per legacy school (codes like RADIX-AB12CD already fit the format).
    insert into public.institutions (code, name, institution_type, legacy_school_id)
    select upper(s.custom_id), s.school_name, 'school', s.custom_id
    from public.schools s
    where upper(s.custom_id) ~ '^[A-Z0-9][A-Z0-9-]{1,31}$'
      and length(btrim(s.school_name)) >= 2
    on conflict (code) do nothing;
  end if;

  -- The portal used to infer a school admin from an "<school id>@radix.school"
  -- email when no user_roles row existed. That inference is removed from the
  -- app, so give every such existing account an explicit row first.
  if to_regclass('public.user_roles') is not null and to_regclass('public.schools') is not null then
    insert into public.user_roles (id, role, school_id)
    select u.id, 'school_admin', s.custom_id
    from auth.users u
    join public.schools s on lower(u.email) = lower(s.custom_id) || '@radix.school'
    where not exists (select 1 from public.user_roles ur where ur.id = u.id)
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.user_roles') is not null then
    insert into public.user_role_assignments (user_id, role_key, institution_id)
    select ur.id, 'super_admin', null
    from public.user_roles ur
    join public.profiles p on p.id = ur.id
    where ur.role = 'super_admin'
    on conflict do nothing;

    if to_regclass('public.schools') is not null then
      insert into public.user_role_assignments (user_id, role_key, institution_id)
      select ur.id, 'school_admin', i.id
      from public.user_roles ur
      join public.profiles p on p.id = ur.id
      join public.institutions i on i.legacy_school_id = ur.school_id
      where ur.role = 'school_admin'
      on conflict do nothing;
    end if;
  end if;
end $$;
