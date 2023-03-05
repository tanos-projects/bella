import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { environment } from '../../environments/environment';
import { AuthCustomService } from './auth-custom.service';
import { AuthUserService } from './auth-user.service';

@NgModule({
  imports: [
    HttpClientModule,
    AuthModule.forRoot({
      ...environment.authConfig,
      httpInterceptor: {
        allowedList: [],
      },
    }),
  ],
  declarations: [],
  exports: [AuthModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true }
  ],
})
export class AuthenticationModule {
  static forRoot(): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [AuthUserService, AuthCustomService],
    };
  }
}
