import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsPreviewerComponent } from './ads-previewer.component';
import { AdCardModule } from '../ad-card/ad-card.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AdsPreviewerComponent],
  exports: [AdsPreviewerComponent],
  imports: [CommonModule, AdCardModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdsPreviewerModule {}
