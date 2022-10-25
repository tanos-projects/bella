import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthCustomService } from '../../auth/auth-custom.service';
import { UserSettingsService } from '../../shared/services/user-settings.service';

@Injectable()
export class WelcomeService {
  constructor(private router: Router, private auth: AuthCustomService, private userSettings: UserSettingsService) {}

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
