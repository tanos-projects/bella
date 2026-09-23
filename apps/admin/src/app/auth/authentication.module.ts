import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthModule } from '@auth0/auth0-angular';
import { environment } from '../../environments/environment';
import { AuthCustomService } from './auth-custom.service';
import { AuthUserService } from './auth-user.service';
import { PermissionsGuard } from './permissions.guard';

@NgModule({
  imports: [
    HttpClientModule,
    AuthModule.forRoot({
      ...environment.authConfig,
      httpInterceptor: {
        allowedList: [
          {
            uri: `${environment.apiBaseUrl}/publications/unpublished`,
            httpMethod: 'GET'
          },
          {
            // auth0-angular's matcher only supports a trailing "*" (plain
            // prefix match) - a mid-string "*" (as approve/reject/archive's
            // ids would need) never matches, so the token never gets
            // attached and every one of these calls 401s. This single
            // prefix entry covers all three (they're all PATCH, all under
            // .../publications/...).
            uri: `${environment.apiBaseUrl}/publications/*`,
            httpMethod: 'PATCH'
          }
        ]
      }
    }),
  ],
  declarations: [],
  exports: [AuthModule],
})
export class AuthenticationModule {
  static forRoot(): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [AuthUserService, AuthCustomService, PermissionsGuard],
    };
  }
}
