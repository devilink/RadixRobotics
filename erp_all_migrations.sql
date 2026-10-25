-- Radix ERP: all migrations in order. Paste into Supabase SQL editor and Run.
begin;

-- >>> supabase/migrations/20261013090000_erp_core.sql
-- =============================================================================
-- RADIX ERP — Migration 1: core identity, RBAC, institutions, people, groups
-- =============================================================================
-- Target: Supabase Postgres (15+). Relies on Supabase's `auth` schema
-- (auth.users, auth.uid()). Safe to run once; later changes go in new files.
--
-- Design notes
--  * Every tenant-scoped row carries `institution_id`. Composite foreign keys
--    (institution_id, id) make it impossible to attach a record from one
--    institution to a parent belonging to another.
--  * Role assignments are either platform-wide (institution_id IS NULL) or
--    scoped to one institution.
--  * Helper functions used by RLS live in `erp_private`, which PostgREST does
--    not expose. They are SECURITY DEFINER so policies can look up role data
--    without recursive RLS evaluation.
-- =============================================================================

create schema if not exists erp_private;
revoke all on schema erp_private from public;
grant usage on schema erp_private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.institution_type as enum ('school', 'learning_center', 'head_office');
create type public.record_status as enum ('active', 'inactive', 'archived');
create type public.member_type as enum ('student', 'teacher', 'instructor', 'staff', 'employee');
create type public.membership_status as enum ('active', 'inactive', 'graduated', 'left');
create type public.group_type as enum ('class_section', 'batch');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function erp_private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function erp_private.is_valid_timezone(tz text)
returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz)
$$;

-- -----------------------------------------------------------------------------
-- RBAC catalogue
-- -----------------------------------------------------------------------------
create table public.permissions (
  key         text primary key check (key ~ '^[a-z_]+\.[a-z_]+$'),
  module      text not null,
  description text not null
);

create table public.roles (
  key         text primary key check (key ~ '^[a-z_]+$'),
  name        text not null,
  scope       text not null check (scope in ('platform', 'institution')),
  -- Which institution types an institution-scoped role may be granted at.
  applies_to  public.institution_type[],
  description text,
  sort_order  int not null default 100
);

