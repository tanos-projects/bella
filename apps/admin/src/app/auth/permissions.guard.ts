import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Reads the Auth0 RBAC `permissions` claim off the access token (mirrors the
 * API's PermissionsGuard, which is what actually enforces this server-side —
 * see issue #49) and requires every permission listed in the route's
 * `data.permissions` to be present. Must run after AuthGuard, which is what
 * makes a valid access token available in the first place.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const required: string[] = route.data['permissions'] ?? [];
    if (required.length === 0) {
      return of(true);
    }

    return this.auth.getAccessTokenSilently().pipe(
      map((token) => (token ? decodeAccessTokenPermissions(token) : [])),
      catchError(() => of<string[]>([])),
      map((granted) =>
        required.every((permission) => granted.includes(permission))
          ? true
          : this.router.createUrlTree(['/access-denied'])
      )
    );
  }
}

function decodeAccessTokenPermissions(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json).permissions ?? [];
  } catch {
    return [];
  }
}
