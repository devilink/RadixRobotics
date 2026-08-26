"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type StudentData = {
  id: string;
  email: string;
  is_approved: boolean;
};

export async function getStudentsBySchoolId(schoolId: string): Promise<StudentData[]> {
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

  // Match IDs with emails from auth.users via admin SDK
  // Efficient lookup map for larger lists
  const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  const usersList = data?.users || [];

  if (authError) {
    console.error("Failed to fetch auth users:", authError);
    return [];
  }

  const userMap = new Map(usersList.map((u) => [u.id, u.email]));

  // Combine
  const students = rolesData.map((roleRecord) => ({
    id: roleRecord.id,
    email: userMap.get(roleRecord.id) || "Unknown Email",
    is_approved: roleRecord.is_approved
  }));

  return students;
}

export async function toggleStudentApproval(userId: string, isApproved: boolean) {
  try {
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