create table public.role_permissions (
  role_key       text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

-- -----------------------------------------------------------------------------
-- People (one row per human, shared across institutions)
-- -----------------------------------------------------------------------------
create table public.people (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null check (length(btrim(first_name)) between 1 and 100),
  last_name      text not null default '' check (length(last_name) <= 100),
  email          text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone          text check (phone is null or phone ~ '^[0-9+()\-\s]{6,20}$'),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index people_name_idx on public.people (lower(first_name), lower(last_name));
create trigger people_touch before update on public.people
  for each row execute function erp_private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Profiles (one per auth user; optionally linked to a person record)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  person_id  uuid unique references public.people(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function erp_private.touch_updated_at();

-- Create a profile automatically for every new auth user.
create or replace function erp_private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created_erp_profile
  after insert on auth.users
  for each row execute function erp_private.handle_new_auth_user();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Institutions and campuses
-- -----------------------------------------------------------------------------
create table public.institutions (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{1,31}$'),
  name               text not null check (length(btrim(name)) between 2 and 200),
  institution_type   public.institution_type not null,
  status             public.record_status not null default 'active',
  timezone           text not null default 'Asia/Kolkata'
                       check (erp_private.is_valid_timezone(timezone)),
  email              text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text check (phone is null or phone ~ '^[0-9+()\-\s]{6,20}$'),
  address_line       text check (length(address_line) <= 300),
  city               text check (length(city) <= 100),
  state              text check (length(state) <= 100),
  postal_code        text check (length(postal_code) <= 20),
  -- ISO day-of-week numbers (1 = Monday … 7 = Sunday) on which registers are expected.
  working_days       smallint[] not null default '{1,2,3,4,5,6}'
                       check (working_days <@ '{1,2,3,4,5,6,7}'::smallint[]),
  account_manager_id uuid references public.profiles(id) on delete set null,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index institutions_type_status_idx on public.institutions (institution_type, status);
create trigger institutions_touch before update on public.institutions
  for each row execute function erp_private.touch_updated_at();

create table public.campuses (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null check (length(btrim(name)) between 1 and 150),
  address_line   text check (length(address_line) <= 300),
  city           text check (length(city) <= 100),
  is_primary     boolean not null default false,
  status         public.record_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, name),
  unique (institution_id, id)
);
create unique index campuses_one_primary on public.campuses (institution_id) where is_primary;
create trigger campuses_touch before update on public.campuses
  for each row execute function erp_private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Role assignments
-- -----------------------------------------------------------------------------
create table public.user_role_assignments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  role_key       text not null references public.roles(key) on delete restrict,
  institution_id uuid references public.institutions(id) on delete cascade,
  granted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique nulls not distinct (user_id, role_key, institution_id)
);
create index ura_user_idx on public.user_role_assignments (user_id);
create index ura_institution_idx on public.user_role_assignments (institution_id);

-- Platform roles must not carry an institution; institution roles must.
create or replace function erp_private.check_role_assignment_scope()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_scope text;
  v_applies public.institution_type[];
  v_type public.institution_type;
begin
  select scope, applies_to into v_scope, v_applies from public.roles where key = new.role_key;
  if v_scope = 'platform' and new.institution_id is not null then
    raise exception 'Role % is platform-wide and cannot be scoped to an institution', new.role_key
      using errcode = '23514';
  elsif v_scope = 'institution' and new.institution_id is null then
    raise exception 'Role % must be assigned to a specific institution', new.role_key
      using errcode = '23514';
  end if;
  if v_scope = 'institution' and v_applies is not null then
    select institution_type into v_type from public.institutions where id = new.institution_id;
    if not (v_type = any (v_applies)) then
      raise exception 'Role % cannot be granted at a % institution', new.role_key, v_type
        using errcode = '23514';
    end if;
  end if;
  return new;
end $$;

create trigger ura_scope_check before insert or update on public.user_role_assignments
  for each row execute function erp_private.check_role_assignment_scope();

-- -----------------------------------------------------------------------------
-- Institution memberships (a person's role *within* an institution)
-- -----------------------------------------------------------------------------
create table public.institution_memberships (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  person_id      uuid not null references public.people(id) on delete cascade,
  campus_id      uuid,
  member_type    public.member_type not null,
  -- Student ID / employee ID / registration number, unique per institution & type.
  member_code    text not null check (member_code ~ '^[A-Za-z0-9][A-Za-z0-9/_-]{0,39}$'),
  status         public.membership_status not null default 'active',
  start_date     date not null default current_date,
  end_date       date check (end_date is null or end_date >= start_date),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, member_type, member_code),
  unique (institution_id, person_id, member_type),
  unique (institution_id, id),
  foreign key (institution_id, campus_id) references public.campuses(institution_id, id)
);
create index memberships_person_idx on public.institution_memberships (person_id);
create index memberships_inst_type_idx on public.institution_memberships (institution_id, member_type, status);
create trigger memberships_touch before update on public.institution_memberships
  for each row execute function erp_private.touch_updated_at();

-- Student-specific details (kept minimal: data minimisation for minors).
create table public.student_profiles (
  membership_id       uuid primary key references public.institution_memberships(id) on delete cascade,
  registration_number text check (length(registration_number) <= 40),
  admission_date      date,
  notes               text check (length(notes) <= 2000),
  updated_at          timestamptz not null default now()
);
create trigger student_profiles_touch before update on public.student_profiles
  for each row execute function erp_private.touch_updated_at();

create table public.work_shifts (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null check (length(btrim(name)) between 1 and 80),
  start_time     time not null,
  end_time       time not null,
  grace_minutes  int not null default 10 check (grace_minutes between 0 and 240),
  days_of_week   smallint[] not null default '{1,2,3,4,5,6}'
                   check (days_of_week <@ '{1,2,3,4,5,6,7}'::smallint[]),
  created_at     timestamptz not null default now(),
  unique (institution_id, name),
  unique (institution_id, id)
);

-- Staff / employee HR details (restricted by `hr.view`).
create table public.employee_profiles (
  membership_id          uuid primary key,
  institution_id         uuid not null,
  department             text check (length(department) <= 100),
  position               text check (length(position) <= 100),
  employment_type        text check (employment_type in ('full_time', 'part_time', 'contract', 'intern', 'volunteer')),
  reporting_manager_id   uuid,
  shift_id               uuid,
  qualifications         text check (length(qualifications) <= 2000),
  updated_at             timestamptz not null default now(),
  foreign key (institution_id, membership_id) references public.institution_memberships(institution_id, id) on delete cascade,
  foreign key (institution_id, reporting_manager_id) references public.institution_memberships(institution_id, id),
  foreign key (institution_id, shift_id) references public.work_shifts(institution_id, id)
);
create trigger employee_profiles_touch before update on public.employee_profiles
  for each row execute function erp_private.touch_updated_at();

-- Guardians (contact data for minors; visible only with student permissions).
create table public.guardians (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (length(btrim(full_name)) between 1 and 150),
  phone      text check (phone is null or phone ~ '^[0-9+()\-\s]{6,20}$'),
  email      text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

create table public.guardian_student_relationships (
  guardian_id        uuid not null references public.guardians(id) on delete cascade,
  student_membership_id uuid not null references public.institution_memberships(id) on delete cascade,
  relationship       text not null check (relationship in ('mother', 'father', 'guardian', 'other')),
  is_primary_contact boolean not null default false,
  primary key (guardian_id, student_membership_id)
);
create index gsr_student_idx on public.guardian_student_relationships (student_membership_id);

-- -----------------------------------------------------------------------------
-- Learning groups: school class-sections and learning-centre batches share one
-- table so attendance, enrolment and reporting logic is written once.
-- -----------------------------------------------------------------------------
create table public.learning_groups (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id      uuid,
  group_type     public.group_type not null,
  name           text not null check (length(btrim(name)) between 1 and 120),
  grade          text check (length(grade) <= 30),
  section        text check (length(section) <= 30),
  academic_year  text check (academic_year is null or academic_year ~ '^[0-9]{4}(-[0-9]{2,4})?$'),
  capacity       int check (capacity is null or capacity between 1 and 1000),
  -- Days a batch meets (ISO dow). NULL = follow the institution's working days.
  meeting_days   smallint[] check (meeting_days <@ '{1,2,3,4,5,6,7}'::smallint[]),
  start_time     time,
  end_time       time,
  status         public.record_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (institution_id, id),
  foreign key (institution_id, campus_id) references public.campuses(institution_id, id),
  check (end_time is null or start_time is null or end_time > start_time)
);
create unique index learning_groups_name_uq
  on public.learning_groups (institution_id, lower(name), coalesce(academic_year, ''));
create trigger learning_groups_touch before update on public.learning_groups
  for each row execute function erp_private.touch_updated_at();

-- Class sections only exist at schools; batches only at learning centres.
create or replace function erp_private.check_group_type()
returns trigger language plpgsql set search_path = '' as $$
declare v_type public.institution_type;
begin
  select institution_type into v_type from public.institutions where id = new.institution_id;
  if (new.group_type = 'class_section' and v_type <> 'school')
     or (new.group_type = 'batch' and v_type <> 'learning_center') then
    raise exception 'A % cannot belong to a % institution', new.group_type, v_type
      using errcode = '23514';
  end if;
  return new;
end $$;
create trigger learning_groups_type_check before insert or update on public.learning_groups
  for each row execute function erp_private.check_group_type();

create table public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  group_id       uuid not null,
  membership_id  uuid not null,
  start_date     date not null default current_date,
  end_date       date check (end_date is null or end_date >= start_date),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (group_id, membership_id),
  foreign key (institution_id, group_id) references public.learning_groups(institution_id, id) on delete cascade,
  foreign key (institution_id, membership_id) references public.institution_memberships(institution_id, id) on delete cascade
);
create index enrollments_membership_idx on public.enrollments (membership_id);

create table public.group_assignments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  group_id       uuid not null,
  membership_id  uuid not null,
  assignment_role text not null default 'lead' check (assignment_role in ('lead', 'assistant')),
  created_at     timestamptz not null default now(),
  unique (group_id, membership_id),
  foreign key (institution_id, group_id) references public.learning_groups(institution_id, id) on delete cascade,
  foreign key (institution_id, membership_id) references public.institution_memberships(institution_id, id) on delete cascade
);
create index group_assignments_membership_idx on public.group_assignments (membership_id);

-- Only students can be enrolled; only staff-type members can be assigned.
create or replace function erp_private.check_member_type_for_group()
returns trigger language plpgsql set search_path = '' as $$
declare v_type public.member_type;
begin
  select member_type into v_type from public.institution_memberships where id = new.membership_id;
  if tg_table_name = 'enrollments' and v_type <> 'student' then
    raise exception 'Only students can be enrolled in a class or batch' using errcode = '23514';
  elsif tg_table_name = 'group_assignments' and v_type = 'student' then
    raise exception 'Students cannot be assigned as teachers or instructors' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger enrollments_type_check before insert or update on public.enrollments
  for each row execute function erp_private.check_member_type_for_group();
create trigger group_assignments_type_check before insert or update on public.group_assignments
  for each row execute function erp_private.check_member_type_for_group();

-- -----------------------------------------------------------------------------
-- Audit log (append-only; written only by triggers / definer functions)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  actor_id       uuid,
  institution_id uuid,
  entity_type    text not null,
  entity_id      text not null,
  action         text not null,
  reason         text,
  old_data       jsonb,
  new_data       jsonb
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_inst_time_idx on public.audit_logs (institution_id, occurred_at desc);

-- Generic row-change audit trigger. A calling function may set
-- `erp.audit_reason` (transaction-local) to attach a reason.
create or replace function erp_private.audit_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_inst uuid;
begin
  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then
    return new;  -- no material change
  end if;
  v_inst := case
    when tg_table_name = 'institutions' then (v_row ->> 'id')::uuid
    when v_row ? 'institution_id' then (v_row ->> 'institution_id')::uuid
  end;
  insert into public.audit_logs (actor_id, institution_id, entity_type, entity_id, action, reason, old_data, new_data)
  values (
    auth.uid(), v_inst, tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'membership_id', ''),
    lower(tg_op),
    nullif(current_setting('erp.audit_reason', true), ''),
    v_old, v_new
  );
  return coalesce(new, old);
