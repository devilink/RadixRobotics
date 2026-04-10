"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Admin strictly on the server-side to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Fail-safe to auto-assign super_admin if the database trigger didn't catch an old account
export async function autoAssignSuperAdmin(email: string, userId: string) {
  if (email === 'princedas000555@gmail.com') {
    const { data } = await supabaseAdmin.from('user_roles').select('id').eq('id', userId).single();
    if (!data) {
      await supabaseAdmin.from('user_roles').insert({ id: userId, role: 'super_admin' });
    }
  }
}

// Bypass RLS to securely fetch the true database role of a user
export async function getUserRoleById(userId: string) {
  const { data } = await supabaseAdmin.from('user_roles').select('role, school_id, is_approved').eq('id', userId).single();
  return data;
}

// 1. Create School & School Admin
export async function createSchoolAndAdmin(schoolName: string, customId: string, adminPassword: string) {
  try {
    // Auto-generate an internal email from the school ID
    const internalEmail = `${customId.toLowerCase()}@radix.school`;

    // Insert school first
    const { error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({ custom_id: customId, school_name: schoolName });

    if (schoolError) {
      if (schoolError.code === '23505') return { success: false, message: 'Custom School ID already exists.' };
      return { success: false, message: schoolError.message };
    }

    // Create auth user with auto-generated email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      await supabaseAdmin.from('schools').delete().eq('custom_id', customId);
      return { success: false, message: authError?.message || 'Failed to create auth user.' };
    }

    // Assign Role
    await supabaseAdmin
      .from('user_roles')
      .insert({ id: authData.user.id, role: 'school_admin', school_id: customId });

    revalidatePath('/super-admin');
    return { success: true, data: { schoolId: customId }, message: 'School provisioned successfully.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 2. Update School Details
export async function updateSchool(customId: string, newName: string) {
  try {
    const { error } = await supabaseAdmin
      .from('schools')
      .update({ school_name: newName })
      .eq('custom_id', customId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/super-admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 3. Delete School (Cascades user_roles automatically per DB schema, but we must delete auth accounts explicitly)
export async function deleteSchool(customId: string) {
  try {
    // Get all users associated with this school (Students & School Admins)
    const { data: users } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('school_id', customId);

    // Delete users from Auth system (Auth deletion cascades to user_roles)
    if (users) {
      for (const u of users) {
        await supabaseAdmin.auth.admin.deleteUser(u.id);
      }
    }

    // Finally delete the school
    const { error } = await supabaseAdmin
      .from('schools')
      .delete()
      .eq('custom_id', customId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/super-admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 4. Fetch All Schools for Dashboard
export async function getAllSchools() {
  try {
    const { data, error } = await supabaseAdmin
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
