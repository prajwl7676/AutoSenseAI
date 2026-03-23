import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    /** Raw Keycloak access token — forward this as `Authorization: Bearer <token>` to the API */
    accessToken?: string;
    user: {
      /** Keycloak realm roles — use these to conditionally render UI */
      roles?: string[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    roles?: string[];
  }
}
