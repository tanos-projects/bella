import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Route, RouterModule } from '@angular/router';

import { PublicationsListModule } from './components/list/publications-list.module';
import { PublicationsComponent } from './publications.component';

const routes: Route[] = [
  {
    path: '',
    component: PublicationsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTabsModule,
    MatSnackBarModule,
    PublicationsListModule,
  ],
  exports: [],
  declarations: [PublicationsComponent],
  providers: [],
})
export class PublicationsModule {}
