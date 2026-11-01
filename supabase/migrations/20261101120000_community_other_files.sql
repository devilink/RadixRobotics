-- Radix Community: optional extra files (certificates, reports, slides, sheets, ZIPs)
-- alongside the resume and work images. Up to 5 per application.

alter table public.community_applications
  add column if not exists other_paths text[] not null default '{}',
  add column if not exists other_names text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_applications_other_files_check') then
    alter table public.community_applications
      add constraint community_applications_other_files_check
      check (cardinality(other_paths) <= 5 and cardinality(other_names) = cardinality(other_paths));
  end if;
end $$;

-- Let the private bucket accept the extra document types (still 10 MB per file).
do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    return;
  end if;
  update storage.buckets
  set allowed_mime_types = array[
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif'
  ]
  where id = 'community-applications';
end $$;
