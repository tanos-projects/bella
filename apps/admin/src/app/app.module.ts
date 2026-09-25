import { LayoutModule } from '@angular/cdk/layout';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { AuthenticationModule } from './auth/authentication.module';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { StoreModule } from './store/store.module';

registerLocaleData(localeFr);
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AuthenticationModule.forRoot(),
    StoreModule,
    // Routing
    RouterModule.forRoot(appRoutes, {
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
      onSameUrlNavigation: 'reload',
      // enableTracing: true,
      preloadingStrategy: PreloadAllModules,
    }),
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    NavbarComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
