import { Injectable, inject } from '@angular/core';
import { CanActivate, CanLoad, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, filter, map } from 'rxjs/operators';
import { AuthUserService } from '../../auth/auth-user.service';
import { UserSettingsService } from '../../shared/services/user-settings.service';
import { WelcomeService } from './welcome.service';

@Injectable()
export class WelcomeGuard implements CanLoad, CanActivate {
  private welcomeService = inject(WelcomeService);
  private router = inject(Router);
  private userSettingsService = inject(UserSettingsService);
  private authService = inject(AuthUserService);

  canLoad(): Observable<boolean | UrlTree> {
    return this.isAlreadyKnownOrAuthenticatedUser();
  }

  canActivate(): Observable<boolean | UrlTree> {
    return this.isAlreadyKnownOrAuthenticatedUser();
  }

  private isAlreadyKnownOrAuthenticatedUser(): Observable<boolean | UrlTree> {
    return this.welcomeService.isAlreadyKnownOrAuthenticatedUser().pipe(
      concatMap((canSkipWelcome) => {
        if (canSkipWelcome) {
          return this.userSettingsService.profile$.pipe(
            concatMap((profile) => {
              if (profile) return of(profile);
              return this.authService.getProfile().pipe(
                catchError(() => of(null)),
                map((profile) => {
                  if (profile) {
                    this.userSettingsService.setProfile(profile);
                    if (profile && !this.userSettingsService.hasCountrySet()) {
                      this.userSettingsService.setCountry(profile.country as string);
                    }
                  }
                  return true;
                })
              );
            })
          );
        }
        return of(false);
      }),
      map((canSkipWelcome) => {
        if (canSkipWelcome) {
          return true;
        }
        return this.router.createUrlTree(['/welcome']);
      })
    );
  }
}
