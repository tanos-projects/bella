import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultsComponent } from './search-results.component';
import { AdCardModule } from '../../shared/components/ad-card/ad-card.module';

@NgModule({
  declarations: [SearchResultsComponent],
  imports: [CommonModule, AdCardModule]
})
export class SearchResultsModule {}
