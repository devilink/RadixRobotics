import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  // getClaims() verifies the session JWT locally when the project uses asymmetric
  // signing keys (no round trip to Supabase Auth) and refreshes expired sessions.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? { id: claimsData.claims.sub } : null;

  // ERP: require a session here; roles and institution access are enforced by
  // the ERP data layer and database RLS, not by the legacy user_roles table.
  if (pathname === '/erp' || pathname.startsWith('/erp/')) {
    if (!user) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    return supabaseResponse;
  }

  // If no user and trying to access protected routes, bounce to login
  const isProtected = pathname.startsWith('/super-admin') || 
                      pathname.startsWith('/school-admin') || 
                      pathname.startsWith('/curriculum') ||
                      pathname === '/profile' || pathname.startsWith('/profile/') ||
                      pathname.startsWith('/kits');

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RBAC Access Control Enforcement
  if (user && isProtected) {
    // Service role to bypass RLS for role checking. Deliberately not built with the
    // request cookies: with them, the user's session token would replace the
    // service key and the query would run under RLS as the user.
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role, school_id, is_approved')
      .eq('id', user.id)
      .maybeSingle();

    // Roles come only from user_roles; nothing is inferred from the email address.
    if (!roleData) {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    const role = roleData.role;
    const school_id = roleData.school_id;
    const isApproved = roleData.is_approved ?? true; // Default true for admins who don't have this field

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

    // 3. Students use their profile (/profile) instead of the curriculum.
    if (pathname.startsWith('/curriculum') && role === 'student') {
      return NextResponse.redirect(new URL('/profile', request.url));
    }

    // 4. Profile is for students only.
    if ((pathname === '/profile' || pathname.startsWith('/profile/')) && role !== 'student') {
      if (role === 'super_admin') return NextResponse.redirect(new URL('/super-admin', request.url));
      if (role === 'school_admin' && school_id) return NextResponse.redirect(new URL(`/curriculum/${school_id}`, request.url));
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // 5. Curriculum checking (school admins and super admins, bound to school_id)
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
