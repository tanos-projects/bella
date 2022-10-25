import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectFormFieldComponent } from './ng-select-form-field.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    NgSelectFormFieldComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
  ]
})
export class NgSelectFormFieldModule { }
