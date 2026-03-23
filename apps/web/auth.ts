import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],

  callbacks: {
    /**
     * Persist the Keycloak access_token and roles into the NextAuth JWT.
     * This runs on every sign-in and on every session refresh.
     */
    async jwt({ token, account }) {
      // Initial sign-in — account is populated with Keycloak tokens.
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Decode the access token to extract Keycloak realm roles.
        try {
          const payload = JSON.parse(
            Buffer.from(account.access_token.split('.')[1], 'base64').toString(),
          );
          token.roles = (payload?.realm_access?.roles as string[]) ?? [];
        } catch {
          token.roles = [];
        }
      }
      return token;
    },

    /**
     * Expose access token and roles on the client-side session object.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.roles = (token.roles as string[]) ?? [];
      return session;
    },
  },
});
