import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// Only routes that need a session run the proxy. Public marketing pages, videos
// and other static files skip it, so they never wait on an auth check; the
// browser Supabase client keeps those visitors' sessions refreshed.
export const config = {
  matcher: [
    '/erp/:path*',
    '/super-admin/:path*',
    '/school-admin/:path*',
    '/curriculum/:path*',
    '/kits/:path*',
    '/student/:path*',
    '/login',
    '/update-password',
  ],
}
