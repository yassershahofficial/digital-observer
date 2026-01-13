'use client';

import { SessionProvider } from 'next-auth/react';
import AdminLayout from '@/components/AdminLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AdminLayout>{children}</AdminLayout>
      </SessionProvider>
    </ErrorBoundary>
  );
}
