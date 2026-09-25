import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AdDetailModule } from '../ad-detail/ad-detail.module';
import { SettingsModule } from '../settings/settings.module';
import { MainRoutingModule } from './main-routing.module';
import { MainComponent } from './main.component';
import { SearchResultsComponent } from '../search-results/search-results.component';

@NgModule({
  declarations: [MainComponent],

  imports: [
    CommonModule,
    AdDetailModule,
    MainRoutingModule,
    HeaderComponent,
    FooterComponent,
    SettingsModule,
    SearchResultsComponent
  ]
})
export class MainModule {}
