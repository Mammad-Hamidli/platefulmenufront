'use client';

// Disable SSR completely - this route must be client-only
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = 'auto';

if (typeof window === 'undefined') {
  console.log('[KDS] ❌ SERVER RENDER BLOCKED');
}

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') return null;

  console.log('[Kitchen] Client-side render OK');
  console.log('[Kitchen] Window check passed');

  return <>{children}</>;
}

