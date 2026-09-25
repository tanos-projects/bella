import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormComponent } from '../../../shared/form/form.component';
import { AdFormComponent } from './ad-form.component';

@NgModule({
  declarations: [AdFormComponent],
  exports: [AdFormComponent],
  imports: [CommonModule, FormComponent]
})
export class AdFormModule {}
