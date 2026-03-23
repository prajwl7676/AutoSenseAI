export { auth as middleware } from '@/auth';

export const config = {
  /**
   * Protect every route EXCEPT:
   *  - NextAuth's own /api/auth/* routes (Keycloak callbacks)
   *  - Next.js static assets and images
   *  - favicon
   */
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
