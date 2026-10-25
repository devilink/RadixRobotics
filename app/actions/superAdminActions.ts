"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getLegacyRole, requireLegacySuperAdmin, superAdminEmail } from '@/lib/auth/legacy';
import { createClient as createSessionClient } from '@/utils/supabase/server';

// Initialize Supabase Admin strictly on the server-side to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Bootstraps the owner account (SUPER_ADMIN_EMAIL) as super admin in the portal and the ERP.
// The arguments are kept for backwards compatibility but ignored: identity always
// comes from the verified session, never from the caller.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function autoAssignSuperAdmin(_email?: string, _userId?: string) {
  const owner = superAdminEmail();
  if (!owner) return;
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  // A confirmed email proves the caller owns that mailbox, so nobody can claim the
  // owner role by signing up with the owner's address first.
  if (!user || user.email?.toLowerCase() !== owner || !user.email_confirmed_at) return;

  await supabaseAdmin.from('user_roles').upsert({ id: user.id, role: 'super_admin', school_id: null });

  // ERP role (ignored if the ERP migrations are not applied yet).
  const { count } = await supabaseAdmin
    .from('user_role_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role_key', 'super_admin');
  if (count === 0) {
    await supabaseAdmin.from('user_role_assignments').insert({ user_id: user.id, role_key: 'super_admin' });
  }
}

// Bypass RLS to fetch the caller's own role. Only the signed-in user's role is returned.
export async function getUserRoleById(userId: string) {
  const me = await getLegacyRole();
  if (!me || me.userId !== userId) return null;
  const { data } = await supabaseAdmin.from('user_roles').select('role, school_id, is_approved').eq('id', userId).maybeSingle();
  return data;
}

// 1. Create School & School Admin
export async function createSchoolAndAdmin(
  schoolName: string,
  customId: string,
  adminPassword: string,
  category: 'school' | 'learning_center' = 'school'
) {
  try {
    await requireLegacySuperAdmin();
    if (category !== 'school' && category !== 'learning_center') {
      return { success: false, message: 'Invalid category.' };
    }
    // Auto-generate an internal email from the school ID
    const internalEmail = `${customId.toLowerCase()}@radix.school`;

    // Insert school first
    // `category` exists once the ERP sync migration is applied; schools work without it.
    const { error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert(category === 'school' ? { custom_id: customId, school_name: schoolName } : { custom_id: customId, school_name: schoolName, category });

    if (schoolError) {
      if (schoolError.code === '23505') return { success: false, message: 'This ID already exists.' };
      if (category === 'learning_center' && /category/i.test(schoolError.message)) {
        return { success: false, message: 'Apply the ERP database migrations before adding learning centers.' };
      }
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
    await requireLegacySuperAdmin();
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
    await requireLegacySuperAdmin();
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
    await requireLegacySuperAdmin();
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
