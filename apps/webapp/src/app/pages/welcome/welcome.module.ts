import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome.component';
import { WelcomeService } from './welcome.service';
import { WelcomeGuard } from './welcome.guard';
import { LoginSignupLinkComponent } from '../../shared/components/buttons/login-signup-link/login-signup-link.component';
import { AuthenticationModule } from '../../auth/authentication.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [WelcomeComponent],
  exports: [WelcomeComponent],
  imports: [CommonModule, RouterModule, LoginSignupLinkComponent, AuthenticationModule]
})
export class WelcomeModule {
  static forRoot(): ModuleWithProviders<WelcomeModule> {
    return {
      ngModule: WelcomeModule,
      providers: [WelcomeService, WelcomeGuard]
    };
  }
}
