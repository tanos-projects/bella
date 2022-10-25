import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostAnAdComponent } from './post-an-ad.component';

const routes: Routes = [
  {
    path: '',
    component: PostAnAdComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostAnAdRoutingModule {}
