"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/utils/supabase/server";

// Initialize Supabase Admin strictly on the server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// School IDs double as school login names, so the public registration form only
// sees an opaque token per school. The token is an HMAC that the server can check.
function schoolToken(customId: string): string {
  const secret = process.env.SCHOOL_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createHmac("sha256", secret).update(`school:${customId}`).digest("base64url").slice(0, 22);
}

// A student may only be queued shortly after their account is created.
const REGISTRATION_WINDOW_MS = 15 * 60 * 1000;

// 1. Fetch available schools for the Registration Dropdown
export async function getAvailableSchools(): Promise<{ token: string; school_name: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("custom_id, school_name")
    .order("school_name");

  if (error) {
    console.error("Error fetching schools:", error);
    return [];
  }
  return (data || []).map((s) => ({ token: schoolToken(s.custom_id), school_name: s.school_name }));
}

// 2. Queue a newly registered student for Admin Approval
export async function queueStudentForApproval(userId: string, schoolTokenValue: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fail = (error: string) => ({ success: false, error });
    if (typeof userId !== "string" || typeof schoolTokenValue !== "string") return fail("Invalid request.");

    // The caller must be this user: either signed in as them, or (when email
    // confirmation leaves no session yet) registering an account created moments ago.
    const { data: { user: sessionUser } } = await (await createSessionClient()).auth.getUser();
    if (sessionUser && sessionUser.id !== userId) return fail("Not authorised.");

    const { data: target, error: targetErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    const user = target?.user;
    if (targetErr || !user) return fail("Account not found.");
    if (!sessionUser && Date.now() - new Date(user.created_at).getTime() > REGISTRATION_WINDOW_MS) {
      return fail("Registration expired. Please sign in to continue.");
    }
    if ((user.email ?? "").toLowerCase().endsWith("@radix.school")) return fail("This email domain is reserved for school logins.");

    // Never attach a student role to an account that already has a role.
    const { data: existing } = await supabaseAdmin.from("user_roles").select("role").eq("id", userId).maybeSingle();
    if (existing) return existing.role === "student" ? { success: true } : fail("This account already has a role.");
    const { count: erpRoles } = await supabaseAdmin
      .from("user_role_assignments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((erpRoles ?? 0) > 0) return fail("This account already has a role.");

    const { data: schools } = await supabaseAdmin.from("schools").select("custom_id");
    const given = Buffer.from(schoolTokenValue);
    const school = (schools || []).find((s) => {
      const expected = Buffer.from(schoolToken(s.custom_id));
      return expected.length === given.length && timingSafeEqual(expected, given);
    });
    if (!school) return fail("Please select a valid school.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({
        id: userId,
        role: "student",
        school_id: school.custom_id,
        is_approved: false // Explicitly enforce pending status
      });

    // A duplicate means a concurrent request already queued them.
    if (error && error.code !== "23505") throw new Error(error.message);
    return { success: true };
  } catch (err) {
    console.error("Failed to queue student:", err);
    return { success: false, error: "Failed to initialise student profile." };
  }
}
