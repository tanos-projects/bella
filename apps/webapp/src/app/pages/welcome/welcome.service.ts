import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthCustomService } from '../../auth/auth-custom.service';
import { UserSettingsService } from '../../shared/services/user-settings.service';

@Injectable()
export class WelcomeService {
  private router = inject(Router);
  private auth = inject(AuthCustomService);
  private userSettings = inject(UserSettingsService);

  validate(options?: { redirect?: boolean; country: string }): void {
    if (options) {
      this.userSettings.setCountry(options.country);
      if (options.redirect) {
        this.router.navigate(['/']);
      }
    }
  }

  isAlreadyKnownOrAuthenticatedUser(): Observable<boolean> {
    return this.auth.isLoading$.pipe(
      switchMap(() => this.auth.isAuthenticated$),
      map((isAuthenticated) => {
        return isAuthenticated || this.userSettings.hasCountrySet();
      })
    );
  }

  reset(): void {
    this.userSettings.reset();
    this.router.navigate(['/']);
  }
}
