import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const role = token?.role;

    if (pathname.startsWith('/portal') || pathname.startsWith('/tenant')) {
      console.log('🛑 Middleware Debug:', {
        path: pathname,
        role: role,
        tokenExists: !!token,
        isTenant: role === 'TENANT',
      });
    }

    // Skip middleware for API routes - they handle their own authorization
    if (pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    // Three-way routing based on role
    // SUPER_ADMIN: /admin/*
    // CUSTOMER: /dashboard/*
    // TENANT: /tenant/*

    // Super Admin trying to access non-admin routes
    if (role === 'SUPER_ADMIN' && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/users', req.url));
    }

    // Customer trying to access admin or tenant routes
    if (role === 'CUSTOMER') {
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      if (
        (pathname.startsWith('/tenant') && !pathname.startsWith('/tenants')) ||
        pathname.startsWith('/portal')
      ) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Tenant trying to access admin or customer routes
    if (role === 'TENANT') {
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/portal/dashboard', req.url));
      }
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
        return NextResponse.redirect(new URL('/portal/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        const role = token?.role;

        // Allow access to public pages without token
        if (
          pathname === '/' ||
          pathname.startsWith('/p/') ||
          pathname.startsWith('/pitch') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/listings') ||
          pathname.startsWith('/docs') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/portal/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/forgot-password') ||
          pathname.startsWith('/verify-email') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/public') ||
          pathname.startsWith('/mockups')
        ) {
          return true;
        }

        // Admin routes require SUPER_ADMIN role
        if (pathname.startsWith('/admin')) {
          return !!token && role === 'SUPER_ADMIN';
        }

        // Dashboard routes require CUSTOMER role (check this BEFORE tenant routes to avoid /tenants matching /tenant)
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/properties') ||
          pathname.startsWith('/bookings') ||
          pathname.startsWith('/payments') ||
          pathname.startsWith('/maintenance') ||
          pathname.startsWith('/documents') ||
          pathname.startsWith('/messages') ||
          pathname.startsWith('/reports') ||
          pathname.startsWith('/settings') ||
          pathname.startsWith('/tenants')
        ) {
          return !!token && role === 'CUSTOMER';
        }

        // Tenant routes require TENANT role (except /portal/login which is public)
        if (
          (pathname.startsWith('/tenant') || pathname.startsWith('/portal')) &&
          pathname !== '/portal/login'
        ) {
          return !!token && role === 'TENANT';
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
     * - public files (logos, images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon|android-chrome|apple-touch-icon|site.webmanifest|logos|mockups|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.ico).*)',
  ],
};
