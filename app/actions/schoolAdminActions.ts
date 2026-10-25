"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLegacySchoolAccess } from "@/lib/auth/legacy";
import { rateLimit } from "@/lib/erp/rate-limit";
import { createClient as createSessionClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type StudentData = {
  id: string;
  email: string;
  name: string | null;
  is_approved: boolean;
};

/** Every auth user's email and name. listUsers is paginated (50 per page by default). */
async function authUserDirectory() {
  const map = new Map<string, { email: string; name: string | null }>();
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) {
      const name = typeof u.user_metadata?.full_name === "string" ? u.user_metadata.full_name : null;
      map.set(u.id, { email: u.email ?? "", name });
    }
    if (data.users.length < 1000) return map;
  }
}

export async function getStudentsBySchoolId(schoolId: string): Promise<StudentData[]> {
  try {
    await requireLegacySchoolAccess(schoolId);
  } catch {
    return [];
  }
  // Fetch from user_roles
  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("id, is_approved")
    .eq("school_id", schoolId)
    .eq("role", "student");

  if (rolesError) {
    console.error("Failed to fetch student roles:", rolesError);
    return [];
  }

  if (!rolesData || rolesData.length === 0) return [];

  // Match IDs with emails and names from auth.users via admin SDK
  let userMap: Awaited<ReturnType<typeof authUserDirectory>>;
  try {
    userMap = await authUserDirectory();
  } catch (authError) {
    console.error("Failed to fetch auth users:", authError);
    return [];
  }

  // Combine
  const students = rolesData.map((roleRecord) => ({
    id: roleRecord.id,
    email: userMap.get(roleRecord.id)?.email || "Unknown Email",
    name: userMap.get(roleRecord.id)?.name ?? null,
    is_approved: roleRecord.is_approved
  }));

  return students;
}

export async function toggleStudentApproval(userId: string, isApproved: boolean) {
  try {
    // Only the student's own school admin (or a super admin) may change approval.
    const { data: target } = await supabaseAdmin
      .from("user_roles")
      .select("role, school_id")
      .eq("id", userId)
      .maybeSingle();
    if (!target || target.role !== "student" || !target.school_id) {
      return { success: false, message: "Student not found" };
    }
    await requireLegacySchoolAccess(target.school_id);

    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ is_approved: isApproved })
      .eq("id", userId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/school-admin/[school_id]', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Unknown error occurred" };
  }
}

const newStudentSchema = z.object({
  name: z.string().trim().min(1, "Enter the student's name").max(150),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(200)
    .refine((e) => !e.endsWith("@radix.school"), "This email domain is reserved for school logins"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .regex(/[A-Za-z]/, "Include a letter in the password")
    .regex(/[0-9]/, "Include a number in the password"),
  studentCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9/_-]{0,39}$/, "Roll / admission number: letters, numbers, / _ - only")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type NewStudentInput = z.input<typeof newStudentSchema>;

/**
 * Creates an approved student login for a school or learning center. Only that
 * tenant's admin (or a super admin) may call it. When the ERP is set up, the
 * student is also added to the institution's ERP records, as the signed-in
 * admin so the ERP's own permission checks apply.
 */
export async function createStudentAccount(
  schoolId: string,
  input: NewStudentInput
): Promise<{ success: boolean; message: string; erpNote?: string; student?: StudentData }> {
  try {
    const me = await requireLegacySchoolAccess(schoolId);
    const parsed = newStudentSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid details" };
    const d = parsed.data;
    if (!rateLimit(`add-student:${me.userId}`, 30, 60_000)) {
      return { success: false, message: "Too many students added in a short time. Please wait a minute." };
    }

    const { data: school } = await supabaseAdmin.from("schools").select("custom_id").eq("custom_id", schoolId).maybeSingle();
    if (!school) return { success: false, message: "School or center not found." };

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: d.email,
      password: d.password,
      email_confirm: true,
      user_metadata: { full_name: d.name },
    });
    if (authErr || !created.user) {
      const exists = /already|registered|exists/i.test(authErr?.message ?? "");
      return { success: false, message: exists ? "An account with this email already exists." : "The account could not be created." };
    }
    const userId = created.user.id;

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ id: userId, role: "student", school_id: schoolId, is_approved: true });
    if (roleErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId); // never leave a login without its role
      return { success: false, message: "The account could not be created." };
    }

    const erpNote = await addStudentToErp(schoolId, userId, d.name, d.studentCode);
    revalidatePath(`/school-admin/${schoolId}`);
    return {
      success: true,
      message: `Student account created for ${d.email}. Share the password with them securely.`,
      erpNote,
      student: { id: userId, email: d.email, name: d.name, is_approved: true },
    };
  } catch (err) {
    console.error("Failed to add student:", err);
    return { success: false, message: "Not authorised or the account could not be created." };
  }
}

/** Best effort: ERP person record + link to the login. Returns a note when it could not be done. */
async function addStudentToErp(schoolId: string, userId: string, fullName: string, code?: string) {
  const { data: inst } = await supabaseAdmin
    .from("institutions")
    .select("id")
    .eq("legacy_school_id", schoolId)
    .maybeSingle();
  if (!inst) return undefined; // ERP not set up for this school yet; nothing to do

  const [first, ...rest] = fullName.split(/\s+/);
  const memberCode = code ?? `STU-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const supabase = await createSessionClient(); // the admin's own session: ERP permissions apply
  const member = await supabase.rpc("erp_create_member", {
    p_institution: inst.id,
    p_member_type: "student",
    p_first_name: first,
    p_last_name: rest.join(" "),
    p_member_code: memberCode,
  });
  if (member.error) {
    return member.error.code === "23505"
      ? `The roll number ${memberCode} is already used in the ERP, so the student was not added there.`
      : "The login was created, but the student could not be added to the ERP.";
  }
  const linked = await supabase.rpc("erp_link_user_person", { p_user: userId, p_membership: member.data });
  return linked.error ? "The student was added to the ERP but not linked to their login." : undefined;
}
