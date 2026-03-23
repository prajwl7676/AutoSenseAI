export interface AuthUser {
  /** Keycloak user ID (UUID) */
  sub: string;
  email: string;
  username: string;
  /** Realm-level roles from realm_access.roles claim */
  roles: string[];
}

/** Strongly-typed role constants matching the Keycloak realm definition */
export const Role = {
  ADMIN: 'admin',
  FLEET_MANAGER: 'fleet_manager',
  MECHANIC: 'mechanic',
  VIEWER: 'viewer',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];
