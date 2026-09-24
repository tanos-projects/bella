import { Component } from '@angular/core';

import { LoginSignupLinkComponent } from '../login-signup-link/login-signup-link.component';

@Component({
  selector: 'bella-auth-login-signup',
  templateUrl: './login-signup.component.html',
  standalone: true,
})
export class LoginSignupComponent extends LoginSignupLinkComponent {}
