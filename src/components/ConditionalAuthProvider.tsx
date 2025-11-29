'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/providers/AuthProvider';

export function ConditionalAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Skip AuthProvider for kitchen routes - they use KDS token only
  if (pathname?.startsWith('/kitchen/')) {
    return <>{children}</>;
  }

  // For all other routes, wrap with AuthProvider
  return <AuthProvider>{children}</AuthProvider>;
}

