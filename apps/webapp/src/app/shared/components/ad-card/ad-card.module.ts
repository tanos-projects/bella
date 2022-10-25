import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdCardComponent } from './ad-card.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AdCardComponent],
  exports: [AdCardComponent],
  imports: [CommonModule, RouterModule]
})
export class AdCardModule {}
