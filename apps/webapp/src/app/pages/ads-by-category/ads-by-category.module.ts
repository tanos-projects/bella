import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsByCategoryComponent } from './ads-by-category.component';
import { AdCardModule } from '../../shared/components/ad-card/ad-card.module';

@NgModule({
  declarations: [AdsByCategoryComponent],
  imports: [CommonModule, AdCardModule]
})
export class AdsByCategoryModule {}
