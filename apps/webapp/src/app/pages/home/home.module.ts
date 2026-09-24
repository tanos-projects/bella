import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdsPreviewerComponent } from '../../shared/components/ads-previewer/ads-previewer.component';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, RouterModule, AdsPreviewerComponent],
  providers: [HomeService]
})
export class HomeModule {}
