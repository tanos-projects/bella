import { Injectable, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthCustomService {
  private auth = inject(AuthService);

  isAuthenticated$ = this.auth.isAuthenticated$;
  isLoading$ = this.auth.isLoading$;
  user$ = this.auth.user$;

  login(): void {
    this.auth.loginWithRedirect();
  }

  signup(): void {
    this.auth.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  }

  logout(): void {
    this.auth.logout({ logoutParams: { returnTo: environment.authConfig.logoutUrl } });
  }
}
