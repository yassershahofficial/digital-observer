import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

/**
 * Check if user is an admin (admin or superadmin)
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user && (user as any).role;
}

/**
 * Check if user is a superadmin
 */
export async function isSuperadmin() {
  const user = await getCurrentUser();
  return user && (user as any).role === 'superadmin';
}
