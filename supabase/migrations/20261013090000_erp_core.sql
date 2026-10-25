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
