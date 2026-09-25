import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Route, RouterModule } from '@angular/router';

import { PublicationsListComponent } from './components/list/publications-list.component';
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
    PublicationsListComponent,
  ],
  exports: [],
  declarations: [PublicationsComponent],
  providers: [],
})
export class PublicationsModule {}