end $$;

create trigger audit_institutions after insert or update or delete on public.institutions
  for each row execute function erp_private.audit_row_change();
create trigger audit_memberships after insert or update or delete on public.institution_memberships
  for each row execute function erp_private.audit_row_change();
create trigger audit_role_assignments after insert or update or delete on public.user_role_assignments
  for each row execute function erp_private.audit_row_change();
create trigger audit_employee_profiles after insert or update or delete on public.employee_profiles
  for each row execute function erp_private.audit_row_change();
create trigger audit_enrollments after insert or update or delete on public.enrollments
  for each row execute function erp_private.audit_row_change();

-- >>> supabase/migrations/20261013090100_erp_attendance.sql
-- =============================================================================
-- RADIX ERP — Migration 2: attendance framework, corrections, leave
-- =============================================================================

create type public.attendance_kind as enum ('student', 'staff');
create type public.attendance_session_status as enum ('draft', 'submitted', 'finalized');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused', 'half_day', 'on_leave');
create type public.attendance_method as enum ('manual', 'qr', 'rfid');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- Per-institution attendance policy (configurable defaults).
alter table public.institutions
  -- How many days back markers may open/edit registers. Older dates need attendance.correct.
  add column attendance_backdate_days int not null default 7 check (attendance_backdate_days between 0 and 365),
  -- When true, even users with *.correct must route changes through an approval request.
  add column require_correction_approval boolean not null default false;

-- One register = one attendance session. Student registers belong to a class
-- section or batch; staff registers cover the institution's staff for a day.
create table public.attendance_sessions (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  kind           public.attendance_kind not null,
  group_id       uuid,
  session_date   date not null,
  -- Optional period / slot label for multiple sessions per day (e.g. "P3 Robotics Lab").
  period_label   text not null default '' check (length(period_label) <= 60),
  status         public.attendance_session_status not null default 'draft',
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  submitted_by   uuid references auth.users(id) on delete set null,
  submitted_at   timestamptz,
  finalized_by   uuid references auth.users(id) on delete set null,
  finalized_at   timestamptz,
  unique (institution_id, id),
  unique (institution_id, id, kind),
  foreign key (institution_id, group_id) references public.learning_groups(institution_id, id) on delete cascade,
  check ((kind = 'student') = (group_id is not null))
);
-- At most one register per group (or staff roster) per date and period.
create unique index attendance_sessions_unique
  on public.attendance_sessions (institution_id, kind, coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid), session_date, period_label);
create index attendance_sessions_date_idx on public.attendance_sessions (session_date, institution_id);
create index attendance_sessions_group_idx on public.attendance_sessions (group_id, session_date);

create table public.attendance_records (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null,
  session_id        uuid not null,
  kind              public.attendance_kind not null,
  membership_id     uuid not null,
  status            public.attendance_status not null,
  check_in_at       timestamptz,
  check_out_at      timestamptz,
  remarks           text check (length(remarks) <= 500),
  method            public.attendance_method not null default 'manual',
  marked_by         uuid references auth.users(id) on delete set null,
  marked_at         timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null,
  updated_at        timestamptz not null default now(),
  version           int not null default 1,
  corrected_by      uuid references auth.users(id) on delete set null,
  corrected_at      timestamptz,
  correction_reason text check (length(correction_reason) <= 500),
  -- Database-level duplicate prevention: one record per person per session.
  unique (session_id, membership_id),
  -- Composite key guarantees the record's institution and kind match its session.
  foreign key (institution_id, session_id, kind) references public.attendance_sessions(institution_id, id, kind) on delete cascade,
  foreign key (institution_id, membership_id) references public.institution_memberships(institution_id, id) on delete cascade,
  check (check_out_at is null or check_in_at is null or check_out_at >= check_in_at)
);
create index attendance_records_membership_idx on public.attendance_records (membership_id);
create index attendance_records_inst_idx on public.attendance_records (institution_id, kind, status);

