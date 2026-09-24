import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthCustomService } from './auth-custom.service';
import { AuthUserService } from './auth-user.service';
import { CompleteProfileGuard } from './complete-profile.guard';

@NgModule({
  imports: [HttpClientModule]
})
export class AuthenticationModule {
  static forRoot(): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [CompleteProfileGuard, AuthUserService, AuthCustomService]
    };
  }
}
