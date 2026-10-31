import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export type SessionUser = { id: string; email: string };

/**
 * The signed-in user for this request, verified from the session JWT.
 *
 * getClaims() checks the token's signature locally (no network call) when the
 * project uses asymmetric JWT signing keys, and falls back to asking Supabase
 * Auth otherwise. `cache` makes it run at most once per request, however many
 * layouts, pages and helpers ask.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});
