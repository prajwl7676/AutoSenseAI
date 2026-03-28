import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from './types/user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Fetches Keycloak's public keys automatically and caches them.
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: configService.get<string>(
          'KEYCLOAK_JWKS_URI',
          'http://localhost:8080/realms/autosense/protocol/openid-connect/certs',
        ),
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: configService.get<string>(
        'KEYCLOAK_ISSUER',
        'http://localhost:8080/realms/autosense',
      ),
      algorithms: ['RS256'],
    });
  }

  /**
   * Called after signature verification.
   * The returned value is attached to request.user.
   */
  validate(payload: Record<string, unknown>): AuthUser {
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload.preferred_username as string,
      roles: (payload.realm_access as { roles: string[] })?.roles ?? [],
    };
  }
}
