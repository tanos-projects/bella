import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SearchFilterComponent } from './search-filter.component';

@NgModule({
  declarations: [SearchFilterComponent],
  imports: [CommonModule, NgSelectModule, ReactiveFormsModule, ModalModule, RouterModule]
})
export class SearchFilterModule {}
