'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Thin client wrapper around NextAuth's SessionProvider.
 * Wrap the root layout's children with this so any Client Component
 * can call `useSession()` to access the current user and token.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
