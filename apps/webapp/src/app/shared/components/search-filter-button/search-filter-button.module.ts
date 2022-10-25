import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SearchFilterModule } from '../search-filter/search-filter.module';

import { SearchFilterButtonComponent } from './search-filter-button.component';

@NgModule({
  declarations: [SearchFilterButtonComponent],
  exports: [SearchFilterButtonComponent],
  imports: [CommonModule, FormsModule, NgSelectModule, ModalModule, SearchFilterModule]
})
export class SearchFilterButtonModule {}