-- Validates a record against its session: correct member type, and "on_leave"
-- only on staff registers.
create or replace function erp_private.check_attendance_record()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_kind public.attendance_kind := new.kind;
  v_member public.member_type;
begin
  select member_type into v_member from public.institution_memberships where id = new.membership_id;
  if v_kind = 'student' and v_member <> 'student' then
    raise exception 'Only students can appear on a student register' using errcode = '23514';
  elsif v_kind = 'staff' and v_member = 'student' then
    raise exception 'Students cannot appear on a staff register' using errcode = '23514';
  end if;
  if new.status = 'on_leave' and v_kind <> 'staff' then
    raise exception 'On Leave applies only to staff registers' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger attendance_records_check before insert or update on public.attendance_records
  for each row execute function erp_private.check_attendance_record();

create table public.attendance_correction_requests (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null,
  record_id           uuid not null references public.attendance_records(id) on delete cascade,
  requested_status    public.attendance_status not null,
  requested_check_in  timestamptz,
  requested_check_out timestamptz,
  reason              text not null check (length(btrim(reason)) between 5 and 500),
  status              public.request_status not null default 'pending',
  requested_by        uuid references auth.users(id) on delete set null,
  requested_at        timestamptz not null default now(),
  reviewed_by         uuid references auth.users(id) on delete set null,
  reviewed_at         timestamptz,
  review_note         text check (length(review_note) <= 500),
  foreign key (institution_id) references public.institutions(id) on delete cascade
);
create unique index correction_one_pending_per_record
  on public.attendance_correction_requests (record_id) where status = 'pending';
