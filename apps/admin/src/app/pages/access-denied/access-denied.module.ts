import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Route, RouterModule } from '@angular/router';

import { AccessDeniedComponent } from './access-denied.component';

const routes: Route[] = [
  {
    path: '',
    component: AccessDeniedComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), MatButtonModule],
  declarations: [AccessDeniedComponent],
})
export class AccessDeniedModule {}
