import { registerLocaleData } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './auth/authentication.module';
import { ProfileModule } from './pages/user/profile/profile.module';
import { WelcomeModule } from './pages/welcome/welcome.module';
import { DrawerModule } from './shared/components/drawer/drawer.module';
import { LoadingModule } from './shared/components/loading/loading.module';
import { SidebarModule } from './shared/components/sidebar/sidebar.module';
import { VALIDATION_MESSAGE_FORMATTERS } from './shared/form/validation-messages';

registerLocaleData(localeFr);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,

    // NgxModule
    CollapseModule,
    ModalModule,
    TabsModule,
    ProgressbarModule,

    DrawerModule.forRoot(),

    //
    AuthModule.forRoot({
      ...environment.authConfig,
      httpInterceptor: {
        allowedList: [
          {
            uri: `${environment.apiBaseUrl}/users/check`,
            httpMethod: 'GET'
          },
          {
            uri: `${environment.apiBaseUrl}/users/profile`,
            httpMethod: 'GET'
          },
          {
            uri: `${environment.apiBaseUrl}/users/profile`,
            httpMethod: 'POST'
          },
          {
            uri: `${environment.apiBaseUrl}/users/profile`,
            httpMethod: 'PATCH'
          },
          {
            uri: `${environment.apiBaseUrl}/users/profile`,
            httpMethod: 'DELETE'
          },
          {
            uri: `${environment.apiBaseUrl}/publications`,
            httpMethod: 'POST'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/my-publications/published`,
            httpMethod: 'GET'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/my-publications/submitted`,
            httpMethod: 'GET'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/my-publications/draft`,
            httpMethod: 'GET'
          },
          {
            uri: `${environment.apiBaseUrl}/publications/my-publications/expired`,
            httpMethod: 'GET'
          },
          {
            // Matched by uriMatcher rather than uri: the ad id in the path
            // makes the URL different on every call.
            uriMatcher: (uri: string) =>
              uri.startsWith(`${environment.apiBaseUrl}/publications/`) &&
              uri.endsWith('/renew'),
            httpMethod: 'POST'
          },
          {
            uri: `${environment.apiBaseUrl}/publications`,
            httpMethod: 'PATCH'
          },
          {
            uri: `${environment.apiBaseUrl}/publications`,
            httpMethod: 'PUT'
          }
        ]
      }
    }),
    AuthenticationModule.forRoot(),
    LoadingModule.forRoot(),

    //
    SidebarModule,
    WelcomeModule.forRoot(),
    ProfileModule.forRoot(),

    // Shared third party modules
    NgSelectModule, // For entry components (such as Modal)
    ReactiveFormsModule,

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormlyModule.forRoot({
      validationMessages: Object.entries(VALIDATION_MESSAGE_FORMATTERS).map(([name, format]) => ({
        name,
        message: (error: any, field: FormlyFieldConfig) => format(error, field.props?.label)
      }))
    }),
    FormlyBootstrapModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fr' },
    provideTranslateService(),
    provideTranslateHttpLoader()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