create index correction_inst_status_idx on public.attendance_correction_requests (institution_id, status);

create table public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  membership_id  uuid not null,
  leave_type     text not null check (leave_type in ('casual', 'sick', 'earned', 'unpaid', 'other')),
  start_date     date not null,
  end_date       date not null,
  half_day       boolean not null default false,
  reason         text not null check (length(btrim(reason)) between 3 and 500),
  status         public.request_status not null default 'pending',
  requested_by   uuid references auth.users(id) on delete set null,
  requested_at   timestamptz not null default now(),
  reviewed_by    uuid references auth.users(id) on delete set null,
  reviewed_at    timestamptz,
  review_note    text check (length(review_note) <= 500),
  foreign key (institution_id, membership_id) references public.institution_memberships(institution_id, id) on delete cascade,
  check (end_date >= start_date),
  check (not half_day or start_date = end_date)
);
create index leave_requests_inst_status_idx on public.leave_requests (institution_id, status);
create index leave_requests_member_idx on public.leave_requests (membership_id, start_date);

-- Audit every attendance change (old + new values, actor, reason).
create trigger audit_attendance_sessions after insert or update or delete on public.attendance_sessions
  for each row execute function erp_private.audit_row_change();
create trigger audit_attendance_records after insert or update or delete on public.attendance_records
  for each row execute function erp_private.audit_row_change();
create trigger audit_correction_requests after insert or update on public.attendance_correction_requests
  for each row execute function erp_private.audit_row_change();
create trigger audit_leave_requests after insert or update on public.leave_requests
  for each row execute function erp_private.audit_row_change();

-- >>> supabase/migrations/20261013090200_erp_rbac_seed.sql
-- =============================================================================
-- RADIX ERP — Migration 3: roles and permissions catalogue
-- =============================================================================
-- Reference data only (no personal information). Re-runnable via ON CONFLICT.

insert into public.permissions (key, module, description) values
  ('dashboard.view',            'overview',    'View the ERP dashboard'),
  ('institutions.view',         'institutions','View institutions the user is assigned to'),
  ('institutions.manage',       'institutions','Create and edit institutions, campuses and shifts'),
  ('students.view',             'people',      'View all students of an institution'),
  ('students.view_assigned',    'people',      'View students in assigned classes or batches only'),
  ('students.manage',           'people',      'Create and edit students, guardians and enrolments'),
  ('staff.view',                'people',      'View teachers, instructors and staff'),
  ('staff.manage',              'people',      'Create and edit teachers, instructors and staff'),
  ('hr.view',                   'hr',          'View HR details (department, manager, shift, qualifications)'),
  ('groups.view',               'learning',    'View classes, sections and batches'),
  ('groups.manage',             'learning',    'Create classes/batches and manage enrolments and assignments'),
  ('attendance.view',           'attendance',  'View all student attendance for an institution'),
  ('attendance.view_assigned',  'attendance',  'View student attendance for assigned groups only'),
  ('attendance.mark',           'attendance',  'Mark student attendance for any group'),
  ('attendance.mark_assigned',  'attendance',  'Mark student attendance for assigned groups only'),
  ('attendance.correct',        'attendance',  'Correct finalised student attendance (with reason)'),
  ('attendance.approve',        'attendance',  'Approve or reject attendance correction requests'),
  ('attendance.finalize',       'attendance',  'Finalise submitted student registers'),
  ('staff_attendance.view',     'attendance',  'View staff and employee attendance'),
  ('staff_attendance.mark',     'attendance',  'Mark staff and employee attendance'),
  ('staff_attendance.correct',  'attendance',  'Correct finalised staff attendance (with reason)'),
  ('staff_attendance.approve',  'attendance',  'Finalise staff registers and approve staff corrections'),
  ('leave.view',                'hr',          'View leave requests'),
  ('leave.approve',             'hr',          'Approve or reject leave requests'),
  ('self.view',                 'self',        'View own attendance and submit own leave requests'),
  ('reports.export',            'reports',     'Export reports containing personal data'),
  ('users.manage',              'admin',       'Manage user accounts and role assignments'),
  ('audit.view',                'admin',       'View audit logs'),
  -- Reserved for upcoming modules; no UI or data yet.
  ('crm.manage',                'crm',         'Manage leads, contacts and contracts'),
  ('projects.manage',           'operations',  'Manage installation projects, tasks and milestones'),
  ('inventory.manage',          'inventory',   'Manage stock, assets and movements'),
  ('procurement.manage',        'procurement', 'Manage vendors, purchase requests and orders'),
  ('finance.view',              'finance',     'View financial records'),
  ('finance.manage',            'finance',     'Manage invoices, payments and expenses'),
  ('support.manage',            'support',     'Manage support tickets and maintenance')
