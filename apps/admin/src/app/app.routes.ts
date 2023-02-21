import { Route } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/dashboard/dashboard.module').then(
        (m) => m.DashboardModule
      ),
    // canActivate: [AuthGuard],
  },
  {
    path: 'publications',
    loadChildren: () =>
      import('./pages/publications/publications.module').then(
        (m) => m.PublicationsModule
      ),
      // canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
