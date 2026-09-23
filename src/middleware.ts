import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login');
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isScannerRoute = req.nextUrl.pathname.startsWith('/scanner');

    if (isAuthPage) {
      if (isAuth) {
        if (token.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/scanner', req.url));
      }
      return null;
    }

    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/scanner', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public access to login page
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true;
        }
        // Protect /admin and /scanner
        if (
          req.nextUrl.pathname.startsWith('/admin') ||
          req.nextUrl.pathname.startsWith('/scanner')
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/scanner/:path*', '/login'],
};