on conflict (key) do update set module = excluded.module, description = excluded.description;

insert into public.roles (key, name, scope, applies_to, description, sort_order) values
  ('super_admin',         'Super Admin',          'platform', null, 'Complete system administration', 1),
  ('director',            'Director',             'platform', null, 'Company-wide overview, reports and approvals', 2),
  ('operations_manager',  'Operations Manager',   'platform', null, 'Institutions, schedules, people and delivery', 3),
  ('hr_manager',          'HR Manager',           'platform', null, 'Employees, staff attendance and leave', 4),
  ('finance_manager',     'Finance Manager',      'platform', null, 'Financial records (module upcoming)', 5),
  ('procurement_manager', 'Procurement Manager',  'platform', null, 'Vendors and purchasing (module upcoming)', 6),
  ('inventory_manager',   'Inventory Manager',    'platform', null, 'Stock and assets (module upcoming)', 7),
  ('project_manager',     'Project Manager',      'platform', null, 'Projects and milestones (module upcoming)', 8),
  ('support_staff',       'Support Staff',        'platform', null, 'Service tickets and maintenance (module upcoming)', 9),
  ('school_admin',        'School Admin',         'institution', '{school}', 'Manages one school''s people, classes and attendance', 20),
  ('teacher',             'Teacher',              'institution', '{school}', 'Marks attendance for assigned classes', 21),
  ('centre_manager',      'Centre Manager',       'institution', '{learning_center}', 'Manages one learning centre''s operations', 30),
  ('instructor',          'Instructor',           'institution', '{learning_center,school}', 'Runs assigned batches or sessions', 31),
  ('front_desk',          'Reception / Front Desk','institution', '{learning_center}', 'Registrations and check-in/check-out', 32),
  ('student',             'Student',              'institution', '{school,learning_center}', 'Views own attendance', 40),
  ('employee',            'Employee (self-service)','institution', null, 'Views own attendance and requests leave', 41)
on conflict (key) do update set name = excluded.name, scope = excluded.scope,
  applies_to = excluded.applies_to, description = excluded.description, sort_order = excluded.sort_order;

-- Rebuild the mapping from the arrays below so this file stays the source of truth.
delete from public.role_permissions;

insert into public.role_permissions (role_key, permission_key)
select 'super_admin', key from public.permissions;

