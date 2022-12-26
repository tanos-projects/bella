import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';

import { CompleteProfileGuard } from './auth/complete-profile.guard';
import { LoggedInCallbackComponent } from './auth/logged-in-callback.component';
import { ProfileComponent } from './pages/user/profile/profile.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { WelcomeGuard } from './pages/welcome/welcome.guard';
import { AdDetailComponent } from './pages/ad-detail/ad-detail.component';

const routes: Routes = [
  {
    path: 'annonces/:category/:title/:id',
    component: AdDetailComponent
  },
  {
    path: 'annonces',
    loadChildren: () => import('./pages/main/main.module').then((m) => m.MainModule),
    canActivate: [WelcomeGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./pages/account/account.module').then((m) => m.AccountModule),
    canLoad: [WelcomeGuard],
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then((m) => m.SettingsModule),
    canLoad: [WelcomeGuard]
  },
  {
    path: 'bookmarks',
    loadChildren: () => import('./pages/bookmarks/bookmarks.module').then((m) => m.BookmarksModule),
    canLoad: [WelcomeGuard],
    canActivate: [AuthGuard, CompleteProfileGuard]
  },
  {
    path: 'post-an-ad',
    loadChildren: () => import('./pages/post-an-ad/post-an-ad.module').then((m) => m.PostAnAdModule),
    canLoad: [WelcomeGuard],
    canActivate: [AuthGuard, CompleteProfileGuard]
  },
  {
    path: 'my-publications',
    loadChildren: () => import('./pages/my-publications/my-publications.module').then((m) => m.MyPublicationsModule),
    canLoad: [WelcomeGuard],
    canActivate: [AuthGuard, CompleteProfileGuard]
  },
  {
    path: 'profil/:id/:username',
    component: ProfileComponent,
    canLoad: [WelcomeGuard]
  },
  {
    path: 'welcome',
    component: WelcomeComponent
  },
  {
    path: 'loggedIn',
    component: LoggedInCallbackComponent
  },
  {
    path: '**',
    redirectTo: '/annonces'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
