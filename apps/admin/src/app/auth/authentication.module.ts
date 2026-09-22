import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthModule } from '@auth0/auth0-angular';
import { environment } from '../../environments/environment';
import { AuthCustomService } from './auth-custom.service';
import { AuthUserService } from './auth-user.service';

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
            uri: `${environment.apiBaseUrl}/publications/unpublished/*/approve`,
            httpMethod: 'PATCH'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/*/reject`,
            httpMethod: 'PATCH'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/*/archive`,
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
      providers: [AuthUserService, AuthCustomService],
    };
  }
}
