"use server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly on the server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Fetch available schools for the Registration Dropdown
export async function getAvailableSchools() {
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("custom_id, school_name")
    .order("school_name");
    
  if (error) {
    console.error("Error fetching schools:", error);
    return [];
  }
  return data || [];
}

// 2. Queue a newly registered student for Admin Approval
export async function queueStudentForApproval(userId: string, schoolId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({
        id: userId,
        role: "student",
        school_id: schoolId,
        is_approved: false // Explicitly enforce pending status
      });

    if (error) {
       // if it already exists, don't crash
       if (error.code !== "23505") { 
         throw new Error(error.message);
       }
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to queue student:", err);
    return { success: false, error: err.message };
  }
}
