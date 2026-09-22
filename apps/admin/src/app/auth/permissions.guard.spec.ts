import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { of, throwError } from 'rxjs';

import { PermissionsGuard } from './permissions.guard';

function tokenWithPermissions(permissions: string[]): string {
  const header = btoa(JSON.stringify({ alg: 'RS256' }));
  const payload = btoa(JSON.stringify({ permissions }));
  return `${header}.${payload}.signature`;
}

describe('PermissionsGuard', () => {
  let auth: { getAccessTokenSilently: jest.Mock };
  let router: { createUrlTree: jest.Mock };
  let guard: PermissionsGuard;
  let deniedTree: UrlTree;

  beforeEach(() => {
    auth = { getAccessTokenSilently: jest.fn() };
    deniedTree = {} as UrlTree;
    router = { createUrlTree: jest.fn().mockReturnValue(deniedTree) };

    TestBed.configureTestingModule({
      providers: [
        PermissionsGuard,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(PermissionsGuard);
  });

  function route(permissions?: string[]): ActivatedRouteSnapshot {
    return { data: { permissions } } as unknown as ActivatedRouteSnapshot;
  }

  it('allows navigation when no permission is required', (done) => {
    guard.canActivate(route()).subscribe((result) => {
      expect(result).toBe(true);
      expect(auth.getAccessTokenSilently).not.toHaveBeenCalled();
      done();
    });
  });

  it('allows navigation when the access token grants the required permission', (done) => {
    auth.getAccessTokenSilently.mockReturnValue(
      of(tokenWithPermissions(['manage:publications']))
    );

    guard.canActivate(route(['manage:publications'])).subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('redirects to /access-denied when the permission is missing', (done) => {
    auth.getAccessTokenSilently.mockReturnValue(of(tokenWithPermissions(['other:permission'])));

    guard.canActivate(route(['manage:publications'])).subscribe((result) => {
      expect(result).toBe(deniedTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
      done();
    });
  });

  it('redirects to /access-denied when the token cannot be fetched', (done) => {
    auth.getAccessTokenSilently.mockReturnValue(throwError(() => new Error('login_required')));

    guard.canActivate(route(['manage:publications'])).subscribe((result) => {
      expect(result).toBe(deniedTree);
      done();
    });
  });
});
