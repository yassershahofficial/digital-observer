import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { createSuperadminIfNotExists } from '@/lib/createSuperadmin';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT sessions (no database adapter needed)
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user?.email) {
        // Ensure superadmin exists on first sign-in attempt
        await createSuperadminIfNotExists();

        // Check if user is in admin list
        await connectDB();
        const admin = await Admin.findOne({ 
          email: user.email.toLowerCase().trim() 
        });

        if (!admin) {
          // User is not authorized
          return false;
        }

        // User is authorized
        return true;
      }
      return false;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user?.email) {
        await connectDB();
        const admin = await Admin.findOne({ 
          email: user.email.toLowerCase().trim() 
        });

        if (admin) {
          token.email = admin.email;
          token.role = admin.role;
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
