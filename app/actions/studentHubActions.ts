"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getLegacyRole } from "@/lib/auth/legacy";
import { rateLimit } from "@/lib/erp/rate-limit";
import { PROJECT_BY_SLUG, projectTopicId } from "@/lib/student/projects";
import { checkSolution, labTopicId, CHALLENGE_BY_ID, MAX_SOURCE } from "@/lib/student/lab";

// Progress writes for the student profile. Server actions are public endpoints:
// each one checks the signed-in student itself and only ever writes their own rows.

type Result = { ok: true; message?: string } | { ok: false; error: string };

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireStudent() {
  const me = await getLegacyRole();
  if (!me || me.role !== "student") return null;
  return me;
}

async function save(userId: string, topicId: string, pct: number, done: boolean): Promise<Result> {
  const { error } = await service()
    .from("student_progress")
    .upsert(
      { student_auth_id: userId, topic_id: topicId, progress_percentage: pct, is_completed: done, last_watched_at: new Date().toISOString() },
      { onConflict: "student_auth_id, topic_id" },
    );
  if (error) {
    console.error("[profile] could not save progress", error.message);
    return {
      ok: false,
      error: /student_progress/.test(error.message)
        ? "Progress saving isn't set up yet. Ask your school to contact Radix."
        : "Your progress could not be saved. Please try again.",
    };
  }
  revalidatePath("/profile");
  return { ok: true };
}

/** Records how many steps of a project are done (steps are ticked in order). */
export async function saveProjectSteps(slug: string, stepsDone: number): Promise<Result> {
  const me = await requireStudent();
  if (!me) return { ok: false, error: "Sign in as a student to save progress." };
  const project = PROJECT_BY_SLUG.get(String(slug));
  if (!project) return { ok: false, error: "Unknown project." };
  const total = project.steps.length;
  if (!Number.isInteger(stepsDone) || stepsDone < 0 || stepsDone > total) return { ok: false, error: "Invalid step." };
  if (!rateLimit(`profile-save:${me.userId}`, 60, 60_000)) return { ok: false, error: "Slow down a little and try again in a minute." };
  return save(me.userId, projectTopicId(project.slug), Math.round((100 * stepsDone) / total), stepsDone === total);
}

/** Re-checks a lab solution on the server, then records the challenge as solved. */
export async function submitLabSolution(challengeId: string, source: string): Promise<Result> {
  const me = await requireStudent();
  if (!me) return { ok: false, error: "Sign in as a student to save progress." };
  if (!CHALLENGE_BY_ID.has(String(challengeId))) return { ok: false, error: "Unknown challenge." };
  if (typeof source !== "string" || source.length > MAX_SOURCE) return { ok: false, error: "Program is too long." };
  if (!rateLimit(`profile-save:${me.userId}`, 60, 60_000)) return { ok: false, error: "Slow down a little and try again in a minute." };
  const result = await checkSolution(challengeId, source);
  if (!result.pass) return { ok: false, error: result.message };
  const saved = await save(me.userId, labTopicId(challengeId), 100, true);
  return saved.ok ? { ok: true, message: result.message } : saved;
}
