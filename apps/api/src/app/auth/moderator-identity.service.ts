import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, map, Observable, of } from 'rxjs';

/**
 * Resolves a display identity (email, falling back to name) for the
 * `manage:publications` audit trail (AdEntity.moderatedBy).
 *
 * The access token for the `https://base-api/` audience does not carry
 * email/name claims (no Auth0 Action adds them as a custom namespaced
 * claim on this tenant) - only `sub`/`permissions`/`scope`. So this calls
 * Auth0's /userinfo endpoint with the caller's own bearer token instead.
 * That's one extra synchronous HTTP round trip to an external IdP per
 * moderation action; acceptable here because moderation is not a hot
 * path (YAGNI - no caching). The clean long-term fix is an Auth0 Action
 * that adds email as a custom claim on the access token itself, removing
 * the need for this call entirely - out of reach here (no dashboard
 * access), left as a note for whoever has it.
 */
@Injectable()
export class ModeratorIdentityService {
  private readonly logger = new Logger(ModeratorIdentityService.name);

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService
  ) {}

  resolve(bearerToken: string | undefined): Observable<string | undefined> {
    if (!bearerToken) {
      return of(undefined);
    }
    const issuerUrl = this.configService.get<string>('AUTH_ISSUER_URL');
    return this.http
      .get<{ email?: string; name?: string }>(`${issuerUrl}userinfo`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      })
      .pipe(
        map((response) => response.data.email ?? response.data.name),
        catchError((error) => {
          // Never let an IdP hiccup (timeout, rate limit, expired token
          // between validation and this call, ...) block the moderation
          // action itself - just leave moderatedBy unresolved this time.
          this.logger.warn(
            `Failed to resolve moderator identity from /userinfo: ${error?.message ?? error}`
          );
          return of(undefined);
        })
      );
  }
}
