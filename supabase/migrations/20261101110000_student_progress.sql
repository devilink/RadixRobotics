-- Student learning progress: curriculum lessons, hands-on projects and virtual-lab
-- challenges. The app reads and writes it only from server actions with the service
-- role after checking the signed-in student, so RLS allows students to read their
-- own rows and nothing else.
--
-- topic_id formats:
--   cls-{class}-p{part}-t{topic}  curriculum lesson
--   project:{slug}                hands-on project (progress_percentage = steps done %)
--   lab:{challenge}               virtual-lab challenge (100 when solved)

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_auth_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null check (length(topic_id) between 1 and 120),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  is_completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_auth_id, topic_id)
);

create index if not exists student_progress_recent_idx
  on public.student_progress (student_auth_id, last_watched_at desc);

alter table public.student_progress enable row level security;

drop policy if exists student_progress_read_own on public.student_progress;
create policy student_progress_read_own on public.student_progress
  for select to authenticated
  using (student_auth_id = (select auth.uid()));

revoke insert, update, delete on public.student_progress from anon, authenticated;
grant select on public.student_progress to authenticated;
