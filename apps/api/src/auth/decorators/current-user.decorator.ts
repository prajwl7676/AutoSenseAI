import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/user.types';
import { Request } from 'express';

/**
 * Injects the authenticated user into a controller method parameter.
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
