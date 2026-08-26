"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Admin strictly on the server-side to bypass RLS for super-admin functionality
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// We need to define or import the Project types so the server action knows the shape.
// Using any/Record for simplicity since this runs entirely server side, but defining an interface is better.
export interface Submodule {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  submodules: Submodule[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  dateAdded: string;
  modules: Module[];
}

// 1. Fetch All Projects
export async function getAllProjects() {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*');

    if (error) throw new Error(error.message);
    
    // Map DB column names back to frontend object shape if needed, 
    // though our frontend expects: id, name, description, status, dateAdded, modules.
    const formattedData = data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      dateAdded: p.date_added,
      modules: p.modules
    }));

    return { success: true, data: formattedData as Project[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 2. Create Project
export async function createProject(project: Project) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .insert({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        date_added: project.dateAdded,
        modules: project.modules
      });

    if (error) throw new Error(error.message);

    revalidatePath('/super-admin/projects');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 3. Update Project (Full update for edits or module completion toggles)
export async function updateProject(project: Project) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        status: project.status,
        date_added: project.dateAdded,
        modules: project.modules
      })
      .eq('id', project.id);

    if (error) throw new Error(error.message);

    revalidatePath('/super-admin/projects');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 4. Update Project Status (Optimized for quick status shifts)
export async function updateProjectStatusAction(projectId: string, newStatus: string) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) throw new Error(error.message);

    revalidatePath('/super-admin/projects');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 5. Delete Project
export async function deleteProjectAction(projectId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error(error.message);

    revalidatePath('/super-admin/projects');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
