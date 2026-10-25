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
