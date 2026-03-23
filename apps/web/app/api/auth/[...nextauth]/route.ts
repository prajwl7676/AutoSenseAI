import { handlers } from '@/auth';

// Expose GET and POST handlers for the NextAuth catch-all route.
// Keycloak OIDC callbacks are handled here automatically.
export const { GET, POST } = handlers;
