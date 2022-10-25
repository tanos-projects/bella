import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FooterModule } from '../../shared/components/footer/footer.module';
import { HeaderModule } from '../../shared/components/header/header.module';
import { AdsByCategoryModule } from '../ads-by-category/ads-by-category.module';
import { AdDetailModule } from '../ad-detail/ad-detail.module';
import { HomeModule } from '../home/home.module';
import { SettingsModule } from '../settings/settings.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { SearchResultsModule } from '../search-results/search-results.module';

@NgModule({
  declarations: [MainComponent],

  imports: [
    CommonModule,
    HomeModule,
    AdsByCategoryModule,
    AdDetailModule,
    MainRoutingModule,
    HeaderModule,
    FooterModule,
    SettingsModule,
    SearchResultsModule
  ]
})
export class MainModule {}
