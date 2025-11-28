'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';

interface ProtectedLayoutProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function ProtectedLayout({ allowedRoles, children }: ProtectedLayoutProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/login');
    }
  }, [allowedRoles, loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
          Checking session…
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-72 px-8 py-8">{children}</main>
    </div>
  );
}

