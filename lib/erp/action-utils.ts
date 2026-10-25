import "server-only";
import type { z } from "zod";
import { ForbiddenError } from "./context";
import { friendlyDbError } from "./errors";
import { fieldErrors } from "./validation";
import type { ActionResult } from "./types";

/** Validate input with a zod schema, returning field errors as an ActionResult. */
export function parse<S extends z.ZodTypeAny>(schema: S, input: unknown):
  | { ok: true; data: z.infer<S> }
  | { ok: false; result: ActionResult<never> } {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, result: { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(r.error) } };
}

/** Convert thrown errors into safe user-facing results. Never leaks internals. */
export function failure(err: unknown): ActionResult<never> {
  if (err instanceof ForbiddenError) return { ok: false, error: err.message };
  if (err && typeof err === "object" && "code" in err) return { ok: false, error: friendlyDbError(err as never) };
  // Next.js redirect()/notFound() throw control-flow errors; let them propagate.
  if (err && typeof err === "object" && "digest" in err) throw err;
  console.error("[erp] unexpected action error", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

/** Throw a Supabase/PostgREST error so `failure` can map it. */
export function check<T>(res: { data: T; error: { code?: string; message: string } | null }): T {
  if (res.error) throw res.error;
  return res.data;
}
