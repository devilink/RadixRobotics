import type { SupabaseClient } from "@supabase/supabase-js";

// Rate limiting for sensitive endpoints (saves, exports, account creation).
// `sharedRateLimit` counts in the database (public.erp_rate_limit), so limits hold
// across all server instances. If that call fails (e.g. the migration is not
// applied yet), it falls back to the per-instance in-memory limiter below.

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window, in-memory limiter. Per server instance only. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Database-backed limiter keyed by the signed-in user of `supabase`. */
export async function sharedRateLimit(
  supabase: SupabaseClient,
  userId: string,
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("erp_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
  });
  if (error || typeof data !== "boolean") return rateLimit(`${bucket}:${userId}`, limit, windowMs);
  return data;
}
