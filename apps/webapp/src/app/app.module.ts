import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './auth/authentication.module';
import { WelcomeModule } from './pages/welcome/welcome.module';
import { DrawerModule } from './shared/components/drawer/drawer.module';
import { LoadingModule } from './shared/components/loading/loading.module';
import { SidebarModule } from './shared/components/sidebar/sidebar.module';
import { FormValidationModule } from './shared/form/form-validation.module';

import localeFr from '@angular/common/locales/fr';
import { registerLocaleData } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ProfileModule } from './pages/user/profile/profile.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';

registerLocaleData(localeFr);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,

    // NgxModule
    CollapseModule.forRoot(),
    ModalModule.forRoot(),
    TabsModule.forRoot(),
    ProgressbarModule.forRoot(),

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
            uri: `${environment.apiBaseUrl}/ads`,
            httpMethod: 'POST'
          },
          {
            uri: `${environment.apiBaseUrl}/ads`,
            httpMethod: 'PATCH'
          },
          {
            uri: `${environment.apiBaseUrl}/ads`,
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
    // FormValidationModule.forRoot(),
    ReactiveFormsModule,

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpTranslateLoader,
        deps: [HttpClient]
      }
    }),
    FormlyModule.forRoot(),
    FormlyBootstrapModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fr' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

export function HttpTranslateLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
