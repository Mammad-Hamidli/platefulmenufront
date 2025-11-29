import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const DASHBOARD_MAP: Record<string, string> = {
  ROLE_SUPERADMIN: '/dashboard/superadmin',
  ROLE_ADMIN: '/dashboard/admin',
};

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/session', '/table', '/kitchen'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isPublicRoute = PUBLIC_PATHS.some((route) => pathname.startsWith(route));

  if (!token) {
    if (pathname.startsWith('/dashboard') || pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '/login') {
    const role = request.cookies.get('role')?.value;
    const destination = role ? DASHBOARD_MAP[role] ?? '/dashboard/admin' : '/dashboard/admin';
    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
  // Note: /kitchen/* routes are intentionally excluded from middleware
  // They use KDS token authentication only, not JWT
};

