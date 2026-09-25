import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AdDetailModule } from '../ad-detail/ad-detail.module';
import { SettingsModule } from '../settings/settings.module';
import { MainRoutingModule } from './main-routing.module';
import { SearchResultsComponent } from '../search-results/search-results.component';

@NgModule({
  imports: [
    CommonModule,
    AdDetailModule,
    MainRoutingModule,
    SettingsModule,
    SearchResultsComponent
  ]
})
export class MainModule {}