insert into public.role_permissions (role_key, permission_key)
select r.role_key, p.perm
from (values
  ('director', array['dashboard.view','institutions.view','students.view','staff.view','hr.view','groups.view',
                     'attendance.view','attendance.approve','staff_attendance.view','staff_attendance.approve',
                     'leave.view','leave.approve','reports.export','audit.view','finance.view','self.view']),
  ('operations_manager', array['dashboard.view','institutions.view','institutions.manage','students.view','students.manage',
                     'staff.view','staff.manage','groups.view','groups.manage','attendance.view','attendance.mark',
                     'attendance.correct','attendance.finalize','staff_attendance.view','staff_attendance.mark',
                     'leave.view','reports.export','projects.manage','support.manage','self.view']),
  ('hr_manager',     array['dashboard.view','institutions.view','staff.view','staff.manage','hr.view',
                     'staff_attendance.view','staff_attendance.mark','staff_attendance.correct','staff_attendance.approve',
                     'leave.view','leave.approve','reports.export','self.view']),
  ('finance_manager',     array['dashboard.view','institutions.view','finance.view','finance.manage','reports.export','self.view']),
  ('procurement_manager', array['dashboard.view','institutions.view','procurement.manage','self.view']),
  ('inventory_manager',   array['dashboard.view','institutions.view','inventory.manage','self.view']),
  ('project_manager',     array['dashboard.view','institutions.view','projects.manage','self.view']),
  ('support_staff',       array['dashboard.view','institutions.view','support.manage','self.view']),
  ('school_admin',   array['dashboard.view','institutions.view','students.view','students.manage','staff.view','staff.manage','hr.view',
                     'groups.view','groups.manage','attendance.view','attendance.mark','attendance.correct','attendance.approve',
                     'attendance.finalize','staff_attendance.view','staff_attendance.mark','staff_attendance.correct',
                     'staff_attendance.approve','leave.view','leave.approve','reports.export','users.manage','audit.view','self.view']),
  ('centre_manager', array['dashboard.view','institutions.view','students.view','students.manage','staff.view','staff.manage','hr.view',
                     'groups.view','groups.manage','attendance.view','attendance.mark','attendance.correct','attendance.approve',
                     'attendance.finalize','staff_attendance.view','staff_attendance.mark','staff_attendance.correct',
                     'staff_attendance.approve','leave.view','leave.approve','reports.export','users.manage','audit.view','self.view']),
  ('teacher',        array['dashboard.view','institutions.view','students.view_assigned','groups.view',
                     'attendance.view_assigned','attendance.mark_assigned','self.view']),
  ('instructor',     array['dashboard.view','institutions.view','students.view_assigned','groups.view',
                     'attendance.view_assigned','attendance.mark_assigned','self.view']),
  ('front_desk',     array['dashboard.view','institutions.view','students.view','students.manage','groups.view',
                     'attendance.view','attendance.mark','self.view']),
  ('student',        array['self.view']),
  ('employee',       array['self.view'])
) as r(role_key, perms)
cross join lateral unnest(r.perms) as p(perm);

-- >>> supabase/migrations/20261013090300_erp_rls.sql
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

-- >>> supabase/migrations/20261013090400_erp_functions.sql
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

-- >>> supabase/migrations/20261013090500_erp_legacy_bridge.sql
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

-- >>> supabase/migrations/20261013090600_erp_rate_limit.sql
-- =============================================================================
-- RADIX ERP — Migration 7: shared rate limiting
-- =============================================================================
-- Fixed-window counters stored in the database, so limits hold across every
-- server instance (serverless deployments included). Counters are keyed by the
-- signed-in user; callers cannot touch anyone else's buckets.
-- =============================================================================

create table if not exists erp_private.rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (user_id, bucket)
);
revoke all on table erp_private.rate_limits from public, anon, authenticated;

-- Records one hit for the caller and returns true while they are within the limit.
create or replace function public.erp_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := erp_private.require_user();
  v_now timestamptz := clock_timestamp();
  v_hits integer;
begin
  if p_bucket !~ '^[a-z0-9_.:-]{1,64}$' or p_limit < 1 or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit' using errcode = '22023';
  end if;
  insert into erp_private.rate_limits as r (user_id, bucket, window_start, hits)
  values (v_uid, p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
    set window_start = case when r.window_start <= v_now - make_interval(secs => p_window_seconds)
                            then v_now else r.window_start end,
        hits         = case when r.window_start <= v_now - make_interval(secs => p_window_seconds)
                            then 1 else r.hits + 1 end
  returning hits into v_hits;
  return v_hits <= p_limit;
end $$;

revoke all on function public.erp_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.erp_rate_limit(text, integer, integer) to authenticated, service_role;

-- >>> supabase/migrations/20261013090700_erp_legacy_sync.sql
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

commit;
