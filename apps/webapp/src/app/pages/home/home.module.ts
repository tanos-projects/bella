import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdsPreviewerModule } from '../../shared/components/ads-previewer/ads-previewer.module';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, RouterModule, AdsPreviewerModule],
  providers: [HomeService]
})
export class HomeModule {}
