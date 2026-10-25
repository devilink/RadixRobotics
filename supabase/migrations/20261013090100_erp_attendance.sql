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
