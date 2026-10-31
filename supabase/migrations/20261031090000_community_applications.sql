-- =============================================================================
-- RADIX — Migration 12: Radix Community join applications
-- =============================================================================
-- Public visitors apply to join the community from /community with their
-- name, phone, email, a resume/CV and images of their work.
--
-- * Visitors never touch this table directly. The website's server code checks
--   the input and rate limits, then writes with the service role. Files go
--   straight from the browser to private Storage through one-time signed
--   upload URLs.
-- * Only platform Super Admins can read, review or delete applications and
--   their files (the same role check as inventory, not a permission).
-- * A row stays `incomplete` until every file has arrived; the admin panel
--   hides incomplete rows.
--
-- Self-contained beyond migrations 1-8 (it redefines the Super Admin check
-- from migration 9) and safe to re-run if an earlier attempt stopped halfway.
-- =============================================================================

-- Same definition as migration 9 (inventory); repeated so this file does not
-- depend on inventory being applied first.
create or replace function erp_private.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.user_role_assignments a
    join public.profiles pr on pr.id = a.user_id
    where a.user_id = auth.uid()
      and a.institution_id is null
      and a.role_key = 'super_admin'
      and pr.is_active
  )
$$;
grant execute on function erp_private.is_super_admin() to authenticated;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'community_application_status' and typnamespace = 'public'::regnamespace) then
    create type public.community_application_status as enum
      ('incomplete', 'new', 'reviewing', 'shortlisted', 'accepted', 'rejected');
  end if;
end $$;

create table if not exists public.community_applications (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (length(trim(full_name)) between 2 and 120),
  phone         text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  email         text not null check (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  resume_path   text not null check (length(resume_path) <= 200),
  resume_name   text not null check (length(resume_name) <= 200),
  work_paths    text[] not null check (cardinality(work_paths) between 1 and 8),
  status        public.community_application_status not null default 'incomplete',
  admin_notes   text check (admin_notes is null or length(admin_notes) <= 2000),
  ip_hash       text,
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists community_applications_status_idx on public.community_applications (status, submitted_at desc);
create index if not exists community_applications_email_idx on public.community_applications (lower(email), created_at desc);
create index if not exists community_applications_ip_idx on public.community_applications (ip_hash, created_at desc);

drop trigger if exists community_applications_touch on public.community_applications;
create trigger community_applications_touch before update on public.community_applications
  for each row execute function erp_private.touch_updated_at();

-- Record who changed the status, and when.
create or replace function erp_private.community_review_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists community_applications_review on public.community_applications;
create trigger community_applications_review before update on public.community_applications
  for each row execute function erp_private.community_review_stamp();

drop trigger if exists audit_community_applications on public.community_applications;
create trigger audit_community_applications after update or delete on public.community_applications
  for each row execute function erp_private.audit_row_change();

-- -----------------------------------------------------------------------------
-- Grants and RLS
-- -----------------------------------------------------------------------------
alter table public.community_applications enable row level security;
revoke all on table public.community_applications from anon, authenticated;
grant select, delete on public.community_applications to authenticated;
grant update (status, admin_notes) on public.community_applications to authenticated;
grant all on table public.community_applications to service_role;

drop policy if exists community_applications_super_admin on public.community_applications;
create policy community_applications_super_admin on public.community_applications
  for all to authenticated
  using ((select erp_private.is_super_admin()) and status <> 'incomplete')
  with check ((select erp_private.is_super_admin()) and status <> 'incomplete');

-- Shows the admin page in the ERP navigation. Access itself is checked by role.
insert into public.permissions (key, module, description)
values ('community.manage', 'community', 'Review Radix Community join applications')
on conflict (key) do nothing;
insert into public.role_permissions (role_key, permission_key)
values ('super_admin', 'community.manage')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Storage: private bucket, 10 MB per file, documents and images only.
-- Skipped where the storage schema does not exist (local test databases).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'community-applications', 'community-applications', false, 10485760,
    array[
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ]
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  execute 'drop policy if exists community_files_super_admin_read on storage.objects';
  execute 'drop policy if exists community_files_super_admin_delete on storage.objects';
  execute $p$
    create policy community_files_super_admin_read on storage.objects
      for select to authenticated
      using (bucket_id = 'community-applications' and (select erp_private.is_super_admin()))
  $p$;
  execute $p$
    create policy community_files_super_admin_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'community-applications' and (select erp_private.is_super_admin()))
  $p$;
end $$;
