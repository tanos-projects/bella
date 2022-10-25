import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginSignupComponent } from './login-signup.component';
import { LoginSignupLinkModule } from '../login-signup-link/login-signup-link.module';

@NgModule({
  declarations: [LoginSignupComponent],
  imports: [CommonModule, LoginSignupLinkModule],
  exports: [LoginSignupComponent]
})
export class LoginSignupModule {}
