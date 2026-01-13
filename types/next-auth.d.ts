import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      role?: 'admin' | 'superadmin';
      id?: string;
    };
  }

  interface User {
    role?: 'admin' | 'superadmin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email?: string;
    role?: 'admin' | 'superadmin';
    id?: string;
  }
}
