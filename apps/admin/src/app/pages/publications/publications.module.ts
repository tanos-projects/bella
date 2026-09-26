import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { PublicationsComponent } from './publications.component';

const routes: Route[] = [
  {
    path: '',
    component: PublicationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class PublicationsModule {}
