import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If no user and trying to access protected routes, bounce to login
  const isProtected = pathname.startsWith('/super-admin') || 
                      pathname.startsWith('/school-admin') || 
                      pathname.startsWith('/curriculum');

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RBAC Access Control Enforcement
  if (user && isProtected) {
    // Use service role to bypass RLS for role checking
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    );

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role, school_id, is_approved')
      .eq('id', user.id)
      .single();

    // Super Admin email bypass
    const isSuperAdminEmail = user.email === 'princedas000555@gmail.com';

    // School Admin email bypass — detect internal @radix.school emails
    const isSchoolEmail = user.email?.endsWith('@radix.school') || false;
    const derivedSchoolId = isSchoolEmail ? user.email!.replace('@radix.school', '').toUpperCase() : null;

    // If no role found and not a recognized internal account, block
    if (!roleData && !isSuperAdminEmail && !isSchoolEmail) {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    const role = roleData?.role || (isSuperAdminEmail ? 'super_admin' : isSchoolEmail ? 'school_admin' : null);
    const school_id = roleData?.school_id || derivedSchoolId;
    const isApproved = roleData?.is_approved ?? true; // Default true for admins who don't have this field

    // Block unapproved students from all protected routes
    if (role === 'student' && !isApproved) {
      return NextResponse.redirect(new URL('/login?error=pending', request.url));
    }

    // 1. Super Admin checking
    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // 2. School Admin checking
    if (pathname.startsWith('/school-admin')) {
      if (role === 'student') return NextResponse.redirect(new URL('/403', request.url));
      
      // Enforce tenant boundary unless super_admin
      const routeSchoolId = pathname.split('/')[2];
      if (role === 'school_admin' && routeSchoolId !== school_id) {
        return NextResponse.redirect(new URL(`/school-admin/${school_id}`, request.url));
      }
    }

    // 3. Curriculum checking (accessible by all 3, but bound to school_id)
    if (pathname.startsWith('/curriculum')) {
      const routeSchoolId = pathname.split('/')[2];
      // Only super_admin can freely browse other schools' curriculums
      if (role !== 'super_admin' && routeSchoolId !== school_id) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  return supabaseResponse;
}
