import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthCustomService } from './auth-custom.service';
import { AuthUserService } from './auth-user.service';
import { CompleteProfileGuard } from './complete-profile.guard';
import { LoggedInCallbackComponent } from './logged-in-callback.component';

@NgModule({
  imports: [HttpClientModule],
  declarations: [LoggedInCallbackComponent],
  exports: [LoggedInCallbackComponent]
})
export class AuthenticationModule {
  static forRoot(): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [CompleteProfileGuard, AuthUserService, AuthCustomService]
    };
  }
}
