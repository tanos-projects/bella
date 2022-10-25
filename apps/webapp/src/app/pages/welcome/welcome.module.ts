import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome.component';
import { WelcomeService } from './welcome.service';
import { WelcomeGuard } from './welcome.guard';
import { LoginSignupLinkModule } from '../../shared/components/buttons/login-signup-link/login-signup-link.module';
import { AuthenticationModule } from '../../auth/authentication.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [WelcomeComponent],
  exports: [WelcomeComponent],
  imports: [CommonModule, RouterModule, LoginSignupLinkModule, AuthenticationModule]
})
export class WelcomeModule {
  static forRoot(): ModuleWithProviders<WelcomeModule> {
    return {
      ngModule: WelcomeModule,
      providers: [WelcomeService, WelcomeGuard]
    };
  }
}
