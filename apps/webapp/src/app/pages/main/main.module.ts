import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SettingsModule } from '../settings/settings.module';
import { MainRoutingModule } from './main-routing.module';
import { SearchResultsComponent } from '../search-results/search-results.component';

@NgModule({
  imports: [
    CommonModule,
    MainRoutingModule,
    SettingsModule,
    SearchResultsComponent
  ]
})
export class MainModule {}
