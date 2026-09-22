import { Route } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { PermissionsGuard } from './auth/permissions.guard';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/dashboard/dashboard.module').then(
        (m) => m.DashboardModule
      ),
    canActivate: [AuthGuard, PermissionsGuard],
    data: { permissions: ['manage:publications'] },
  },
  {
    path: 'publications',
    loadChildren: () =>
      import('./pages/publications/publications.module').then(
        (m) => m.PublicationsModule
      ),
    canActivate: [AuthGuard, PermissionsGuard],
    data: { permissions: ['manage:publications'] },
  },
  {
    path: 'access-denied',
    loadChildren: () =>
      import('./pages/access-denied/access-denied.module').then(
        (m) => m.AccessDeniedModule
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
