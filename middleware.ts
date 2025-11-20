import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Redirect tenants trying to access dashboard to portal
    if (token?.accountType === 'TENANT' && !pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/portal/dashboard', req.url));
    }

    // Redirect property managers trying to access portal to dashboard
    if (
      token?.accountType !== 'TENANT' &&
      pathname.startsWith('/portal') &&
      pathname !== '/portal/login'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public pages without token
        if (
          pathname === '/' ||
          pathname.startsWith('/p/') ||
          pathname.startsWith('/pitch') ||
          pathname.startsWith('/docs') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/forgot-password') ||
          pathname.startsWith('/verify-email') ||
          pathname.startsWith('/portal/login') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/public')
        ) {
          return true;
        }

        // Portal routes require tenant account
        if (pathname.startsWith('/portal')) {
          return !!token && token.accountType === 'TENANT';
        }

        // Dashboard routes require non-tenant account (property managers)
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/properties') ||
          pathname.startsWith('/tenants') ||
          pathname.startsWith('/bookings') ||
          pathname.startsWith('/payments') ||
          pathname.startsWith('/maintenance') ||
          pathname.startsWith('/documents') ||
          pathname.startsWith('/messages') ||
          pathname.startsWith('/reports') ||
          pathname.startsWith('/settings')
        ) {
          return !!token && token.accountType !== 'TENANT';
        }

        // Require token for all other protected routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - they handle their own auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
