import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { AccessDeniedComponent } from './access-denied.component';

const routes: Route[] = [
  {
    path: '',
    component: AccessDeniedComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class AccessDeniedModule {}
