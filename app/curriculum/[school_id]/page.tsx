import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import CurriculumPage from "@/app/components/CurriculumPage";

// Initialize the Supabase admin client to bypass RLS when fetching the school name
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface PageProps {
  params: Promise<{
    school_id: string;
  }>;
}

export default async function SchoolCurriculumPage({ params }: PageProps) {
  // In Next.js 15+, params is a Promise that must be awaited
  const { school_id } = await params;

  // 1. Query the Supabase `schools` table
  const { data: school, error } = await supabaseAdmin
    .from("schools")
    .select("school_name")
    .eq("custom_id", school_id)
    .maybeSingle();

  console.log("DEBUG Curriculum Page - school_id:", school_id);
  console.log("DEBUG Curriculum Page - Fetch Result:", { school, error });

  // 2. Handle errors or missing items gracefully
  if (error || !school) {
    console.warn("School ID not found in database. Loading standard curriculum interface...");
    // fallback temporarily to school_id to see if the page renders instead of 404
    return (
      <CurriculumPage 
        schoolName={school_id + " (Fallback)"} 
        userRole={"school_admin"} 
        schoolId={school_id}
      />
    );
  }

  // 3. Retrieve proper Auth state
  const { createClient: createServerClient } = await import('@/utils/supabase/server');
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole = "school_admin"; // fallback
  let userId = undefined;

  if (user) {
    userId = user.id;
    // Check if super admin
    if (user.email === 'princedas000555@gmail.com') {
      userRole = 'super_admin';
    } 
    // Otherwise check database role
    else {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (roleData) {
        userRole = roleData.role;
      }
    }
  }

  return (
    <CurriculumPage 
      schoolName={school.school_name} 
      userRole={userRole} 
      schoolId={school_id}
      userId={userId}
    />
  );
}
