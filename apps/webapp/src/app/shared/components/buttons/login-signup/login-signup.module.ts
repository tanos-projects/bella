import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginSignupComponent } from './login-signup.component';
import { LoginSignupLinkComponent } from '../login-signup-link/login-signup-link.component';

@NgModule({
  declarations: [LoginSignupComponent],
  imports: [CommonModule, LoginSignupLinkComponent],
  exports: [LoginSignupComponent]
})
export class LoginSignupModule {}
