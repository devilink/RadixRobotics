"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export type StudentProgress = {
  id?: string;
  student_auth_id: string;
  topic_id: string;
  progress_percentage: number;
  is_completed: boolean;
  last_watched_at?: string;
};

// 1. Fetch a student's progress to paint the UI
export async function getStudentProgress(studentId: string): Promise<StudentProgress[]> {
  const { data, error } = await supabaseAdmin
    .from("student_progress")
    .select("*")
    .eq("student_auth_id", studentId);

  if (error) {
    console.error("Error fetching progress:", error);
    return [];
  }
  return data || [];
}

// 2. Upsert progress from the video player
export async function updateStudentProgress(studentId: string, topicId: string, percentage: number) {
  try {
    // Determine completion threshold
    const isCompleted = percentage >= 90;

    // Upsert relies on a unique constraint: (student_auth_id, topic_id)
    const { error } = await supabaseAdmin
      .from("student_progress")
      .upsert(
        {
          student_auth_id: studentId,
          topic_id: topicId,
          progress_percentage: percentage,
          is_completed: isCompleted,
          last_watched_at: new Date().toISOString()
        },
        { onConflict: 'student_auth_id, topic_id' }
      );

    if (error) throw new Error(error.message);

    return { success: true, isCompleted };
  } catch (err: any) {
    console.error("Failed to update progress:", err);
    return { success: false, error: err.message };
  }
}
