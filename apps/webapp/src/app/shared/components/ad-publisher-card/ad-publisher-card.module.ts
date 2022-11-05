import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdPublisherCardComponent } from './ad-publisher-card.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AdPublisherCardComponent],
  exports: [AdPublisherCardComponent],
  imports: [CommonModule, RouterModule],
})
export class AdPublisherCardModule {}
