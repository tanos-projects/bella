import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
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
            // Trailing-wildcard prefix match (auth0-angular only supports
            // a trailing "*", not mid-string) - covers /unpublished and
            // /published (and their query strings, stripped before
            // matching) under one entry instead of one per list endpoint.
            uri: `${environment.apiBaseUrl}/publications/*`,
            httpMethod: 'GET'
          },
          {
            // Same wildcard, for the PATCH mutations (approve/reject/archive) -
            // a mid-string "*" (as their :id would need) never matches, so
            // this single prefix entry covers all three instead.
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
      providers: [
        AuthUserService,
        AuthCustomService,
        PermissionsGuard,
        // @auth0/auth0-angular v2 stopped auto-registering this via
        // AuthModule.forRoot() (v1, compatible with Angular 14, did) -
        // without it, HTTP_INTERCEPTORS is empty and no request ever
        // gets a token attached, regardless of the allowedList config.
        { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
      ],
    };
  }
}
