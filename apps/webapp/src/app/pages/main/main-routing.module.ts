import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdsByCategoryComponent } from '../ads-by-category/ads-by-category.component';
import { HomeComponent } from '../home/home.component';
import { MainComponent } from './main.component';
import { SearchResultsComponent } from '../search-results/search-results.component';
// import { AdDetailComponent } from '../ad-detail/ad-detail.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'recherche',
        component: SearchResultsComponent
      },
      {
        path: ':category',
        component: AdsByCategoryComponent
      }
      // {
      //   path: ':category/:title/:id',
      //   component: AdDetailComponent
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule {}
