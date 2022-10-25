import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperModule } from 'swiper/angular';
import { AdsPreviewerComponent } from './ads-previewer.component';
import { AdCardModule } from '../ad-card/ad-card.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AdsPreviewerComponent],
  exports: [AdsPreviewerComponent],
  imports: [CommonModule, SwiperModule, AdCardModule, RouterModule]
})
export class AdsPreviewerModule {}
