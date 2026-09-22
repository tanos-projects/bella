import { Component, inject } from '@angular/core';

import { AuthCustomService } from '../../../../auth/auth-custom.service';

@Component({
  selector: 'bella-auth-login-signup-link',
  templateUrl: './login-signup-link.component.html',
  standalone: false,
})
export class LoginSignupLinkComponent {
  protected auth = inject(AuthCustomService);

  login(event: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.auth.login();
  }

  signup(event: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.auth.signup();
  }
}
