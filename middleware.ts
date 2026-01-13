import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Middleware logic can go here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token (is authenticated)
        // The signIn callback already checks if user is in admin list
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

// Protect all routes under /admin
export const config = {
  matcher: ['/admin/:path*'],
};
