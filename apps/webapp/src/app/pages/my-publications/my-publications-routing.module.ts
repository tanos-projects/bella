import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyPublicationsComponent } from './my-publications.component';

const routes: Routes = [
  {
    path: '',
    component: MyPublicationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyPublicationsRoutingModule {}
