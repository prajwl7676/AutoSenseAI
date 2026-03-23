import { SetMetadata } from '@nestjs/common';
import { RoleValue } from '../types/user.types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more Keycloak realm roles.
 *
 * @example
 * @Roles(Role.ADMIN, Role.FLEET_MANAGER)
 * @Get('vehicles')
 * findAll() {}
 */
export const Roles = (...roles: RoleValue[]) => SetMetadata(ROLES_KEY, roles);
