import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsByCategoryComponent } from './ads-by-category.component';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';

@NgModule({
  declarations: [AdsByCategoryComponent],
  imports: [CommonModule, AdCardComponent]
})
export class AdsByCategoryModule {}
