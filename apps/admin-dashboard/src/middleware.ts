import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard/* routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('yp_admin_access');
    if (!token?.value) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
