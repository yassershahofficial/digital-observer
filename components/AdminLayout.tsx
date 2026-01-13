'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.role || 'admin';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">{session.user?.email}</span>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                {userRole}
              </span>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-50 border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <TabLink href="/admin/content" isActive={pathname === '/admin/content'}>
              Content
            </TabLink>
            <TabLink href="/admin/projects" isActive={pathname === '/admin/projects'}>
              Projects
            </TabLink>
            <TabLink href="/admin/analytics" isActive={pathname === '/admin/analytics'}>
              Analytics
            </TabLink>
            {userRole === 'superadmin' && (
              <TabLink href="/admin/admin-list" isActive={pathname === '/admin/admin-list'}>
                Admin List
              </TabLink>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

interface TabLinkProps {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}

function TabLink({ href, children, isActive }: TabLinkProps) {
  return (
    <Link
      href={href}
      className={`
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
        ${
          isActive
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {children}
    </Link>
  );
}
